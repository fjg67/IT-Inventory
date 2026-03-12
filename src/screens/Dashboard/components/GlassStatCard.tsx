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
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
          },
          tablet && styles.containerTablet,
        ]}>
          {/* Left gradient accent bar */}
          <LinearGradient
            colors={[...(iconGradient as string[])]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accentBar}
          />

          {/* Top row: icon pill + trend */}
          <View style={styles.topRow}>
            <View style={[styles.iconPillShadow, { shadowColor: accentColor }]}>
              <LinearGradient
                colors={[...(iconGradient as string[])]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.iconPill, tablet && styles.iconPillTablet]}
              >
                <View style={styles.iconInnerCircle}>
                  <Icon name={icon} size={tablet ? 20 : 18} color={accentColor} />
                </View>
              </LinearGradient>
            </View>

            {trendConfig && trendValue && (
              <LinearGradient
                colors={trend === 'down' ? ['#EF4444', '#DC2626'] : trend === 'up' ? ['#10B981', '#059669'] : [colors.textMuted, colors.textMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.trendBadge}
              >
                <Icon name={trendConfig.icon} size={11} color="#FFFFFF" />
                <Text style={styles.trendText}>
                  {trendValue}
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* Animated counter */}
          <AnimatedCounter
            value={value}
            style={{
              fontSize: fullWidth ? 38 : 34,
              fontWeight: '900',
              letterSpacing: -1.5,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    paddingLeft: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  containerTablet: {
    padding: premiumSpacing.xl,
    paddingLeft: premiumSpacing.xl + 4,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconPillShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillTablet: {
    width: 50,
    height: 50,
    borderRadius: 17,
  },
  iconInnerCircle: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    gap: 3,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: -0.1,
  },
  sparklineContainer: {
    marginTop: premiumSpacing.sm,
  },
});

export default GlassStatCard;
