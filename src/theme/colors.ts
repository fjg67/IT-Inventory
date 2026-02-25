// ============================================
// THEME COLORS - IT-Inventory Application
// Palettes Dark & Light complètes
// ============================================

import { ThemeColors } from './types';

// ─── Mode Sombre ───
export const darkColors: ThemeColors = {
  // Backgrounds
  background: '#06090F',
  backgroundBase: '#0A0F1A',
  surface: '#0E1520',
  surfaceElevated: '#131D2E',
  surfaceGlass: 'rgba(255,255,255,0.03)',
  surfaceGlassHover: 'rgba(255,255,255,0.06)',
  surfaceInput: 'rgba(255,255,255,0.04)',

  // Borders
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderMedium: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.15)',
  borderFocus: '#3B82F6',
  borderFocusGlow: 'rgba(59,130,246,0.35)',

  // Accents primaires
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryGlow: 'rgba(99,102,241,0.18)',
  primaryGlowStrong: 'rgba(99,102,241,0.35)',
  secondary: '#3B82F6',
  secondaryLight: '#60A5FA',

  // Statuts
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.08)',
  successBorder: 'rgba(16,185,129,0.25)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.08)',
  warningBorder: 'rgba(245,158,11,0.25)',
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.08)',
  dangerBorder: 'rgba(239,68,68,0.25)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.08)',

  // Textes
  textPrimary: '#EEF2FF',
  textSecondary: '#94A3B8',
  textMuted: '#4A5568',
  textAccent: '#818CF8',
  textOnPrimary: '#FFFFFF',
  textOnSuccess: '#FFFFFF',
  textOnDanger: '#FFFFFF',

  // Spécifiques
  tabBarBackground: '#0A0F1A',
  tabBarBorder: 'rgba(255,255,255,0.05)',
  tabBarActive: '#6366F1',
  tabBarInactive: '#4A5568',
  statusBarStyle: 'light-content',
  headerBackground: '#0A0F1A',
  scannerBackground: '#000000',
  modalOverlay: 'rgba(0,0,0,0.75)',
  skeleton: '#131D2E',
  skeletonHighlight: '#1E293B',
  badge: 'rgba(99,102,241,0.15)',
  badgeText: '#818CF8',
  divider: 'rgba(255,255,255,0.06)',
  avatarBackground: '#1E293B',

  // Mouvements
  mouvementEntree: '#10B981',
  mouvementSortie: '#EF4444',
  mouvementAjustement: '#F59E0B',
  mouvementTransfert: '#8B5CF6',
};

// ─── Mode Clair ───
export const lightColors: ThemeColors = {
  // Backgrounds
  background: '#F0F2F5',
  backgroundBase: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.7)',
  surfaceGlassHover: 'rgba(255,255,255,0.85)',
  surfaceInput: '#F1F5F9',

  // Borders
  borderSubtle: 'rgba(0,0,0,0.04)',
  borderMedium: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',
  borderFocus: '#6366F1',
  borderFocusGlow: 'rgba(99,102,241,0.2)',

  // Accents primaires
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryGlow: 'rgba(99,102,241,0.1)',
  primaryGlowStrong: 'rgba(99,102,241,0.2)',
  secondary: '#3B82F6',
  secondaryLight: '#60A5FA',

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
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textAccent: '#6366F1',
  textOnPrimary: '#FFFFFF',
  textOnSuccess: '#FFFFFF',
  textOnDanger: '#FFFFFF',

  // Spécifiques
  tabBarBackground: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  tabBarActive: '#6366F1',
  tabBarInactive: '#94A3B8',
  statusBarStyle: 'dark-content',
  headerBackground: '#F8FAFC',
  scannerBackground: '#000000',
  modalOverlay: 'rgba(0,0,0,0.4)',
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
  badge: 'rgba(99,102,241,0.1)',
  badgeText: '#6366F1',
  divider: 'rgba(0,0,0,0.06)',
  avatarBackground: '#E2E8F0',

  // Mouvements
  mouvementEntree: '#10B981',
  mouvementSortie: '#EF4444',
  mouvementAjustement: '#F59E0B',
  mouvementTransfert: '#8B5CF6',
};
