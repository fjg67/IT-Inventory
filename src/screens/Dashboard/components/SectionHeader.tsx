import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import {
  premiumColors,
  premiumTypography,
  premiumSpacing,
} from '../../../constants/premiumTheme';

interface SectionHeaderProps {
  /** Titre de la section */
  title: string;
  /** Texte du lien d'action (ex: "Voir tout") */
  actionLabel?: string;
  /** Callback au clic sur l'action */
  onActionPress?: () => void;
}

/**
 * Header de section avec titre et lien "Voir tout"
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onActionPress?.();
  }, [onActionPress]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, tablet && { fontSize: 20 }]}>{title}</Text>
      {actionLabel && onActionPress && (
        <TouchableOpacity
          onPress={handlePress}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionLabel, tablet && { fontSize: 15 }]}>{actionLabel}</Text>
          <Icon
            name="chevron-right"
            size={tablet ? 22 : 18}
            color={premiumColors.primary.base}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: premiumSpacing.md,
    paddingHorizontal: premiumSpacing.xs,
  },
  title: {
    ...premiumTypography.h3,
    color: premiumColors.text.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionLabel: {
    ...premiumTypography.captionMedium,
    color: premiumColors.primary.base,
  },
});

export default SectionHeader;
