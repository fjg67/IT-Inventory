// ============================================
// ARTICLE REPOSITORY - IT-Inventory Application
// Source unique : Supabase (plus de SQLite local)
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';
import { Article, ArticleForm, ArticleFilters, SyncStatus, PaginatedResult } from '@/types';
import { APP_CONFIG } from '@/constants';

/**
 * Supabase Article table columns:
 * id (text), reference (text), name (text), description (text),
 * category (text), brand (text), model (text), barcode (text),
 * imageUrl (text), unit (text), minStock (int4), isArchived (bool),
 * createdAt (timestamp), updatedAt (timestamp), articleType (text),
 * codeFamille (text), emplacement (text)
 */
interface ArticleRow {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  category: string | null;
  codeFamille: string | null;
  articleType: string | null;
  brand: string | null;
  model: string | null;
  barcode: string | null;
  emplacement: string | null;
  minStock: number;
  unit: string;
  imageUrl: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  quantite_actuelle?: number;
}

function mapRowToArticle(row: ArticleRow): Article {
  return {
    id: row.id as any,
    reference: row.reference,
    nom: row.name,
    description: row.description ?? undefined,
    codeFamille: row.codeFamille ?? undefined,
    famille: row.category ?? undefined,
    typeArticle: row.articleType ?? undefined,
    marque: row.brand ?? undefined,
    emplacement: row.emplacement ?? undefined,
    stockMini: row.minStock ?? 0,
    unite: row.unit ?? 'unité',
    photoUrl: row.imageUrl ?? undefined,
    actif: !row.isArchived,
    dateCreation: new Date(row.createdAt),
    dateModification: new Date(row.updatedAt ?? row.createdAt),
    syncStatus: SyncStatus.SYNCED,
    quantiteActuelle: row.quantite_actuelle,
  };
}

async function getStockMapForSite(siteId: string | number): Promise<Map<string, number>> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from(tables.stocksSites)
    .select('articleId, quantity')
    .eq('siteId', siteId);
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.articleId, row.quantity ?? 0);
  }
  return map;
}

export const articleRepository = {
  async findAll(
    siteId: string | number,
    page: number = 0,
    limit: number = APP_CONFIG.pagination.defaultLimit,
  ): Promise<PaginatedResult<Article>> {
    const supabase = getSupabaseClient();
    const stockMap = await getStockMapForSite(siteId);
    const articleIds = Array.from(stockMap.keys());
    if (articleIds.length === 0) {
      return { data: [], total: 0, page, limit, hasMore: false };
    }
    const { data: articles, error } = await supabase
      .from(tables.articles)
      .select('*')
      .eq('isArchived', false)
      .in('id', articleIds)
      .order('name');
    if (error) throw new Error(error.message);
    const withQty = (articles ?? []).map((a: ArticleRow) => ({
      ...a,
      quantite_actuelle: stockMap.get(a.id) ?? 0,
    }));
    const total = withQty.length;
    const offset = page * limit;
    const paginated = withQty.slice(offset, offset + limit);
    return {
      data: paginated.map(mapRowToArticle),
      total,
      page,
      limit,
      hasMore: offset + paginated.length < total,
    };
  },

  async search(
    siteId: string | number,
    filters: ArticleFilters,
    page: number = 0,
    limit: number = APP_CONFIG.pagination.defaultLimit,
  ): Promise<PaginatedResult<Article>> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from(tables.articles)
      .select('*')
      .eq('isArchived', false);

    const { data: stockRows } = await supabase
      .from(tables.stocksSites)
      .select('articleId, quantity')
      .eq('siteId', siteId);
    const stockMap = new Map<string, number>();
    for (const row of stockRows ?? []) {
      stockMap.set(row.articleId, row.quantity ?? 0);
    }
    const articleIds = Array.from(stockMap.keys());
    if (articleIds.length === 0) {
      return { data: [], total: 0, page, limit, hasMore: false };
    }

    query = query.in('id', articleIds);

    if (filters.searchQuery && filters.searchQuery.length >= APP_CONFIG.search.minSearchLength) {
      const q = `%${filters.searchQuery}%`;
      query = query.or(`reference.ilike.${q},name.ilike.${q}`);
    }
    if (filters.codeFamille) query = query.eq('codeFamille', filters.codeFamille);
    if (filters.famille) query = query.eq('category', filters.famille);
    if (filters.typeArticle) query = query.eq('articleType', filters.typeArticle);
    if (filters.marque) query = query.eq('brand', filters.marque);
    if (filters.emplacement) query = query.eq('emplacement', filters.emplacement);

    const { data: articles, error } = await query.order('name');
    if (error) throw new Error(error.message);

    let withQty = (articles ?? []).map((a: ArticleRow) => ({
      ...a,
      quantite_actuelle: stockMap.get(a.id) ?? 0,
    }));

    if (filters.stockFaible) {
      withQty = withQty.filter(a => (a.quantite_actuelle ?? 0) < (a.minStock ?? 0));
    }

    const total = withQty.length;
    const offset = page * limit;
    const paginated = withQty.slice(offset, offset + limit);
    return {
      data: paginated.map(mapRowToArticle),
      total,
      page,
      limit,
      hasMore: offset + paginated.length < total,
    };
  },

  async findById(id: string | number, siteId?: string | number): Promise<Article | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.articles)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    let quantite: number | undefined;
    if (siteId != null) {
      const { data: stock } = await supabase
        .from(tables.stocksSites)
        .select('quantity')
        .eq('articleId', id)
        .eq('siteId', siteId)
        .maybeSingle();
      quantite = stock?.quantity ?? 0;
    }
    return mapRowToArticle({ ...data, quantite_actuelle: quantite } as ArticleRow);
  },

  async findByReference(reference: string, siteId?: string | number): Promise<Article | null> {
    const supabase = getSupabaseClient();
    const { data: rows, error } = await supabase
      .from(tables.articles)
      .select('*')
      .eq('reference', reference)
      .eq('isArchived', false)
      .limit(1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return null;
    const data = rows[0];
    let quantite: number | undefined;
    if (siteId != null) {
      const { data: stock } = await supabase
        .from(tables.stocksSites)
        .select('quantity')
        .eq('articleId', (data as ArticleRow).id)
        .eq('siteId', siteId)
        .maybeSingle();
      quantite = stock?.quantity ?? 0;
    }
    return mapRowToArticle({ ...data, quantite_actuelle: quantite } as ArticleRow);
  },

  async create(data: ArticleForm): Promise<string> {
    const supabase = getSupabaseClient();
    const { data: inserted, error } = await supabase
      .from(tables.articles)
      .insert({
        reference: data.reference,
        name: data.nom,
        description: data.description ?? null,
        category: data.famille ?? null,
        codeFamille: data.codeFamille ?? null,
        articleType: data.typeArticle ?? null,
        brand: data.marque ?? null,
        emplacement: data.emplacement ?? null,
        minStock: data.stockMini ?? 0,
        unit: data.unite ?? 'unité',
        imageUrl: data.photoUrl ?? null,
        isArchived: false,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return inserted?.id ?? '';
  },

  async update(id: string | number, data: Partial<ArticleForm>): Promise<void> {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (data.reference !== undefined) payload.reference = data.reference;
    if (data.nom !== undefined) payload.name = data.nom;
    if (data.description !== undefined) payload.description = data.description ?? null;
    if (data.codeFamille !== undefined) payload.codeFamille = data.codeFamille ?? null;
    if (data.famille !== undefined) payload.category = data.famille ?? null;
    if (data.typeArticle !== undefined) payload.articleType = data.typeArticle ?? null;
    if (data.sousType !== undefined) payload.sousType = data.sousType ?? null;
    if (data.marque !== undefined) payload.brand = data.marque ?? null;
    if (data.emplacement !== undefined) payload.emplacement = data.emplacement ?? null;
    if (data.stockMini !== undefined) payload.minStock = data.stockMini;
    if (data.unite !== undefined) payload.unit = data.unite;
    if (data.photoUrl !== undefined) payload.imageUrl = data.photoUrl ?? null;
    if (Object.keys(payload).length === 0) return;
    console.log('[articleRepository.update] id:', id, 'payload:', JSON.stringify(payload));
    const { error, data: updatedRows } = await supabase
      .from(tables.articles)
      .update(payload)
      .eq('id', id)
      .select('id');
    if (error) {
      console.error('[articleRepository.update] Erreur Supabase:', error.message, error.details, error.hint);
      throw new Error(error.message);
    }
    if (!updatedRows || updatedRows.length === 0) {
      console.warn('[articleRepository.update] Aucune row mise à jour pour id:', id, '- vérifier RLS policies');
      throw new Error('Mise à jour impossible : article non trouvé ou accès refusé (RLS)');
    }
    console.log('[articleRepository.update] Succès, rows:', updatedRows.length);
  },

  async deactivate(id: string | number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(tables.articles).update({ isArchived: true }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async findLowStock(siteId: string | number): Promise<Article[]> {
    const stockMap = await getStockMapForSite(siteId);
    const supabase = getSupabaseClient();
    const articleIds = Array.from(stockMap.keys());
    if (articleIds.length === 0) return [];
    const { data: articles, error } = await supabase
      .from(tables.articles)
      .select('*')
      .eq('isArchived', false)
      .in('id', articleIds);
    if (error) throw new Error(error.message);
    const low = (articles ?? []).filter(
      (a: ArticleRow) => (stockMap.get(a.id) ?? 0) < (a.minStock ?? 0)
    );
    low.sort((a: ArticleRow, b: ArticleRow) => (stockMap.get(a.id) ?? 0) - (stockMap.get(b.id) ?? 0));
    return low.map((a: ArticleRow) =>
      mapRowToArticle({ ...a, quantite_actuelle: stockMap.get(a.id) ?? 0 })
    );
  },

  async countLowStock(siteId: string | number): Promise<number> {
    const stockMap = await getStockMapForSite(siteId);
    const supabase = getSupabaseClient();
    const articleIds = Array.from(stockMap.keys());
    if (articleIds.length === 0) return 0;
    const { data: articles } = await supabase
      .from(tables.articles)
      .select('id, minStock')
      .eq('isArchived', false)
      .in('id', articleIds);
    let count = 0;
    for (const a of articles ?? []) {
      if ((stockMap.get(a.id) ?? 0) < (a.minStock ?? 0)) count++;
    }
    return count;
  },
};

export default articleRepository;
