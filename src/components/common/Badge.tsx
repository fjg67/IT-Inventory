// ============================================
// BADGE COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { isTablet as checkIsTablet } from '../../utils/responsive';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  const tabletSizeOverride = tablet ? {
    paddingHorizontal: size === 'sm' ? spacing.sm : size === 'md' ? spacing.md : spacing.lg,
    paddingVertical: size === 'sm' ? spacing.xs : size === 'md' ? spacing.sm : spacing.md,
  } : undefined;

  const tabletTextOverride = tablet ? {
    fontSize: size === 'sm' ? 13 : size === 'md' ? 14 : 17,
  } : undefined;

  return (
    <View style={[styles.base, styles[`variant_${variant}`], styles[`size_${size}`], tabletSizeOverride, style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], tabletTextOverride]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  // Variants
  variant_default: {
    backgroundColor: colors.secondary + '20',
  },
  variant_primary: {
    backgroundColor: colors.primary + '20',
  },
  variant_success: {
    backgroundColor: colors.success + '20',
  },
  variant_warning: {
    backgroundColor: colors.warning + '20',
  },
  variant_error: {
    backgroundColor: colors.error + '20',
  },
  variant_info: {
    backgroundColor: colors.info + '20',
  },
  // Sizes
  size_sm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  size_lg: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // Text
  text: {
    fontWeight: '600',
  },
  text_default: {
    color: colors.secondary,
  },
  text_primary: {
    color: colors.primary,
  },
  text_success: {
    color: colors.successDark,
  },
  text_warning: {
    color: colors.warningDark,
  },
  text_error: {
    color: colors.errorDark,
  },
  text_info: {
    color: colors.infoDark,
  },
  // Text sizes
  textSize_sm: {
    ...typography.small,
  },
  textSize_md: {
    ...typography.caption,
  },
  textSize_lg: {
    ...typography.body,
  },
});

export default Badge;
