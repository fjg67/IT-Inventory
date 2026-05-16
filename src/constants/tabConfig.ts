import type { MainTabParamList } from '@/navigation/types';

export const TAB_BAR_COLORS = {
  bgPrimary: '#0A0F0D',
  bgCard: '#111A14',
  bgCardElevated: '#16231A',
  greenPrimary: '#1B8A3E',
  greenLight: '#22C55E',
  greenGlow: 'rgba(34, 197, 94, 0.15)',
  greenSubtle: 'rgba(27, 138, 62, 0.12)',
  textPrimary: '#F0FDF4',
  textMuted: '#6B7280',
  textDim: '#374151',
  borderSubtle: 'rgba(34, 197, 94, 0.08)',
  borderCard: 'rgba(34, 197, 94, 0.15)',
  borderAccent: 'rgba(34, 197, 94, 0.4)',
  danger: '#EF4444',
} as const;

export type TabRouteName = keyof MainTabParamList;

export type TabConfigItem = {
  routeName: TabRouteName;
  label: string;
  icon: string;
  iconActive: string;
  isScan?: boolean;
  badgeKey?: 'stockAlerts' | 'newMovements' | null;
};

export const TAB_CONFIG: readonly TabConfigItem[] = [
  {
    routeName: 'Dashboard',
    label: 'Accueil',
    icon: 'home-outline',
    iconActive: 'home',
    badgeKey: null,
  },
  {
    routeName: 'Articles',
    label: 'Articles',
    icon: 'cube-outline',
    iconActive: 'cube',
    badgeKey: 'stockAlerts',
  },
  {
    routeName: 'Scan',
    label: 'Scan',
    icon: 'barcode-scan',
    iconActive: 'barcode-scan',
    isScan: true,
    badgeKey: null,
  },
  {
    routeName: 'PC',
    label: 'PC',
    icon: 'laptop',
    iconActive: 'laptop',
    badgeKey: null,
  },
  {
    routeName: 'Mouvements',
    label: 'Mvts',
    icon: 'swap-horizontal',
    iconActive: 'swap-horizontal',
    badgeKey: 'newMovements',
  },
  {
    routeName: 'Settings',
    label: 'Reglages',
    icon: 'cog-outline',
    iconActive: 'cog',
    badgeKey: null,
  },
] as const;
