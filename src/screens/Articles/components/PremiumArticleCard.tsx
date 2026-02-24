import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Image, useWindowDimensions } from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumColors,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { Article } from '../../../types';

const MARQUE_MAP: Record<string, { color: string; initials: string }> = {
  'DELL': { color: '#0076CE', initials: 'DE' },
  'Cherry': { color: '#CC0000', initials: 'CH' },
  'StarTec': { color: '#FFB900', initials: 'ST' },
  '3M': { color: '#FF0000', initials: '3M' },
  'Générique': { color: '#6B7280', initials: 'GN' },
  'Plantronics': { color: '#2D2D2D', initials: 'PL' },
  'Aurora': { color: '#7C3AED', initials: 'AU' },
  'Urban Factory': { color: '#E11D48', initials: 'UF' },
  'Epsos': { color: '#003399', initials: 'EP' },
  'Poly': { color: '#00B388', initials: 'PO' },
  'HP': { color: '#0096D6', initials: 'HP' },
  'Ergotron': { color: '#F97316', initials: 'ER' },
  'Fujitsu': { color: '#E4002B', initials: 'FU' },
};

const TYPE_MAP: Record<string, { icon: string; color: string }> = {
  'Souris': { icon: 'mouse', color: '#6366F1' },
  'Clavier': { icon: 'keyboard', color: '#8B5CF6' },
  'Dock': { icon: 'dock-bottom', color: '#0EA5E9' },
  'HUB USB': { icon: 'usb', color: '#14B8A6' },
  'Sécurité': { icon: 'shield-lock', color: '#EF4444' },
  'Pointeur laser': { icon: 'laser-pointer', color: '#F97316' },
  'Dongle': { icon: 'bluetooth', color: '#3B82F6' },
  'Protection': { icon: 'shield-check', color: '#10B981' },
  'Clavier / Souris': { icon: 'keyboard-variant', color: '#7C3AED' },
  'Casque': { icon: 'headset', color: '#EC4899' },
  'Base de charge': { icon: 'battery-charging-wireless', color: '#22C55E' },
  'Affichage': { icon: 'monitor', color: '#2563EB' },
  'Rallonge': { icon: 'power-plug', color: '#F59E0B' },
  'USB A / USB C': { icon: 'usb-port', color: '#06B6D4' },
  'USB C / Lightning': { icon: 'cable-data', color: '#A855F7' },
  'USB A / Micro USB': { icon: 'usb', color: '#64748B' },
  'Réseau': { icon: 'lan', color: '#0D9488' },
  'USB C': { icon: 'usb-port', color: '#7C3AED' },
  'Alimentation': { icon: 'power', color: '#DC2626' },
  'Multiprise': { icon: 'power-socket-eu', color: '#EA580C' },
  "Bras d'écran": { icon: 'monitor-screenshot', color: '#0891B2' },
  'Scanner doc': { icon: 'scanner', color: '#4F46E5' },
  'Ensemble de matériel': { icon: 'package-variant-closed', color: '#78716C' },
};

const FAMILLE_MAP: Record<string, { icon: string; color: string; emoji: string }> = {
  Accessoires: { icon: 'puzzle-outline', color: '#8B5CF6', emoji: '🎮' },
  Audio: { icon: 'headphones', color: '#EC4899', emoji: '🎧' },
  'Câble': { icon: 'cable-data', color: '#F59E0B', emoji: '🔌' },
  Chargeur: { icon: 'battery-charging', color: '#10B981', emoji: '🔋' },
  Electrique: { icon: 'flash', color: '#3B82F6', emoji: '⚡' },
  Ergonomie: { icon: 'human-handsup', color: '#06B6D4', emoji: '🪑' },
  Kit: { icon: 'toolbox-outline', color: '#EF4444', emoji: '🧰' },
};

interface PremiumArticleCardProps {
  article: Article;
  onPress: (articleId: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Card article premium avec badge stock, métadonnées, et animation press
 */
const PremiumArticleCard: React.FC<PremiumArticleCardProps> = React.memo(({
  article,
  onPress,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const pressScale = useSharedValue(1);

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
    onPress(article.id);
  }, [onPress, article.id]);

  // Couleur du badge stock
  const stockConfig = useMemo(() => {
    const qty = article.quantiteActuelle ?? 0;
    const mini = article.stockMini;

    if (qty === 0) {
      return {
        bg: premiumColors.error.base + '12',
        color: premiumColors.error.base,
        icon: 'alert-circle' as const,
        label: 'Rupture',
      };
    }
    if (qty <= mini) {
      return {
        bg: premiumColors.warning.base + '12',
        color: premiumColors.warning.dark,
        icon: 'alert-outline' as const,
        label: 'Stock faible',
      };
    }
    return {
      bg: premiumColors.success.base + '12',
      color: premiumColors.success.dark,
      icon: 'check-circle-outline' as const,
      label: 'En stock',
    };
  }, [article.quantiteActuelle, article.stockMini]);

  // Date relative
  const relativeDate = useMemo(() => {
    if (!article.dateModification) return '';
    const now = new Date();
    const date = new Date(article.dateModification);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Modifié récemment';
    if (diffHours < 24) return `Modifié il y a ${diffHours}h`;
    if (diffDays === 1) return 'Modifié hier';
    if (diffDays < 7) return `Modifié il y a ${diffDays}j`;
    return `Modifié le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  }, [article.dateModification]);

  return (
    <Animated.View style={pressStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.card, tablet && { padding: premiumSpacing.lg }]}>
          {/* Photo ou icône */}
          {article.photoUrl ? (
            <Image source={{ uri: article.photoUrl }} style={[styles.photoThumb, tablet && { width: 56, height: 56 }]} />
          ) : (
            <View style={[styles.iconContainer, tablet && { width: 56, height: 56 }]}>
              <Icon name="package-variant" size={tablet ? 30 : 24} color={premiumColors.primary.base} />
            </View>
          )}

          {/* Contenu principal */}
          <View style={styles.content}>
            {/* Ligne 1 : Nom */}
            <View style={styles.headerRow}>
              <Text style={[styles.name, tablet && { fontSize: 17 }]} numberOfLines={1}>
                {article.nom}
              </Text>
            </View>

            {/* Description optionnelle */}
            {article.description ? (
              <Text style={[styles.description, tablet && { fontSize: 14 }]} numberOfLines={1}>
                {article.description}
              </Text>
            ) : null}

            {/* Footer : Badge stock + Métadonnées */}
            <View style={styles.footer}>
              <View style={[styles.stockBadge, { backgroundColor: premiumColors.primary.base + '10' }, tablet && { paddingHorizontal: 8, paddingVertical: 4 }]}>
                <Icon name="barcode" size={tablet ? 16 : 13} color={premiumColors.primary.base} />
                <Text style={[styles.stockText, { color: premiumColors.primary.base }, tablet && { fontSize: 12 }]}>
                  {article.reference}
                </Text>
              </View>

              {article.famille && FAMILLE_MAP[article.famille] ? (
                <View style={[styles.stockBadge, { backgroundColor: FAMILLE_MAP[article.famille].color + '15', marginLeft: 6 }]}>
                  <Icon name={FAMILLE_MAP[article.famille].icon} size={12} color={FAMILLE_MAP[article.famille].color} />
                  <Text style={[styles.stockText, { color: FAMILLE_MAP[article.famille].color }]}>
                    {article.famille}
                  </Text>
                </View>
              ) : article.codeFamille ? (
                <View style={[styles.stockBadge, { backgroundColor: '#8B5CF620', marginLeft: 6 }]}>
                  <Icon name="tag-outline" size={12} color="#8B5CF6" />
                  <Text style={[styles.stockText, { color: '#8B5CF6' }]}>
                    F{article.codeFamille}
                  </Text>
                </View>
              ) : null}

            </View>

            {/* Badges Type / Sous-type / Marque */}
            {(article.typeArticle || article.sousType || article.marque) ? (
              <View style={[styles.footer, { marginTop: 4, flexWrap: 'wrap', gap: 4 }]}>
                {article.marque && MARQUE_MAP[article.marque] ? (
                  <View style={[styles.stockBadge, { backgroundColor: MARQUE_MAP[article.marque].color + '12' }]}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: MARQUE_MAP[article.marque].color, marginRight: 3 }}>
                      {MARQUE_MAP[article.marque].initials}
                    </Text>
                    <Text style={[styles.stockText, { color: MARQUE_MAP[article.marque].color, fontSize: 10 }]}>
                      {article.marque}
                    </Text>
                  </View>
                ) : null}
                {article.typeArticle && TYPE_MAP[article.typeArticle] ? (
                  <View style={[styles.stockBadge, { backgroundColor: TYPE_MAP[article.typeArticle].color + '12' }]}>
                    <Icon name={TYPE_MAP[article.typeArticle].icon} size={11} color={TYPE_MAP[article.typeArticle].color} />
                    <Text style={[styles.stockText, { color: TYPE_MAP[article.typeArticle].color, fontSize: 10 }]}>
                      {article.typeArticle}
                    </Text>
                  </View>
                ) : null}
                {article.sousType ? (
                  <View style={[styles.stockBadge, { backgroundColor: '#64748B12' }]}>
                    <Icon name="tag-text-outline" size={10} color="#64748B" />
                    <Text style={[styles.stockText, { color: '#64748B', fontSize: 10 }]}>
                      {article.sousType}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Métadonnées */}
            <View style={[styles.footer, { marginTop: 3 }]}>
              <View style={styles.meta}>
                {article.categorieNom ? (
                  <Text style={styles.metaText} numberOfLines={1}>
                    {article.categorieNom}
                  </Text>
                ) : null}
                <Text style={styles.metaDate}>{relativeDate}</Text>
              </View>
            </View>
          </View>

          {/* Stock actual */}
          <View style={styles.stockRight}>
            <View style={[styles.stockBadgeRight, { backgroundColor: stockConfig.bg }, tablet && { paddingHorizontal: 10, paddingVertical: 6 }]}>
              <Icon name={stockConfig.icon} size={tablet ? 18 : 14} color={stockConfig.color} />
              <Text style={[styles.stockValueRight, { color: stockConfig.color }, tablet && { fontSize: 17 }]}>
                {article.quantiteActuelle ?? 0}
              </Text>
            </View>
            <Text style={[styles.stockUnitRight, tablet && { fontSize: 12 }]}>{article.unite}</Text>
          </View>

          {/* Chevron */}
          <Icon name="chevron-right" size={tablet ? 24 : 20} color={premiumColors.border} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) => {
  return prev.article.id === next.article.id &&
    prev.article.quantiteActuelle === next.article.quantiteActuelle &&
    prev.article.dateModification === next.article.dateModification;
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: premiumColors.surface,
    borderRadius: premiumBorderRadius.lg,
    borderWidth: 1,
    borderColor: premiumColors.borderLight,
    padding: premiumSpacing.md,
    marginBottom: premiumSpacing.sm,
    ...premiumShadows.xs,
  },
  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: premiumBorderRadius.md,
    marginRight: premiumSpacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: premiumBorderRadius.md, // 12
    backgroundColor: premiumColors.primary.base + '08', // very light blue
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: premiumSpacing.md,
  },
  content: {
    flex: 1,
    marginRight: premiumSpacing.sm,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  reference: {
    fontSize: 12,
    fontWeight: '500',
    color: premiumColors.text.tertiary,
    fontFamily: 'Inter-Medium',
  },
  separator: {
    fontSize: 12,
    color: premiumColors.text.tertiary,
    marginHorizontal: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: premiumColors.text.primary,
    fontFamily: 'Inter-SemiBold',
    flexShrink: 1,
  },
  description: {
    fontSize: 12,
    color: premiumColors.text.tertiary,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
    backgroundColor: premiumColors.primary.base + '10',
    marginRight: 6,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
    color: premiumColors.primary.base,
  },
  meta: {
    flexDirection: 'column',
    gap: 0,
  },
  metaText: {
    fontSize: 11,
    color: premiumColors.text.secondary,
    fontWeight: '500',
  },
  metaDate: {
    fontSize: 10,
    color: premiumColors.text.tertiary,
  },
  // New styles for right stock display
  stockRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: premiumSpacing.xs,
    marginRight: premiumSpacing.xs,
    minWidth: 50,
  },
  stockBadgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 2,
  },
  stockValueRight: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  stockUnitRight: {
    fontSize: 10,
    color: premiumColors.text.tertiary,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
});

export default PremiumArticleCard;
