// ============================================
// EDGE FUNCTION - Send Stock Alert Email
// Supabase Edge Function utilisant Resend
// Envoie un email avec TOUS les articles en alerte stock
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RECIPIENT_EMAILS = [
  'florian.jove.garcia@gmail.com',
  'Robert.LAMANDE-ext@ca-alsace-vosges.fr',
  'Olivier.KLOTZ-ext@ca-alsace-vosges.fr',
  'Florian.JOVEGARCIA-ext@ca-alsace-vosges.fr',
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

  const rows = products
    .map((p) => {
      const isZero = p.stockActuel === 0;
      const badgeColor = isZero ? '#DC2626' : '#F59E0B';
      const badgeText = isZero ? 'Rupture' : 'Stock bas';
      return `
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 12px 16px; font-weight: 600; color: #111827;">${p.nom}</td>
          <td style="padding: 12px 16px; color: #6B7280; font-family: monospace;">${p.reference ?? '—'}</td>
          <td style="padding: 12px 16px; text-align: center;">
            <span style="color: ${badgeColor}; font-weight: 700; font-size: 16px;">${p.stockActuel}</span>
          </td>
          <td style="padding: 12px 16px; text-align: center; color: #6B7280;">${p.stockMini}</td>
          <td style="padding: 12px 16px; text-align: center;">
            <span style="background: ${badgeColor}15; color: ${badgeColor}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${badgeText}</span>
          </td>
        </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); border-radius: 16px 16px 0 0; padding: 32px 24px; text-align: center;">
      <h1 style="color: #FFFFFF; font-size: 22px; margin: 0 0 4px 0;">IT-Inventory – Alerte stock</h1>
      <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">${date}</p>
      ${siteNom ? `<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 600;">Site : ${siteNom}</p>` : ''}
    </div>
    <div style="background: #FFFFFF; padding: 20px 24px;">
      <p style="color: #374151; font-size: 14px;">Les articles suivants sont en dessous du stock minimum et doivent être commandés.</p>
    </div>
    <div style="background: #FFFFFF; border-radius: 0 0 16px 16px; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #F9FAFB; border-bottom: 2px solid #E5E7EB;">
            <th style="padding: 10px 16px; text-align: left; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Article</th>
            <th style="padding: 10px 16px; text-align: left; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Réf.</th>
            <th style="padding: 10px 16px; text-align: center; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Stock</th>
            <th style="padding: 10px 16px; text-align: center; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Mini</th>
            <th style="padding: 10px 16px; text-align: center; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Statut</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="padding: 20px 24px; text-align: center; border-top: 1px solid #F3F4F6;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">Cet email a été envoyé automatiquement par IT-Inventory.</p>
      </div>
    </div>
  </div>
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
    const { subject, htmlContent, products, siteNom } = body;

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

    // Envoi via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'IT-Inventory <noreply@it-inventory.fr>',
        to: RECIPIENT_EMAILS,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.json();
      console.error('Resend error:', err);
      return new Response(
        JSON.stringify({ error: 'Échec envoi email', details: err }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = await resendRes.json();
    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
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
