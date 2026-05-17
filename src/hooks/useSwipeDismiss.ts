import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export const useSwipeDismiss = (onDismiss: () => void, threshold = 80) => {
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > threshold) {
        translateY.value = withTiming(420, { duration: 240 }, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        });
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [0, 220], [1, 0.52], Extrapolation.CLAMP),
  }));

  return { gesture, animatedStyle };
};
