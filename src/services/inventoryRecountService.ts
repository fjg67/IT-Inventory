// ============================================
// INVENTORY RECOUNT SERVICE
// Enregistrement des inventaires complets
// ============================================

import { getSupabaseClient, tables } from '@/api/supabase';

export interface InventoryRecount {
  id: string;
  siteId: string;
  siteName: string;
  technicianId: string;
  technicianName: string;
  recountDate: string;
  articleCount: number | null;
  notes: string | null;
}

export const InventoryRecountService = {
  async record(params: {
    siteId: string;
    siteName: string;
    technicianId: string;
    technicianName: string;
    articleCount?: number;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from(tables.inventoryRecount).insert({
        siteId: params.siteId,
        siteName: params.siteName,
        technicianId: params.technicianId,
        technicianName: params.technicianName,
        articleCount: params.articleCount ?? null,
        notes: params.notes || null,
      });
      if (error) {
        console.error('[InventoryRecount] Insert error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error('[InventoryRecount] Error:', e);
      return { success: false, error: (e as Error).message };
    }
  },

  async getHistory(siteId?: string, limit: number = 20): Promise<InventoryRecount[]> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from(tables.inventoryRecount)
        .select('*')
        .order('recountDate', { ascending: false })
        .limit(limit);

      if (siteId) {
        query = query.eq('siteId', siteId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[InventoryRecount] Fetch error:', error);
        return [];
      }
      return (data ?? []) as InventoryRecount[];
    } catch (e) {
      console.error('[InventoryRecount] Error:', e);
      return [];
    }
  },

  async getLastRecount(siteId: string): Promise<InventoryRecount | null> {
    const results = await this.getHistory(siteId, 1);
    return results.length > 0 ? results[0] : null;
  },
};
