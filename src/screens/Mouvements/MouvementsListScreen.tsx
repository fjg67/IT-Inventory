// ============================================
// MOUVEMENTS LIST SCREEN - Modern Redesign
// IT-Inventory Application
// ============================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Vibration,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Pressable,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { selectIsSuperviseur } from '@/store/slices/authSlice';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { mouvementRepository } from '@/database';
import type { MouvementStats } from '@/database/repositories/mouvementRepository';
import { formatTimeParis, formatRelativeDateParis, formatDateTimeParis } from '@/utils/dateUtils';
import { toAbbreviation } from '@/utils/abbreviation';
import { Mouvement } from '@/types';
import { useTheme } from '@/theme';
import {
  premiumSpacing,
} from '@/constants/premiumTheme';

// ==================== HELPERS ====================
const TYPE_CONFIG: Record<string, { icon: string; color: string; gradient: [string, string]; label: string; prefix: string }> = {
  entree: { icon: 'arrow-up-bold', color: '#10B981', gradient: ['#10B981', '#059669'], label: 'Entrée', prefix: '+' },
  sortie: { icon: 'arrow-down-bold', color: '#EF4444', gradient: ['#EF4444', '#DC2626'], label: 'Sortie', prefix: '-' },
  ajustement: { icon: 'swap-vertical', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'], label: 'Ajustement', prefix: '' },
  transfert_depart: { icon: 'arrow-right-bold', color: '#8B5CF6', gradient: ['#8B5CF6', '#6D28D9'], label: 'Transfert ↗', prefix: '-' },
  transfert_arrivee: { icon: 'arrow-left-bold', color: '#8B5CF6', gradient: ['#8B5CF6', '#6D28D9'], label: 'Transfert ↙', prefix: '+' },
};

const getTypeConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG.entree;

const formatTime = (date: Date): string => formatTimeParis(date);
const formatRelativeDate = (date: Date): string => formatRelativeDateParis(date);

const groupMouvementsByDate = (mouvements: Mouvement[]): { label: string; date: Date; items: Mouvement[] }[] => {
  const groups: Record<string, Mouvement[]> = {};
  for (const m of mouvements) {
    const key = new Date(m.dateMouvement).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return Object.entries(groups).map(([key, items]) => ({
    label: formatRelativeDate(new Date(key)),
    date: new Date(key),
    items,
  }));
};

// ==================== TYPES FILTER ====================
type QuickTypeFilter = 'all' | 'entree' | 'sortie' | 'ajustement' | 'transfert';

type CachedMouvementsState = {
  mouvements: Mouvement[];
  totalMouvements: number;
  realStats: MouvementStats;
};

const mouvementsScreenCache: Record<string, CachedMouvementsState> = {};

const getCacheKey = (siteId?: string | number): string => String(siteId ?? 'all');

function dedupeMouvementsById(items: Mouvement[]): Mouvement[] {
  const seen = new Set<string>();
  const result: Mouvement[] = [];

  for (const item of items) {
    const id = String(item.id ?? '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }

  return result;
}

function computeStatsFromMouvements(items: Mouvement[], total?: number): MouvementStats {
  let entrees = 0;
  let sorties = 0;
  let ajustements = 0;
  let transferts = 0;

  for (const m of items) {
    if (m.type === 'entree') entrees += 1;
    else if (m.type === 'sortie') sorties += 1;
    else if (m.type === 'ajustement') ajustements += 1;
    else if (m.type === 'transfert_depart' || m.type === 'transfert_arrivee') transferts += 1;
  }

  return {
    total: total ?? items.length,
    entrees,
    sorties,
    ajustements,
    transferts,
  };
}


// ==================== MAIN SCREEN ====================
export const MouvementsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const { colors, isDark } = useTheme();
  const cacheKey = useMemo(() => getCacheKey(effectiveSiteId ?? undefined), [effectiveSiteId]);
  const cachedState = mouvementsScreenCache[cacheKey];

  const [mouvements, setMouvements] = useState<Mouvement[]>(cachedState?.mouvements ?? []);
  const [totalMouvements, setTotalMouvements] = useState(cachedState?.totalMouvements ?? 0);
  const [realStats, setRealStats] = useState<MouvementStats>(
    cachedState?.realStats ?? {
      total: 0,
      entrees: 0,
      sorties: 0,
      ajustements: 0,
      transferts: 0,
    },
  );
  const [isLoading, setIsLoading] = useState(!cachedState);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuickTypeFilter>('all');
  const [showSearch, setShowSearch] = useState(false);

  // FAB
  const [fabOpen, setFabOpen] = useState(false);

  // Detail modal
  const [selectedMouvement, setSelectedMouvement] = useState<Mouvement | null>(null);
  const isLoadingRef = useRef(false);
  const loadSeqRef = useRef(0);
  const loaderSweep = useSharedValue(0);

  useEffect(() => {
    loaderSweep.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.linear }),
      -1,
      false,
    );
  }, [loaderSweep]);

  const loaderSweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -240 + loaderSweep.value * 520 }],
    opacity: 0.42,
  }));

  // ==================== DATA LOADING ====================
  const loadMouvements = useCallback(async (silent = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    const seq = ++loadSeqRef.current;

    if (!silent && !mouvementsScreenCache[cacheKey]) setIsLoading(true);
    try {
      const pageSize = 200;
      const firstPage = await mouvementRepository.findAll(
        effectiveSiteId ?? undefined,
        0,
        pageSize,
        { includeStockLevels: false },
      );

      const allMouvements: Mouvement[] = dedupeMouvementsById([...firstPage.data]);
      const resolvedTotal = firstPage.total || firstPage.data.length;

      if (seq !== loadSeqRef.current) return;

      setMouvements(allMouvements);
      setTotalMouvements(resolvedTotal);
      setRealStats(computeStatsFromMouvements(allMouvements, resolvedTotal));
      setIsLoading(false);

      try {
        const statsResult = await mouvementRepository.getStats(effectiveSiteId ?? undefined);
        setRealStats(statsResult);
      } catch (statsError) {
        console.warn('[MouvementsListScreen] getStats failed, fallback to loaded page counts:', statsError);
      }

      if (firstPage.hasMore) {
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const result = await mouvementRepository.findAll(
            effectiveSiteId ?? undefined,
            page,
            pageSize,
            { includeStockLevels: false },
          );

          if (seq !== loadSeqRef.current) return;

          const merged = dedupeMouvementsById([...allMouvements, ...result.data]);
          allMouvements.length = 0;
          allMouvements.push(...merged);

          setMouvements((prev) => dedupeMouvementsById([...prev, ...result.data]));

          hasMore = result.hasMore;
          page += 1;

          // Safety guard to prevent endless loops if backend metadata is inconsistent.
          if (page > 200) {
            hasMore = false;
          }
        }
      }

      const finalStats = computeStatsFromMouvements(allMouvements, resolvedTotal);
      if (seq !== loadSeqRef.current) return;
      setRealStats(finalStats);

      mouvementsScreenCache[cacheKey] = {
        mouvements: allMouvements,
        totalMouvements: resolvedTotal,
        realStats: finalStats,
      };
    } catch (error) {
      console.warn('[MouvementsListScreen] Erreur chargement mouvements:', error);
    } finally {
      if (seq === loadSeqRef.current) {
        isLoadingRef.current = false;
      }
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [cacheKey, effectiveSiteId]);

  useEffect(() => {
    loadMouvements(Boolean(mouvementsScreenCache[cacheKey]));
  }, [cacheKey, loadMouvements]);

  useFocusEffect(
    useCallback(() => {
      loadMouvements(true);
    }, [loadMouvements]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Vibration.vibrate(10);
    loadMouvements(true);
  }, [loadMouvements]);

  // ==================== FILTERING ====================
  const filteredMouvements = useMemo(() => {
    let data = mouvements;
    if (typeFilter !== 'all') {
      if (typeFilter === 'transfert') {
        data = data.filter(m => m.type === 'transfert_depart' || m.type === 'transfert_arrivee');
      } else {
        data = data.filter(m => m.type === typeFilter);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(m =>
        m.article?.reference?.toLowerCase().includes(q) ||
        m.article?.nom?.toLowerCase().includes(q) ||
        m.technicien?.prenom?.toLowerCase().includes(q) ||
        m.technicien?.nom?.toLowerCase().includes(q),
      );
    }
    return data;
  }, [mouvements, typeFilter, searchQuery]);

  const groupedMouvements = useMemo(
    () => groupMouvementsByDate(filteredMouvements),
    [filteredMouvements],
  );

  // ==================== STATS ====================
  const stats = useMemo(() => {
    return {
      total: totalMouvements,
      entrees: realStats.entrees,
      sorties: realStats.sorties,
      ajustements: realStats.ajustements,
      transferts: realStats.transferts,
    };
  }, [totalMouvements, realStats]);

  const hasActiveFilters = typeFilter !== 'all' || searchQuery.trim().length > 0;

  // ==================== NAVIGATION ====================
  const handleNewMouvement = useCallback(() => {
    Vibration.vibrate(10);
    setFabOpen(false);
    navigation.navigate('MouvementForm');
  }, [navigation]);

  const handleScan = useCallback(() => {
    Vibration.vibrate(10);
    setFabOpen(false);
    navigation.navigate('ScanMouvement');
  }, [navigation]);

  // ==================== RENDER ====================
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          undefined,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ===== HEADER ===== */}
        <View style={styles.headerWrap}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}>
            {/* Accent bar */}
            <LinearGradient
              colors={['#005C2B', '#007A39']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.headerAccent}
            />

            <View style={styles.headerTop}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconShadow}>
                  <LinearGradient
                    colors={['#005C2B', '#007A39']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerIconPill}
                  >
                    <View style={styles.headerIconInner}>
                      <Icon name="swap-vertical" size={16} color="#007A39" />
                    </View>
                  </LinearGradient>
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mouvements</Text>
                  <Text style={[styles.headerSummary, { color: colors.textMuted }]}>
                    {stats.total} mouvement{stats.total !== 1 ? 's' : ''} enregistré{stats.total !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => {
                    Vibration.vibrate(10);
                    navigation.navigate('MouvementsStats');
                  }}
                  style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : 'rgba(0,122,57,0.10)' }]}
                >
                  <Icon name="chart-bar" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Vibration.vibrate(10);
                    setShowSearch(!showSearch);
                  }}
                  style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(0,122,57,0.08)' }]}
                >
                  <Icon name={showSearch ? 'close' : 'magnify'} size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Mini stats */}
            <View style={styles.miniStatsRow}>
              {[
                { label: 'Entrées', value: stats.entrees, prefix: '+', color: '#10B981', gradient: ['#10B981', '#059669'] as [string, string] },
                { label: 'Sorties', value: stats.sorties, prefix: '-', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] as [string, string] },
                { label: 'Ajustements', value: stats.ajustements, prefix: '+', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] as [string, string] },
                { label: 'Transferts', value: stats.transferts, prefix: '↔', color: '#8B5CF6', gradient: ['#8B5CF6', '#6D28D9'] as [string, string] },
              ].map((stat, i) => (
                <View key={i} style={[styles.miniStatCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}>
                  <LinearGradient
                    colors={stat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.miniStatAccent}
                  />
                  <Text style={[styles.miniStatValue, { color: colors.textPrimary }]}>{stat.prefix}{stat.value}</Text>
                  <Text style={[styles.miniStatLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SEARCH BAR (collapsible) ===== */}
        {showSearch && (
          <Animated.View entering={SlideInRight.springify().damping(20)} style={styles.searchWrap}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <View style={[styles.searchIconPill, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(0,122,57,0.08)' }]}>
                <Icon name="magnify" size={16} color={colors.primary} />
              </View>
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Rechercher article, technicien..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                  <Icon name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* ===== QUICK FILTERS ===== */}
        <View style={styles.filtersSection}>
          <View style={styles.filtersHeaderRow}>
            <View style={styles.filtersHeaderLeft}>
              <Text style={[styles.filtersTitle, { color: colors.textPrimary }]}>Filtres rapides</Text>
              <Text style={[styles.filtersSubtitle, { color: colors.textMuted }]}>Affichage immediat de tous les types</Text>
            </View>
            {hasActiveFilters && (
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)' }]}
                onPress={() => {
                  Vibration.vibrate(10);
                  setTypeFilter('all');
                  setSearchQuery('');
                }}
              >
                <Icon name="close" size={13} color="#EF4444" />
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.filtersScroll}>
            {([
              { key: 'all' as QuickTypeFilter, label: 'Tous', icon: 'format-list-bulleted', color: '#007A39', count: stats.total },
              { key: 'entree' as QuickTypeFilter, label: 'Entrées', icon: 'arrow-up-bold', color: '#10B981', count: stats.entrees },
              { key: 'sortie' as QuickTypeFilter, label: 'Sorties', icon: 'arrow-down-bold', color: '#EF4444', count: stats.sorties },
              { key: 'ajustement' as QuickTypeFilter, label: 'Ajustements', icon: 'swap-vertical', color: '#F59E0B', count: stats.ajustements },
              { key: 'transfert' as QuickTypeFilter, label: 'Transferts', icon: 'swap-horizontal', color: '#8B5CF6', count: stats.transferts },
            ]).map((f, index) => {
              const isActive = typeFilter === f.key;
              return (
                <Animated.View
                  key={f.key}
                  entering={FadeInUp.delay(90 + index * 35).duration(320)}
                >
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive
                          ? (isDark ? `${f.color}20` : `${f.color}12`)
                          : colors.surface,
                        borderColor: isActive ? f.color : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setTypeFilter(f.key);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.filterIconWrap,
                      {
                        backgroundColor: isActive
                          ? (isDark ? `${f.color}26` : `${f.color}16`)
                          : (isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.10)'),
                      },
                    ]}>
                      <Icon name={f.icon} size={13} color={isActive ? f.color : colors.textMuted} />
                    </View>
                    <Text style={[styles.filterChipText, { color: isActive ? f.color : colors.textSecondary }]}>
                      {f.label}
                    </Text>
                    <View style={[
                      styles.filterCountBadge,
                      {
                        backgroundColor: isActive
                          ? (isDark ? `${f.color}2A` : `${f.color}18`)
                          : (isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.10)'),
                      },
                    ]}>
                      <Text style={[styles.filterCountText, { color: isActive ? f.color : colors.textMuted }]}>{f.count}</Text>
                    </View>
                    {isActive && <View style={[styles.filterActiveGlow, { backgroundColor: f.color }]} />}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* ===== CONTENT ===== */}
        {isLoading ? (
          <View style={styles.loaderArena}>
            <LinearGradient
              colors={isDark ? ['rgba(16,185,129,0.14)', 'rgba(2,6,23,0.02)'] : ['#ECFDF5', '#F8FAFC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.loaderHero, { borderColor: colors.borderSubtle }]}
            >
              <View style={styles.loaderHeroTop}>
                <View style={[styles.loaderHeroIcon, { backgroundColor: isDark ? 'rgba(0,122,57,0.18)' : 'rgba(0,122,57,0.10)' }]}>
                  <Icon name="swap-vertical" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.loaderHeroTitle, { color: colors.textPrimary }]}>Chargement des mouvements</Text>
                  <Text style={[styles.loaderHeroSubtitle, { color: colors.textMuted }]}>Mise a jour des donnees en cours...</Text>
                </View>
              </View>
              <View style={[styles.loaderProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#D7E3DA' }]}>
                <Animated.View style={[styles.loaderProgressSweep, loaderSweepStyle]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(16,185,129,0.85)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </View>
            </LinearGradient>

            {[0, 1, 2, 3].map(i => (
              <View key={`loader-${i}`}>
                <View style={[styles.loaderCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}> 
                  <LinearGradient
                    colors={['#007A39', '#007A39']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.loaderCardAccent}
                  />

                  <View style={[styles.loaderAvatar, { backgroundColor: colors.skeleton }]} />

                  <View style={{ flex: 1 }}>
                    <View style={[styles.loaderLine, { width: '72%', backgroundColor: colors.skeleton }]} />
                    <View style={[styles.loaderLine, { width: '46%', marginTop: 8, backgroundColor: colors.skeleton }]} />
                    <View style={[styles.loaderLine, { width: '58%', marginTop: 8, backgroundColor: colors.skeleton }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : filteredMouvements.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}>
              <View style={styles.emptyIconShadow}>
                <LinearGradient
                  colors={['#005C2B', '#007A39']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyIconPill}
                >
                  <View style={styles.emptyIconInner}>
                    <Icon
                      name={hasActiveFilters ? 'filter-remove-outline' : 'chart-timeline-variant'}
                      size={24}
                      color="#007A39"
                    />
                  </View>
                </LinearGradient>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {hasActiveFilters ? 'Aucun résultat' : 'Aucun mouvement'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {hasActiveFilters
                  ? 'Aucun mouvement ne correspond à vos filtres'
                  : 'Les mouvements de stock apparaîtront ici'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Vibration.vibrate(10);
                  if (hasActiveFilters) {
                    setTypeFilter('all');
                    setSearchQuery('');
                  } else {
                    handleNewMouvement();
                  }
                }}
                style={styles.emptyCtaWrap}
              >
                <LinearGradient colors={['#005C2B', '#007A39']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyCtaGradient}>
                  <Icon
                    name={hasActiveFilters ? 'filter-remove' : 'plus'}
                    size={16}
                    color="#FFF"
                  />
                  <Text style={styles.emptyCtaText}>
                    {hasActiveFilters ? 'Réinitialiser les filtres' : 'Nouveau mouvement'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Timeline list */
          <View style={styles.timelineContainer}>
            {groupedMouvements.map((group) => (
              <View key={group.date.toISOString()}>
                {/* Date header */}
                <View
                  style={styles.dateHeaderRow}
                >
                  <View style={[styles.dateAccentBar, { backgroundColor: '#007A39' }]} />
                  <Text style={[styles.dateHeaderText, { color: colors.textSecondary }]}>{group.label}</Text>
                  <View style={[styles.dateLineAfter, { backgroundColor: colors.borderSubtle }]} />
                </View>

                {/* Mouvements */}
                {group.items.map((mouvement) => {
                  const cfg = getTypeConfig(mouvement.type);
                  return (
                    <View
                      key={mouvement.id}
                    >
                      <Pressable
                        style={({ pressed }) => ([
                          styles.mouvCard,
                          {
                            backgroundColor: pressed
                              ? (isDark ? `${cfg.color}14` : '#FFFFFF')
                              : colors.surface,
                            borderColor: pressed
                              ? cfg.color
                              : (isDark ? colors.borderSubtle : colors.borderMedium),
                            shadowColor: cfg.color,
                          },
                          pressed && styles.mouvCardPressed,
                        ])}
                        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }}
                        onPress={() => {
                          Vibration.vibrate(10);
                          setSelectedMouvement(mouvement);
                        }}
                      >
                        {/* Accent strip */}
                        <LinearGradient
                          colors={cfg.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.mouvAccent}
                        />

                        {/* Icon pill */}
                        <View style={[styles.mouvIconShadow, { shadowColor: cfg.color }]}>
                          <LinearGradient
                            colors={cfg.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.mouvIconPill}
                          >
                            <View style={styles.mouvIconInner}>
                              <Icon name={cfg.icon} size={14} color={cfg.color} />
                            </View>
                          </LinearGradient>
                        </View>

                        {/* Content */}
                        <View style={styles.mouvContent}>
                          <View style={styles.mouvRow1}>
                            <View style={styles.mouvArticle}>
                              <Text style={[styles.mouvArticleName, { color: colors.textPrimary }]} numberOfLines={1}>
                                {mouvement.article?.nom || 'Article inconnu'}
                              </Text>
                              <View style={[styles.mouvRefBadge, {
                                backgroundColor: isDark ? 'rgba(148,163,184,0.14)' : '#EEF2F7',
                                borderColor: isDark ? 'rgba(148,163,184,0.22)' : '#D7E0EA',
                              }]}>
                                <Icon name="barcode" size={12} color={colors.textMuted} />
                                <Text style={[styles.mouvRef, { color: colors.textMuted }]} numberOfLines={1}>
                                  {mouvement.article?.reference || 'N/A'}
                                </Text>
                              </View>
                            </View>
                            <View style={[styles.mouvQtyBadge, { backgroundColor: isDark ? `${cfg.color}24` : `${cfg.color}14` }]}>
                              <Text style={[styles.mouvQty, { color: cfg.color }]}>
                                {cfg.prefix}{Math.abs(mouvement.quantite)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.mouvBottom}>
                            <View style={styles.mouvTagsRow}>
                            <View style={[styles.mouvTypeBadge, { backgroundColor: isDark ? `${cfg.color}22` : `${cfg.color}11` }]}>
                              <Icon name={cfg.icon} size={11} color={cfg.color} />
                              <View style={[styles.mouvTypeDot, { backgroundColor: cfg.color }]} />
                              <Text style={[styles.mouvTypeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                            {(mouvement.type === 'transfert_depart' || mouvement.type === 'transfert_arrivee') && (
                              <View style={styles.mouvTransferRoute}>
                                <Icon name="map-marker-outline" size={11} color={colors.textMuted} />
                                <Text style={[styles.mouvTransferRouteText, { color: colors.textMuted }]} numberOfLines={1}>
                                  {mouvement.site?.nom ?? '?'} → {mouvement.transfertVersSite?.nom ?? '?'}
                                </Text>
                              </View>
                            )}
                            </View>
                            <View style={styles.mouvMeta}>
                              <Icon name="clock-time-four-outline" size={12} color={colors.textMuted} />
                              <Text style={[styles.mouvMetaText, { color: colors.textMuted }]}>
                                {formatTime(new Date(mouvement.dateMouvement))}
                              </Text>
                              {mouvement.technicien && (
                                <View style={[styles.mouvTechBadge, { backgroundColor: isDark ? 'rgba(148,163,184,0.14)' : '#EEF2F7' }]}>
                                  <Text style={[styles.mouvTechBadgeText, { color: colors.textMuted }]}>
                                    {toAbbreviation(`${mouvement.technicien.prenom || ''} ${mouvement.technicien.nom || ''}`, 3, 'N/A')}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        <View style={[styles.mouvChevronWrap, { backgroundColor: isDark ? 'rgba(148,163,184,0.12)' : '#F1F5F9' }]}>
                          <Icon name="chevron-right" size={16} color={colors.borderMedium} />
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacer for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== FAB (masqué pour superviseurs) ===== */}
      {!isSuperviseur && <>
      {fabOpen && (
        <TouchableWithoutFeedback onPress={() => setFabOpen(false)}>
          <View style={styles.fabBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {fabOpen && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.fabMenu}>
          {[
            { icon: 'barcode-scan', label: 'Scanner', gradient: ['#005C2B', '#007A39'] as [string, string], onPress: handleScan },
            {
              icon: 'arrow-up-bold', label: 'Entrée', gradient: ['#10B981', '#059669'] as [string, string],
              onPress: () => { Vibration.vibrate(10); setFabOpen(false); navigation.navigate('MouvementForm', { type: 'entree' }); },
            },
            {
              icon: 'arrow-down-bold', label: 'Sortie', gradient: ['#EF4444', '#DC2626'] as [string, string],
              onPress: () => { Vibration.vibrate(10); setFabOpen(false); navigation.navigate('MouvementForm', { type: 'sortie' }); },
            },
            {
              icon: 'swap-vertical', label: 'Ajustement', gradient: ['#F59E0B', '#D97706'] as [string, string],
              onPress: () => { Vibration.vibrate(10); setFabOpen(false); navigation.navigate('MouvementForm', { type: 'ajustement' }); },
            },
            {
              icon: 'swap-horizontal', label: 'Transfert', gradient: ['#8B5CF6', '#6D28D9'] as [string, string],
              onPress: () => { Vibration.vibrate(10); setFabOpen(false); navigation.navigate('TransfertForm'); },
            },
          ].map((item, idx) => (
            <Animated.View key={item.label} entering={FadeInUp.delay(idx * 60).duration(250)}>
              <TouchableOpacity
                style={[styles.fabMenuItem, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                activeOpacity={0.8}
                onPress={item.onPress}
              >
                <View style={[styles.fabMenuIconShadow, { shadowColor: item.gradient[0] }]}>
                  <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabMenuIconPill}>
                    <View style={styles.fabMenuIconInner}>
                      <Icon name={item.icon} size={14} color={item.gradient[0]} />
                    </View>
                  </LinearGradient>
                </View>
                <Text style={[styles.fabMenuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => {
          Vibration.vibrate(15);
          setFabOpen(!fabOpen);
        }}
      >
        <LinearGradient colors={['#005C2B', '#007A39', '#007A39']} style={styles.fabGradient}>
          <Icon name={fabOpen ? 'close' : 'plus'} size={26} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
      </>}

      {/* ===== DETAIL MODAL ===== */}
      <Modal
        visible={selectedMouvement !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMouvement(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedMouvement(null)}>
          <View style={[styles.detailOverlay, { backgroundColor: colors.modalOverlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.detailSheet, { backgroundColor: colors.surface }]}>
                <View style={[styles.detailHandle, { backgroundColor: colors.borderMedium }]} />

                {selectedMouvement && (() => {
                  const cfg = getTypeConfig(selectedMouvement.type);
                  const qtyDisplay = `${cfg.prefix}${Math.abs(selectedMouvement.quantite)}`;
                  return (
                    <>
                      {/* ===== HERO HEADER with gradient ===== */}
                      <LinearGradient
                        colors={cfg.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.detailHero}
                      >
                        <View style={styles.detailHeroTop}>
                          <View style={styles.detailHeroIconWrap}>
                            <View style={styles.detailHeroIconInner}>
                              <Icon name={cfg.icon} size={20} color={cfg.color} />
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.detailHeroClose}
                            onPress={() => {
                              Vibration.vibrate(10);
                              setSelectedMouvement(null);
                            }}
                          >
                            <Icon name="close" size={18} color="rgba(255,255,255,0.8)" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.detailHeroType}>{cfg.label}</Text>
                        <Text style={styles.detailHeroQty}>{qtyDisplay} unités</Text>
                        <View style={styles.detailHeroArticle}>
                          <Icon name="package-variant-closed" size={14} color="rgba(255,255,255,0.7)" />
                          <Text style={styles.detailHeroArticleName} numberOfLines={1}>
                            {selectedMouvement.article?.nom || 'Article inconnu'}
                          </Text>
                        </View>
                        <View style={styles.detailHeroRefBadge}>
                          <Text style={styles.detailHeroRefText}>
                            {selectedMouvement.article?.reference || '—'}
                          </Text>
                        </View>
                      </LinearGradient>

                      {/* ===== STOCK EVOLUTION CARD ===== */}
                      <View style={[styles.detailStockCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.borderSubtle }]}>
                        <View style={styles.detailStockCol}>
                          <Text style={[styles.detailStockNum, { color: colors.textMuted }]}>{selectedMouvement.stockAvant}</Text>
                          <Text style={[styles.detailStockCaption, { color: colors.textMuted }]}>Avant</Text>
                        </View>
                        <View style={[styles.detailStockArrow, { backgroundColor: cfg.color + '18' }]}>
                          <Icon name="arrow-right" size={18} color={cfg.color} />
                        </View>
                        <View style={styles.detailStockCol}>
                          <Text style={[styles.detailStockNum, { color: cfg.color }]}>{selectedMouvement.stockApres}</Text>
                          <Text style={[styles.detailStockCaption, { color: colors.textMuted }]}>Après</Text>
                        </View>
                        <View style={[styles.detailStockDelta, { backgroundColor: cfg.color + '14' }]}>
                          <Text style={[styles.detailStockDeltaText, { color: cfg.color }]}>{qtyDisplay}</Text>
                        </View>
                      </View>

                      {/* ===== INFO ROWS ===== */}
                      <View style={[styles.detailInfoCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF', borderColor: colors.borderSubtle }]}>
                        <View style={styles.detailInfoRow}>
                          <View style={[styles.detailInfoIconCircle, { backgroundColor: '#007A39' + '14' }]}>
                            <Icon name="account-outline" size={16} color="#007A39" />
                          </View>
                          <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>Technicien</Text>
                          <Text style={[styles.detailInfoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            {selectedMouvement.technicien
                              ? toAbbreviation(`${selectedMouvement.technicien.prenom || ''} ${selectedMouvement.technicien.nom || ''}`, 3, 'N/A')
                              : 'N/A'}
                          </Text>
                        </View>

                        <View style={[styles.detailInfoSep, { backgroundColor: colors.borderSubtle }]} />

                        <View style={styles.detailInfoRow}>
                          <View style={[styles.detailInfoIconCircle, { backgroundColor: '#F59E0B' + '14' }]}>
                            <Icon name="calendar-clock-outline" size={16} color="#F59E0B" />
                          </View>
                          <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>Date</Text>
                          <Text style={[styles.detailInfoValue, { color: colors.textPrimary }]}>
                            {formatDateTimeParis(selectedMouvement.dateMouvement)}
                          </Text>
                        </View>

                        {(selectedMouvement.type === 'transfert_depart' || selectedMouvement.type === 'transfert_arrivee') && (
                          <>
                            <View style={[styles.detailInfoSep, { backgroundColor: colors.borderSubtle }]} />
                            <View style={styles.detailInfoRow}>
                              <View style={[styles.detailInfoIconCircle, { backgroundColor: '#8B5CF6' + '14' }]}>
                                <Icon name="swap-horizontal" size={16} color="#8B5CF6" />
                              </View>
                              <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>Transfert</Text>
                              <Text style={[styles.detailInfoValue, { color: colors.textPrimary }]} numberOfLines={2}>
                                {selectedMouvement.site?.nom ?? '?'} → {selectedMouvement.transfertVersSite?.nom ?? '?'}
                              </Text>
                            </View>
                          </>
                        )}

                        {selectedMouvement.commentaire ? (
                          <>
                            <View style={[styles.detailInfoSep, { backgroundColor: colors.borderSubtle }]} />
                            <View style={styles.detailInfoRow}>
                              <View style={[styles.detailInfoIconCircle, { backgroundColor: '#10B981' + '14' }]}>
                                <Icon name="comment-text-outline" size={16} color="#10B981" />
                              </View>
                              <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>Note</Text>
                              <Text style={[styles.detailInfoValue, { color: colors.textPrimary }]} numberOfLines={3}>
                                {selectedMouvement.commentaire}
                              </Text>
                            </View>
                          </>
                        ) : null}
                      </View>

                      {/* ===== CLOSE BUTTON ===== */}
                      <TouchableOpacity
                        style={[styles.detailCloseBtn, { borderColor: colors.borderSubtle }]}
                        onPress={() => { Vibration.vibrate(10); setSelectedMouvement(null); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.detailCloseBtnText, { color: colors.textSecondary }]}>Fermer</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ===== HEADER =====
  headerWrap: {
    paddingHorizontal: 0,
    paddingTop: premiumSpacing.xl + 24,
  },
  header: {
    borderRadius: 20,
    borderWidth: 1,
    padding: premiumSpacing.lg,
    paddingLeft: premiumSpacing.lg + 6,
    overflow: 'hidden',
  },
  headerAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: premiumSpacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconShadow: {
    shadowColor: '#005C2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  headerIconPill: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconInner: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSummary: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniStatCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingLeft: 14,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  miniStatAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // ===== SEARCH =====
  searchWrap: {
    paddingHorizontal: 0,
    marginTop: premiumSpacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    gap: 10,
  },
  searchIconPill: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontWeight: '400',
  },
  searchClearBtn: {
    padding: 4,
  },

  // ===== FILTERS =====
  filtersSection: {
    marginTop: 2,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  filtersHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  filtersSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  filtersScroll: {
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: premiumSpacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    minHeight: 38,
    position: 'relative',
    overflow: 'hidden',
  },
  filterIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterCountBadge: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterActiveGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    opacity: 0.95,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },

  // ===== LOADER THEME APP =====
  loaderArena: {
    paddingHorizontal: 0,
    paddingTop: 8,
    gap: 10,
  },
  loaderHero: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  loaderHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  loaderHeroIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  loaderHeroSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  loaderProgressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  loaderProgressSweep: {
    ...StyleSheet.absoluteFillObject,
    width: 120,
  },
  loaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
  },
  loaderCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  loaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  loaderLine: {
    height: 12,
    borderRadius: 6,
  },

  // ===== EMPTY STATE =====
  emptyContainer: {
    paddingHorizontal: 0,
    paddingTop: premiumSpacing.xxxl,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: premiumSpacing.xxxl + 8,
    paddingHorizontal: premiumSpacing.xxl,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyIconShadow: {
    shadowColor: '#005C2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: premiumSpacing.lg,
  },
  emptyIconPill: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconInner: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: premiumSpacing.xs,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  emptyCtaWrap: {
    marginTop: premiumSpacing.lg,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#005C2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 999,
    gap: 8,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.1,
  },

  // ===== TIMELINE =====
  timelineContainer: {
    paddingHorizontal: 0,
    paddingTop: 4,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: premiumSpacing.xl,
    marginBottom: premiumSpacing.md,
    paddingHorizontal: 4,
  },
  dateAccentBar: {
    width: 3.5,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  dateHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 10,
  },
  dateLineAfter: {
    flex: 1,
    height: 1,
  },

  // ===== MOVEMENT CARD =====
  mouvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    paddingLeft: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mouvCardPressed: {
    transform: [{ scale: 0.988 }],
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  mouvAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  mouvIconShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
  mouvIconPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mouvIconInner: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mouvContent: {
    flex: 1,
  },
  mouvRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  mouvArticle: {
    flex: 1,
    marginRight: 8,
  },
  mouvArticleName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  mouvRef: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  mouvRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  mouvQtyBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 1,
  },
  mouvQty: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  mouvBottom: {
    gap: 7,
  },
  mouvTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  mouvTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    gap: 4,
  },
  mouvTypeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  mouvTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  mouvMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mouvMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  mouvTechBadge: {
    marginLeft: 3,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mouvTechBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mouvTransferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mouvTransferRouteText: {
    fontSize: 10,
    fontWeight: '500',
    maxWidth: 140,
  },
  mouvChevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  // ===== FAB =====
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 18,
    shadowColor: '#005C2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 20,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 15,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 94,
    right: 20,
    zIndex: 20,
    gap: 8,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  fabMenuIconShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  fabMenuIconPill: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuIconInner: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuLabel: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ===== DETAIL MODAL =====
  detailOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  detailHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  // Hero gradient header
  detailHero: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  detailHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailHeroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeroIconInner: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeroClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeroType: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailHeroQty: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 12,
  },
  detailHeroArticle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailHeroArticleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  detailHeroRefBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailHeroRefText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  // Stock evolution card
  detailStockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 22,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  detailStockCol: {
    alignItems: 'center',
    minWidth: 60,
  },
  detailStockNum: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  detailStockCaption: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailStockArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStockDelta: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 4,
  },
  detailStockDeltaText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  // Info card
  detailInfoCard: {
    marginHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
    marginBottom: 16,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  detailInfoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 78,
  },
  detailInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  detailInfoSep: {
    height: 1,
    marginHorizontal: 16,
  },
  // Close button
  detailCloseBtn: {
    marginHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  detailCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MouvementsListScreen;
