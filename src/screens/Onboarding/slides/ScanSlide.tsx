// ============================================
// SCAN SLIDE - Design premium
// IT-Inventory Onboarding
// ============================================

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { onboardingTheme } from '@/constants/onboardingTheme';

const ScanSlide = () => {
  const lineTranslateY = useSharedValue(-60);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    lineTranslateY.value = withRepeat(
      withSequence(
        withTiming(60, { duration: 1800 }),
        withTiming(-60, { duration: 0 })
      ),
      -1,
      false
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(0.25, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [lineTranslateY, pulseScale, glowOpacity]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lineTranslateY.value }],
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.iconWrapper, iconWrapStyle]}
        entering={ZoomIn.duration(600).springify()}
      >
        {/* Carte glass + glow */}
        <Animated.View style={[styles.glowRing, glowStyle]} />
        <View style={styles.glassCard}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.25)', 'rgba(37, 99, 235, 0.15)']}
            style={styles.iconGradient}
          >
            <Icon
              name="barcode-scan"
              size={80}
              color={onboardingTheme.colors.primaryLight}
            />
            <Animated.View style={[styles.scanLine, animatedLineStyle]} />
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.Text
        style={styles.title}
        entering={FadeInUp.delay(250).duration(500)}
      >
        Scan en un instant
      </Animated.Text>

      <Animated.Text
        style={styles.subtitle}
        entering={FadeInUp.delay(450).duration(500)}
      >
        Utilisez la caméra de votre téléphone pour scanner et identifier vos articles en une seconde.
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: onboardingTheme.layout.slidePadding,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: onboardingTheme.colors.primaryLight,
    shadowColor: onboardingTheme.colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 8,
  },
  glassCard: {
    width: 160,
    height: 160,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: onboardingTheme.colors.accent,
    shadowColor: onboardingTheme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    ...onboardingTheme.typography.title,
    marginBottom: 16,
    fontSize: 30,
  },
  subtitle: {
    ...onboardingTheme.typography.subtitle,
  },
});

export default ScanSlide;
