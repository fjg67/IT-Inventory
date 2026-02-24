// ============================================
// SLIDE INDICATOR - IT-Inventory Application
// Indicateurs de progression modernes
// ============================================

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { onboardingTheme } from '@/constants/onboardingTheme';

interface SlideIndicatorProps {
  total: number;
  current: number;
}

const Dot = ({ active }: { active: boolean }) => {
  const width = useSharedValue(active ? 24 : 8);
  const opacity = useSharedValue(active ? 1 : 0.45);

  useEffect(() => {
    width.value = withSpring(active ? 24 : 8, {
      damping: 14,
      stiffness: 120,
    });
    opacity.value = withTiming(active ? 1 : 0.45, { duration: 200 });
  }, [active, width, opacity]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        active ? styles.dotActive : styles.dotInactive,
        active && styles.dotGlow,
        style,
      ]}
    />
  );
};

const SlideIndicator: React.FC<SlideIndicatorProps> = ({ total, current }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <Dot key={index} active={index === current} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: onboardingTheme.colors.primaryLight,
  },
  dotInactive: {
    backgroundColor: onboardingTheme.colors.ui.dotInactive,
  },
  dotGlow: {
    shadowColor: onboardingTheme.colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default SlideIndicator;
