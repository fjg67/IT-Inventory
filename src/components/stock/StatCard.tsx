// ============================================
// STAT CARD COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Card } from '../common';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { isTablet as checkIsTablet } from '../../utils/responsive';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  onPress?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = colors.primary,
  subtitle,
  onPress,
  trend,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }, tablet && { width: 48, height: 48 }]}>
            {icon}
          </View>
        )}
        {trend && (
          <View style={[styles.trend, { backgroundColor: trend.isPositive ? colors.success + '20' : colors.error + '20' }]}>
            <Text style={[styles.trendText, { color: trend.isPositive ? colors.success : colors.error }, tablet && { fontSize: 13 }]}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.value, { color }, tablet && { fontSize: 30 }]}>{value}</Text>
      <Text style={[styles.title, tablet && { fontSize: 14 }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, tablet && { fontSize: 12 }]}>{subtitle}</Text>}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  trendText: {
    ...typography.small,
    fontWeight: '600',
  },
  value: {
    ...typography.h1,
    fontWeight: '700',
  },
  title: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.small,
    color: colors.text.disabled,
    marginTop: 2,
  },
});

export default StatCard;
