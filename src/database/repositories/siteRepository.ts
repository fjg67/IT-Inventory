// ============================================
// SITE REPOSITORY - IT-Inventory Application
// Source unique : Supabase (plus de SQLite local)
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';
import { Site, SyncStatus } from '@/types';

/**
 * Supabase Site table columns:
 * id (text), name (text), address (text), isActive (bool),
 * createdAt (timestamp), updatedAt (timestamp)
 */
interface SiteRow {
  id: string;
  name: string;
  address: string | null;
  edsNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapRowToSite(row: SiteRow): Site {
  return {
    id: row.id as any,
    code: row.id,
    nom: row.name,
    adresse: row.address ?? undefined,
    edsNumber: row.edsNumber ?? undefined,
    actif: Boolean(row.isActive),
    dateCreation: row.createdAt,
    syncStatus: SyncStatus.SYNCED,
  };
}

// ---- Cache des sous-sites (parentSiteId) ----
let _childSiteCache: Record<string, { ids: string[]; ts: number }> = {};
const CHILD_CACHE_TTL = 5 * 60 * 1000; // 5 min

/**
 * Renvoie les IDs des sous-sites rattachés à un site parent.
 * Si le site n'a pas de sous-sites, renvoie [siteId] lui-même.
 * Résultat mis en cache 5 min.
 */
export async function getEffectiveSiteIds(siteId: string | number): Promise<string[]> {
  const key = String(siteId);
  const cached = _childSiteCache[key];
  if (cached && Date.now() - cached.ts < CHILD_CACHE_TTL) {
    return cached.ids;
  }
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from(tables.sites)
    .select('id')
    .eq('parentSiteId', key);
  const ids = data && data.length > 0 ? data.map((s: any) => s.id) : [key];
  _childSiteCache[key] = { ids, ts: Date.now() };
  return ids;
}

/** Invalider le cache (ex. après changement de site) */
export function clearEffectiveSiteIdsCache() {
  _childSiteCache = {};
}

/** Renvoie les sous-sites (objets Site complets) d'un site parent */
export async function findChildSites(parentSiteId: string | number): Promise<Site[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(tables.sites)
    .select('*')
    .eq('parentSiteId', String(parentSiteId))
    .order('name');
  if (error) return [];
  return (data ?? []).map(mapRowToSite);
}

/** Renvoie les sites frères (même parent) d'un site donné, ou ses enfants s'il est parent */
export async function findSiblingsOrChildren(siteId: string | number): Promise<Site[]> {
  const supabase = getSupabaseClient();
  // D'abord, chercher le parentSiteId du site actuel
  const { data: current } = await supabase
    .from(tables.sites)
    .select('parentSiteId')
    .eq('id', String(siteId))
    .maybeSingle();

  if (current?.parentSiteId) {
    // Le site est un sous-site → charger les frères (enfants du même parent)
    return findChildSites(current.parentSiteId);
  }
  // Le site est un parent → charger ses enfants
  return findChildSites(siteId);
}

export const siteRepository = {
  async findAll(): Promise<Site[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.sites)
      .select('*')
      .eq('isActive', true)
      .is('parentSiteId', null)
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToSite);
  },

  async findById(id: string | number): Promise<Site | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.sites)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRowToSite(data) : null;
  },

  async findByCode(code: string): Promise<Site | null> {
    // No separate code column; search by id or name
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.sites)
      .select('*')
      .eq('id', code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRowToSite(data) : null;
  },

  async create(data: Omit<Site, 'id' | 'dateCreation' | 'syncStatus'>): Promise<string> {
    const supabase = getSupabaseClient();
    const { data: inserted, error } = await supabase
      .from(tables.sites)
      .insert({
        name: data.nom,
        address: data.adresse ?? null,
        edsNumber: data.edsNumber ?? null,
        isActive: data.actif,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return inserted?.id ?? '';
  },

  async update(id: string | number, data: Partial<Omit<Site, 'id'>>): Promise<void> {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (data.nom !== undefined) payload.name = data.nom;
    if (data.adresse !== undefined) payload.address = data.adresse ?? null;
    if (data.edsNumber !== undefined) payload.edsNumber = data.edsNumber ?? null;
    if (data.actif !== undefined) payload.isActive = data.actif;
    if (Object.keys(payload).length === 0) return;
    const { error } = await supabase.from(tables.sites).update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deactivate(id: string | number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(tables.sites)
      .update({ isActive: false })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async count(): Promise<number> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from(tables.sites)
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

export default siteRepository;
