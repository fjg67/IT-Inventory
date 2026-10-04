import { getSupabaseClient, tables } from '@/api/supabase';
import { siteRepository } from '@/database';

export interface AdvancedDashboardData {
  totalUnits: number;
  totalStockValue: number;
  valuationComplete: boolean;
  ruptureRate: number;
  inventoryGapRate: number | null;
  familyConsumption: Array<{ label: string; value: number }>;
  dormantArticles: Array<{ id: string; label: string; stock: number }>;
  technicianMovements: Array<{ label: string; value: number }>;
  siteComparison: Array<{ id: string; label: string; units: number; value: number; ruptureRate: number; movements: number }>;
  topConsumed: Array<{ id: string; label: string; value: number }>;
}

const EMPTY: AdvancedDashboardData = {
  totalUnits: 0,
  totalStockValue: 0,
  valuationComplete: true,
  ruptureRate: 0,
  inventoryGapRate: null,
  familyConsumption: [],
  dormantArticles: [],
  technicianMovements: [],
  siteComparison: [],
  topConsumed: [],
};

function isExit(type: unknown): boolean {
  const normalized = String(type ?? '').toUpperCase();
  return normalized === 'EXIT' || normalized === 'SORTIE';
}

function addToMap(map: Map<string, number>, key: string, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

export const advancedDashboardService = {
  async load(days = 90): Promise<AdvancedDashboardData> {
    const supabase = getSupabaseClient();
    const sites = await siteRepository.findAll();
    if (sites.length === 0) return EMPTY;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [articlesRes, stocksRes, movementsRes] = await Promise.all([
      supabase.from(tables.articles).select('id, name, category, minStock, unitPrice').eq('isArchived', false),
      supabase.from(tables.stocksSites).select('articleId, siteId, quantity'),
      supabase.from(tables.mouvements).select('articleId, fromSiteId, toSiteId, type, quantity, userId, createdAt').gte('createdAt', since.toISOString()),
    ]);
    if (articlesRes.error) throw new Error(articlesRes.error.message);
    if (stocksRes.error) throw new Error(stocksRes.error.message);
    if (movementsRes.error) throw new Error(movementsRes.error.message);

    const articles = (articlesRes.data ?? []) as Array<{ id: string; name: string; category?: string | null; minStock?: number | null; unitPrice?: number | string | null }>;
    const articleMap = new Map(articles.map(article => [String(article.id), article]));
    const stocks = (stocksRes.data ?? []) as Array<{ articleId: string; siteId: string; quantity: number }>;
    const movements = (movementsRes.data ?? []) as Array<{ articleId: string; fromSiteId?: string | null; toSiteId?: string | null; type: string; quantity: number; userId?: string | null; createdAt: string }>;

    const userIds = [...new Set(movements.map(movement => movement.userId).filter((id): id is string => Boolean(id)))];
    const usersRes = userIds.length > 0
      ? await supabase.from(tables.techniciens).select('id, name').in('id', userIds)
      : { data: [], error: null };
    if (usersRes.error) throw new Error(usersRes.error.message);
    const userNames = new Map((usersRes.data ?? []).map((user: { id: string; name?: string }) => [String(user.id), user.name ?? 'Technicien inconnu']));
    const stockByArticle = new Map<string, number>();
    const stockBySite = new Map<string, { units: number; value: number; total: number; ruptures: number }>();
    let totalUnits = 0;
    let totalStockValue = 0;
    let valuationComplete = true;

    for (const stock of stocks) {
      const article = articleMap.get(String(stock.articleId));
      if (!article) continue;
      const quantity = Math.max(0, stock.quantity ?? 0);
      const unitPrice = Number(article.unitPrice ?? 0);
      const site = stockBySite.get(String(stock.siteId)) ?? { units: 0, value: 0, total: 0, ruptures: 0 };
      site.units += quantity;
      site.value += quantity * unitPrice;
      site.total += 1;
      if (quantity <= 0) site.ruptures += 1;
      stockBySite.set(String(stock.siteId), site);
      addToMap(stockByArticle, String(stock.articleId), quantity);
      totalUnits += quantity;
      totalStockValue += quantity * unitPrice;
      if (quantity > 0 && unitPrice <= 0) valuationComplete = false;
    }

    const familyConsumption = new Map<string, number>();
    const technicianMovements = new Map<string, number>();
    const articleConsumption = new Map<string, number>();
    const siteMovements = new Map<string, number>();
    const lastExitByArticle = new Map<string, number>();

    for (const movement of movements) {
      const movementSite = String(movement.fromSiteId ?? movement.toSiteId ?? '');
      addToMap(siteMovements, movementSite, 1);
      if (!isExit(movement.type)) continue;
      const quantity = Math.abs(Number(movement.quantity ?? 0));
      const article = articleMap.get(String(movement.articleId));
      if (!article) continue;
      addToMap(familyConsumption, article.category?.trim() || 'Sans famille', quantity);
      addToMap(articleConsumption, String(movement.articleId), quantity);
      if (movement.userId) addToMap(technicianMovements, String(movement.userId), 1);
      lastExitByArticle.set(String(movement.articleId), Math.max(lastExitByArticle.get(String(movement.articleId)) ?? 0, new Date(movement.createdAt).getTime()));
    }

    const dormantArticles = [...stockByArticle.entries()]
      .filter(([articleId, quantity]) => quantity > 0 && !lastExitByArticle.has(articleId))
      .map(([articleId, quantity]) => ({ id: articleId, label: articleMap.get(articleId)?.name ?? articleId, stock: quantity }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 8);

    const totalStockLines = stocks.filter(stock => articleMap.has(String(stock.articleId))).length;
    const totalRuptures = stocks.filter(stock => articleMap.has(String(stock.articleId)) && (stock.quantity ?? 0) <= 0).length;

    return {
      totalUnits,
      totalStockValue,
      valuationComplete,
      ruptureRate: totalStockLines > 0 ? totalRuptures / totalStockLines : 0,
      inventoryGapRate: null,
      familyConsumption: [...familyConsumption.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value })),
      dormantArticles,
      technicianMovements: [...technicianMovements.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, value]) => ({ label: userNames.get(id) ?? 'Technicien inconnu', value })),
      siteComparison: sites.map(site => {
        const stats = stockBySite.get(String(site.id)) ?? { units: 0, value: 0, total: 0, ruptures: 0 };
        return { id: String(site.id), label: site.nom, units: stats.units, value: stats.value, ruptureRate: stats.total > 0 ? stats.ruptures / stats.total : 0, movements: siteMovements.get(String(site.id)) ?? 0 };
      }).sort((a, b) => b.units - a.units),
      topConsumed: [...articleConsumption.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, value]) => ({ id, label: articleMap.get(id)?.name ?? id, value })),
    };
  },
};

export default advancedDashboardService;
