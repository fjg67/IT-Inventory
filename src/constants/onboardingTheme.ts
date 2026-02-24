// ============================================
// ONBOARDING THEME - IT-Inventory Application
// Thème spécifique pour les écrans de bienvenue
// ============================================

import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const onboardingTheme = {
  colors: {
    gradient: {
      start: '#1E3A8A', // Bleu profond
      end: '#0F172A',   // Bleu nuit presque noir
    },
    primary: '#2563EB',      // Bleu vif
    primaryLight: '#60A5FA', // Bleu clair
    accent: '#F59E0B',       // Orange/Or pour les CTA
    white: '#FFFFFF',
    text: {
      primary: '#FFFFFF',
      secondary: '#CBD5E1', // Gris bleu clair
      muted: '#64748B',     // Gris bleu moyen
    },
    ui: {
      card: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      dotActive: '#60A5FA',
      dotInactive: '#334155',
    }
  },
  typography: {
    title: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      textAlign: 'center' as const,
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400' as const,
      color: '#CBD5E1',
      textAlign: 'center' as const,
      lineHeight: 24,
      paddingHorizontal: 24,
    },
    button: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    }
  },
  layout: {
    slidePadding: 24,
    iconSize: width * 0.5, // 50% de la largeur
  },
  animation: {
    duration: 500,
    easing: 'ease-out',
  },
  shadows: {
    button: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    glow: {
      shadowColor: '#60A5FA',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    }
  }
};
