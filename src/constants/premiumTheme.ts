// ============================================
// PREMIUM THEME - GestStock IT
// Design system premium pour le Dashboard
// ============================================

// Helper: ajouter une opacité alpha à une couleur hex
export const withAlpha = (hex: string, alpha: number): string => {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
};

// ==================== COULEURS ====================

export const premiumColors = {
  // Couleurs principales — Crédit Agricole Alsace Vosges
  primary: {
    base: '#007A39',
    light: '#4EB35A',
    dark: '#005C2B',
    gradient: ['#00A651', '#007A39', '#005C2B'] as const,
  },

  // Couleurs d'état
  success: {
    base: '#10B981',
    light: '#34D399',
    dark: '#059669',
    gradient: ['#34D399', '#10B981'] as const,
  },

  error: {
    base: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    gradient: ['#F87171', '#EF4444'] as const,
  },

  warning: {
    base: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    gradient: ['#FBBF24', '#F59E0B'] as const,
  },

  info: {
    base: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    gradient: ['#A78BFA', '#8B5CF6'] as const,
  },

  // Surfaces (fond clair)
  background: '#F0F7F2',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#C8E6C9',
  borderLight: '#E8F5E9',

  // Glass (simulé)
  glass: {
    white: 'rgba(255, 255, 255, 0.70)',
    whiteMedium: 'rgba(255, 255, 255, 0.50)',
    whiteLight: 'rgba(255, 255, 255, 0.30)',
    border: 'rgba(255, 255, 255, 0.60)',
    borderLight: 'rgba(255, 255, 255, 0.20)',
  },

  // Texte
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    link: '#007A39',
  },

  // Dégradés de fond
  gradients: {
    header: ['#E8F5E9', '#F0F7F2'] as const,
    scanButton: ['#00A651', '#007A39', '#005C2B'] as const,
    success: ['#34D399', '#10B981'] as const,
    error: ['#F87171', '#EF4444'] as const,
    warning: ['#FBBF24', '#F59E0B'] as const,
    info: ['#60A5FA', '#2563EB'] as const,
    avatar: ['#00A651', '#007A39'] as const,
  },
} as const;

// ==================== TYPOGRAPHIE ====================

export const premiumTypography = {
  // Titres
  display: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },

  // Corps
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // Petits textes
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  smallMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },

  // Chiffres / Stats
  stat: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  statSmall: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
} as const;

// ==================== OMBRES ====================

export const premiumShadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },

  // Ombres colorées (glow)
  glowBlue: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  glowGreen: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glowRed: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glowOrange: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ==================== ESPACEMENTS ====================

export const premiumSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ==================== BORDER RADIUS ====================

export const premiumBorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ==================== ANIMATION CONSTANTS ====================

export const premiumAnimation = {
  staggerDelay: 100,
  counterDuration: 800,
  pulseDuration: 2000,
  shineDuration: 2500,
  shineDelay: 3000,
  particleDuration: 4000,
  pressDuration: 100,
  pressScale: 0.97,
  pressScaleSmall: 0.92,
  feedbackSuccessEnterDuration: 320,
  feedbackSuccessExitDuration: 220,
  feedbackSuccessInitialOffset: 38,
  feedbackSuccessSpringDamping: 14,
  feedbackSuccessSpringStiffness: 180,
  feedbackErrorEnterDuration: 180,
  feedbackErrorExitDuration: 150,
} as const;

// ==================== EXPORT COMPLET ====================

export const premiumTheme = {
  colors: premiumColors,
  typography: premiumTypography,
  shadows: premiumShadows,
  spacing: premiumSpacing,
  borderRadius: premiumBorderRadius,
  animation: premiumAnimation,
} as const;

export type PremiumTheme = typeof premiumTheme;
