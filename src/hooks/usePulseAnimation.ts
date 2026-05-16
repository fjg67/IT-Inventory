import { useEffect } from 'react';
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface PulseOptions {
  minScale?: number;
  maxScale?: number;
  minOpacity?: number;
  maxOpacity?: number;
  duration?: number;
}

export const usePulseAnimation = (options?: PulseOptions) => {
  const minScale = options?.minScale ?? 1;
  const maxScale = options?.maxScale ?? 1.15;
  const minOpacity = options?.minOpacity ?? 0.6;
  const maxOpacity = options?.maxOpacity ?? 1;
  const duration = options?.duration ?? 1500;

  const scale = useSharedValue(minScale);
  const opacity = useSharedValue(maxOpacity);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(maxScale, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    opacity.value = withRepeat(
      withTiming(minOpacity, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      scale.value = minScale;
      opacity.value = maxOpacity;
    };
  }, [duration, maxOpacity, maxScale, minOpacity, minScale, opacity, scale]);

  return {
    scale,
    opacity,
  };
};
