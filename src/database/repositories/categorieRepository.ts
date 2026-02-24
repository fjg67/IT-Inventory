// ============================================
// CATEGORIE REPOSITORY - IT-Inventory Application
// No separate 'categories' table in Supabase.
// Category is a text field directly on Article.
// This stub derives distinct categories from Article.category.
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';
import { Categorie, SyncStatus } from '@/types';

function makeCategorie(name: string, idx: number): Categorie {
  return {
    id: name,
    nom: name,
    ordre: idx,
    syncStatus: SyncStatus.SYNCED,
  };
}

export const categorieRepository = {
  async findAll(): Promise<Categorie[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.articles)
      .select('category')
      .eq('isArchived', false);
    if (error) return [];
    const set = new Set<string>();
    for (const row of data ?? []) {
      if (row.category) set.add(row.category);
    }
    return Array.from(set).sort().map((c, i) => makeCategorie(c, i));
  },

  async findRoots(): Promise<Categorie[]> {
    return this.findAll();
  },

  async findByParent(_parentId: string | number): Promise<Categorie[]> {
    return [];
  },

  async findById(id: string | number): Promise<Categorie | null> {
    const all = await this.findAll();
    return all.find(c => c.id === id) ?? null;
  },

  async getTree(): Promise<Categorie[]> {
    return this.findAll();
  },

  async create(_data: Omit<Categorie, 'id' | 'syncStatus'>): Promise<string> {
    // No-op: categories are text on Article
    return '';
  },

  async update(_id: string | number, _data: Partial<Omit<Categorie, 'id'>>): Promise<void> {
    // No-op
  },

  async delete(_id: string | number): Promise<void> {
    // No-op
  },
};

export default categorieRepository;
