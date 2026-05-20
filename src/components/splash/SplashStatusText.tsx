import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

type SplashStatusTextProps = {
  statusText: string;
  isError?: boolean;
};

export const SplashStatusText: React.FC<SplashStatusTextProps> = ({ statusText, isError = false }) => {
  const textOpacity = useSharedValue(1);
  const prevTextRef = useRef(statusText);

  useEffect(() => {
    if (statusText !== prevTextRef.current) {
      textOpacity.value = withSequence(
        withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
      );
      prevTextRef.current = statusText;
    }
  }, [statusText, textOpacity]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Animated.Text entering={FadeIn.delay(900).duration(320)} style={[styles.text, isError && styles.errorText, textStyle]}>
      {statusText}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
    color: OBSIDIAN_COLORS.text_secondary,
    textAlign: 'center',
  },
  errorText: {
    color: '#FCA5A5',
  },
});
