import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { usePulseAnimation } from '@/hooks/usePulseAnimation';

interface ArticleBadgeProps {
  quantity: number;
  minStock: number;
}

const ArticleBadgeComponent: React.FC<ArticleBadgeProps> = ({ quantity, minStock }) => {
  const isOut = quantity <= 0;
  const isLow = !isOut && quantity <= minStock;

  const status = isOut
    ? {
        bg: OBSIDIAN_COLORS.danger,
        icon: 'close-circle-outline',
      }
    : isLow
      ? {
          bg: OBSIDIAN_COLORS.warning,
          icon: 'alert-circle-outline',
        }
      : {
          bg: OBSIDIAN_COLORS.green_primary,
          icon: 'check-circle-outline',
        };

  const pulse = usePulseAnimation({ maxScale: 1.05, duration: 2000 });
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.scale.value }],
    opacity: pulse.opacity.value,
  }));

  return (
    <Animated.View style={[styles.badge, { backgroundColor: status.bg }, (isLow || isOut) && pulseStyle]}>
      <Icon name={status.icon} size={14} color="#FFFFFF" />
      <Text style={styles.quantity}>{quantity}</Text>
      <Text style={styles.unit}>PCS</Text>
    </Animated.View>
  );
};

export const ArticleBadge = React.memo(ArticleBadgeComponent);

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  quantity: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 2,
  },
  unit: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 1,
    textTransform: 'uppercase',
  },
});
