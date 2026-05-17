import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ONBOARDING_COLORS } from './tokens';

type OnboardingLogoProps = {
  subtitle?: string;
};

export const OnboardingLogo: React.FC<OnboardingLogoProps> = ({
  subtitle = 'GESTION DE STOCK IT',
}) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.3 }],
    opacity: 0.08 + pulse.value * 0.04,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none" />

      <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.logoWrap}>
        <LinearGradient
          colors={['#1B8A3E', '#0D5C26']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Text style={styles.logoText}>IT</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(90).duration(300)} style={styles.title}>
        IT-Inventory
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(160).duration(300)} style={styles.subtitle}>
        {subtitle}
      </Animated.Text>

      <View style={styles.separator} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 8,
  },
  halo: {
    position: 'absolute',
    top: -8,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: ONBOARDING_COLORS.green_light,
  },
  logoWrap: {
    marginBottom: 12,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ONBOARDING_COLORS.green_light,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    shadowOpacity: 0.35,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  title: {
    color: ONBOARDING_COLORS.text_primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: ONBOARDING_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  separator: {
    marginTop: 12,
    width: 120,
    height: 1,
    backgroundColor: 'rgba(34,197,94,0.25)',
  },
});
