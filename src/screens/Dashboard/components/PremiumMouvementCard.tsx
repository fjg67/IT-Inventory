import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumColors,
  premiumTypography,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
  premiumAnimation,
} from '../../../constants/premiumTheme';

interface MouvementData {
  id: string;
  articleNom?: string;
  type: 'entree' | 'sortie' | 'ajustement' | 'transfert';
  quantite: number;
  siteNom?: string;
  createdAt: string | Date;
  technicienNom?: string;
}

interface PremiumMouvementCardProps {
  mouvement: MouvementData;
  onPress?: () => void;
}

/**
 * Card mouvement premium avec icône directionnelle, badge type et infos structurées
 */
const PremiumMouvementCard: React.FC<PremiumMouvementCardProps> = ({
  mouvement,
  onPress,
}) => {
  const pressScale = useSharedValue(1);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(premiumAnimation.pressScale, {
      duration: premiumAnimation.pressDuration,
    });
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withTiming(1, {
      duration: premiumAnimation.pressDuration,
    });
  }, [pressScale]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onPress?.();
  }, [onPress]);

  // Config selon le type
  const typeConfig = useMemo(() => {
    switch (mouvement.type) {
      case 'entree':
        return {
          icon: 'arrow-up-bold',
          color: premiumColors.success.base,
          bg: premiumColors.success.base + '15',
          label: 'Entrée',
          sign: '+',
        };
      case 'sortie':
        return {
          icon: 'arrow-down-bold',
          color: premiumColors.error.base,
          bg: premiumColors.error.base + '15',
          label: 'Sortie',
          sign: '-',
        };
      case 'ajustement':
        return {
          icon: 'swap-vertical',
          color: premiumColors.warning.base,
          bg: premiumColors.warning.base + '15',
          label: 'Ajustement',
          sign: '',
        };
      case 'transfert':
        return {
          icon: 'swap-horizontal',
          color: premiumColors.info.base,
          bg: premiumColors.info.base + '15',
          label: 'Transfert',
          sign: '',
        };
      default:
        return {
          icon: 'circle',
          color: premiumColors.text.tertiary,
          bg: premiumColors.text.tertiary + '15',
          label: mouvement.type,
          sign: '',
        };
    }
  }, [mouvement.type]);

  // Timestamp relatif
  const relativeTime = useMemo(() => {
    const now = new Date();
    const date = new Date(mouvement.createdAt);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return new Date(mouvement.createdAt).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' });
  }, [mouvement.createdAt]);

  return (
    <Animated.View style={pressStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.container, tablet && { padding: premiumSpacing.lg }]}>
          {/* Icône directionnelle */}
          <View style={[styles.iconCircle, { backgroundColor: typeConfig.bg }, tablet && { width: 52, height: 52, borderRadius: 26 }]}>
            <Icon name={typeConfig.icon} size={tablet ? 26 : 22} color={typeConfig.color} />
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            {/* Première ligne : nom article + quantité */}
            <View style={styles.topRow}>
              <Text style={[styles.articleName, tablet && { fontSize: 16 }]} numberOfLines={1}>
                {mouvement.articleNom ?? 'Article'}
              </Text>
              <Text style={[styles.quantity, { color: typeConfig.color }, tablet && { fontSize: 14 }]}>
                {typeConfig.sign}{Math.abs(mouvement.quantite)} unités
              </Text>
            </View>

            {/* Deuxième ligne : badge type + infos */}
            <View style={styles.bottomRow}>
              <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }, tablet && { paddingHorizontal: premiumSpacing.md, paddingVertical: 4 }]}>
                <Text style={[styles.typeBadgeText, { color: typeConfig.color }, tablet && { fontSize: 13 }]}>
                  {typeConfig.label}
                </Text>
              </View>
              <Text style={[styles.info, tablet && { fontSize: 13 }]}>
                {relativeTime}
                {mouvement.technicienNom ? ` • ${mouvement.technicienNom}` : ''}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: premiumColors.glass.white,
    borderRadius: premiumBorderRadius.lg,
    borderWidth: 1,
    borderColor: premiumColors.glass.border,
    padding: premiumSpacing.md,
    marginBottom: premiumSpacing.sm,
    ...premiumShadows.xs,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: premiumSpacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  articleName: {
    ...premiumTypography.bodyMedium,
    color: premiumColors.text.primary,
    flex: 1,
    marginRight: premiumSpacing.sm,
  },
  quantity: {
    ...premiumTypography.captionMedium,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: premiumSpacing.sm,
  },
  typeBadge: {
    paddingHorizontal: premiumSpacing.sm,
    paddingVertical: 2,
    borderRadius: premiumBorderRadius.full,
  },
  typeBadgeText: {
    ...premiumTypography.small,
    fontWeight: '600',
  },
  info: {
    ...premiumTypography.small,
    color: premiumColors.text.tertiary,
    flex: 1,
  },
});

export default PremiumMouvementCard;
