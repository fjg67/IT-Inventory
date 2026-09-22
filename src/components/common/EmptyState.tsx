// ============================================
// EMPTY STATE COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
    <Animated.View 
      entering={FadeInDown.duration(400).springify().damping(16)}
      style={[styles.container, tablet && { padding: spacing.xxl }]}
    >
      <View style={styles.card}>
        {icon && (
          <View style={[styles.iconContainer, tablet && { transform: [{ scale: 1.3 }] }]}>
            <View style={styles.iconCircle}>{icon}</View>
          </View>
        )}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#007D70',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 125, 112, 0.1)',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 125, 112, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: '#007D70', // CA Teal
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: 'Montserrat-Bold',
  },
  description: {
    ...typography.body,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.sm,
    width: '100%',
  },
});

export default EmptyState;
