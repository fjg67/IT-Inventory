// ============================================
// THEME INDEX - IT-Inventory Application
// Export centralisé du système de thème
// ============================================

export { ThemeProvider, useTheme, ThemeContext } from './ThemeContext';
export { darkColors, lightColors } from './colors';
export { darkShadows, lightShadows } from './shadows';
export { darkGradients, lightGradients } from './gradients';
export type {
  ThemeMode,
  ThemeColors,
  ThemeShadows,
  ThemeGradients,
  Theme,
  ThemeContextValue,
} from './types';
