// ============================================
// PC Types - Pannes et statuts
// ============================================

export type PCStatus = 'a_chaud' | 'a_reusiner' | 'en_usinage' | 'disponible' | 'envoye' | 'en_panne';

export type PanneType = 'materielle' | 'logicielle' | 'batterie' | 'reseau' | 'autre';
export type PannePriorite = 'basse' | 'moyenne' | 'haute' | 'critique';
export type PanneStatutReparation = 'en_attente' | 'en_reparation' | 'resolu' | 'irreparable';

// ==================== INTERFACES ====================

export interface PC {
  id: string;
  hostname: string;
  display_name?: string | null;
  asset?: string;
  model?: string;
  status: PCStatus;
  site?: string;
  updatedAt?: string;
}

export const getPCDisplayName = (pc: PC): string => pc.display_name?.trim() || pc.hostname;

export const hasPCDisplayName = (pc: PC): boolean => Boolean(pc.display_name?.trim());

export interface PCPanne {
  id: string;
  pc_id: string;
  type_panne: PanneType;
  description: string;
  priorite: PannePriorite;
  statut_reparation: PanneStatutReparation;
  ticket_sav?: string;
  technicien_id?: string;
  note_resolution?: string;
  resolu_par?: string;
  resolu_at?: string;
  declared_at: string;
  updated_at: string;
}

// ==================== CONFIGS ====================

export const PANNE_TYPE_CONFIG: Record<PanneType, { label: string; icon: string; color: string }> = {
  materielle: { label: 'Matérielle', icon: 'wrench-outline', color: '#EF4444' },
  logicielle: { label: 'Logicielle', icon: 'cog-outline', color: '#8B5CF6' },
  batterie: { label: 'Batterie', icon: 'battery-off', color: '#F59E0B' },
  reseau: { label: 'Réseau', icon: 'wifi-off', color: '#3B82F6' },
  autre: { label: 'Autre', icon: 'help-circle', color: '#6B7280' },
};

export const PRIORITE_CONFIG: Record<PannePriorite, { label: string; color: string; subtle: string; border: string }> = {
  basse: {
    label: 'Basse',
    color: '#6B7280',
    subtle: 'rgba(107, 114, 128, 0.10)',
    border: 'rgba(107, 114, 128, 0.25)',
  },
  moyenne: {
    label: 'Moyenne',
    color: '#F59E0B',
    subtle: 'rgba(245, 158, 11, 0.10)',
    border: 'rgba(245, 158, 11, 0.30)',
  },
  haute: {
    label: 'Haute',
    color: '#EF4444',
    subtle: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.30)',
  },
  critique: {
    label: 'Critique',
    color: '#FFFFFF',
    subtle: '#EF4444',
    border: '#B91C1C',
  },
};

export const REPARATION_CONFIG: Record<PanneStatutReparation, { label: string; color: string; icon: string }> = {
  en_attente: { label: 'En attente', color: '#EF4444', icon: 'clock-outline' },
  en_reparation: { label: 'En réparation', color: '#F59E0B', icon: 'tools' },
  resolu: { label: 'Résolu', color: '#22C55E', icon: 'check-circle' },
  irreparable: { label: 'Irréparable', color: '#6B7280', icon: 'close-circle' },
};

export const PC_STATE_CONFIG_EN_PANNE = {
  color: '#EF4444',
  subtle: 'rgba(239, 68, 68, 0.12)',
  border: 'rgba(239, 68, 68, 0.30)',
  glow: 'rgba(239, 68, 68, 0.20)',
  icon: 'laptop-off',
  label: 'En panne',
};
