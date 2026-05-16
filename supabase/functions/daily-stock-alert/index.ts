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
  'ilias.bey-ext@ca-alsace-vosges.fr',
  'guillaume.oudinot@ca-alsace-vosges.fr',
  'thibaud.hebrard-ext@ca-alsace-vosges.fr',
];
const MOBILE_APP_DEEP_LINK = 'itinventory://open';
const MOBILE_APP_FALLBACK_URL = 'https://play.google.com/store/apps/details?id=com.itinventory';

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

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const C = {
  // Brand
  ink:          '#0A0F1E',
  inkSoft:      '#1E2A3D',
  // Accents
  red:          '#E53E3E',
  redBright:    '#FF4757',
  redBg:        '#FFF5F5',
  redBgDeep:    '#FED7D7',
  amber:        '#DD6B20',
  amberBright:  '#F6AD55',
  amberBg:      '#FFFAF0',
  amberBgDeep:  '#FEEBC8',
  indigo:       '#5A67D8',
  indigoBright: '#7F9CF5',
  indigoBg:     '#EBF4FF',
  green:        '#2F855A',
  greenBg:      '#F0FFF4',
  // Neutrals
  white:        '#FFFFFF',
  snow:         '#F7FAFC',
  mist:         '#EDF2F7',
  silver:       '#E2E8F0',
  steel:        '#CBD5E0',
  slate:        '#718096',
  charcoal:     '#2D3748',
  night:        '#1A202C',
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
    'Article.isArchived=is.false'
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
  } catch (e) {
    console.warn('[daily-stock-alert] getPreviousCount failed (table may not exist):', e);
  }
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

/** Mini stock progress bar */
function critBar(stock: number, mini: number): string {
  const pct = mini > 0 ? Math.min(Math.round((stock / mini) * 100), 100) : 0;
  const barColor = pct === 0 ? C.redBright : pct < 50 ? C.amberBright : C.green;
  const barWidth = pct === 0 ? 0 : Math.max(pct, 5);
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:5px;">
    <tr>
      <td style="width:64px;height:4px;background:${C.silver};border-radius:2px;overflow:hidden;vertical-align:middle;">
        <div style="width:${barWidth}%;height:4px;background:${barColor};border-radius:2px;max-width:100%;"></div>
      </td>
      <td style="padding-left:5px;font-size:10px;color:${C.slate};font-family:${FONT};vertical-align:middle;white-space:nowrap;">${pct}%</td>
    </tr>
  </table>`;
}

/** Dynamic alert message */
function buildAlertMessage(totalAlerts: number, totalRupture: number): string {
  if (totalRupture >= 20) return `<strong>Situation critique</strong> — ${totalRupture} articles en rupture totale. R&eacute;approvisionnement urgent n&eacute;cessaire.`;
  if (totalRupture >= 10) return `<strong>Attention</strong> — ${totalRupture} articles en rupture totale. Un r&eacute;approvisionnement rapide est recommand&eacute;.`;
  if (totalRupture > 0) return `<strong>${totalAlerts} article${totalAlerts > 1 ? 's' : ''}</strong> n&eacute;cessitent votre attention, dont <strong>${totalRupture}</strong> en rupture compl&egrave;te.`;
  return `<strong>Situation sous contr&ocirc;le</strong> — ${totalAlerts} article${totalAlerts > 1 ? 's' : ''} en stock bas &agrave; surveiller.`;
}

/** J-1 comparison badge */
function compBadge(comp: Comparison): string {
  if (comp.isNew || comp.previousTotal === null) return '';
  if (comp.diff === 0) return `<span style="font-size:11px;color:${C.slate};font-family:${FONT};">&nbsp;= stable</span>`;
  const up = comp.diff > 0;
  const bg = up ? C.redBgDeep : C.greenBg;
  const color = up ? C.red : C.green;
  const arrow = up ? '&#8679;' : '&#8681;';
  const label = up ? `+${comp.diff}` : `${comp.diff}`;
  return `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;font-family:${FONT};margin-top:4px;">${arrow} ${label} vs hier</span>`;
}

// ==================== Premium HTML Builder ====================

function buildEmailHtml(alertsBySite: SiteAlerts[], comparison: Comparison): string {
  const now = new Date();
  const parisOptions: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Paris' };
  const dateStr = now.toLocaleDateString('fr-FR', { ...parisOptions, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { ...parisOptions, hour: '2-digit', minute: '2-digit' }).replace(':', 'h');

  const totalAlerts = alertsBySite.reduce((s, x) => s + x.articles.length, 0);
  const totalRupture = alertsBySite.reduce((s, x) => s + x.ruptureCount, 0);
  const totalBas = alertsBySite.reduce((s, x) => s + x.basCount, 0);
  const compHtml = compBadge(comparison);

  const isCritical = totalRupture >= 10;
  const alertBg = isCritical ? C.redBg : totalRupture > 0 ? C.amberBg : C.greenBg;
  const alertBorder = isCritical ? C.red : totalRupture > 0 ? C.amber : C.green;
  const alertTextColor = isCritical ? '#742A2A' : totalRupture > 0 ? '#7B341E' : '#276749';

  // ── Site sections ──
  const siteSections = alertsBySite.map((site) => {
    const ruptureInSite = site.articles.filter(a => a.stock_actuel === 0).length;

    const articleRows = site.articles.map((a, i) => {
      const isZero = a.stock_actuel === 0;
      const ratio = a.stock_mini > 0 ? (a.stock_actuel / a.stock_mini) * 100 : 0;
      const isCrit = !isZero && ratio < 40;
      const accentColor = isZero ? C.redBright : isCrit ? C.amber : C.amberBright;
      const badgeBg = isZero ? C.redBgDeep : C.amberBgDeep;
      const badgeColor = isZero ? '#742A2A' : '#7B341E';
      const badgeText = isZero ? 'RUPTURE' : 'STOCK BAS';
      const rowBg = i % 2 === 0 ? C.white : C.snow;

      return `<tr style="background:${rowBg};border-left:3px solid ${accentColor};">
        <td style="padding:13px 14px 13px 16px;border-bottom:1px solid ${C.mist};">
          <div style="font-weight:600;color:${C.night};font-size:14px;line-height:1.3;font-family:${FONT};">${a.article_nom}</div>
          ${a.article_emplacement ? `<div style="color:${C.slate};font-size:11px;margin-top:2px;font-family:${FONT};">&#x1F4CD; ${a.article_emplacement}</div>` : ''}
        </td>
        <td style="padding:13px 10px;border-bottom:1px solid ${C.mist};color:${C.slate};font-size:12px;font-family:'Courier New',Courier,monospace;white-space:nowrap;">${a.article_reference ?? '&mdash;'}</td>
        <td style="padding:13px 10px;border-bottom:1px solid ${C.mist};text-align:center;min-width:76px;">
          <div style="font-size:22px;font-weight:800;color:${accentColor};line-height:1;font-family:${FONT};">${a.stock_actuel}</div>
          <div style="color:${C.slate};font-size:10px;font-family:${FONT};margin-top:1px;">/ ${a.stock_mini}</div>
          ${critBar(a.stock_actuel, a.stock_mini)}
        </td>
        <td style="padding:13px 14px 13px 10px;border-bottom:1px solid ${C.mist};text-align:right;">
          <span style="display:inline-block;background:${badgeBg};color:${badgeColor};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:0.6px;font-family:${FONT};">${badgeText}</span>
        </td>
      </tr>`;
    }).join('');

    return `
    <!-- Site header -->
    <tr>
      <td colspan="4" style="background:${C.inkSoft};padding:14px 20px;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="color:#FFFFFF;font-size:14px;font-weight:700;font-family:${FONT};letter-spacing:0.2px;vertical-align:middle;">${site.siteNom}</td>
          <td style="padding-left:10px;vertical-align:middle;">
            <span style="display:inline-block;background:rgba(255,255,255,0.12);color:#E2E8F0;font-size:11px;font-weight:600;padding:2px 10px;border-radius:20px;font-family:${FONT};">${site.articles.length} article${site.articles.length > 1 ? 's' : ''}</span>
          </td>
          ${ruptureInSite > 0 ? `<td style="padding-left:8px;vertical-align:middle;"><span style="display:inline-block;background:${C.red};color:#FFFFFF;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;font-family:${FONT};">${ruptureInSite} rupture${ruptureInSite > 1 ? 's' : ''}</span></td>` : ''}
        </tr></table>
      </td>
    </tr>
    <!-- Column headers -->
    <tr style="background:${C.mist};">
      <td style="padding:8px 14px 8px 16px;font-size:10px;font-weight:700;color:${C.slate};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:1px solid ${C.silver};">Article</td>
      <td style="padding:8px 10px;font-size:10px;font-weight:700;color:${C.slate};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:1px solid ${C.silver};">R&eacute;f.</td>
      <td style="padding:8px 10px;font-size:10px;font-weight:700;color:${C.slate};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:1px solid ${C.silver};text-align:center;">Stock</td>
      <td style="padding:8px 14px 8px 10px;font-size:10px;font-weight:700;color:${C.slate};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};border-bottom:1px solid ${C.silver};text-align:right;">Statut</td>
    </tr>
    ${articleRows}
    <!-- Gap between sites -->
    <tr><td colspan="4" style="height:2px;background:${C.silver};"></td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Stock — IT-Inventory</title>
</head>
<body style="margin:0;padding:0;background:${C.night};font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.night};">
<tr><td align="center" style="padding:28px 12px 36px;">

  <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;">

    <!-- ═══ TOP ALERT STRIP ═══ -->
    <tr>
      <td style="background:${isCritical ? C.redBright : C.amber};border-radius:12px 12px 0 0;padding:9px 22px;text-align:center;">
        <span style="color:#FFFFFF;font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;font-family:${FONT};">
          ${isCritical ? '&#9889; SITUATION CRITIQUE' : '&#9888; ALERTE STOCK ACTIVE'}
        </span>
      </td>
    </tr>

    <!-- ═══ HEADER ═══ -->
    <tr>
      <td style="background:${C.ink};padding:40px 32px 36px;text-align:center;border-left:1px solid #1a2540;border-right:1px solid #1a2540;">
        <div style="font-size:11px;font-weight:700;color:${C.indigoBright};letter-spacing:3px;text-transform:uppercase;font-family:${FONT};margin-bottom:14px;">RAPPORT STOCK QUOTIDIEN</div>
        <div style="font-size:38px;font-weight:800;color:#FFFFFF;line-height:1;font-family:${FONT};letter-spacing:-1px;">IT-Inventory</div>
        <div style="margin-top:12px;color:#718096;font-size:13px;font-family:${FONT};">${dateStr} &nbsp;&bull;&nbsp; ${timeStr}</div>
      </td>
    </tr>

    <!-- ═══ KPI CARDS ═══ -->
    <tr>
      <td style="background:#FFFFFF;padding:24px 20px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <!-- En alerte -->
            <td width="33%" style="padding:0 5px 0 0;vertical-align:top;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="background:${C.snow};border-radius:12px;border-top:3px solid ${C.indigo};padding:16px 12px;text-align:center;">
                  <div style="font-size:40px;font-weight:900;color:${C.indigo};line-height:1;font-family:${FONT};">${totalAlerts}</div>
                  <div style="font-size:10px;font-weight:700;color:${C.slate};text-transform:uppercase;letter-spacing:1px;margin-top:6px;font-family:${FONT};">En alerte</div>
                  ${compHtml ? `<div>${compHtml}</div>` : ''}
                </td></tr>
              </table>
            </td>
            <!-- Rupture -->
            <td width="33%" style="padding:0 2px;vertical-align:top;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="background:${C.redBg};border-radius:12px;border-top:3px solid ${C.red};padding:16px 12px;text-align:center;">
                  <div style="font-size:40px;font-weight:900;color:${C.red};line-height:1;font-family:${FONT};">${totalRupture}</div>
                  <div style="font-size:10px;font-weight:700;color:#742A2A;text-transform:uppercase;letter-spacing:1px;margin-top:6px;font-family:${FONT};">Rupture totale</div>
                </td></tr>
              </table>
            </td>
            <!-- Stock bas -->
            <td width="33%" style="padding:0 0 0 5px;vertical-align:top;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="background:${C.amberBg};border-radius:12px;border-top:3px solid ${C.amber};padding:16px 12px;text-align:center;">
                  <div style="font-size:40px;font-weight:900;color:${C.amber};line-height:1;font-family:${FONT};">${totalBas}</div>
                  <div style="font-size:10px;font-weight:700;color:#7B341E;text-transform:uppercase;letter-spacing:1px;margin-top:6px;font-family:${FONT};">Stock bas</div>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ═══ ALERT BANNER ═══ -->
    <tr>
      <td style="background:#FFFFFF;padding:0 20px 20px;">
        <div style="background:${alertBg};border-left:4px solid ${alertBorder};border-radius:0 8px 8px 0;padding:13px 16px;">
          <span style="color:${alertTextColor};font-size:13px;line-height:1.5;font-family:${FONT};">${buildAlertMessage(totalAlerts, totalRupture)}</span>
        </div>
      </td>
    </tr>

    <!-- ═══ ARTICLES TABLE ═══ -->
    <tr>
      <td style="background:#FFFFFF;padding:0 20px 4px;">
        <div style="border-top:1px solid ${C.mist};padding-top:16px;padding-bottom:10px;">
          <span style="font-size:11px;font-weight:700;color:${C.charcoal};letter-spacing:1.5px;text-transform:uppercase;font-family:${FONT};">D&eacute;tail par site</span>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid ${C.silver};">
          ${siteSections}
        </table>
      </td>
    </tr>

    <!-- ═══ CTA ═══ -->
    <tr>
      <td style="background:#FFFFFF;padding:20px 20px 4px;text-align:center;">
        <table cellpadding="0" cellspacing="0" border="0" align="center">
          <tr><td style="background:${C.indigo};border-radius:10px;padding:13px 30px;">
            <a href="${MOBILE_APP_DEEP_LINK}" style="color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;font-family:${FONT};letter-spacing:0.3px;">Ouvrir IT-Inventory &#8594;</a>
          </td></tr>
        </table>
        <p style="margin:8px 0 0;font-size:11px;color:${C.slate};font-family:${FONT};">
          Lien alternatif : <a href="${MOBILE_APP_FALLBACK_URL}" style="color:${C.indigo};text-decoration:none;">Play Store</a>
        </p>
      </td>
    </tr>

    <!-- ═══ FOOTER ═══ -->
    <tr>
      <td style="background:#FFFFFF;padding:16px 20px 0;">
        <div style="border-top:1px solid ${C.mist};padding-top:14px;padding-bottom:4px;text-align:center;">
          <p style="margin:0;color:${C.slate};font-size:11px;font-family:${FONT};line-height:1.6;">
            G&eacute;n&eacute;r&eacute; automatiquement par <strong style="color:${C.charcoal};">IT-Inventory</strong> &bull; ${dateStr} &agrave; ${timeStr}
          </p>
        </div>
      </td>
    </tr>

    <!-- ═══ BOTTOM BAR ═══ -->
    <tr>
      <td style="background:linear-gradient(90deg,${C.ink},${C.inkSoft});border-radius:0 0 12px 12px;padding:15px 24px;text-align:center;">
        <span style="color:#4A5568;font-size:11px;letter-spacing:0.5px;font-family:${FONT};">&copy; 2026 IT-Inventory &mdash; Cr&eacute;dit Agricole Alsace Vosges</span>
      </td>
    </tr>

  </table>

</td></tr>
</table>
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
    console.log(`[daily-stock-alert] SUPABASE_URL=${SUPABASE_URL ? 'SET' : 'MISSING'}, SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}, RESEND_API_KEY=${RESEND_API_KEY ? 'SET' : 'MISSING'}`);

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

    // 5. Envoyer via Resend (individuellement pour masquer les destinataires)
    const emailResults = [];
    for (const recipient of RECIPIENT_EMAILS) {
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
        console.error(`[daily-stock-alert] Resend error for ${recipient}:`, err);
        emailResults.push({ recipient, success: false, error: err });
      } else {
        const result = await resendRes.json();
        console.log(`[daily-stock-alert] Email envoyé à ${recipient}: ${result.id}`);
        emailResults.push({ recipient, success: true, emailId: result.id });
      }
    }

    const allFailed = emailResults.every((r) => !r.success);
    if (allFailed) {
      return new Response(
        JSON.stringify({ error: 'Échec envoi email à tous les destinataires', details: emailResults }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = { id: emailResults.find((r) => r.success)?.emailId };
    console.log(`[daily-stock-alert] Emails envoyés avec succès: ${emailResults.filter((r) => r.success).length}/${emailResults.length}`);

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
