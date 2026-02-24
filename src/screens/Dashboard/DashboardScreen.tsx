// ============================================
// DASHBOARD SCREEN - Premium Redesign
// GestStock IT - Interface Premium
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Vibration,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectSite, loadSites } from '@/store/slices/siteSlice';
import { articleRepository, mouvementRepository } from '@/database';
import { DashboardStats, MouvementType } from '@/types';
import {
  premiumColors,
  premiumSpacing,
  premiumAnimation,
} from '@/constants/premiumTheme';
import { useResponsive } from '@/utils/responsive';

// Composants premium
import PremiumHeader from './components/PremiumHeader';
import ScanButtonXXL from './components/ScanButtonXXL';
import GlassStatCard from './components/GlassStatCard';
import QuickActionButton from './components/QuickActionButton';
import SectionHeader from './components/SectionHeader';
import PremiumMouvementCard from './components/PremiumMouvementCard';
import PremiumEmptyState from './components/PremiumEmptyState';
import SkeletonLoader from './components/SkeletonLoader';

const STAGGER = premiumAnimation.staggerDelay;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth, spacing } = useResponsive();

  // Store
  const technicien = useAppSelector((state) => state.auth.currentTechnicien);
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const { isConnected, supabaseReachable, syncStatus, pendingCount } = useAppSelector(
    (state) => state.network,
  );

  const sitesDisponibles = useAppSelector((state) => state.site.sitesDisponibles);
  const [showSiteModal, setShowSiteModal] = useState(false);

  // State local
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    articlesAlerte: 0,
    mouvementsAujourdhui: 0,
    derniersMovements: [],
  });
  /** Données pour les courbes : mouvements par jour (7 derniers jours) */
  const [mouvementsParJour, setMouvementsParJour] = useState<number[]>([]);

  // Chargement des statistiques et des données pour les sparklines
  const loadStats = useCallback(async () => {
    if (!siteActif) return;

    setLoading(true);
    try {
      const [articles, alertes, mouvementsJour, derniersMouvements, countsPerDay] =
        await Promise.all([
          articleRepository.findAll(siteActif.id),
          articleRepository.countLowStock(siteActif.id),
          mouvementRepository.countToday(siteActif.id),
          mouvementRepository.findRecent(siteActif.id, 5),
          mouvementRepository.getCountPerDayLast7(siteActif.id),
        ]);

      setMouvementsParJour(countsPerDay.length >= 2 ? countsPerDay : [0, 0]);
      setStats({
        totalArticles: articles.total,
        articlesAlerte: alertes,
        mouvementsAujourdhui: mouvementsJour,
        derniersMovements: derniersMouvements,
      });

      // Email alerte stock géré par Supabase Cron Job (daily-stock-alert)
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  }, [siteActif]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  useEffect(() => {
    dispatch(loadSites());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Vibration.vibrate(10);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  // Navigation handlers
  const handleScan = useCallback(() => {
    navigation.navigate('Scan');
  }, [navigation]);

  const handleChangeSite = useCallback(() => {
    Vibration.vibrate(10);
    setShowSiteModal(true);
  }, []);

  const handleSelectSite = useCallback((siteId: number) => {
    Vibration.vibrate(15);
    dispatch(selectSite(siteId));
    setShowSiteModal(false);
  }, [dispatch]);

  // Adapter le type MouvementType en type simplifié pour la card
  const getMouvementCardType = (type: MouvementType) => {
    switch (type) {
      case MouvementType.ENTREE:
        return 'entree' as const;
      case MouvementType.SORTIE:
        return 'sortie' as const;
      case MouvementType.AJUSTEMENT:
        return 'ajustement' as const;
      case MouvementType.TRANSFERT_DEPART:
      case MouvementType.TRANSFERT_ARRIVEE:
        return 'transfert' as const;
      default:
        return 'entree' as const;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: spacing.lg,
            paddingTop: spacing.xl,
          },
          contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : {},
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={premiumColors.primary.base}
            colors={[premiumColors.primary.base]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER PREMIUM ===== */}
        <PremiumHeader
          user={{
            firstName: technicien?.prenom ?? 'Utilisateur',
            lastName: technicien?.nom ?? '',
          }}
          site={siteActif ? { name: siteActif.nom } : null}
          syncStatus={syncStatus}
          syncPendingCount={pendingCount}
          isConnected={isConnected}
          supabaseReachable={supabaseReachable}
          onSiteChange={handleChangeSite}
        />

        {/* ===== BOUTON SCAN XXL ===== */}
        <ScanButtonXXL onPress={handleScan} />

        {/* ===== CARDS STATISTIQUES ===== */}
        <Animated.View
          entering={FadeInUp.delay(STAGGER * 2).duration(500)}
        >
          <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
            <GlassStatCard
              icon="package-variant-closed"
              iconGradient={premiumColors.primary.gradient}
              value={stats.totalArticles}
              label="Articles en stock"
              sparklineData={[
                Math.max(0, stats.totalArticles - 3),
                Math.max(0, stats.totalArticles - 2),
                Math.max(0, stats.totalArticles - 1),
                stats.totalArticles,
                stats.totalArticles,
                Math.max(0, stats.totalArticles - 1),
                stats.totalArticles,
              ]}
              sparklineColor={premiumColors.primary.base}
              onPress={() => navigation.navigate('Articles')}
            />
            <GlassStatCard
              icon="alert-circle-outline"
              iconGradient={
                stats.articlesAlerte > 0
                  ? premiumColors.warning.gradient
                  : premiumColors.success.gradient
              }
              value={stats.articlesAlerte}
              label="Alertes stock"
              trend={stats.articlesAlerte > 0 ? 'down' : 'neutral'}
              trendValue={stats.articlesAlerte > 0 ? `${stats.articlesAlerte}` : undefined}
              sparklineData={[
                0,
                Math.max(0, stats.articlesAlerte - 1),
                0,
                stats.articlesAlerte,
                Math.max(0, stats.articlesAlerte - 1),
                stats.articlesAlerte,
                stats.articlesAlerte,
              ]}
              sparklineColor={
                stats.articlesAlerte > 0
                  ? premiumColors.warning.base
                  : premiumColors.success.base
              }
              onPress={() =>
                navigation.navigate('Articles', {
                  screen: 'ArticlesList',
                  params: { filter: 'lowStock' },
                })
              }
            />
          </View>

          <GlassStatCard
            icon="swap-vertical"
            iconGradient={premiumColors.info.gradient}
            value={stats.mouvementsAujourdhui}
            label="Mouvements aujourd'hui"
            sparklineData={mouvementsParJour}
            sparklineColor={premiumColors.info.base}
            showDayLabels
            fullWidth
            onPress={() => navigation.navigate('Mouvements')}
          />
        </Animated.View>

        {/* ===== ACTIONS RAPIDES ===== */}
        <Animated.View
          entering={FadeInUp.delay(STAGGER * 3).duration(500)}
          style={styles.actionsSection}
        >
          <SectionHeader title="Actions rapides" />
          <View style={[styles.actionsRow, isTablet && styles.actionsRowTablet]}>
            <QuickActionButton
              icon="plus"
              iconGradient={premiumColors.success.gradient}
              label="Entrée"
              onPress={() =>
                navigation.navigate('Mouvements', {
                  screen: 'MouvementForm',
                  params: { type: 'entree' },
                })
              }
            />
            <QuickActionButton
              icon="minus"
              iconGradient={premiumColors.error.gradient}
              label="Sortie"
              onPress={() =>
                navigation.navigate('Mouvements', {
                  screen: 'MouvementForm',
                  params: { type: 'sortie' },
                })
              }
            />
            <QuickActionButton
              icon="format-list-bulleted"
              iconGradient={premiumColors.primary.gradient}
              label="Articles"
              onPress={() => navigation.navigate('Articles')}
            />
            <QuickActionButton
              icon="cog-outline"
              iconGradient={['#94A3B8', '#64748B']}
              label="Réglages"
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        </Animated.View>

        {/* ===== DERNIERS MOUVEMENTS ===== */}
        <Animated.View
          entering={FadeInUp.delay(STAGGER * 4).duration(500)}
          style={styles.mouvementsSection}
        >
          <SectionHeader
            title="Derniers mouvements"
            actionLabel="Voir tout"
            onActionPress={() => navigation.navigate('Mouvements')}
          />

          {loading ? (
            <SkeletonLoader count={3} />
          ) : stats.derniersMovements.length > 0 ? (
            <View style={isTablet ? styles.mouvementsGridTablet : undefined}>
              {stats.derniersMovements.map((mouvement, index) => (
                <Animated.View
                  key={mouvement.id}
                  entering={FadeInUp.delay(
                    STAGGER * 4 + index * STAGGER,
                  ).duration(400)}
                  style={isTablet ? styles.mouvementCardTablet : undefined}
                >
                  <PremiumMouvementCard
                    mouvement={{
                      id: String(mouvement.id),
                      articleNom: mouvement.article?.nom ?? 'Article',
                      type: getMouvementCardType(mouvement.type),
                      quantite: mouvement.quantite,
                      siteNom: mouvement.site?.nom,
                      createdAt: mouvement.dateMouvement,
                      technicienNom: mouvement.technicien
                        ? `${mouvement.technicien.prenom} ${mouvement.technicien.nom}`
                        : undefined,
                    }}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <PremiumEmptyState
              icon="package-variant"
              title="Aucun mouvement récent"
              subtitle="Scannez un article pour enregistrer votre premier mouvement de stock"
              actionLabel="Scanner maintenant"
              onActionPress={handleScan}
            />
          )}
        </Animated.View>

        {/* Espacement bas pour la tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ===== MODAL SÉLECTION SITE ===== */}
      <Modal visible={showSiteModal} transparent animationType="slide" onRequestClose={() => setShowSiteModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSiteModal(false)}>
          <View style={styles.siteModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.siteModalSheet, isTablet && styles.siteModalSheetTablet]}>
                <View style={styles.siteModalHandle} />
                <Text style={styles.siteModalTitle}>Changer de site</Text>
                <Text style={styles.siteModalSubtitle}>
                  Sélectionnez le site de stockage
                </Text>

                {sitesDisponibles.map((site) => {
                  const isActive = siteActif?.id === site.id;
                  const siteIcons: Record<string, { icon: string; colors: string[] }> = {
                    'Stock 5ième': { icon: 'office-building', colors: ['#3B82F6', '#2563EB'] },
                    'Stock 8ième': { icon: 'office-building-marker', colors: ['#8B5CF6', '#6366F1'] },
                    'Stock Epinal': { icon: 'warehouse', colors: ['#10B981', '#059669'] },
                  };
                  const cfg = siteIcons[site.nom] || { icon: 'map-marker', colors: ['#6B7280', '#4B5563'] };

                  return (
                    <TouchableOpacity
                      key={site.id}
                      style={[styles.siteCard, isActive && styles.siteCardActive]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectSite(site.id as number)}
                    >
                      <LinearGradient
                        colors={cfg.colors}
                        style={styles.siteIcon}
                      >
                        <Icon name={cfg.icon} size={22} color="#FFF" />
                      </LinearGradient>
                      <View style={styles.siteInfo}>
                        <Text style={[styles.siteName, isActive && styles.siteNameActive]}>
                          {site.nom}
                        </Text>
                      </View>
                      {isActive && (
                        <Icon name="check-circle" size={22} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumColors.background,
  },
  scrollContent: {
    padding: premiumSpacing.lg,
    paddingTop: premiumSpacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: premiumSpacing.md,
    marginBottom: 0,
  },
  statsGridTablet: {
    gap: premiumSpacing.lg,
  },
  actionsSection: {
    marginTop: premiumSpacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: premiumSpacing.sm,
  },
  actionsRowTablet: {
    gap: premiumSpacing.lg,
    justifyContent: 'flex-start',
  },
  mouvementsSection: {
    marginTop: premiumSpacing.xxl,
  },
  mouvementsGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: premiumSpacing.md,
  },
  mouvementCardTablet: {
    width: '48%',
  },
  bottomSpacer: {
    height: 24,
  },

  // ===== SITE MODAL =====
  siteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  siteModalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  siteModalSheetTablet: {
    maxWidth: 540,
    alignSelf: 'center',
    width: '90%',
    borderRadius: 24,
    marginBottom: 40,
  },
  siteModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  siteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  siteModalSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 20,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    gap: 14,
  },
  siteCardActive: {
    borderColor: 'rgba(37,99,235,0.3)',
    backgroundColor: 'rgba(37,99,235,0.04)',
  },
  siteIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  siteNameActive: {
    color: '#2563EB',
  },
  siteAddr: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

export default DashboardScreen;
