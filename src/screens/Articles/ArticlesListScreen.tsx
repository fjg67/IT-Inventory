// ============================================
// ARTICLES LIST SCREEN - Premium Redesign
// GestStock IT - Interface Premium Articles
// ============================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Vibration,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { debounce } from 'lodash';
import { useAppSelector } from '@/store';
import { selectIsSuperviseur } from '@/store/slices/authSlice';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { articleRepository, stockRepository } from '@/database';
import { Article, ArticleFilters, PaginatedResult } from '@/types';
import { APP_CONFIG } from '@/constants';
import { premiumSpacing } from '@/constants/premiumTheme';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';

// Composants premium
import PremiumArticleHeader from './components/PremiumArticleHeader';
import PremiumSearchBar from './components/PremiumSearchBar';
import FiltersPanel, { SortOption, SORT_LABELS } from './components/FiltersPanel';
import PremiumArticleCard from './components/PremiumArticleCard';
import SkeletonArticleList from './components/SkeletonArticleList';
import ArticleEmptyState from './components/ArticleEmptyState';
import FABMultiAction from './components/FABMultiAction';
import FilterModal, { FilterOption } from './components/FilterModal';
import ArticlesFilterSheet, { ArticleFilterKey } from './components/ArticlesFilterSheet';
import {
  CODE_FAMILLE_OPTIONS,
  FAMILLE_OPTIONS,
  TYPE_OPTIONS,
  SOUS_TYPE_OPTIONS,
  MARQUE_OPTIONS,
} from '@/constants/articleFilterOptions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Delete Modal Component
interface DeleteModalContentProps {
  colors: any;
  isDark: boolean;
  isDeleting: boolean;
  scaleAnim: Animated.Shared<number>;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteModalContent: React.FC<DeleteModalContentProps> = ({
  colors,
  isDark,
  isDeleting,
  scaleAnim,
  onCancel,
  onConfirm,
}) => {
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.deleteModalContent,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(0,122,57,0.2)' : 'rgba(0,122,57,0.15)',
        },
        scaleStyle,
      ]}
    >
      {/* Decorative Orbs */}
      <View pointerEvents="none" style={[styles.deleteOrbOne, { backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.1)' }]} />
      <View pointerEvents="none" style={[styles.deleteOrbTwo, { backgroundColor: isDark ? 'rgba(0,122,57,0.08)' : 'rgba(0,122,57,0.08)' }]} />

      {/* Icon */}
      <View style={[styles.deleteIconWrap, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2' }]}>
        <Icon name="trash-can-outline" size={32} color="#EF4444" />
      </View>

      {/* Title */}
      <Text style={[styles.deleteTitle, { color: colors.textPrimary }]}>
        Supprimer cette tablette ?
      </Text>

      {/* Message */}
      <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
        Cette action est définitive. La tablette sera supprimée de la base de données.
      </Text>

      {/* Action Buttons */}
      <View style={styles.deleteActionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isDeleting}
          onPress={onCancel}
          style={[
            styles.deleteBtn,
            styles.deleteBtnCancel,
            { backgroundColor: isDark ? 'rgba(100,116,139,0.12)' : '#F1F5F9', borderColor: isDark ? 'rgba(100,116,139,0.2)' : '#CBD5E1' }
          ]}
        >
          <Text style={[styles.deleteBtnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isDeleting}
          onPress={onConfirm}
          style={[styles.deleteBtn, styles.deleteBtnConfirm]}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.deleteBtnGradient}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Icon name="check-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.deleteBtnConfirmText}>Supprimer</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ArticlesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // DEBUG MASSIF
  console.log('=== [ArticlesListScreen] MOUNT ===');
  console.log('route:', route);
  console.log('route.name:', route.name);
  console.log('route.params:', route.params);
  console.log('route.params?.presetTypeArticle:', route.params?.presetTypeArticle);
  console.log('route.params?.lockPresetTypeArticle:', route.params?.lockPresetTypeArticle);
  console.log('route.params?.params:', route.params?.params);
  console.log('=== END DEBUG ===');
  
  const presetTypeArticle = route.params?.presetTypeArticle?.trim() || route.params?.params?.presetTypeArticle?.trim();
  const lockPresetTypeArticle = route.params?.lockPresetTypeArticle === true || route.params?.params?.lockPresetTypeArticle === true;
  const presetTypeValues = presetTypeArticle ? [presetTypeArticle] : null;
  const isTabletTab =
    lockPresetTypeArticle &&
    (presetTypeArticle ?? '').toLowerCase().trim() === 'tablette';

  // Debug logging
  useEffect(() => {
    console.log('[ArticlesListScreen] isTabletTab:', isTabletTab);
    console.log('[ArticlesListScreen] presetTypeArticle:', presetTypeArticle);
    console.log('[ArticlesListScreen] lockPresetTypeArticle:', lockPresetTypeArticle);
  }, [isTabletTab, presetTypeArticle, lockPresetTypeArticle]);
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const { isTablet, contentMaxWidth, rv } = useResponsive();
  const { colors, isDark } = useTheme();
  const numColumns = rv({ phone: 1, tablet: 2 });

  // ===== STATE =====
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filters, setFilters] = useState<ArticleFilters>({
    searchQuery: '',
    categorieId: null,
    stockFaible: route.params?.filter === 'lowStock',
    codeFamille: null,
    famille: null,
    typeArticle: presetTypeValues,
    sousType: null,
    marque: null,
    emplacement: null,
  });
  const [sortBy, setSortBy] = useState<SortOption>('nom');

  // Stats
  const [totalArticles, setTotalArticles] = useState(0);
  const [alertes, setAlertes] = useState(0);

  // Modals
    const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filtersSheetVisible, setFiltersSheetVisible] = useState(false);
  const [activeFilterModal, setActiveFilterModal] = useState<ArticleFilterKey | null>(null);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickHostname, setQuickHostname] = useState('');
  const [quickAsset, setQuickAsset] = useState('');
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scaleAnim = useSharedValue(0);

  // Emplacements dynamiques du site actif
  const [siteEmplacements, setSiteEmplacements] = useState<string[]>([]);

  // Calculer si le FAB doit être affiché
  const showFAB = useMemo(() => {
    // Strictement: afficher FAB SEULEMENT si ce n'est vraiment pas le mode Tablette
    const shouldShow = !isSuperviseur && (lockPresetTypeArticle !== true || (presetTypeArticle ?? '').toLowerCase().trim() !== 'tablette');
    console.log('[ArticlesListScreen.showFAB] DEBUG:', {
      shouldShow,
      isSuperviseur,
      lockPresetTypeArticle,
      presetTypeArticle,
      isTabletTab,
    });
    return shouldShow;
  }, [isSuperviseur, lockPresetTypeArticle, presetTypeArticle, isTabletTab]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const showQuickFeedback = useCallback(
    (type: 'success' | 'error', title: string, message: string) => {
      setQuickFeedback({ visible: true, type, title, message });

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      feedbackTimerRef.current = setTimeout(() => {
        setQuickFeedback((prev) => ({ ...prev, visible: false }));
      }, 2400);
    },
    [],
  );

  // ===== LOAD STATS =====
  const loadStats = useCallback(async () => {
    if (!effectiveSiteId) return;

    const baseTypeFilter = isTabletTab
      ? { typeArticle: [presetTypeArticle ?? 'Tablette'] }
      : {};

    try {
      const [allResult, lowStockResult, emplacements] = await Promise.all([
        isTabletTab
          ? articleRepository.search(
              effectiveSiteId,
              {
                searchQuery: '',
                categorieId: null,
                stockFaible: false,
                codeFamille: null,
                famille: null,
                sousType: null,
                marque: null,
                emplacement: null,
                ...baseTypeFilter,
              },
              0,
              1,
            )
          : articleRepository.findAll(effectiveSiteId, 0),
        isTabletTab
          ? articleRepository.search(
              effectiveSiteId,
              {
                searchQuery: '',
                categorieId: null,
                stockFaible: true,
                codeFamille: null,
                famille: null,
                sousType: null,
                marque: null,
                emplacement: null,
                ...baseTypeFilter,
              },
              0,
              1,
            )
          : articleRepository.countLowStock(effectiveSiteId),
        articleRepository.getDistinctEmplacements(effectiveSiteId),
      ]);

      const lowStock = typeof lowStockResult === 'number' ? lowStockResult : lowStockResult.total;
      setTotalArticles(allResult.total);
      setAlertes(lowStock);
      setSiteEmplacements(emplacements);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  }, [effectiveSiteId, isTabletTab, presetTypeArticle]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Appliquer le filtre "stock faible" quand on arrive depuis le tableau de bord (clic Alertes stock)
  useEffect(() => {
    if (route.params?.filter === 'lowStock') {
      setFilters((prev) => ({ ...prev, stockFaible: true }));
      setPage(0);
      setHasMore(true);
    }
  }, [route.params?.filter]);

  useEffect(() => {
    if (!presetTypeArticle) return;

    setFilters((prev) => ({
      ...prev,
      typeArticle: [presetTypeArticle],
    }));
    setPage(0);
    setHasMore(true);
  }, [presetTypeArticle]);

  // ===== LOAD ARTICLES =====
  const pageRef = useRef(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadArticles = useCallback(
    async (resetList = false, silent = false) => {
      if (!effectiveSiteId) {
        if (!silent) setIsLoading(false);
        return;
      }

      const currentPage = resetList ? 0 : pageRef.current;

      if (!silent) {
        if (resetList) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }
      }

      try {
        let result: PaginatedResult<Article>;
        const f = filtersRef.current;

        const hasFilter =
          f.searchQuery ||
          f.stockFaible ||
          (f.codeFamille && f.codeFamille.length > 0) ||
          (f.famille && f.famille.length > 0) ||
          (f.typeArticle && f.typeArticle.length > 0) ||
          (f.sousType && f.sousType.length > 0) ||
          (f.marque && f.marque.length > 0) ||
          (f.emplacement && f.emplacement.length > 0);
        if (hasFilter) {
          result = await articleRepository.search(
            effectiveSiteId,
            f,
            currentPage,
          );
        } else {
          result = await articleRepository.findAll(effectiveSiteId, currentPage);
        }

        if (resetList) {
          setArticles(result.data);
          pageRef.current = 1;
          setPage(1);
        } else {
          setArticles(prev => [...prev, ...result.data]);
          pageRef.current = currentPage + 1;
          setPage(currentPage + 1);
        }

        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Erreur chargement articles:', error);
      } finally {
        if (!silent) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveSiteId],
  );

  // Reload when filters change
  useEffect(() => {
    pageRef.current = 0;
    setPage(0);
    setHasMore(true);
    loadArticles(true);
  }, [filters, effectiveSiteId, loadArticles]);

  // Recharger articles et stats à chaque retour sur l'écran (données toujours à jour)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!effectiveSiteId) return;
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadStats();
      pageRef.current = 0;
      setPage(0);
      setHasMore(true);
      loadArticles(true, true);
    }, [effectiveSiteId, loadStats, loadArticles]),
  );

  // ===== SEARCH =====
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setFilters(prev => ({ ...prev, searchQuery: query }));
      }, APP_CONFIG.search.debounceDelay),
    [],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      debouncedSearch(text);
    },
    [debouncedSearch],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters(prev => ({ ...prev, searchQuery: '' }));
  }, []);

  // ===== FILTERS =====
  const toggleStockFaible = useCallback(() => {
    setFilters(prev => ({ ...prev, stockFaible: !prev.stockFaible }));
  }, []);

  const handleSortSelect = useCallback(
    (value: string | number | null) => {
      setSortBy((value as SortOption) || 'nom');
    },
    [],
  );

  const hasActiveFilters = useMemo(
    () =>
      filters.stockFaible ||
      searchQuery.length > 0 ||
      (filters.codeFamille && filters.codeFamille.length > 0) ||
      (filters.famille && filters.famille.length > 0) ||
      (!lockPresetTypeArticle && filters.typeArticle && filters.typeArticle.length > 0) ||
      (filters.sousType && filters.sousType.length > 0) ||
      (filters.marque && filters.marque.length > 0) ||
      (filters.emplacement && filters.emplacement.length > 0),
    [filters, searchQuery, lockPresetTypeArticle],
  );

  const activeFiltersCount = useMemo(
    () =>
      [
        filters.codeFamille,
        filters.famille,
        lockPresetTypeArticle ? null : filters.typeArticle,
        filters.sousType,
        filters.marque,
        filters.emplacement,
      ].filter(
        (v) => v && v.length > 0,
      ).length,
    [filters, lockPresetTypeArticle],
  );

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      searchQuery: '',
      categorieId: null,
      stockFaible: false,
      codeFamille: null,
      famille: null,
      typeArticle: lockPresetTypeArticle ? presetTypeValues : null,
      sousType: null,
      marque: null,
      emplacement: null,
    });
    setSortBy('nom');
  }, [lockPresetTypeArticle, presetTypeValues]);

  const handleFilterSelect = useCallback((key: ArticleFilterKey, values: string[]) => {
    if (lockPresetTypeArticle && key === 'typeArticle') {
      setActiveFilterModal(null);
      setFiltersSheetVisible(true);
      return;
    }

    setFilters((prev) => ({ ...prev, [key]: values.length > 0 ? values : null }));
    setActiveFilterModal(null);
    setFiltersSheetVisible(true);
  }, [lockPresetTypeArticle]);

  const filterOptionsByKey = useMemo(() => {
    const toOptions = (items: { value: string; label: string }[]): FilterOption[] =>
      [{ id: null, label: 'Tous' }, ...items.map((i) => ({ id: i.value, label: i.label }))];

    const tabletBrands = Array.from(
      new Set(
        articles
          .map((a) => a.marque?.trim())
          .filter((v): v is string => !!v),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const tabletBrandOptions: FilterOption[] = [
      { id: null, label: 'Tous' },
      ...tabletBrands.map((b) => ({ id: b, label: b })),
    ];

    return {
      codeFamille: [{ id: null, label: 'Tous' }, ...CODE_FAMILLE_OPTIONS.map((c) => ({ id: c, label: `Famille ${c}` }))],
      famille: toOptions(FAMILLE_OPTIONS),
      typeArticle: toOptions(TYPE_OPTIONS),
      sousType: toOptions(SOUS_TYPE_OPTIONS),
      marque: isTabletTab ? tabletBrandOptions : toOptions(MARQUE_OPTIONS),
      emplacement: [{ id: null, label: 'Tous' }, ...siteEmplacements.map((e) => ({ id: e, label: e }))],
    };
  }, [siteEmplacements, articles, isTabletTab]);

  const activeFilterModalConfig = useMemo(() => {
    if (!activeFilterModal) return null;
    const titles: Record<ArticleFilterKey, string> = {
      codeFamille: 'Code famille',
      famille: 'Famille',
      typeArticle: 'Type',
      sousType: 'Sous-type',
      marque: 'Marque',
      emplacement: 'Emplacement',
    };
    return {
      key: activeFilterModal,
      title: titles[activeFilterModal],
      options: filterOptionsByKey[activeFilterModal],
      selectedValues: filters[activeFilterModal] ?? [],
    };
  }, [activeFilterModal, filterOptionsByKey, filters]);

  // ===== SORT ARTICLES =====
  const sortedArticles = useMemo(() => {
    const sorted = [...articles];
    switch (sortBy) {
      case 'nom':
        return sorted.sort((a, b) => a.nom.localeCompare(b.nom));
      case 'reference':
        return sorted.sort((a, b) => a.reference.localeCompare(b.reference));
      case 'stock_asc':
        return sorted.sort(
          (a, b) => (a.quantiteActuelle ?? 0) - (b.quantiteActuelle ?? 0),
        );
      case 'stock_desc':
        return sorted.sort(
          (a, b) => (b.quantiteActuelle ?? 0) - (a.quantiteActuelle ?? 0),
        );
      case 'date':
        return sorted.sort(
          (a, b) =>
            new Date(b.dateModification).getTime() -
            new Date(a.dateModification).getTime(),
        );
      default:
        return sorted;
    }
  }, [articles, sortBy]);

  // ===== NAVIGATION =====
  const handleArticlePress = useCallback(
    (articleId: number) => {
      navigation.navigate('ArticleDetail', {
        articleId,
        sourceTab: isTabletTab ? 'Tablette' : 'Articles',
      });
    },
    [navigation, isTabletTab],
  );

  const handleDeleteTablet = useCallback(
    (articleId: number) => {
      setDeleteArticleId(articleId);
      setDeleteModalVisible(true);
      scaleAnim.value = withTiming(1, {
        duration: 400,
        easing: Easing.elastic(1.2),
      });
    },
    [scaleAnim],
  );

  const confirmDeleteTablet = useCallback(async () => {
    if (!deleteArticleId) return;

    console.log('[ArticlesListScreen.confirmDeleteTablet] Start delete for id:', deleteArticleId);
    setIsDeleting(true);
    try {
      const idStr = String(deleteArticleId);
      console.log('[ArticlesListScreen.confirmDeleteTablet] Converting to string:', idStr);
      
      // Supprimer en base
      await articleRepository.delete(idStr);
      console.log('[ArticlesListScreen.confirmDeleteTablet] Delete succeeded');
      
      // Retirer immédiatement de l'état local pour voir l'effet visuel
      setArticles((prevArticles) =>
        prevArticles.filter((a) => a.id !== deleteArticleId)
      );
      
      // Mettre à jour les stats
      setTotalArticles((prev) => Math.max(0, prev - 1));
      
      // Fermer la modale
      setDeleteModalVisible(false);
      scaleAnim.value = 0;
      setDeleteArticleId(null);
      
      // Afficher feedback positif
      showQuickFeedback('success', 'Succès', 'Tablette supprimée avec succès');
    } catch (err: any) {
      console.error('[ArticlesListScreen.confirmDeleteTablet] Error:', err);
      const errorMsg = err?.message || 'Impossible de supprimer la tablette';
      showQuickFeedback('error', 'Erreur', errorMsg);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteArticleId, scaleAnim]);

  const cancelDeleteTablet = useCallback(() => {
    scaleAnim.value = withTiming(0, {
      duration: 200,
      easing: Easing.ease,
    });
    setTimeout(() => {
      setDeleteModalVisible(false);
      setDeleteArticleId(null);
    }, 200);
  }, [scaleAnim]);

  const handleAdd = useCallback(() => {
    if (isTabletTab) {
      setQuickAddVisible(true);
      return;
    }

    navigation.navigate('ArticleEdit');
  }, [navigation, isTabletTab]);

  const handleQuickAddTablet = useCallback(async () => {
    const hostname = quickHostname.trim();
    const asset = quickAsset.trim();

    if (!hostname) {
      Alert.alert('Champ requis', 'Le hostname de la tablette est obligatoire.');
      return;
    }
    if (!effectiveSiteId) {
      Alert.alert('Site manquant', 'Aucun site actif sélectionné.');
      return;
    }

    setIsQuickSaving(true);
    try {
      const normalizedHostname = hostname.toUpperCase();
      const description = asset ? `Asset: ${asset}` : undefined;
      const tabletteFamille = 'Tablette';
      const tabletteCodeFamille = '50';
      const existing = await articleRepository.findByReference(normalizedHostname);

      let articleId: string | number;

      if (existing) {
        articleId = existing.id;
        await articleRepository.update(existing.id, {
          nom: normalizedHostname,
          description,
          codeFamille: tabletteCodeFamille,
          famille: tabletteFamille,
          typeArticle: presetTypeArticle ?? 'Tablette',
          sousType: 'Tablette',
          marque: 'Samsung',
          stockMini: 0,
          unite: 'unité',
        });
      } else {
        articleId = await articleRepository.create({
          reference: normalizedHostname,
          nom: normalizedHostname,
          description,
          codeFamille: tabletteCodeFamille,
          famille: tabletteFamille,
          typeArticle: presetTypeArticle ?? 'Tablette',
          sousType: 'Tablette',
          marque: 'Samsung',
          stockMini: 0,
          unite: 'unité',
        });
      }

      await stockRepository.createOrUpdate(articleId, effectiveSiteId, 1);

      setQuickHostname('');
      setQuickAsset('');
      setQuickAddVisible(false);

      pageRef.current = 0;
      setPage(0);
      setHasMore(true);
      await Promise.all([loadArticles(true), loadStats()]);
      showQuickFeedback(
        'success',
        'Synchronisation OK',
        existing
          ? 'Tablette mise à jour en base et stock synchronisé.'
          : 'Tablette ajoutée en base et stock mis à jour.',
      );
    } catch (error) {
      console.error('Erreur ajout tablette:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      showQuickFeedback('error', 'Echec de synchronisation', `Impossible d'ajouter la tablette. ${message}`);
    } finally {
      setIsQuickSaving(false);
    }
  }, [
    quickHostname,
    quickAsset,
    effectiveSiteId,
    presetTypeArticle,
    loadArticles,
    loadStats,
    showQuickFeedback,
  ]);

  const handleScan = useCallback(() => {
    navigation.navigate('Scan');
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadArticles(false);
    }
  }, [isLoadingMore, hasMore, loadArticles]);

  const handleRefresh = useCallback(async () => {
    Vibration.vibrate(10);
    setRefreshing(true);
    pageRef.current = 0;
    setPage(0);
    setHasMore(true);
    await loadArticles(true);
    await loadStats();
    setRefreshing(false);
  }, [loadArticles, loadStats]);

  // ===== MODAL OPTIONS =====
  const sortOptions = useMemo<FilterOption[]>(
    () =>
      Object.entries(SORT_LABELS).map(([key, label]) => ({
        id: key,
        label,
      })),
    [],
  );

  // ===== EMPTY STATE TYPE =====
  const emptyType = useMemo(() => {
    if (searchQuery.length > 0) return 'no-results' as const;
    if (
      filters.stockFaible ||
      filters.codeFamille ||
      filters.famille ||
      (!lockPresetTypeArticle && filters.typeArticle) ||
      filters.sousType ||
      filters.marque ||
      filters.emplacement
    )
      return 'no-filters' as const;
    return 'no-articles' as const;
  }, [searchQuery, filters, lockPresetTypeArticle]);

  const emptyAction = useMemo(() => {
    if (emptyType === 'no-results') return handleClearSearch;
    if (emptyType === 'no-filters') return resetFilters;
    return handleAdd;
  }, [emptyType, handleClearSearch, resetFilters, handleAdd]);

  // ===== RENDER =====
  const renderArticle = useCallback(
    ({ item }: { item: Article }) => (
      <View style={[styles.cardWrapper, isTablet && styles.cardWrapperTablet]}>
        <PremiumArticleCard 
          article={item} 
          onPress={handleArticlePress}
          onDelete={isTabletTab ? handleDeleteTablet : undefined}
        />
      </View>
    ),
    [handleArticlePress, isTabletTab, handleDeleteTablet, isTablet],
  );

  const stockOK = useMemo(
    () => Math.max(0, totalArticles - alertes),
    [totalArticles, alertes],
  );

  const renderFooter = useCallback(() => {
    return <View style={styles.listBottomSpacer} />;
  }, []);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <ArticleEmptyState
        type={emptyType}
        searchQuery={searchQuery}
        onAction={isTabletTab ? undefined : emptyAction}
        mode={isTabletTab ? 'tablettes' : 'articles'}
      />
    );
  }, [isLoading, emptyType, searchQuery, emptyAction, isTabletTab]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />

      {/* Header Premium */}
      <PremiumArticleHeader
        title={isTabletTab ? 'Tablettes' : 'Articles'}
        statsMode={isTabletTab ? 'totalOnly' : 'full'}
        totalArticles={totalArticles}
        stockOK={stockOK}
        alertes={alertes}
        onAdd={handleAdd}
        onTotalPress={resetFilters}
        onStockOKPress={
          isTabletTab
            ? undefined
            : () => {
                if (filters.stockFaible) {
                  setFilters(prev => ({ ...prev, stockFaible: false }));
                }
              }
        }
        onAlertesPress={
          isTabletTab
            ? undefined
            : () => {
                setFilters(prev => ({ ...prev, stockFaible: !prev.stockFaible }));
              }
        }
      />

      {/* Search Bar */}
      <View style={[
        styles.searchWrapper,
        contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : {},
      ]}>
        <PremiumSearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          onClear={handleClearSearch}
          placeholder={isTabletTab ? 'Rechercher par hostname ou asset...' : 'Rechercher par référence ou nom...'}
        />
      </View>

      {/* Filters */}
      <FiltersPanel
        sortBy={sortBy}
        showStockFaible={filters.stockFaible}
        showStockFaibleChip={!isTabletTab}
        filtersLabel={isTabletTab ? 'Filtres tablette' : 'Filtres'}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
        onSortPress={() => setSortModalVisible(true)}
        onFiltersPress={() => setFiltersSheetVisible(true)}
        onStockFaibleToggle={toggleStockFaible}
        onReset={resetFilters}
      />

      {/* Articles List */}
      <View style={styles.listContainer}>
      {isLoading ? (
        <SkeletonArticleList count={6} />
      ) : (
        <FlashList<Article>
          data={sortedArticles}
          keyExtractor={item => item.id.toString()}
          renderItem={renderArticle}
          numColumns={numColumns}
          estimatedItemSize={140}
          contentContainerStyle={[
            styles.listContent,
            contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : {},
          ] as any}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
      </View>

      {/* Bouton Ajouter Tablette - UNIQUEMENT en mode Tablette */}
      {!isSuperviseur && isTabletTab && (
        <View style={styles.tabletteAddFabWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAdd}
            style={styles.tabletteAddFab}
          >
            <LinearGradient
              colors={['#007A39', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabletteAddFabGradient}
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.tabletteAddFabText}>Ajouter une tablette</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB Multi-Action – MASQUÉ en mode Tablette */}
      {showFAB && (
        <FABMultiAction onScan={handleScan} onAdd={handleAdd} />
      )}

      {/* Modals */}
      <ArticlesFilterSheet
        visible={filtersSheetVisible}
        filterValues={{
          codeFamille: filters.codeFamille ?? null,
          famille: filters.famille ?? null,
          typeArticle: filters.typeArticle ?? null,
          sousType: filters.sousType ?? null,
          marque: filters.marque ?? null,
          emplacement: filters.emplacement ?? null,
        }}
        allowedKeys={isTabletTab ? ['marque', 'emplacement'] : undefined}
        onClose={() => setFiltersSheetVisible(false)}
        onSelectRow={(key) => {
          setFiltersSheetVisible(false);
          setActiveFilterModal(key);
        }}
      />
      {activeFilterModalConfig && (
        <FilterModal
          visible={!!activeFilterModal}
          title={activeFilterModalConfig.title}
          options={activeFilterModalConfig.options}
          multiSelect
          selectedValues={activeFilterModalConfig.selectedValues as string[]}
          onSelectMulti={(values) =>
            handleFilterSelect(activeFilterModalConfig.key, values)
          }
          onClose={() => {
            setActiveFilterModal(null);
            setFiltersSheetVisible(true);
          }}
        />
      )}
      <FilterModal
        visible={sortModalVisible}
        title="Trier par"
        options={sortOptions}
        selectedValue={sortBy}
        onSelect={handleSortSelect}
        onClose={() => setSortModalVisible(false)}
      />

      <Modal
        visible={quickAddVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isQuickSaving) setQuickAddVisible(false);
        }}
      >
        <View style={styles.quickModalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.quickModalKeyboardWrapper}
          >
            <View style={[styles.quickModalCard, { backgroundColor: colors.surface }]}> 
              <View pointerEvents="none" style={styles.quickDecoOrbOne} />
              <View pointerEvents="none" style={styles.quickDecoOrbTwo} />

              <LinearGradient
                colors={['#0F172A', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabletHero}
              >
                <View style={styles.tabletHeroGlow} />
                <View style={styles.tabletMockup}>
                  <View style={styles.tabletBezel}>
                    <LinearGradient
                      colors={['#0B1220', '#1B2433']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.tabletScreen}
                    >
                      <Icon name="tablet-dashboard" size={34} color="#22D3EE" />
                    </LinearGradient>
                    <View style={styles.tabletCameraDot} />
                  </View>
                </View>
                <View style={styles.tabletHeroTextWrap}>
                  <Text style={styles.tabletHeroBrand}>Samsung</Text>
                  <Text style={styles.tabletHeroModel}>Galaxy Tab</Text>
                </View>
              </LinearGradient>

              <View style={styles.quickMetaRow}>
                <View style={[styles.quickMetaPill, { backgroundColor: 'rgba(0,122,57,0.12)' }]}>
                  <Icon name="shield-check-outline" size={13} color="#007A39" />
                  <Text style={styles.quickMetaPillText}>Ajout sécurisé</Text>
                </View>
                <View style={[styles.quickMetaPill, { backgroundColor: 'rgba(14,165,233,0.12)' }]}>
                  <Icon name="database-sync-outline" size={13} color="#0369A1" />
                  <Text style={[styles.quickMetaPillText, { color: '#0369A1' }]}>Synchro stock</Text>
                </View>
              </View>

              <Text style={[styles.quickModalTitle, { color: colors.textPrimary }]}>Ajouter une tablette</Text>
              <Text style={[styles.quickModalSubtitle, { color: colors.textSecondary }]}>Hostname obligatoire, Asset optionnel</Text>

              <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Hostname</Text>
              <View style={[
                styles.quickInputRow,
                { borderColor: colors.borderSubtle, backgroundColor: colors.backgroundSubtle },
              ]}>
                <View style={styles.quickInputIconWrap}>
                  <Icon name="laptop" size={16} color="#007A39" />
                </View>
                <TextInput
                  value={quickHostname}
                  onChangeText={setQuickHostname}
                  editable={!isQuickSaving}
                  placeholder="Ex: TC22-STRAS-014"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.quickInput,
                    { color: colors.textPrimary },
                  ]}
                />
              </View>
              <Text style={[styles.quickHint, { color: colors.textMuted }]}>Exemple: code parc ou hostname MDM</Text>

              <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Asset (optionnel)</Text>
              <View style={[
                styles.quickInputRow,
                { borderColor: colors.borderSubtle, backgroundColor: colors.backgroundSubtle },
              ]}>
                <View style={styles.quickInputIconWrap}>
                  <Icon name="tag-outline" size={16} color="#007A39" />
                </View>
                <TextInput
                  value={quickAsset}
                  onChangeText={setQuickAsset}
                  editable={!isQuickSaving}
                  placeholder="Ex: AST-001245"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[
                    styles.quickInput,
                    { color: colors.textPrimary },
                  ]}
                />
              </View>

              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isQuickSaving}
                  onPress={() => setQuickAddVisible(false)}
                  style={[styles.quickBtn, styles.quickBtnGhost, { borderColor: colors.borderSubtle, backgroundColor: colors.backgroundSubtle }]}
                >
                  <Text style={[styles.quickBtnGhostText, { color: colors.textSecondary }]}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isQuickSaving}
                  onPress={handleQuickAddTablet}
                  style={[styles.quickBtn, styles.quickBtnPrimary]}
                >
                  <LinearGradient
                    colors={['#007A39', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickBtnPrimaryGradient}
                  >
                    {isQuickSaving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="content-save-check-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.quickBtnPrimaryText}>Enregistrer</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={quickFeedback.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickFeedback((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.feedbackOverlay} pointerEvents="box-none">
          <View style={styles.feedbackWrap}>
            <LinearGradient
              colors={
                quickFeedback.type === 'success'
                  ? ['#064E3B', '#065F46']
                  : ['#7F1D1D', '#991B1B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.feedbackCard}
            >
              <View style={styles.feedbackRow}>
                <View
                  style={[
                    styles.feedbackIconBubble,
                    {
                      backgroundColor:
                        quickFeedback.type === 'success'
                          ? 'rgba(16,185,129,0.26)'
                          : 'rgba(239,68,68,0.26)',
                    },
                  ]}
                >
                  <Icon
                    name={quickFeedback.type === 'success' ? 'check-decagram' : 'alert-octagon'}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.feedbackTextCol}>
                  <Text style={styles.feedbackTitle}>{quickFeedback.title}</Text>
                  <Text style={styles.feedbackMessage}>{quickFeedback.message}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal - Premium & Magical */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDeleteTablet}
      >
        <View style={[styles.deleteModalBackdrop, { backgroundColor: isDark ? 'rgba(5,5,10,0.85)' : 'rgba(0,0,0,0.7)' }]}>
          <DeleteModalContent
            colors={colors}
            isDark={isDark}
            isDeleting={isDeleting}
            scaleAnim={scaleAnim}
            onCancel={cancelDeleteTablet}
            onConfirm={confirmDeleteTablet}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: premiumSpacing.lg,
    paddingTop: premiumSpacing.md,
  },
  listContent: {
    paddingHorizontal: premiumSpacing.lg,
    paddingTop: premiumSpacing.sm,
    paddingBottom: 100, // Espace pour le FAB
  },
  cardWrapper: {},
  cardWrapperTablet: {
    flex: 1,
    paddingHorizontal: premiumSpacing.xs,
  },
  footerLoader: {
    paddingVertical: premiumSpacing.xl,
    alignItems: 'center',
  },
  listBottomSpacer: {
    height: 80,
  },
  quickModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    paddingHorizontal: premiumSpacing.lg,
  },
  quickModalKeyboardWrapper: {
    width: '100%',
  },
  quickModalCard: {
    borderRadius: 18,
    padding: premiumSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  quickDecoOrbOne: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -54,
    right: -42,
    backgroundColor: 'rgba(0,122,57,0.08)',
  },
  quickDecoOrbTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    bottom: -32,
    left: -26,
    backgroundColor: 'rgba(14,165,233,0.08)',
  },
  tabletHero: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: premiumSpacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  tabletHeroGlow: {
    position: 'absolute',
    right: -22,
    top: -18,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34,211,238,0.22)',
  },
  tabletMockup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletBezel: {
    width: 130,
    height: 86,
    borderRadius: 12,
    backgroundColor: '#020617',
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletScreen: {
    flex: 1,
    width: '100%',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletCameraDot: {
    position: 'absolute',
    top: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
  },
  tabletHeroTextWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  tabletHeroBrand: {
    color: '#E2E8F0',
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  tabletHeroModel: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  quickMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: premiumSpacing.sm,
  },
  quickMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  quickMetaPillText: {
    color: '#007A39',
    fontSize: 12,
    fontWeight: '700',
  },
  quickModalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  quickModalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    marginBottom: premiumSpacing.md,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: premiumSpacing.sm,
    marginBottom: 6,
  },
  quickInputRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickInputIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0,122,57,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  quickHint: {
    fontSize: 11,
    marginTop: 5,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: premiumSpacing.sm,
    marginTop: premiumSpacing.lg,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnGhost: {
    borderWidth: 1,
  },
  quickBtnPrimary: {
    paddingVertical: 0,
    overflow: 'hidden',
  },
  quickBtnPrimaryGradient: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickBtnGhostText: {
    fontWeight: '700',
    fontSize: 14,
  },
  quickBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  feedbackOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: premiumSpacing.lg,
    paddingBottom: 120,
  },
  feedbackWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 14,
  },
  feedbackCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedbackIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTextCol: {
    flex: 1,
  },
  feedbackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackMessage: {
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  tabletteAddFabWrap: {
    position: 'absolute',
    right: premiumSpacing.lg,
    bottom: 22,
    zIndex: 10,
  },
  tabletteAddFab: {
    overflow: 'hidden',
    borderRadius: 14,
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tabletteAddFabGradient: {
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
  },
  tabletteAddFabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  // Delete Modal Styles
  deleteModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '85%',
    maxWidth: 360,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  deleteOrbOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -60,
    right: -40,
  },
  deleteOrbTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    bottom: -30,
    left: -35,
  },
  deleteIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EF4444' + '30',
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  deleteMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  deleteActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteBtn: {
    flex: 1,
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnCancel: {
    borderWidth: 1,
  },
  deleteBtnCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtnConfirm: {
    paddingVertical: 0,
    overflow: 'hidden',
  },
  deleteBtnGradient: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ArticlesListScreen;
