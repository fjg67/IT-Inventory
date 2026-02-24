import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import {
  premiumColors,
  premiumTypography,
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';

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
  const tablet = checkIsTablet(width);

  return (
    <View style={[styles.container, tablet && { paddingVertical: premiumSpacing.xxxl + 8, paddingHorizontal: premiumSpacing.xxxl }]}>
      {/* Icône grande centrée */}
      <View style={[styles.iconContainer, tablet && { width: 104, height: 104, borderRadius: 52, marginBottom: premiumSpacing.xl }]}>
        <Icon
          name={icon}
          size={tablet ? 68 : 56}
          color={premiumColors.text.tertiary}
        />
      </View>

      <Text style={[styles.title, tablet && { fontSize: 20 }]}>{title}</Text>
      <Text style={[styles.subtitle, tablet && { fontSize: 15, lineHeight: 22 }]}>{subtitle}</Text>

      {/* Bouton d'action optionnel */}
      {actionLabel && onActionPress && (
        <TouchableOpacity
          style={[styles.actionButton, tablet && { paddingHorizontal: premiumSpacing.xxxl, paddingVertical: premiumSpacing.md }]}
          onPress={() => {
            Vibration.vibrate(10);
            onActionPress();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionLabel, tablet && { fontSize: 15 }]}>{actionLabel}</Text>
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
    backgroundColor: premiumColors.glass.white,
    borderRadius: premiumBorderRadius.xl,
    borderWidth: 1,
    borderColor: premiumColors.glass.border,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: premiumColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: premiumSpacing.lg,
  },
  title: {
    ...premiumTypography.h3,
    color: premiumColors.text.primary,
    textAlign: 'center',
    marginBottom: premiumSpacing.xs,
  },
  subtitle: {
    ...premiumTypography.caption,
    color: premiumColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: premiumSpacing.lg,
    paddingHorizontal: premiumSpacing.xxl,
    paddingVertical: premiumSpacing.sm,
    backgroundColor: premiumColors.primary.base + '10',
    borderRadius: premiumBorderRadius.full,
  },
  actionLabel: {
    ...premiumTypography.captionMedium,
    color: premiumColors.primary.base,
  },
});

export default PremiumEmptyState;
