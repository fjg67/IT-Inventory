// ============================================
// THEME GRADIENTS - IT-Inventory Application
// Dégradés adaptés par thème
// ============================================

import { ThemeGradients } from './types';

// Crédit Agricole Alsace Vosges — vert CA signature
export const darkGradients: ThemeGradients = {
  primary: ['#4EB35A', '#007A39'],
  primaryHorizontal: ['#00A651', '#007A39'],
  header: ['#FFFFFF', '#131D2E'],
  surface: ['rgba(0,125,112,0.08)', 'rgba(0,125,112,0.08)'],
  success: ['#10B981', '#059669'],
  danger: ['#EF4444', '#DC2626'],
  warning: ['#FBBF24', '#F59E0B'],
  info: ['#60A5FA', '#2563EB'],
  login: ['#FFFFFF', '#0E1520', '#FFFFFF'],
  scanButton: ['#4EB35A', '#007A39', '#005C2B'],
  avatar: ['#007A39', '#005C2B'],
};

export const lightGradients: ThemeGradients = {
  primary: ['#00A651', '#007A39'],
  primaryHorizontal: ['#4EB35A', '#007A39'],
  header: ['#F0F7F2', '#FFFFFF'],
  surface: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
  success: ['#10B981', '#059669'],
  danger: ['#EF4444', '#DC2626'],
  warning: ['#FBBF24', '#F59E0B'],
  info: ['#60A5FA', '#2563EB'],
  login: ['#E8F5E9', '#C8E6C9', '#E8F5E9'],
  scanButton: ['#00A651', '#007A39', '#005C2B'],
  avatar: ['#00A651', '#007A39'],
};
