import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import {
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

interface PremiumEmptyStateProps {
  /** Nom de l'icône MaterialCommunityIcons */
  icon: string;
  /** Titre principal */
  title: string;
  /** Sous-titre descriptif */
  subtitle: string;
  /** Label du bouton d'action (optionnel) */
  actionLabel?: string;
  /** Callback du bouton d'action */
  onActionPress?: () => void;
}

/**
 * État vide élégant avec icône, texte et action optionnelle
 */
const PremiumEmptyState: React.FC<PremiumEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onActionPress,
}) => {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const tablet = checkIsTablet(width);

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        borderColor: colors.borderSubtle,
      },
      tablet && { paddingVertical: premiumSpacing.xxxl + 8, paddingHorizontal: premiumSpacing.xxxl },
    ]}>
      {/* Mesh decorative dots */}
      <View style={[styles.meshDot, styles.meshDot1, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)' }]} />
      <View style={[styles.meshDot, styles.meshDot2, { backgroundColor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)' }]} />

      {/* Icon in rounded-square gradient pill */}
      <View style={[styles.iconShadow, tablet && { marginBottom: premiumSpacing.xl }]}>
        <LinearGradient
          colors={['#4338CA', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconPill, tablet && { width: 64, height: 64, borderRadius: 20 }]}
        >
          <Icon name={icon} size={tablet ? 32 : 28} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }, tablet && { fontSize: 20 }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }, tablet && { fontSize: 15, lineHeight: 22 }]}>
        {subtitle}
      </Text>

      {/* Action button */}
      {actionLabel && onActionPress && (
        <TouchableOpacity
          style={styles.actionButtonWrap}
          onPress={() => {
            Vibration.vibrate(10);
            onActionPress();
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#4338CA', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.actionButton, tablet && { paddingHorizontal: premiumSpacing.xxxl, paddingVertical: premiumSpacing.md }]}
          >
            <Text style={[styles.actionLabel, tablet && { fontSize: 15 }]}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: premiumSpacing.xxxl,
    paddingHorizontal: premiumSpacing.xxl,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  meshDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  meshDot1: {
    width: 90,
    height: 90,
    top: -20,
    right: -20,
  },
  meshDot2: {
    width: 60,
    height: 60,
    bottom: -10,
    left: -10,
  },
  iconShadow: {
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: premiumSpacing.lg,
  },
  iconPill: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: premiumSpacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  actionButtonWrap: {
    marginTop: premiumSpacing.lg,
    borderRadius: premiumBorderRadius.full,
    overflow: 'hidden',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    paddingHorizontal: premiumSpacing.xxl,
    paddingVertical: premiumSpacing.sm + 2,
    borderRadius: premiumBorderRadius.full,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.1,
  },
});

export default PremiumEmptyState;
