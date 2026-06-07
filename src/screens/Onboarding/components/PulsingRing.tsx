import React, { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

type PulsingRingProps = {
  size: number;
  color: string;
  delay?: number;
  active: boolean;
};

export const PulsingRing: React.FC<PulsingRingProps> = ({ size, color, delay = 0, active }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(opacity);

    if (!active) {
      scale.value = 1;
      opacity.value = 0.25;
      return;
    }

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1.12, { duration: 1800 }), withTiming(1.0, { duration: 1400 })),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(0.8, { duration: 1800 }), withTiming(0.3, { duration: 1400 })),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [active, delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: color,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    position: 'absolute',
  }));

  return <Animated.View style={style} />;
};
