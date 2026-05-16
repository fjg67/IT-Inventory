import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeMode } from '@/theme';
import { SETTINGS_COLORS } from '@/constants/settingsColors';
import { ThemeOption } from './ThemeOption';

interface ThemeSelectorProps {
  themeMode: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themeMode, onSelect }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Theme de l'application</Text>

    <View style={styles.grid}>
      <ThemeOption
        icon={SETTINGS_COLORS.theme_clair.icon}
        label="Clair"
        color={SETTINGS_COLORS.theme_clair.color}
        bg={SETTINGS_COLORS.theme_clair.bg}
        active={themeMode === 'light'}
        onPress={() => onSelect('light')}
      />
      <ThemeOption
        icon={SETTINGS_COLORS.theme_sombre.icon}
        label="Sombre"
        color={SETTINGS_COLORS.theme_sombre.color}
        bg={SETTINGS_COLORS.theme_sombre.bg}
        active={themeMode === 'dark'}
        onPress={() => onSelect('dark')}
      />
      <ThemeOption
        icon={SETTINGS_COLORS.theme_auto.icon}
        label="Auto"
        color={SETTINGS_COLORS.theme_auto.color}
        bg={SETTINGS_COLORS.theme_auto.bg}
        active={themeMode === 'system'}
        onPress={() => onSelect('system')}
      />
    </View>

    <Text style={styles.hint}>Le mode Auto suit les reglages systeme.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: SETTINGS_COLORS.bg_card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    padding: 16,
    gap: 12,
  },
  title: {
    color: SETTINGS_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  hint: {
    color: SETTINGS_COLORS.text_dim,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
