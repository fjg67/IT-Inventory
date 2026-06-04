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
import { PCStatus } from '@/hooks/useAddPCForm';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface StatusChipProps {
  value: PCStatus;
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const STATUS_COLORS: Record<PCStatus, { color: string; subtle: string; border: string }> = {
  a_chaud: { color: '#22C55E', subtle: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)' },
  a_reusiner: { color: '#F59E0B', subtle: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
  en_usinage: { color: '#F59E0B', subtle: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  disponible: { color: '#3B82F6', subtle: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)' },
  envoye: { color: '#8B5CF6', subtle: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.30)' },
  en_panne: { color: '#EF4444', subtle: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.40)' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const StatusChip: React.FC<StatusChipProps> = ({
  value,
  label,
  icon,
  selected,
  onPress,
  disabled = false,
}) => {
  const selectedAnim = useSharedValue(selected ? 1 : 0);
  const pressAnim = useSharedValue(1);
  const palette = STATUS_COLORS[value] ?? STATUS_COLORS.a_reusiner;

  useEffect(() => {
    selectedAnim.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, selectedAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectedAnim.value,
      [0, 1],
      [OBSIDIAN_COLORS.bg_card, palette.subtle],
    ),
    borderColor: interpolateColor(
      selectedAnim.value,
      [0, 1],
      ['rgba(34, 197, 94, 0.06)', palette.border],
    ),
    transform: [{ scale: pressAnim.value }],
  }));

  const tone = selected ? palette.color : OBSIDIAN_COLORS.text_muted;

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        pressAnim.value = withSpring(0.92, { damping: 15, stiffness: 220 });
      }}
      onPressOut={() => {
        pressAnim.value = withSpring(1, { damping: 14, stiffness: 180 });
      }}
      style={[styles.chip, animatedStyle]}
    >
      <Icon name={icon} size={14} color={tone} />
      <Text style={[styles.label, selected ? styles.labelActive : null, { color: tone }]}>{label}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '700',
  },
});

export default StatusChip;
