import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

type SplashStatusRowProps = {
  isError?: boolean;
};

export const SplashStatusRow: React.FC<SplashStatusRowProps> = ({ isError = false }) => {
  const dot1 = useSharedValue(0.2);
  const dot2 = useSharedValue(0.2);
  const dot3 = useSharedValue(0.2);

  useEffect(() => {
    const pulse = () => withRepeat(
      withSequence(
        withTiming(1, { duration: 260, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.2, { duration: 380, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    dot1.value = pulse();
    dot2.value = withDelay(200, pulse());
    dot3.value = withDelay(400, pulse());

    return () => {
      cancelAnimation(dot1);
      cancelAnimation(dot2);
      cancelAnimation(dot3);
    };
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  const tone = isError ? '#EF4444' : OBSIDIAN_COLORS.green_light;

  return (
    <Animated.View entering={FadeIn.delay(900).duration(320)} style={styles.wrap}>
      <Text style={styles.left}>INITIALISATION</Text>
      <View style={styles.dotsWrap}>
        <Animated.View style={[styles.dot, { backgroundColor: tone }, dot1Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: tone }, dot2Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: tone }, dot3Style]} />
      </View>
      <Text style={[styles.right, { color: tone }]}>{isError ? 'ERREUR' : 'EN COURS'}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    width: 250,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    fontSize: 9,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.text_dim,
    letterSpacing: 1.5,
  },
  right: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  dotsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
