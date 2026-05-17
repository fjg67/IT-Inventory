import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type ScanAnimationState = 'idle' | 'scanning' | 'success' | 'error';

export const useScanAnimations = (scanState: ScanAnimationState) => {
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const frameCornersScale = useSharedValue(1);
  const scanLineY = useSharedValue(-90);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (scanState === 'idle' || scanState === 'scanning') {
      checkScale.value = 0;
      checkOpacity.value = 0;
      ringScale.value = 0.6;
      ringOpacity.value = 0;
      flashOpacity.value = 0;
      frameCornersScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1000 }),
          withTiming(0.97, { duration: 1000 }),
        ),
        -1,
        true,
      );
      scanLineY.value = withRepeat(
        withSequence(
          withTiming(90, { duration: 1500, easing: Easing.inOut(Easing.linear) }),
          withTiming(-90, { duration: 0 }),
        ),
        -1,
        false,
      );
      return;
    }

    scanLineY.value = withTiming(0, { duration: 100 });
    flashOpacity.value = withSequence(
      withTiming(0.85, { duration: 90 }),
      withTiming(0, { duration: 180 }),
    );
    frameCornersScale.value = withSequence(
      withSpring(1.15, { damping: 7, stiffness: 210 }),
      withSpring(1, { damping: 13, stiffness: 180 }),
    );
    checkOpacity.value = withTiming(1, { duration: 150 });
    checkScale.value = withSequence(
      withSpring(1.25, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 170 }),
    );
    ringOpacity.value = withSequence(
      withTiming(0.7, { duration: 50 }),
      withTiming(0, { duration: 550 }),
    );
    ringScale.value = withTiming(2.2, { duration: 600 });
  }, [checkOpacity, checkScale, flashOpacity, frameCornersScale, ringOpacity, ringScale, scanLineY, scanState]);

  return {
    checkStyle: useAnimatedStyle(() => ({
      transform: [{ scale: checkScale.value }],
      opacity: checkOpacity.value,
    })),
    ringStyle: useAnimatedStyle(() => ({
      transform: [{ scale: ringScale.value }],
      opacity: ringOpacity.value,
    })),
    frameCornersStyle: useAnimatedStyle(() => ({
      transform: [{ scale: frameCornersScale.value }],
    })),
    scanLineStyle: useAnimatedStyle(() => ({
      transform: [{ translateY: scanLineY.value }],
      opacity: scanState === 'idle' || scanState === 'scanning' ? 0.7 : 0,
    })),
    flashStyle: useAnimatedStyle(() => ({
      opacity: flashOpacity.value,
    })),
  };
};
