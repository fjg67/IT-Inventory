import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DOT_DELAYS = [900, 1100, 1300];

const AnimatedDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useSharedValue(0.2);
  const scale = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.2, { duration: 600 })),
        -1,
        false,
      );
      scale.value = withRepeat(
        withSequence(withTiming(1.4, { duration: 300 }), withTiming(1, { duration: 600 })),
        -1,
        false,
      );
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [delay, opacity, scale]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
};

type SplashDotsProps = {
  showReadyCheck?: boolean;
};

export const SplashDots: React.FC<SplashDotsProps> = ({ showReadyCheck = false }) => {
  if (showReadyCheck) {
    return (
      <Animated.View entering={ZoomIn.duration(260)} style={styles.checkWrap}>
        <Animated.Text entering={FadeIn.duration(220)} style={styles.checkText}>
          ✓
        </Animated.Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.row}>
      {DOT_DELAYS.map((delay) => (
        <AnimatedDot key={delay} delay={delay} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '900',
    marginTop: -1,
  },
});
