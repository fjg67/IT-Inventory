// ============================================
// MOUVEMENTS LIST SCREEN - Modern Redesign
// IT-Inventory Application
// ============================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { mouvementRepository } from '@/database';
import { formatTimeParis, formatRelativeDateParis, formatDateTimeParis } from '@/utils/dateUtils';
import { Mouvement } from '@/types';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';
import {
  premiumSpacing,
  premiumAnimation,
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

const STAGGER = premiumAnimation.staggerDelay;

// ==================== MAIN SCREEN ====================
export const MouvementsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const siteActif = useAppSelector(state => state.site.siteActif);
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, isDark } = useTheme();

  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuickTypeFilter>('all');
  const [showSearch, setShowSearch] = useState(false);

  // FAB
  const [fabOpen, setFabOpen] = useState(false);

  // Detail modal
  const [selectedMouvement, setSelectedMouvement] = useState<Mouvement | null>(null);

  // ==================== DATA LOADING ====================
  const loadMouvements = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const result = await mouvementRepository.findAll(siteActif?.id, 0, 50);
      setMouvements(result.data);
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [siteActif]);

  useEffect(() => {
    loadMouvements();
  }, [siteActif, loadMouvements]);

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
      total: mouvements.length,
      entrees: mouvements.filter(m => m.type === 'entree' || m.type === 'transfert_arrivee').length,
      sorties: mouvements.filter(m => m.type === 'sortie' || m.type === 'transfert_depart').length,
      ajustements: mouvements.filter(m => m.type === 'ajustement').length,
    };
  }, [mouvements]);

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
          isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : undefined,
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
        <Animated.View entering={SlideInRight.springify().damping(18)} style={styles.headerWrap}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            {/* Accent strip */}
            <LinearGradient
              colors={['#4338CA', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.headerAccent}
            />

            {/* Mesh dots */}
            <View style={[styles.meshDot, styles.meshDot1, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' }]} />
            <View style={[styles.meshDot, styles.meshDot2, { backgroundColor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)' }]} />

            <View style={styles.headerTop}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconShadow}>
                  <LinearGradient
                    colors={['#4338CA', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerIconPill}
                  >
                    <Icon name="swap-vertical" size={20} color="#FFF" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mouvements</Text>
                  <Text style={[styles.headerSummary, { color: colors.textMuted }]}>
                    {stats.total} mouvement{stats.total !== 1 ? 's' : ''} enregistré{stats.total !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate(10);
                  setShowSearch(!showSearch);
                }}
                style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)' }]}
              >
                <Icon name={showSearch ? 'close' : 'magnify'} size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Mini stats */}
            <View style={styles.miniStatsRow}>
              {[
                { label: 'Entrées', value: stats.entrees, prefix: '+', color: '#10B981', gradient: ['#10B981', '#059669'] as [string, string] },
                { label: 'Sorties', value: stats.sorties, prefix: '-', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] as [string, string] },
                { label: 'Ajustements', value: stats.ajustements, prefix: '+', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] as [string, string] },
              ].map((stat, i) => (
                <View key={i} style={[styles.miniStatCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.borderSubtle }]}>
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
        </Animated.View>

        {/* ===== SEARCH BAR (collapsible) ===== */}
        {showSearch && (
          <Animated.View entering={SlideInRight.springify().damping(20)} style={styles.searchWrap}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <View style={[styles.searchIconPill, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)' }]}>
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
        <Animated.View entering={SlideInRight.delay(STAGGER).springify().damping(18)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {([
              { key: 'all' as QuickTypeFilter, label: 'Tous', icon: 'format-list-bulleted', color: '#6366F1' },
              { key: 'entree' as QuickTypeFilter, label: 'Entrées', icon: 'arrow-up-bold', color: '#10B981' },
              { key: 'sortie' as QuickTypeFilter, label: 'Sorties', icon: 'arrow-down-bold', color: '#EF4444' },
              { key: 'ajustement' as QuickTypeFilter, label: 'Ajustements', icon: 'swap-vertical', color: '#F59E0B' },
              { key: 'transfert' as QuickTypeFilter, label: 'Transferts', icon: 'swap-horizontal', color: '#8B5CF6' },
            ]).map(f => {
              const isActive = typeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
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
                  <View style={[styles.filterDot, { backgroundColor: isActive ? f.color : colors.textMuted }]} />
                  <Text style={[styles.filterChipText, { color: isActive ? f.color : colors.textSecondary }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

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
          </ScrollView>
        </Animated.View>

        {/* ===== CONTENT ===== */}
        {isLoading ? (
          /* Skeleton */
          <View style={styles.skeletonContainer}>
            {[0, 1, 2, 3, 4].map(i => (
              <Animated.View key={i} entering={FadeIn.delay(i * 100).duration(400)}>
                <View style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <View style={[styles.skeletonDot, { backgroundColor: colors.skeleton }]} />
                  <View style={{ flex: 1 }}>
                    <View style={[styles.skeletonLine, { width: '70%', backgroundColor: colors.skeleton }]} />
                    <View style={[styles.skeletonLine, { width: '45%', marginTop: 8, backgroundColor: colors.skeleton }]} />
                    <View style={[styles.skeletonLine, { width: '55%', marginTop: 8, backgroundColor: colors.skeleton }]} />
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        ) : filteredMouvements.length === 0 ? (
          /* Empty state */
          <Animated.View entering={SlideInRight.delay(STAGGER * 2).springify().damping(18)} style={styles.emptyContainer}>
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              {/* Mesh */}
              <View style={[styles.meshDot, { width: 80, height: 80, top: -16, right: -16, backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)', borderRadius: 999 }]} />
              <View style={[styles.meshDot, { width: 50, height: 50, bottom: -10, left: -10, backgroundColor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)', borderRadius: 999 }]} />

              <View style={styles.emptyIconShadow}>
                <LinearGradient
                  colors={['#4338CA', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyIconPill}
                >
                  <Icon
                    name={hasActiveFilters ? 'filter-remove-outline' : 'chart-timeline-variant'}
                    size={32}
                    color="#FFF"
                  />
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
                <LinearGradient colors={['#4338CA', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyCtaGradient}>
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
          </Animated.View>
        ) : (
          /* Timeline list */
          <View style={styles.timelineContainer}>
            {groupedMouvements.map((group, gIdx) => (
              <View key={group.date.toISOString()}>
                {/* Date header */}
                <Animated.View
                  entering={SlideInRight.delay(STAGGER * 2 + gIdx * 60).springify().damping(18)}
                  style={styles.dateHeaderRow}
                >
                  <View style={[styles.dateAccentBar, { backgroundColor: '#6366F1' }]} />
                  <Text style={[styles.dateHeaderText, { color: colors.textSecondary }]}>{group.label}</Text>
                  <View style={[styles.dateLineAfter, { backgroundColor: colors.borderSubtle }]} />
                </Animated.View>

                {/* Mouvements */}
                {group.items.map((mouvement, mIdx) => {
                  const cfg = getTypeConfig(mouvement.type);
                  return (
                    <Animated.View
                      key={mouvement.id}
                      entering={SlideInRight.delay(STAGGER * 2 + gIdx * 60 + mIdx * 40).springify().damping(18)}
                    >
                      <TouchableOpacity
                        style={[styles.mouvCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, shadowColor: cfg.color }]}
                        activeOpacity={0.7}
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
                            <Icon name={cfg.icon} size={17} color="#FFF" />
                          </LinearGradient>
                        </View>

                        {/* Content */}
                        <View style={styles.mouvContent}>
                          <View style={styles.mouvRow1}>
                            <View style={styles.mouvArticle}>
                              <Text style={[styles.mouvArticleName, { color: colors.textPrimary }]} numberOfLines={1}>
                                {mouvement.article?.nom || 'Article inconnu'}
                              </Text>
                              <Text style={[styles.mouvRef, { color: colors.textMuted }]} numberOfLines={1}>
                                {mouvement.article?.reference || 'N/A'}
                              </Text>
                            </View>
                            <Text style={[styles.mouvQty, { color: cfg.color }]}>
                              {cfg.prefix}{Math.abs(mouvement.quantite)}
                            </Text>
                          </View>

                          <View style={styles.mouvBottom}>
                            <View style={[styles.mouvTypeBadge, { backgroundColor: isDark ? `${cfg.color}20` : `${cfg.color}10` }]}>
                              <View style={[styles.mouvTypeDot, { backgroundColor: cfg.color }]} />
                              <Text style={[styles.mouvTypeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                            <View style={styles.mouvMeta}>
                              <Text style={[styles.mouvMetaText, { color: colors.textMuted }]}>
                                {formatTime(new Date(mouvement.dateMouvement))}
                              </Text>
                              {mouvement.technicien && (
                                <Text style={[styles.mouvMetaText, { color: colors.textMuted }]}>
                                  {' · '}{mouvement.technicien.prenom?.charAt(0)}{mouvement.technicien.nom?.charAt(0)}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>

                        <Icon name="chevron-right" size={16} color={colors.borderMedium} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacer for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== FAB ===== */}
      {fabOpen && (
        <TouchableWithoutFeedback onPress={() => setFabOpen(false)}>
          <View style={styles.fabBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {fabOpen && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.fabMenu}>
          {[
            { icon: 'barcode-scan', label: 'Scanner', gradient: ['#4338CA', '#6366F1'] as [string, string], onPress: handleScan },
            {
              icon: 'arrow-up-bold', label: 'Entrée', gradient: ['#10B981', '#059669'] as [string, string],
              onPress: () => { Vibration.vibrate(10); setFabOpen(false); navigation.navigate('MouvementForm', { type: 'entree' }); },
            },
            {
              icon: 'arrow-down-bold', label: 'Sortie', gradient: ['#EF4444', '#DC2626'] as [string, string],
              onPress: () => { Vibration.vibrate(10); setFabOpen(false); navigation.navigate('MouvementForm', { type: 'sortie' }); },
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
                    <Icon name={item.icon} size={18} color="#FFF" />
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
        <LinearGradient colors={['#4338CA', '#6366F1', '#4F46E5']} style={styles.fabGradient}>
          <Icon name={fabOpen ? 'close' : 'plus'} size={26} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

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
                  return (
                    <>
                      {/* Header */}
                      <View style={styles.detailHeader}>
                        <View style={styles.detailHeaderLeft}>
                          <LinearGradient colors={['#4338CA', '#6366F1']} style={styles.detailHeaderIcon}>
                            <Icon name="file-document-outline" size={18} color="#FFF" />
                          </LinearGradient>
                          <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Détails du mouvement</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.detailClose, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                          onPress={() => {
                            Vibration.vibrate(10);
                            setSelectedMouvement(null);
                          }}
                        >
                          <Icon name="close" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>

                      {/* Type badge */}
                      <View style={[styles.detailTypeBadgeWrap, { backgroundColor: isDark ? `${cfg.color}18` : `${cfg.color}0A`, borderColor: colors.borderSubtle }]}>
                        <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.detailTypeIconPill}>
                          <Icon name={cfg.icon} size={24} color="#FFF" />
                        </LinearGradient>
                        <View>
                          <Text style={[styles.detailTypeLabel, { color: cfg.color }]}>{cfg.label}</Text>
                          <Text style={[styles.detailTypeQty, { color: colors.textMuted }]}>
                            {cfg.prefix}{Math.abs(selectedMouvement.quantite)} unités
                          </Text>
                        </View>
                      </View>

                      {/* Info rows */}
                      <View style={[styles.detailDivider, { backgroundColor: colors.borderSubtle }]} />

                      <View style={styles.detailRow}>
                        <View style={styles.detailRowIconWrap}>
                          <Icon name="package-variant-closed" size={15} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Article</Text>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{selectedMouvement.article?.nom || 'N/A'}</Text>
                          <Text style={[styles.detailValueSub, { color: colors.textMuted }]}>{selectedMouvement.article?.reference || ''}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailRowIconWrap}>
                          <Icon name="counter" size={15} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Quantité</Text>
                        <Text style={[styles.detailValue, { color: cfg.color, fontWeight: '800' }]}>
                          {cfg.prefix}{Math.abs(selectedMouvement.quantite)} unités
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailRowIconWrap}>
                          <Icon name="arrow-collapse-left" size={15} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Stock avant</Text>
                        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{selectedMouvement.stockAvant}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailRowIconWrap}>
                          <Icon name="arrow-collapse-right" size={15} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Stock après</Text>
                        <Text style={[styles.detailValue, { color: colors.textPrimary, fontWeight: '800' }]}>{selectedMouvement.stockApres}</Text>
                      </View>

                      <View style={[styles.detailDivider, { backgroundColor: colors.borderSubtle }]} />

                      <View style={styles.detailRow}>
                        <View style={styles.detailRowIconWrap}>
                          <Icon name="account-outline" size={15} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Technicien</Text>
                        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                          {selectedMouvement.technicien
                            ? `${selectedMouvement.technicien.prenom || ''} ${selectedMouvement.technicien.nom || ''}`.trim()
                            : 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailRowIconWrap}>
                          <Icon name="calendar-outline" size={15} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Date</Text>
                        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                          {formatDateTimeParis(selectedMouvement.dateMouvement)}
                        </Text>
                      </View>

                      {selectedMouvement.commentaire ? (
                        <View style={styles.detailRow}>
                          <View style={styles.detailRowIconWrap}>
                            <Icon name="comment-outline" size={15} color={colors.textMuted} />
                          </View>
                          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Commentaire</Text>
                          <Text style={[styles.detailValue, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}>
                            {selectedMouvement.commentaire}
                          </Text>
                        </View>
                      ) : null}
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
    paddingHorizontal: premiumSpacing.lg,
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
    width: 3.5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  meshDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  meshDot1: {
    width: 100,
    height: 100,
    top: -30,
    right: -30,
  },
  meshDot2: {
    width: 60,
    height: 60,
    bottom: -15,
    left: 30,
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
    shadowColor: '#4338CA',
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
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // ===== SEARCH =====
  searchWrap: {
    paddingHorizontal: premiumSpacing.lg,
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
  filtersScroll: {
    paddingHorizontal: premiumSpacing.lg,
    paddingVertical: premiumSpacing.md,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
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

  // ===== SKELETON =====
  skeletonContainer: {
    paddingHorizontal: premiumSpacing.lg,
    paddingTop: 8,
    gap: 10,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  skeletonDot: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },

  // ===== EMPTY STATE =====
  emptyContainer: {
    paddingHorizontal: premiumSpacing.lg,
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
    shadowColor: '#4338CA',
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
    shadowColor: '#4338CA',
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
    paddingHorizontal: premiumSpacing.lg,
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
  mouvAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
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
    fontWeight: '400',
    marginTop: 1,
  },
  mouvQty: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  mouvBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  mouvMetaText: {
    fontSize: 11,
    fontWeight: '400',
  },

  // ===== FAB =====
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 18,
    shadowColor: '#4338CA',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  detailHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  detailClose: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTypeBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailTypeIconPill: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTypeLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  detailTypeQty: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  detailDivider: {
    height: 1,
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 8,
  },
  detailRowIconWrap: {
    width: 24,
    alignItems: 'center',
    marginTop: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  detailValueSub: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
});

export default MouvementsListScreen;
