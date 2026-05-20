import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

const BAR_WIDTH = 200;

type SplashProgressBarProps = {
  progressValue: SharedValue<number>;
  isError?: boolean;
};

export const SplashProgressBar: React.FC<SplashProgressBarProps> = ({ progressValue, isError = false }) => {
  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, Math.min(1, progressValue.value)) * BAR_WIDTH,
  }));

  const glowPointStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.max(0, Math.min(1, progressValue.value)) * BAR_WIDTH - 4 }],
    opacity: interpolate(progressValue.value, [0, 0.02, 1], [0, 1, 1]),
  }));

  return (
    <Animated.View entering={FadeIn.delay(800).duration(360)} style={styles.wrap}>
      <View style={[styles.track, isError && styles.trackError]}>
        <Animated.View style={[styles.fillWrap, fillStyle]}>
          <LinearGradient
            colors={isError ? ['#DC2626', '#EF4444'] : [OBSIDIAN_COLORS.green_primary, OBSIDIAN_COLORS.green_light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.glowPoint, isError && styles.glowPointError, glowPointStyle]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  track: {
    width: BAR_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    overflow: 'hidden',
  },
  trackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  fillWrap: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  glowPoint: {
    position: 'absolute',
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OBSIDIAN_COLORS.green_light,
    shadowColor: OBSIDIAN_COLORS.green_light,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
  glowPointError: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
});
