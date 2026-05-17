import {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

export const HERO_MAX_HEIGHT = 280;
export const HERO_MIN_HEIGHT = 80;

export const useScrollHero = () => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroHeight = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, HERO_MAX_HEIGHT - HERO_MIN_HEIGHT],
      [HERO_MAX_HEIGHT, HERO_MIN_HEIGHT],
      Extrapolation.CLAMP,
    ),
  }));

  const photoOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(scrollY.value, [0, 80], [1, 0.7], Extrapolation.CLAMP),
      },
    ],
  }));

  const compactTitleOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [60, 100], [0, 1], Extrapolation.CLAMP),
  }));

  return { scrollHandler, heroHeight, photoOpacity, compactTitleOpacity };
};
