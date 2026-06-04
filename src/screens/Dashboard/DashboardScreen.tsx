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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  Easing,
  FadeIn,
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
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { StockPickerSheet } from '@/components/stock-picker';
import { useActiveSite } from '@/hooks/useActiveSite';
import {
  HeaderSection,
  MovementsSection,
  QuickActionsGrid,
  ScannerHeroCard,
  StatsGrid,
} from '@/components/home';

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
    case MouvementType.ENTREE:
      return 'entree';
    case MouvementType.SORTIE:
      return 'sortie';
    case MouvementType.AJUSTEMENT:
      return 'ajustement';
    case MouvementType.TRANSFERT_DEPART:
    case MouvementType.TRANSFERT_ARRIVEE:
      return 'transfert';
    default:
      return 'entree';
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
  const [activeMode, setActiveMode] = useState<'entree' | 'sortie' | 'consultation'>('consultation');
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    articlesAlerte: 0,
    mouvementsAujourdhui: 0,
    derniersMovements: [],
  });
  const [mouvementsParJour, setMouvementsParJour] = useState<number[]>([]);
  const [siteStatsById, setSiteStatsById] = useState<Record<string, SiteStats>>({});

  const refreshSpin = useSharedValue(0);
  const siteSheetY = useSharedValue(420);

  const refreshIconStyle = useAnimatedStyle(() => {
    const rotate = interpolate(refreshSpin.value, [0, 1], [0, 360]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const siteSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: siteSheetY.value }],
  }));

  const loadStats = useCallback(async () => {
    if (!effectiveSiteId) {
      return;
    }

    setLoading(true);
    try {
      const [articles, alertes, mouvementsJour, derniersMouvements, countsPerDay] =
        await Promise.all([
          articleRepository.findAll(effectiveSiteId),
          articleRepository.countLowStock(effectiveSiteId),
          mouvementRepository.countToday(effectiveSiteId),
          mouvementRepository.findRecent(effectiveSiteId, 12),
          mouvementRepository.getCountPerDayLast7(effectiveSiteId),
        ]);

      setMouvementsParJour(countsPerDay.length >= 2 ? countsPerDay : [0, 0, 0, 0, 0, 0, 0]);
      setStats({
        totalArticles: articles.total,
        articlesAlerte: alertes,
        mouvementsAujourdhui: mouvementsJour,
        derniersMovements: derniersMouvements,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  }, [effectiveSiteId]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  useEffect(() => {
    if (siteActif) {
      dispatch(loadSiblingSites(siteActif.id));
    }
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
      if (finished) {
        runOnJS(setShowSiteModal)(false);
      }
    });
  }, [siteSheetY]);

  const onSelectSiteCard = useCallback(
    async (siteId: number | string) => {
      Vibration.vibrate(15);
      try {
        await setActiveSite(siteId);
        setTimeout(() => {
          closeSiteModal();
        }, 400);
      } catch (error) {
        Alert.alert('Site', "Impossible de changer le site actif.");
        console.warn('[Dashboard] selectSite error:', error);
      }
    },
    [closeSiteModal, setActiveSite],
  );

  const handleScanPress = useCallback(() => {
    if (activeMode === 'consultation') {
      navigation.navigate('Scan');
      return;
    }

    if (activeMode === 'entree' || activeMode === 'sortie') {
      navigation.navigate('Mouvements', {
        screen: 'MouvementForm',
        params: { type: activeMode, source: 'Dashboard' },
      });
      return;
    }

    navigation.navigate('Scan');
  }, [activeMode, navigation]);

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

      if (!cancelled) {
        setSiteStatsById(Object.fromEntries(results));
      }
    };

    fetchSiteStats().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showSiteModal, sitesList]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backgroundGlowTop} />
      <View pointerEvents="none" style={styles.backgroundGlowBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
          />
        }
      >
        <HeaderSection
          firstName={technicien?.prenom ?? 'FJG'}
          lastName={technicien?.nom ?? ''}
          siteName={siteActif?.nom}
          onPressSite={openSiteModal}
        />

        {refreshing ? (
          <Animated.View entering={FadeIn.duration(180)} style={styles.refreshWrap}>
            <Animated.View style={refreshIconStyle}>
              <Icon name="refresh" size={16} color={OBSIDIAN_COLORS.green_light} />
            </Animated.View>
            <Text style={styles.refreshText}>Mise a jour...</Text>
          </Animated.View>
        ) : null}

        {!isSuperviseur ? (
          <ScannerHeroCard
            activeMode={activeMode}
            onSelectMode={setActiveMode}
            onScanPress={handleScanPress}
          />
        ) : null}

        <StatsGrid
          totalArticles={stats.totalArticles}
          articlesAlerte={stats.articlesAlerte}
          mouvementsAujourdhui={stats.mouvementsAujourdhui}
          mouvementsParJour={mouvementsParJour}
          onPressArticles={() => navigation.navigate('Articles')}
          onPressAlertes={() =>
            navigation.navigate('Articles', {
              screen: 'ArticlesList',
              params: { filter: 'lowStock' },
            })
          }
          onPressMouvements={() => navigation.navigate('Mouvements')}
        />

        <QuickActionsGrid
          isSuperviseur={isSuperviseur}
          onEntree={() =>
            navigation.navigate('Mouvements', {
              screen: 'MouvementForm',
              params: { type: 'entree', source: 'Dashboard' },
            })
          }
          onSortie={() =>
            navigation.navigate('Mouvements', {
              screen: 'MouvementForm',
              params: { type: 'sortie', source: 'Dashboard' },
            })
          }
          onAjustement={() =>
            navigation.navigate('Mouvements', {
              screen: 'MouvementForm',
              params: { type: 'ajustement', source: 'Dashboard' },
            })
          }
          onTransfert={() => navigation.navigate('Mouvements', { screen: 'TransfertForm' })}
        />

        {loading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingTitle}>Chargement des mouvements...</Text>
          </View>
        ) : (
          <MovementsSection
            movements={recentMovementItems}
            onSeeAll={() => navigation.navigate('Mouvements')}
          />
        )}
      </ScrollView>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: OBSIDIAN_COLORS.bg_primary,
    flex: 1,
  },
  backgroundGlowTop: {
    backgroundColor: OBSIDIAN_COLORS.green_glow,
    borderRadius: 200,
    height: 240,
    left: -80,
    position: 'absolute',
    top: -120,
    width: 240,
  },
  backgroundGlowBottom: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 220,
    bottom: -160,
    height: 300,
    position: 'absolute',
    right: -100,
    width: 300,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  refreshWrap: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 24,
    padding: 18,
  },
  loadingTitle: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '600',
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
