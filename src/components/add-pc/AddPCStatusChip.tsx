import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { PCStatusUIConfig } from '@/constants/pcStatusColors';
import { PCStatus } from '@/types/pc.types';

interface AddPCStatusChipProps {
  statusKey: PCStatus;
  config: PCStatusUIConfig;
  isActive: boolean;
  onPress: (status: PCStatus) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AddPCStatusChip: React.FC<AddPCStatusChipProps> = ({
  statusKey,
  config,
  isActive,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const ripple = useSharedValue(0);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 9, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    );
    ripple.value = withSequence(
      withTiming(0.28, { duration: 70 }),
      withTiming(0, { duration: 360 }),
    );
    onPress(statusKey);
  };

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isActive ? config.subtle : '#16231A',
    borderColor: isActive ? config.border : 'rgba(148,163,184,0.14)',
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: ripple.value,
    backgroundColor: interpolateColor(ripple.value, [0, 1], ['transparent', config.color]),
  }));

  return (
    <AnimatedPressable onPress={handlePress} style={[styles.chip, chipStyle]}>
      <Animated.View pointerEvents="none" style={[styles.ripple, rippleStyle]} />
      {isActive ? <Animated.View style={[styles.activeDot, { backgroundColor: config.color }]} /> : null}
      <Icon name={config.icon} size={18} color={isActive ? config.color : '#93A4A0'} />
      <Text style={[styles.label, isActive ? { color: config.color } : styles.labelMuted]}>{config.label}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 74,
    borderRadius: 13,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 7,
    right: 7,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelMuted: {
    color: '#9AA8A4',
  },
});
