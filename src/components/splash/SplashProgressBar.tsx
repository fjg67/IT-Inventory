import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

const BAR_WIDTH = 220;

type SplashProgressBarProps = {
  progressValue: SharedValue<number>;
  label: string;
  isError?: boolean;
};

export const SplashProgressBar: React.FC<SplashProgressBarProps> = ({ progressValue, label, isError = false }) => {
  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, Math.min(1, progressValue.value)) * BAR_WIDTH,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.max(0, Math.min(1, progressValue.value)) * BAR_WIDTH - 5 }],
    opacity: progressValue.value > 0.02 ? 1 : 0,
  }));

  return (
    <Animated.View entering={FadeIn.delay(800).duration(320)} style={styles.container}>
      <View style={[styles.rail, isError && styles.railError]}>
        <Animated.View style={[styles.fill, isError && styles.fillError, fillStyle]} />
        <Animated.View style={[styles.glowDot, isError && styles.glowDotError, glowStyle]} />
      </View>
      <Text style={[styles.label, isError && styles.labelError]}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  rail: {
    width: BAR_WIDTH,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(34,197,94,0.12)',
    overflow: 'visible',
    position: 'relative',
  },
  railError: {
    backgroundColor: 'rgba(239,68,68,0.14)',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  fillError: {
    backgroundColor: '#EF4444',
  },
  glowDot: {
    position: 'absolute',
    top: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  glowDotError: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  label: {
    fontSize: 11,
    color: 'rgba(134,239,172,0.45)',
    letterSpacing: 0.3,
  },
  labelError: {
    color: 'rgba(252,165,165,0.9)',
  },
});
