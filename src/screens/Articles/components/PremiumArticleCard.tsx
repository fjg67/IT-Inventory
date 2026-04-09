import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Image,
  useWindowDimensions,
} from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import Animated, {
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
  if (normalized.includes('disponible')) return 'Disponible';
  if (normalized.includes('reusin') || normalized.includes('recondition')) return 'A reusiner';
  if (normalized.includes('a chaud') || normalized.includes('à chaud')) return 'A chaud';
  return null;
};

interface PremiumArticleCardProps {
  article: Article;
  onPress: (articleId: number) => void;
  onEdit?: () => void;
  onDelete?: (articleId: number) => void;
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
  onDelete,
  onMarkSent,
  onMarkAvailable,
  onMarkHot,
}) => {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
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

  const handleDelete = useCallback((e: any) => {
    e.stopPropagation();
    if (onDelete) {
      Vibration.vibrate([10, 50, 10]);
      onDelete(article.id);
    }
  }, [onDelete, article.id]);

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

  const isTabletItem = useMemo(() => {
    const values = [article.typeArticle, article.sousType, article.famille]
      .filter((v): v is string => !!v)
      .map((v) => v.toLowerCase());
    return values.some((v) => v.includes('tablette'));
  }, [article.typeArticle, article.sousType, article.famille]);

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
    return article.description;
  }, [article.description, isPCItem]);

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
  const canSetHot = isPCAvailable || isPCReconditioning;
  const canMarkSent = isPCItem && !isPCReconditioning;

  return (
    <Animated.View style={pressStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.15 : 0.06,
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
                            : pcStatus === 'Disponible'
                              ? (isDark ? 'rgba(37,99,235,0.18)' : '#DBEAFE')
                              : (isDark ? 'rgba(245,158,11,0.18)' : '#FEF3C7'),
                      },
                    ]}
                  >
                    <Icon
                      name={pcStatus === 'A chaud' ? 'flash-outline' : pcStatus === 'Disponible' ? 'check-circle-outline' : 'wrench-outline'}
                      size={11}
                      color={pcStatus === 'A chaud' ? '#059669' : pcStatus === 'Disponible' ? '#2563EB' : '#D97706'}
                    />
                    <Text style={[styles.badgeText, { color: pcStatus === 'A chaud' ? '#059669' : pcStatus === 'Disponible' ? '#2563EB' : '#D97706' }]}>{pcStatus}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Date */}
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {isPCItem && pcStatus === 'A chaud'
                ? pcHotDateLabel
                : isPCItem && pcStatus === 'Disponible'
                  ? pcAvailableDateLabel
                  : relativeDate}
            </Text>
          </View>

          {/* Stock indicator (right) */}
          <View style={styles.stockColumn}>
            {isTabletItem ? (
              // Delete button for tablets
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDelete}
                style={[
                  styles.deleteBtn,
                  { 
                    backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2',
                    borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FCA5A5',
                  }
                ]}
              >
                <Icon name="trash-can-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            ) : isPCItem ? (
              <View style={[styles.pcActionsRail, { backgroundColor: isDark ? 'rgba(15,23,42,0.28)' : '#F8FAFC' }]}>
                {canMarkSent && (
                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={handleMarkSent}
                    style={styles.pcActionBtnWrap}
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
                        <Text style={[styles.pcActionBtnLabel, { color: '#9F1239' }]}>Envoyé</Text>
                        <Text style={[styles.pcActionBtnHint, { color: '#BE123C' }]}>Sortie</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {!canSetHot && (
                  <>
                    {canMarkSent ? (
                      <View style={[styles.pcActionDivider, { backgroundColor: isDark ? 'rgba(148,163,184,0.16)' : '#E2E8F0' }]} />
                    ) : null}
                    <TouchableOpacity
                      activeOpacity={0.78}
                      onPress={handleMarkAvailable}
                      style={styles.pcActionBtnWrap}
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
                          <Text style={[styles.pcActionBtnLabel, { color: '#1D4ED8' }]}>Disponible</Text>
                          <Text style={[styles.pcActionBtnHint, { color: '#1E40AF' }]}>Stock</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
                {canSetHot && (
                  <>
                    {canMarkSent ? (
                      <View style={[styles.pcActionDivider, { backgroundColor: isDark ? 'rgba(148,163,184,0.16)' : '#E2E8F0' }]} />
                    ) : null}
                    <TouchableOpacity
                      activeOpacity={0.78}
                      onPress={handleMarkHot}
                      style={styles.pcActionBtnWrap}
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
                          <Text style={[styles.pcActionBtnLabel, { color: '#047857' }]}>A chaud</Text>
                          <Text style={[styles.pcActionBtnHint, { color: '#065F46' }]}>Remise</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
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
                  <Icon name={stockConfig.icon} size={14} color="#FFFFFF" />
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
              </>
            )}
          </View>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  imageSection: {
    marginRight: 12,
    marginLeft: 4,
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
    marginRight: 8,
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
    gap: 4,
    marginTop: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  dateText: {
    fontSize: 10,
    marginTop: 5,
    letterSpacing: 0.2,
  },
  stockColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    marginBottom: 3,
  },
  pcActionsRail: {
    width: 112,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  pcActionBtnWrap: {
    borderRadius: 13,
    overflow: 'hidden',
  },
  pcActionBtn: {
    minHeight: 48,
    borderRadius: 13,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcActionTextWrap: {
    flex: 1,
  },
  pcActionBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  pcActionBtnHint: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.9,
    marginTop: 1,
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
    fontWeight: '500',
    textTransform: 'lowercase',
  },
});

export default PremiumArticleCard;
