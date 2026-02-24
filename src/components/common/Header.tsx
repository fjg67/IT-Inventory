// ============================================
// HEADER COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { colors, spacing, typography, deviceSizes,shadows } from '@/constants/theme';
import { useResponsive } from '@/utils/responsive';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  leftAction?: () => void;
  rightIcon?: React.ReactNode;
  rightAction?: () => void;
  rightSecondIcon?: React.ReactNode;
  rightSecondAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  leftAction,
  rightIcon,
  rightAction,
  rightSecondIcon,
  rightSecondAction,
}) => {
  const { isTablet, fs } = useResponsive();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      <View style={[styles.content, isTablet && styles.contentTablet]}>
        {/* Left */}
        <View style={styles.leftContainer}>
          {leftIcon && leftAction ? (
            <Pressable onPress={leftAction} style={styles.iconButton}>
              {leftIcon}
            </Pressable>
          ) : leftIcon ? (
            <View style={styles.iconButton}>{leftIcon}</View>
          ) : null}
        </View>

        {/* Center */}
        <View style={styles.centerContainer}>
          <Text style={[styles.title, isTablet && { fontSize: fs(18) }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, isTablet && { fontSize: fs(12) }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right */}
        <View style={styles.rightContainer}>
          {rightSecondIcon && rightSecondAction && (
            <Pressable onPress={rightSecondAction} style={styles.iconButton}>
              {rightSecondIcon}
            </Pressable>
          )}
          {rightIcon && rightAction ? (
            <Pressable onPress={rightAction} style={styles.iconButton}>
              {rightIcon}
            </Pressable>
          ) : rightIcon ? (
            <View style={styles.iconButton}>{rightIcon}</View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  content: {
    height: deviceSizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  contentTablet: {
    height: 64,
    paddingHorizontal: spacing.lg,
  },
  leftContainer: {
    width: 56,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.small,
    color: colors.text.secondary,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;
