// ============================================
// CARD COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, useWindowDimensions } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { isTablet as checkIsTablet } from '../../utils/responsive';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  const tabletPaddingOverride = tablet && padding !== 'none' ? {
    padding: padding === 'sm' ? spacing.md : padding === 'md' ? spacing.lg : spacing.xl,
  } : undefined;

  const cardStyles = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`padding_${padding}`],
    tabletPaddingOverride,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          ...cardStyles,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  // Variants
  variant_default: {
    ...shadows.md,
  },
  variant_elevated: {
    ...shadows.lg,
  },
  variant_outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.none,
  },
  // Padding
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.sm,
  },
  padding_md: {
    padding: spacing.md,
  },
  padding_lg: {
    padding: spacing.lg,
  },
  // States
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

export default Card;
