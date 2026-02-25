import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AnimatedCounter from './effects/AnimatedCounter';
import SparklineChart from './SparklineChart';
import {
  premiumSpacing,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';

interface GlassStatCardProps {
  icon: string;
  iconGradient: readonly string[];
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  showDayLabels?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
}

const GlassStatCard: React.FC<GlassStatCardProps> = ({
  icon,
  iconGradient,
  value,
  label,
  trend,
  trendValue,
  sparklineData,
  sparklineColor,
  showDayLabels = false,
  fullWidth = false,
  onPress,
}) => {
  const pressScale = useSharedValue(1);
  const { width: screenWidth } = useWindowDimensions();
  const tablet = checkIsTablet(screenWidth);
  const { colors, isDark } = useTheme();

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(premiumAnimation.pressScale, {
      duration: premiumAnimation.pressDuration,
    });
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withTiming(1, {
      duration: premiumAnimation.pressDuration,
    });
  }, [pressScale]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onPress?.();
  }, [onPress]);

  const getTrendConfig = () => {
    switch (trend) {
      case 'up':
        return { icon: 'trending-up', color: '#10B981' };
      case 'down':
        return { icon: 'trending-down', color: '#EF4444' };
      default:
        return { icon: 'minus', color: colors.textMuted };
    }
  };

  const trendConfig = trend ? getTrendConfig() : null;
  const effectiveSparklineColor = sparklineColor || (iconGradient[0] as string);
  const accentColor = iconGradient[0] as string;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        fullWidth ? styles.fullWidth : styles.halfWidth,
        pressStyle,
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
          tablet && styles.containerTablet,
          { shadowColor: accentColor },
        ]}>
          {/* Left accent strip */}
          <LinearGradient
            colors={[...(iconGradient as string[])]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accentStrip}
          />

          {/* Top row: icon pill + trend */}
          <View style={styles.topRow}>
            <View style={styles.iconPillContainer}>
              <LinearGradient
                colors={[...(iconGradient as string[])]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.iconPill, tablet && styles.iconPillTablet]}
              >
                <Icon name={icon} size={tablet ? 22 : 20} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {trendConfig && trendValue && (
              <View style={[styles.trendBadge, { backgroundColor: isDark ? `${trendConfig.color}20` : `${trendConfig.color}12` }]}>
                <Icon name={trendConfig.icon} size={13} color={trendConfig.color} />
                <Text style={[styles.trendText, { color: trendConfig.color }]}>
                  {trendValue}
                </Text>
              </View>
            )}
          </View>

          {/* Animated counter */}
          <AnimatedCounter
            value={value}
            style={{
              fontSize: fullWidth ? 36 : 32,
              fontWeight: '800',
              letterSpacing: -1,
              color: colors.textPrimary,
            }}
          />

          {/* Label */}
          <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
            {label}
          </Text>

          {/* Sparkline */}
          {sparklineData && sparklineData.length >= 2 && (
            <View style={styles.sparklineContainer}>
              <SparklineChart
                data={sparklineData}
                color={effectiveSparklineColor}
                width={fullWidth ? (tablet ? 500 : 280) : (tablet ? 200 : 120)}
                height={showDayLabels ? (tablet ? 64 : 52) : (tablet ? 40 : 32)}
                showDayLabels={showDayLabels}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: premiumSpacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  touchable: {
    flex: 1,
  },
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    paddingLeft: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  containerTablet: {
    padding: premiumSpacing.xl,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconPillContainer: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillTablet: {
    width: 48,
    height: 48,
    borderRadius: 15,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  sparklineContainer: {
    marginTop: premiumSpacing.sm,
  },
});

export default GlassStatCard;
