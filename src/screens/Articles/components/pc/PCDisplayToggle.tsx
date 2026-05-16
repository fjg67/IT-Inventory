import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { Layout, FadeIn } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

export type PCDisplayMode = 'comfort' | 'compact';

interface PCDisplayToggleProps {
  value: PCDisplayMode;
  onChange: (value: PCDisplayMode) => void;
}

const ToggleChip: React.FC<{ active: boolean; icon: string; label: string; onPress: () => void }> = ({ active, icon, label, onPress }) => (
  <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
    <Icon name={icon} size={14} color={active ? '#FFFFFF' : OBSIDIAN_COLORS.text_muted} />
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

export const PCDisplayToggle: React.FC<PCDisplayToggleProps> = ({ value, onChange }) => {
  return (
    <Animated.View entering={FadeIn.duration(240)} layout={Layout.springify()} style={styles.wrap}>
      <ToggleChip active={value === 'comfort'} icon="view-grid-outline" label="Confort" onPress={() => onChange('comfort')} />
      <ToggleChip active={value === 'compact'} icon="view-headline" label="Compact" onPress={() => onChange('compact')} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
  },
  chip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: OBSIDIAN_COLORS.green_primary,
  },
  chipText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
