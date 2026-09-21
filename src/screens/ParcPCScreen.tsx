import React, { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Article } from '@/types';
import { usePCFilters } from '@/hooks/usePCFilters';
import { useRenamePC } from '@/hooks/useRenamePC';
import { usePCStats } from '@/hooks/usePCStats';
import { PCStateKey } from '@/constants/pcStates';
import ArticleEmptyState from '@/screens/Articles/components/ArticleEmptyState';
import SkeletonArticleList from '@/screens/Articles/components/SkeletonArticleList';
import {
  PARC_PC_COLORS,
  PCRenameModal,
} from '@/components/parcpc';
import { CAPCCard } from '@/components/parcpc/CAPCCard';
import { CAParcPCHeader } from '@/components/parcpc/CAParcPCHeader';
import { CAParcPCSearchBar } from '@/components/parcpc/CAParcPCSearchBar';
import { CAParcPCStatGrid } from '@/components/parcpc/CAParcPCStatGrid';
import { CAParcPCHeroCard } from '@/components/parcpc/CAParcPCHeroCard';
import { CA_THEME } from '@/constants/caTheme';

type ControlItem = { type: 'controls'; id: string };
type EmptyItem = { type: 'empty'; id: string };
type ParcPCListItem = Article | ControlItem | EmptyItem;

interface ParcPCScreenProps {
  articles: Article[];
  sentArticles: Article[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  onArticlePress: (articleId: number) => void;
  onSentArticlePress: () => void;
  onMarkSent: (articleId: number | string) => void;
  onMarkHot: (articleId: number | string) => void;
  onMarkAvailable: (articleId: number | string) => void;
  onMarkProcessing: (articleId: number | string) => void;
  onMarkBreakdown?: (articleId: number | string) => void;
  onResolveBreakdown?: (articleId: number | string) => void;
  onDelete: (articleId: number | string) => void;
  onExportSentCsv: () => void;
  exportingSentCsv: boolean;
  weeklyTrendDelta: number;
  onScroll: (event: any) => void;
}

const CONTROL_ITEM: ControlItem = { type: 'controls', id: 'controls' };
const EMPTY_ITEM: EmptyItem = { type: 'empty', id: 'empty' };

const isMarker = (item: ParcPCListItem): item is ControlItem | EmptyItem => 'type' in item;

export const ParcPCScreen: React.FC<ParcPCScreenProps> = ({
  articles,
  sentArticles,
  isLoading,
  refreshing,
  onRefresh,
  onEndReached,
  onArticlePress,
  onSentArticlePress,
  onMarkSent,
  onMarkHot,
  onMarkAvailable,
  onMarkProcessing,
  onMarkBreakdown,
  onResolveBreakdown,
  onDelete,
  onExportSentCsv,
  exportingSentCsv,
  weeklyTrendDelta,
  onScroll,
}) => {
  const listRef = useRef<FlashList<ParcPCListItem> | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const stats = usePCStats(articles, sentArticles, weeklyTrendDelta);
  const filters = usePCFilters(stats.allPCs);
  const { pcToRename, openRenameModal, closeRenameModal, handleRenameSuccess } = useRenamePC(() => {
    onRefresh();
  });

  const listData = useMemo<ParcPCListItem[]>(() => {
    const items = filters.filtered;
    if (items.length === 0) {
      return [CONTROL_ITEM, EMPTY_ITEM];
    }
    return [CONTROL_ITEM, ...items];
  }, [filters.filtered]);

  const modelStatsForSelection = useMemo(() => {
    const modelCounts = new Map<string, number>();

    for (const article of filters.filtered) {
      const model = (article.modele ?? '').trim() || 'Sans modèle';
      modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
    }

    return [...modelCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
      .map(([label, count]) => ({ label, count }));
  }, [filters.filtered]);

  const handleStateCardPress = useCallback((state: PCStateKey) => {
    filters.setOnlyState(state);
    const targetOffset = Math.max(0, headerHeight - 110);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: targetOffset, animated: true });
    });
  }, [filters, headerHeight]);

  const renderHeader = () => (
    <View
      style={styles.headerStack}
      onLayout={(event) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        if (nextHeight > 0 && nextHeight !== headerHeight) {
          setHeaderHeight(nextHeight);
        }
      }}
    >
      <CAParcPCHeader activeCount={stats.activeCount} vsLastWeek={weeklyTrendDelta} />
      <View style={{ paddingTop: 12 }}>
        <CAParcPCHeroCard totalCount={stats.total} counts={filters.countByState as any} />
      </View>
      <CAParcPCStatGrid
        counts={filters.countByState as any}
        activeFilter={filters.activeStates.length === 1 ? filters.activeStates[0] as any : null}
        onFilterChange={(status) => {
          if (status) filters.setOnlyState(status as any);
          else filters.clearStates();
        }}
      />
    </View>
  );

  const renderItem = ({ item, index }: { item: ParcPCListItem; index: number }) => {
    if (isMarker(item)) {
      if (item.type === 'controls') {
        return (
          <View style={styles.stickyControls}>
            <CAParcPCSearchBar
              query={filters.query}
              onQueryChange={filters.setQuery}
              onClear={() => filters.setQuery('')}
              statusCounts={filters.countByState as any}
              activeStatus={filters.activeStates.length === 1 ? filters.activeStates[0] as any : null}
              onStatusChange={(status) => {
                if (status) filters.setOnlyState(status as any);
                else filters.clearStates();
              }}
            />
            {filters.activeStates.includes('envoye') ? (
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={onExportSentCsv}
                disabled={exportingSentCsv}
                style={styles.exportButton}
              >
                <Icon name={exportingSentCsv ? 'loading' : 'file-delimited-outline'} size={16} color={PARC_PC_COLORS.green_light} />
                <Text style={styles.exportText}>{exportingSentCsv ? 'Export CSV en cours...' : 'Exporter les PC envoyes'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      }

      return (
        <View style={styles.emptyWrap}>
          <ArticleEmptyState
            type={filters.query.trim().length > 0 || filters.activeStates.length > 0 ? 'no-results' : 'no-articles'}
            searchQuery={filters.query}
            onAction={filters.clearAll}
            mode="pc"
          />
        </View>
      );
    }

    return (
      <CAPCCard
        article={item}
        onRename={openRenameModal}
        onBreakdown={onMarkBreakdown as any}
        onResolve={onResolveBreakdown as any}
        onPress={() => onArticlePress(item.id)}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: CA_THEME.lightGray }}>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          {renderHeader()}
          <View style={styles.stickyControls}>
            <CAParcPCSearchBar
              query={filters.query}
              onQueryChange={filters.setQuery}
              onClear={() => filters.setQuery('')}
              statusCounts={filters.countByState as any}
              activeStatus={filters.activeStates.length === 1 ? filters.activeStates[0] as any : null}
              onStatusChange={(status) => {
                if (status) filters.setOnlyState(status as any);
                else filters.clearStates();
              }}
            />
          </View>
          <SkeletonArticleList count={6} />
        </View>
      ) : (
        <FlashList<ParcPCListItem>
          ref={listRef}
          data={listData}
          keyExtractor={(item) => (isMarker(item) ? item.id : String(item.id))}
          renderItem={renderItem}
          estimatedItemSize={116}
          initialNumToRender={10}
          maxToRenderPerBatch={6}
          windowSize={8}
          removeClippedSubviews
          ListHeaderComponent={renderHeader}
          ListHeaderComponentStyle={styles.headerWrap}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PARC_PC_COLORS.green_light}
              colors={[PARC_PC_COLORS.green_light]}
            />
          }
          ListFooterComponent={<View style={styles.footer} />}
        />
      )}

      {pcToRename ? (
        <PCRenameModal
          pc={pcToRename}
          onClose={closeRenameModal}
          onSuccess={handleRenameSuccess}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  headerWrap: {
    paddingTop: 8,
    paddingBottom: 18,
  },
  headerStack: {
    gap: 16,
  },
  stickyControls: {
    marginBottom: 12,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 12,
    backgroundColor: CA_THEME.lightGray,
  },
  exportButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PARC_PC_COLORS.bg_card,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.border_card,
  },
  exportText: {
    color: PARC_PC_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingTop: 28,
  },
  footer: {
    height: 20,
  },
  loadingWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
});
