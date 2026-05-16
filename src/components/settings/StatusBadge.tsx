import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

export type StatusKind = 'active' | 'inactive' | 'pending';

interface StatusBadgeProps {
  status: StatusKind;
}

const STATUS_MAP = {
  active: {
    bg: SETTINGS_COLORS.green_subtle,
    text: SETTINGS_COLORS.green_light,
    dot: SETTINGS_COLORS.green_light,
    label: 'ACTIVE',
  },
  inactive: {
    bg: SETTINGS_COLORS.bg_card_elevated,
    text: SETTINGS_COLORS.text_muted,
    dot: SETTINGS_COLORS.text_dim,
    label: 'INACTIVE',
  },
  pending: {
    bg: SETTINGS_COLORS.warning_subtle,
    text: SETTINGS_COLORS.warning,
    dot: SETTINGS_COLORS.warning,
    label: 'PENDING',
  },
} as const;

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const visual = STATUS_MAP[status];

  return (
    <View style={[styles.badge, { backgroundColor: visual.bg }]}> 
      <View style={[styles.dot, { backgroundColor: visual.dot }]} />
      <Text style={[styles.text, { color: visual.text }]}>{visual.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
