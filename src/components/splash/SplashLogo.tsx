import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

export const SplashLogo: React.FC = () => {
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.3);

  useEffect(() => {
    ringScale.value = withDelay(
      1200,
      withRepeat(
        withSequence(withTiming(1.18, { duration: 1500 }), withTiming(1, { duration: 1200 })),
        -1,
        false,
      ),
    );

    ringOpacity.value = withDelay(
      1200,
      withRepeat(
        withSequence(withTiming(0.7, { duration: 1500 }), withTiming(0.25, { duration: 1200 })),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(ringScale);
      cancelAnimation(ringOpacity);
    };
  }, [ringOpacity, ringScale]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.delay(400).duration(340)} style={styles.wrap}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View entering={ZoomIn.delay(420).duration(420)} style={styles.logoSquare}>
        <View style={styles.iconWrap}>
          <View style={styles.drawerLine} />
          <View style={styles.drawerLine} />
          <View style={styles.drawerLine} />
          <View style={styles.drawerStem} />
          <View style={styles.drawerAccent} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 98,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 94,
    height: 94,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.4)',
  },
  logoSquare: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_primary,
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.35)',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    justifyContent: 'space-between',
    position: 'relative',
  },
  drawerLine: {
    height: 6,
    borderRadius: 2,
    backgroundColor: '#DCFCE7',
    opacity: 0.95,
  },
  drawerStem: {
    position: 'absolute',
    right: -3,
    top: 2,
    width: 3,
    height: 30,
    borderRadius: 2,
    backgroundColor: '#86EFAC',
  },
  drawerAccent: {
    position: 'absolute',
    left: -3,
    top: -2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 1,
    borderColor: 'rgba(240,253,244,0.7)',
  },
});
