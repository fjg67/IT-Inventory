import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface ModelChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ModelChip: React.FC<ModelChipProps> = ({ label, selected, onPress, disabled = false }) => {
  const selectedAnim = useSharedValue(selected ? 1 : 0);
  const pressAnim = useSharedValue(1);

  useEffect(() => {
    selectedAnim.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, selectedAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectedAnim.value,
      [0, 1],
      [OBSIDIAN_COLORS.bg_card, 'rgba(34, 197, 94, 0.10)'],
    ),
    borderColor: interpolateColor(
      selectedAnim.value,
      [0, 1],
      ['rgba(34, 197, 94, 0.06)', 'rgba(34, 197, 94, 0.30)'],
    ),
    transform: [{ scale: pressAnim.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        pressAnim.value = withSpring(0.97, { damping: 16, stiffness: 210 });
      }}
      onPressOut={() => {
        pressAnim.value = withSpring(1, { damping: 14, stiffness: 180 });
      }}
      style={[styles.chip, animatedStyle]}
    >
      <Icon name="tag-outline" size={16} color={selected ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_dim} />
      <Text style={[styles.label, selected ? styles.labelActive : null]}>{label}</Text>
      <Icon
        name={selected ? 'check-circle' : 'circle-outline'}
        size={14}
        color={selected ? OBSIDIAN_COLORS.green_light : 'transparent'}
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    flex: 1,
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    color: OBSIDIAN_COLORS.green_light,
    fontWeight: '700',
  },
});

export default ModelChip;
