// ============================================
// ARTICLE DETAIL SCREEN - Premium Design
// IT-Inventory Application
// ============================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Vibration,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { selectIsSuperviseur } from '@/store/slices/authSlice';
import { notifyPCStatusChange } from '@/services/pcStatusNotificationService';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { articleRepository, mouvementRepository, stockRepository } from '@/database';
import { formatTimeParis, formatRelativeDateParis } from '@/utils/dateUtils';
import {
  exportArticleDetail,
  exportArticleDetailAnalytics,
  exportArticleDetailAccounting,
} from '@/utils/csv';
import { Article, Mouvement, StockSite } from '@/types';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ==================== HELPERS ====================
const AVATAR_GRADIENTS = [
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#007A39'],
  ['#EC4899', '#F472B6'],
  ['#10B981', '#34D399'],
  ['#F59E0B', '#FBBF24'],
  ['#06B6D4', '#22D3EE'],
  ['#EF4444', '#F87171'],
];

const getGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getInventoryStatus = (description?: string) => {
  const normalized = (description ?? '').toLowerCase();
  if (normalized.includes('disponible')) return 'Disponible';
  if (normalized.includes('usinage') || normalized.includes('en train d\'usiner')) return 'En usinage';
  if (normalized.includes('reusin') || normalized.includes('recondition')) return 'A reusiner';
  if (normalized.includes('a chaud') || normalized.includes('à chaud')) return 'A chaud';
  return null;
};

const formatTime = (date: Date) => formatTimeParis(date);
const formatRelDate = (date: Date) => formatRelativeDateParis(date);

const TYPE_CFG: Record<string, { icon: string; color: string; label: string; prefix: string }> = {
  entree: { icon: 'arrow-up-bold', color: '#10B981', label: 'Entrée', prefix: '+' },
  sortie: { icon: 'arrow-down-bold', color: '#EF4444', label: 'Sortie', prefix: '-' },
  ajustement: { icon: 'swap-vertical', color: '#F59E0B', label: 'Ajustement', prefix: '' },
  transfert_depart: { icon: 'arrow-right-bold', color: '#8B5CF6', label: 'Transfert ↗', prefix: '-' },
  transfert_arrivee: { icon: 'arrow-left-bold', color: '#8B5CF6', label: 'Transfert ↙', prefix: '+' },
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
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, isDark, theme } = useTheme();
  const { gradients } = theme;

  const [article, setArticle] = useState<Article | null>(null);
  const [historique, setHistorique] = useState<Mouvement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isUpdatingPCStatus, setIsUpdatingPCStatus] = useState(false);

  const loadData = useCallback(async () => {
    if (!articleId || !effectiveSiteId) return;
    setIsLoading(true);
    try {
      const [art, hist] = await Promise.all([
        articleRepository.findById(articleId, effectiveSiteId),
        mouvementRepository.findByArticle(articleId, effectiveSiteId, 10),
      ]);
      setArticle(art);
      setHistorique(hist);
    } catch (error) {
      console.error('Erreur chargement article:', error);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, effectiveSiteId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Computed
  const stockActuel = article?.quantiteActuelle ?? 0;
  const isLowStock = article ? stockActuel < article.stockMini : false;
  const isCritical = article ? stockActuel === 0 && article.stockMini > 0 : false;
  const inventoryStatus = getInventoryStatus(article?.description);
  const gradient = useMemo(() => getGradient(article?.nom ?? 'A'), [article?.nom]);
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
  const isTabletArticle = useMemo(() => {
    if (!article) return false;

    const values = [article.typeArticle, article.sousType, article.famille]
      .filter((value): value is string => !!value)
      .map((value) => value.toLowerCase());

    return values.some((value) => value.includes('tablette'));
  }, [article]);
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
  const headerGradient = useMemo(() => {
    if (isTabletArticle) return ['#0F3D35', '#0F766E', '#0EA5A8'];
    if (isPCArticle) return ['#0F172A', '#1E293B'];
    return gradient;
  }, [gradient, isPCArticle, isTabletArticle]);
  const isPCAvailable = isPCArticle && inventoryStatus === 'Disponible';
  const isPCProcessing = isPCArticle && inventoryStatus === 'En usinage';
  const isPCReconditioning = isPCArticle && inventoryStatus === 'A reusiner';
  const isPCHot = isPCArticle && inventoryStatus === 'A chaud';
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
        label: 'A reusiner',
        icon: 'wrench-outline',
        gradient: ['#F59E0B', '#D97706'] as [string, string],
        tone: '#D97706',
        bg: '#FFFBEB',
      };
    }

    return {
      label: 'A chaud',
      icon: 'flash-outline',
      gradient: ['#10B981', '#059669'] as [string, string],
      tone: '#059669',
      bg: '#ECFDF5',
    };
  }, [isPCAvailable, isPCProcessing, isPCReconditioning]);

  // Navigation
  const handleMouvement = (type: 'entree' | 'sortie' | 'ajustement') => {
    Vibration.vibrate(10);
    navigation.navigate('Mouvements', { screen: 'MouvementForm', params: { articleId, type } });
  };
  const handleTransfert = () => {
    Vibration.vibrate(10);
    navigation.navigate('Mouvements', { screen: 'TransfertForm', params: { articleId } });
  };
  const handleUpdatePCStatus = useCallback(async (nextStatus: 'À chaud' | 'À reusiner' | 'Disponible') => {
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
      Alert.alert('Succès', 'Tablette décommissionnée avec succès.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de décommissionner la tablette.');
    }
  }, [article, isTabletDecommissioned]);

  const quickActions = useMemo(() => {
    if (isPCArticle) {
      return [
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
      { icon: 'arrow-up-bold', label: 'Entrée', gradient: ['#10B981', '#059669'] as [string, string], onPress: () => handleMouvement('entree'), disabled: false },
      { icon: 'arrow-down-bold', label: 'Sortie', gradient: ['#EF4444', '#DC2626'] as [string, string], onPress: () => handleMouvement('sortie'), disabled: stockActuel === 0 },
      { icon: 'tune-vertical', label: 'Ajustement', gradient: ['#F59E0B', '#D97706'] as [string, string], onPress: () => handleMouvement('ajustement'), disabled: false },
      { icon: 'swap-horizontal', label: 'Transfert', gradient: ['#8B5CF6', '#6D28D9'] as [string, string], onPress: handleTransfert, disabled: false },
    ];
  }, [handleMouvement, handleTransfert, handleUpdatePCStatus, isPCArticle, isTabletArticle, isTabletDecommissioned, handleDecommissionTablet, isPCAvailable, isPCHot, isPCReconditioning, isUpdatingPCStatus, stockActuel]);

  const handleBack = useCallback(() => {
    Vibration.vibrate(10);

    if (sourceTab === 'PC' || sourceTab === 'Tablette') {
      const tabName = sourceTab === 'Tablette' ? 'Tablette' : 'PC';
      const parentNav = navigation.getParent?.();

      if (parentNav) {
        parentNav.navigate(tabName, { screen: 'ArticlesList' });
      } else {
        navigation.navigate('ArticlesList');
      }
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const tabName = sourceTab === 'Tablette' ? 'Tablette' : sourceTab === 'PC' ? 'PC' : 'Articles';
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

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14 }}>Chargement...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Icon name="package-variant-closed-remove" size={56} color={colors.textMuted} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 15 }}>Article non trouvé</Text>
        <TouchableOpacity onPress={handleBack} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ paddingBottom: 40 }, isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : undefined]}>
        {/* ===== HERO HEADER ===== */}
        <LinearGradient colors={headerGradient} style={[styles.header, isTabletArticle && styles.headerTablet]}>
          {/* Glass overlay for depth */}
          <View style={[styles.headerOverlay, isTabletArticle && styles.headerOverlayTablet]} />
          {isTabletArticle && <View pointerEvents="none" style={styles.headerTabletOrb} />}
          {isTabletArticle && <View pointerEvents="none" style={styles.headerTabletOrbSecondary} />}

          {/* Nav */}
          <View style={styles.headerNav}>
            <TouchableOpacity style={styles.navBtn} onPress={handleBack}>
              <Icon name="arrow-left" size={22} color="#FFF" />
            </TouchableOpacity>
            {!isSuperviseur && (
              <TouchableOpacity style={styles.navBtn} onPress={handleEdit}>
                <Icon name="pencil-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Photo / Avatar */}
          <Animated.View entering={ZoomIn.delay(150).duration(400)} style={styles.avatarWrapper}>
            <View style={styles.avatarGlow}>
              {article.photoUrl ? (
                <Image source={{ uri: article.photoUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{getInitials(article.nom)}</Text>
                </View>
              )}
            </View>
            {/* Stock status ring */}
            <View style={[styles.stockDot, {
              backgroundColor: isCritical ? '#EF4444' : isLowStock ? '#F59E0B' : '#10B981',
            }]}>
              <Icon
                name={isCritical ? 'close' : isLowStock ? 'alert' : 'check'}
                size={13}
                color="#FFF"
              />
            </View>
          </Animated.View>

          {/* Ref + Name */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.headerInfo, isTabletArticle && styles.headerInfoTablet]}>
            <View style={isTabletArticle ? styles.headerTabletPanel : undefined}>
            {isTabletArticle ? (
              <View style={[styles.refBadge, styles.refBadgeTablet]}>
                <Icon name="tablet-cellphone" size={12} color="rgba(255,255,255,0.92)" />
                <Text style={styles.refText}>Fiche Tablette</Text>
              </View>
            ) : (
              <View style={styles.refBadge}>
                <Icon name="barcode" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.refText}>{article.reference}</Text>
              </View>
            )}
            <Text style={styles.headerName} numberOfLines={2}>{article.nom}</Text>
            {isTabletArticle && (
              <Text style={styles.headerTabletSubtitle} numberOfLines={1}>
                {siteActif?.nom ?? 'Site non defini'}
              </Text>
            )}
            {isTabletArticle && (
              <View style={styles.headerBadgeRow}>
                {article.barcode ? (
                  <View style={styles.headerPill}>
                    <Icon name="tag-outline" size={11} color="rgba(255,255,255,0.94)" />
                    <Text style={styles.headerPillText}>Asset {article.barcode}</Text>
                  </View>
                ) : null}
                {article.marque ? (
                  <View style={styles.headerPill}>
                    <Icon name="domain" size={11} color="rgba(255,255,255,0.94)" />
                    <Text style={styles.headerPillText}>{article.marque}</Text>
                  </View>
                ) : null}
              </View>
            )}
            {article.categorieNom && !isTabletArticle ? (
              <View style={styles.catBadge}>
                <Icon name="folder-outline" size={11} color="rgba(255,255,255,0.9)" />
                <Text style={styles.catText}>{article.categorieNom}</Text>
              </View>
            ) : null}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ===== HEADER PANEL ===== */}
        {isPCArticle ? (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.pcHeroWrap}>
            <View style={[styles.pcHeroCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <LinearGradient
                colors={pcStatusMeta.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.pcHeroAccent}
              />

              <View style={styles.pcHeroTopRow}>
                <View style={[styles.pcStatusBadge, { backgroundColor: pcStatusMeta.bg }]}> 
                  <Icon name={pcStatusMeta.icon} size={13} color={pcStatusMeta.tone} />
                  <Text style={[styles.pcStatusText, { color: pcStatusMeta.tone }]}>{pcStatusMeta.label}</Text>
                </View>
                <Text style={[styles.pcHeroMetaText, { color: colors.textMuted }]}>Maj {article.dateModification ? formatRelDate(new Date(article.dateModification)) : 'inconnue'}</Text>
              </View>

              <View style={styles.pcHeroStatsRow}>
                <View style={[styles.pcMiniPill, { backgroundColor: colors.backgroundSubtle, borderColor: colors.borderSubtle }]}> 
                  <Icon name="laptop" size={13} color={colors.primary} />
                  <Text numberOfLines={1} style={[styles.pcMiniPillText, { color: colors.textPrimary }]}>
                    {article.modele || article.nom}
                  </Text>
                </View>

                <View style={[styles.pcMiniPill, { backgroundColor: colors.backgroundSubtle, borderColor: colors.borderSubtle }]}> 
                  <Icon name="office-building" size={13} color={colors.info} />
                  <Text numberOfLines={1} style={[styles.pcMiniPillText, { color: colors.textPrimary }]}>
                    {siteActif?.nom ?? 'Site non defini'}
                  </Text>
                </View>

                <View style={[styles.pcMiniPill, { backgroundColor: colors.backgroundSubtle, borderColor: colors.borderSubtle }]}> 
                  <Icon name="history" size={13} color={colors.textSecondary} />
                  <Text numberOfLines={1} style={[styles.pcMiniPillText, { color: colors.textPrimary }]}>
                    {historique.length} mouvement{historique.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : !isTabletArticle ? (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={[styles.statsRow, isTabletArticle && styles.statsRowTablet]}>
            {[
              { icon: 'package-variant', gradient: ['#3B82F6', '#2563EB'], value: stockActuel, label: 'Stock actuel', valueColor: isCritical ? '#EF4444' : isLowStock ? '#F59E0B' : colors.textPrimary },
              { icon: 'alert-circle-outline', gradient: ['#F59E0B', '#D97706'], value: article.stockMini, label: 'Stock mini', valueColor: colors.textPrimary },
              { icon: 'swap-vertical', gradient: ['#8B5CF6', '#6D28D9'], value: historique.length, label: 'Mouvements', valueColor: colors.textPrimary },
            ].map((stat, idx) => (
              <View key={idx} style={[styles.statCard, isTabletArticle && styles.statCardTablet, { backgroundColor: colors.surface }]}>
                {isTabletArticle && <View style={styles.statCardTopLine} />}
                <View style={styles.statIconWrap}>
                  <LinearGradient colors={stat.gradient} style={styles.statIconGrad}>
                    <View style={styles.statIconInner}>
                      <Icon name={stat.icon} size={16} color={stat.gradient[0]} />
                    </View>
                  </LinearGradient>
                </View>
                <Text style={[styles.statValue, { color: stat.valueColor }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>
        ) : null}
        )}

        {/* ===== ALERTE STOCK ===== */}
        {isLowStock && (
          <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.alertWrapper}>
            <View style={[styles.alertCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <LinearGradient
                colors={isCritical ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.alertAccentStrip}
              />
              <View style={styles.alertIconWrap}>
                <LinearGradient
                  colors={isCritical ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706']}
                  style={styles.alertIconGrad}
                >
                  <View style={styles.alertIconInner}>
                    <Icon name={isCritical ? 'alert-octagon' : 'alert'} size={18} color={isCritical ? '#EF4444' : '#F59E0B'} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: isCritical ? '#EF4444' : '#F59E0B' }]}>
                  {isCritical ? 'Stock critique !' : 'Stock bas'}
                </Text>
                <Text style={[styles.alertSub, { color: colors.textMuted }]}>
                  {isCritical
                    ? `Aucune unité en stock. Seuil : ${article.stockMini}`
                    : `Il reste ${stockActuel}/${article.stockMini} unité(s)`}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ===== INFORMATIONS ===== */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient colors={['#007A39', '#007A39']} style={styles.sectionAccent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{isTabletArticle ? 'Fiche tablette' : 'Informations'}</Text>
          </View>
          <View style={[styles.infoCard, isTabletArticle && styles.infoCardTablet, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Référence</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{article.reference}</Text>
            </View>
            {article.codeFamille ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Code famille</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.badge }]}>
                  <Icon name="tag-outline" size={13} color={colors.primary} />
                  <Text style={[styles.infoTagText, { color: colors.primary }]}>{article.codeFamille}</Text>
                </View>
              </View>
            ) : null}
            {article.famille ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Famille</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: `${colors.mouvementTransfert}1A` }]}>
                  <Icon name="shape-outline" size={13} color={colors.mouvementTransfert} />
                  <Text style={[styles.infoTagText, { color: colors.mouvementTransfert }]}>{article.famille}</Text>
                </View>
              </View>
            ) : null}
            {article.typeArticle ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.infoBg }]}>
                  <Icon name="format-list-bulleted-type" size={13} color={colors.info} />
                  <Text style={[styles.infoTagText, { color: colors.info }]}>{article.typeArticle}</Text>
                </View>
              </View>
            ) : null}
            {article.sousType ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Sous-type</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.warningBg }]}>
                  <Icon name="tag-text-outline" size={13} color={colors.warning} />
                  <Text style={[styles.infoTagText, { color: colors.warning }]}>{article.sousType}</Text>
                </View>
              </View>
            ) : null}
            {article.marque ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Marque</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.infoBg }]}>
                  <Icon name="domain" size={13} color={colors.secondary} />
                  <Text style={[styles.infoTagText, { color: colors.secondary }]}>{article.marque}</Text>
                </View>
              </View>
            ) : null}
            {article.modele ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Modèle</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.successBg }]}>
                  <Icon name="laptop" size={13} color={colors.success} />
                  <Text style={[styles.infoTagText, { color: colors.success }]}>{article.modele}</Text>
                </View>
              </View>
            ) : null}
            {article.barcode ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Asset</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.infoBg }]}>
                  <Icon name="tag-outline" size={13} color={colors.info} />
                  <Text style={[styles.infoTagText, { color: colors.info }]}>{article.barcode}</Text>
                </View>
              </View>
            ) : null}
            {inventoryStatus ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Statut</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: inventoryStatus === 'A chaud' ? colors.successBg : inventoryStatus === 'Disponible' ? '#DBEAFE' : inventoryStatus === 'En usinage' ? '#FFF7ED' : colors.warningBg }]}>
                  <Icon name={inventoryStatus === 'A chaud' ? 'flash-outline' : inventoryStatus === 'Disponible' ? 'check-circle-outline' : inventoryStatus === 'En usinage' ? 'cog-play-outline' : 'wrench-outline'} size={13} color={inventoryStatus === 'A chaud' ? colors.success : inventoryStatus === 'Disponible' ? '#2563EB' : inventoryStatus === 'En usinage' ? '#EA580C' : colors.warning} />
                  <Text style={[styles.infoTagText, { color: inventoryStatus === 'A chaud' ? colors.success : inventoryStatus === 'Disponible' ? '#2563EB' : inventoryStatus === 'En usinage' ? '#EA580C' : colors.warning }]}>{inventoryStatus}</Text>
                </View>
              </View>
            ) : null}
            {article.emplacement ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Emplacement</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.successBg }]}>
                  <Icon name="map-marker" size={13} color={colors.success} />
                  <Text style={[styles.infoTagText, { color: colors.success }]}>{article.emplacement}</Text>
                </View>
              </View>
            ) : null}
            <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Site</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{siteActif?.nom ?? '—'}</Text>
            </View>
            {article.description ? (
              <View style={[styles.infoRow, isTabletArticle && styles.infoRowTablet, { borderBottomWidth: 0 }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Description</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]} numberOfLines={3}>
                  {article.description}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* ===== EXPORT CSV ===== */}
        {!isTabletArticle && (
        <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.section}>
          <TouchableOpacity
            style={[styles.exportCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            activeOpacity={0.8}
            onPress={handleExportCSV}
            disabled={exporting}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.exportAccentStrip}
            />
            <View style={styles.exportRow}>
              <View style={styles.exportIconWrap}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.exportIconGrad}>
                  <View style={styles.exportIconInner}>
                    {exporting ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      <Icon name="file-download-outline" size={20} color="#3B82F6" />
                    )}
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.exportTextWrap}>
                <Text style={[styles.exportTitle, { color: colors.textPrimary }]}>
                  {exporting ? 'Export en cours...' : 'Exporter en CSV'}
                </Text>
                <Text style={[styles.exportSub, { color: colors.textMuted }]}>Premium, Analytics ou Comptable</Text>
              </View>
              {!exporting && (
                <View style={[styles.exportChevron, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Icon name="chevron-right" size={18} color={colors.textMuted} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
        )}

        {/* ===== ACTIONS RAPIDES ===== */}
        {!isSuperviseur && (!isTabletArticle || !isTabletDecommissioned) && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.sectionAccent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{isPCArticle ? 'Actions PC' : 'Actions rapides'}</Text>
            </View>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.actionCard, quickActions.length === 1 && styles.actionCardSingle, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }, action.disabled && { opacity: 0.4 }]}
                  activeOpacity={0.7}
                  onPress={action.onPress}
                  disabled={action.disabled}
                >
                  <LinearGradient
                    colors={action.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.actionAccentStrip}
                  />
                  <View style={styles.actionIconWrap}>
                    <LinearGradient colors={action.gradient} style={styles.actionIconGrad}>
                      <View style={styles.actionIconInner}>
                        <Icon name={action.icon} size={20} color={action.gradient[0]} />
                      </View>
                    </LinearGradient>
                  </View>
                  <Text style={[styles.actionLabel, { color: action.gradient[0] }]}>{action.label}</Text>
                  {isPCArticle && action.disabled ? (
                    <Text style={[styles.actionHint, { color: colors.textMuted }]}>Actuel</Text>
                  ) : isTabletArticle && action.disabled ? (
                    <Text style={[styles.actionHint, { color: colors.textMuted }]}>Déjà fait</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {!isSuperviseur && isTabletArticle && isTabletDecommissioned && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={['#D97706', '#B45309']} style={styles.sectionAccent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Statut tablette</Text>
            </View>
            <View style={[styles.tabletStatusCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}> 
              <View style={styles.tabletStatusIconWrap}>
                <LinearGradient colors={['#D97706', '#B45309']} style={styles.tabletStatusIconGrad}>
                  <View style={styles.tabletStatusIconInner}>
                    <Icon name="check-decagram" size={18} color="#B45309" />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.tabletStatusTextWrap}>
                <Text style={[styles.tabletStatusTitle, { color: colors.textPrimary }]}>Tablette décommissionnée</Text>
                <Text style={[styles.tabletStatusSub, { color: colors.textMuted }]}>{tabletDecommissionDateText}</Text>
                <Text style={[styles.tabletStatusSub, { color: colors.textMuted }]}>Aucune action rapide disponible.</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ===== HISTORIQUE ===== */}
        {!isTabletArticle && (
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient colors={['#005C2B', '#007A39']} style={styles.sectionAccent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Historique</Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{historique.length}</Text>
          </View>

          {historique.length === 0 ? (
            <View style={[styles.emptyHistory, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <View style={styles.emptyIconWrap}>
                <LinearGradient colors={['#94A3B8', '#64748B']} style={styles.emptyIconGrad}>
                  <View style={styles.emptyIconInner}>
                    <Icon name="chart-timeline-variant" size={24} color="#94A3B8" />
                  </View>
                </LinearGradient>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aucun mouvement</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>L'historique apparaîtra ici</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {historique.slice(0, 5).map((m, idx) => {
                const cfg = TYPE_CFG[m.type] || TYPE_CFG.entree;
                const gradientColors = cfg.color === '#10B981' ? ['#10B981', '#059669']
                  : cfg.color === '#EF4444' ? ['#EF4444', '#DC2626']
                  : cfg.color === '#F59E0B' ? ['#F59E0B', '#D97706']
                  : ['#8B5CF6', '#6D28D9'];
                return (
                  <Animated.View
                    key={m.id}
                    entering={FadeInUp.delay(500 + idx * 60).duration(350)}
                    style={styles.tlItem}
                  >
                    <View style={styles.tlLeft}>
                      <LinearGradient colors={gradientColors} style={styles.tlDot}>
                        <Icon name={cfg.icon} size={10} color="#FFF" />
                      </LinearGradient>
                      {idx < Math.min(historique.length, 5) - 1 && (
                        <View style={[styles.tlLine, { backgroundColor: cfg.color + '20' }]} />
                      )}
                    </View>
                    <View style={[styles.tlCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                      <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.tlAccentStrip}
                      />
                      <View style={styles.tlCardContent}>
                        <View style={styles.tlCardTop}>
                          <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.tlBadge}
                          >
                            <Text style={styles.tlBadgeText}>{cfg.label}</Text>
                          </LinearGradient>
                          <Text style={[styles.tlTime, { color: colors.textMuted }]}>{formatTime(new Date(m.dateMouvement))}</Text>
                        </View>
                        <Text style={[styles.tlQty, { color: cfg.color }]}>
                          {cfg.prefix}{Math.abs(m.quantite)} unité{Math.abs(m.quantite) > 1 ? 's' : ''}
                        </Text>
                        <View style={styles.tlMeta}>
                          <Text style={[styles.tlMetaText, { color: colors.textMuted }]}>
                            {formatRelDate(new Date(m.dateMouvement))}
                          </Text>
                          {m.technicien && (
                            <>
                              <Text style={[styles.tlMetaSep, { color: colors.textMuted }]}>•</Text>
                              <Text style={[styles.tlMetaText, { color: colors.textMuted }]}>
                                {m.technicien.prenom} {m.technicien.nom?.charAt(0)}.
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ===== HEADER =====
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerTablet: {
    paddingBottom: 38,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  headerOverlayTablet: {
    backgroundColor: 'rgba(8,15,30,0.18)',
  },
  headerTabletOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -64,
    right: -50,
    backgroundColor: 'rgba(148,244,229,0.2)',
  },
  headerTabletOrbSecondary: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -46,
    left: -28,
    backgroundColor: 'rgba(15,23,42,0.2)',
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
    zIndex: 1,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  avatarWrapper: {
    marginBottom: 18,
    zIndex: 1,
  },
  avatarGlow: {
    borderRadius: 28,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.95)',
  },
  stockDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerInfo: {
    alignItems: 'center',
    zIndex: 1,
  },
  headerInfoTablet: {
    width: '100%',
    paddingHorizontal: 10,
  },
  headerTabletPanel: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  refBadgeTablet: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  refText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerTabletSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerPillText: {
    color: 'rgba(255,255,255,0.96)',
    fontSize: 11,
    fontWeight: '700',
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  // ===== STATS =====
  pcHeroWrap: {
    marginHorizontal: 16,
    marginTop: -22,
  },
  pcHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  pcHeroAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  pcHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  pcStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pcStatusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pcHeroMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pcHeroStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pcMiniPill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  pcMiniPillText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -22,
    gap: 10,
  },
  statsRowTablet: {
    marginHorizontal: 14,
    marginTop: -26,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  statCardTablet: {
    borderRadius: 18,
    paddingTop: 16,
  },
  statCardTopLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: 'rgba(15,118,110,0.22)',
  },
  statIconWrap: {
    marginBottom: 8,
  },
  statIconGrad: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  statIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  // ===== ALERT =====
  alertWrapper: { marginHorizontal: 16, marginTop: 16 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  alertAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  alertIconWrap: {
    marginLeft: 8,
    marginRight: 14,
  },
  alertIconGrad: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2.5,
  },
  alertIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700' },
  alertSub: { fontSize: 12, marginTop: 2 },

  // ===== SECTIONS =====
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // ===== INFO CARD =====
  infoCard: {
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardTablet: {
    borderRadius: 18,
    paddingTop: 6,
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  infoRowTablet: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600' },
  infoTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoTagText: { fontSize: 12, fontWeight: '700' },

  // ===== EXPORT =====
  exportCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  exportAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 18,
    gap: 14,
  },
  exportIconWrap: {},
  exportIconGrad: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2.5,
  },
  exportIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTextWrap: { flex: 1 },
  exportTitle: { fontSize: 15, fontWeight: '700' },
  exportSub: { fontSize: 12, marginTop: 2 },
  exportChevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== ACTIONS =====
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardSingle: {
    width: '100%',
  },
  actionAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  actionIconWrap: {
    marginBottom: 8,
  },
  actionIconGrad: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2.5,
  },
  actionIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '700' },
  actionHint: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tabletStatusCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tabletStatusIconWrap: {},
  tabletStatusIconGrad: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  tabletStatusIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletStatusTextWrap: {
    flex: 1,
  },
  tabletStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  tabletStatusSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },

  // ===== EMPTY =====
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 36,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconWrap: { marginBottom: 12 },
  emptyIconGrad: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  emptyIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 13, marginTop: 4 },

  // ===== TIMELINE =====
  timeline: { paddingLeft: 4 },
  tlItem: { flexDirection: 'row', marginBottom: 6 },
  tlLeft: { width: 28, alignItems: 'center' },
  tlDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tlLine: { flex: 1, width: 2, borderRadius: 1, marginTop: 4 },
  tlCard: {
    flex: 1,
    borderRadius: 14,
    marginLeft: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tlAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  tlCardContent: {
    padding: 12,
    paddingLeft: 14,
  },
  tlCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tlBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
  },
  tlBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  tlTime: { fontSize: 11 },
  tlQty: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  tlMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tlMetaText: { fontSize: 11 },
  tlMetaSep: { fontSize: 11 },
});

export default ArticleDetailScreen;
