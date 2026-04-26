import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';

const SkeletonCard: React.FC<{ delay: number }> = ({ delay }) => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    const timer = setTimeout(() => {
      shimmerX.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, shimmerX]);

  const shimmerOverlayStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shimmerX.value, [-1, 1], [-width, width]),
      },
    ],
  }));

  const shimmerColor = isDark
    ? 'rgba(255,255,255,0.06)'
    : 'rgba(255,255,255,0.55)';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }, tablet && { padding: premiumSpacing.xl }]}>
      {/* Shimmer sweep overlay */}
      <Animated.View pointerEvents="none" style={[styles.shimmerOverlay, shimmerOverlayStyle]}>
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>

      {/* Icon placeholder */}
      <View style={[styles.iconPlaceholder, { backgroundColor: colors.skeleton }, tablet && { width: 56, height: 56 }]} />

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.titleLine, { backgroundColor: colors.skeleton }, tablet && { height: 16 }]} />
        <View style={[styles.descLine, { backgroundColor: colors.skeleton }, tablet && { height: 12 }]} />
        <View style={styles.footerRow}>
          <View style={[styles.badgePlaceholder, { backgroundColor: colors.skeleton }, tablet && { height: 26, width: 80 }]} />
          <View style={[styles.metaPlaceholder, { backgroundColor: colors.skeleton }, tablet && { height: 14, width: 70 }]} />
        </View>
      </View>

      {/* Chevron */}
      <View style={[styles.chevronPlaceholder, { backgroundColor: colors.skeleton }]} />
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
        <SkeletonCard key={i} delay={i * 150} />
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
    borderRadius: premiumBorderRadius.lg,
    borderWidth: 1,
    padding: premiumSpacing.lg,
    marginBottom: premiumSpacing.sm,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '60%',
    zIndex: 10,
  },
  shimmerGradient: {
    flex: 1,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: premiumBorderRadius.md,
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
  },
  descLine: {
    height: 10,
    width: '55%',
    borderRadius: 5,
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
  },
  metaPlaceholder: {
    height: 12,
    width: 60,
    borderRadius: 6,
    alignSelf: 'center',
  },
  chevronPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: premiumSpacing.sm,
  },
});

export default SkeletonArticleList;
