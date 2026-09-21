// ============================================
// THEME COLORS - IT-Inventory Application
// Palettes Dark & Light complètes
// ============================================

import { ThemeColors } from './types';

// ─── Mode Sombre (Forcé en Clair CA) ───
export const darkColors: ThemeColors = {
  // Backgrounds
  background: '#F5F5F0',
  backgroundBase: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.7)',
  surfaceGlassHover: 'rgba(255,255,255,0.85)',
  surfaceInput: '#F1F5F9',

  // Borders
  borderSubtle: 'rgba(0,0,0,0.04)',
  borderMedium: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',
  borderFocus: '#007D70',
  borderFocusGlow: 'rgba(0,125,112,0.2)',

  // Accents primaires — Crédit Agricole Teal
  primary: '#007D70',
  primaryLight: '#00A391',
  primaryDark: '#006359',
  primaryGlow: 'rgba(0,125,112,0.1)',
  primaryGlowStrong: 'rgba(0,125,112,0.2)',
  secondary: '#1B8A3E',
  secondaryLight: '#22C55E',

  // Statuts
  success: '#059669',
  successBg: 'rgba(16,185,129,0.08)',
  successBorder: 'rgba(16,185,129,0.2)',
  warning: '#D97706',
  warningBg: 'rgba(245,158,11,0.08)',
  warningBorder: 'rgba(245,158,11,0.2)',
  danger: '#DC2626',
  dangerBg: 'rgba(239,68,68,0.06)',
  dangerBorder: 'rgba(239,68,68,0.2)',
  info: '#2563EB',
  infoBg: 'rgba(59,130,246,0.06)',

  // Textes
  textPrimary: '#1A1A1A',
  textSecondary: '#5A5A55',
  textMuted: '#888880',
  textAccent: '#007D70',
  textOnPrimary: '#FFFFFF',
  textOnSuccess: '#FFFFFF',
  textOnDanger: '#FFFFFF',

  // Spécifiques
  tabBarBackground: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  tabBarActive: '#007D70',
  tabBarInactive: '#5A5A55',
  statusBarStyle: 'dark-content',
  headerBackground: '#FFFFFF',
  scannerBackground: '#000000',
  modalOverlay: 'rgba(0,0,0,0.4)',
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
  badge: 'rgba(0,125,112,0.1)',
  badgeText: '#007D70',
  divider: 'rgba(0,0,0,0.06)',
  avatarBackground: '#E2E8F0',

  // Mouvements
  mouvementEntree: '#10B981',
  mouvementSortie: '#EF4444',
  mouvementAjustement: '#F59E0B',
  mouvementTransfert: '#8B5CF6',
};

// ─── Mode Clair ───
export const lightColors: ThemeColors = {
  // Backgrounds
  background: '#F5F5F0',
  backgroundBase: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.7)',
  surfaceGlassHover: 'rgba(255,255,255,0.85)',
  surfaceInput: '#F1F5F9',

  // Borders
  borderSubtle: 'rgba(0,0,0,0.04)',
  borderMedium: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',
  borderFocus: '#007D70',
  borderFocusGlow: 'rgba(0,125,112,0.2)',

  // Accents primaires — Crédit Agricole Teal
  primary: '#007D70',
  primaryLight: '#00A391',
  primaryDark: '#006359',
  primaryGlow: 'rgba(0,125,112,0.1)',
  primaryGlowStrong: 'rgba(0,125,112,0.2)',
  secondary: '#1B8A3E',
  secondaryLight: '#22C55E',

  // Statuts
  success: '#059669',
  successBg: 'rgba(16,185,129,0.08)',
  successBorder: 'rgba(16,185,129,0.2)',
  warning: '#D97706',
  warningBg: 'rgba(245,158,11,0.08)',
  warningBorder: 'rgba(245,158,11,0.2)',
  danger: '#DC2626',
  dangerBg: 'rgba(239,68,68,0.06)',
  dangerBorder: 'rgba(239,68,68,0.2)',
  info: '#2563EB',
  infoBg: 'rgba(59,130,246,0.06)',

  // Textes
  textPrimary: '#1A1A1A',
  textSecondary: '#5A5A55',
  textMuted: '#888880',
  textAccent: '#007D70',
  textOnPrimary: '#FFFFFF',
  textOnSuccess: '#FFFFFF',
  textOnDanger: '#FFFFFF',

  // Spécifiques
  tabBarBackground: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  tabBarActive: '#007D70',
  tabBarInactive: '#5A5A55',
  statusBarStyle: 'dark-content',
  headerBackground: '#FFFFFF',
  scannerBackground: '#000000',
  modalOverlay: 'rgba(0,0,0,0.4)',
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
  badge: 'rgba(0,125,112,0.1)',
  badgeText: '#007D70',
  divider: 'rgba(0,0,0,0.06)',
  avatarBackground: '#E2E8F0',

  // Mouvements
  mouvementEntree: '#10B981',
  mouvementSortie: '#EF4444',
  mouvementAjustement: '#F59E0B',
  mouvementTransfert: '#8B5CF6',
};
