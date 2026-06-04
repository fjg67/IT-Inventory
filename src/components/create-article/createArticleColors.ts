// ============================================
// CREATE ARTICLE — Obsidian Grid Color System
// IT-Inventory Application
// ============================================

export const CAC = {
  bg_primary:       '#0A0F0D',
  bg_card:          '#111A14',
  bg_card_elevated: '#16231A',

  green_primary:    '#1B8A3E',
  green_light:      '#22C55E',
  green_subtle:     'rgba(27, 138, 62, 0.12)',
  green_glow:       'rgba(34, 197, 94, 0.15)',

  danger:           '#EF4444',
  danger_subtle:    'rgba(239, 68, 68, 0.12)',
  warning:          '#F59E0B',
  warning_subtle:   'rgba(245, 158, 11, 0.12)',
  info:             '#3B82F6',
  info_subtle:      'rgba(59, 130, 246, 0.12)',
  purple:           '#8B5CF6',
  purple_subtle:    'rgba(139, 92, 246, 0.12)',
  pink:             '#EC4899',
  pink_subtle:      'rgba(236, 72, 153, 0.12)',

  text_primary:     '#F0FDF4',
  text_secondary:   '#86EFAC',
  text_muted:       '#6B7280',
  text_dim:         '#374151',

  border_subtle:    'rgba(34, 197, 94, 0.08)',
  border_card:      'rgba(34, 197, 94, 0.15)',
  border_accent:    'rgba(34, 197, 94, 0.4)',
  border_focus:     'rgba(34, 197, 94, 0.7)',
} as const;

export type SectionKey = 'infos' | 'classif' | 'stock_site' | 'stock_level' | 'condition' | 'complement' | 'photo';

export interface SectionAccent {
  color: string;
  bg: string;
  border: string;
  icon: string;
  label: string;
}

export const SECTION_ACCENTS: Record<SectionKey, SectionAccent> = {
  infos: {
    color:  '#22C55E',
    bg:     'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.4)',
    icon:   'information',
    label:  'Informations principales',
  },
  classif: {
    color:  '#8B5CF6',
    bg:     'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.4)',
    icon:   'tune',
    label:  'Classification',
  },
  stock_site: {
    color:  '#22C55E',
    bg:     'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.4)',
    icon:   'office-building',
    label:  'Stock concerné',
  },
  stock_level: {
    color:  '#22C55E',
    bg:     'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.4)',
    icon:   'cube-outline',
    label:  'Niveaux de stock',
  },
  condition: {
    color:  '#EF4444',
    bg:     'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.4)',
    icon:   'tools',
    label:  "Etat de l'article",
  },
  complement: {
    color:  '#F59E0B',
    bg:     'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon:   'text-box-outline',
    label:  'Informations complémentaires',
  },
  photo: {
    color:  '#EC4899',
    bg:     'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.4)',
    icon:   'camera-outline',
    label:  'Photo',
  },
};
