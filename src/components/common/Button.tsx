// ============================================
// BUTTON COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  useWindowDimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows, deviceSizes } from '@/constants/theme';
import { isTablet as checkIsTablet } from '../../utils/responsive';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  const tabletSizeOverride = tablet ? {
    minHeight: size === 'sm' ? 42 : size === 'md' ? 52 : 64,
    paddingHorizontal: size === 'sm' ? spacing.lg : size === 'md' ? spacing.xl : spacing.xxl,
  } : undefined;

  const tabletTextOverride = tablet ? {
    fontSize: size === 'sm' ? 14 : size === 'md' ? 17 : 20,
  } : undefined;

  const buttonStyles = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    tabletSizeOverride,
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    tabletTextOverride,
    disabled && styles.textDisabled,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text.inverse}
          size="small"
        />
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && icon}
        <Text style={textStyles}>{title}</Text>
        {icon && iconPosition === 'right' && icon}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  // Variants
  variant_primary: {
    backgroundColor: colors.primary,
  },
  variant_secondary: {
    backgroundColor: colors.secondary,
  },
  variant_success: {
    backgroundColor: colors.success,
  },
  variant_danger: {
    backgroundColor: colors.error,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.none,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
    ...shadows.none,
  },
  // Sizes
  size_sm: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  size_md: {
    minHeight: deviceSizes.buttonMinHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  size_lg: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  // Text
  text: {
    ...typography.bodyBold,
    color: colors.text.inverse,
  },
  text_primary: {
    color: colors.text.inverse,
  },
  text_secondary: {
    color: colors.text.inverse,
  },
  text_success: {
    color: colors.text.inverse,
  },
  text_danger: {
    color: colors.text.inverse,
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
  },
  textSize_sm: {
    ...typography.caption,
    fontWeight: '600',
  },
  textSize_md: {
    ...typography.bodyBold,
  },
  textSize_lg: {
    ...typography.h4,
  },
  textDisabled: {
    color: colors.text.disabled,
  },
});

export default Button;
