import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('REPORT_FROM_EMAIL') ?? 'IT-Inventory <onboarding@resend.dev>';

interface Subscription { email: string; frequency: 'weekly' | 'monthly'; }

async function query(path: string): Promise<any[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return await response.json();
}

function escape(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] ?? char));
}

async function sendEmail(to: string, frequency: string, html: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: `Rapport ${frequency === 'weekly' ? 'hebdomadaire' : 'mensuel'} IT-Inventory`, html }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

serve(async () => {
  try {
    const today = new Date();
    const day = today.getUTCDate();
    const weekday = today.getUTCDay();
    const subscriptions = (await query('ReportSubscription?enabled=eq.true&select=email,frequency')) as Subscription[];
    const due = subscriptions.filter(subscription => subscription.frequency === 'monthly' ? day === 1 : weekday === 1);
    if (due.length === 0) return Response.json({ sent: 0, skipped: subscriptions.length });

    const [articles, stocks, movements] = await Promise.all([
      query('Article?isArchived=eq.false&select=id,reference,name,category,minStock'),
      query('ArticleStock?select=articleId,siteId,quantity'),
      query(`StockMovement?createdAt=gte.${new Date(Date.now() - 31 * 86400000).toISOString()}&select=articleId,quantity,type,createdAt`),
    ]);
    const articleMap = new Map(articles.map((article: any) => [String(article.id), article]));
    const totalUnits = stocks.reduce((sum: number, stock: any) => sum + Number(stock.quantity ?? 0), 0);
    const ruptures = stocks.filter((stock: any) => Number(stock.quantity ?? 0) <= 0).length;
    const consumption = new Map<string, number>();
    for (const movement of movements) {
      if (String(movement.type).toUpperCase() !== 'EXIT') continue;
      const article = articleMap.get(String(movement.articleId));
      if (!article) continue;
      consumption.set(String(article.name), (consumption.get(String(article.name)) ?? 0) + Math.abs(Number(movement.quantity ?? 0)));
    }
    const top = [...consumption.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const rows = top.map(([name, quantity]) => `<tr><td>${escape(name)}</td><td>${quantity}</td></tr>`).join('');
    const html = `<html><body style="font-family:Arial;color:#17352A"><h1>Rapport IT-Inventory</h1><p>Unités en stock : <strong>${totalUnits}</strong><br>Ruptures : <strong>${ruptures}</strong></p><h2>Top consommations du mois</h2><table cellpadding="8" border="1" cellspacing="0"><tr><th>Article</th><th>Sorties</th></tr>${rows || '<tr><td colspan="2">Aucune sortie</td></tr>'}</table></body></html>`;
    for (const subscription of due) await sendEmail(subscription.email, subscription.frequency, html);
    return Response.json({ sent: due.length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erreur inconnue' }, { status: 500 });
  }
});
