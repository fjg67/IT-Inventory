import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Vibration,
  Image,
  useWindowDimensions,
} from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import Animated, {
  interpolate,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumSpacing,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';
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
  'PC': { icon: 'laptop', color: '#007A39' },
  'Tablette': { icon: 'tablet-cellphone', color: '#007A39' },
  'Souris': { icon: 'mouse', color: '#007A39' },
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
  'Scanner doc': { icon: 'scanner', color: '#007A39' },
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
  'PC portable': { icon: 'laptop', color: '#007A39', emoji: '💻' },
  'PC disponible': { icon: 'laptop-account', color: '#2563EB', emoji: '💼' },
};

const getPcStatus = (description?: string) => {
  const normalized = (description ?? '').toLowerCase();
  if (normalized.includes('envoy')) return 'Envoyé';
  if (normalized.includes('disponible')) return 'Disponible';
  if (normalized.includes('usinage') || normalized.includes('en train d\'usiner')) return 'En usinage';
  if (normalized.includes('reusin') || normalized.includes('recondition')) return 'A reusiner';
  if (normalized.includes('a chaud') || normalized.includes('à chaud')) return 'A chaud';
  return null;
};

interface PremiumArticleCardProps {
  article: Article;
  onPress: (articleId: number) => void;
  onEdit?: () => void;
  onDecommission?: (articleId: number) => void;
  onMarkSent?: (articleId: number) => void;
  onMarkAvailable?: (articleId: number) => void;
  onMarkHot?: (articleId: number) => void;
}

/**
 * Card article premium avec accent latéral, photo raffinée, badges modernes
 */
const PremiumArticleCard: React.FC<PremiumArticleCardProps> = React.memo(({
  article,
  onPress,
  onDecommission,
  onMarkSent,
  onMarkAvailable,
  onMarkHot,
}) => {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const tablet = checkIsTablet(width);
  const pressScale = useSharedValue(1);
  const pressLift = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(1.01, {
      duration: premiumAnimation.pressDuration,
    });
    pressLift.value = withTiming(1, {
      duration: premiumAnimation.pressDuration,
    });
  }, [pressScale, pressLift]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withTiming(1, {
      duration: premiumAnimation.pressDuration,
    });
    pressLift.value = withTiming(0, {
      duration: premiumAnimation.pressDuration,
    });
  }, [pressScale, pressLift]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pressScale.value },
      { translateY: -interpolate(pressLift.value, [0, 1], [0, 2]) },
    ],
    shadowOpacity: interpolate(pressLift.value, [0, 1], [isDark ? 0.15 : 0.06, isDark ? 0.34 : 0.24]),
    shadowRadius: interpolate(pressLift.value, [0, 1], [8, 16]),
  }));

  const liftGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressLift.value, [0, 1], [0, isDark ? 0.28 : 0.2]),
  }));

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onPress(article.id);
  }, [onPress, article.id]);

  const handleDecommission = useCallback((e: any) => {
    e.stopPropagation();
    if (onDecommission) {
      Vibration.vibrate([10, 50, 10]);
      onDecommission(article.id);
    }
  }, [onDecommission, article.id]);

  const handleMarkSent = useCallback((e: any) => {
    e.stopPropagation();
    if (onMarkSent) {
      Vibration.vibrate([10, 40, 10]);
      onMarkSent(article.id);
    }
  }, [onMarkSent, article.id]);

  const handleMarkAvailable = useCallback((e: any) => {
    e.stopPropagation();
    if (onMarkAvailable) {
      Vibration.vibrate(12);
      onMarkAvailable(article.id);
    }
  }, [onMarkAvailable, article.id]);

  const handleMarkHot = useCallback((e: any) => {
    e.stopPropagation();
    if (onMarkHot) {
      Vibration.vibrate(12);
      onMarkHot(article.id);
    }
  }, [onMarkHot, article.id]);

  // Stock config
  const stockConfig = useMemo(() => {
    const qty = article.quantiteActuelle ?? 0;
    const mini = article.stockMini;

    if (qty === 0) {
      return {
        gradient: ['#EF4444', '#DC2626'] as const,
        color: '#EF4444',
        icon: 'alert-circle' as const,
        label: 'Rupture',
      };
    }
    if (qty <= mini) {
      return {
        gradient: ['#F59E0B', '#D97706'] as const,
        color: '#F59E0B',
        icon: 'alert-outline' as const,
        label: 'Stock faible',
      };
    }
    return {
      gradient: ['#10B981', '#059669'] as const,
      color: '#10B981',
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

  const pcHotDateLabel = useMemo(() => {
    if (!article.dateModification) return '';

    const date = new Date(article.dateModification);
    return `A chaud depuis le ${date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, [article.dateModification]);

  const pcAvailableDateLabel = useMemo(() => {
    if (!article.dateModification) return '';

    const date = new Date(article.dateModification);
    return `Disponible depuis le ${date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, [article.dateModification]);

  const pcSentDateLabel = useMemo(() => {
    if (!article.dateModification) return '';

    const date = new Date(article.dateModification);
    return `Envoyé le ${date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, [article.dateModification]);

  const pcProcessingDateLabel = useMemo(() => {
    if (!article.dateModification) return '';

    const date = new Date(article.dateModification);
    return `En usinage depuis le ${date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, [article.dateModification]);

  const isTabletItem = useMemo(() => {
    const values = [article.typeArticle, article.sousType, article.famille]
      .filter((v): v is string => !!v)
      .map((v) => v.toLowerCase());
    return values.some((v) => v.includes('tablette'));
  }, [article.typeArticle, article.sousType, article.famille]);

  const isTabletDecommissioned = useMemo(() => {
    if (!isTabletItem) return false;
    const normalized = (article.description ?? '').toLowerCase();
    return normalized.includes('decommission') || normalized.includes('décommission');
  }, [article.description, isTabletItem]);

  const tabletDecommissionDateLabel = useMemo(() => {
    if (!article.dateModification) return 'Décommissionnée';

    const date = new Date(article.dateModification);
    return `Décommissionnée le ${date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, [article.dateModification]);

  const isPCItem = useMemo(() => {
    const values = [article.typeArticle, article.sousType, article.famille]
      .filter((v): v is string => !!v)
      .map((v) => v.toLowerCase());
    return values.some((v) => v === 'pc' || v.includes('portable agence') || v.includes('portable siège') || v.includes('pc portable'));
  }, [article.typeArticle, article.sousType, article.famille]);

  const displayDescription = useMemo(() => {
    if (!article.description) return null;
    const normalized = article.description.toLowerCase().trim();
    if (isPCItem && normalized.startsWith('statut:')) return null;
    if (isTabletItem && normalized.includes('statut: décommissionnée')) return null;
    return article.description;
  }, [article.description, isPCItem, isTabletItem]);

  const pcStatus = useMemo(() => getPcStatus(article.description), [article.description]);
  const pcAllocationLabel = useMemo(() => {
    if (!isPCItem) return null;

    const values = [article.sousType, article.typeArticle, article.famille]
      .filter((value): value is string => !!value)
      .map((value) => value.toLowerCase());

    if (values.some((value) => value.includes('portable agence'))) {
      return 'Portable agence';
    }

    if (values.some((value) => value.includes('portable siège') || value.includes('portable siege'))) {
      return 'Portable siège';
    }

    return null;
  }, [article.famille, article.sousType, article.typeArticle, isPCItem]);
  const isPCAvailable =
    isPCItem && (pcStatus === 'Disponible' || (article.famille ?? '').toLowerCase().includes('disponible'));
  const isPCReconditioning = isPCItem && pcStatus === 'A reusiner';
  const isPCProcessing = isPCItem && pcStatus === 'En usinage';
  const isPCSent = isPCItem && pcStatus === 'Envoyé';
  const canSetHot = isPCAvailable || isPCReconditioning || isPCProcessing;
  const canMarkSent = isPCItem && !isPCReconditioning && !isPCProcessing && !isPCSent;
  const pcActionTone = isPCSent ? '#BE123C' : canSetHot ? '#059669' : '#2563EB';

  return (
    <Animated.View style={pressStyle}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
            shadowColor: stockConfig.color,
          },
          tablet && { padding: premiumSpacing.lg },
        ]}
      >
        {/* Left accent bar */}
        <LinearGradient
          colors={[...stockConfig.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.accentBar}
        />

        <Animated.View pointerEvents="none" style={[styles.liftGlow, { borderColor: stockConfig.color }, liftGlowStyle]} />

        {isTabletItem && <View pointerEvents="none" style={styles.tabletCardOrb} />}

        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardMainPressable}
        >
          {/* Photo / Icon */}
          <View style={styles.imageSection}>
            {article.photoUrl ? (
              <View style={[
                styles.photoContainer,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                },
                tablet && { width: 60, height: 60 },
              ]}>
                <Image
                  source={{ uri: article.photoUrl }}
                  style={[
                    styles.photoThumb,
                    tablet && { width: 54, height: 54 },
                  ]}
                />
              </View>
            ) : (
              <View style={[styles.iconShadow, { shadowColor: colors.primary }]}>
                <LinearGradient
                  colors={isTabletItem || isPCItem ? ['#007A39', '#059669'] : ['#007A39', '#007A39']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconContainer,
                    tablet && { width: 60, height: 60 },
                  ]}
                >
                  <View style={[styles.iconInner, tablet && { width: 38, height: 38, borderRadius: 10 }]}>
                    <Icon
                      name={isTabletItem ? 'tablet-cellphone' : isPCItem ? 'laptop' : 'package-variant'}
                      size={tablet ? 22 : 18}
                      color="#007A39"
                    />
                  </View>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Name */}
            <Text
              style={[
                styles.name,
                { color: colors.textPrimary },
                tablet && { fontSize: 17 },
              ]}
              numberOfLines={1}
            >
              {article.nom}
            </Text>

            {/* Description */}
            {displayDescription ? (
              <Text
                style={[
                  styles.description,
                  { color: colors.textMuted },
                  tablet && { fontSize: 13 },
                ]}
                numberOfLines={1}
              >
                {displayDescription}
              </Text>
            ) : null}

            {/* Badges row 1: Reference + Famille */}
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark ? 'rgba(0,122,57,0.1)' : '#E8F5E9',
                  },
                ]}
              >
                <Icon name="barcode" size={11} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {article.reference}
                </Text>
              </View>

              {article.barcode ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isDark ? 'rgba(59,130,246,0.16)' : '#DBEAFE',
                    },
                  ]}
                >
                  <Icon name="tag-outline" size={11} color="#2563EB" />
                  <Text style={[styles.badgeText, { color: '#2563EB' }]}>Asset {article.barcode}</Text>
                </View>
              ) : null}

              {!isPCItem && article.famille && FAMILLE_MAP[article.famille] ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: FAMILLE_MAP[article.famille].color + (isDark ? '18' : '10'),
                    },
                  ]}
                >
                  <Icon
                    name={FAMILLE_MAP[article.famille].icon}
                    size={11}
                    color={FAMILLE_MAP[article.famille].color}
                  />
                  <Text style={[styles.badgeText, { color: FAMILLE_MAP[article.famille].color }]}>
                    {article.famille}
                  </Text>
                </View>
              ) : !isPCItem && article.codeFamille ? (
                <View style={[styles.badge, { backgroundColor: '#8B5CF6' + (isDark ? '18' : '10') }]}>
                  <Icon name="tag-outline" size={11} color="#8B5CF6" />
                  <Text style={[styles.badgeText, { color: '#8B5CF6' }]}>
                    F{article.codeFamille}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Badges row 2: Marque + Type + Sous-type */}
            {!isPCItem && (article.typeArticle || article.sousType || article.marque) ? (
              <View style={styles.badgesRow}>
                {article.marque && MARQUE_MAP[article.marque] ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: MARQUE_MAP[article.marque].color + (isDark ? '18' : '10') },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: '800',
                        color: MARQUE_MAP[article.marque].color,
                        letterSpacing: 0.5,
                      }}
                    >
                      {MARQUE_MAP[article.marque].initials}
                    </Text>
                    <Text style={[styles.badgeText, { color: MARQUE_MAP[article.marque].color }]}>
                      {article.marque}
                    </Text>
                  </View>
                ) : null}
                {article.typeArticle && TYPE_MAP[article.typeArticle] ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: TYPE_MAP[article.typeArticle].color + (isDark ? '18' : '10') },
                    ]}
                  >
                    <Icon
                      name={TYPE_MAP[article.typeArticle].icon}
                      size={10}
                      color={TYPE_MAP[article.typeArticle].color}
                    />
                    <Text style={[styles.badgeText, { color: TYPE_MAP[article.typeArticle].color }]}>
                      {article.typeArticle}
                    </Text>
                  </View>
                ) : null}
                {article.sousType ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isDark ? 'rgba(100,116,139,0.12)' : '#F1F5F9' },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: '#64748B' }]}>
                      {article.sousType}
                    </Text>
                  </View>
                ) : null}
                {isTabletDecommissioned ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isDark ? 'rgba(217,119,6,0.2)' : '#FEF3C7' },
                    ]}
                  >
                    <Icon name="power-plug-off-outline" size={10} color="#B45309" />
                    <Text style={[styles.badgeText, { color: '#B45309' }]}>Décommissionnée</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {(article.modele || pcStatus || pcAllocationLabel) ? (
              <View style={styles.badgesRow}>
                {pcAllocationLabel ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isDark ? 'rgba(15,118,110,0.16)' : '#CCFBF1',
                      },
                    ]}
                  >
                    <Icon name="office-building-outline" size={11} color="#0F766E" />
                    <Text style={[styles.badgeText, { color: '#0F766E' }]}>{pcAllocationLabel}</Text>
                  </View>
                ) : null}
                {article.modele ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isDark ? 'rgba(0,122,57,0.16)' : '#DCFCE7' },
                    ]}
                  >
                    <Icon name="laptop" size={11} color="#007A39" />
                    <Text style={[styles.badgeText, { color: '#007A39' }]}>{article.modele}</Text>
                  </View>
                ) : null}
                {pcStatus ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          pcStatus === 'A chaud'
                            ? (isDark ? 'rgba(16,185,129,0.16)' : '#D1FAE5')
                            : pcStatus === 'En usinage'
                              ? (isDark ? 'rgba(249,115,22,0.2)' : '#FFEDD5')
                            : pcStatus === 'Disponible'
                              ? (isDark ? 'rgba(37,99,235,0.18)' : '#DBEAFE')
                              : pcStatus === 'Envoyé'
                                ? (isDark ? 'rgba(225,29,72,0.2)' : '#FFE4E6')
                              : (isDark ? 'rgba(245,158,11,0.18)' : '#FEF3C7'),
                      },
                    ]}
                  >
                    <Icon
                      name={pcStatus === 'A chaud' ? 'flash-outline' : pcStatus === 'En usinage' ? 'cog-play-outline' : pcStatus === 'Disponible' ? 'check-circle-outline' : pcStatus === 'Envoyé' ? 'send-outline' : 'wrench-outline'}
                      size={11}
                      color={pcStatus === 'A chaud' ? '#059669' : pcStatus === 'En usinage' ? '#EA580C' : pcStatus === 'Disponible' ? '#2563EB' : pcStatus === 'Envoyé' ? '#BE123C' : '#D97706'}
                    />
                    <Text style={[styles.badgeText, { color: pcStatus === 'A chaud' ? '#059669' : pcStatus === 'En usinage' ? '#EA580C' : pcStatus === 'Disponible' ? '#2563EB' : pcStatus === 'Envoyé' ? '#BE123C' : '#D97706' }]}>{pcStatus}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Date */}
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {isPCItem && pcStatus === 'A chaud'
                ? pcHotDateLabel
                : isPCItem && pcStatus === 'En usinage'
                  ? pcProcessingDateLabel
                : isPCItem && pcStatus === 'Disponible'
                  ? pcAvailableDateLabel
                  : isPCItem && pcStatus === 'Envoyé'
                    ? pcSentDateLabel
                    : isTabletItem && isTabletDecommissioned
                      ? tabletDecommissionDateLabel
                  : relativeDate}
            </Text>
          </View>

        </Pressable>

        {/* Stock indicator (right) */}
        <View style={styles.stockColumn}>
          {isTabletItem ? (
            // Decommission button for tablets
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDecommission}
              disabled={isTabletDecommissioned}
              style={[
                styles.tabletActionBtn,
                {
                  backgroundColor: isTabletDecommissioned
                    ? (isDark ? 'rgba(16,185,129,0.12)' : '#DCFCE7')
                    : (isDark ? 'rgba(217,119,6,0.14)' : '#FEF3C7'),
                  borderColor: isTabletDecommissioned
                    ? (isDark ? 'rgba(16,185,129,0.26)' : '#86EFAC')
                    : (isDark ? 'rgba(217,119,6,0.28)' : '#FCD34D'),
                }
              ]}
            >
              <Icon
                name={isTabletDecommissioned ? 'check-decagram' : 'power-plug-off-outline'}
                size={16}
                color={isTabletDecommissioned ? '#059669' : '#B45309'}
              />
              <Text style={[styles.tabletActionBtnText, { color: isTabletDecommissioned ? '#047857' : '#92400E' }]}>
                {isTabletDecommissioned ? 'OK' : 'DCM'}
              </Text>
            </TouchableOpacity>
          ) : isPCItem ? (
            <View style={[styles.pcActionsRail, {
              backgroundColor: isDark ? 'rgba(15,23,42,0.28)' : '#F8FAFC',
              borderColor: isDark ? `${pcActionTone}40` : `${pcActionTone}26`,
              shadowColor: pcActionTone,
            }]}>
              {isPCSent && (
                <View style={styles.pcActionBtnWrap}>
                  <LinearGradient
                    colors={isDark ? ['#7A1238', '#BE123C'] : ['#FFF1F2', '#FFE4E6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.pcActionBtn, styles.pcActionBtnDanger]}
                  >
                    <View style={[styles.pcActionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : '#FFFFFF' }]}> 
                      <Icon name="send-check-outline" size={13} color="#BE123C" />
                    </View>
                    <View style={styles.pcActionTextWrap}>
                      <Text numberOfLines={1} style={[styles.pcActionBtnLabel, { color: '#9F1239' }]}>Déjà envoyé</Text>
                      <Text numberOfLines={1} style={[styles.pcActionBtnHint, { color: '#BE123C' }]}>{article.emplacement || 'EDS destination'}</Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
              {canMarkSent && (
                <Pressable
                  android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)' }}
                  style={({ pressed }) => [styles.pcActionBtnWrap, pressed && styles.pcActionBtnWrapPressed]}
                  onPress={handleMarkSent}
                >
                  <LinearGradient
                    colors={isDark ? ['#7F1D1D', '#B91C1C'] : ['#FFF1F2', '#FFE4E6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.pcActionBtn, styles.pcActionBtnDanger]}
                  >
                    <View style={[styles.pcActionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : '#FFFFFF' }]}> 
                      <Icon name="send-outline" size={13} color="#E11D48" />
                    </View>
                    <View style={styles.pcActionTextWrap}>
                      <Text numberOfLines={1} style={[styles.pcActionBtnLabel, { color: '#9F1239' }]}>Envoyé</Text>
                      <Text numberOfLines={1} style={[styles.pcActionBtnHint, { color: '#BE123C' }]}>Sortie</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              )}
              {!canSetHot && !isPCSent && (
                <>
                  {canMarkSent ? (
                    <View style={[styles.pcActionDivider, { backgroundColor: isDark ? 'rgba(148,163,184,0.16)' : '#E2E8F0' }]} />
                  ) : null}
                  <Pressable
                    android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)' }}
                    style={({ pressed }) => [styles.pcActionBtnWrap, pressed && styles.pcActionBtnWrapPressed]}
                    onPress={handleMarkAvailable}
                  >
                    <LinearGradient
                      colors={isDark ? ['#0F3A68', '#1D4ED8'] : ['#EFF6FF', '#DBEAFE']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.pcActionBtn, styles.pcActionBtnInfo]}
                    >
                      <View style={[styles.pcActionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : '#FFFFFF' }]}> 
                        <Icon name="check-circle-outline" size={13} color="#2563EB" />
                      </View>
                      <View style={styles.pcActionTextWrap}>
                        <Text numberOfLines={1} style={[styles.pcActionBtnLabel, { color: '#1D4ED8' }]}>Disponible</Text>
                        <Text numberOfLines={1} style={[styles.pcActionBtnHint, { color: '#1E40AF' }]}>Stock</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </>
              )}
              {canSetHot && (
                <>
                  {canMarkSent ? (
                    <View style={[styles.pcActionDivider, { backgroundColor: isDark ? 'rgba(148,163,184,0.16)' : '#E2E8F0' }]} />
                  ) : null}
                  <Pressable
                    android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)' }}
                    style={({ pressed }) => [styles.pcActionBtnWrap, pressed && styles.pcActionBtnWrapPressed]}
                    onPress={handleMarkHot}
                  >
                    <LinearGradient
                      colors={isDark ? ['#0B5D3B', '#059669'] : ['#ECFDF5', '#D1FAE5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.pcActionBtn, styles.pcActionBtnSuccess]}
                    >
                      <View style={[styles.pcActionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : '#FFFFFF' }]}> 
                        <Icon name="flash-outline" size={13} color="#059669" />
                      </View>
                      <View style={styles.pcActionTextWrap}>
                        <Text numberOfLines={1} style={[styles.pcActionBtnLabel, { color: '#047857' }]}>A chaud</Text>
                        <Text numberOfLines={1} style={[styles.pcActionBtnHint, { color: '#065F46' }]}>Remise</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            // Stock indicator for non-tablets
            <>
              <LinearGradient
                colors={[...stockConfig.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.stockPill,
                  tablet && { paddingHorizontal: 12, paddingVertical: 8 },
                ]}
              >
                <View style={styles.stockIconWrap}>
                  <Icon name={stockConfig.icon} size={12} color={stockConfig.color} />
                </View>
                <Text
                  style={[
                    styles.stockValue,
                    tablet && { fontSize: 18 },
                  ]}
                >
                  {article.quantiteActuelle ?? 0}
                </Text>
              </LinearGradient>
              <Text
                style={[
                  styles.stockUnit,
                  { color: colors.textMuted },
                  tablet && { fontSize: 11 },
                ]}
              >
                {article.unite}
              </Text>
              <View style={[styles.stockChevronWrap, { backgroundColor: isDark ? 'rgba(148,163,184,0.14)' : '#EDF2F7' }]}>
                <Icon name="chevron-right" size={14} color={colors.textMuted} />
              </View>
            </>
          )}
        </View>
      </View>
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 4,
  },
  cardMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  liftGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  tabletCardOrb: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    top: -42,
    right: -30,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  imageSection: {
    marginRight: 12,
    marginLeft: 5,
  },
  photoContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  description: {
    fontSize: 11,
    marginBottom: 6,
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  dateText: {
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  stockColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    gap: 3,
  },
  tabletActionBtn: {
    width: 56,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  tabletActionBtnText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 11,
    gap: 4,
  },
  stockIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcActionsRail: {
    width: 126,
    borderRadius: 17,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  pcActionBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  pcActionBtnWrapPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },
  pcActionBtn: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  pcActionBtnDanger: {
    borderColor: 'rgba(244,63,94,0.16)',
  },
  pcActionBtnInfo: {
    borderColor: 'rgba(37,99,235,0.16)',
  },
  pcActionBtnSuccess: {
    borderColor: 'rgba(5,150,105,0.18)',
  },
  pcActionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcActionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  pcActionBtnLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  pcActionBtnHint: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.9,
    marginTop: 0,
    letterSpacing: 0.6,
  },
  pcActionDivider: {
    height: 1,
    marginVertical: 6,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  stockUnit: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockChevronWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PremiumArticleCard;
