import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  FadeInUp,
} from 'react-native-reanimated';
import {
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

interface SkeletonLoaderProps {
  /** Nombre de lignes skeleton à afficher */
  count?: number;
}

/**
 * Ligne skeleton individuelle avec shimmer sweep animé
 */
const SkeletonLine: React.FC<{ delay: number; index: number }> = ({ delay, index }) => {
  const shimmerX = useSharedValue(0);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      shimmerX.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.linear }),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerX.value, [0, 1], [-width, width]) }],
  }));

  const shimmerColor = colors.isDark
    ? 'rgba(255,255,255,0.07)'
    : 'rgba(255,255,255,0.5)';

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(300)}
      style={[
        styles.skeletonRow,
        { backgroundColor: colors.surfaceGlass, borderColor: colors.borderSubtle, overflow: 'hidden' },
        tablet && { padding: premiumSpacing.lg },
      ]}
    >
      {/* Shimmer overlay */}
      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>

      {/* Cercle icône */}
      <View style={[styles.skeletonCircle, { backgroundColor: colors.skeleton }, tablet && { width: 52, height: 52, borderRadius: 26 }]} />

      {/* Contenu */}
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonTitle, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.skeletonSubtitle, { backgroundColor: colors.skeleton }]} />
      </View>

      {/* Badge */}
      <View style={[styles.skeletonBadge, { backgroundColor: colors.skeleton }]} />
    </Animated.View>
  );
};

/**
 * Skeleton loader pour la liste de mouvements
 * Affiche des lignes placeholder animées pendant le chargement
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 3 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonLine key={i} delay={i * 150} index={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: premiumSpacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: premiumBorderRadius.lg,
    borderWidth: 1,
    padding: premiumSpacing.md,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  shimmerGradient: {
    flex: 1,
    width: 120,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: premiumSpacing.md,
  },
  skeletonContent: {
    flex: 1,
    gap: 6,
  },
  skeletonTitle: {
    height: 14,
    width: '70%',
    borderRadius: 7,
  },
  skeletonSubtitle: {
    height: 10,
    width: '50%',
    borderRadius: 5,
  },
  skeletonBadge: {
    height: 24,
    width: 60,
    borderRadius: 12,
    marginLeft: premiumSpacing.sm,
  },
});

export default SkeletonLoader;
