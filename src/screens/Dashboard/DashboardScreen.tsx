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
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectIsSuperviseur } from '@/store/slices/authSlice';
import { selectSite, loadSites, loadSiblingSites, setSelectedSubSite, selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { articleRepository, mouvementRepository } from '@/database';
import { DashboardStats, MouvementType } from '@/types';
import {
  premiumSpacing,
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



export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth, spacing } = useResponsive();
  const { colors, gradients, isDark } = useTheme();

  // Store
  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const technicien = useAppSelector((state) => state.auth.currentTechnicien);
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const { isConnected, supabaseReachable, syncStatus, pendingCount } = useAppSelector(
    (state) => state.network,
  );

  const sitesDisponibles = useAppSelector((state) => state.site.sitesDisponibles);
  const childSites = useAppSelector((state) => state.site.childSites);
  const [showSiteModal, setShowSiteModal] = useState(false);

  // Sous-sites depuis Redux
  const selectedSubSiteId = useAppSelector((state) => state.site.selectedSubSiteId);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);

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
    if (!effectiveSiteId) return;

    setLoading(true);
    try {
      const [articles, alertes, mouvementsJour, derniersMouvements, countsPerDay] =
        await Promise.all([
          articleRepository.findAll(effectiveSiteId),
          articleRepository.countLowStock(effectiveSiteId),
          mouvementRepository.countToday(effectiveSiteId),
          mouvementRepository.findRecent(effectiveSiteId, 5),
          mouvementRepository.getCountPerDayLast7(effectiveSiteId),
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
  }, [effectiveSiteId]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  // Charger les sous-sites quand le site actif change
  useEffect(() => {
    if (siteActif) {
      dispatch(loadSiblingSites(siteActif.id));
    }
  }, [siteActif, dispatch]);

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
        {!isSuperviseur && <ScanButtonXXL onPress={handleScan} />}

        {/* Toggle sous-sites supprimé – changement de site via la bannière */}
        {false && childSites.length > 1 && (
          <View style={styles.subSiteToggleContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => { Vibration.vibrate(10); dispatch(setSelectedSubSite(null)); }}
              style={[
                styles.subSiteTab,
                { borderColor: isDark ? colors.borderSubtle : '#E2E8F0' },
                selectedSubSiteId === null && {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
                  borderColor: colors.primary,
                },
              ]}
            >
              <Icon
                name="select-all"
                size={16}
                color={selectedSubSiteId === null ? colors.primary : colors.textMuted}
              />
              <Text style={[
                styles.subSiteTabText,
                { color: selectedSubSiteId === null ? colors.primary : colors.textSecondary },
                selectedSubSiteId === null && styles.subSiteTabTextActive,
              ]}>
                Tous
              </Text>
            </TouchableOpacity>
            {childSites.map((child) => {
              const isSelected = selectedSubSiteId === child.id;
              const icon = child.nom.includes('5') ? 'numeric-5-circle-outline'
                : child.nom.includes('8') ? 'numeric-8-circle-outline'
                : 'warehouse';
              return (
                <TouchableOpacity
                  key={String(child.id)}
                  activeOpacity={0.7}
                  onPress={() => { Vibration.vibrate(10); dispatch(setSelectedSubSite(child.id)); }}
                  style={[
                    styles.subSiteTab,
                    { borderColor: isDark ? colors.borderSubtle : '#E2E8F0' },
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Icon
                    name={icon}
                    size={16}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                  <Text style={[
                    styles.subSiteTabText,
                    { color: isSelected ? colors.primary : colors.textSecondary },
                    isSelected && styles.subSiteTabTextActive,
                  ]}>
                    {child.nom}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ===== CARDS STATISTIQUES ===== */}
        <View>
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
        </View>

        {/* ===== ACTIONS RAPIDES ===== */}
        <View
          style={styles.actionsSection}
        >
          <SectionHeader title="Actions rapides" accentColor="#6366F1" />
          <View style={[styles.actionsRow, isTablet && styles.actionsRowTablet]}>
            {!isSuperviseur && (
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
            )}
            {!isSuperviseur && (
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
            )}
            <QuickActionButton
              icon="format-list-bulleted"
              iconGradient={gradients.primary}
              label="Articles"
              onPress={() => navigation.navigate('Articles')}
            />
            {!isSuperviseur && (
              <QuickActionButton
                icon="swap-horizontal"
                iconGradient={['#3B82F6', '#6366F1']}
                label="Transfert"
                onPress={() => navigation.navigate('Mouvements', { screen: 'TransfertForm' })}
              />
            )}
          </View>
        </View>

        {/* ===== DERNIERS MOUVEMENTS ===== */}
        <View
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
                <View
                  key={mouvement.id}
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
                </View>
              ))}
            </View>
          ) : (
            <PremiumEmptyState
              icon="package-variant"
              title="Aucun mouvement récent"
              subtitle={isSuperviseur ? "Aucun mouvement de stock enregistré pour le moment" : "Scannez un article pour enregistrer votre premier mouvement de stock"}
              actionLabel={isSuperviseur ? undefined : "Scanner maintenant"}
              onActionPress={isSuperviseur ? undefined : handleScan}
            />
          )}
        </View>

        {/* Espacement bas pour la tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ===== MODAL SÉLECTION SITE ===== */}
      <Modal visible={showSiteModal} transparent animationType="slide" onRequestClose={() => setShowSiteModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSiteModal(false)}>
          <View style={[styles.siteModalOverlay, { backgroundColor: colors.modalOverlay }, isTablet && { justifyContent: 'center' as const, alignItems: 'center' as const }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.siteModalSheet, { backgroundColor: colors.surface }, isTablet && styles.siteModalSheetTablet]}>
                {/* Handle */}
                <View style={[styles.siteModalHandle, { backgroundColor: colors.textMuted + '40' }]} />

                {/* Hero header */}
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.siteModalHero}
                >
                  <View style={styles.siteModalHeroIcon}>
                    <Icon name="map-marker-radius-outline" size={28} color="#FFF" />
                  </View>
                  <Text style={styles.siteModalHeroTitle}>Changer de site</Text>
                  <Text style={styles.siteModalHeroSub}>Sélectionnez le site de stockage</Text>
                </LinearGradient>

                {/* Close button floating */}
                <TouchableOpacity
                  style={styles.siteModalCloseFloat}
                  onPress={() => {
                    Vibration.vibrate(10);
                    setShowSiteModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={18} color="#FFF" />
                </TouchableOpacity>

                {/* Site cards */}
                <View style={styles.siteModalList}>
                  {(childSites.length > 0 ? childSites : sitesDisponibles).map((site, index) => {
                    const isActive = siteActif?.id === site.id;
                    const siteIcons: Record<string, { icon: string; colors: [string, string] }> = {
                      'Stock 5ème': { icon: 'archive-outline', colors: ['#6366F1', '#4F46E5'] },
                      'Stock 8ème': { icon: 'archive-outline', colors: ['#F59E0B', '#D97706'] },
                      'Epinal': { icon: 'pine-tree', colors: ['#10B981', '#059669'] },
                      'TCS': { icon: 'tools', colors: ['#EF4444', '#DC2626'] },
                    };
                    const cfg = siteIcons[site.nom] || { icon: 'map-marker', colors: ['#6B7280', '#4B5563'] as [string, string] };

                    return (
                      <Animated.View
                        key={site.id}
                        entering={FadeInUp.delay(index * 100).duration(350)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.siteCard,
                            { backgroundColor: colors.surfaceInput, borderColor: 'transparent' },
                            isActive && { backgroundColor: '#6366F1' + '12', borderColor: '#6366F1' },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleSelectSite(site.id as number)}
                        >
                          <LinearGradient
                            colors={isActive ? ['#6366F1', '#8B5CF6'] : cfg.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.siteIcon}
                          >
                            <Icon name={cfg.icon} size={22} color="#FFF" />
                          </LinearGradient>

                          <View style={styles.siteInfo}>
                            <Text style={[styles.siteName, { color: isActive ? '#6366F1' : colors.textPrimary }]}>
                              {site.nom}
                            </Text>
                            <Text style={[styles.siteStatus, { color: isActive ? '#6366F1' : colors.textMuted }]}>
                              {isActive ? 'Site actif' : 'Appuyez pour sélectionner'}
                            </Text>
                          </View>

                          {isActive ? (
                            <LinearGradient
                              colors={['#6366F1', '#8B5CF6']}
                              style={styles.siteCheckBadge}
                            >
                              <Icon name="check" size={16} color="#FFF" />
                            </LinearGradient>
                          ) : (
                            <View style={[styles.siteRadio, { borderColor: colors.textMuted + '50' }]} />
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* Footer info */}
                <View style={[styles.siteModalFooter, { backgroundColor: colors.surfaceInput }]}>
                  <View style={styles.siteFooterIconWrap}>
                    <Icon name="information-outline" size={14} color="#6366F1" />
                  </View>
                  <Text style={[styles.siteModalFooterText, { color: colors.textMuted }]}>
                    Le site sélectionné détermine le stock affiché
                  </Text>
                </View>
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
    gap: premiumSpacing.md + 2,
    marginBottom: 0,
  },
  statsGridTablet: {
    gap: premiumSpacing.lg,
  },
  actionsSection: {
    marginTop: premiumSpacing.xl + 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: premiumSpacing.sm + 2,
  },
  actionsRowTablet: {
    gap: premiumSpacing.lg,
    justifyContent: 'flex-start',
  },
  mouvementsSection: {
    marginTop: premiumSpacing.xxl + 4,
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

  // ===== SUB-SITE TOGGLE =====
  subSiteToggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: premiumSpacing.md,
    marginTop: 4,
  },
  subSiteTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  subSiteTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  subSiteTabTextActive: {
    fontWeight: '700',
  },

  // ===== SITE MODAL =====
  siteModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  siteModalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 24,
    overflow: 'hidden',
  },
  siteModalSheetTablet: {
    maxWidth: 540,
    alignSelf: 'center',
    width: '90%',
    borderRadius: 28,
    marginBottom: 40,
  },
  siteModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 0,
    zIndex: 10,
  },
  siteModalHero: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  siteModalHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  siteModalHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  siteModalHeroSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.1,
  },
  siteModalCloseFloat: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  siteModalList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 14,
  },
  siteIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  siteStatus: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  siteCheckBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  siteRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 3,
  },
  siteModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
  },
  siteFooterIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#6366F1' + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteModalFooterText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    flex: 1,
  },
});

export default DashboardScreen;
