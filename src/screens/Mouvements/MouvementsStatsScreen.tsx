import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  SlideInLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useAppSelector } from '@/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { mouvementRepository } from '@/database';
import type { MouvementStats } from '@/database/repositories/mouvementRepository';
import type { TechnicienMouvementStat } from '@/database/repositories/mouvementRepository';
import { useTheme } from '@/theme';
import { useResponsive } from '@/utils/responsive';
import { premiumSpacing } from '@/constants/premiumTheme';
import { toAbbreviation } from '@/utils/abbreviation';

type PeriodFilter = '7' | '30' | 'all';
type SortMetric = 'total' | 'entrees' | 'sorties' | 'ajustements' | 'transferts';
type ViewMode = 'compact' | 'detailed';

type RankMap = Record<string, number>;

const periodLabel: Record<PeriodFilter, string> = {
  '7': '7 jours',
  '30': '30 jours',
  all: 'Tout',
};

const sortLabel: Record<SortMetric, string> = {
  total: 'Total',
  entrees: 'Entrées',
  sorties: 'Sorties',
  ajustements: 'Ajustements',
  transferts: 'Transferts',
};

const metricShortLabel: Record<SortMetric, string> = {
  total: 'Total',
  entrees: 'Entrées',
  sorties: 'Sorties',
  ajustements: 'Ajust.',
  transferts: 'Transf.',
};

const trendMetaByMetric: Record<
  SortMetric,
  {
    title: string;
    unit: string;
    icon: string;
    primary: string;
    pillBg: string;
    gradientLight: [string, string];
    gradientDark: [string, string];
    barMain: string;
    barSoft: string;
    miniIcon: string;
    deltaBg: string;
    deltaColor: string;
  }
> = {
  total: {
    title: 'Tendance globale',
    unit: 'mouvements',
    icon: 'chart-timeline-variant',
    primary: '#047857',
    pillBg: '#D1FAE5',
    gradientLight: ['#ECFDF5', '#F8FAFC'],
    gradientDark: ['rgba(16,185,129,0.14)', 'rgba(16,185,129,0.02)'],
    barMain: '#059669',
    barSoft: 'rgba(16,185,129,0.35)',
    miniIcon: 'speedometer',
    deltaBg: '#D1FAE5',
    deltaColor: '#166534',
  },
  entrees: {
    title: 'Tendance des entrées',
    unit: 'entrées',
    icon: 'arrow-up-bold',
    primary: '#047857',
    pillBg: '#D1FAE5',
    gradientLight: ['#ECFDF5', '#F0FDF4'],
    gradientDark: ['rgba(16,185,129,0.14)', 'rgba(16,185,129,0.02)'],
    barMain: '#10B981',
    barSoft: 'rgba(16,185,129,0.34)',
    miniIcon: 'arrow-up-bold',
    deltaBg: '#D1FAE5',
    deltaColor: '#166534',
  },
  sorties: {
    title: 'Tendance des sorties',
    unit: 'sorties',
    icon: 'arrow-down-bold',
    primary: '#B91C1C',
    pillBg: '#FEE2E2',
    gradientLight: ['#FEF2F2', '#FFF7ED'],
    gradientDark: ['rgba(239,68,68,0.16)', 'rgba(239,68,68,0.03)'],
    barMain: '#DC2626',
    barSoft: 'rgba(239,68,68,0.34)',
    miniIcon: 'arrow-down-bold',
    deltaBg: '#FEE2E2',
    deltaColor: '#B91C1C',
  },
  ajustements: {
    title: 'Tendance des ajustements',
    unit: 'ajustements',
    icon: 'tune-vertical',
    primary: '#B45309',
    pillBg: '#FEF3C7',
    gradientLight: ['#FFFBEB', '#FFF7ED'],
    gradientDark: ['rgba(245,158,11,0.16)', 'rgba(245,158,11,0.03)'],
    barMain: '#D97706',
    barSoft: 'rgba(245,158,11,0.34)',
    miniIcon: 'tune-vertical',
    deltaBg: '#FEF3C7',
    deltaColor: '#B45309',
  },
  transferts: {
    title: 'Tendance des transferts',
    unit: 'transferts',
    icon: 'swap-horizontal-bold',
    primary: '#1D4ED8',
    pillBg: '#DBEAFE',
    gradientLight: ['#EFF6FF', '#F8FAFC'],
    gradientDark: ['rgba(59,130,246,0.16)', 'rgba(59,130,246,0.03)'],
    barMain: '#2563EB',
    barSoft: 'rgba(59,130,246,0.34)',
    miniIcon: 'swap-horizontal-bold',
    deltaBg: '#DBEAFE',
    deltaColor: '#1D4ED8',
  },
};

function buildRankMap(data: TechnicienMouvementStat[], metric: SortMetric): RankMap {
  const sorted = [...data].sort((a, b) => {
    const diff = b[metric] - a[metric];
    if (diff !== 0) return diff;
    if (b.total !== a.total) return b.total - a.total;
    return a.technicienNom.localeCompare(b.technicienNom, 'fr');
  });

  const map: RankMap = {};
  let previousValue: number | null = null;
  let currentRank = 0;

  sorted.forEach((item, idx) => {
    const value = item[metric];
    if (previousValue === null || value !== previousValue) {
      currentRank = idx + 1;
      previousValue = value;
    }
    map[item.technicienId] = currentRank;
  });

  return map;
}

const getPodiumStyle = (index: number) => {
  if (index === 0) {
    return {
      stripe: ['#F59E0B', '#D97706'] as [string, string],
      medal: ['#FDE68A', '#F59E0B'] as [string, string],
      medalInner: '#FFF8DB',
      crown: ['#FCD34D', '#F59E0B'] as [string, string],
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
      icon: 'crown',
    };
  }
  if (index === 1) {
    return {
      stripe: ['#94A3B8', '#64748B'] as [string, string],
      medal: ['#E2E8F0', '#94A3B8'] as [string, string],
      medalInner: '#F8FAFC',
      crown: ['#CBD5E1', '#94A3B8'] as [string, string],
      badgeBg: '#E2E8F0',
      badgeText: '#475569',
      icon: 'medal-outline',
    };
  }
  if (index === 2) {
    return {
      stripe: ['#C08457', '#92400E'] as [string, string],
      medal: ['#E7C3A3', '#B45309'] as [string, string],
      medalInner: '#FFF4EA',
      crown: ['#D6A97D', '#B45309'] as [string, string],
      badgeBg: '#F3E8DC',
      badgeText: '#92400E',
      icon: 'medal-outline',
    };
  }

  return {
    stripe: ['#007A39', '#10B981'] as [string, string],
    medal: ['#86EFAC', '#10B981'] as [string, string],
    medalInner: '#ECFDF5',
    crown: ['#34D399', '#10B981'] as [string, string],
    badgeBg: '#DCEFE5',
    badgeText: '#007A39',
    icon: 'account-star-outline',
  };
};

export const MouvementsStatsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const { colors, isDark } = useTheme();
  const { isTablet, contentMaxWidth } = useResponsive();
  const { width: screenWidth } = useWindowDimensions();
  const hPad = Math.round(screenWidth * 0.04);

  const [period, setPeriod] = useState<PeriodFilter>('30');
  const [sortMetric, setSortMetric] = useState<SortMetric>('total');
  const viewMode: ViewMode = 'compact';
  const [rows, setRows] = useState<TechnicienMouvementStat[]>([]);
  const [movementTotals, setMovementTotals] = useState<MouvementStats>({
    total: 0,
    entrees: 0,
    sorties: 0,
    ajustements: 0,
    transferts: 0,
  });
  const [trendData, setTrendData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const shimmerX = useSharedValue(0);
  const crownFloat = useSharedValue(0);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [shimmerX]);

  useEffect(() => {
    crownFloat.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [crownFloat]);

  const podiumShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -180 + shimmerX.value * 360 }],
    opacity: 0.22,
  }));

  const crownFloatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2 - crownFloat.value * 7 },
      { rotate: `${-8 + crownFloat.value * 16}deg` },
    ],
  }));

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const days = period === 'all' ? undefined : Number(period);
      const trendDays = period === 'all' ? 30 : Number(period);

      const [data, trend, totals] = await Promise.all([
        mouvementRepository.getTechnicienStats(effectiveSiteId ?? undefined, days),
        effectiveSiteId != null
          ? mouvementRepository.getCountPerDay(effectiveSiteId, trendDays, sortMetric)
          : Promise.resolve(Array(trendDays).fill(0)),
        mouvementRepository.getStats(effectiveSiteId ?? undefined),
      ]);

      setRows(data);
      setTrendData(trend);
      setMovementTotals(totals);
    } catch (error) {
      console.warn('[MouvementsStatsScreen] loadStats error:', error);
      setRows([]);
      setTrendData([]);
      setMovementTotals({
        total: 0,
        entrees: 0,
        sorties: 0,
        ajustements: 0,
        transferts: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveSiteId, period, sortMetric]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats(true);
    }, [loadStats]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Vibration.vibrate(10);
    loadStats(true);
  }, [loadStats]);

  const totalGlobal = useMemo(() => rows.reduce((sum, r) => sum + r.total, 0), [rows]);
  const sortedRows = useMemo(() => {
    const data = [...rows];
    data.sort((a, b) => {
      const metricDiff = b[sortMetric] - a[sortMetric];
      if (metricDiff !== 0) return metricDiff;
      if (b.total !== a.total) return b.total - a.total;
      return a.technicienNom.localeCompare(b.technicienNom, 'fr');
    });
    return data;
  }, [rows, sortMetric]);

  const topThree = useMemo(() => sortedRows.slice(0, 3), [sortedRows]);
  const remainingRows = useMemo(() => sortedRows.slice(3), [sortedRows]);
  const podiumRows = useMemo(() => {
    const order = [1, 0, 2];
    return order
      .map((sourceIndex) => {
        const row = topThree[sourceIndex];
        if (!row) return null;

        const rank = sourceIndex + 1;
        const podium = getPodiumStyle(sourceIndex);

        return {
          row,
          rank,
          podium,
          metricValue: row[sortMetric],
          pedestalHeight: rank === 1 ? 92 : rank === 2 ? 72 : 62,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);
  }, [topThree, sortMetric]);

  const metricMax = useMemo(
    () => Math.max(1, ...sortedRows.map((r) => r[sortMetric])),
    [sortedRows, sortMetric],
  );
  const metricTotal = useMemo(
    () => sortedRows.reduce((sum, r) => sum + r[sortMetric], 0),
    [sortedRows, sortMetric],
  );

  const trendMax = useMemo(() => Math.max(1, ...trendData), [trendData]);
  const trendTotal = useMemo(() => trendData.reduce((sum, n) => sum + n, 0), [trendData]);
  const trendMeta = useMemo(() => trendMetaByMetric[sortMetric], [sortMetric]);
  const trendDelta = useMemo(() => {
    if (trendData.length < 2) return 0;
    const split = Math.floor(trendData.length / 2);
    const firstHalf = trendData.slice(0, split).reduce((sum, n) => sum + n, 0);
    const secondHalf = trendData.slice(split).reduce((sum, n) => sum + n, 0);
    return secondHalf - firstHalf;
  }, [trendData]);

  const rankByMetric = useMemo(() => {
    return {
      total: buildRankMap(rows, 'total'),
      entrees: buildRankMap(rows, 'entrees'),
      sorties: buildRankMap(rows, 'sorties'),
      ajustements: buildRankMap(rows, 'ajustements'),
      transferts: buildRankMap(rows, 'transferts'),
    } as Record<SortMetric, RankMap>;
  }, [rows]);

  const summaryItems = useMemo(
    () => [
      {
        key: 'active-techs',
        label: 'Techniciens actifs',
        value: rows.length,
        icon: 'account-group-outline',
        accent: ['#2563EB', '#1D4ED8'] as [string, string],
        iconBg: '#DBEAFE',
        iconColor: '#1D4ED8',
      },
      {
        key: 'entrees',
        label: 'Entrées',
        value: movementTotals.entrees,
        icon: 'arrow-up-bold',
        accent: ['#10B981', '#059669'] as [string, string],
        iconBg: '#D1FAE5',
        iconColor: '#047857',
      },
      {
        key: 'sorties',
        label: 'Sorties',
        value: movementTotals.sorties,
        icon: 'arrow-down-bold',
        accent: ['#EF4444', '#DC2626'] as [string, string],
        iconBg: '#FEE2E2',
        iconColor: '#B91C1C',
      },
      {
        key: 'ajustements',
        label: 'Ajustements',
        value: movementTotals.ajustements,
        icon: 'tune-vertical',
        accent: ['#F59E0B', '#D97706'] as [string, string],
        iconBg: '#FEF3C7',
        iconColor: '#B45309',
      },
    ],
    [rows.length, movementTotals],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View pointerEvents="none" style={styles.atmosphereLayer}>
        <LinearGradient
          colors={isDark ? ['#0F172A', 'rgba(15,23,42,0)'] : ['#DCFCE7', 'rgba(220,252,231,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.blobTop}
        />
        <LinearGradient
          colors={isDark ? ['#052E16', 'rgba(5,46,22,0)'] : ['#E0F2FE', 'rgba(224,242,254,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.blobBottom}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && contentMaxWidth
            ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const }
            : undefined,
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
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerWrap}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}>
            <LinearGradient
              colors={['#005C2B', '#007A39']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerAccent}
            />

            <View style={styles.headerGlow} />

            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => {
                  Vibration.vibrate(10);
                  navigation.goBack();
                }}
              >
                <Icon name="arrow-left" size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Stats techniciens</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Classement des mouvements par performance</Text>
              </View>

              <View style={[styles.livePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : '#D1FAE5' }]}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              {summaryItems.map((item) => (
                <View key={item.key} style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}>
                  <LinearGradient
                    colors={item.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.summaryCardAccent}
                  />
                  <View style={styles.summaryTopRow}>
                    <View style={[styles.summaryIconPill, { backgroundColor: item.iconBg }]}>
                      <Icon name={item.icon} size={15} color={item.iconColor} />
                    </View>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{item.label}</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <View style={styles.controlsWrap}>
          <View style={[styles.controlCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}>
            <View style={styles.controlHeaderRow}>
              <View style={[styles.controlHeaderIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#DCFCE7' }]}>
                <Icon name="calendar-range" size={14} color="#059669" />
              </View>
              <Text style={[styles.controlLabel, { color: colors.textMuted }]}>Période analysée</Text>
            </View>
            <View style={styles.filtersRow}>
              {(['7', '30', 'all'] as PeriodFilter[]).map((p) => {
                const active = p === period;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active
                          ? (isDark ? 'rgba(16,185,129,0.24)' : 'rgba(16,185,129,0.13)')
                          : colors.background,
                        borderColor: active ? '#059669' : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setPeriod(p);
                    }}
                  >
                    <Text style={[styles.filterChipText, { color: active ? '#047857' : colors.textSecondary }]}>{periodLabel[p]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.controlCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}>
            <View style={styles.controlHeaderRow}>
              <View style={[styles.controlHeaderIcon, { backgroundColor: isDark ? 'rgba(14,165,233,0.18)' : '#E0F2FE' }]}>
                <Icon name="tune-variant" size={14} color="#0284C7" />
              </View>
              <Text style={[styles.controlLabel, { color: colors.textMuted }]}>Trier par</Text>
            </View>
            <View style={styles.sortChipsWrap}>
            {(['total', 'entrees', 'sorties', 'ajustements', 'transferts'] as SortMetric[]).map((metric) => {
              const active = metric === sortMetric;
              return (
                <TouchableOpacity
                  key={metric}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: active
                        ? (isDark ? 'rgba(14,165,233,0.24)' : 'rgba(14,165,233,0.12)')
                        : colors.background,
                      borderColor: active ? '#0284C7' : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => {
                    Vibration.vibrate(10);
                    setSortMetric(metric);
                  }}
                >
                  <Text style={[styles.sortChipText, { color: active ? '#0369A1' : colors.textSecondary }]}>
                    {sortLabel[metric]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          </View>

        </View>

        {!loading && trendData.length > 0 && (
          <Animated.View entering={FadeInUp.delay(60).duration(300)} style={styles.trendWrap}>
            <View style={[styles.trendCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}>
              <LinearGradient
                colors={isDark ? trendMeta.gradientDark : trendMeta.gradientLight}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View pointerEvents="none" style={styles.trendGlowOne} />
              <View pointerEvents="none" style={styles.trendGlowTwo} />

              <View style={styles.trendHeader}>
                <View style={styles.trendTitleGroup}>
                  <View style={[styles.trendIconPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : trendMeta.pillBg }]}>
                    <Icon name={trendMeta.icon} size={14} color={trendMeta.primary} />
                  </View>
                  <View>
                    <Text style={[styles.trendTitle, { color: colors.textPrimary }]}>{trendMeta.title}</Text>
                    <Text style={[styles.trendSubTitle, { color: colors.textMuted }]}>
                      {periodLabel[period]} • {trendTotal} {trendMeta.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.trendRightCol}>
                  <View style={[styles.deltaPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : trendMeta.deltaBg }]}>
                    <Icon
                      name={trendDelta >= 0 ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={trendMeta.deltaColor}
                    />
                    <Text style={[styles.deltaText, { color: trendMeta.deltaColor }]}>
                      {trendDelta >= 0 ? '+' : ''}{trendDelta}
                    </Text>
                  </View>
                  <View style={[styles.trendMiniPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFFB8', borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0' }]}>
                    <Icon name={trendMeta.miniIcon} size={12} color={trendMeta.primary} />
                    <Text style={styles.trendMiniPillText}>{Math.round(trendTotal / Math.max(1, trendData.length))}/j</Text>
                  </View>
                </View>
              </View>

              <View style={styles.sparklineWrap}>
                <View style={[styles.sparklineTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#DDE7DF' }]} />
                {trendData.map((value, idx) => {
                  const barHeight = Math.max(6, Math.round((value / trendMax) * 44));
                  const isPeak = value === trendMax && trendMax > 0;
                  return (
                    <View key={`trend-${idx}`} style={styles.sparkCol}>
                      <View
                        style={[
                          styles.sparkBar,
                          {
                            height: barHeight,
                            backgroundColor: isPeak
                              ? trendMeta.barMain
                              : (isDark ? trendMeta.barSoft.replace('0.34', '0.55') : trendMeta.barSoft),
                          },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Chargement des statistiques...</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="chart-bar" size={34} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aucune donnée</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Aucun mouvement trouvé pour cette période.</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {podiumRows.length > 0 && (
              <Animated.View entering={FadeInUp.delay(80).duration(320)} style={styles.realPodiumWrap}>
                {podiumRows.map(({ row, rank, podium, metricValue, pedestalHeight }) => {
                  const isLeader = rank === 1;

                  return (
                    <View
                      key={`podium-${row.technicienId}-${rank}`}
                      style={[
                        styles.realPodiumColumn,
                        isLeader ? styles.realPodiumColumnLeader : styles.realPodiumColumnSide,
                      ]}
                    >
                      {isLeader ? (
                        <Animated.View style={[styles.podiumCrownWrap, crownFloatStyle]}>
                          <LinearGradient
                            colors={podium.crown}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.podiumCrownBadge}
                          >
                            <Icon name="crown-outline" size={20} color="#FFFFFF" />
                          </LinearGradient>
                        </Animated.View>
                      ) : null}

                      <View style={[styles.podiumMedalShadow, { shadowColor: podium.badgeText }]}> 
                        <LinearGradient
                          colors={podium.medal}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.podiumMedal, isLeader && styles.podiumMedalLeader]}
                        >
                          {isLeader ? (
                            <Animated.View pointerEvents="none" style={[styles.podiumMedalShine, podiumShimmerStyle]}>
                              <LinearGradient
                                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.72)', 'rgba(255,255,255,0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFillObject}
                              />
                            </Animated.View>
                          ) : null}
                          <View style={[styles.podiumMedalInner, { backgroundColor: podium.medalInner }]}>
                            <Icon name={podium.icon} size={isLeader ? 18 : 16} color={podium.badgeText} />
                          </View>
                          <Text style={[styles.podiumMedalRank, isLeader && styles.podiumMedalRankLeader]}>#{rank}</Text>
                        </LinearGradient>
                      </View>

                      <View
                        style={[
                          styles.podiumProfileCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
                            shadowColor: podium.badgeText,
                          },
                          isLeader && styles.podiumProfileCardLeader,
                        ]}
                      >
                        <Animated.View pointerEvents="none" style={[styles.podiumSheen, podiumShimmerStyle]}>
                          <LinearGradient
                            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                          />
                        </Animated.View>

                        <Text style={[styles.podiumAcronym, { color: colors.textPrimary }]}>
                          {toAbbreviation(row.technicienNom, 3, 'N/A')}
                        </Text>
                        <Text style={styles.podiumValue}>{metricValue}</Text>
                        <Text style={styles.podiumMetricLabel}>{metricShortLabel[sortMetric]}</Text>
                      </View>

                      <LinearGradient
                        colors={podium.stripe}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.podiumBase, { height: pedestalHeight }]}
                      >
                        <Text style={styles.podiumBaseRank}>#{rank}</Text>
                        <Text style={styles.podiumBaseLabel}>{sortLabel[sortMetric]}</Text>
                      </LinearGradient>
                    </View>
                  );
                })}
              </Animated.View>
            )}

            <View style={[styles.remainingGrid, isTablet && styles.remainingGridTablet]}>
            {remainingRows.map((row, localIndex) => {
              const index = localIndex + 3;
              const metricValue = row[sortMetric];
              const widthPct = Math.max(6, Math.round((metricValue / metricMax) * 100));
              const sharePct = metricTotal > 0 ? Math.round((metricValue / metricTotal) * 100) : 0;
              const podium = getPodiumStyle(index);
              return (
                <Animated.View
                  key={`${row.technicienId}-${index}`}
                  entering={FadeInUp.delay(100 + index * 70).duration(320)}
                  style={[
                    styles.rankCard,
                    viewMode === 'compact' && styles.rankCardCompact,
                    isTablet && styles.rankCardTablet,
                    { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium },
                  ]}
                >
                  <LinearGradient
                    colors={podium.stripe}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.rankStripe}
                  />

                  <View style={styles.rankTop}>
                    <View style={styles.nameRow}>
                      <View style={[styles.rankBadge, { backgroundColor: podium.badgeBg }]}>
                        <Text style={[styles.rankBadgeText, { color: podium.badgeText }]}>#{index + 1}</Text>
                      </View>

                      <View style={[styles.rankIconPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F8FAFC' }]}>
                        <Icon name={podium.icon} size={14} color={podium.badgeText} />
                      </View>

                      <Text style={[styles.techName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {toAbbreviation(row.technicienNom, 3, 'N/A')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.totalValue}>{metricValue}</Text>
                      {viewMode === 'detailed' && (
                        <Text style={[styles.shareValue, { color: colors.textMuted }]}>{sharePct}% {metricShortLabel[sortMetric]}</Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.barTrack,
                      viewMode === 'compact' && styles.barTrackCompact,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' },
                    ]}
                  >
                    <Animated.View
                      entering={SlideInLeft.delay(120 + localIndex * 60).duration(450).easing(Easing.out(Easing.cubic))}
                      style={{ width: `${widthPct}%`, overflow: 'hidden', borderRadius: 4 }}
                    >
                      <LinearGradient
                        colors={podium.stripe}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.barFill, { width: '100%' }]}
                      />
                    </Animated.View>
                  </View>

                  {viewMode === 'detailed' && (
                    <View style={styles.rankByTypeRow}>
                      <View style={[styles.rankByTypeChip, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.rankByTypeText, { color: '#0369A1' }]}>T#{rankByMetric.total[row.technicienId] ?? '-'}</Text>
                      </View>
                      <View style={[styles.rankByTypeChip, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.rankByTypeText, { color: '#047857' }]}>E#{rankByMetric.entrees[row.technicienId] ?? '-'}</Text>
                      </View>
                      <View style={[styles.rankByTypeChip, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={[styles.rankByTypeText, { color: '#B91C1C' }]}>S#{rankByMetric.sorties[row.technicienId] ?? '-'}</Text>
                      </View>
                      <View style={[styles.rankByTypeChip, { backgroundColor: '#FFFBEB' }]}>
                        <Text style={[styles.rankByTypeText, { color: '#B45309' }]}>A#{rankByMetric.ajustements[row.technicienId] ?? '-'}</Text>
                      </View>
                      <View style={[styles.rankByTypeChip, { backgroundColor: '#F5F3FF' }]}>
                        <Text style={[styles.rankByTypeText, { color: '#6D28D9' }]}>TR#{rankByMetric.transferts[row.technicienId] ?? '-'}</Text>
                      </View>
                    </View>
                  )}

                  {viewMode === 'detailed' && (
                    <View style={styles.breakdownRow}>
                      <View style={[styles.breakdownChip, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.breakdownText, { color: '#10B981' }]}>+{row.entrees} entrées</Text>
                      </View>
                      <View style={[styles.breakdownChip, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={[styles.breakdownText, { color: '#EF4444' }]}>-{row.sorties} sorties</Text>
                      </View>
                      <View style={[styles.breakdownChip, { backgroundColor: '#FFFBEB' }]}>
                        <Text style={[styles.breakdownText, { color: '#D97706' }]}>{row.ajustements} ajustements</Text>
                      </View>
                      <View style={[styles.breakdownChip, { backgroundColor: '#F5F3FF' }]}>
                        <Text style={[styles.breakdownText, { color: '#7C3AED' }]}>{row.transferts} transferts</Text>
                      </View>
                    </View>
                  )}
                </Animated.View>
              );
            })}
            </View>
          </View>
        )}

        <View style={{ height: 26 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  atmosphereLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  blobTop: {
    position: 'absolute',
    top: -90,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 130,
    opacity: 0.35,
  },
  blobBottom: {
    position: 'absolute',
    bottom: 120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 140,
    opacity: 0.3,
  },
  scrollContent: {
    paddingBottom: premiumSpacing.xl,
  },
  headerWrap: {
    paddingHorizontal: 0,
    paddingTop: premiumSpacing.xl + 24,
  },
  header: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
    padding: premiumSpacing.lg + 2,
  },
  headerAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 5,
  },
  headerGlow: {
    position: 'absolute',
    right: -20,
    top: -25,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 29,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.4,
  },
  summaryGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  summaryCard: {
    flexBasis: '48.5%',
    maxWidth: '48.5%',
    flexGrow: 0,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  summaryCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  summaryIconPill: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  controlsWrap: {
    paddingHorizontal: 0,
    marginTop: premiumSpacing.md,
    gap: 10,
  },
  controlCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  controlHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  controlHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 88,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sortRow: {
    marginTop: 10,
    paddingHorizontal: premiumSpacing.lg,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sortScrollContent: {
    gap: 8,
    paddingRight: 6,
  },
  sortChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 84,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  loadingWrap: {
    paddingHorizontal: 0,
    paddingVertical: premiumSpacing.xl,
  },
  trendWrap: {
    paddingHorizontal: 0,
    marginTop: premiumSpacing.md,
  },
  trendCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    overflow: 'hidden',
  },
  trendGlowOne: {
    position: 'absolute',
    top: -30,
    right: -18,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  trendGlowTwo: {
    position: 'absolute',
    bottom: -36,
    left: -20,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(14,165,233,0.08)',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendIconPill: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendRightCol: {
    alignItems: 'flex-end',
    gap: 7,
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  trendSubTitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendMiniPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sparklineWrap: {
    marginTop: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    position: 'relative',
  },
  sparklineTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    borderRadius: 999,
  },
  sparkCol: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1,
  },
  sparkBar: {
    width: '100%',
    borderRadius: 10,
    minWidth: 3,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyWrap: {
    paddingHorizontal: 0,
    marginTop: premiumSpacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  listWrap: {
    paddingHorizontal: 0,
    marginTop: premiumSpacing.md,
    gap: 10,
  },
  remainingGrid: {
    gap: 10,
  },
  remainingGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  podiumWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 4,
  },
  realPodiumWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  realPodiumColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  realPodiumColumnLeader: {
    flex: 1.08,
  },
  realPodiumColumnSide: {
    flex: 0.96,
  },
  podiumMedalShadow: {
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 7,
    marginBottom: 8,
    zIndex: 3,
  },
  podiumCrownWrap: {
    marginBottom: -4,
    zIndex: 4,
  },
  podiumCrownBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  podiumMedal: {
    minWidth: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.74)',
    overflow: 'hidden',
  },
  podiumMedalShine: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: 24,
  },
  podiumMedalInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  podiumMedalLeader: {
    minWidth: 62,
    height: 62,
    borderRadius: 31,
  },
  podiumMedalRank: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  podiumMedalRankLeader: {
    fontSize: 12,
  },
  podiumProfileCard: {
    width: '100%',
    minHeight: 108,
    borderWidth: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
    overflow: 'hidden',
  },
  podiumProfileCardLeader: {
    minHeight: 124,
  },
  podiumWrapPhone: {
    flexWrap: 'wrap',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  podiumCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  podiumCardPhone: {
    flexBasis: '48%',
    maxWidth: '48%',
    flexGrow: 0,
  },
  podiumTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  podiumSheen: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    width: 38,
  },
  podiumRank: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  podiumAcronym: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  podiumValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.6,
  },
  podiumMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: -2,
  },
  podiumBase: {
    width: '100%',
    marginTop: -2,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  podiumBaseRank: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  podiumBaseLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.92)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  rankCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10,
    paddingLeft: 14,
    overflow: 'hidden',
  },
  rankCardCompact: {
    paddingVertical: 9,
    gap: 8,
  },
  rankCardTablet: {
    width: '48.8%',
  },
  rankStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  rankTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rankBadge: {
    minWidth: 34,
    height: 25,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  rankIconPill: {
    width: 25,
    height: 25,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  techName: {
    flex: 1,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  totalValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#007A39',
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  shareValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barTrackCompact: {
    height: 9,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rankByTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rankByTypeChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankByTypeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  breakdownChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  breakdownText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default MouvementsStatsScreen;