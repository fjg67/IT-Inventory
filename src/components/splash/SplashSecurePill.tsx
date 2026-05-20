import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

type SplashSecurePillProps = {
  offline?: boolean;
};

export const SplashSecurePill: React.FC<SplashSecurePillProps> = ({ offline = false }) => {
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(dotOpacity);
    };
  }, [dotOpacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const tone = offline
    ? {
        color: '#EF4444',
        border: 'rgba(239,68,68,0.35)',
        bg: 'rgba(127,29,29,0.25)',
        label: 'HORS LIGNE',
      }
    : {
        color: OBSIDIAN_COLORS.green_light,
        border: 'rgba(34, 197, 94, 0.3)',
        bg: OBSIDIAN_COLORS.bg_card,
        label: 'CONNEXION SECURISEE',
      };

  return (
    <Animated.View entering={FadeIn.delay(700).duration(380)} style={[styles.pill, { borderColor: tone.border, backgroundColor: tone.bg }]}> 
      <Animated.View style={[styles.dot, { backgroundColor: tone.color }, dotStyle]} />
      <Icon name="shield-check-outline" size={13} color={tone.color} />
      <Text style={[styles.label, { color: tone.color }]}>{tone.label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pill: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
