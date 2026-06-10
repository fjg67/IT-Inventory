import { PCStatus } from '@/types/pc.types';

export interface PCStatusUIConfig {
  color: string;
  subtle: string;
  border: string;
  heroGlow: string;
  icon: string;
  label: string;
  buttonColor: string;
}

export const PC_STATUS_UI: Record<PCStatus, PCStatusUIConfig> = {
  a_chaud: {
    color: '#22C55E',
    subtle: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.28)',
    heroGlow: 'rgba(34,197,94,0.10)',
    icon: 'flash-outline',
    label: 'À chaud',
    buttonColor: '#1B8A3E',
  },
  a_reusiner: {
    color: '#F59E0B',
    subtle: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.28)',
    heroGlow: 'rgba(245,158,11,0.08)',
    icon: 'wrench-outline',
    label: 'À reusiner',
    buttonColor: '#B45309',
  },
  en_usinage: {
    color: '#F59E0B',
    subtle: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.22)',
    heroGlow: 'rgba(245,158,11,0.07)',
    icon: 'cog-outline',
    label: 'En usinage',
    buttonColor: '#B45309',
  },
  disponible: {
    color: '#3B82F6',
    subtle: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.28)',
    heroGlow: 'rgba(59,130,246,0.08)',
    icon: 'check-circle-outline',
    label: 'Disponible',
    buttonColor: '#1D4ED8',
  },
  envoye: {
    color: '#8B5CF6',
    subtle: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.28)',
    heroGlow: 'rgba(139,92,246,0.08)',
    icon: 'send-outline',
    label: 'Envoyé',
    buttonColor: '#6D28D9',
  },
  en_panne: {
    color: '#EF4444',
    subtle: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.30)',
    heroGlow: 'rgba(239,68,68,0.08)',
    icon: 'laptop-off',
    label: 'En panne',
    buttonColor: '#B91C1C',
  },
};

export const PC_DEFAULT_UI: PCStatusUIConfig = {
  color: '#22C55E',
  subtle: 'rgba(34,197,94,0.12)',
  border: 'rgba(34,197,94,0.24)',
  heroGlow: 'rgba(34,197,94,0.10)',
  icon: 'laptop',
  label: 'Sélectionner un statut',
  buttonColor: '#14532D',
};
