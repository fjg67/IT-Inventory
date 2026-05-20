import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface CategoryChipProps {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CategoryChip: React.FC<CategoryChipProps> = ({ label, icon, selected, onPress, disabled = false }) => {
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
        pressAnim.value = withSpring(0.94, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        pressAnim.value = withSpring(1, { damping: 14, stiffness: 180 });
      }}
      style={[styles.chip, animatedStyle]}
    >
      <View style={styles.content}>
        <Icon name={icon} size={18} color={selected ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_dim} />
        <Text style={[styles.label, selected ? styles.labelActive : null]}>{label}</Text>
      </View>
      {selected ? <Icon name="check-circle" size={14} color={OBSIDIAN_COLORS.green_light} /> : null}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  label: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  labelActive: {
    color: OBSIDIAN_COLORS.green_light,
    fontWeight: '700',
  },
});

export default CategoryChip;
