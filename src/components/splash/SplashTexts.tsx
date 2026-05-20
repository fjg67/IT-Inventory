import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

export const SplashTexts: React.FC = () => {
  const lineScale = useSharedValue(0);

  useEffect(() => {
    lineScale.value = withTiming(1, {
      duration: 400,
      delay: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [lineScale]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: lineScale.value }],
    opacity: lineScale.value,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={styles.title}>
        IT-Inventory
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(450).duration(400)} style={styles.subtitle}>
        GESTION DE STOCK INTELLIGENTE
      </Animated.Text>

      <Animated.View style={[styles.separator, lineStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(34,197,94,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  separator: {
    width: 80,
    height: 1,
    marginTop: 14,
    overflow: 'hidden',
  },
});
