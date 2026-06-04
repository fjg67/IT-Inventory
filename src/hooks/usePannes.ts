import { useEffect, useState } from 'react';
import { getSupabaseClient, tables } from '@/api/supabase';
import { PCPanne } from '@/types/pc.types';

interface PanneCount {
  total: number;
  en_reparation: number;
  critique: number;
}

export const usePannes = (pcId?: string) => {
  const [pannes, setPannes] = useState<PCPanne[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPannes = async () => {
    if (!pcId) return;
    setIsLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error: queryError } = await supabase
        .from('PCPannes')
        .select('*')
        .eq('pc_id', pcId)
        .order('declared_at', { ascending: false });

      if (queryError) throw queryError;
      setPannes(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération des pannes';
      setError(message);
      console.error('[usePannes] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivePanne = (forPcId: string): PCPanne | undefined =>
    pannes.find(
      (p) =>
        p.pc_id === forPcId &&
        !['resolu', 'irreparable'].includes(p.statut_reparation),
    );

  const getPanneCount = (): PanneCount => ({
    total: pannes.filter(
      (p) => !['resolu', 'irreparable'].includes(p.statut_reparation),
    ).length,
    en_reparation: pannes.filter(
      (p) => p.statut_reparation === 'en_reparation',
    ).length,
    critique: pannes.filter(
      (p) =>
        p.priorite === 'critique' &&
        !['resolu', 'irreparable'].includes(p.statut_reparation),
    ).length,
  });

  const createPanne = async (panne: Omit<PCPanne, 'id' | 'declared_at' | 'updated_at'>) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error: insertError } = await supabase
        .from('PCPannes')
        .insert({
          ...panne,
          declared_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (insertError) throw insertError;
      if (data) {
        setPannes((prev) => [data, ...prev]);
      }
      return data;
    } catch (err) {
      console.error('[usePannes] Create error:', err);
      throw err;
    }
  };

  const updatePanne = async (panneId: string, updates: Partial<PCPanne>) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error: updateError } = await supabase
        .from('PCPannes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', panneId)
        .select('*')
        .single();

      if (updateError) throw updateError;
      if (data) {
        setPannes((prev) =>
          prev.map((p) => (p.id === panneId ? data : p)),
        );
      }
      return data;
    } catch (err) {
      console.error('[usePannes] Update error:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (pcId) {
      fetchPannes();
    }
  }, [pcId]);

  return {
    pannes,
    isLoading,
    error,
    fetchPannes,
    getActivePanne,
    getPanneCount,
    createPanne,
    updatePanne,
  };
};
