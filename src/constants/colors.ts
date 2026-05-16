export const OBSIDIAN_COLORS = {
  bg_primary: '#0A0F0D',
  bg_card: '#111A14',
  bg_card_elevated: '#16231A',
  bg_glass: 'rgba(22, 35, 26, 0.7)',

  green_primary: '#1B8A3E',
  green_light: '#22C55E',
  green_glow: 'rgba(34, 197, 94, 0.15)',
  green_subtle: 'rgba(27, 138, 62, 0.12)',

  danger: '#EF4444',
  danger_subtle: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warning_subtle: 'rgba(245, 158, 11, 0.12)',
  info: '#3B82F6',
  info_subtle: 'rgba(59, 130, 246, 0.12)',
  purple: '#8B5CF6',
  purple_subtle: 'rgba(139, 92, 246, 0.12)',

  text_primary: '#F0FDF4',
  text_secondary: '#86EFAC',
  text_muted: '#4B5563',
  text_dim: '#374151',

  border_subtle: 'rgba(34, 197, 94, 0.08)',
  border_card: 'rgba(34, 197, 94, 0.15)',
  border_accent: 'rgba(34, 197, 94, 0.4)',
} as const;

export type ObsidianColorKey = keyof typeof OBSIDIAN_COLORS;
