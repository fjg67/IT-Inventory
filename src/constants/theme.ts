// ============================================
// THÈME - IT-Inventory Application
// Design system adapté usage industriel Zebra TC22
// ============================================

import { StyleSheet } from 'react-native';

export const colors = {
  // Couleurs principales
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  
  // Couleurs secondaires
  secondary: '#64748B',
  secondaryLight: '#94A3B8',
  secondaryDark: '#475569',
  
  // États
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoDark: '#2563EB',
  
  // Surfaces
  background: '#F8FAFC',
  backgroundDark: '#0F172A',
  surface: '#FFFFFF',
  surfaceDark: '#1E293B',
  border: '#E2E8F0',
  borderDark: '#334155',
  
  // Texte
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    disabled: '#94A3B8',
    inverse: '#FFFFFF',
  },
  
  // Mouvements
  mouvement: {
    entree: '#10B981',
    sortie: '#EF4444',
    ajustement: '#F59E0B',
    transfert: '#8B5CF6',
  },
  
  // Synchronisation
  sync: {
    pending: '#F59E0B',
    syncing: '#3B82F6',
    synced: '#10B981',
    error: '#EF4444',
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
} as const;

export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Tailles spécifiques Zebra TC22 (écran 5.5", 720x1280)
export const deviceSizes = {
  screenWidth: 360,
  screenHeight: 640,
  headerHeight: 56,
  tabBarHeight: 56,
  buttonMinHeight: 48, // Taille minimum pour tactile industriel
  cardMinHeight: 72,
  iconSize: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
} as const;

// Styles de base réutilisables
export const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  cardPressed: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPrimary: {
    color: colors.text.primary,
    ...typography.body,
  },
  textSecondary: {
    color: colors.text.secondary,
    ...typography.caption,
  },
  button: {
    minHeight: deviceSizes.buttonMinHeight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.text.inverse,
    ...typography.bodyBold,
  },
  buttonTextSecondary: {
    color: colors.text.primary,
    ...typography.bodyBold,
  },
  input: {
    minHeight: deviceSizes.buttonMinHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    ...typography.body,
    color: colors.text.primary,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...typography.small,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text.inverse,
    ...typography.bodyBold,
  },
});

// Export du thème complet
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  deviceSizes,
  baseStyles,
};

export type Theme = typeof theme;
