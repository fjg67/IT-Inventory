// Shared color constants for ArticleDetail components — Obsidian Grid theme
export const ADC = {
  bg_primary: '#F5F5F0',
  bg_card: '#FFFFFF',
  bg_card_elevated: '#FFFFFF',

  green_primary: '#007D70',
  green_light: '#00A391',
  green_glow: 'rgba(34, 197, 94, 0.15)',
  green_subtle: 'rgba(34, 197, 94, 0.06)',

  danger: '#EF4444',
  danger_subtle: 'rgba(239, 68, 68, 0.10)',
  warning: '#F59E0B',
  warning_subtle: 'rgba(245, 158, 11, 0.10)',
  info: '#3B82F6',
  info_subtle: 'rgba(59, 130, 246, 0.10)',
  purple: '#8B5CF6',
  purple_subtle: 'rgba(139, 92, 246, 0.10)',

  text_primary: '#1A1A1A',
  text_secondary: '#5A5A55',
  text_muted: '#888880',
  text_dim: '#B0B0A8',

  border_subtle: '#E0E0D8',
  border_card: '#E0E0D8',
  border_accent: 'rgba(34, 197, 94, 0.4)',
} as const;

export const INFO_BADGE = {
  code_famille: { color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: 'tag-outline' },
  famille:      { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: 'shape-outline' },
  type:         { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: 'format-list-bulleted-type' },
  sous_type:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: 'tag-text-outline' },
  marque:       { color: '#00A391', bg: 'rgba(34,197,94,0.12)',   icon: 'domain' },
  modele:       { color: '#00A391', bg: 'rgba(34,197,94,0.12)',   icon: 'laptop' },
  emplacement:  { color: '#00A391', bg: 'rgba(34,197,94,0.12)',   icon: 'map-marker-outline' },
  barcode:      { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: 'tag-outline' },
  statut_chaud:         { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: 'flash-outline' },
  statut_disponible:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: 'check-circle-outline' },
  statut_usinage:       { color: '#F97316', bg: 'rgba(249,115,22,0.12)', icon: 'cog-play-outline' },
  statut_reusiner:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'wrench-outline' },
} as const;
