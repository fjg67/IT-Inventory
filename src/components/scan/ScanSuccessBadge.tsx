import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SCAN_COLORS } from './tokens';

type ScanSuccessBadgeProps = {
  text: string;
  variant?: 'success' | 'error';
};

export const ScanSuccessBadge: React.FC<ScanSuccessBadgeProps> = ({ text, variant = 'success' }) => {
  const tone = variant === 'error'
    ? { bg: SCAN_COLORS.danger_subtle, border: 'rgba(239,68,68,0.35)', color: SCAN_COLORS.danger, icon: 'close-circle-outline' }
    : { bg: SCAN_COLORS.bg_card, border: SCAN_COLORS.border_accent, color: SCAN_COLORS.green_light, icon: 'check-circle' };

  return (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.wrap, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Icon name={tone.icon} size={14} color={tone.color} />
      <Text style={[styles.text, { color: tone.color }]}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 34,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
