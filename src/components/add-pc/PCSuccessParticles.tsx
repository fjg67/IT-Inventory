// components/add-pc/PCSuccessParticles.tsx
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface ParticleData {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  isSquare: boolean;
}

const generateParticles = (color: string): ParticleData[] => {
  const COLORS = [color, '#22C55E', '#86EFAC', '#F0FDF4', '#6B7280'];
  return Array.from({ length: 28 }, (_, i) => ({
    id: i,
    angle: (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
    distance: 70 + Math.random() * 90,
    size: 3 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: i * 8 + Math.random() * 20,
    isSquare: Math.random() > 0.6,
  }));
};

interface ParticleProps {
  data: ParticleData;
  trigger: boolean;
}

const Particle: React.FC<ParticleProps> = ({ data, trigger }) => {
  const tx = Math.cos(data.angle) * data.distance;
  const ty = Math.sin(data.angle) * data.distance;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scaleV = useSharedValue(1);

  useEffect(() => {
    if (!trigger) return;

    // Reset
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 0;
    scaleV.value = 1;

    const d = Math.round(data.delay);

    // Phase 1 : burst sortant
    translateX.value = withDelay(
      d,
      withTiming(tx, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      d,
      withTiming(ty, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(d, withTiming(1, { duration: 80 }));

    // Phase 2 : fadeout
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      translateX.value = withTiming(tx * 1.3, { duration: 300 });
      translateY.value = withTiming(ty * 1.3, { duration: 300 });
      scaleV.value = withTiming(0.2, { duration: 300 });
    }, d + 300);

    return () => {
      clearTimeout(timer);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(scaleV);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scaleV.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          width: data.size,
          height: data.size,
          borderRadius: data.isSquare ? 2 : data.size / 2,
          backgroundColor: data.color,
        },
      ]}
    />
  );
};

interface PCSuccessParticlesProps {
  color: string;
  trigger: boolean;
}

export const PCSuccessParticles: React.FC<PCSuccessParticlesProps> = ({ color, trigger }) => {
  const particles = useMemo(() => generateParticles(color), [color]);

  return (
    <View style={styles.center} pointerEvents="none">
      <View style={styles.origin}>
        {particles.map((p) => (
          <Particle key={p.id} data={p} trigger={trigger} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: '38%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  origin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
