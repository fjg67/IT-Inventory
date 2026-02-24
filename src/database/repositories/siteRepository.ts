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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapRowToSite(row: SiteRow): Site {
  return {
    id: row.id as any,
    code: row.id, // no separate code column, use id
    nom: row.name,
    adresse: row.address ?? undefined,
    actif: Boolean(row.isActive),
    dateCreation: new Date(row.createdAt),
    syncStatus: SyncStatus.SYNCED,
  };
}

export const siteRepository = {
  async findAll(): Promise<Site[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.sites)
      .select('*')
      .eq('isActive', true)
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
