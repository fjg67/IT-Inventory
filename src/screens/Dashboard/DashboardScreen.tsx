import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Vibration,
  View,
  Pressable,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectIsSuperviseur } from '@/store/slices/authSlice';
import { loadSiblingSites, loadSites, selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { articleRepository, mouvementRepository } from '@/database';
import { DashboardStats, MouvementType } from '@/types';
import { StockPickerSheet } from '@/components/stock-picker';
import { EmptyState, Skeleton } from '@/components/common';
import { useActiveSite } from '@/hooks/useActiveSite';
import { CA_THEME } from '@/constants/caTheme';

// Nouveaux composants CA
import { CAScreenWrapper } from '@/components/dashboard/CAScreenWrapper';
import { CAHeader } from '@/components/dashboard/CAHeader';
import { CAScanCard } from '@/components/dashboard/CAScanCard';
import { CAStatCard } from '@/components/dashboard/CAStatCard';
import { CAChartCard } from '@/components/dashboard/CAChartCard';

import { CAQuickActions } from '@/components/dashboard/CAQuickActions';
import { CAMovementItem } from '@/components/dashboard/CAMovementItem';
import { CABottomNav } from '@/components/dashboard/CABottomNav';
import { CAUrgencyCarousel } from '@/components/dashboard/CAUrgencyCarousel';
import { CAHealthRings } from '@/components/dashboard/CAHealthRings';

import { predictiveService, PredictiveAlert } from '@/services/predictiveService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SiteLike {
  id: number | string;
  nom: string;
}

interface SiteStats {
  articles: number;
  pcs: number;
}

const getMouvementType = (type: MouvementType): 'entree' | 'sortie' | 'ajustement' | 'transfert' => {
  switch (type) {
    case MouvementType.ENTREE: return 'entree';
    case MouvementType.SORTIE: return 'sortie';
    case MouvementType.AJUSTEMENT: return 'ajustement';
    case MouvementType.TRANSFERT_DEPART:
    case MouvementType.TRANSFERT_ARRIVEE: return 'transfert';
    default: return 'entree';
  }
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const technicien = useAppSelector((state) => state.auth.currentTechnicien);
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const sitesDisponibles = useAppSelector((state) => state.site.sitesDisponibles);
  const childSites = useAppSelector((state) => state.site.childSites);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const { handleSelectSite: setActiveSite } = useActiveSite();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    articlesAlerte: 0,
    mouvementsAujourdhui: 0,
    mouvementsTrend: [],
    derniersMovements: [],
  });
  const [siteStatsById, setSiteStatsById] = useState<Record<string, SiteStats>>({});
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);

  const refreshSpin = useSharedValue(0);
  const siteSheetY = useSharedValue(420);

  const siteSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: siteSheetY.value }],
  }));

  const loadStats = useCallback(async () => {
    if (!effectiveSiteId) return;
    setLoading(true);
    try {
      const [articles, alertes, mouvementsJour, trend, derniersMouvements, pAlerts] =
        await Promise.all([
          articleRepository.findAll(effectiveSiteId),
          articleRepository.countLowStock(effectiveSiteId),
          mouvementRepository.countToday(effectiveSiteId),
          mouvementRepository.getCountPerDayLast7(effectiveSiteId),
          mouvementRepository.findRecent(effectiveSiteId, 12),
          predictiveService.getPredictiveAlerts(effectiveSiteId, 30, 14),
        ]);

      setStats({
        totalArticles: articles.total,
        articlesAlerte: alertes,
        mouvementsAujourdhui: mouvementsJour,
        mouvementsTrend: trend,
        derniersMovements: derniersMouvements,
      });
      setPredictiveAlerts(pAlerts);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  }, [effectiveSiteId]);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  useEffect(() => {
    if (siteActif) dispatch(loadSiblingSites(siteActif.id));
  }, [dispatch, siteActif]);

  useEffect(() => {
    dispatch(loadSites());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Vibration.vibrate(10);
    refreshSpin.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    await loadStats();
    refreshSpin.value = 0;
    setRefreshing(false);
  }, [loadStats, refreshSpin]);

  const openSiteModal = useCallback(() => {
    Vibration.vibrate(10);
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('SiteSelection', { startupMode: true });
      return;
    }
    navigation.navigate('SiteSelection', { startupMode: true });
  }, [navigation]);

  const closeSiteModal = useCallback(() => {
    siteSheetY.value = withTiming(420, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setShowSiteModal)(false);
    });
  }, [siteSheetY]);

  const onSelectSiteCard = useCallback(
    async (siteId: number | string) => {
      Vibration.vibrate(15);
      try {
        await setActiveSite(siteId);
        setTimeout(() => closeSiteModal(), 400);
      } catch (error) {
        Alert.alert('Site', "Impossible de changer le site actif.");
      }
    },
    [closeSiteModal, setActiveSite],
  );

  const handleQuickAction = useCallback((key: string) => {
    if (key === 'transfert') {
      navigation.navigate('Mouvements', { screen: 'TransfertForm' });
      return;
    }
    navigation.navigate('Mouvements', {
      screen: 'MouvementForm',
      params: { type: key, source: 'Dashboard' },
    });
  }, [navigation]);

  const recentMovementItems = useMemo(
    () =>
      stats.derniersMovements.map((mouvement) => ({
        id: String(mouvement.id),
        articleNom: mouvement.article?.nom ?? 'Article',
        type: getMouvementType(mouvement.type),
        quantite: mouvement.quantite,
        siteNom: mouvement.site?.nom,
        createdAt: mouvement.dateMouvement,
      })),
    [stats.derniersMovements],
  );

  const sitesList = useMemo<SiteLike[]>(() => {
    return (childSites.length > 0 ? childSites : sitesDisponibles) as SiteLike[];
  }, [childSites, sitesDisponibles]);

  useEffect(() => {
    if (!showSiteModal || sitesList.length === 0) return;
    let cancelled = false;

    const fetchSiteStats = async () => {
      const results = await Promise.all(
        sitesList.map(async (site) => {
          try {
            const [articlesRes, pcRes] = await Promise.all([
              articleRepository.findAll(site.id, 0, 1),
              articleRepository.search(site.id, { searchQuery: '', stockFaible: false, typeArticle: ['PC'] }, 0, 1),
            ]);
            return [String(site.id), { articles: articlesRes.total, pcs: pcRes.total }] as const;
          } catch {
            return [String(site.id), { articles: 0, pcs: 0 }] as const;
          }
        }),
      );
      if (!cancelled) setSiteStatsById(Object.fromEntries(results));
    };

    fetchSiteStats().catch(() => {});
    return () => { cancelled = true; };
  }, [showSiteModal, sitesList]);

  const headerSubtitle = useMemo(() => {
    if (loading) return 'Mise à jour des données...';
    if (predictiveAlerts.length > 0) return `⚠️ ${predictiveAlerts.length} alerte(s) de rupture imminente.`;
    if (stats.articlesAlerte > 0) return `⚠️ ${stats.articlesAlerte} article(s) en stock faible.`;
    return '✨ Tout est opérationnel !';
  }, [loading, predictiveAlerts.length, stats.articlesAlerte]);

  return (
    <CAScreenWrapper>
      <CAHeader
        firstName={technicien?.prenom ?? 'FJG'}
        lastName={technicien?.nom ?? ''}
        siteName={siteActif?.nom}
        subtitle={headerSubtitle}
        onPressSite={openSiteModal}
        onPressSettings={() => navigation.navigate('Settings')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Scanner */}
        {!isSuperviseur && (
          <CAScanCard
            onScan={() => navigation.navigate('Scan')}
            onEntree={() => handleQuickAction('entree')}
            onSortie={() => handleQuickAction('sortie')}
            onConsultation={() => navigation.navigate('Scan')}
          />
        )}

        {/* Section Stats : Anneaux de santé & KPI */}
        {loading && stats.totalArticles === 0 ? (
          <Skeleton height={140} borderRadius={16} style={{ marginBottom: 16 }} />
        ) : (
          <View style={styles.section}>
            <View style={styles.healthCard}>
              <View style={styles.healthRingsWrapper}>
                <CAHealthRings 
                  totalArticles={stats.totalArticles} 
                  articlesAlerte={stats.articlesAlerte} 
                  size={110}
                  strokeWidth={10}
                />
              </View>
              <View style={styles.healthStats}>
                <View style={styles.healthStatItem}>
                  <Icon name="cube-outline" size={18} color={CA_THEME.green} />
                  <View>
                    <Text style={styles.healthStatValue}>{stats.totalArticles}</Text>
                    <Text style={styles.healthStatLabel}>Articles en stock</Text>
                  </View>
                </View>
                <View style={styles.healthStatDivider} />
                <View style={styles.healthStatItem}>
                  <Icon name="alert-outline" size={18} color={stats.articlesAlerte > 0 ? CA_THEME.danger : CA_THEME.textMuted} />
                  <View>
                    <Text style={[styles.healthStatValue, { color: stats.articlesAlerte > 0 ? CA_THEME.danger : CA_THEME.textPrimary }]}>
                      {stats.articlesAlerte}
                    </Text>
                    <Text style={styles.healthStatLabel}>En alerte</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        {predictiveAlerts.length > 0 && (
        <CAUrgencyCarousel 
          alerts={predictiveAlerts} 
          onPressAlert={(articleId) => navigation.navigate('Articles', { screen: 'ArticleDetail', params: { articleId } })} 
        />
        )}
        {/* Graphique Mouvements */}
        {loading && stats.totalArticles === 0 ? (
          <Skeleton height={200} borderRadius={16} style={{ marginBottom: 16 }} />
        ) : (
          <CAChartCard
            value={stats.mouvementsAujourdhui}
            label="Mouvements aujourd'hui"
            trend={stats.mouvementsTrend}
            onPress={() => navigation.navigate('Mouvements')}
          />
        )}

        {/* Actions rapides */}
        <CAQuickActions onAction={handleQuickAction} />

        {/* Derniers mouvements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>Derniers mouvements</Text>
            <Pressable onPress={() => navigation.navigate('Mouvements')}>
              <Text style={styles.seeAll}>Voir tout →</Text>
            </Pressable>
          </View>
          
          {loading && stats.totalArticles === 0 ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={60} borderRadius={12} />
              <Skeleton height={60} borderRadius={12} />
              <Skeleton height={60} borderRadius={12} />
            </View>
          ) : recentMovementItems.length > 0 ? (
            recentMovementItems.map(m => <CAMovementItem key={m.id} movement={m} />)
          ) : (
            <EmptyState
              title="Aucun mouvement récent"
              description="Il n'y a pas eu d'activité sur ce site récemment."
            />
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Navigation CA gérée par AppNavigator */}

      <Modal visible={showSiteModal} transparent animationType="none" onRequestClose={closeSiteModal}>
        <TouchableWithoutFeedback onPress={closeSiteModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.modalSheet, siteSheetStyle]}>
                <StockPickerSheet
                  sites={sitesList}
                  activeSiteId={siteActif?.id}
                  activeSiteName={siteActif?.nom}
                  statsBySiteId={siteStatsById}
                  onSelectSite={onSelectSiteCard}
                  onClose={closeSiteModal}
                  showBackButton={false}
                  showFooterCancel
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </CAScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  sectionBar: {
    width: 3, height: 16,
    backgroundColor: CA_THEME.green,
    borderRadius:    0,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 11, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color: CA_THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  seeAll: {
    fontSize: 13, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600',
    color: CA_THEME.green,
  },
  healthCard: {
    backgroundColor: CA_THEME.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: CA_THEME.borderGray,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthRingsWrapper: {
    marginRight: 20,
  },
  healthStats: {
    flex: 1,
  },
  healthStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthStatValue: {
    fontSize: 20,
    fontFamily: CA_THEME.fontFamilyBold,
    color: CA_THEME.textPrimary,
  },
  healthStatLabel: {
    fontSize: 12,
    fontFamily: CA_THEME.fontFamilyMedium,
    color: CA_THEME.textSecondary,
  },
  healthStatDivider: {
    height: 1,
    backgroundColor: CA_THEME.borderGray,
    marginVertical: 12,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
});

export default DashboardScreen;
