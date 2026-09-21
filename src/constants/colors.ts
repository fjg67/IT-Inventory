export const OBSIDIAN_COLORS = {
  bg_primary: '#F5F5F0',
  bg_card: '#FFFFFF',
  bg_card_elevated: '#FFFFFF',
  bg_glass: 'rgba(255, 255, 255, 0.9)',

  green_primary: '#007D70',
  green_light: '#00A391',
  green_glow: 'rgba(0, 125, 112, 0.15)',
  green_subtle: 'rgba(0, 125, 112, 0.08)',

  danger: '#EF4444',
  danger_subtle: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warning_subtle: 'rgba(245, 158, 11, 0.12)',
  info: '#3B82F6',
  info_subtle: 'rgba(59, 130, 246, 0.12)',
  purple: '#8B5CF6',
  purple_subtle: 'rgba(139, 92, 246, 0.12)',

  text_primary: '#1A1A1A',
  text_secondary: '#5A5A55',
  text_muted: '#888880',
  text_dim: '#B0B0A8',

  border_subtle: '#E0E0D8',
  border_card: '#E0E0D8',
  border_accent: '#007D70',
} as const;

export type ObsidianColorKey = keyof typeof OBSIDIAN_COLORS;
