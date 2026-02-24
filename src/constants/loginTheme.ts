// ============================================
// LOGIN THEME - IT-Inventory Page de connexion premium
// ============================================

export const loginTheme = {
  colors: {
    background: {
      gradient: ['#0F172A', '#1E293B', '#334155'] as const,
      dark: '#0F172A',
    },
    primary: {
      base: '#2563EB',
      light: '#60A5FA',
      dark: '#1E40AF',
      gradient: ['#3B82F6', '#2563EB', '#1D4ED8'] as const,
      glow: 'rgba(37, 99, 235, 0.5)',
    },
    surface: {
      glass: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
    },
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    input: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.15)',
      borderFocus: '#2563EB',
      placeholder: 'rgba(255, 255, 255, 0.5)',
    },
  },
} as const;
