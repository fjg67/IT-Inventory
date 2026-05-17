import { ColorValue } from 'react-native';

export type MovementType = 'entree' | 'sortie' | 'ajustement';

export const MOVEMENT_COLORS = {
  bg_primary: '#0A0F0D',
  bg_card: '#111A14',
  bg_card_elevated: '#16231A',

  green_primary: '#1B8A3E',
  green_light: '#22C55E',
  green_subtle: 'rgba(27, 138, 62, 0.12)',
  green_glow: 'rgba(34, 197, 94, 0.15)',

  danger: '#EF4444',
  danger_subtle: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warning_subtle: 'rgba(245, 158, 11, 0.12)',
  purple: '#8B5CF6',
  purple_subtle: 'rgba(139, 92, 246, 0.12)',

  text_primary: '#F0FDF4',
  text_secondary: '#86EFAC',
  text_muted: '#6B7280',
  text_dim: '#374151',

  border_subtle: 'rgba(34, 197, 94, 0.08)',
  border_card: 'rgba(34, 197, 94, 0.15)',
  border_accent: 'rgba(34, 197, 94, 0.4)',
};

export interface MovementIdentity {
  color: string;
  colorDark: string;
  subtle: string;
  glow: string;
  border: string;
  icon: string;
  label: string;
  bgGradient: [string, string, string];
}

export const MOVEMENT_IDENTITIES: Record<MovementType | 'transfert', MovementIdentity> = {
  entree: {
    color: '#22C55E',
    colorDark: '#1B8A3E',
    subtle: 'rgba(34, 197, 94, 0.12)',
    glow: 'rgba(34, 197, 94, 0.2)',
    border: 'rgba(34, 197, 94, 0.5)',
    icon: 'arrow-down-circle',
    label: 'Entree',
    bgGradient: ['rgba(27, 138, 62, 0.3)', 'rgba(27, 138, 62, 0.05)', 'transparent'],
  },
  sortie: {
    color: '#EF4444',
    colorDark: '#B91C1C',
    subtle: 'rgba(239, 68, 68, 0.12)',
    glow: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.5)',
    icon: 'arrow-up-circle',
    label: 'Sortie',
    bgGradient: ['rgba(185, 28, 28, 0.3)', 'rgba(185, 28, 28, 0.05)', 'transparent'],
  },
  ajustement: {
    color: '#F59E0B',
    colorDark: '#B45309',
    subtle: 'rgba(245, 158, 11, 0.12)',
    glow: 'rgba(245, 158, 11, 0.2)',
    border: 'rgba(245, 158, 11, 0.5)',
    icon: 'tune-variant',
    label: 'Ajustement',
    bgGradient: ['rgba(180, 83, 9, 0.3)', 'rgba(180, 83, 9, 0.05)', 'transparent'],
  },
  transfert: {
    color: '#8B5CF6',
    colorDark: '#6D28D9',
    subtle: 'rgba(139, 92, 246, 0.12)',
    glow: 'rgba(139, 92, 246, 0.2)',
    border: 'rgba(139, 92, 246, 0.5)',
    icon: 'swap-horizontal',
    label: 'Transfert',
    bgGradient: ['rgba(109, 40, 217, 0.3)', 'rgba(109, 40, 217, 0.05)', 'transparent'],
  },
};

export const MOVEMENT_STEP_LABELS = ['Article', 'Type', 'Details'] as const;

export const STEP_ICONS = ['barcode-scan', 'swap-vertical', 'check-circle-outline'] as const;

export const toColor = (value: string): ColorValue => value;
