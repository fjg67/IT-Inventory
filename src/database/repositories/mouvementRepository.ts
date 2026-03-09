// ============================================
// MOUVEMENT REPOSITORY - IT-Inventory Application
// Source unique : Supabase (plus de SQLite local)
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';
import {
  Mouvement,
  MouvementType,
  MouvementStockForm,
  TransfertForm,
  SyncStatus,
  PaginatedResult,
} from '@/types';
import { APP_CONFIG, ERROR_MESSAGES } from '@/constants';
import { stockRepository } from './stockRepository';
import { getEffectiveSiteIds } from './siteRepository';

/** Generate a simple UUID v4 (text) for StockMovement rows */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Supabase StockMovement table columns:
 * id (text), type (MovementType), quantity (int4), reason (text),
 * articleId (text), fromSiteId (text), toSiteId (text),
 * userId (text), createdAt (timestamp)
 */
interface MouvementRow {
  id: string;
  articleId: string;
  fromSiteId: string;
  toSiteId: string | null;
  type: string;
  quantity: number;
  userId: string;
  createdAt: string;
  reason: string | null;
  Article?: { reference: string; name: string } | null;
  User?: { name: string } | null;
  FromSite?: { name: string } | null;
  ToSite?: { name: string } | null;
}

// Mapping DB types (ENTRY/EXIT/ADJUSTMENT/TRANSFER) <-> App types (entree/sortie/ajustement/transfert_*)
const DB_TYPE_TO_APP: Record<string, MouvementType> = {
  ENTRY: MouvementType.ENTREE,
  EXIT: MouvementType.SORTIE,
  ADJUSTMENT: MouvementType.AJUSTEMENT,
  TRANSFER: MouvementType.TRANSFERT_DEPART,
  // Also support lowercase/app types already stored
  entree: MouvementType.ENTREE,
  sortie: MouvementType.SORTIE,
  ajustement: MouvementType.AJUSTEMENT,
  transfert_depart: MouvementType.TRANSFERT_DEPART,
  transfert_arrivee: MouvementType.TRANSFERT_ARRIVEE,
};

const APP_TYPE_TO_DB: Record<string, string> = {
  [MouvementType.ENTREE]: 'ENTRY',
  [MouvementType.SORTIE]: 'EXIT',
  [MouvementType.AJUSTEMENT]: 'ADJUSTMENT',
  [MouvementType.TRANSFERT_DEPART]: 'TRANSFER',
  [MouvementType.TRANSFERT_ARRIVEE]: 'TRANSFER',
};

function mapDbTypeToApp(dbType: string): MouvementType {
  return DB_TYPE_TO_APP[dbType] ?? MouvementType.ENTREE;
}

function mapAppTypeToDb(appType: string): string {
  return APP_TYPE_TO_DB[appType] ?? appType;
}

function mapRowToMouvement(row: MouvementRow, stockAvant = 0, stockApres = 0): Mouvement {
  return {
    id: row.id as any,
    articleId: row.articleId as any,
    siteId: row.fromSiteId as any,
    type: mapDbTypeToApp(row.type),
    quantite: row.quantity,
    stockAvant,
    stockApres,
    technicienId: row.userId as any,
    dateMouvement: new Date(row.createdAt),
    commentaire: row.reason ?? undefined,
    transfertVersSiteId: (row.toSiteId ?? undefined) as any,
    syncStatus: SyncStatus.SYNCED,
    site: row.FromSite
      ? {
          id: row.fromSiteId as any,
          nom: row.FromSite.name,
          adresse: '',
          actif: true,
          dateCreation: new Date(),
          dateModification: new Date(),
          syncStatus: SyncStatus.SYNCED,
        }
      : undefined,
    transfertVersSite: row.ToSite
      ? {
          id: (row.toSiteId ?? '') as any,
          nom: row.ToSite.name,
          adresse: '',
          actif: true,
          dateCreation: new Date(),
          dateModification: new Date(),
          syncStatus: SyncStatus.SYNCED,
        }
      : undefined,
    article: row.Article
      ? {
          id: row.articleId as any,
          reference: row.Article.reference,
          nom: row.Article.name,
          stockMini: 0,
          unite: '',
          actif: true,
          dateCreation: new Date(),
          dateModification: new Date(),
          syncStatus: SyncStatus.SYNCED,
        }
      : undefined,
    technicien: row.User
      ? {
          id: row.userId as any,
          nom: row.User.name,
          prenom: '',
          actif: true,
          dateCreation: new Date(),
        }
      : undefined,
  };
}

/**
 * Enrich movement rows with Article and User data (separate queries).
 * This avoids relying on Supabase foreign key joins.
 */
async function enrichWithRelations(rows: MouvementRow[]): Promise<MouvementRow[]> {
  if (rows.length === 0) return rows;
  const supabase = getSupabaseClient();

  // Collect unique IDs
  const articleIds = [...new Set(rows.map(r => r.articleId).filter(Boolean))];
  const userIds = [...new Set(rows.map(r => r.userId).filter(Boolean))];
  const siteIds = [...new Set([
    ...rows.map(r => r.fromSiteId).filter(Boolean),
    ...rows.map(r => r.toSiteId).filter((v): v is string => !!v),
  ])];

  // Fetch articles, users and sites in parallel
  const [articlesRes, usersRes, sitesRes] = await Promise.all([
    articleIds.length > 0
      ? supabase.from(tables.articles).select('id, reference, name').in('id', articleIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from(tables.techniciens).select('id, name').in('id', userIds)
      : Promise.resolve({ data: [] }),
    siteIds.length > 0
      ? supabase.from(tables.sites).select('id, name').in('id', siteIds)
      : Promise.resolve({ data: [] }),
  ]);

  const articleMap = new Map<string, { reference: string; name: string }>();
  for (const a of (articlesRes.data ?? []) as any[]) {
    articleMap.set(a.id, { reference: a.reference, name: a.name });
  }

  const userMap = new Map<string, { name: string }>();
  for (const u of (usersRes.data ?? []) as any[]) {
    userMap.set(u.id, { name: u.name });
  }

  const siteMap = new Map<string, { name: string }>();
  for (const s of (sitesRes.data ?? []) as any[]) {
    siteMap.set(s.id, { name: s.name });
  }

  // Attach to rows
  return rows.map(r => ({
    ...r,
    Article: articleMap.get(r.articleId) ?? null,
    User: userMap.get(r.userId) ?? null,
    FromSite: siteMap.get(r.fromSiteId) ?? null,
    ToSite: r.toSiteId ? siteMap.get(r.toSiteId) ?? null : null,
  }));
}

/**
 * Compute stockAvant / stockApres for a list of enriched rows.
 * Fetches current stock per article+site, then walks backwards (newest→oldest)
 * to calculate the stock level at each movement.
 */
async function computeStockLevels(rows: MouvementRow[]): Promise<Mouvement[]> {
  if (rows.length === 0) return [];
  const supabase = getSupabaseClient();

  // Collect unique article+site pairs
  const pairs = new Map<string, { articleId: string; siteId: string }>();
  for (const r of rows) {
    const key = `${r.articleId}|${r.fromSiteId}`;
    if (!pairs.has(key)) pairs.set(key, { articleId: r.articleId, siteId: r.fromSiteId });
  }

  // Fetch current stock for each pair
  const stockMap = new Map<string, number>();
  const pairArr = [...pairs.values()];
  if (pairArr.length > 0) {
    const articleIds = [...new Set(pairArr.map(p => p.articleId))];
    const siteIds = [...new Set(pairArr.map(p => p.siteId))];
    const { data } = await supabase
      .from(tables.stocksSites)
      .select('articleId, siteId, quantity')
      .in('articleId', articleIds)
      .in('siteId', siteIds);
    for (const s of (data ?? []) as any[]) {
      stockMap.set(`${s.articleId}|${s.siteId}`, s.quantity ?? 0);
    }
  }

  // Group rows by article+site (rows are already sorted newest→oldest)
  const groups = new Map<string, MouvementRow[]>();
  for (const r of rows) {
    const key = `${r.articleId}|${r.fromSiteId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  // For movements not in our page window, we need to account for newer movements
  // that happened after our newest row but are not in the list.
  // We fetch the sum of quantities for each article+site after the newest movement in our list.
  // Actually, simpler: current stock IS the stock after the very latest movement ever.
  // We walk newest→oldest: stockApres of newest = currentStock, stockAvant = stockApres - quantity, etc.
  // But our page may not start at the very latest movement. We need to subtract movements newer than our page.

  // For each group, fetch sum of quantities of movements newer than the newest in our list
  const stockAfterMap = new Map<string, number>();
  for (const [key, groupRows] of groups) {
    const { articleId, siteId } = pairs.get(key)!;
    const newestDate = groupRows[0].createdAt; // first = newest (desc order)
    const currentStock = stockMap.get(key) ?? 0;

    const { data: newerData } = await supabase
      .from(tables.mouvements)
      .select('quantity')
      .eq('articleId', articleId)
      .eq('fromSiteId', siteId)
      .gt('createdAt', newestDate);

    const newerSum = (newerData ?? []).reduce((sum: number, m: any) => sum + (m.quantity ?? 0), 0);
    stockAfterMap.set(key, currentStock - newerSum);
  }

  // Build result: walk newest→oldest per group, compute stockAvant/stockApres
  const resultMap = new Map<string, { stockAvant: number; stockApres: number }>();
  for (const [key, groupRows] of groups) {
    let running = stockAfterMap.get(key) ?? 0;
    for (const r of groupRows) {
      const stockApres = running;
      const stockAvant = running - r.quantity;
      resultMap.set(r.id, { stockAvant, stockApres });
      running = stockAvant;
    }
  }

  return rows.map(r => {
    const levels = resultMap.get(r.id) ?? { stockAvant: 0, stockApres: 0 };
    return mapRowToMouvement(r, levels.stockAvant, levels.stockApres);
  });
}

export const mouvementRepository = {
  async findAll(
    siteId?: string | number,
    page = 0,
    limit = APP_CONFIG.pagination.defaultLimit,
  ): Promise<PaginatedResult<Mouvement>> {
    const supabase = getSupabaseClient();
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from(tables.mouvements)
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (siteId) {
      const siteIds = await getEffectiveSiteIds(siteId);
      query = query.in('fromSiteId', siteIds);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    const total = count ?? 0;
    const enriched = await enrichWithRelations((data ?? []) as MouvementRow[]);
    return {
      data: await computeStockLevels(enriched),
      total,
      page,
      limit,
      hasMore: from + (data?.length ?? 0) < total,
    };
  },

  async findByArticle(
    articleId: string | number,
    siteId: string | number,
    limit = 20,
  ): Promise<Mouvement[]> {
    const supabase = getSupabaseClient();
    const siteIds = await getEffectiveSiteIds(siteId);
    const { data, error } = await supabase
      .from(tables.mouvements)
      .select('*')
      .eq('articleId', articleId)
      .in('fromSiteId', siteIds)
      .order('createdAt', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    const enriched = await enrichWithRelations((data ?? []) as MouvementRow[]);
    return computeStockLevels(enriched);
  },

  async findRecent(siteId?: string | number, limit = 10): Promise<Mouvement[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from(tables.mouvements)
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);
    if (siteId != null) {
      const siteIds = await getEffectiveSiteIds(siteId);
      query = query.in('fromSiteId', siteIds);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const enriched = await enrichWithRelations((data ?? []) as MouvementRow[]);
    return computeStockLevels(enriched);
  },

  async findToday(siteId?: string | number): Promise<Mouvement[]> {
    const supabase = getSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);
    const start = `${today}T00:00:00.000Z`;
    const end = `${today}T23:59:59.999Z`;
    let query = supabase
      .from(tables.mouvements)
      .select('*')
      .gte('createdAt', start)
      .lte('createdAt', end)
      .order('createdAt', { ascending: false });
    if (siteId != null) {
      const siteIds = await getEffectiveSiteIds(siteId);
      query = query.in('fromSiteId', siteIds);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const enriched = await enrichWithRelations((data ?? []) as MouvementRow[]);
    return computeStockLevels(enriched);
  },

  async countToday(siteId?: string | number): Promise<number> {
    const supabase = getSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);
    const start = `${today}T00:00:00.000Z`;
    const end = `${today}T23:59:59.999Z`;
    let query = supabase
      .from(tables.mouvements)
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', start)
      .lte('createdAt', end);
    if (siteId != null) {
      const siteIds = await getEffectiveSiteIds(siteId);
      query = query.in('fromSiteId', siteIds);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async create(data: MouvementStockForm, technicienId: string | number): Promise<string> {
    let stockActuel = await stockRepository.getQuantite(data.articleId, data.siteId);
    if (stockActuel === null) {
      await stockRepository.createOrUpdate(data.articleId, data.siteId, 0);
      stockActuel = 0;
    }
    const quantiteSignee = data.type === 'sortie' ? -data.quantite : data.quantite;
    const nouveauStock =
      data.type === 'ajustement' ? data.quantite : stockActuel + quantiteSignee;
    if (data.type === 'sortie' && nouveauStock < 0) {
      throw new Error(ERROR_MESSAGES.STOCK_INSUFFICIENT);
    }

    const supabase = getSupabaseClient();
    const newId = generateId();
    const { data: inserted, error: errInsert } = await supabase
      .from(tables.mouvements)
      .insert({
        id: newId,
        articleId: data.articleId,
        fromSiteId: data.siteId,
        type: mapAppTypeToDb(data.type),
        quantity: quantiteSignee,
        userId: technicienId,
        reason: data.commentaire ?? null,
      })
      .select('id')
      .single();
    if (errInsert) throw new Error(errInsert.message);

    await stockRepository.updateQuantite(data.articleId, data.siteId, nouveauStock);
    return inserted?.id ?? '';
  },

  async createTransfert(data: TransfertForm, technicienId: string | number): Promise<void> {
    const stockDepart = await stockRepository.getQuantite(data.articleId, data.siteDepartId);
    let stockArrivee = await stockRepository.getQuantite(data.articleId, data.siteArriveeId);
    if (stockDepart === null || stockDepart < data.quantite) {
      throw new Error(ERROR_MESSAGES.STOCK_INSUFFICIENT);
    }
    if (stockArrivee === null) {
      await stockRepository.createOrUpdate(data.articleId, data.siteArriveeId, 0);
      stockArrivee = 0;
    }
    const nouveauStockDepart = stockDepart - data.quantite;
    const nouveauStockArrivee = stockArrivee + data.quantite;

    const supabase = getSupabaseClient();
    await supabase.from(tables.mouvements).insert([
      {
        id: generateId(),
        articleId: data.articleId,
        fromSiteId: data.siteDepartId,
        type: 'TRANSFER',
        quantity: -data.quantite,
        userId: technicienId,
        toSiteId: data.siteArriveeId,
        reason: data.commentaire ?? null,
      },
      {
        id: generateId(),
        articleId: data.articleId,
        fromSiteId: data.siteArriveeId,
        type: 'TRANSFER',
        quantity: data.quantite,
        userId: technicienId,
        reason: data.commentaire ?? null,
      },
    ]);
    await stockRepository.updateQuantite(data.articleId, data.siteDepartId, nouveauStockDepart);
    await stockRepository.updateQuantite(data.articleId, data.siteArriveeId, nouveauStockArrivee);
  },

  async findByPeriod(
    siteId: string | number,
    dateDebut: Date,
    dateFin: Date,
    page = 0,
    limit = APP_CONFIG.pagination.defaultLimit,
  ): Promise<PaginatedResult<Mouvement>> {
    const supabase = getSupabaseClient();
    const from = page * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from(tables.mouvements)
      .select('*', { count: 'exact' })
      .gte('createdAt', dateDebut.toISOString())
      .lte('createdAt', dateFin.toISOString())
      .order('createdAt', { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    const total = count ?? 0;
    const enriched = await enrichWithRelations((data ?? []) as MouvementRow[]);
    return {
      data: await computeStockLevels(enriched),
      total,
      page,
      limit,
      hasMore: from + (data?.length ?? 0) < total,
    };
  },

  /**
   * Nombre de mouvements par jour sur les 7 derniers jours.
   */
  async getCountPerDayLast7(siteId: string | number): Promise<number[]> {
    const supabase = getSupabaseClient();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const siteIds = await getEffectiveSiteIds(siteId);

    const { data, error } = await supabase
      .from(tables.mouvements)
      .select('createdAt')
      .in('fromSiteId', siteIds)
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: true });

    if (error) {
      console.warn('[mouvementRepository] getCountPerDayLast7 error:', error.message);
      return Array(7).fill(0);
    }

    const countsByDay: Record<string, number> = {};
    for (const row of data ?? []) {
      const d = new Date(row.createdAt);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      countsByDay[dayKey] = (countsByDay[dayKey] ?? 0) + 1;
    }

    const result: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      result.push(countsByDay[dayKey] ?? 0);
    }

    return result;
  },
};

export default mouvementRepository;
