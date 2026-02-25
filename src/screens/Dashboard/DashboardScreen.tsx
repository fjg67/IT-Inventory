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
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectSite, loadSites } from '@/store/slices/siteSlice';
import { articleRepository, mouvementRepository } from '@/database';
import { DashboardStats, MouvementType } from '@/types';
import {
  premiumSpacing,
  premiumAnimation,
} from '@/constants/premiumTheme';
import { useTheme } from '@/theme';
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
  const { colors, gradients, isDark } = useTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
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
          entering={SlideInRight.delay(STAGGER * 2).springify().damping(18)}
        >
          <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
            <GlassStatCard
              icon="package-variant-closed"
              iconGradient={gradients.primary}
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
              sparklineColor={colors.primary}
              onPress={() => navigation.navigate('Articles')}
            />
            <GlassStatCard
              icon="alert-circle-outline"
              iconGradient={
                stats.articlesAlerte > 0
                  ? gradients.warning
                  : gradients.success
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
                  ? colors.warning
                  : colors.success
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
            iconGradient={gradients.info}
            value={stats.mouvementsAujourdhui}
            label="Mouvements aujourd'hui"
            sparklineData={mouvementsParJour}
            sparklineColor={colors.info}
            showDayLabels
            fullWidth
            onPress={() => navigation.navigate('Mouvements')}
          />
        </Animated.View>

        {/* ===== ACTIONS RAPIDES ===== */}
        <Animated.View
          entering={SlideInRight.delay(STAGGER * 3).springify().damping(18)}
          style={styles.actionsSection}
        >
          <SectionHeader title="Actions rapides" accentColor="#6366F1" />
          <View style={[styles.actionsRow, isTablet && styles.actionsRowTablet]}>
            <QuickActionButton
              icon="plus"
              iconGradient={gradients.success}
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
              iconGradient={gradients.danger}
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
              iconGradient={gradients.primary}
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
          entering={SlideInRight.delay(STAGGER * 4).springify().damping(18)}
          style={styles.mouvementsSection}
        >
          <SectionHeader
            title="Derniers mouvements"
            actionLabel="Voir tout"
            onActionPress={() => navigation.navigate('Mouvements')}
            accentColor="#4338CA"
          />

          {loading ? (
            <SkeletonLoader count={3} />
          ) : stats.derniersMovements.length > 0 ? (
            <View style={isTablet ? styles.mouvementsGridTablet : undefined}>
              {stats.derniersMovements.map((mouvement, index) => (
                <Animated.View
                  key={mouvement.id}
                  entering={SlideInRight.delay(
                    STAGGER * 4 + index * STAGGER,
                  ).springify().damping(18)}
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
          <View style={[styles.siteModalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.siteModalSheet, { backgroundColor: colors.surface }, isTablet && styles.siteModalSheetTablet]}>
                <View style={[styles.siteModalHandle, { backgroundColor: colors.borderMedium }]} />
                <View style={styles.siteModalTitleRow}>
                  <LinearGradient colors={['#4338CA', '#6366F1']} style={styles.siteModalIconWrap}>
                    <Icon name="map-marker-radius-outline" size={18} color="#FFF" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.siteModalTitle, { color: colors.textPrimary }]}>Changer de site</Text>
                    <Text style={[styles.siteModalSubtitle, { color: colors.textMuted }]}>
                      Sélectionnez le site de stockage
                    </Text>
                  </View>
                </View>

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
                      style={[
                        styles.siteCard,
                        { backgroundColor: colors.surfaceGlass, borderColor: colors.borderSubtle },
                        isActive && { borderColor: colors.primaryGlow, backgroundColor: colors.primaryGlow },
                      ]}
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
                        <Text style={[styles.siteName, { color: colors.textPrimary }, isActive && { color: colors.primary }]}>
                          {site.nom}
                        </Text>
                      </View>
                      {isActive && (
                        <Icon name="check-circle" size={22} color={colors.primary} />
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
    justifyContent: 'flex-end',
  },
  siteModalSheet: {
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
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  siteModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  siteModalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  siteModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  siteModalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    gap: 14,
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
  },
  siteAddr: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default DashboardScreen;
