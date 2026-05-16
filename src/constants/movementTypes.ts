import { OBSIDIAN_COLORS } from './colors';

export type MovementTypeKey = 'tous' | 'entree' | 'sortie' | 'ajustement' | 'transfert';
export type MovementPeriod = 'today' | '7days' | '30days';

export interface MovementTypeMeta {
  key: Exclude<MovementTypeKey, 'tous'>;
  label: string;
  icon: string;
  bg: string;
  border: string;
  text: string;
  sign: string;
}

export const MOVEMENT_TYPE_COLORS: Record<Exclude<MovementTypeKey, 'tous'>, MovementTypeMeta> = {
  entree: {
    key: 'entree',
    label: 'Entrée',
    icon: 'arrow-down-circle',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.4)',
    text: OBSIDIAN_COLORS.green_light,
    sign: '+',
  },
  sortie: {
    key: 'sortie',
    label: 'Sortie',
    icon: 'arrow-up-circle',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.4)',
    text: OBSIDIAN_COLORS.danger,
    sign: '−',
  },
  ajustement: {
    key: 'ajustement',
    label: 'Ajustement',
    icon: 'tune-vertical',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
    text: OBSIDIAN_COLORS.warning,
    sign: '↕',
  },
  transfert: {
    key: 'transfert',
    label: 'Transfert',
    icon: 'swap-horizontal',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.4)',
    text: OBSIDIAN_COLORS.purple,
    sign: '↔',
  },
};

export const MOVEMENT_TYPE_ORDER: MovementTypeKey[] = ['tous', 'entree', 'sortie', 'ajustement', 'transfert'];

export const getMovementTypeKey = (type: string): Exclude<MovementTypeKey, 'tous'> => {
  const normalized = String(type ?? '').toLowerCase();
  if (normalized.includes('sortie') || normalized === 'exit') return 'sortie';
  if (normalized.includes('ajust') || normalized === 'adjustment') return 'ajustement';
  if (normalized.includes('transfert') || normalized.includes('transfer')) return 'transfert';
  return 'entree';
};

export const getMovementTypeMeta = (type: string): MovementTypeMeta => MOVEMENT_TYPE_COLORS[getMovementTypeKey(type)];

export const formatMovementDelta = (type: string, quantity: number): string => {
  const meta = getMovementTypeMeta(type);
  const value = Math.abs(quantity);
  if (meta.key === 'ajustement') return `${meta.sign}${value}`;
  if (meta.key === 'transfert') return `${meta.sign}${value}`;
  return `${meta.sign}${value}`;
};
