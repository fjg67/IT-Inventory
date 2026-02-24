// ============================================
// ARTICLES LIST SCREEN - Premium Redesign
// GestStock IT - Interface Premium Articles
// ============================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Vibration,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { debounce } from 'lodash';
import { useAppSelector } from '@/store';
import { articleRepository } from '@/database';
import { Article, ArticleFilters, PaginatedResult } from '@/types';
import { APP_CONFIG } from '@/constants';
import { premiumColors, premiumSpacing } from '@/constants/premiumTheme';
import { useResponsive } from '@/utils/responsive';

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
  EMPLACEMENT_OPTIONS,
} from '@/constants/articleFilterOptions';

export const ArticlesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const { isTablet, contentMaxWidth, rv } = useResponsive();
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
    typeArticle: null,
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

  // ===== LOAD STATS =====
  const loadStats = useCallback(async () => {
    if (!siteActif) return;
    try {
      const allResult = await articleRepository.findAll(siteActif.id, 0);
      const lowStock = await articleRepository.countLowStock(siteActif.id);
      setTotalArticles(allResult.total);
      setAlertes(lowStock);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  }, [siteActif]);

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

  // ===== LOAD ARTICLES =====
  const pageRef = useRef(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadArticles = useCallback(
    async (resetList = false, silent = false) => {
      if (!siteActif) {
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
          !!f.codeFamille ||
          !!f.famille ||
          !!f.typeArticle ||
          !!f.sousType ||
          !!f.marque ||
          !!f.emplacement;
        if (hasFilter) {
          result = await articleRepository.search(
            siteActif.id,
            f,
            currentPage,
          );
        } else {
          result = await articleRepository.findAll(siteActif.id, currentPage);
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
    [siteActif],
  );

  // Reload when filters change
  useEffect(() => {
    pageRef.current = 0;
    setPage(0);
    setHasMore(true);
    loadArticles(true);
  }, [filters, siteActif, loadArticles]);

  // Recharger articles et stats à chaque retour sur l'écran (données toujours à jour)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!siteActif) return;
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadStats();
      pageRef.current = 0;
      setPage(0);
      setHasMore(true);
      loadArticles(true, true);
    }, [siteActif, loadStats, loadArticles]),
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
      !!filters.codeFamille ||
      !!filters.famille ||
      !!filters.typeArticle ||
      !!filters.sousType ||
      !!filters.marque ||
      !!filters.emplacement,
    [filters, searchQuery],
  );

  const activeFiltersCount = useMemo(
    () =>
      [filters.codeFamille, filters.famille, filters.typeArticle, filters.sousType, filters.marque, filters.emplacement].filter(
        Boolean,
      ).length,
    [filters],
  );

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      searchQuery: '',
      categorieId: null,
      stockFaible: false,
      codeFamille: null,
      famille: null,
      typeArticle: null,
      sousType: null,
      marque: null,
      emplacement: null,
    });
    setSortBy('nom');
  }, []);

  const handleFilterSelect = useCallback((key: ArticleFilterKey, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setActiveFilterModal(null);
    setFiltersSheetVisible(true);
  }, []);

  const filterOptionsByKey = useMemo(() => {
    const toOptions = (items: { value: string; label: string }[]): FilterOption[] =>
      [{ id: null, label: 'Tous' }, ...items.map((i) => ({ id: i.value, label: i.label }))];
    return {
      codeFamille: [{ id: null, label: 'Tous' }, ...CODE_FAMILLE_OPTIONS.map((c) => ({ id: c, label: `Famille ${c}` }))],
      famille: toOptions(FAMILLE_OPTIONS),
      typeArticle: toOptions(TYPE_OPTIONS),
      sousType: toOptions(SOUS_TYPE_OPTIONS),
      marque: toOptions(MARQUE_OPTIONS),
      emplacement: toOptions(EMPLACEMENT_OPTIONS),
    };
  }, []);

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
      selectedValue: filters[activeFilterModal] ?? null,
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
      navigation.navigate('ArticleDetail', { articleId });
    },
    [navigation],
  );

  const handleAdd = useCallback(() => {
    navigation.navigate('ArticleEdit');
  }, [navigation]);

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
      filters.typeArticle ||
      filters.sousType ||
      filters.marque ||
      filters.emplacement
    )
      return 'no-filters' as const;
    return 'no-articles' as const;
  }, [searchQuery, filters]);

  const emptyAction = useMemo(() => {
    if (emptyType === 'no-results') return handleClearSearch;
    if (emptyType === 'no-filters') return resetFilters;
    return handleAdd;
  }, [emptyType, handleClearSearch, resetFilters, handleAdd]);

  // ===== RENDER =====
  const renderArticle = useCallback(
    ({ item }: { item: Article }) => (
      <View style={[styles.cardWrapper, isTablet && styles.cardWrapperTablet]}>
        <PremiumArticleCard article={item} onPress={handleArticlePress} />
      </View>
    ),
    [handleArticlePress, isTablet],
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
        onAction={emptyAction}
      />
    );
  }, [isLoading, emptyType, searchQuery, emptyAction]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={premiumColors.primary.base}
      />

      {/* Header Premium */}
      <PremiumArticleHeader
        totalArticles={totalArticles}
        stockOK={stockOK}
        alertes={alertes}
        onAdd={handleAdd}
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
        />
      </View>

      {/* Filters */}
      <FiltersPanel
        sortBy={sortBy}
        showStockFaible={filters.stockFaible}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
        onSortPress={() => setSortModalVisible(true)}
        onFiltersPress={() => setFiltersSheetVisible(true)}
        onStockFaibleToggle={toggleStockFaible}
        onReset={resetFilters}
      />

      {/* Articles List */}
      {isLoading ? (
        <SkeletonArticleList count={6} />
      ) : (
        <FlashList<Article>
          data={sortedArticles}
          keyExtractor={item => item.id.toString()}
          renderItem={renderArticle}
          numColumns={numColumns}
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
              tintColor={premiumColors.primary.base}
              colors={[premiumColors.primary.base]}
            />
          }
        />
      )}

      {/* FAB Multi-Action */}
      <FABMultiAction onScan={handleScan} onAdd={handleAdd} />

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
          selectedValue={activeFilterModalConfig.selectedValue}
          onSelect={(value) =>
            handleFilterSelect(activeFilterModalConfig.key, value as string | null)
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumColors.background,
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
});

export default ArticlesListScreen;
