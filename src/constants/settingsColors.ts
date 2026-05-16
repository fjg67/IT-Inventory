import { OBSIDIAN_COLORS } from '@/constants/colors';

export const SETTINGS_COLORS = {
  ...OBSIDIAN_COLORS,
  teal: '#14B8A6',
  teal_subtle: 'rgba(20, 184, 166, 0.12)',
  conformite_ok: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22C55E', label: 'Conforme' },
  conformite_refresh: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', label: 'A rafraichir' },
  conformite_critical: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', label: 'Critique' },
  theme_clair: { icon: 'weather-sunny', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  theme_sombre: { icon: 'moon-waning-crescent', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  theme_auto: { icon: 'cellphone', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)' },
  role_technicien: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', icon: 'wrench-outline' },
  role_admin: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: 'shield-crown-outline' },
  role_viewer: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', icon: 'eye-outline' },
} as const;

export type ComplianceTone = 'ok' | 'refresh' | 'critical';

export const getComplianceTone = (days: number | null): ComplianceTone => {
  if (days == null) return 'refresh';
  if (days > 60) return 'critical';
  if (days >= 14) return 'refresh';
  return 'ok';
};

export const getComplianceVisual = (days: number | null) => {
  const tone = getComplianceTone(days);
  if (tone === 'ok') {
    return {
      tone,
      status: SETTINGS_COLORS.conformite_ok,
      borderColor: SETTINGS_COLORS.border_card,
      tint: SETTINGS_COLORS.green_subtle,
    };
  }
  if (tone === 'critical') {
    return {
      tone,
      status: SETTINGS_COLORS.conformite_critical,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      tint: SETTINGS_COLORS.danger_subtle,
    };
  }
  return {
    tone,
    status: SETTINGS_COLORS.conformite_refresh,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    tint: SETTINGS_COLORS.warning_subtle,
  };
};
