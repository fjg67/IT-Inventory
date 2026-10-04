import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArticleFilters } from '@/types';

const KEY = '@it-inventory/saved-filters';
export interface SavedArticleFilter { id: string; name: string; filters: ArticleFilters; createdAt: string; }

export const savedFiltersService = {
  async list(): Promise<SavedArticleFilter[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) as SavedArticleFilter[]; } catch { return []; }
  },
  async save(name: string, filters: ArticleFilters): Promise<SavedArticleFilter> {
    const items = await this.list();
    const item = { id: `filter-${Date.now()}`, name: name.trim() || 'Filtre sans nom', filters, createdAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEY, JSON.stringify([item, ...items]));
    return item;
  },
  async remove(id: string): Promise<void> {
    const items = await this.list();
    await AsyncStorage.setItem(KEY, JSON.stringify(items.filter(item => item.id !== id)));
  },
};
export default savedFiltersService;
