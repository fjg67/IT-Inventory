import { getSupabaseClient, tables } from '@/api/supabase';

export type AnomalySeverity = 'critical' | 'warning' | 'info';
export interface Anomaly { id: string; kind: string; severity: AnomalySeverity; title: string; detail: string; articleId?: string; }

export const anomalyDetectionService = {
  async detect(siteId?: string | number): Promise<Anomaly[]> {
    const supabase = getSupabaseClient();
    const [articlesRes, stocksRes, movementsRes, lifecycleRes] = await Promise.all([
      supabase.from(tables.articles).select('id, reference, name, barcode, articleType, isArchived').eq('isArchived', false),
      (() => { let query = supabase.from(tables.stocksSites).select('articleId, siteId, quantity'); if (siteId != null) query = query.eq('siteId', siteId); return query; })(),
      (() => { let query = supabase.from(tables.mouvements).select('id, articleId, quantity, type, createdAt, fromSiteId'); if (siteId != null) query = query.eq('fromSiteId', siteId); return query.order('createdAt', { ascending: false }).limit(5000); })(),
      supabase.from(tables.pcLifecycleEvents).select('articleId, type, personName, eventDate').eq('type', 'assignment'),
    ]);
    if (articlesRes.error) throw new Error(articlesRes.error.message);
    if (stocksRes.error) throw new Error(stocksRes.error.message);
    if (movementsRes.error) throw new Error(movementsRes.error.message);
    if (lifecycleRes.error) throw new Error(lifecycleRes.error.message);
    const articles = articlesRes.data ?? [];
    const articleMap = new Map(articles.map((article: any) => [String(article.id), article]));
    const anomalies: Anomaly[] = [];
    const stocks = stocksRes.data ?? [];
    for (const stock of stocks as any[]) if (Number(stock.quantity ?? 0) < 0) anomalies.push({ id: `negative-${stock.articleId}-${stock.siteId}`, kind: 'negative_stock', severity: 'critical', title: 'Stock négatif', detail: `${articleMap.get(String(stock.articleId))?.name ?? stock.articleId} : ${stock.quantity}`, articleId: String(stock.articleId) });

    const barcodeMap = new Map<string, any[]>();
    for (const article of articles as any[]) { const barcode = String(article.barcode ?? '').trim().toLowerCase(); if (!barcode) continue; barcodeMap.set(barcode, [...(barcodeMap.get(barcode) ?? []), article]); }
    for (const [barcode, duplicates] of barcodeMap) if (duplicates.length > 1) anomalies.push({ id: `barcode-${barcode}`, kind: 'duplicate_barcode', severity: 'critical', title: 'Code-barres en doublon', detail: `${barcode} utilisé par ${duplicates.map(item => item.name).join(', ')}`, articleId: String(duplicates[0].id) });

    const exits = new Set((movementsRes.data ?? []).filter((movement: any) => ['EXIT', 'SORTIE'].includes(String(movement.type).toUpperCase())).map((movement: any) => String(movement.articleId)));
    for (const stock of stocks as any[]) if (Number(stock.quantity ?? 0) > 0 && !exits.has(String(stock.articleId))) anomalies.push({ id: `dormant-${stock.articleId}-${stock.siteId}`, kind: 'dormant_article', severity: 'info', title: 'Article dormant', detail: `${articleMap.get(String(stock.articleId))?.name ?? stock.articleId} n’a aucune sortie enregistrée sur la période analysée.`, articleId: String(stock.articleId) });

    const quantities = (movementsRes.data ?? []).map((movement: any) => Math.abs(Number(movement.quantity ?? 0))).filter(value => value > 0);
    const average = quantities.length ? quantities.reduce((sum, value) => sum + value, 0) / quantities.length : 0;
    for (const movement of movementsRes.data ?? []) { const quantity = Math.abs(Number((movement as any).quantity ?? 0)); if (quantity >= Math.max(10, average * 4)) anomalies.push({ id: `unusual-${(movement as any).id}`, kind: 'unusual_movement', severity: 'warning', title: 'Mouvement inhabituel', detail: `${quantity} unité(s) pour ${articleMap.get(String((movement as any).articleId))?.name ?? (movement as any).articleId}`, articleId: String((movement as any).articleId) }); }

    const assignments = new Map<string, Set<string>>();
    for (const event of lifecycleRes.data ?? []) { const key = String((event as any).articleId); const person = String((event as any).personName ?? '').trim(); if (person) assignments.set(key, (assignments.get(key) ?? new Set()).add(person)); }
    for (const [articleId, people] of assignments) if (people.size > 1 && articleMap.get(articleId)?.articleType === 'PC') anomalies.push({ id: `multi-user-${articleId}`, kind: 'multiple_pc_users', severity: 'critical', title: 'PC affecté à plusieurs personnes', detail: `${articleMap.get(articleId)?.name ?? articleId} : ${[...people].join(', ')}`, articleId });
    return anomalies;
  },
};
export default anomalyDetectionService;
