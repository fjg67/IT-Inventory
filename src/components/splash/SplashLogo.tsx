import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

export const SplashLogo: React.FC = () => {
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);

  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.35);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.5);
  const haloOpacity = useSharedValue(0.4);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    logoScale.value = withSpring(1, { damping: 10, stiffness: 120 });

    ring1Scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    ring1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    ring2Scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    ring2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.42, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    haloOpacity.value = withRepeat(
      withSequence(
        withTiming(0.82, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(logoScale);
      cancelAnimation(logoOpacity);
      cancelAnimation(ring1Scale);
      cancelAnimation(ring1Opacity);
      cancelAnimation(ring2Scale);
      cancelAnimation(ring2Opacity);
      cancelAnimation(haloOpacity);
    };
  }, [
    haloOpacity,
    logoOpacity,
    logoScale,
    ring1Opacity,
    ring1Scale,
    ring2Opacity,
    ring2Scale,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.halo, haloStyle]} />
      <Animated.View style={[styles.ringOuter, ring1Style]} />
      <Animated.View style={[styles.ringInner, ring2Style]} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoCircle}>
          <View style={styles.logoMarkWrap}>
            <View style={styles.markBar}>
              <View style={styles.markBarLeft} />
            </View>
            <View style={styles.markBar}>
              <View style={styles.markBarLeft} />
            </View>
            <View style={styles.markBar}>
              <View style={styles.markBarLeft} />
            </View>
          </View>
          <View style={styles.logoDot} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  halo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
  },
  ringOuter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  ringInner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  logoContainer: {
    width: 72,
    height: 72,
    shadowColor: OBSIDIAN_COLORS.green_light,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0C5A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  logoMarkWrap: {
    width: 33,
    gap: 3,
  },
  markBar: {
    height: 8,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    overflow: 'hidden',
  },
  markBarLeft: {
    width: 10,
    height: '100%',
    backgroundColor: '#0B9D47',
  },
  logoDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#A78BFA',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
