import { getSupabaseClient } from '@/api/supabase';
import { PCPanne } from '@/types/pc.types';

class PanneRepository {
  private readonly tableName = 'PCPannes';

  async getPannesForPC(pcId: string): Promise<PCPanne[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('pc_id', pcId)
        .order('declared_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      console.error('[PanneRepository.getPannesForPC]', error);
      return [];
    }
  }

  async getActivePanne(pcId: string): Promise<PCPanne | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('pc_id', pcId)
        .not('statut_reparation', 'in', '("resolu", "irreparable")')
        .order('declared_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    } catch (error) {
      console.error('[PanneRepository.getActivePanne]', error);
      return null;
    }
  }

  async createPanne(panne: Omit<PCPanne, 'id' | 'declared_at' | 'updated_at'>): Promise<PCPanne | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          ...panne,
          declared_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return data ?? null;
    } catch (error) {
      console.error('[PanneRepository.createPanne]', error);
      throw error;
    }
  }

  async updatePanne(panneId: string, updates: Partial<PCPanne>): Promise<PCPanne | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', panneId)
        .select('*')
        .single();

      if (error) throw error;
      return data ?? null;
    } catch (error) {
      console.error('[PanneRepository.updatePanne]', error);
      throw error;
    }
  }

  async getPanneCount(siteFilter?: string): Promise<{ total: number; en_reparation: number; critique: number }> {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from(this.tableName)
        .select('id, statut_reparation, priorite', { count: 'exact' })
        .not('statut_reparation', 'in', '("resolu", "irreparable")');

      if (siteFilter) {
        // This would require joining with pc_portables - adjust as needed
        // For now, we'll just count all active pannes
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const pannes = data ?? [];
      return {
        total: count ?? 0,
        en_reparation: pannes.filter((p) => p.statut_reparation === 'en_reparation').length,
        critique: pannes.filter((p) => p.priorite === 'critique').length,
      };
    } catch (error) {
      console.error('[PanneRepository.getPanneCount]', error);
      return { total: 0, en_reparation: 0, critique: 0 };
    }
  }
}

export const panneRepository = new PanneRepository();
