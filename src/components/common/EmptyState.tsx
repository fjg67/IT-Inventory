// ============================================
// EMPTY STATE COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { isTablet as checkIsTablet } from '../../utils/responsive';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  return (
    <View style={[styles.container, tablet && { padding: spacing.xxl }]}>
      {icon && <View style={[styles.iconContainer, tablet && { marginBottom: spacing.xl, transform: [{ scale: 1.3 }] }]}>{icon}</View>}
      <Text style={[styles.title, tablet && { fontSize: 22 }]}>{title}</Text>
      {description && <Text style={[styles.description, tablet && { fontSize: 17, lineHeight: 26 }]}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
});

export default EmptyState;
