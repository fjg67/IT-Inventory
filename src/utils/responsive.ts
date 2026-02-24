// ============================================
// RESPONSIVE UTILITIES - IT-Inventory Application
// Adaptation mobile (Zebra TC22) + tablette
// ============================================

import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

// ==================== BREAKPOINTS ====================
/**
 * Breakpoints basés sur la largeur de l'écran (dp)
 * - phone:  < 600dp  (ex : Zebra TC22 360dp, smartphones classiques)
 * - tablet: >= 600dp (ex : tablettes 7-10", iPads)
 * - largeTablet: >= 900dp (ex : iPad Pro 12.9")
 */
export const BREAKPOINTS = {
  phone: 0,
  tablet: 600,
  largeTablet: 900,
} as const;

export type DeviceType = 'phone' | 'tablet' | 'largeTablet';

// ==================== SCALING ====================

// Dimensions de référence (Zebra TC22 : 360 × 640dp)
const BASE_WIDTH = 360;
const BASE_HEIGHT = 640;

/**
 * Scale linéaire basé sur la largeur de l'écran
 */
export const scale = (size: number, screenWidth: number): number => {
  const ratio = screenWidth / BASE_WIDTH;
  return Math.round(size * ratio);
};

/**
 * Scale vertical basé sur la hauteur de l'écran
 */
export const verticalScale = (size: number, screenHeight: number): number => {
  const ratio = screenHeight / BASE_HEIGHT;
  return Math.round(size * ratio);
};

/**
 * Scale modéré — applique seulement une fraction du facteur de mise à l'échelle
 * Idéal pour les textes et les petits éléments qui ne doivent pas grandir trop
 * @param factor - 0 = pas de scaling, 1 = scaling complet (défaut 0.5)
 */
export const moderateScale = (
  size: number,
  screenWidth: number,
  factor: number = 0.5,
): number => {
  const ratio = screenWidth / BASE_WIDTH;
  return Math.round(size + (size * (ratio - 1)) * factor);
};

/**
 * Scale pour les fontes, respecte les préférences d'accessibilité
 */
export const fontScale = (size: number, screenWidth: number): number => {
  const scaled = moderateScale(size, screenWidth, 0.4);
  // Limiter pour éviter des tailles extrêmes sur très grands écrans
  const maxSize = size * 1.5;
  return Math.min(scaled, maxSize);
};

// ==================== DEVICE DETECTION ====================

/**
 * Détecte le type d'appareil basé sur la largeur
 */
export const getDeviceType = (screenWidth: number): DeviceType => {
  if (screenWidth >= BREAKPOINTS.largeTablet) return 'largeTablet';
  if (screenWidth >= BREAKPOINTS.tablet) return 'tablet';
  return 'phone';
};

/**
 * Vérifie si l'appareil est une tablette
 */
export const isTablet = (screenWidth: number): boolean => {
  return screenWidth >= BREAKPOINTS.tablet;
};

// ==================== GRID SYSTEM ====================

/**
 * Calcule le nombre de colonnes optimal pour une grille
 */
export const getGridColumns = (
  screenWidth: number,
  minItemWidth: number = 160,
  maxColumns: number = 4,
): number => {
  const padding = isTablet(screenWidth) ? 48 : 32;
  const availableWidth = screenWidth - padding;
  const columns = Math.floor(availableWidth / minItemWidth);
  return Math.min(Math.max(columns, 1), maxColumns);
};

/**
 * Calcule le maxWidth pour centrer le contenu sur tablette
 */
export const getContentMaxWidth = (screenWidth: number): number | undefined => {
  if (screenWidth >= BREAKPOINTS.largeTablet) return 960;
  if (screenWidth >= BREAKPOINTS.tablet) return 720;
  return undefined; // Pas de contrainte sur mobile
};

// ==================== RESPONSIVE VALUES ====================

/**
 * Sélectionne une valeur selon le type d'appareil
 */
export function responsiveValue<T>(
  screenWidth: number,
  values: { phone: T; tablet?: T; largeTablet?: T },
): T {
  const deviceType = getDeviceType(screenWidth);
  if (deviceType === 'largeTablet' && values.largeTablet !== undefined) {
    return values.largeTablet;
  }
  if (deviceType !== 'phone' && values.tablet !== undefined) {
    return values.tablet;
  }
  return values.phone;
}

// ==================== SPACING & LAYOUT ====================

/**
 * Retourne les espacements adaptatifs selon le type d'appareil
 */
export const getResponsiveSpacing = (screenWidth: number) => {
  const device = getDeviceType(screenWidth);
  const base = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };

  if (device === 'largeTablet') {
    return {
      xxs: 4,
      xs: 6,
      sm: 12,
      md: 24,
      lg: 32,
      xl: 48,
      xxl: 64,
      screenPadding: 48,
    };
  }

  if (device === 'tablet') {
    return {
      xxs: 3,
      xs: 6,
      sm: 10,
      md: 20,
      lg: 28,
      xl: 40,
      xxl: 56,
      screenPadding: 32,
    };
  }

  return {
    ...base,
    screenPadding: 16,
  };
};

// ==================== MAIN HOOK ====================

export interface ResponsiveInfo {
  // Dimensions
  width: number;
  height: number;
  
  // Device info
  deviceType: DeviceType;
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isLandscape: boolean;
  
  // Scaling functions
  s: (size: number) => number;               // scale
  vs: (size: number) => number;              // verticalScale
  ms: (size: number, factor?: number) => number; // moderateScale
  fs: (size: number) => number;              // fontScale
  
  // Grid
  gridColumns: (minItemWidth?: number, maxColumns?: number) => number;
  contentMaxWidth: number | undefined;
  
  // Responsive values
  rv: <T>(values: { phone: T; tablet?: T; largeTablet?: T }) => T;
  
  // Responsive spacing
  spacing: ReturnType<typeof getResponsiveSpacing>;
  
  // Tab bar
  tabBarHeight: number;
  headerHeight: number;
}

/**
 * Hook principal pour le responsive design
 * Réactif aux changements de dimensions (rotation, multitâche)
 */
export const useResponsive = (): ResponsiveInfo => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const deviceType = getDeviceType(width);
    const _isTablet = deviceType !== 'phone';
    const _isLargeTablet = deviceType === 'largeTablet';
    const isLandscape = width > height;

    return {
      // Dimensions
      width,
      height,

      // Device info
      deviceType,
      isPhone: !_isTablet,
      isTablet: _isTablet,
      isLargeTablet: _isLargeTablet,
      isLandscape,

      // Scaling functions
      s: (size: number) => scale(size, width),
      vs: (size: number) => verticalScale(size, height),
      ms: (size: number, factor?: number) => moderateScale(size, width, factor),
      fs: (size: number) => fontScale(size, width),

      // Grid
      gridColumns: (minItemWidth?: number, maxColumns?: number) =>
        getGridColumns(width, minItemWidth, maxColumns),
      contentMaxWidth: getContentMaxWidth(width),

      // Responsive values
      rv: <T>(values: { phone: T; tablet?: T; largeTablet?: T }) =>
        responsiveValue(width, values),

      // Responsive spacing
      spacing: getResponsiveSpacing(width),

      // Tab bar & header
      tabBarHeight: _isTablet ? 80 : 68,
      headerHeight: _isTablet ? 64 : 56,
    };
  }, [width, height]);
};

// ==================== RESPONSIVE CONTAINER ====================

/**
 * Retourne les styles pour un conteneur responsive centré sur tablette
 */
export const getContainerStyle = (screenWidth: number) => {
  const maxWidth = getContentMaxWidth(screenWidth);
  if (!maxWidth) return {};
  return {
    maxWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  };
};
