// ============================================
// REF OPTIONS REPOSITORY - Code famille, Category, Article type
// IT-Inventory Application - Supabase
// No separate reference tables; derive from Article text fields.
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';

async function getDistinctValues(column: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(tables.articles)
    .select(column)
    .eq('isArchived', false);
  if (error) return [];
  const set = new Set<string>();
  for (const row of data ?? []) {
    const val = (row as unknown as Record<string, unknown>)[column];
    if (val && typeof val === 'string') set.add(val);
  }
  return Array.from(set).sort();
}

export const refOptionsRepository = {
  async findAllCodeFamilles(): Promise<string[]> {
    return getDistinctValues('codeFamille');
  },

  async createCodeFamille(_code: string): Promise<void> {
    // No-op: codeFamille is a text field on Article
  },

  async findAllFamilles(): Promise<{ value: string; label: string; icon: string; color: string; bgColor: string }[]> {
    const values = await getDistinctValues('category');
    return values.map(v => ({
      value: v,
      label: v,
      icon: 'shape-outline',
      color: '#8B5CF6',
      bgColor: '#8B5CF615',
    }));
  },

  async createFamille(_value: string, _label?: string): Promise<void> {
    // No-op
  },

  async findAllTypesArticle(): Promise<{ value: string; label: string; icon: string; color: string }[]> {
    const values = await getDistinctValues('articleType');
    return values.map(v => ({
      value: v,
      label: v,
      icon: 'tag-outline',
      color: '#6366F1',
    }));
  },

  async createTypeArticle(_value: string, _label?: string): Promise<void> {
    // No-op
  },
};
