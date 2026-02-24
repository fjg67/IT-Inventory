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
  premiumColors,
  premiumTypography,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';

interface GlassStatCardProps {
  /** Nom de l'icône MaterialCommunityIcons */
  icon: string;
  /** Couleurs du dégradé de l'icône [start, end] */
  iconGradient: readonly string[];
  /** Valeur numérique affichée */
  value: number;
  /** Label sous la valeur */
  label: string;
  /** Tendance : flèche haut/bas/neutre */
  trend?: 'up' | 'down' | 'neutral';
  /** Valeur de tendance (ex: "+12%") */
  trendValue?: string;
  /** Données sparkline */
  sparklineData?: number[];
  /** Couleur de la sparkline */
  sparklineColor?: string;
  /** Afficher les labels des jours sous la courbe */
  showDayLabels?: boolean;
  /** Occuper toute la largeur */
  fullWidth?: boolean;
  /** Callback au press */
  onPress?: () => void;
}

/**
 * Card statistique avec glassmorphism simulé, compteur animé et sparkline
 */
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

  // Couleur du badge tendance
  const getTrendConfig = () => {
    switch (trend) {
      case 'up':
        return {
          icon: 'trending-up',
          color: premiumColors.success.base,
          bg: premiumColors.success.base + '15',
        };
      case 'down':
        return {
          icon: 'trending-down',
          color: premiumColors.error.base,
          bg: premiumColors.error.base + '15',
        };
      default:
        return {
          icon: 'minus',
          color: premiumColors.text.tertiary,
          bg: premiumColors.text.tertiary + '15',
        };
    }
  };

  const trendConfig = trend ? getTrendConfig() : null;
  const effectiveSparklineColor = sparklineColor || (iconGradient[0] as string);

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
        <View style={[styles.container, tablet && styles.containerTablet]}>
          {/* Row: Icône + Trend */}
          <View style={styles.topRow}>
            <LinearGradient
              colors={[...(iconGradient as string[])]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.iconCircle, tablet && styles.iconCircleTablet]}
            >
              <Icon name={icon} size={tablet ? 28 : 24} color={premiumColors.text.inverse} />
            </LinearGradient>

            {trendConfig && trendValue && (
              <View style={[styles.trendBadge, { backgroundColor: trendConfig.bg }]}>
                <Icon name={trendConfig.icon} size={14} color={trendConfig.color} />
                <Text style={[styles.trendText, { color: trendConfig.color }]}>
                  {trendValue}
                </Text>
              </View>
            )}
          </View>

          {/* Valeur animée */}
          <AnimatedCounter
            value={value}
            style={{
              ...premiumTypography.stat,
              color: premiumColors.text.primary,
            }}
          />

          {/* Label */}
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>

          {/* Sparkline (optionnel) */}
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
    backgroundColor: premiumColors.glass.white,
    borderRadius: premiumBorderRadius.xl,
    borderWidth: 1,
    borderColor: premiumColors.glass.border,
    padding: premiumSpacing.lg,
    ...premiumShadows.sm,
  },
  containerTablet: {
    padding: premiumSpacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: premiumSpacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleTablet: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: premiumSpacing.sm,
    paddingVertical: 2,
    borderRadius: premiumBorderRadius.full,
    gap: 2,
  },
  trendText: {
    ...premiumTypography.small,
    fontWeight: '600',
  },
  label: {
    ...premiumTypography.captionMedium,
    color: premiumColors.text.secondary,
    marginTop: 2,
  },
  sparklineContainer: {
    marginTop: premiumSpacing.sm,
  },
});

export default GlassStatCard;
