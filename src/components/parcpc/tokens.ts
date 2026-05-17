import { OBSIDIAN_COLORS } from '@/constants/colors';

export const PARC_PC_COLORS = {
  ...OBSIDIAN_COLORS,
  green_border: 'rgba(34, 197, 94, 0.25)',
  warning_border: 'rgba(245, 158, 11, 0.25)',
  danger_border: 'rgba(239, 68, 68, 0.25)',
  info_border: 'rgba(59, 130, 246, 0.25)',
  purple_border: 'rgba(139, 92, 246, 0.25)',
} as const;

export const SWIPE_ACTIONS = {
  sent: {
    label: 'Envoye',
    sub: 'SORTIE',
    color: PARC_PC_COLORS.purple,
    border: PARC_PC_COLORS.purple_border,
    bg: PARC_PC_COLORS.purple_subtle,
    icon: 'send-outline',
  },
  hot: {
    label: 'Disponible',
    sub: 'REMISE',
    color: PARC_PC_COLORS.info,
    border: PARC_PC_COLORS.info_border,
    bg: PARC_PC_COLORS.info_subtle,
    icon: 'flash-outline',
  },
  delete: {
    label: 'Supprimer',
    sub: 'RETIRER',
    color: PARC_PC_COLORS.danger,
    border: PARC_PC_COLORS.danger_border,
    bg: PARC_PC_COLORS.danger_subtle,
    icon: 'trash-can-outline',
  },
} as const;
