export const SCAN_COLORS = {
  bg_primary: '#0A0F0D',
  bg_card: '#111A14',
  bg_card_elevated: '#16231A',
  bg_overlay: 'rgba(10, 15, 13, 0.85)',
  green_primary: '#1B8A3E',
  green_light: '#22C55E',
  green_glow: 'rgba(34, 197, 94, 0.25)',
  green_subtle: 'rgba(27, 138, 62, 0.12)',
  danger: '#EF4444',
  danger_subtle: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warning_subtle: 'rgba(245, 158, 11, 0.12)',
  info: '#3B82F6',
  info_subtle: 'rgba(59, 130, 246, 0.12)',
  text_primary: '#F0FDF4',
  text_secondary: '#86EFAC',
  text_muted: '#6B7280',
  text_dim: '#374151',
  border_subtle: 'rgba(34, 197, 94, 0.08)',
  border_card: 'rgba(34, 197, 94, 0.15)',
  border_accent: 'rgba(34, 197, 94, 0.4)',
} as const;

export const SCAN_ACTION_COLORS = {
  entree: { color: '#22C55E', dark: '#1B8A3E', subtle: 'rgba(34,197,94,0.12)', glow: 'rgba(34,197,94,0.3)', icon: 'arrow-down-circle-outline', label: 'Entree' },
  sortie: { color: '#EF4444', dark: '#B91C1C', subtle: 'rgba(239,68,68,0.12)', glow: 'rgba(239,68,68,0.3)', icon: 'arrow-up-circle-outline', label: 'Sortie' },
  ajustement: { color: '#F59E0B', dark: '#B45309', subtle: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.3)', icon: 'tune-vertical', label: 'Ajustement' },
  details: { color: '#3B82F6', dark: '#1D4ED8', subtle: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.3)', icon: 'eye-outline', label: 'Details' },
  disponible: { color: '#3B82F6', dark: '#1D4ED8', subtle: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.3)', icon: 'check-circle-outline', label: 'Disponible' },
  chaud: { color: '#22C55E', dark: '#1B8A3E', subtle: 'rgba(34,197,94,0.12)', glow: 'rgba(34,197,94,0.3)', icon: 'flash-outline', label: 'A chaud' },
  reusiner: { color: '#F59E0B', dark: '#B45309', subtle: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.3)', icon: 'wrench-outline', label: 'A reusiner' },
} as const;

export type ScanActionTone = keyof typeof SCAN_ACTION_COLORS;
