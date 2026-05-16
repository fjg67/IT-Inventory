// ============================================
// EDGE FUNCTION - Send Stock Alert Email
// Supabase Edge Function utilisant Resend
// Envoie un email avec TOUS les articles en alerte stock
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const MOBILE_APP_DEEP_LINK = 'itinventory://open';
const MOBILE_APP_FALLBACK_URL = 'https://play.google.com/store/apps/details?id=com.itinventory';
const RECIPIENT_EMAILS = [
  'florian.jove.garcia@gmail.com',
  'Robert.LAMANDE-ext@ca-alsace-vosges.fr',
  'Olivier.KLOTZ-ext@ca-alsace-vosges.fr',
  'Florian.JOVEGARCIA-ext@ca-alsace-vosges.fr',
  'ilias.bey-ext@ca-alsace-vosges.fr',
  'guillaume.oudinot@ca-alsace-vosges.fr',
  'thibaud.hebrard-ext@ca-alsace-vosges.fr',
];

interface ProductAlert {
  reference?: string;
  nom: string;
  stockActuel: number;
  stockMini: number;
}

interface RequestBody {
  // Nouveau format : HTML pré-construit côté app
  subject?: string;
  htmlContent?: string;
  // Destinataire(s) personnalisé(s) (optionnel, sinon RECIPIENT_EMAILS)
  to?: string | string[];
  // Ancien format : données brutes
  products?: ProductAlert[];
  siteNom?: string;
  totalAlerts?: number;
}

/**
 * Génère le HTML de l'email à partir des données brutes (rétro-compatibilité).
 */
function buildHtmlFromProducts(products: ProductAlert[], siteNom?: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const ruptureCount = products.filter((p) => p.stockActuel === 0).length;
  const basCount = products.length - ruptureCount;

  const sorted = [...products].sort((a, b) => {
    if (a.stockActuel === 0 && b.stockActuel !== 0) return -1;
    if (b.stockActuel === 0 && a.stockActuel !== 0) return 1;
    const ratioA = a.stockMini > 0 ? a.stockActuel / a.stockMini : 1;
    const ratioB = b.stockMini > 0 ? b.stockActuel / b.stockMini : 1;
    return ratioA - ratioB;
  });

  const rows = sorted
    .map((p, i) => {
      const ratio = p.stockMini > 0 ? Math.min((p.stockActuel / p.stockMini) * 100, 100) : 0;
      const isZero = p.stockActuel === 0;
      const isCritical = !isZero && ratio < 40;
      const rowBg = i % 2 === 0 ? '#FFFFFF' : '#FAFAFA';
      const accentColor = isZero ? '#EF4444' : isCritical ? '#F97316' : '#F59E0B';
      const badgeText = isZero ? 'RUPTURE' : 'STOCK BAS';
      const badgeBg = isZero ? '#FEE2E2' : isCritical ? '#FFEDD5' : '#FEF9C3';
      const badgeTextColor = isZero ? '#991B1B' : isCritical ? '#9A3412' : '#854D0E';
      const barWidth = isZero ? 0 : Math.max(Math.round(ratio), 4);
      const siteLabel = (p as ProductAlert & { site?: string }).site;

      return `<tr style="background:${rowBg};border-left:3px solid ${accentColor};">
        <td style="padding:14px 12px 14px 16px;">
          <div style="font-weight:700;color:#0F172A;font-size:14px;line-height:1.3;">${p.nom}</div>
          ${siteLabel ? `<div style="color:#94A3B8;font-size:11px;margin-top:2px;">🏢 ${siteLabel}</div>` : ''}
          ${(p as ProductAlert & { emplacement?: string }).emplacement ? `<div style="color:#94A3B8;font-size:11px;margin-top:1px;">📍 ${(p as ProductAlert & { emplacement?: string }).emplacement}</div>` : ''}
        </td>
        <td style="padding:14px 8px;color:#64748B;font-size:12px;font-family:'Courier New',monospace;white-space:nowrap;">${p.reference ?? '—'}</td>
        <td style="padding:14px 8px;text-align:center;min-width:80px;">
          <div style="font-size:20px;font-weight:800;color:${accentColor};line-height:1;">${p.stockActuel}</div>
          <div style="margin-top:5px;background:#E2E8F0;border-radius:3px;height:4px;width:60px;margin-left:auto;margin-right:auto;">
            <div style="background:${accentColor};height:4px;border-radius:3px;width:${barWidth}%;max-width:100%;"></div>
          </div>
          <div style="color:#94A3B8;font-size:10px;margin-top:3px;">/ ${p.stockMini}</div>
        </td>
        <td style="padding:14px 12px 14px 8px;text-align:right;">
          <span style="display:inline-block;background:${badgeBg};color:${badgeTextColor};padding:3px 9px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:0.5px;">${badgeText}</span>
        </td>
      </tr>`;
    })
    .join('');

  const urgencyMsg = ruptureCount > 0
    ? `<strong>${ruptureCount} article${ruptureCount > 1 ? 's' : ''}</strong> en rupture totale — réapprovisionnement urgent requis.`
    : `<strong>${products.length} article${products.length > 1 ? 's' : ''}</strong> sous le seuil minimum — surveillance recommandée.`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerte Stock IT-Inventory</title>
</head>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0F172A;min-height:100vh;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <!-- URGENCY BAR -->
      <tr>
        <td style="background:#EF4444;border-radius:12px 12px 0 0;padding:10px 24px;text-align:center;">
          <span style="color:#FFFFFF;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">⚡ ACTION REQUISE — ALERTE STOCK ACTIVE</span>
        </td>
      </tr>

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(160deg,#1E293B 0%,#0F172A 60%,#1a0505 100%);padding:36px 32px 32px;text-align:center;border-left:1px solid #1E293B;border-right:1px solid #1E293B;">
          <div style="display:inline-block;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;margin-bottom:16px;">📦</div>
          <h1 style="color:#F8FAFC;font-size:28px;font-weight:800;margin:0 0 6px 0;letter-spacing:-0.5px;font-family:Georgia,'Times New Roman',serif;">Alerte Stock Critique</h1>
          <p style="color:#94A3B8;font-size:13px;margin:0;letter-spacing:0.5px;">IT-Inventory &nbsp;·&nbsp; ${date}</p>
          ${siteNom ? `<div style="margin-top:14px;"><span style="display:inline-block;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);padding:6px 18px;border-radius:20px;color:#CBD5E1;font-size:13px;font-weight:600;">📍 ${siteNom}</span></div>` : ''}
        </td>
      </tr>

      <!-- ALERT BANNER -->
      <tr>
        <td style="background:#FFFFFF;padding:0;">
          <div style="background:linear-gradient(90deg,#FEF2F2,#FFF7ED);border-left:4px solid #EF4444;margin:0;padding:14px 24px;">
            <span style="color:#7F1D1D;font-size:14px;line-height:1.5;">⚠️&nbsp; ${urgencyMsg}</span>
          </div>
        </td>
      </tr>

      <!-- STATS CARDS -->
      <tr>
        <td style="background:#FFFFFF;padding:20px 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="33%" style="padding:0 6px 0 0;">
                <div style="background:#F8FAFC;border-radius:12px;padding:18px 14px;text-align:center;border-top:3px solid #6366F1;">
                  <div style="font-size:36px;font-weight:800;color:#6366F1;line-height:1;font-family:Georgia,serif;">${products.length}</div>
                  <div style="color:#64748B;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:6px;">En alerte</div>
                </div>
              </td>
              <td width="33%" style="padding:0 3px;">
                <div style="background:#FEF2F2;border-radius:12px;padding:18px 14px;text-align:center;border-top:3px solid #EF4444;">
                  <div style="font-size:36px;font-weight:800;color:#EF4444;line-height:1;font-family:Georgia,serif;">${ruptureCount}</div>
                  <div style="color:#991B1B;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:6px;">Rupture totale</div>
                </div>
              </td>
              <td width="33%" style="padding:0 0 0 6px;">
                <div style="background:#FFFBEB;border-radius:12px;padding:18px 14px;text-align:center;border-top:3px solid #F59E0B;">
                  <div style="font-size:36px;font-weight:800;color:#F59E0B;line-height:1;font-family:Georgia,serif;">${basCount}</div>
                  <div style="color:#92400E;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:6px;">Stock bas</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- SECTION TITLE -->
      <tr>
        <td style="background:#FFFFFF;padding:0 24px 0;">
          <div style="border-top:1px solid #E2E8F0;padding-top:20px;padding-bottom:12px;">
            <span style="font-size:13px;font-weight:700;color:#0F172A;letter-spacing:1.5px;text-transform:uppercase;">📋&nbsp; Détail des articles</span>
            <span style="display:inline-block;margin-left:10px;background:#EFF6FF;color:#3B82F6;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">${products.length}</span>
          </div>
        </td>
      </tr>

      <!-- TABLE -->
      <tr>
        <td style="background:#FFFFFF;padding:0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;">
            <thead>
              <tr style="background:#F1F5F9;">
                <th style="padding:10px 12px 10px 16px;text-align:left;color:#64748B;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #E2E8F0;">Article</th>
                <th style="padding:10px 8px;text-align:left;color:#64748B;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #E2E8F0;">Réf.</th>
                <th style="padding:10px 8px;text-align:center;color:#64748B;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #E2E8F0;">Stock / Mini</th>
                <th style="padding:10px 12px 10px 8px;text-align:right;color:#64748B;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #E2E8F0;">Statut</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="background:#FFFFFF;padding:24px 24px 4px;text-align:center;">
          <a href="${MOBILE_APP_DEEP_LINK}" style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#6366F1);color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:10px;letter-spacing:0.3px;">Ouvrir IT-Inventory →</a>
          <p style="color:#94A3B8;font-size:11px;margin:10px 0 0 0;">Si l'app ne s'ouvre pas : <a href="${MOBILE_APP_FALLBACK_URL}" style="color:#6366F1;text-decoration:none;">Play Store</a></p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#FFFFFF;padding:16px 24px 0;">
          <div style="border-top:1px solid #F1F5F9;padding-top:14px;padding-bottom:4px;text-align:center;">
            <p style="color:#94A3B8;font-size:11px;margin:0;line-height:1.6;">Généré automatiquement par <strong style="color:#64748B;">IT-Inventory</strong> &nbsp;·&nbsp; ${date}</p>
          </div>
        </td>
      </tr>

      <!-- BOTTOM BAR -->
      <tr>
        <td style="background:linear-gradient(90deg,#0F172A,#1E1B4B);border-radius:0 0 12px 12px;padding:16px 24px;text-align:center;">
          <span style="color:#475569;font-size:11px;letter-spacing:0.5px;">© 2026 IT-Inventory &nbsp;·&nbsp; Tous droits réservés</span>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { subject, htmlContent, products, siteNom, to } = body;

    // Destinataires : champ 'to' si fourni, sinon liste par défaut
    const recipients: string[] = to
      ? (Array.isArray(to) ? to : [to])
      : RECIPIENT_EMAILS;

    // Utiliser le HTML pré-construit si disponible, sinon fallback sur les données brutes
    let emailHtml: string;
    let emailSubject: string;

    if (htmlContent && subject) {
      // Nouveau format : HTML pré-construit côté app (tous les articles inclus)
      emailHtml = htmlContent;
      emailSubject = subject;
    } else if (products && products.length > 0) {
      // Ancien format : construire le HTML à partir des données brutes
      emailHtml = buildHtmlFromProducts(products, siteNom);
      emailSubject = `IT-Inventory – Alerte stock (${products.length} article${products.length > 1 ? 's' : ''})`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Aucun produit ou contenu fourni' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Envoi via Resend (individuellement pour masquer les destinataires)
    const emailResults = [];
    for (const recipient of recipients) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'IT-Inventory <noreply@it-inventory.fr>',
          to: [recipient],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.json();
        console.error(`Resend error for ${recipient}:`, err);
        emailResults.push({ recipient, success: false, error: err });
      } else {
        const res = await resendRes.json();
        emailResults.push({ recipient, success: true, emailId: res.id });
      }
    }

    const allFailed = emailResults.every((r) => !r.success);
    if (allFailed) {
      return new Response(
        JSON.stringify({ error: 'Échec envoi email', details: emailResults }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = emailResults.find((r) => r.success);
    return new Response(
      JSON.stringify({ success: true, emailId: result?.emailId, sent: emailResults.filter((r) => r.success).length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('Edge Function error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
