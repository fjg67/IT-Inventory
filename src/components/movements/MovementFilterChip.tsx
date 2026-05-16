import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MovementTypeKey, MOVEMENT_TYPE_COLORS } from '@/constants/movementTypes';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface MovementFilterChipProps {
  type: MovementTypeKey;
  active: boolean;
  count: number;
  onPress: () => void;
}

export const MovementFilterChip: React.FC<MovementFilterChipProps> = ({ type, active, count, onPress }) => {
  const scale = useSharedValue(1);
  const meta = type === 'tous' ? null : MOVEMENT_TYPE_COLORS[type];
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.92, { damping: 16, stiffness: 260 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 260 }); }}
        style={[
          styles.wrap,
          active && styles.activeWrap,
          active && meta ? { backgroundColor: meta.bg, borderColor: meta.border } : null,
          type === 'tous' && active ? styles.allActive : null,
        ]}
      >
        {meta ? <Icon name={meta.icon} size={12} color={active ? meta.text : OBSIDIAN_COLORS.text_muted} /> : <Icon name="format-list-bulleted" size={12} color={active ? '#FFFFFF' : OBSIDIAN_COLORS.text_muted} />}
        <Text style={[styles.label, active && { color: meta ? meta.text : '#FFFFFF', fontWeight: '700' }]} numberOfLines={1}>
          {type === 'tous' ? 'Tous' : meta?.label}
        </Text>
        <View style={[styles.countPill, active ? styles.countPillActive : styles.countPillInactive, active && meta ? { backgroundColor: 'rgba(255,255,255,0.2)' } : null]}>
          <Text style={[styles.countText, active ? styles.countTextActive : styles.countTextInactive]}>{count}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeWrap: {
    shadowColor: OBSIDIAN_COLORS.green_light,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  allActive: {
    backgroundColor: OBSIDIAN_COLORS.green_primary,
  },
  label: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 13,
    fontWeight: '600',
  },
  countPill: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillInactive: {
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
  },
  countPillActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countTextInactive: {
    color: OBSIDIAN_COLORS.text_dim,
  },
  countTextActive: {
    color: '#FFFFFF',
  },
});
