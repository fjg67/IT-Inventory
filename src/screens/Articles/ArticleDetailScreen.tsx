// ============================================
// ARTICLE DETAIL SCREEN - Premium Design
// IT-Inventory Application
// ============================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { selectIsSuperviseur } from '@/store/slices/authSlice';
import { notifyPCStatusChange } from '@/services/pcStatusNotificationService';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { articleRepository, mouvementRepository, panneRepository } from '@/database';
import {
  exportArticleDetail,
  exportArticleDetailAnalytics,
  exportArticleDetailAccounting,
} from '@/utils/csv';
import { Article, Mouvement } from '@/types';
import { ADC } from '@/components/article-detail/articleDetailColors';
import { ArticleDetailHero } from '@/components/article-detail/ArticleDetailHero';
import { ArticleStatsRow } from '@/components/article-detail/ArticleStatsRow';
import { StockIndicatorBar } from '@/components/article-detail/StockIndicatorBar';
import { ArticleInfoSection } from '@/components/article-detail/ArticleInfoSection';
import { ExportCSVRow } from '@/components/article-detail/ExportCSVRow';
import { QuickActionsSection } from '@/components/article-detail/QuickActionsSection';
import { ArticleHistory } from '@/components/article-detail/ArticleHistory';
import { ArticleAssetsSection } from '@/components/article-detail/ArticleAssetsSection';
import { useScrollHero, HERO_MAX_HEIGHT } from '@/hooks/useScrollHero';
import { ArticleConditionSelector } from '@/components/articles';
import { useArticleCondition } from '@/hooks/useArticleCondition';
import { PanneBanner, PanneHistoryTimeline, PanneResolutionSheet } from '@/components/panne';
import { PCLifecycleSection } from '@/components/pc/PCLifecycleSection';
import { isTrackedWorkstation } from '@/services/workstationAssetService';
import { PCPanne, PCStatus } from '@/types/pc.types';

type PCStatusLabel = 'À chaud' | 'À reusiner' | 'En usinage' | 'Disponible' | 'Envoyé';
const PC_STATUS_LABELS: Partial<Record<PCStatus, PCStatusLabel>> = {
  a_chaud: 'À chaud',
  a_reusiner: 'À reusiner',
  en_usinage: 'En usinage',
  disponible: 'Disponible',
  envoye: 'Envoyé',
};

// ==================== HELPERS ====================
const getInventoryStatus = (description?: string) => {
  const normalized = (description ?? '').toLowerCase();
  if (normalized.includes('disponible')) return 'Disponible';
  if (normalized.includes('usinage') || normalized.includes('en train d\'usiner')) return 'En usinage';
  if (normalized.includes('reusin') || normalized.includes('recondition')) return 'À reusiner';
  if (normalized.includes('a chaud') || normalized.includes('à chaud')) return 'À chaud';
  return null;
};

// ==================== MAIN ====================
export const ArticleDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { articleId, sourceTab } = route.params;
  const siteActif = useAppSelector(state => state.site.siteActif);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const currentTechnicien = useAppSelector((state) => state.auth.currentTechnicien);
  // Hero collapsible
  const { scrollHandler, heroHeight, photoOpacity, compactTitleOpacity, parallaxBg } = useScrollHero();

  const [article, setArticle] = useState<Article | null>(null);
  const [historique, setHistorique] = useState<Mouvement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isUpdatingPCStatus, setIsUpdatingPCStatus] = useState(false);
  const [pannes, setPannes] = useState<PCPanne[]>([]);
  const [showResolutionSheet, setShowResolutionSheet] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    if (!articleId) {
      setArticle(null);
      setHistorique([]);
      setIsLoading(false);
      return;
    }

    const targetSiteId = effectiveSiteId ?? siteActif?.id;
    if (!targetSiteId) {
      setIsLoading(false);
      return;
    }

    try {
      const [art, hist] = await Promise.all([
        articleRepository.findById(articleId, targetSiteId),
        mouvementRepository.findByArticle(articleId, targetSiteId, 10),
      ]);
      setArticle(art);
      setHistorique(hist);
    } catch (error) {
      console.error('Erreur chargement article:', error);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, effectiveSiteId, siteActif?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Load pannes for PC article
  useEffect(() => {
    if (article?.id) {
      panneRepository.getPannesForPC(String(article.id)).then(setPannes).catch(err => {
        console.warn('Erreur chargement pannes:', err);
        setPannes([]);
      });
    }
  }, [article?.id]);

  // Computed
  const stockActuel = article?.quantiteActuelle ?? 0;
  const assetSiteId = effectiveSiteId ?? siteActif?.id;
  const isLowStock = article ? stockActuel < article.stockMini : false;
  const isCritical = article ? stockActuel === 0 && article.stockMini > 0 : false;
  const inventoryStatus = getInventoryStatus(article?.description);
  const isPCArticle = useMemo(() => {
    if (!article) return false;

    const values = [article.typeArticle, article.sousType, article.famille]
      .filter((value): value is string => !!value)
      .map((value) => value.toLowerCase());

    return values.some((value) =>
      value === 'pc' ||
      value.includes('pc portable') ||
      value.includes('portable siège') ||
      value.includes('portable siege') ||
      value.includes('portable agence') ||
      value.includes('pc disponible'),
    );
  }, [article]);

  // Active breakdown for PC
  const activePanne = useMemo(
    () => pannes.find(panne => !['resolu', 'irreparable'].includes(panne.statut_reparation)) ?? null,
    [pannes],
  );

  const {
    condition,
    defectiveCount,
    conditionNote,
    handleChange: handleConditionChange,
    saveCondition,
    isSaving: isSavingCondition,
    isDirty: isConditionDirty,
  } = useArticleCondition(
    article?.id ?? null,
    article?.condition ?? 'bon_etat',
    article?.defectiveCount ?? 0,
    stockActuel,
    article?.conditionNote,
  );
  const isTabletArticle = useMemo(() => false, []);
  const isTabletDecommissioned = useMemo(() => {
    if (!isTabletArticle) return false;
    const normalized = (article?.description ?? '').toLowerCase();
    return normalized.includes('decommission') || normalized.includes('décommission');
  }, [article?.description, isTabletArticle]);
  const tabletDecommissionDateText = useMemo(() => {
    if (!article?.dateModification) return 'Date de décommission inconnue';

    const date = new Date(article.dateModification);
    return `Décommissionnée le ${date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, [article?.dateModification]);
  const isPCAvailable = isPCArticle && inventoryStatus === 'Disponible';
  const isPCProcessing = isPCArticle && inventoryStatus === 'En usinage';
  const isPCReconditioning = isPCArticle && inventoryStatus === 'À reusiner';
  const isPCHot = isPCArticle && inventoryStatus === 'À chaud';
  const pcStatusMeta = useMemo(() => {
    if (isPCAvailable) {
      return {
        label: 'Disponible',
        icon: 'check-circle-outline',
        gradient: ['#3B82F6', '#2563EB'] as [string, string],
        tone: '#2563EB',
        bg: '#DBEAFE',
      };
    }

    if (isPCProcessing) {
      return {
        label: 'En usinage',
        icon: 'cog-play-outline',
        gradient: ['#F97316', '#EA580C'] as [string, string],
        tone: '#EA580C',
        bg: '#FFF7ED',
      };
    }

    if (isPCReconditioning) {
      return {
        label: 'À reusiner',
        icon: 'wrench-outline',
        gradient: ['#F59E0B', '#D97706'] as [string, string],
        tone: '#D97706',
        bg: '#FFFBEB',
      };
    }

    return {
      label: 'À chaud',
      icon: 'flash-outline',
      gradient: ['#10B981', '#059669'] as [string, string],
      tone: '#059669',
      bg: '#ECFDF5',
    };
  }, [isPCAvailable, isPCProcessing, isPCReconditioning]);

  // Navigation
  const handleMouvement = (type: 'entree' | 'sortie' | 'ajustement') => {
    if (article && isTrackedWorkstation(article) && type !== 'ajustement') {
      navigation.navigate('Scan', { articleId: article.id, assetDirection: type });
      return;
    }
    Vibration.vibrate(10);
    navigation.navigate('Mouvements', { screen: 'MouvementForm', params: { articleId, type } });
  };
  const handleTransfert = () => {
    Vibration.vibrate(10);
    navigation.navigate('Mouvements', { screen: 'TransfertForm', params: { articleId } });
  };
  const handleUpdatePCStatus = useCallback(async (nextStatus: PCStatusLabel) => {
    if (!article) return;

    try {
      setIsUpdatingPCStatus(true);
      const nextFamily = nextStatus === 'Disponible' ? 'PC disponible' : 'PC portable';
      await articleRepository.update(article.id, {
        description: `Statut: ${nextStatus}`,
        famille: nextFamily,
      });

      setArticle((prev) => prev ? {
        ...prev,
        description: `Statut: ${nextStatus}`,
        famille: nextFamily,
        dateModification: new Date(),
      } : prev);
      Vibration.vibrate(16);

      const techName = currentTechnicien
        ? `${currentTechnicien.prenom} ${currentTechnicien.nom}`.trim()
        : 'Technicien inconnu';
      notifyPCStatusChange({
        article: { ...article, description: `Statut: ${nextStatus}`, famille: nextFamily },
        nextStatus,
        technicienName: techName,
      });
    } catch (error) {
      Alert.alert('Erreur', `Impossible de passer le PC en ${nextStatus}.`);
    } finally {
      setIsUpdatingPCStatus(false);
    }
  }, [article, currentTechnicien]);

  const handleEdit = () => {
    Vibration.vibrate(10);
    navigation.navigate('ArticleEdit', { articleId });
  };

  const handleSaveCondition = useCallback(async () => {
    try {
      const updated = await saveCondition();
      if (!updated) return;
      await loadData();
      Alert.alert('Succes', "Etat de l'article mis a jour.");
    } catch (error) {
      Alert.alert('Erreur', "Impossible de sauvegarder l'etat de l'article.");
    }
  }, [saveCondition, loadData]);

  const handleDecommissionTablet = useCallback(async () => {
    if (!article || isTabletDecommissioned) return;

    try {
      const currentDescription = (article.description ?? '').trim();
      const nextDescription = currentDescription.toLowerCase().includes('décommission') || currentDescription.toLowerCase().includes('decommission')
        ? currentDescription
        : `Statut: Décommissionnée${currentDescription ? ` | ${currentDescription}` : ''}`;

      await articleRepository.update(article.id, {
        description: nextDescription,
      });

      setArticle((prev) => prev ? {
        ...prev,
        description: nextDescription,
        dateModification: new Date(),
      } : prev);

      Vibration.vibrate(16);
      Alert.alert('Succès', 'Article décommissionné avec succès.');
    } catch (error) {
      Alert.alert('Erreur', "Impossible de décommissionner l'article.");
    }
  }, [article, isTabletDecommissioned]);

  const quickActions = useMemo(() => {
    if (article && isTrackedWorkstation(article)) {
      return [
        { icon: 'arrow-up-bold', label: 'Entrée', gradient: ['#1E6B52', '#145540'] as [string, string], onPress: () => handleMouvement('entree'), disabled: false },
        { icon: 'arrow-down-bold', label: 'Sortie', gradient: ['#E52454', '#A0193B'] as [string, string], onPress: () => handleMouvement('sortie'), disabled: stockActuel === 0 },
      ];
    }
    if (isPCArticle) {
      return [
        {
          icon: 'map-search-outline',
          label: 'Localiser',
          gradient: ['#00A391', '#007D70'] as [string, string],
          onPress: () => navigation.navigate('StockMap', { highlightBarcode: article?.emplacement || article?.reference }),
          disabled: false,
        },
        {
          icon: 'check-circle-outline',
          label: 'Disponible',
          gradient: ['#2563EB', '#1D4ED8'] as [string, string],
          onPress: () => handleUpdatePCStatus('Disponible'),
          disabled: isUpdatingPCStatus || isPCAvailable,
        },
        {
          icon: 'flash-outline',
          label: 'À chaud',
          gradient: ['#10B981', '#059669'] as [string, string],
          onPress: () => handleUpdatePCStatus('À chaud'),
          disabled: isUpdatingPCStatus || isPCHot,
        },
        {
          icon: 'wrench-outline',
          label: 'À reusiner',
          gradient: ['#F59E0B', '#D97706'] as [string, string],
          onPress: () => handleUpdatePCStatus('À reusiner'),
          disabled: isUpdatingPCStatus || isPCReconditioning,
        },
        {
          icon: 'arrow-down-bold',
          label: 'Sortie',
          gradient: ['#EF4444', '#DC2626'] as [string, string],
          onPress: () => handleMouvement('sortie'),
          disabled: stockActuel === 0,
        },
      ];
    }

    if (isTabletArticle) {
      return [
        {
          icon: isTabletDecommissioned ? 'check-decagram' : 'power-plug-off-outline',
          label: isTabletDecommissioned ? 'Décommissionnée' : 'Décommissionner',
          gradient: isTabletDecommissioned
            ? (['#10B981', '#059669'] as [string, string])
            : (['#D97706', '#B45309'] as [string, string]),
          onPress: handleDecommissionTablet,
          disabled: isTabletDecommissioned,
        },
      ];
    }

    return [
      { icon: 'map-search-outline', label: 'Localiser', gradient: ['#00A391', '#007D70'] as [string, string], onPress: () => navigation.navigate('StockMap', { highlightBarcode: article?.emplacement || article?.reference }), disabled: false },
      { icon: 'arrow-up-bold', label: 'Entrée', gradient: ['#10B981', '#059669'] as [string, string], onPress: () => handleMouvement('entree'), disabled: false },
      { icon: 'arrow-down-bold', label: 'Sortie', gradient: ['#EF4444', '#DC2626'] as [string, string], onPress: () => handleMouvement('sortie'), disabled: stockActuel === 0 },
      ...(!article || !isTrackedWorkstation(article) ? [
        { icon: 'tune-vertical', label: 'Ajustement', gradient: ['#F59E0B', '#D97706'] as [string, string], onPress: () => handleMouvement('ajustement'), disabled: false },
        { icon: 'swap-horizontal', label: 'Transfert', gradient: ['#8B5CF6', '#6D28D9'] as [string, string], onPress: handleTransfert, disabled: false },
      ] : []),
    ];
  }, [article, navigation, handleMouvement, handleTransfert, handleUpdatePCStatus, isPCArticle, isTabletArticle, isTabletDecommissioned, handleDecommissionTablet, isPCAvailable, isPCHot, isPCReconditioning, isUpdatingPCStatus, stockActuel]);

  const handleBack = useCallback(() => {
    Vibration.vibrate(10);

    if (sourceTab === 'PC') {
      const parentNav = navigation.getParent?.();

      if (parentNav) {
        parentNav.navigate('PC', { screen: 'ArticlesList' });
      } else {
        navigation.navigate('ArticlesList');
      }
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const tabName = sourceTab === 'PC' ? 'PC' : 'Articles';
    const parentNav = navigation.getParent?.();
    if (parentNav) {
      parentNav.navigate(tabName, { screen: 'ArticlesList' });
    } else {
      navigation.navigate('ArticlesList');
    }
  }, [navigation, sourceTab]);

  const handleExportCSV = useCallback(async () => {
    if (!article || !siteActif || !effectiveSiteId) return;
    Vibration.vibrate(10);
    setExporting(true);
    try {
      const exportFormat = await new Promise<'premium' | 'analytics' | 'comptable' | null>((resolve) => {
        Alert.alert(
          "Format d'export CSV",
          'Choisissez le type de fichier à générer.',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
            { text: 'CSV Premium', onPress: () => resolve('premium') },
            { text: 'CSV Analytics', onPress: () => resolve('analytics') },
            { text: 'CSV Comptable', onPress: () => resolve('comptable') },
          ],
        );
      });
      if (!exportFormat) return;

      // Export complet : récupérer tous les mouvements liés à l'article (pas seulement les 10 affichés)
      const allMovements = await mouvementRepository.findByArticle(article.id, effectiveSiteId, 5000);
      const filepath =
        exportFormat === 'analytics'
          ? await exportArticleDetailAnalytics(article, allMovements, siteActif.nom)
          : exportFormat === 'comptable'
            ? await exportArticleDetailAccounting(article, allMovements, siteActif.nom)
            : await exportArticleDetail(article, allMovements, siteActif.nom);
      const dirName = filepath.split('/').slice(-2, -1)[0] || 'Téléchargements';
      Alert.alert(
        'Export réussi',
        `${exportFormat === 'analytics' ? 'Fichier analytics' : exportFormat === 'comptable' ? 'Fichier comptable' : 'Fichier premium'} enregistré dans ${dirName}.\n\n${filepath.split('/').pop() ?? ''}`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      Alert.alert('Erreur', `Impossible d'exporter : ${(error as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [article, effectiveSiteId, siteActif]);

  // Loading guard
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={ADC.bg_primary} />
        <ActivityIndicator size="large" color={ADC.green_light} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={ADC.bg_primary} />
        <Icon name="package-variant-closed-remove" size={56} color={ADC.text_dim} />
        <Text style={styles.notFoundText}>Article non trouvé</Text>
        <TouchableOpacity onPress={handleBack} style={{ marginTop: 16 }}>
          <Text style={styles.notFoundLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==================== RENDER (OBSIDIAN GRID) ====================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ADC.bg_primary} translucent={false} />

      {/* ===== HERO (position absolute, compressible au scroll) ===== */}
      <Animated.View style={[styles.heroWrapper, heroHeight]}>
        <ArticleDetailHero
          article={article}
          isLowStock={isLowStock}
          isCritical={isCritical}
          photoOpacity={photoOpacity}
          compactTitleOpacity={compactTitleOpacity}
          parallaxBg={parallaxBg}
          onBack={handleBack}
          onEdit={handleEdit}
          showEdit={!isSuperviseur}
        />
      </Animated.View>

      {/* ===== CONTENU SCROLLABLE ===== */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HERO_MAX_HEIGHT }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor={ADC.green_light}
            colors={[ADC.green_light]}
          />
        }
      >

        {/* === Stats row === */}
        {!isTabletArticle && !isPCArticle && (
          <ArticleStatsRow
            article={article}
            stockActuel={stockActuel}
            mouvementsCount={historique.length}
          />
        )}

        {/* === PC hero card === */}
        {isPCArticle && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.pcHeroCard}>
            <View style={styles.pcHeroInner}>
              <View style={[styles.pcStatusBadge, { backgroundColor: pcStatusMeta.bg }]}>
                <Icon name={pcStatusMeta.icon} size={13} color={pcStatusMeta.tone} />
                <Text style={[styles.pcStatusText, { color: pcStatusMeta.tone }]}>{pcStatusMeta.label}</Text>
              </View>
              <View style={styles.pcPillsRow}>
                <View style={styles.pcPill}>
                  <Icon name="laptop" size={12} color={ADC.info} />
                  <Text style={styles.pcPillText} numberOfLines={1}>{article.modele ?? article.nom}</Text>
                </View>
                <View style={styles.pcPill}>
                  <Icon name="office-building" size={12} color={ADC.text_muted} />
                  <Text style={styles.pcPillText} numberOfLines={1}>{siteActif?.nom ?? '—'}</Text>
                </View>
                <View style={styles.pcPill}>
                  <Icon name="history" size={12} color={ADC.text_muted} />
                  <Text style={styles.pcPillText}>{historique.length} mouv.</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* === Panne Banner (PC breakdown status) === */}
        {isPCArticle && activePanne && (
          <PanneBanner
            activePanne={activePanne}
            onResolvePress={() => setShowResolutionSheet(true)}
          />
        )}

        {isPCArticle && (
          <PCLifecycleSection
            articleId={article.id}
            technicianId={currentTechnicien?.id}
          />
        )}

        {/* === Indicateur stock === */}
        {!isTabletArticle && !isPCArticle && (
          <StockIndicatorBar current={stockActuel} min={article.stockMini} />
        )}

        {isTrackedWorkstation(article) && assetSiteId != null && (
          <ArticleAssetsSection articleId={article.id} siteId={assetSiteId} />
        )}

        {!isPCArticle && (
          <Animated.View entering={FadeInDown.delay(220).duration(280)} style={styles.conditionSection}>
            <ArticleConditionSelector
              condition={condition}
              defectiveCount={defectiveCount}
              totalStock={stockActuel}
              conditionNote={conditionNote}
              onChange={handleConditionChange}
            />

            {isConditionDirty && (
              <TouchableOpacity
                onPress={handleSaveCondition}
                disabled={isSavingCondition}
                style={[styles.saveConditionBtn, isSavingCondition && styles.saveConditionBtnDisabled]}
              >
                {isSavingCondition ? (
                  <ActivityIndicator size="small" color="#1A1A1A" />
                ) : (
                  <>
                    <Icon name="content-save-outline" size={16} color="#1A1A1A" />
                    <Text style={styles.saveConditionBtnText}>Sauvegarder l'etat</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* === Informations === */}
        <ArticleInfoSection
          article={article}
          siteName={siteActif?.nom}
          inventoryStatus={inventoryStatus}
          isTabletArticle={isTabletArticle}
        />

        {/* === Export CSV === */}
        {!isTabletArticle && (
          <ExportCSVRow onPress={handleExportCSV} loading={exporting} />
        )}

        {/* === Actions rapides === */}
        {!isSuperviseur && (!isTabletArticle || !isTabletDecommissioned) && (
          <QuickActionsSection
            title={article && isTrackedWorkstation(article) ? 'Mouvements des assets' : isPCArticle ? 'Actions PC' : 'Actions rapides'}
            actions={quickActions.map((a) => ({
              icon: a.icon,
              label: a.label,
              color: a.gradient[0],
              bg: a.gradient[0] + '1A',
              onPress: a.onPress,
              disabled: a.disabled,
              hint: isPCArticle && a.disabled ? 'Actuel' : isTabletArticle && a.disabled ? 'Déjà fait' : undefined,
            }))}
          />
        )}

        {isTabletArticle && isTabletDecommissioned && (
          <Animated.View entering={FadeInDown.delay(400).duration(300)} style={styles.decommCard}>
            <Icon name="check-decagram" size={24} color={ADC.warning} />
            <View style={styles.decommText}>
              <Text style={styles.decommTitle}>Article décommissionné</Text>
              <Text style={styles.decommSub}>{tabletDecommissionDateText}</Text>
            </View>
          </Animated.View>
        )}

        {/* === Historique === */}
        {!isTabletArticle && (
          <ArticleHistory
            movements={historique}
            onSeeAll={() => {
              navigation.navigate('Mouvements', { screen: 'MouvementsListScreen' });
            }}
          />
        )}

        {/* === Panne History Timeline === */}
        {isPCArticle && pannes.length > 0 && (
          <PanneHistoryTimeline pannes={pannes} />
        )}

      </Animated.ScrollView>

      {/* === Panne Resolution Sheet === */}
      {showResolutionSheet && activePanne && (
        <PanneResolutionSheet
          panne={activePanne}
          onClose={() => setShowResolutionSheet(false)}
          onSuccess={() => {
            setShowResolutionSheet(false);
            void loadData();
            void panneRepository.getPannesForPC(String(article.id)).then(setPannes);
          }}
          onUpdatePanne={async (panneId, updates) => {
            await panneRepository.updatePanne(panneId, updates);
          }}
          onUpdatePCStatus={async (pcId, nextStatus) => {
            if (String(article.id) !== pcId) return;
            const statusLabel = PC_STATUS_LABELS[nextStatus];
            if (statusLabel) await handleUpdatePCStatus(statusLabel);
          }}
        />
      )}
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADC.bg_primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: ADC.bg_primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: ADC.text_muted,
  },
  notFoundText: {
    fontSize: 15,
    color: ADC.text_secondary,
    marginTop: 12,
  },
  notFoundLink: {
    color: ADC.green_light,
    fontWeight: '600',
  },
  heroWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 20,
  },
  conditionSection: {
    gap: 12,
  },
  saveConditionBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1B8A3E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  saveConditionBtnDisabled: {
    opacity: 0.7,
  },
  saveConditionBtnText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  // PC hero card
  pcHeroCard: {
    backgroundColor: ADC.bg_card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    overflow: 'hidden',
  },
  pcHeroInner: {
    padding: 14,
    gap: 10,
  },
  pcStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pcStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pcPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pcPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ADC.bg_card_elevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
  },
  pcPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: ADC.text_primary,
    maxWidth: 120,
  },
  // Décommissionnement
  decommCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: ADC.bg_card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    borderLeftWidth: 4,
    borderLeftColor: ADC.warning,
    padding: 16,
  },
  decommText: { flex: 1 },
  decommTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ADC.text_primary,
  },
  decommSub: {
    fontSize: 12,
    color: ADC.text_muted,
    marginTop: 2,
  },
});

export default ArticleDetailScreen;
