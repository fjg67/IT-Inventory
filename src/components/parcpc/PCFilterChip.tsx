import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PCStateMeta } from '@/constants/pcStates';
import { PARC_PC_COLORS } from './tokens';

interface PCFilterChipProps {
  meta: PCStateMeta;
  count: number;
  active: boolean;
  onPress: () => void;
}

export const PCFilterChip: React.FC<PCFilterChipProps> = ({ meta, count, active, onPress }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = 0.92;
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.chip,
          active
            ? { backgroundColor: meta.subtle, borderColor: meta.border }
            : styles.chipInactive,
        ]}
      >
        <Text style={[styles.count, { color: active ? meta.color : PARC_PC_COLORS.text_muted }]}>{count}</Text>
        <Icon name={meta.icon} size={12} color={active ? meta.color : PARC_PC_COLORS.text_dim} />
        <Text style={[styles.label, { color: active ? meta.color : PARC_PC_COLORS.text_dim }]}>{meta.label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  chipInactive: {
    backgroundColor: PARC_PC_COLORS.bg_card_elevated,
    borderColor: PARC_PC_COLORS.border_subtle,
  },
  count: {
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
