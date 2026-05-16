import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { PCStateMeta } from '@/constants/pcStates';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PCStateFilterButtonProps {
  meta: PCStateMeta;
  active: boolean;
  count: number;
  onPress: () => void;
}

export const PCStateFilterButton: React.FC<PCStateFilterButtonProps> = ({ meta, active, count, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(180)} style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 16, stiffness: 260 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 260 }); }}
        style={[
          styles.button,
          {
            backgroundColor: active ? meta.bg : OBSIDIAN_COLORS.bg_card_elevated,
            borderColor: active ? meta.border : OBSIDIAN_COLORS.border_subtle,
          },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: active ? meta.bg : OBSIDIAN_COLORS.bg_card }]}>
          <Text style={[styles.badgeText, { color: active ? meta.text : OBSIDIAN_COLORS.text_muted }]}>{count}</Text>
        </View>
        <Icon name={meta.icon} size={14} color={active ? meta.text : OBSIDIAN_COLORS.text_muted} />
        <Text style={[styles.label, { color: active ? meta.text : OBSIDIAN_COLORS.text_muted }]} numberOfLines={1}>{meta.label}</Text>
        {active ? <Icon name="check" size={14} color={meta.text} /> : null}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
});
