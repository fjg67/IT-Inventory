import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { GridBackground } from '@/components/onboarding/GridBackground';
import { OBSIDIAN_COLORS } from '@/constants/colors';

const circleSpecs = [
  { size: 380, top: -120, right: -100, baseOpacity: 0.07, delay: 0 },
  { size: 250, bottom: -80, left: -80, baseOpacity: 0.05, delay: 700 },
  { size: 140, top: 80, left: -30, baseOpacity: 0.04, delay: 1200 },
] as const;

const AnimatedCircle: React.FC<(typeof circleSpecs)[number]> = ({
  size,
  top,
  right,
  bottom,
  left,
  baseOpacity,
}) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
    opacity: baseOpacity + pulse.value * 0.03,
  }));

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          right,
          bottom,
          left,
        },
        style,
      ]}
    />
  );
};

export const SplashBackground: React.FC = () => {
  return (
    <View style={styles.container}>
      <GridBackground />
      {circleSpecs.map((spec, idx) => (
        <AnimatedCircle key={`circle-${idx}`} {...spec} />
      ))}
      <View pointerEvents="none" style={styles.vignette} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OBSIDIAN_COLORS.bg_primary,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    backgroundColor: OBSIDIAN_COLORS.green_light,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
});
