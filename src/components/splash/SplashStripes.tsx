import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const STRIPES = [
  { color: '#1B8A3E', widthRatio: 0.65, delay: 100, opacity: 0.85 },
  { color: '#22C55E', widthRatio: 0.45, delay: 350, opacity: 0.7 },
  { color: '#0F5228', widthRatio: 0.3, delay: 550, opacity: 0.6 },
] as const;

const SKEW_ANGLE = -16;
const DURATION = 1000;

type SplashStripesProps = {
  onComplete?: () => void;
};

export const SplashStripes: React.FC<SplashStripesProps> = ({ onComplete }) => {
  const stripe1X = useSharedValue(-1.2);
  const stripe2X = useSharedValue(-1.2);
  const stripe3X = useSharedValue(-1.2);

  useEffect(() => {
    stripe1X.value = withDelay(
      STRIPES[0].delay,
      withTiming(1.6, {
        duration: DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
    );

    stripe2X.value = withDelay(
      STRIPES[1].delay,
      withTiming(1.6, {
        duration: DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
    );

    stripe3X.value = withDelay(
      STRIPES[2].delay,
      withTiming(1.6, {
        duration: DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
    );

    const totalDelay = STRIPES[STRIPES.length - 1].delay + DURATION;
    const timer = setTimeout(() => {
      onComplete?.();
    }, totalDelay);

    return () => {
      clearTimeout(timer);
      cancelAnimation(stripe1X);
      cancelAnimation(stripe2X);
      cancelAnimation(stripe3X);
    };
  }, [onComplete, stripe1X, stripe2X, stripe3X]);

  const stripe1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: stripe1X.value * W }, { skewX: `${SKEW_ANGLE}deg` }],
    opacity: STRIPES[0].opacity,
  }));

  const stripe2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: stripe2X.value * W }, { skewX: `${SKEW_ANGLE}deg` }],
    opacity: STRIPES[1].opacity,
  }));

  const stripe3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: stripe3X.value * W }, { skewX: `${SKEW_ANGLE}deg` }],
    opacity: STRIPES[2].opacity,
  }));

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View
        style={[
          styles.stripe,
          stripe1Style,
          { width: W * STRIPES[0].widthRatio, backgroundColor: STRIPES[0].color },
        ]}
      />
      <Animated.View
        style={[
          styles.stripe,
          stripe2Style,
          { width: W * STRIPES[1].widthRatio, backgroundColor: STRIPES[1].color },
        ]}
      />
      <Animated.View
        style={[
          styles.stripe,
          stripe3Style,
          { width: W * STRIPES[2].widthRatio, backgroundColor: STRIPES[2].color },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: -W,
    top: -H * 0.25,
    height: H * 1.5,
  },
});
