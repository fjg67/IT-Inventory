// ============================================
// THEME TYPES - IT-Inventory Application
// ============================================

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  // ─── Backgrounds ───
  background: string;
  backgroundBase: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  surfaceGlassHover: string;
  surfaceInput: string;

  // ─── Borders ───
  borderSubtle: string;
  borderMedium: string;
  borderStrong: string;
  borderFocus: string;
  borderFocusGlow: string;

  // ─── Accents primaires ───
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  primaryGlowStrong: string;
  secondary: string;
  secondaryLight: string;

  // ─── Statuts ───
  success: string;
  successBg: string;
  successBorder: string;
  warning: string;
  warningBg: string;
  warningBorder: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  info: string;
  infoBg: string;

  // ─── Textes ───
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  textOnPrimary: string;
  textOnSuccess: string;
  textOnDanger: string;

  // ─── Spécifiques ───
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  statusBarStyle: 'light-content' | 'dark-content';
  headerBackground: string;
  scannerBackground: string;
  modalOverlay: string;
  skeleton: string;
  skeletonHighlight: string;
  badge: string;
  badgeText: string;
  divider: string;
  avatarBackground: string;

  // ─── Mouvements ───
  mouvementEntree: string;
  mouvementSortie: string;
  mouvementAjustement: string;
  mouvementTransfert: string;
}

export interface ThemeShadows {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  cardElevated: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  button: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface ThemeGradients {
  primary: string[];
  primaryHorizontal: string[];
  header: string[];
  surface: string[];
  success: string[];
  danger: string[];
  warning: string[];
  info: string[];
  login: string[];
  scanButton: string[];
  avatar: string[];
}

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  shadows: ThemeShadows;
  gradients: ThemeGradients;
}

export interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  gradients: ThemeGradients;
}
