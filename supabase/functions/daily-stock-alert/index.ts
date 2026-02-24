// ============================================
// EDGE FUNCTION - Daily Stock Alert (Cron 6h)
// Premium Email — Rapport Stock Quotidien
// Requête Supabase, comparaison J-1, envoi Resend
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const RECIPIENT_EMAILS = [
  'florian.jove.garcia@gmail.com',
  'Robert.LAMANDE-ext@ca-alsace-vosges.fr',
  'Olivier.KLOTZ-ext@ca-alsace-vosges.fr',
  'Florian.JOVEGARCIA-ext@ca-alsace-vosges.fr',
];

// KV store key for J-1 comparison
const KV_PREV_KEY = 'daily-stock-alert-previous-count';

// ==================== Types ====================

interface AlertRow {
  article_nom: string;
  article_reference: string;
  article_emplacement: string | null;
  stock_actuel: number;
  stock_mini: number;
  site_nom: string;
}

interface SiteAlerts {
  siteNom: string;
  articles: AlertRow[];
  ruptureCount: number;
  basCount: number;
}

interface Comparison {
  previousTotal: number | null;
  diff: number;
  isNew: boolean;
}

// ==================== Design Constants ====================

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const C = {
  primary:      '#6366F1',
  primaryDark:  '#4F46E5',
  secondary:    '#8B5CF6',
  secondaryLt:  '#A78BFA',
  danger:       '#EF4444',
  dangerDark:   '#DC2626',
  dangerBg:     '#FEF2F2',
  dangerBgAlt:  '#FEE2E2',
  warning:      '#F59E0B',
  warningDark:  '#D97706',
  warningBg:    '#FFFBEB',
  warningBgAlt: '#FEF3C7',
  success:      '#10B981',
  successBg:    '#ECFDF5',
  bg:           '#F8FAFC',
  white:        '#FFFFFF',
  text:         '#1E293B',
  textSec:      '#64748B',
  textMuted:    '#94A3B8',
  border:       '#E2E8F0',
  borderLight:  '#F1F5F9',
};

// ==================== DB Query ====================

async function supabaseQuery(table: string, select: string, filters: string = ''): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filters ? '&' + filters : ''}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase REST error (${table}): ${res.status} ${err}`);
  }
  return await res.json();
}

async function fetchLowStockArticles(): Promise<AlertRow[]> {
  const stockRows = await supabaseQuery(
    'ArticleStock',
    'quantity,articleId,siteId,Article!inner(id,name,reference,emplacement,minStock,isArchived),Site!inner(name)',
    'Article.isArchived=eq.false'
  );

  const alerts: AlertRow[] = [];
  for (const row of stockRows) {
    const article = row.Article as any;
    const site = row.Site as any;
    const qty = row.quantity ?? 0;
    const mini = article?.minStock ?? 0;

    if (qty < mini) {
      alerts.push({
        article_nom: article.name,
        article_reference: article.reference,
        article_emplacement: article.emplacement,
        stock_actuel: qty,
        stock_mini: mini,
        site_nom: site.name,
      });
    }
  }

  // Tri: ruptures (stock=0) en premier, puis par ratio criticité, puis alphabétique
  alerts.sort((a, b) => {
    if (a.stock_actuel === 0 && b.stock_actuel !== 0) return -1;
    if (a.stock_actuel !== 0 && b.stock_actuel === 0) return 1;
    const ratioA = a.stock_mini > 0 ? a.stock_actuel / a.stock_mini : 0;
    const ratioB = b.stock_mini > 0 ? b.stock_actuel / b.stock_mini : 0;
    if (ratioA !== ratioB) return ratioA - ratioB;
    return a.article_nom.localeCompare(b.article_nom, 'fr');
  });

  return alerts;
}

// ==================== J-1 Comparison ====================

async function getPreviousCount(): Promise<number | null> {
  try {
    const rows = await supabaseQuery('app_metadata', 'value', `key=eq.${KV_PREV_KEY}`);
    if (rows.length > 0) return parseInt(rows[0].value, 10);
  } catch { /* table may not exist yet, that's fine */ }
  return null;
}

async function saveTodayCount(count: number): Promise<void> {
  try {
    // Upsert via REST
    const url = `${SUPABASE_URL}/rest/v1/app_metadata`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: KV_PREV_KEY, value: String(count) }),
    });
  } catch (e) {
    console.warn('[daily-stock-alert] Could not save today count:', e);
  }
}

// ==================== HTML Helpers ====================

/** Criticality progress bar (inline, 80px wide) */
function critBar(stock: number, mini: number): string {
  const pct = mini > 0 ? Math.min(Math.round((stock / mini) * 100), 100) : 0;
  const barColor = pct === 0 ? C.danger : pct < 50 ? C.warning : C.success;
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td style="width:80px;height:6px;background:${C.borderLight};border-radius:3px;overflow:hidden;">
          <div style="width:${Math.max(pct, 4)}%;height:6px;background:${barColor};border-radius:3px;"></div>
        </td>
        <td style="padding-left:6px;font-size:11px;color:${C.textMuted};font-family:${FONT};white-space:nowrap;">${pct}%</td>
      </tr>
    </table>`;
}

/** Dynamic alert message based on severity */
function buildAlertMessage(totalAlerts: number, totalRupture: number): string {
  if (totalRupture >= 20) {
    return `&#9888;&#65039; <strong>Situation critique</strong> : ${totalRupture} articles sont en rupture totale et n&eacute;cessitent un r&eacute;approvisionnement urgent.`;
  } else if (totalRupture >= 10) {
    return `&#9888;&#65039; <strong>Attention</strong> : ${totalRupture} articles sont en rupture totale. Un r&eacute;approvisionnement rapide est recommand&eacute;.`;
  } else if (totalRupture > 0) {
    return `&#128270; <strong>${totalAlerts} article${totalAlerts > 1 ? 's' : ''}</strong> n&eacute;cessitent votre attention, dont ${totalRupture} en rupture.`;
  } else {
    return `&#9989; <strong>Situation sous contr&ocirc;le</strong> : seulement ${totalAlerts} article${totalAlerts > 1 ? 's' : ''} en stock bas.`;
  }
}

/** Comparison J-1 badge */
function compBadge(comp: Comparison): string {
  if (comp.isNew || comp.previousTotal === null) return '';
  if (comp.diff === 0) return `<span style="font-size:12px;color:${C.textMuted};font-family:${FONT};">=&nbsp;stable</span>`;
  const up = comp.diff > 0;
  const color = up ? C.danger : C.success;
  const arrow = up ? '&#8593;' : '&#8595;';
  const label = up ? `+${comp.diff} vs hier` : `${comp.diff} vs hier`;
  return `<span style="display:inline-block;margin-top:6px;font-size:11px;font-weight:600;color:${color};background:${up ? C.dangerBg : C.successBg};padding:2px 8px;border-radius:9999px;font-family:${FONT};">${arrow} ${label}</span>`;
}

// ==================== Premium HTML Builder ====================

function buildEmailHtml(alertsBySite: SiteAlerts[], comparison: Comparison): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

  const totalAlerts = alertsBySite.reduce((s, x) => s + x.articles.length, 0);
  const totalRupture = alertsBySite.reduce((s, x) => s + x.ruptureCount, 0);
  const totalBas = alertsBySite.reduce((s, x) => s + x.basCount, 0);

  // ---------- Site sections with table layout ----------
  const siteSections = alertsBySite.map((site) => {
    const articleRows = site.articles.map((a, i) => {
      const isZero = a.stock_actuel === 0;
      const ratio = a.stock_mini > 0 ? (a.stock_actuel / a.stock_mini) * 100 : 0;
      const stockColor = isZero ? C.danger : C.warningDark;
      const badgeBg = isZero ? C.dangerBgAlt : C.warningBgAlt;
      const badgeColor = isZero ? C.dangerDark : C.warningDark;
      const badgeText = isZero ? 'Rupture' : 'Stock bas';
      const rowBg = i % 2 === 0 ? C.white : C.bg;
      return `
              <tr style="background-color:${rowBg};">
                <td style="padding:14px 16px;font-weight:500;color:${C.text};font-size:14px;font-family:${FONT};border-bottom:1px solid ${C.borderLight};">${a.article_nom}</td>
                <td style="padding:14px 12px;color:${C.textSec};font-family:'SF Mono','Cascadia Code','Consolas',monospace;font-size:13px;border-bottom:1px solid ${C.borderLight};">${a.article_reference ?? '&mdash;'}</td>
                <td style="padding:14px 12px;color:${C.textSec};font-size:13px;font-family:${FONT};border-bottom:1px solid ${C.borderLight};">${a.article_emplacement ?? '&mdash;'}</td>
                <td style="padding:14px 12px;text-align:center;border-bottom:1px solid ${C.borderLight};">
                  <span style="font-weight:800;font-size:16px;color:${stockColor};font-family:${FONT};">${a.stock_actuel}</span>
                  <span style="color:${C.textMuted};font-size:12px;font-family:${FONT};">/ ${a.stock_mini}</span>
                  <div style="margin-top:4px;">${critBar(a.stock_actuel, a.stock_mini)}</div>
                </td>
                <td style="padding:14px 12px;text-align:center;border-bottom:1px solid ${C.borderLight};">
                  <span style="display:inline-block;background:${badgeBg};color:${badgeColor};padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:600;font-family:${FONT};white-space:nowrap;">${badgeText}</span>
                </td>
              </tr>`;
    }).join('');

    return `
          <!-- ===== Site: ${site.siteNom} ===== -->
          <tr><td colspan="5" style="padding:0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              <!-- Site header -->
              <tr>
                <td colspan="5" style="padding:20px 24px 12px;background:${C.bg};border-top:1px solid ${C.border};">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="font-size:18px;padding-right:8px;vertical-align:middle;">&#128205;</td>
                    <td style="font-size:16px;font-weight:700;color:${C.text};font-family:${FONT};vertical-align:middle;">${site.siteNom}</td>
                    <td style="padding-left:10px;vertical-align:middle;">
                      <span style="display:inline-block;background:${C.primary}12;color:${C.primary};font-size:12px;font-weight:600;padding:3px 10px;border-radius:9999px;font-family:${FONT};">${site.articles.length} article${site.articles.length > 1 ? 's' : ''}</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Table header -->
              <tr style="background:${C.bg};">
                <td style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:${C.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:2px solid ${C.border};">Article</td>
                <td style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:${C.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:2px solid ${C.border};">R&eacute;f.</td>
                <td style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:${C.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:2px solid ${C.border};">Emplacement</td>
                <td style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:${C.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:2px solid ${C.border};">Stock</td>
                <td style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:${C.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:2px solid ${C.border};">Statut</td>
              </tr>
              ${articleRows}
            </table>
          </td></tr>`;
  }).join('');

  // ---------- Comparison badge HTML ----------
  const compHtml = compBadge(comparison);

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <title>Rapport Stock Quotidien — IT-Inventory</title>
  <style type="text/css">
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0F172A !important; }
      .card-bg { background-color: #1E293B !important; }
      .header-text { color: #F8FAFC !important; }
      .kpi-card { background-color: #1E293B !important; border-color: #334155 !important; }
    }
    @media only screen and (max-width: 480px) {
      .kpi-table { width: 100% !important; }
      .kpi-cell { display: block !important; width: 100% !important; padding-bottom: 8px !important; }
      .site-table { font-size: 13px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:${FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" class="email-bg">

  <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" align="center"><tr><td><![endif]-->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;">

    <!-- Spacer top -->
    <tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- ========== HEADER ========== -->
    <tr><td style="background:${C.primary};background:linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 50%, ${C.secondaryLt} 100%);border-radius:20px 20px 0 0;padding:48px 32px 40px;text-align:center;mso-line-height-rule:exactly;">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="width:640px;height:180px;" arcsize="5%" fill="true" stroke="false"><v:fill color="#6366F1"/><w:anchorlock/><center><![endif]-->
      <div style="font-size:48px;line-height:1;margin-bottom:12px;">&#128202;</div>
      <h1 style="color:#FFFFFF;font-size:28px;font-weight:700;margin:0 0 6px;font-family:${FONT};letter-spacing:-0.5px;">Rapport Stock Quotidien</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0;font-family:${FONT};">${dateStr} &mdash; ${timeStr}</p>
      <!--[if mso]></center></v:roundrect><![endif]-->
    </td></tr>

    <!-- ========== ALERT MESSAGE ========== -->
    <tr><td style="background:${C.white};padding:24px 28px 0;" class="card-bg">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="background:${totalRupture >= 10 ? C.dangerBg : totalRupture > 0 ? '#FFF7ED' : C.successBg};border-radius:12px;padding:16px 20px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:${C.text};font-family:${FONT};">${buildAlertMessage(totalAlerts, totalRupture)}</p>
        </td>
      </tr></table>
    </td></tr>

    <!-- ========== KPI CARDS ========== -->
    <tr><td style="background:${C.white};padding:24px 28px;" class="card-bg">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" class="kpi-table" style="border-collapse:separate;border-spacing:12px 0;">
        <tr>
          <!-- Total alertes -->
          <td class="kpi-cell" style="width:33%;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-radius:16px;overflow:hidden;">
              <tr><td style="background:${C.white};border:1px solid ${C.border};border-left:4px solid ${C.primary};border-radius:16px;padding:20px 16px;text-align:center;" class="kpi-card">
                <div style="font-size:14px;margin-bottom:6px;">&#128230;</div>
                <div style="font-size:36px;font-weight:800;color:${C.primary};font-family:${FONT};line-height:1.1;">${totalAlerts}</div>
                <div style="font-size:11px;color:${C.textSec};text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;font-family:${FONT};font-weight:600;">En alerte</div>
                ${compHtml ? `<div style="margin-top:4px;">${compHtml}</div>` : ''}
              </td></tr>
            </table>
          </td>
          <!-- Rupture totale -->
          <td class="kpi-cell" style="width:33%;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-radius:16px;overflow:hidden;">
              <tr><td style="background:${C.white};border:1px solid ${C.border};border-left:4px solid ${C.danger};border-radius:16px;padding:20px 16px;text-align:center;" class="kpi-card">
                <div style="font-size:14px;margin-bottom:6px;">&#128680;</div>
                <div style="font-size:36px;font-weight:800;color:${C.danger};font-family:${FONT};line-height:1.1;">${totalRupture}</div>
                <div style="font-size:11px;color:${C.textSec};text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;font-family:${FONT};font-weight:600;">Rupture totale</div>
              </td></tr>
            </table>
          </td>
          <!-- Stock bas -->
          <td class="kpi-cell" style="width:33%;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-radius:16px;overflow:hidden;">
              <tr><td style="background:${C.white};border:1px solid ${C.border};border-left:4px solid ${C.warning};border-radius:16px;padding:20px 16px;text-align:center;" class="kpi-card">
                <div style="font-size:14px;margin-bottom:6px;">&#9888;&#65039;</div>
                <div style="font-size:36px;font-weight:800;color:${C.warning};font-family:${FONT};line-height:1.1;">${totalBas}</div>
                <div style="font-size:11px;color:${C.textSec};text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;font-family:${FONT};font-weight:600;">Stock bas</div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- ========== CTA BUTTON ========== -->
    <tr><td style="background:${C.white};padding:0 28px 28px;text-align:center;" class="card-bg">
      <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;">
        <tr><td style="background:${C.primary};border-radius:12px;padding:14px 32px;text-align:center;">
          <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="width:220px;height:44px;" arcsize="28%" fill="true" stroke="false"><v:fill color="${C.primary}"/><w:anchorlock/><center style="color:#FFFFFF;font-family:${FONT};font-size:15px;font-weight:600;">Ouvrir IT-Inventory</center></v:roundrect><![endif]-->
          <a href="#" style="color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;font-family:${FONT};display:inline-block;">Ouvrir IT-Inventory &rarr;</a>
        </td></tr>
      </table>
    </td></tr>

    <!-- ========== SITE SECTIONS ========== -->
    <tr><td style="background:${C.white};border-radius:0 0 20px 20px;overflow:hidden;padding:0;" class="card-bg">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;" class="site-table">
        ${siteSections}

        <!-- Table bottom padding -->
        <tr><td style="height:16px;"></td></tr>
      </table>
    </td></tr>

    <!-- ========== FOOTER ========== -->
    <tr><td style="padding:32px 24px;text-align:center;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr><td style="border-top:1px solid ${C.border};padding-top:24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${C.primary};font-family:${FONT};letter-spacing:-0.3px;">IT-Inventory</p>
          <p style="margin:0 0 8px;font-size:12px;color:${C.textMuted};font-family:${FONT};">Gestion de stock IT &mdash; Rapport automatique</p>
          <p style="margin:0 0 4px;font-size:12px;color:${C.textMuted};font-family:${FONT};">G&eacute;n&eacute;r&eacute; le ${dateStr} &agrave; ${timeStr}</p>
          <p style="margin:12px 0 0;font-size:11px;color:${C.textMuted};font-family:${FONT};">&copy; 2026 IT-Inventory &mdash; Cr&eacute;dit Agricole Alsace Vosges</p>
        </td></tr>
      </table>
    </td></tr>

    <!-- Spacer bottom -->
    <tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>

  </table>
  <!--[if mso]></td></tr></table><![endif]-->

</body>
</html>`;
}

// ==================== Main Handler ====================

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
    console.log('[daily-stock-alert] Démarrage du rapport quotidien...');

    // 1. Récupérer les articles en alerte
    const alerts = await fetchLowStockArticles();
    console.log(`[daily-stock-alert] ${alerts.length} articles en alerte trouvés`);

    // Si aucun article en alerte, ne pas envoyer d'email
    if (alerts.length === 0) {
      // Sauvegarder le 0 pour la comparaison J-1
      await saveTodayCount(0);
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: 'Aucun article en alerte' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 2. Comparaison J-1
    const previousTotal = await getPreviousCount();
    const comparison: Comparison = {
      previousTotal,
      diff: previousTotal !== null ? alerts.length - previousTotal : 0,
      isNew: previousTotal === null,
    };
    console.log(`[daily-stock-alert] J-1: prev=${previousTotal}, today=${alerts.length}, diff=${comparison.diff}`);

    // Sauvegarder le compte d'aujourd'hui pour demain
    await saveTodayCount(alerts.length);

    // 3. Grouper par site
    const siteMap = new Map<string, AlertRow[]>();
    for (const a of alerts) {
      const existing = siteMap.get(a.site_nom) ?? [];
      existing.push(a);
      siteMap.set(a.site_nom, existing);
    }

    const alertsBySite: SiteAlerts[] = Array.from(siteMap.entries()).map(([siteNom, articles]) => ({
      siteNom,
      articles,
      ruptureCount: articles.filter((a) => a.stock_actuel === 0).length,
      basCount: articles.filter((a) => a.stock_actuel > 0).length,
    }));

    // 4. Construire l'email premium
    const emailHtml = buildEmailHtml(alertsBySite, comparison);
    const siteNames = alertsBySite.map((s) => s.siteNom).join(', ');
    const emailSubject = `📊 Rapport stock — ${alerts.length} alerte${alerts.length > 1 ? 's' : ''} (${siteNames})`;

    // 5. Envoyer via Resend
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
      console.error('[daily-stock-alert] Resend error:', err);
      return new Response(
        JSON.stringify({ error: 'Échec envoi email', details: err }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = await resendRes.json();
    console.log(`[daily-stock-alert] Email envoyé avec succès: ${result.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: true,
        emailId: result.id,
        alertCount: alerts.length,
        comparison: { previous: previousTotal, diff: comparison.diff },
        sites: alertsBySite.map((s) => ({ site: s.siteNom, count: s.articles.length })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[daily-stock-alert] Error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
