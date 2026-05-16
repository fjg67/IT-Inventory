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
import LinearGradient from 'react-native-linear-gradient';
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
        <LinearGradient
          colors={['#1B8A3E', '#0D5C26']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.logoBox}
        >
          <Text style={styles.logoText}>IT</Text>
        </LinearGradient>
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
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LOGIN_COLORS.green_light,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
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
