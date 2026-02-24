import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  premiumColors,
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';

interface SkeletonLoaderProps {
  /** Nombre de lignes skeleton à afficher */
  count?: number;
}

/**
 * Ligne skeleton individuelle avec shimmer animé
 */
const SkeletonLine: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useSharedValue(0.3);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.skeletonRow, tablet && { padding: premiumSpacing.lg }]}>
      {/* Cercle icône */}
      <Animated.View style={[styles.skeletonCircle, shimmerStyle, tablet && { width: 52, height: 52, borderRadius: 26 }]} />

      {/* Contenu */}
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonTitle, shimmerStyle]} />
        <Animated.View style={[styles.skeletonSubtitle, shimmerStyle]} />
      </View>

      {/* Badge */}
      <Animated.View style={[styles.skeletonBadge, shimmerStyle]} />
    </View>
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
        <SkeletonLine key={i} delay={i * 150} />
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
    backgroundColor: premiumColors.glass.white,
    borderRadius: premiumBorderRadius.lg,
    borderWidth: 1,
    borderColor: premiumColors.glass.border,
    padding: premiumSpacing.md,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: premiumColors.borderLight,
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
    backgroundColor: premiumColors.borderLight,
  },
  skeletonSubtitle: {
    height: 10,
    width: '50%',
    borderRadius: 5,
    backgroundColor: premiumColors.borderLight,
  },
  skeletonBadge: {
    height: 24,
    width: 60,
    borderRadius: 12,
    backgroundColor: premiumColors.borderLight,
    marginLeft: premiumSpacing.sm,
  },
});

export default SkeletonLoader;
