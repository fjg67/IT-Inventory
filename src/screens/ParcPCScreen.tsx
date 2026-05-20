import React, { useMemo, useRef } from 'react';
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Article } from '@/types';
import { usePCFilters } from '@/hooks/usePCFilters';
import { usePCStats } from '@/hooks/usePCStats';
import { PCStateKey } from '@/constants/pcStates';
import ArticleEmptyState from '@/screens/Articles/components/ArticleEmptyState';
import SkeletonArticleList from '@/screens/Articles/components/SkeletonArticleList';
import {
  PCCard,
  PCFilterChips,
  PCHeader,
  PCModelsSection,
  PCRepartitionSection,
  PCSearchBar,
  PCStateGrid,
  PCTotalCard,
  PARC_PC_COLORS,
} from '@/components/parcpc';

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
  onDelete,
  onExportSentCsv,
  exportingSentCsv,
  weeklyTrendDelta,
  onScroll,
}) => {
  const listRef = useRef<FlashList<ParcPCListItem> | null>(null);
  const stats = usePCStats(articles, sentArticles, weeklyTrendDelta);
  const filters = usePCFilters(stats.allPCs);

  const listData = useMemo<ParcPCListItem[]>(() => {
    const items = filters.filtered;
    if (items.length === 0) {
      return [CONTROL_ITEM, EMPTY_ITEM];
    }
    return [CONTROL_ITEM, ...items];
  }, [filters.filtered]);

  const handleStateCardPress = (state: PCStateKey) => {
    filters.setOnlyState(state);
    listRef.current?.scrollToOffset({ offset: 320, animated: true });
  };

  const renderHeader = () => (
    <View style={styles.headerStack}>
      <PCHeader activeCount={stats.activeCount} trendLabel={stats.trendLabel} />
      <PCTotalCard total={stats.total} segments={stats.totalSegments.map((segment) => ({ ...segment, total: stats.total }))} />
      <PCStateGrid items={stats.stateCards} onPressState={handleStateCardPress} />
      <PCModelsSection items={stats.modelStats} />
      <PCRepartitionSection
        total={stats.total}
        agence={stats.repartition.agence}
        siege={stats.repartition.siege}
        agencePct={stats.repartition.agencePct}
        siegePct={stats.repartition.siegePct}
      />
    </View>
  );

  const renderItem = ({ item, index }: { item: ParcPCListItem; index: number }) => {
    if (isMarker(item)) {
      if (item.type === 'controls') {
        return (
          <View style={styles.stickyControls}>
            <PCSearchBar
              value={filters.query}
              onChangeText={filters.setQuery}
              onClear={() => filters.setQuery('')}
            />
            <PCFilterChips activeStates={filters.activeStates} counts={filters.countByState} onToggle={filters.toggleState} />
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

    const isSent = String(item.id).startsWith('sent-');
    return (
      <PCCard
        article={item}
        index={Math.max(0, index - 1)}
        onPress={isSent ? () => onSentArticlePress() : onArticlePress}
        onMarkSent={onMarkSent}
        onMarkHot={onMarkHot}
        onMarkAvailable={onMarkAvailable}
        onMarkProcessing={onMarkProcessing}
        onDelete={onDelete}
      />
    );
  };

  return (
    isLoading ? (
      <View style={styles.loadingWrap}>
        {renderHeader()}
        <View style={styles.stickyControls}>
          <PCSearchBar value={filters.query} onChangeText={filters.setQuery} onClear={() => filters.setQuery('')} />
          <PCFilterChips activeStates={filters.activeStates} counts={filters.countByState} onToggle={filters.toggleState} />
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
      stickyHeaderIndices={[0]}
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
    )
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
    backgroundColor: PARC_PC_COLORS.bg_primary,
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
