// ============================================
// THEME CONTEXT & PROVIDER - IT-Inventory Application
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, StatusBar } from 'react-native';
import { darkColors, lightColors } from './colors';
import { darkShadows, lightShadows } from './shadows';
import { darkGradients, lightGradients } from './gradients';
import type { ThemeMode, Theme, ThemeContextValue, ThemeColors } from './types';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@it_inventory_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved && ['dark', 'light', 'system'].includes(saved)) {
        setThemeModeState(saved as ThemeMode);
      }
      setIsReady(true);
    }).catch(() => {
      setIsReady(true);
    });
  }, []);

  // Déterminer si on est en dark ou light
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const colors: ThemeColors = isDark ? darkColors : lightColors;

  // Construire le thème complet (memoized)
  const theme: Theme = useMemo(() => ({
    mode: themeMode,
    isDark,
    colors,
    shadows: isDark ? darkShadows : lightShadows,
    gradients: isDark ? darkGradients : lightGradients,
  }), [themeMode, isDark, colors]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('[Theme] Failed to save theme preference:', e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  }, [isDark, setThemeMode]);

  const gradients = theme.gradients;

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    themeMode,
    isDark,
    toggleTheme,
    setThemeMode,
    colors,
    gradients,
  }), [theme, themeMode, isDark, toggleTheme, setThemeMode, colors, gradients]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.backgroundBase}
        animated
      />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeContext };
