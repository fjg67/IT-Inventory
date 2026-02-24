import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
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
import { isTablet as checkIsTablet } from '../../../utils/responsive';

const SkeletonCard: React.FC<{ delay: number }> = ({ delay }) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const opacity = useSharedValue(0.3);

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

  const shimmer = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.card, tablet && { padding: premiumSpacing.xl }]}>
      {/* Icon placeholder */}
      <Animated.View style={[styles.iconPlaceholder, tablet && { width: 56, height: 56 }, shimmer]} />

      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.titleLine, tablet && { height: 16 }, shimmer]} />
        <Animated.View style={[styles.descLine, tablet && { height: 12 }, shimmer]} />
        <View style={styles.footerRow}>
          <Animated.View style={[styles.badgePlaceholder, tablet && { height: 26, width: 80 }, shimmer]} />
          <Animated.View style={[styles.metaPlaceholder, tablet && { height: 14, width: 70 }, shimmer]} />
        </View>
      </View>

      {/* Chevron */}
      <Animated.View style={[styles.chevronPlaceholder, shimmer]} />
    </View>
  );
};

interface SkeletonArticleListProps {
  count?: number;
}

const SkeletonArticleList: React.FC<SkeletonArticleListProps> = ({ count = 6 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} delay={i * 120} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: premiumSpacing.lg,
    paddingTop: premiumSpacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: premiumColors.surface,
    borderRadius: premiumBorderRadius.lg,
    borderWidth: 1,
    borderColor: premiumColors.borderLight,
    padding: premiumSpacing.lg,
    marginBottom: premiumSpacing.sm,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: premiumBorderRadius.md,
    backgroundColor: premiumColors.borderLight,
    marginRight: premiumSpacing.md,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  titleLine: {
    height: 14,
    width: '75%',
    borderRadius: 7,
    backgroundColor: premiumColors.borderLight,
  },
  descLine: {
    height: 10,
    width: '55%',
    borderRadius: 5,
    backgroundColor: premiumColors.borderLight,
  },
  footerRow: {
    flexDirection: 'row',
    gap: premiumSpacing.sm,
    marginTop: 2,
  },
  badgePlaceholder: {
    height: 22,
    width: 70,
    borderRadius: premiumBorderRadius.sm,
    backgroundColor: premiumColors.borderLight,
  },
  metaPlaceholder: {
    height: 12,
    width: 60,
    borderRadius: 6,
    backgroundColor: premiumColors.borderLight,
    alignSelf: 'center',
  },
  chevronPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: premiumColors.borderLight,
    marginLeft: premiumSpacing.sm,
  },
});

export default SkeletonArticleList;
