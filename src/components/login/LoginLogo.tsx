import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LOGIN_COLORS } from './loginTheme';

const LoginLogo: React.FC = () => {
  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0.2);

  useEffect(() => {
    haloScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 2000 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      false,
    );

    haloOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 2000 }),
        withTiming(0.2, { duration: 1500 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(haloScale);
      cancelAnimation(haloOpacity);
    };
  }, [haloOpacity, haloScale]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.halo, haloStyle]} />

      <Animated.View entering={ZoomIn.springify().damping(14).duration(600)}>
        <View style={styles.logoDisc}>
          <View style={styles.iconWrap}>
            <View style={styles.iconLine} />
            <View style={styles.iconLine} />
            <View style={styles.iconLine} />
            <View style={styles.iconStem} />
          </View>
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(500).delay(200)} style={styles.title}>
        IT-Inventory
      </Animated.Text>

      <Animated.Text entering={FadeInDown.duration(500).delay(300)} style={styles.subtitle}>
        GESTION DE STOCK IT
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  halo: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    top: 0,
  },
  logoDisc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LOGIN_COLORS.green_light,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 26,
    height: 26,
    justifyContent: 'space-between',
    position: 'relative',
  },
  iconLine: {
    height: 5,
    borderRadius: 2,
    backgroundColor: '#22C55E',
  },
  iconStem: {
    position: 'absolute',
    right: -3,
    top: 1,
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#16A34A',
  },
  title: {
    marginTop: 16,
    color: LOGIN_COLORS.text_primary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    color: LOGIN_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3,
  },
});

export default LoginLogo;
