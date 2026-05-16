import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TAB_BAR_COLORS } from '@/constants/tabConfig';

interface TabBadgeProps {
  count: number;
  visible: boolean;
}

const TabBadge: React.FC<TabBadgeProps> = ({ count, visible }) => {
  const popScale = useSharedValue(0);
  const idleScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      popScale.value = withSequence(
        withSpring(1.2, { damping: 11, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 220 }),
      );
      idleScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(idleScale);
      popScale.value = withSpring(0, { damping: 14, stiffness: 260 });
      idleScale.value = 1;
    }

    return () => {
      cancelAnimation(popScale);
      cancelAnimation(idleScale);
    };
  }, [visible, idleScale, popScale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popScale.value * idleScale.value }],
    opacity: popScale.value,
  }));

  if (!visible) {
    return null;
  }

  const display = count > 99 ? '99+' : String(count);

  return (
    <Animated.View style={[styles.badge, animStyle]}>
      <View style={styles.inner}>
        <Text style={styles.text}>{display}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    zIndex: 2,
  },
  inner: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TAB_BAR_COLORS.danger,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
});

export default TabBadge;
