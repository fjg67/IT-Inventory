import { useEffect, useState } from 'react';
import { Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';

interface UseCountUpOptions {
  duration?: number;
}

export const useCountUp = (target: number, options?: UseCountUpOptions): number => {
  const duration = options?.duration ?? 600;
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useAnimatedReaction(
    () => Math.round(animatedValue.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayValue)(current);
      }
    },
    [animatedValue],
  );

  useEffect(() => {
    animatedValue.value = 0;
    animatedValue.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedValue, duration, target]);

  return displayValue;
};
