// ============================================
// ARTICLE REPOSITORY - IT-Inventory Application
// Source unique : Supabase (plus de SQLite local)
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';
import { Article, ArticleForm, ArticleFilters, SyncStatus, PaginatedResult } from '@/types';
import { APP_CONFIG } from '@/constants';
import { getEffectiveSiteIds } from './siteRepository';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
  sousType: string | null;
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
    barcode: row.barcode ?? undefined,
    codeFamille: row.codeFamille ?? undefined,
    famille: row.category ?? undefined,
    typeArticle: row.articleType ?? undefined,
    sousType: row.sousType ?? undefined,
    marque: row.brand ?? undefined,
    modele: row.model ?? undefined,
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
  const siteIds = await getEffectiveSiteIds(siteId);
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from(tables.stocksSites)
    .select('articleId, quantity')
    .in('siteId', siteIds);
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    // Aggregate quantities across sub-sites
    map.set(row.articleId, (map.get(row.articleId) ?? 0) + (row.quantity ?? 0));
  }
  return map;
}

export const articleRepository = {
  async findAll(
    siteId: string | number,
    page: number = 0,
    limit: number = APP_CONFIG.pagination.defaultLimit,
    excludeTypeArticle?: string[],
  ): Promise<PaginatedResult<Article>> {
    const supabase = getSupabaseClient();
    const stockMap = await getStockMapForSite(siteId);
    const articleIds = Array.from(stockMap.keys());
    if (articleIds.length === 0) {
      return { data: [], total: 0, page, limit, hasMore: false };
    }
    let query = supabase
      .from(tables.articles)
      .select('*')
      .eq('isArchived', false)
      .in('id', articleIds);
    if (excludeTypeArticle && excludeTypeArticle.length > 0) {
      query = query.not('articleType', 'in', `(${excludeTypeArticle.map(t => `"${t}"`).join(',')})`);
    }
    const { data: articles, error } = await query.order('name');
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

    const siteIds = await getEffectiveSiteIds(siteId);
    const { data: stockRows } = await supabase
      .from(tables.stocksSites)
      .select('articleId, quantity')
      .in('siteId', siteIds);
    const stockMap = new Map<string, number>();
    for (const row of stockRows ?? []) {
      stockMap.set(row.articleId, (stockMap.get(row.articleId) ?? 0) + (row.quantity ?? 0));
    }
    const articleIds = Array.from(stockMap.keys());
    if (articleIds.length === 0) {
      return { data: [], total: 0, page, limit, hasMore: false };
    }

    query = query.in('id', articleIds);

    if (filters.searchQuery && filters.searchQuery.length >= APP_CONFIG.search.minSearchLength) {
      const q = `%${filters.searchQuery}%`;
      query = query.or(`reference.ilike.${q},name.ilike.${q},description.ilike.${q}`);
    }
    if (filters.codeFamille && filters.codeFamille.length > 0) query = query.in('codeFamille', filters.codeFamille);
    if (filters.famille && filters.famille.length > 0) query = query.in('category', filters.famille);
    if (filters.typeArticle && filters.typeArticle.length > 0) query = query.in('articleType', filters.typeArticle);
    if (filters.excludeTypeArticle && filters.excludeTypeArticle.length > 0) query = query.not('articleType', 'in', `(${filters.excludeTypeArticle.map(t => `"${t}"`).join(',')})`);
    if (filters.sousType && filters.sousType.length > 0) query = query.in('sousType', filters.sousType);
    if (filters.marque && filters.marque.length > 0) query = query.in('brand', filters.marque);
    if (filters.emplacement && filters.emplacement.length > 0) query = query.in('emplacement', filters.emplacement);

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
      const siteIds = await getEffectiveSiteIds(siteId);
      const { data: stockRows } = await supabase
        .from(tables.stocksSites)
        .select('quantity')
        .eq('articleId', id)
        .in('siteId', siteIds);
      quantite = (stockRows ?? []).reduce((sum, r) => sum + (r.quantity ?? 0), 0);
    }
    return mapRowToArticle({ ...data, quantite_actuelle: quantite } as ArticleRow);
  },

  async findByReference(reference: string, siteId?: string | number): Promise<Article | null> {
    const supabase = getSupabaseClient();

    // Si un site est sélectionné, ne retourner que l'article présent sur ce site
    if (siteId != null) {
      const siteIds = await getEffectiveSiteIds(siteId);
      // Récupérer les articles ayant du stock sur le site sélectionné
      const { data: stockRows } = await supabase
        .from(tables.stocksSites)
        .select('articleId, quantity')
        .in('siteId', siteIds);
      const stockMap = new Map<string, number>();
      for (const row of stockRows ?? []) {
        stockMap.set(row.articleId, (stockMap.get(row.articleId) ?? 0) + (row.quantity ?? 0));
      }
      const articleIdsOnSite = Array.from(stockMap.keys());
      if (articleIdsOnSite.length === 0) return null;

      const { data: rows, error } = await supabase
        .from(tables.articles)
        .select('*')
        .eq('reference', reference)
        .eq('isArchived', false)
        .in('id', articleIdsOnSite)
        .limit(1);
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) return null;
      const data = rows[0];
      const quantite = stockMap.get((data as ArticleRow).id) ?? 0;
      return mapRowToArticle({ ...data, quantite_actuelle: quantite } as ArticleRow);
    }

    // Sans site, retourner le premier article trouvé
    const { data: rows, error } = await supabase
      .from(tables.articles)
      .select('*')
      .eq('reference', reference)
      .eq('isArchived', false)
      .limit(1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return null;
    return mapRowToArticle(rows[0] as ArticleRow);
  },

  async findByReferenceOrBarcode(identifier: string, siteId?: string | number): Promise<Article | null> {
    const normalized = identifier.trim();
    if (!normalized) return null;

    const byReference = await this.findByReference(normalized, siteId);
    if (byReference) return byReference;

    const supabase = getSupabaseClient();

    if (siteId != null) {
      const siteIds = await getEffectiveSiteIds(siteId);
      const { data: stockRows } = await supabase
        .from(tables.stocksSites)
        .select('articleId, quantity')
        .in('siteId', siteIds);

      const stockMap = new Map<string, number>();
      for (const row of stockRows ?? []) {
        stockMap.set(row.articleId, (stockMap.get(row.articleId) ?? 0) + (row.quantity ?? 0));
      }

      const articleIdsOnSite = Array.from(stockMap.keys());
      if (articleIdsOnSite.length === 0) return null;

      const { data: rows, error } = await supabase
        .from(tables.articles)
        .select('*')
        .eq('barcode', normalized)
        .eq('isArchived', false)
        .in('id', articleIdsOnSite)
        .limit(1);
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) return null;

      const data = rows[0];
      const quantite = stockMap.get((data as ArticleRow).id) ?? 0;
      return mapRowToArticle({ ...data, quantite_actuelle: quantite } as ArticleRow);
    }

    const { data: rows, error } = await supabase
      .from(tables.articles)
      .select('*')
      .eq('barcode', normalized)
      .eq('isArchived', false)
      .limit(1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return null;
    return mapRowToArticle(rows[0] as ArticleRow);
  },

  async create(data: ArticleForm): Promise<string> {
    const supabase = getSupabaseClient();
    const newId = generateUUID();
    const fullPayload = {
      id: newId,
      reference: data.reference,
      name: data.nom,
      description: data.description ?? null,
      barcode: data.barcode ?? null,
      category: data.famille ?? null,
      codeFamille: data.codeFamille ?? null,
      articleType: data.typeArticle ?? null,
      sousType: data.sousType ?? null,
      brand: data.marque ?? null,
      model: data.modele ?? null,
      emplacement: data.emplacement ?? null,
      minStock: data.stockMini ?? 0,
      unit: data.unite ?? 'unité',
      imageUrl: data.photoUrl ?? null,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const basePayload = {
      id: newId,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let inserted: { id?: string } | null = null;
    let error: { message: string } | null = null;

    ({ data: inserted, error } = await supabase
      .from(tables.articles)
      .insert(fullPayload)
      .select('id')
      .single());

    if (error) {
      const msg = error.message.toLowerCase();
      const hasOptionalColumnIssue =
        msg.includes('model') || msg.includes('barcode') || msg.includes('soustype');

      if (hasOptionalColumnIssue) {
        ({ data: inserted, error } = await supabase
          .from(tables.articles)
          .insert(basePayload)
          .select('id')
          .single());
      }
    }

    if (error) throw new Error(error.message);
    return inserted?.id ?? '';
  },

  async update(id: string | number, data: Partial<ArticleForm>): Promise<void> {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (data.reference !== undefined) payload.reference = data.reference;
    if (data.nom !== undefined) payload.name = data.nom;
    if (data.description !== undefined) payload.description = data.description ?? null;
    if (data.barcode !== undefined) payload.barcode = data.barcode ?? null;
    if (data.codeFamille !== undefined) payload.codeFamille = data.codeFamille ?? null;
    if (data.famille !== undefined) payload.category = data.famille ?? null;
    if (data.typeArticle !== undefined) payload.articleType = data.typeArticle ?? null;
    if (data.sousType !== undefined) payload.sousType = data.sousType ?? null;
    if (data.marque !== undefined) payload.brand = data.marque ?? null;
    if (data.modele !== undefined) payload.model = data.modele ?? null;
    if (data.emplacement !== undefined) payload.emplacement = data.emplacement ?? null;
    if (data.stockMini !== undefined) payload.minStock = data.stockMini;
    if (data.unite !== undefined) payload.unit = data.unite;
    if (data.photoUrl !== undefined) payload.imageUrl = data.photoUrl ?? null;
    if (Object.keys(payload).length === 0) return;
    console.log('[articleRepository.update] id:', id, 'payload:', JSON.stringify(payload));
    let { error, data: updatedRows } = await supabase
      .from(tables.articles)
      .update(payload)
      .eq('id', id)
      .select('id');

    if (error) {
      const msg = error.message.toLowerCase();
      const hasOptionalColumnIssue =
        msg.includes('model') || msg.includes('barcode') || msg.includes('soustype');

      if (hasOptionalColumnIssue) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.model;
        delete fallbackPayload.barcode;
        delete fallbackPayload.sousType;

        if (Object.keys(fallbackPayload).length > 0) {
          ({ error, data: updatedRows } = await supabase
            .from(tables.articles)
            .update(fallbackPayload)
            .eq('id', id)
            .select('id'));
        }
      }
    }

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

  async getDistinctEmplacements(siteId: string | number): Promise<string[]> {
    const stockMap = await getStockMapForSite(siteId);
    const articleIds = Array.from(stockMap.keys());
    if (articleIds.length === 0) return [];
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from(tables.articles)
      .select('emplacement')
      .eq('isArchived', false)
      .in('id', articleIds)
      .not('emplacement', 'is', null);
    const set = new Set<string>();
    for (const row of data ?? []) {
      if (row.emplacement) set.add(row.emplacement);
    }
    return Array.from(set).sort();
  },

  async delete(id: string | number): Promise<void> {
    const supabase = getSupabaseClient();
    try {
      if (!id || String(id).trim() === '') {
        throw new Error('ID article invalide');
      }

      console.log('[articleRepository.delete] Suppression article id:', id);

      // Supprimer d'abord les stocks associés
      console.log('[articleRepository.delete] Suppression des stocks pour id:', id);
      const { error: stError } = await supabase
        .from(tables.stocksSites)
        .delete()
        .eq('articleId', id);
      if (stError) {
        console.error('[articleRepository.delete] Error deleting stocks:', stError.message, stError.details);
        // On continue même si les stocks ne sont pas supprimés
      } else {
        console.log('[articleRepository.delete] Stocks supprimés avec succès');
      }

      // Puis supprimer l'article
      console.log('[articleRepository.delete] Suppression de l\'article...');
      const { error, data: deletedRows } = await supabase
        .from(tables.articles)
        .delete()
        .eq('id', id)
        .select('id');

      if (error) {
        console.error('[articleRepository.delete] Erreur Supabase:', error.message, error.details, error.hint);
        throw new Error(`Erreur suppression: ${error.message}`);
      }

      if (!deletedRows || deletedRows.length === 0) {
        console.warn('[articleRepository.delete] Aucun article supprimé pour id:', id);
        throw new Error('Article non trouvé ou accès refusé');
      }

      console.log('[articleRepository.delete] Succès, articles supprimés:', deletedRows.length);
    } catch (err: any) {
      console.error('[articleRepository.delete] Error complète:', err);
      throw new Error(err?.message || "Erreur lors de la suppression de l'article");
    }
  },
};

export default articleRepository;
