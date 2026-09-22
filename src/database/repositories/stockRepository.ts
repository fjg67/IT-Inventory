// ============================================
// STOCK REPOSITORY - IT-Inventory Application
// Source unique : Supabase (plus de SQLite local)
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';
import { StockSite, SyncStatus } from '@/types';

/**
 * Supabase ArticleStock table columns:
 * id (text), articleId (text), siteId (text), quantity (int4)
 */
interface StockRow {
  id: string;
  articleId: string;
  siteId: string;
  quantity: number;
  Article?: { reference: string; name: string; minStock: number; unit: string } | null;
}

async function clampDefectiveCountToStock(articleId: string, stockQuantity: number): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { data: article } = await supabase
      .from(tables.articles)
      .select('id, condition, defectiveCount')
      .eq('id', articleId)
      .maybeSingle();

    if (!article) return;

    const defectiveCount = Math.max(0, article.defectiveCount ?? 0);
    const safeStock = Math.max(0, stockQuantity);

    if (article.condition === 'bon_etat' && defectiveCount === 0) return;

    if (article.condition === 'bon_etat' && defectiveCount > 0) {
      await supabase
        .from(tables.articles)
        .update({
          defectiveCount: 0,
          conditionNote: null,
          conditionUpdatedAt: new Date().toISOString(),
        })
        .eq('id', articleId);
      return;
    }

    if (defectiveCount > safeStock) {
      await supabase
        .from(tables.articles)
        .update({
          defectiveCount: safeStock,
          conditionUpdatedAt: new Date().toISOString(),
        })
        .eq('id', articleId);
    }
  } catch (error) {
    console.warn('[stockRepository] Impossible d\'ajuster defectiveCount:', error);
  }
}

function mapRowToStockSite(row: StockRow): StockSite {
  return {
    id: row.id as any,
    articleId: row.articleId as any,
    siteId: row.siteId as any,
    quantiteActuelle: row.quantity,
    syncStatus: SyncStatus.SYNCED,
    article: row.Article
      ? {
          id: row.articleId as any,
          reference: row.Article.reference,
          nom: row.Article.name,
          stockMini: row.Article.minStock ?? 0,
          unite: row.Article.unit ?? 'unité',
          actif: true,
          dateCreation: new Date(),
          dateModification: new Date(),
          syncStatus: SyncStatus.SYNCED,
        }
      : undefined,
  };
}

/** Max retry attempts for optimistic locking */
const MAX_RETRY_ATTEMPTS = 3;
/** Base delay (ms) between retries — each retry doubles this */
const RETRY_BASE_DELAY_MS = 100;

/** Sentinel error message for callers to detect a conflict after exhausting retries */
export const STOCK_CONFLICT_ERROR = 'STOCK_CONFLICT';

export const stockRepository = {
  /**
   * Atomically update stock using optimistic locking (compare-and-swap).
   *
   * 1. Read current quantity
   * 2. Compute new quantity via `computeNewQuantity(currentQuantity)`
   * 3. Conditional UPDATE: `SET quantity = newQty WHERE quantity = readQty`
   * 4. If 0 rows affected → someone else changed it → retry (up to MAX_RETRY_ATTEMPTS)
   *
   * Returns the new stock quantity on success.
   * Throws STOCK_CONFLICT_ERROR if all retries are exhausted.
   */
  async atomicUpdateQuantite(
    articleId: string | number,
    siteId: string | number,
    computeNewQuantity: (currentQuantity: number) => number,
    /** Optional validation run against the current stock before writing. Throw to abort. */
    validate?: (currentQuantity: number, newQuantity: number) => void,
  ): Promise<number> {
    const supabase = getSupabaseClient();

    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      // Step 1 — Read current stock
      const { data: row, error: readErr } = await supabase
        .from(tables.stocksSites)
        .select('id, quantity')
        .eq('articleId', articleId)
        .eq('siteId', siteId)
        .maybeSingle();

      if (readErr) throw new Error(readErr.message);

      // If the row doesn't exist yet, create it with quantity 0 then retry
      if (!row) {
        await this.createOrUpdate(articleId, siteId, 0);
        continue;
      }

      const currentQty: number = row.quantity ?? 0;
      const newQty = computeNewQuantity(currentQty);

      // Step 2 — Optional validation (e.g. refuse negative stock)
      if (validate) {
        validate(currentQty, newQty);
      }

      // Step 3 — Conditional UPDATE (compare-and-swap)
      // The WHERE clause includes `quantity = currentQty` so the update only
      // succeeds if nobody else changed the stock since our read.
      const { data: updated, error: updateErr } = await supabase
        .from(tables.stocksSites)
        .update({ quantity: newQty })
        .eq('id', row.id)
        .eq('quantity', currentQty)
        .select('id');

      if (updateErr) throw new Error(updateErr.message);

      if (updated && updated.length > 0) {
        // CAS succeeded — clamp defective count and return
        await clampDefectiveCountToStock(String(articleId), newQty);
        return newQty;
      }

      // Step 4 — CAS failed: another writer changed the stock → back off and retry
      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    throw new Error(STOCK_CONFLICT_ERROR);
  },

  async getQuantite(articleId: string | number, siteId: string | number): Promise<number | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.stocksSites)
      .select('quantity')
      .eq('articleId', articleId)
      .eq('siteId', siteId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.quantity ?? null;
  },

  async findByArticleAndSite(articleId: string | number, siteId: string | number): Promise<StockSite | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.stocksSites)
      .select(`*, Article:${tables.articles}(reference, name, minStock, unit)`)
      .eq('articleId', articleId)
      .eq('siteId', siteId)
      .maybeSingle();
    if (error) {
      // Fallback without join if foreign key isn't set up
      const { data: d2, error: e2 } = await supabase
        .from(tables.stocksSites)
        .select('*')
        .eq('articleId', articleId)
        .eq('siteId', siteId)
        .maybeSingle();
      if (e2) throw new Error(e2.message);
      return d2 ? mapRowToStockSite(d2 as StockRow) : null;
    }
    return data ? mapRowToStockSite(data as StockRow) : null;
  },

  async findBySite(siteId: string | number): Promise<StockSite[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.stocksSites)
      .select('*')
      .eq('siteId', siteId)
      .order('articleId');
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as StockRow[];
    // Filter to only active articles
    const articleIds = rows.map(r => r.articleId);
    if (articleIds.length === 0) return [];
    const { data: activeArticles } = await supabase
      .from(tables.articles)
      .select('id, reference, name, minStock, unit')
      .eq('isArchived', false)
      .in('id', articleIds);
    const articleMap = new Map<string, { reference: string; name: string; minStock: number; unit: string }>();
    for (const a of activeArticles ?? []) {
      articleMap.set(a.id, { reference: a.reference, name: a.name, minStock: a.minStock, unit: a.unit });
    }
    return rows
      .filter(r => articleMap.has(r.articleId))
      .map(r => mapRowToStockSite({ ...r, Article: articleMap.get(r.articleId) ?? null }));
  },

  async createOrUpdate(articleId: string | number, siteId: string | number, quantite: number): Promise<void> {
    const supabase = getSupabaseClient();
    const artId = String(articleId);
    const sId = String(siteId);
    console.log('[stockRepository.createOrUpdate] articleId:', artId, 'siteId:', sId, 'quantite:', quantite);

    // Vérifier si la row existe déjà
    const { data: existing } = await supabase
      .from(tables.stocksSites)
      .select('id')
      .eq('articleId', artId)
      .eq('siteId', sId)
      .maybeSingle();

    if (existing) {
      // Update la quantité
      const { error } = await supabase
        .from(tables.stocksSites)
        .update({ quantity: quantite })
        .eq('id', existing.id);
      if (error) {
        console.error('[stockRepository.createOrUpdate] Erreur update:', error.message);
        throw new Error(error.message);
      }
      console.log('[stockRepository.createOrUpdate] Update OK, id:', existing.id);
    } else {
      // Insert avec un nouvel ID généré
      const newId = `${artId}_${sId}_${Date.now()}`;
      const { error } = await supabase
        .from(tables.stocksSites)
        .insert({
          id: newId,
          articleId: artId,
          siteId: sId,
          quantity: quantite,
        });
      if (error) {
        console.error('[stockRepository.createOrUpdate] Erreur insert:', error.message);
        throw new Error(error.message);
      }
      console.log('[stockRepository.createOrUpdate] Insert OK, id:', newId);
    }

    await clampDefectiveCountToStock(artId, quantite);
  },

  async updateQuantite(articleId: string | number, siteId: string | number, quantite: number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(tables.stocksSites)
      .update({ quantity: quantite })
      .eq('articleId', articleId)
      .eq('siteId', siteId);
    if (error) throw new Error(error.message);

    await clampDefectiveCountToStock(String(articleId), quantite);
  },

  async initializeForArticle(articleId: string | number): Promise<void> {
    const supabase = getSupabaseClient();
    const { data: sites } = await supabase
      .from(tables.sites)
      .select('id')
      .eq('isActive', true);
    for (const site of sites ?? []) {
      await this.createOrUpdate(articleId, site.id, 0);
    }
  },

  async findLowStock(siteId: string | number): Promise<StockSite[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.stocksSites)
      .select('*')
      .eq('siteId', siteId);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as StockRow[];
    const articleIds = rows.map(r => r.articleId);
    if (articleIds.length === 0) return [];
    const { data: articles } = await supabase
      .from(tables.articles)
      .select('id, reference, name, minStock, unit')
      .eq('isArchived', false)
      .in('id', articleIds);
    const articleMap = new Map<string, { reference: string; name: string; minStock: number; unit: string }>();
    for (const a of articles ?? []) {
      articleMap.set(a.id, { reference: a.reference, name: a.name, minStock: a.minStock, unit: a.unit });
    }
    const low = rows
      .filter(r => {
        const art = articleMap.get(r.articleId);
        return art && r.quantity < (art.minStock ?? 0);
      })
      .map(r => mapRowToStockSite({ ...r, Article: articleMap.get(r.articleId) ?? null }));
    low.sort((a, b) => a.quantiteActuelle - b.quantiteActuelle);
    return low;
  },

  async getTotalBySite(siteId: string | number): Promise<{ totalArticles: number; totalQuantite: number }> {
    const supabase = getSupabaseClient();
    const { data: stocks } = await supabase
      .from(tables.stocksSites)
      .select('articleId, quantity')
      .eq('siteId', siteId);
    const articleIds = (stocks ?? []).map((s: { articleId: string }) => s.articleId);
    if (articleIds.length === 0) return { totalArticles: 0, totalQuantite: 0 };
    const { data: activeArticles } = await supabase
      .from(tables.articles)
      .select('id')
      .eq('isArchived', false)
      .in('id', articleIds);
    const actifIds = new Set((activeArticles ?? []).map((a: { id: string }) => a.id));
    let totalArticles = 0;
    let totalQuantite = 0;
    for (const s of stocks ?? []) {
      if (actifIds.has(s.articleId)) {
        totalArticles += 1;
        totalQuantite += s.quantity ?? 0;
      }
    }
    return { totalArticles, totalQuantite };
  },
};

export default stockRepository;
