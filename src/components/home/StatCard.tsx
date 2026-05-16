import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { DASHBOARD_TYPOGRAPHY } from '@/constants/typography';
import { useCountUp } from '@/hooks/useCountUp';
import { Sparkline } from './Sparkline';

interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  value: number;
  label: string;
  trendLabel?: string;
  trendBgColor?: string;
  trendTextColor?: string;
  sparklineData: number[];
  sparklineColor: string;
  sparklineFillColor: string;
  onPress?: () => void;
  fullWidth?: boolean;
  tintedBackground?: string;
  badgeValue?: number;
  badgeAnimated?: boolean;
  highlightLastPoint?: boolean;
}

const StatCardComponent: React.FC<StatCardProps> = ({
  icon,
  iconColor,
  iconBgColor,
  value,
  label,
  trendLabel,
  trendBgColor,
  trendTextColor,
  sparklineData,
  sparklineColor,
  sparklineFillColor,
  onPress,
  fullWidth = false,
  tintedBackground,
  badgeValue,
  badgeAnimated = false,
  highlightLastPoint = false,
}) => {
  const press = useSharedValue(0);
  const animatedValue = useCountUp(value, { duration: 600 });

  const badgePulse = useSharedValue(0);
  React.useEffect(() => {
    if (!badgeAnimated) {
      return;
    }

    badgePulse.value = withSpring(1, { damping: 8, stiffness: 80 });
    const timer = setInterval(() => {
      badgePulse.value = 0;
      badgePulse.value = withSpring(1, { damping: 8, stiffness: 80 });
    }, 1500);

    return () => {
      clearInterval(timer);
    };
  }, [badgeAnimated, badgePulse]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.97]) }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(badgePulse.value, [0, 1], [0.65, 1]),
    transform: [{ scale: interpolate(badgePulse.value, [0, 1], [1, 1.15]) }],
  }));

  return (
    <Animated.View style={[styles.wrapper, fullWidth && styles.fullWidth, cardAnimatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          press.value = withSpring(1);
        }}
        onPressOut={() => {
          press.value = withSpring(0);
        }}
        style={[
          styles.card,
          fullWidth && styles.cardFull,
          tintedBackground ? { backgroundColor: tintedBackground } : undefined,
        ]}
      >
        {badgeValue !== undefined ? (
          <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
            <Text style={styles.badgeText}>{badgeValue}</Text>
          </Animated.View>
        ) : null}

        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
            <Icon name={icon} size={18} color={iconColor} />
          </View>
          {trendLabel ? (
            <View style={[styles.trendPill, { backgroundColor: trendBgColor ?? OBSIDIAN_COLORS.green_subtle }]}>
              <Text style={[styles.trendText, { color: trendTextColor ?? OBSIDIAN_COLORS.green_light }]}>
                {trendLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.value, value > 0 && trendTextColor ? { color: trendTextColor } : undefined]}>
          {animatedValue}
        </Text>
        <Text style={styles.label}>{label}</Text>

        <Sparkline
          data={sparklineData}
          lineColor={sparklineColor}
          fillColor={sparklineFillColor}
          highlightLast={highlightLastPoint}
        />
      </Pressable>
    </Animated.View>
  );
};

export const StatCard = React.memo(StatCardComponent);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  card: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_card,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },
  cardFull: {
    minHeight: 180,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  value: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 36,
    fontWeight: '800',
    ...DASHBOARD_TYPOGRAPHY.statNumber,
  },
  label: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    marginBottom: 10,
    ...DASHBOARD_TYPOGRAPHY.label,
  },
  trendPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendText: {
    fontSize: 11,
    ...DASHBOARD_TYPOGRAPHY.label,
  },
  badge: {
    backgroundColor: OBSIDIAN_COLORS.danger,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
