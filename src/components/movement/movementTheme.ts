import { ColorValue } from 'react-native';

export type MovementType = 'entree' | 'sortie' | 'ajustement';

export const MOVEMENT_COLORS = {
  bg_primary: '#F5F5F0',
  bg_card: '#FFFFFF',
  bg_card_elevated: '#FFFFFF',

  green_primary: '#007D70',
  green_light: '#00A391',
  green_subtle: 'rgba(27, 138, 62, 0.12)',
  green_glow: 'rgba(34, 197, 94, 0.15)',

  danger: '#EF4444',
  danger_subtle: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warning_subtle: 'rgba(245, 158, 11, 0.12)',
  purple: '#8B5CF6',
  purple_subtle: 'rgba(139, 92, 246, 0.12)',

  text_primary: '#1A1A1A',
  text_secondary: '#5A5A55',
  text_muted: '#888880',
  text_dim: '#B0B0A8',

  border_subtle: '#E0E0D8',
  border_card: '#E0E0D8',
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
    color: '#1E6B52',
    colorDark: '#145540',
    subtle: 'rgba(30, 107, 82, 0.12)',
    glow: 'rgba(30, 107, 82, 0.2)',
    border: 'rgba(30, 107, 82, 0.5)',
    icon: 'arrow-down-circle',
    label: 'Entree',
    bgGradient: ['rgba(30, 107, 82, 0.3)', 'rgba(30, 107, 82, 0.05)', 'transparent'],
  },
  sortie: {
    color: '#E52454',
    colorDark: '#A0193B',
    subtle: 'rgba(229, 36, 84, 0.12)',
    glow: 'rgba(229, 36, 84, 0.2)',
    border: 'rgba(229, 36, 84, 0.5)',
    icon: 'arrow-up-circle',
    label: 'Sortie',
    bgGradient: ['rgba(229, 36, 84, 0.3)', 'rgba(229, 36, 84, 0.05)', 'transparent'],
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
