// ============================================
// MOUVEMENTS LIST SCREEN - Premium Design
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
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { mouvementRepository } from '@/database';
import { formatTimeParis, formatRelativeDateParis, formatDateTimeParis } from '@/utils/dateUtils';
import { Mouvement, MouvementType } from '@/types';
import { useResponsive } from '@/utils/responsive';

// Dimensions removed — responsive utilities used instead

// ==================== HELPERS ====================
const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string; label: string; prefix: string }> = {
  entree: { icon: 'arrow-up-bold', color: '#10B981', bgColor: 'rgba(16,185,129,0.1)', label: 'Entrée', prefix: '+' },
  sortie: { icon: 'arrow-down-bold', color: '#EF4444', bgColor: 'rgba(239,68,68,0.1)', label: 'Sortie', prefix: '-' },
  ajustement: { icon: 'swap-vertical', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)', label: 'Ajustement', prefix: '' },
  transfert_depart: { icon: 'arrow-right-bold', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.1)', label: 'Transfert ↗', prefix: '-' },
  transfert_arrivee: { icon: 'arrow-left-bold', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.1)', label: 'Transfert ↙', prefix: '+' },
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

// ==================== MAIN SCREEN ====================
export const MouvementsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const siteActif = useAppSelector(state => state.site.siteActif);
  const { isTablet, contentMaxWidth } = useResponsive();

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
      const result = await mouvementRepository.findAll(siteActif?.id, 0, 200);
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

  // Recharger la liste à chaque retour sur l'écran (données toujours à jour)
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
    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'transfert') {
        data = data.filter(m => m.type === 'transfert_depart' || m.type === 'transfert_arrivee');
      } else {
        data = data.filter(m => m.type === typeFilter);
      }
    }
    // Search
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : undefined]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* ===== HEADER PREMIUM ===== */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Mouvements</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => {
                    Vibration.vibrate(10);
                    setShowSearch(!showSearch);
                  }}
                  style={styles.headerBtn}
                >
                  <Icon name={showSearch ? 'close' : 'magnify'} size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.headerSummary}>
              {stats.total} mouvement{stats.total !== 1 ? 's' : ''} enregistré{stats.total !== 1 ? 's' : ''}
            </Text>

            {/* Mini stats */}
            <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.miniStatsRow}>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatValue}>+{stats.entrees}</Text>
                <Text style={styles.miniStatLabel}>Entrées</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatValue}>-{stats.sorties}</Text>
                <Text style={styles.miniStatLabel}>Sorties</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatValue}>{stats.ajustements}</Text>
                <Text style={styles.miniStatLabel}>Ajustements</Text>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* ===== SEARCH BAR (collapsible) ===== */}
        {showSearch && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.searchContainer}>
            <Icon name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher article, technicien..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* ===== QUICK FILTERS ===== */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {([
              { key: 'all' as QuickTypeFilter, label: 'Tous', icon: 'format-list-bulleted' },
              { key: 'entree' as QuickTypeFilter, label: 'Entrées', icon: 'arrow-up-bold' },
              { key: 'sortie' as QuickTypeFilter, label: 'Sorties', icon: 'arrow-down-bold' },
              { key: 'ajustement' as QuickTypeFilter, label: 'Ajustements', icon: 'swap-vertical' },
              { key: 'transfert' as QuickTypeFilter, label: 'Transferts', icon: 'swap-horizontal' },
            ]).map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, typeFilter === f.key && styles.filterChipActive]}
                onPress={() => {
                  Vibration.vibrate(10);
                  setTypeFilter(f.key);
                }}
                activeOpacity={0.7}
              >
                <Icon
                  name={f.icon}
                  size={16}
                  color={typeFilter === f.key ? '#2563EB' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.filterChipText, typeFilter === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}

            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  Vibration.vibrate(10);
                  setTypeFilter('all');
                  setSearchQuery('');
                }}
              >
                <Icon name="close" size={14} color="#2563EB" />
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
              <Animated.View key={i} entering={FadeIn.delay(i * 100).duration(400)} style={styles.skeletonCard}>
                <View style={styles.skeletonDot} />
                <View style={styles.skeletonBody}>
                  <View style={[styles.skeletonLine, { width: '70%' }]} />
                  <View style={[styles.skeletonLine, { width: '45%', marginTop: 8 }]} />
                  <View style={[styles.skeletonLine, { width: '55%', marginTop: 8 }]} />
                </View>
              </Animated.View>
            ))}
          </View>
        ) : filteredMouvements.length === 0 ? (
          /* Empty State */
          <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon
                name={hasActiveFilters ? 'filter-remove-outline' : 'chart-timeline-variant'}
                size={56}
                color="rgba(37,99,235,0.4)"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {hasActiveFilters ? 'Aucun résultat' : 'Aucun mouvement'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {hasActiveFilters
                ? 'Aucun mouvement ne correspond à vos filtres'
                : 'Les mouvements de stock apparaîtront ici'}
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
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
            >
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.emptyCtaGradient}>
                <Icon
                  name={hasActiveFilters ? 'filter-remove' : 'plus'}
                  size={18}
                  color="#FFF"
                />
                <Text style={styles.emptyCtaText}>
                  {hasActiveFilters ? 'Réinitialiser les filtres' : 'Nouveau mouvement'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Timeline list */
          <View style={styles.timelineContainer}>
            {groupedMouvements.map((group, gIdx) => (
              <View key={group.date.toISOString()}>
                {/* Date header */}
                <Animated.View
                  entering={FadeInUp.delay(gIdx * 80).duration(400)}
                  style={styles.dateHeaderRow}
                >
                  <View style={styles.dateLineBefore} />
                  <Text style={styles.dateHeaderText}>{group.label}</Text>
                  <View style={styles.dateLineAfter} />
                </Animated.View>

                {/* Mouvements */}
                {group.items.map((mouvement, mIdx) => {
                  const cfg = getTypeConfig(mouvement.type);
                  return (
                    <Animated.View
                      key={mouvement.id}
                      entering={FadeInUp.delay(gIdx * 80 + mIdx * 50).duration(400)}
                    >
                      <TouchableOpacity
                        style={styles.mouvCard}
                        activeOpacity={0.7}
                        onPress={() => {
                          Vibration.vibrate(10);
                          setSelectedMouvement(mouvement);
                        }}
                      >
                        {/* Timeline elements */}
                        <View style={styles.timelineCol}>
                          <View style={[styles.timelineBar, { backgroundColor: cfg.color + '30' }]} />
                          <View style={[styles.timelineDot, { backgroundColor: cfg.color }]} />
                        </View>

                        {/* Card body */}
                        <View style={[styles.mouvCardBody, { borderLeftColor: cfg.color }]}>
                          {/* Row 1: type badge + article ref/name */}
                          <View style={styles.mouvRow1}>
                            <View style={[styles.typeBadge, { backgroundColor: cfg.bgColor }]}>
                              <Icon name={cfg.icon} size={18} color={cfg.color} />
                            </View>
                            <View style={styles.mouvArticle}>
                              <Text style={styles.mouvRef} numberOfLines={1}>
                                {mouvement.article?.reference || 'N/A'}
                              </Text>
                              <Text style={styles.mouvArticleName} numberOfLines={1}>
                                {mouvement.article?.nom || 'Article inconnu'}
                              </Text>
                            </View>
                          </View>

                          {/* Row 2: quantité */}
                          <Text style={[styles.mouvQty, { color: cfg.color }]}>
                            {cfg.prefix}{Math.abs(mouvement.quantite)} unités
                          </Text>

                          {/* Row 3: metadata */}
                          <View style={styles.mouvMeta}>
                            <Icon name="clock-outline" size={12} color="#9CA3AF" />
                            <Text style={styles.mouvMetaText}>
                              {formatTime(new Date(mouvement.dateMouvement))}
                            </Text>
                            <Text style={styles.mouvMetaSep}>•</Text>
                            <Icon name="account-outline" size={12} color="#9CA3AF" />
                            <Text style={styles.mouvMetaText}>
                              {`${mouvement.technicien?.nom?.charAt(0) || ''}${mouvement.technicien?.prenom?.charAt(0) || ''}`.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <Icon name="chevron-right" size={18} color="#D1D5DB" />
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
          <Animated.View entering={FadeInUp.delay(0).duration(250)}>
            <TouchableOpacity style={styles.fabMenuItem} activeOpacity={0.8} onPress={handleScan}>
              <View style={[styles.fabMenuIcon, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
                <Icon name="barcode-scan" size={20} color="#2563EB" />
              </View>
              <Text style={styles.fabMenuLabel}>Scanner</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(60).duration(250)}>
            <TouchableOpacity
              style={styles.fabMenuItem}
              activeOpacity={0.8}
              onPress={() => {
                Vibration.vibrate(10);
                setFabOpen(false);
                navigation.navigate('MouvementForm', { type: 'entree' });
              }}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <Icon name="arrow-up-bold" size={20} color="#10B981" />
              </View>
              <Text style={styles.fabMenuLabel}>Entrée</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(120).duration(250)}>
            <TouchableOpacity
              style={styles.fabMenuItem}
              activeOpacity={0.8}
              onPress={() => {
                Vibration.vibrate(10);
                setFabOpen(false);
                navigation.navigate('MouvementForm', { type: 'sortie' });
              }}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Icon name="arrow-down-bold" size={20} color="#EF4444" />
              </View>
              <Text style={styles.fabMenuLabel}>Sortie</Text>
            </TouchableOpacity>
          </Animated.View>
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
        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.fabGradient}>
          <Icon name={fabOpen ? 'close' : 'plus'} size={28} color="#FFF" />
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
          <View style={styles.detailOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.detailSheet}>
                <View style={styles.detailHandle} />

                {selectedMouvement && (() => {
                  const cfg = getTypeConfig(selectedMouvement.type);
                  return (
                    <>
                      {/* Header */}
                      <View style={styles.detailHeader}>
                        <Text style={styles.detailTitle}>Détails du mouvement</Text>
                        <TouchableOpacity
                          style={styles.detailClose}
                          onPress={() => {
                            Vibration.vibrate(10);
                            setSelectedMouvement(null);
                          }}
                        >
                          <Icon name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>

                      {/* Type badge */}
                      <View style={styles.detailTypeBadge}>
                        <View style={[styles.detailTypeIcon, { backgroundColor: cfg.bgColor }]}>
                          <Icon name={cfg.icon} size={28} color={cfg.color} />
                        </View>
                        <Text style={[styles.detailTypeLabel, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>

                      {/* Info rows */}
                      <View style={styles.detailDivider} />

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Article</Text>
                        <View>
                          <Text style={styles.detailValue}>{selectedMouvement.article?.nom || 'N/A'}</Text>
                          <Text style={styles.detailValueSub}>{selectedMouvement.article?.reference || ''}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantité</Text>
                        <Text style={[styles.detailValue, { color: cfg.color, fontWeight: '700' }]}>
                          {cfg.prefix}{Math.abs(selectedMouvement.quantite)} unités
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Stock avant</Text>
                        <Text style={styles.detailValue}>{selectedMouvement.stockAvant}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Stock après</Text>
                        <Text style={[styles.detailValue, { fontWeight: '700' }]}>{selectedMouvement.stockApres}</Text>
                      </View>

                      <View style={styles.detailDivider} />

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Technicien</Text>
                        <Text style={styles.detailValue}>
                          {`${selectedMouvement.technicien?.nom?.charAt(0) || ''}${selectedMouvement.technicien?.prenom?.charAt(0) || ''}`.toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>
                          {formatDateTimeParis(selectedMouvement.dateMouvement)}
                        </Text>
                      </View>

                      {selectedMouvement.commentaire ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Commentaire</Text>
                          <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ===== HEADER =====
  header: {
    paddingTop: 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSummary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  miniStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // ===== SEARCH =====
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },

  // ===== FILTERS =====
  filtersScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderColor: 'rgba(37,99,235,0.3)',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#2563EB',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  // ===== SKELETON =====
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 8,
  },
  skeletonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginRight: 14,
    marginTop: 8,
  },
  skeletonBody: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },

  // ===== EMPTY STATE =====
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37,99,235,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.1)',
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCta: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },

  // ===== TIMELINE =====
  timelineContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateLineBefore: {
    height: 1,
    width: 16,
    backgroundColor: '#D1D5DB',
  },
  dateHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginHorizontal: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateLineAfter: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // ===== MOVEMENT CARD =====
  mouvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 8,
  },
  timelineCol: {
    width: 28,
    alignItems: 'center',
    marginRight: 4,
  },
  timelineBar: {
    position: 'absolute',
    width: 3,
    top: 0,
    bottom: 0,
    borderRadius: 1.5,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: '#FFF',
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  mouvCardBody: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  mouvRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mouvArticle: {
    flex: 1,
  },
  mouvRef: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  mouvArticleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  mouvQty: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  mouvMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mouvMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mouvMetaSep: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 2,
  },

  // ===== FAB =====
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 20,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    bottom: 96,
    right: 20,
    zIndex: 20,
    gap: 10,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    gap: 10,
  },
  fabMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  // ===== DETAIL MODAL =====
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  detailHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
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
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  detailClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailTypeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTypeLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
  },
  detailValueSub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 2,
  },
});

export default MouvementsListScreen;
