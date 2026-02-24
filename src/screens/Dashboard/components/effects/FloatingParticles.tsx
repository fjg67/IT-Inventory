import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { premiumAnimation } from '../../../../constants/premiumTheme';
import { isTablet as checkIsTablet } from '../../../../utils/responsive';

interface ParticleConfig {
  id: number;
  startX: number;
  startY: number;
  size: number;
  opacity: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

interface FloatingParticlesProps {
  /** Nombre de particules (5-8 recommandé pour performance Zebra) */
  count?: number;
  /** Largeur du conteneur */
  width?: number;
  /** Hauteur du conteneur */
  height?: number;
}

/**
 * Particule individuelle animée
 */
const Particle: React.FC<{ config: ParticleConfig }> = ({ config }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const particleOpacity = useSharedValue(config.opacity);

  useEffect(() => {
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftX, {
            duration: config.duration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: config.duration,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );

    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftY, {
            duration: config.duration * 1.2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: config.duration * 1.2,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );

    particleOpacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.opacity * 0.3, {
            duration: config.duration * 0.8,
          }),
          withTiming(config.opacity, {
            duration: config.duration * 0.8,
          }),
        ),
        -1,
        true,
      ),
    );
  }, [config, translateX, translateY, particleOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: particleOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: config.startX,
          top: config.startY,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Particules flottantes légères
 * Utilisé en arrière-plan du bouton scan pour un effet premium
 */
const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 6,
  width: widthProp,
  height: heightProp,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const tablet = checkIsTablet(screenWidth);
  const width = widthProp ?? (tablet ? 480 : 300);
  const height = heightProp ?? (tablet ? 240 : 180);

  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      startX: Math.random() * (width - 10),
      startY: Math.random() * (height - 10),
      size: 3 + Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.25,
      driftX: (Math.random() - 0.5) * 40,
      driftY: -20 - Math.random() * 30,
      duration: premiumAnimation.particleDuration + Math.random() * 2000,
      delay: i * 300,
    }));
  }, [count, width, height]);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {particles.map(p => (
        <Particle key={p.id} config={p} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default FloatingParticles;
