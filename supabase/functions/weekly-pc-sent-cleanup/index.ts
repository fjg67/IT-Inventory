import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const REPORT_RECIPIENT_EMAIL = 'robert.lamande-ext@ca-alsace-vosges.fr';
const TIME_ZONE = 'Europe/Paris';
const TARGET_WEEKDAY = 5; // Friday
const TARGET_HOUR = 18;

interface CleanupRequestBody {
  force?: boolean;
  dryRun?: boolean;
  reportEmail?: string;
}

interface SentPcRow {
  id: string;
  articleId: string | null;
  hostname: string;
  asset: string | null;
  destinationAgencyEds: string;
  recipientName: string | null;
  sentAt: string;
}

function buildHeaders(): HeadersInit {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function supabaseFetch(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  return await fetch(`${SUPABASE_URL}/rest/v1/${pathWithQuery}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers ?? {}),
    },
  });
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
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date);

  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

function getParisScheduleState(now: Date): { isTargetWindow: boolean; weekdayLabel: string; hour: number } {
  const parts = formatParts(now, TIME_ZONE);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const weekday = weekdayMap[parts.weekday] ?? -1;
  const hour = Number(parts.hour);
  return {
    isTargetWindow: weekday === TARGET_WEEKDAY && hour === TARGET_HOUR,
    weekdayLabel: parts.weekday,
    hour,
  };
}

async function fetchSentPcs(): Promise<SentPcRow[]> {
  const res = await supabaseFetch('PCSentHistory?select=id,articleId,hostname,asset,destinationAgencyEds,recipientName,sentAt&order=sentAt.asc');
  if (!res.ok) {
    throw new Error(`Unable to load PCSentHistory: ${await res.text()}`);
  }
  return await res.json();
}

function formatParisDateTime(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildCleanupReportHtml(rows: SentPcRow[], dryRun: boolean): string {
  const modeLabel = dryRun ? 'TEST (aucune suppression)' : 'RÉEL (suppression effectuée)';
  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIME_ZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  const tableRows = rows.map((row, index) => {
    const background = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    return `
      <tr style="background:${background};">
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;">${escapeHtml(row.hostname || 'PC inconnu')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;">${escapeHtml(row.asset || '—')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;">${escapeHtml(row.recipientName || 'Non renseigné')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;">EDS ${escapeHtml(row.destinationAgencyEds)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;">${escapeHtml(formatParisDateTime(row.sentAt))}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#F1F5F9; padding:20px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:760px; margin:0 auto; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; overflow:hidden;">
    <tr>
      <td style="padding:20px; background:#0F172A; color:#FFFFFF;">
        <h2 style="margin:0; font-size:22px;">Nettoyage hebdomadaire PC envoyés</h2>
        <p style="margin:8px 0 0; opacity:0.9;">Mode: ${escapeHtml(modeLabel)} • ${escapeHtml(generatedAt)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 20px;">
        <p style="margin:0 0 8px; color:#1E293B;"><strong>Total lignes PCSentHistory:</strong> ${rows.length}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 20px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; border:1px solid #E2E8F0;">
          <tr style="background:#F8FAFC; text-align:left;">
            <th style="padding:10px 12px; border-bottom:1px solid #E2E8F0;">Hostname</th>
            <th style="padding:10px 12px; border-bottom:1px solid #E2E8F0;">Asset</th>
            <th style="padding:10px 12px; border-bottom:1px solid #E2E8F0;">Destinataire</th>
            <th style="padding:10px 12px; border-bottom:1px solid #E2E8F0;">EDS</th>
            <th style="padding:10px 12px; border-bottom:1px solid #E2E8F0;">Date envoi</th>
          </tr>
          ${tableRows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendCleanupReport(rows: SentPcRow[], dryRun: boolean, reportEmail?: string): Promise<string | null> {
  if (!RESEND_API_KEY) {
    console.warn('[weekly-pc-sent-cleanup] RESEND_API_KEY missing, skipping report email.');
    return null;
  }

  const recipient = reportEmail?.trim() || REPORT_RECIPIENT_EMAIL;
  const subject = dryRun
    ? `🧪 Test nettoyage hebdo PC envoyés (${rows.length})`
    : `🗑️ Nettoyage effectué PC envoyés (${rows.length})`;
  const html = buildCleanupReportHtml(rows, dryRun);

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'IT-Inventory <noreply@it-inventory.fr>',
      to: [recipient],
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    throw new Error(`Resend report error: ${await resendRes.text()}`);
  }

  const result = await resendRes.json();
  return result.id ?? null;
}

async function deleteById(table: string, id: string): Promise<void> {
  const res = await supabaseFetch(`${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  });

  if (!res.ok) {
    throw new Error(`Unable to delete ${table} row ${id}: ${await res.text()}`);
  }
}

async function deleteStocksByArticleId(articleId: string): Promise<void> {
  const res = await supabaseFetch(`ArticleStock?articleId=eq.${encodeURIComponent(articleId)}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  });

  if (!res.ok) {
    throw new Error(`Unable to delete ArticleStock rows for article ${articleId}: ${await res.text()}`);
  }
}

async function deleteArticle(articleId: string): Promise<void> {
  const res = await supabaseFetch(`Article?id=eq.${encodeURIComponent(articleId)}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=representation',
    },
  });

  if (!res.ok) {
    throw new Error(`Unable to delete Article ${articleId}: ${await res.text()}`);
  }
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
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables for Supabase');
    }

    const requestBody = req.method === 'POST'
      ? await req.json().catch(() => ({} as CleanupRequestBody))
      : ({} as CleanupRequestBody);
    const force = requestBody.force === true;
    const dryRun = requestBody.dryRun === true;
    const reportEmail = requestBody.reportEmail;
    const scheduleState = getParisScheduleState(new Date());

    if (!force && !scheduleState.isTargetWindow) {
      return new Response(
        JSON.stringify({
          success: true,
          ran: false,
          reason: `Outside weekly cleanup window (${scheduleState.weekdayLabel} ${scheduleState.hour}:00 ${TIME_ZONE})`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const rows = await fetchSentPcs();
    if (rows.length === 0) {
      const reportEmailId = await sendCleanupReport([], dryRun, reportEmail);
      return new Response(
        JSON.stringify({ success: true, ran: true, dryRun, deletedArticles: 0, deletedHistoryRows: 0, reportEmailId }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const uniqueArticleIds = Array.from(new Set(rows.map((row) => row.articleId).filter((value): value is string => !!value)));

    if (!dryRun) {
      for (const articleId of uniqueArticleIds) {
        await deleteStocksByArticleId(articleId);
        await deleteArticle(articleId);
      }

      for (const row of rows) {
        await deleteById('PCSentHistory', row.id);
      }
    }

    const reportEmailId = await sendCleanupReport(rows, dryRun, reportEmail);

    return new Response(
      JSON.stringify({
        success: true,
        ran: true,
        dryRun,
        deletedArticles: dryRun ? 0 : uniqueArticleIds.length,
        deletedHistoryRows: dryRun ? 0 : rows.length,
        candidateArticles: uniqueArticleIds.length,
        candidateHistoryRows: rows.length,
        deletedHostnames: rows.map((row) => row.hostname),
        reportEmailId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[weekly-pc-sent-cleanup] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});