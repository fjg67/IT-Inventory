export const SCAN_COLORS = {
  bg_primary: '#F5F5F0',
  bg_card: '#FFFFFF',
  bg_card_elevated: '#FFFFFF',
  bg_overlay: 'rgba(255,255,255,0.85)',
  green_primary: '#007D70',
  green_light: '#00A391',
  green_glow: 'rgba(34, 197, 94, 0.25)',
  green_subtle: 'rgba(27, 138, 62, 0.12)',
  danger: '#EF4444',
  danger_subtle: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warning_subtle: 'rgba(245, 158, 11, 0.12)',
  info: '#3B82F6',
  info_subtle: 'rgba(59, 130, 246, 0.12)',
  text_primary: '#1A1A1A',
  text_secondary: '#5A5A55',
  text_muted: '#888880',
  text_dim: '#B0B0A8',
  border_subtle: '#E0E0D8',
  border_card: '#E0E0D8',
  border_accent: 'rgba(34, 197, 94, 0.4)',
} as const;

export const SCAN_ACTION_COLORS = {
  entree: { color: '#00A391', dark: '#007D70', subtle: 'rgba(34,197,94,0.12)', glow: 'rgba(34,197,94,0.3)', icon: 'arrow-down-circle-outline', label: 'Entree' },
  sortie: { color: '#EF4444', dark: '#B91C1C', subtle: 'rgba(239,68,68,0.12)', glow: 'rgba(239,68,68,0.3)', icon: 'arrow-up-circle-outline', label: 'Sortie' },
  ajustement: { color: '#F59E0B', dark: '#B45309', subtle: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.3)', icon: 'tune-vertical', label: 'Ajustement' },
  details: { color: '#3B82F6', dark: '#1D4ED8', subtle: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.3)', icon: 'eye-outline', label: 'Details' },
  disponible: { color: '#3B82F6', dark: '#1D4ED8', subtle: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.3)', icon: 'check-circle-outline', label: 'Disponible' },
  chaud: { color: '#00A391', dark: '#007D70', subtle: 'rgba(34,197,94,0.12)', glow: 'rgba(34,197,94,0.3)', icon: 'flash-outline', label: 'A chaud' },
  reusiner: { color: '#F59E0B', dark: '#B45309', subtle: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.3)', icon: 'wrench-outline', label: 'A reusiner' },
} as const;

export type ScanActionTone = keyof typeof SCAN_ACTION_COLORS;
