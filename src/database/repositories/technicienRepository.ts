// ============================================
// TECHNICIEN REPOSITORY - IT-Inventory Application
// Source unique : Supabase (plus de SQLite local)
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';
import { Technicien } from '@/types';

interface TechnicienRow {
  id: string;
  technicianId: string | null;
  name: string;
  password?: string;
}

function mapRowToTechnicien(row: TechnicienRow): Technicien {
  // Split "Prénom Nom" into separate fields
  const parts = (row.name ?? '').trim().split(/\s+/);
  const prenom = parts[0] || '';
  const nom = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return {
    id: row.id,
    nom: nom || prenom, // If single word, use it as nom
    prenom: nom ? prenom : '', // Only set prenom if we have both parts
    matricule: row.technicianId ?? undefined,
    actif: true,
    dateCreation: new Date(),
  };
}

export const technicienRepository = {
  async findAll(): Promise<Technicien[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.techniciens)
      .select('id, technicianId, name')
      .neq('technicianId', 'administrateur')
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToTechnicien);
  },

  async findById(id: string | number): Promise<Technicien | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.techniciens)
      .select('id, technicianId, name')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRowToTechnicien(data) : null;
  },

  async findByMatricule(matricule: string): Promise<Technicien | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.techniciens)
      .select('id, technicianId, name')
      .eq('technicianId', matricule)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRowToTechnicien(data) : null;
  },

  async create(data: Omit<Technicien, 'id' | 'dateCreation' | 'actif'>): Promise<number> {
    const supabase = getSupabaseClient();
    const { data: inserted, error } = await supabase
      .from(tables.techniciens)
      .insert({
        name: data.nom,
        technicianId: data.matricule ?? null,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return inserted?.id ?? 0;
  },

  async update(id: number, data: Partial<Omit<Technicien, 'id'>>): Promise<void> {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (data.nom !== undefined) payload.name = data.nom;
    if (data.matricule !== undefined) payload.technicianId = data.matricule ?? null;
    if (Object.keys(payload).length === 0) return;
    const { error } = await supabase.from(tables.techniciens).update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deactivate(id: number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(tables.techniciens)
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async count(): Promise<number> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from(tables.techniciens)
      .select('*', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

export default technicienRepository;
