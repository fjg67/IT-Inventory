import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumColors,
  premiumTypography,
  premiumSpacing,
  premiumBorderRadius,
  premiumShadows,
} from '../../../constants/premiumTheme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';

type EmptyType = 'no-articles' | 'no-results' | 'no-filters';

interface ArticleEmptyStateProps {
  type: EmptyType;
  searchQuery?: string;
  onAction?: () => void;
}

const EMPTY_CONFIGS: Record<EmptyType, {
  icon: string;
  title: string;
  subtitle: string | ((q: string) => string);
  actionLabel: string;
  actionIcon: string;
}> = {
  'no-articles': {
    icon: 'package-variant',
    title: 'Aucun article trouvé',
    subtitle: 'La liste des articles est vide\nAjoutez votre premier article',
    actionLabel: 'Ajouter un article',
    actionIcon: 'plus',
  },
  'no-results': {
    icon: 'magnify',
    title: 'Aucun résultat',
    subtitle: (q: string) => `Aucun article ne correspond à « ${q} »`,
    actionLabel: 'Effacer la recherche',
    actionIcon: 'close',
  },
  'no-filters': {
    icon: 'filter-remove-outline',
    title: 'Aucun article avec ces filtres',
    subtitle: 'Essayez de modifier vos critères de recherche',
    actionLabel: 'Réinitialiser les filtres',
    actionIcon: 'refresh',
  },
};

const ArticleEmptyState: React.FC<ArticleEmptyStateProps> = ({
  type,
  searchQuery = '',
  onAction,
}) => {
  const config = EMPTY_CONFIGS[type];

  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  const subtitle = typeof config.subtitle === 'function'
    ? config.subtitle(searchQuery)
    : config.subtitle;

  // Animation flottante de l'icône
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500 }),
        withTiming(6, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, [floatY]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      {/* Icône flottante */}
      <Animated.View style={[styles.iconWrapper, floatStyle]}>
        <View style={[styles.iconCircle, tablet && { width: 140, height: 140, borderRadius: 70 }]}>
          <Icon name={config.icon} size={tablet ? 72 : 56} color={premiumColors.primary.base} />
        </View>
      </Animated.View>

      {/* Textes */}
      <Text style={[styles.title, tablet && { fontSize: 26 }]}>{config.title}</Text>
      <Text style={[styles.subtitle, tablet && { fontSize: 17, lineHeight: 26 }]}>{subtitle}</Text>

      {/* Bouton CTA */}
      {onAction && (
        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(10);
            onAction();
          }}
          activeOpacity={0.8}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={[...premiumColors.gradients.scanButton]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Icon name={config.actionIcon} size={tablet ? 24 : 20} color="#FFF" />
            <Text style={[styles.ctaText, tablet && { fontSize: 17 }]}>{config.actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: premiumSpacing.xxxl * 2,
    paddingHorizontal: premiumSpacing.xxl,
  },
  iconWrapper: {
    marginBottom: premiumSpacing.xxl,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: premiumColors.primary.base + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...premiumTypography.h2,
    color: premiumColors.text.primary,
    textAlign: 'center',
    marginBottom: premiumSpacing.sm,
  },
  subtitle: {
    ...premiumTypography.body,
    color: premiumColors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: premiumSpacing.xxl,
  },
  ctaWrapper: {
    borderRadius: premiumBorderRadius.md,
    overflow: 'hidden',
    ...premiumShadows.glowBlue,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: premiumSpacing.md,
    paddingHorizontal: premiumSpacing.xxl,
    gap: premiumSpacing.sm,
    borderRadius: premiumBorderRadius.md,
  },
  ctaText: {
    ...premiumTypography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ArticleEmptyState;
