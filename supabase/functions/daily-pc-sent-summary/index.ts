import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const RECIPIENT_EMAIL = 'robert.lamande-ext@ca-alsace-vosges.fr';
const SOURCE_AGENCY_LABEL = 'Siege Strasbourg';
const TIME_ZONE = 'Europe/Paris';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

interface SummaryRequestBody {
  recipientEmail?: string;
}

const C = {
  primary: '#E11D48',
  primaryDark: '#BE123C',
  accent: '#0F766E',
  success: '#059669',
  text: '#1E293B',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  white: '#FFFFFF',
  background: '#FFF7F8',
  chip: '#FFE4E6',
};

interface SentPcRow {
  hostname: string;
  asset: string | null;
  destinationAgencyEds: string;
  recipientName: string | null;
  sentAt: string;
}

function formatParts(date: Date, timeZone: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = formatParts(date, timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

function makeZonedDate(year: number, month: number, day: number, hour: number, minute: number, second: number, timeZone: string): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

function getParisDayRange(now: Date): { start: Date; end: Date; label: string } {
  const today = formatParts(now, TIME_ZONE);
  const year = Number(today.year);
  const month = Number(today.month);
  const day = Number(today.day);

  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() + 1);

  const start = makeZonedDate(year, month, day, 0, 0, 0, TIME_ZONE);
  const end = makeZonedDate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0, 0, TIME_ZONE);

  const label = new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);

  return { start, end, label };
}

async function supabaseQuery(pathWithQuery: string): Promise<SentPcRow[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathWithQuery}`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase REST error: ${res.status} ${errorText}`);
  }

  return await res.json();
}

async function fetchTodaySentPcs(): Promise<{ rows: SentPcRow[]; dayLabel: string }> {
  const now = new Date();
  const { start, end, label } = getParisDayRange(now);

  const rows = await supabaseQuery(
    `PCSentHistory?select=hostname,asset,destinationAgencyEds,recipientName,sentAt,sourceSiteName`
      + `&sourceSiteName=eq.${encodeURIComponent(SOURCE_AGENCY_LABEL)}`
      + `&sentAt=gte.${encodeURIComponent(start.toISOString())}`
      + `&sentAt=lt.${encodeURIComponent(end.toISOString())}`
      + `&order=sentAt.asc`,
  );

  return { rows, dayLabel: label };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatSentTime(sentAt: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(sentAt));
}

function buildEmailHtml(rows: SentPcRow[], dayLabel: string): string {
  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const tableRows = rows.map((row, index) => {
    const bg = index % 2 === 0 ? C.white : C.background;
    return `
      <tr style="background:${bg};">
        <td style="padding:14px 16px;border-bottom:1px solid ${C.borderLight};font-family:${FONT};font-size:14px;color:${C.text};font-weight:700;">${escapeHtml(row.hostname || 'PC inconnu')}</td>
        <td style="padding:14px 12px;border-bottom:1px solid ${C.borderLight};font-family:'SF Mono','Cascadia Code','Consolas',monospace;font-size:13px;color:${C.textSecondary};">${escapeHtml(row.asset || '—')}</td>
        <td style="padding:14px 12px;border-bottom:1px solid ${C.borderLight};font-family:${FONT};font-size:13px;color:${C.text};">${escapeHtml(row.recipientName || 'Non renseigné')}</td>
        <td style="padding:14px 12px;border-bottom:1px solid ${C.borderLight};font-family:${FONT};font-size:13px;color:${C.text};text-align:center;">EDS ${escapeHtml(row.destinationAgencyEds)}</td>
        <td style="padding:14px 12px;border-bottom:1px solid ${C.borderLight};font-family:${FONT};font-size:13px;color:${C.textSecondary};text-align:center;">${escapeHtml(formatSentTime(row.sentAt))}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Récapitulatif PC envoyés</title>
</head>
<body style="margin:0;padding:24px;background:${C.background};font-family:${FONT};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:720px;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${C.white};border-radius:20px;overflow:hidden;border:1px solid ${C.border};">
          <tr>
            <td style="padding:32px;background:linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%);text-align:center;">
              <div style="font-size:42px;line-height:1;margin-bottom:10px;">📤</div>
              <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Récapitulatif PC envoyés</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.86);font-size:15px;">${escapeHtml(dayLabel)} • ${escapeHtml(SOURCE_AGENCY_LABEL)} • Généré à ${escapeHtml(generatedAt)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0 12px;">
                <tr>
                  <td style="background:${C.chip};border:1px solid #FDA4AF;border-radius:16px;padding:18px 20px;">
                    <div style="font-size:13px;color:${C.textSecondary};text-transform:uppercase;letter-spacing:0.7px;font-weight:700;">Total du jour</div>
                    <div style="margin-top:6px;font-size:34px;color:${C.primary};font-weight:800;line-height:1;">${rows.length}</div>
                    <div style="margin-top:6px;font-size:14px;color:${C.text};">PC envoyé${rows.length > 1 ? 's' : ''} aujourd'hui</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${C.border};border-radius:18px;overflow:hidden;">
                <tr style="background:#FFF1F2;">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${C.border};">Hostname</th>
                  <th style="padding:12px 12px;text-align:left;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${C.border};">Asset</th>
                  <th style="padding:12px 12px;text-align:left;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${C.border};">Destinataire</th>
                  <th style="padding:12px 12px;text-align:center;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${C.border};">EDS</th>
                  <th style="padding:12px 12px;text-align:center;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${C.border};">Heure</th>
                </tr>
                ${tableRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;font-size:12px;color:${C.textSecondary};line-height:1.6;">Ce message est envoyé automatiquement à 17h pour les PC marqués envoyés depuis ${escapeHtml(SOURCE_AGENCY_LABEL)}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
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
    console.log('[daily-pc-sent-summary] Starting daily summary...');

    const requestBody = req.method === 'POST'
      ? await req.json().catch(() => ({} as SummaryRequestBody))
      : ({} as SummaryRequestBody);
    const recipientEmail = requestBody.recipientEmail?.trim() || RECIPIENT_EMAIL;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error('Missing required environment variables for Supabase or Resend');
    }

    const { rows, dayLabel } = await fetchTodaySentPcs();
    console.log(`[daily-pc-sent-summary] ${rows.length} sent PC(s) found for ${SOURCE_AGENCY_LABEL}`);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: 'No sent PCs for today' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const subject = `📤 ${rows.length} PC envoyé${rows.length > 1 ? 's' : ''} - ${SOURCE_AGENCY_LABEL}`;
    const html = buildEmailHtml(rows, dayLabel);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'IT-Inventory <noreply@it-inventory.fr>',
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      throw new Error(`Resend error: ${err}`);
    }

    const result = await resendRes.json();
    console.log(`[daily-pc-sent-summary] Email sent successfully to ${recipientEmail}: ${result.id}`);

    return new Response(
      JSON.stringify({ success: true, sent: true, count: rows.length, emailId: result.id, recipientEmail }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[daily-pc-sent-summary] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});