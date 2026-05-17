import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { StatCard } from './StatCard';

interface StatsGridProps {
  totalArticles: number;
  articlesAlerte: number;
  mouvementsAujourdhui: number;
  mouvementsParJour: number[];
  onPressArticles: () => void;
  onPressAlertes: () => void;
  onPressMouvements: () => void;
}

const SHORT_DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const;

const StatsGridComponent: React.FC<StatsGridProps> = ({
  totalArticles,
  articlesAlerte,
  mouvementsAujourdhui,
  mouvementsParJour,
  onPressArticles,
  onPressAlertes,
  onPressMouvements,
}) => {
  const articlesSpark = useMemo(
    () => [
      Math.max(totalArticles - 2, 0),
      Math.max(totalArticles - 1, 0),
      totalArticles,
      Math.max(totalArticles - 1, 0),
      totalArticles,
      totalArticles,
      totalArticles + (articlesAlerte > 0 ? 0 : 1),
    ],
    [articlesAlerte, totalArticles],
  );

  const alertSpark = useMemo(
    () => [
      Math.max(articlesAlerte - 2, 0),
      Math.max(articlesAlerte - 1, 0),
      articlesAlerte,
      Math.max(articlesAlerte - 1, 0),
      articlesAlerte,
      articlesAlerte,
      articlesAlerte,
    ],
    [articlesAlerte],
  );

  const fullDailyCounts = useMemo(
    () => Array.from({ length: 7 }, (_, index) => mouvementsParJour[index] ?? 0),
    [mouvementsParJour],
  );

  const weekTimeline = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - index));
      return {
        label: SHORT_DAY_LABELS[d.getDay()],
        count: fullDailyCounts[index] ?? 0,
        isToday: d.toDateString() === now.toDateString(),
      };
    });
  }, [fullDailyCounts]);

  const mouvementsSpark = useMemo(
    () => weekTimeline.map((item) => item.count),
    [weekTimeline],
  );

  const dayLabels = useMemo(
    () => weekTimeline.map((item) => item.label),
    [weekTimeline],
  );

  const mouvementTrend = useMemo(() => {
    const today = fullDailyCounts[fullDailyCounts.length - 1] ?? 0;
    const yesterday = fullDailyCounts[fullDailyCounts.length - 2] ?? 0;

    if (yesterday === 0) {
      if (today === 0) {
        return {
          label: '0% vs hier',
          bg: OBSIDIAN_COLORS.info_subtle,
          color: OBSIDIAN_COLORS.info,
        };
      }

      return {
        label: '+100% vs hier',
        bg: OBSIDIAN_COLORS.green_subtle,
        color: OBSIDIAN_COLORS.green_light,
      };
    }

    const diffPct = Math.round(((today - yesterday) / yesterday) * 100);
    const sign = diffPct > 0 ? '+' : '';
    const isUp = diffPct >= 0;

    return {
      label: `${sign}${diffPct}% vs hier`,
      bg: isUp ? OBSIDIAN_COLORS.green_subtle : OBSIDIAN_COLORS.danger_subtle,
      color: isUp ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.danger,
    };
  }, [fullDailyCounts]);

  return (
    <View style={styles.container}>
      <View style={styles.gridTwoCols}>
        <StatCard
          icon="cube-outline"
          iconColor={OBSIDIAN_COLORS.green_light}
          iconBgColor={OBSIDIAN_COLORS.green_subtle}
          value={totalArticles}
          label="Articles en stock"
          trendLabel="↑ +1% vs hier"
          trendBgColor={OBSIDIAN_COLORS.green_subtle}
          trendTextColor={OBSIDIAN_COLORS.green_light}
          sparklineData={articlesSpark}
          sparklineColor={OBSIDIAN_COLORS.green_light}
          sparklineFillColor={OBSIDIAN_COLORS.green_light}
          onPress={onPressArticles}
        />

        <StatCard
          icon="alert-circle-outline"
          iconColor={OBSIDIAN_COLORS.danger}
          iconBgColor={OBSIDIAN_COLORS.danger_subtle}
          value={articlesAlerte}
          label="Alertes stock"
          sparklineData={alertSpark}
          sparklineColor={OBSIDIAN_COLORS.warning}
          sparklineFillColor={OBSIDIAN_COLORS.warning}
          onPress={onPressAlertes}
          tintedBackground={OBSIDIAN_COLORS.danger_subtle}
          badgeValue={articlesAlerte}
          badgeAnimated={articlesAlerte > 0}
        />
      </View>

      <View style={styles.fullCardWrap}>
        <StatCard
          icon="swap-vertical"
          iconColor={OBSIDIAN_COLORS.info}
          iconBgColor={OBSIDIAN_COLORS.info_subtle}
          value={mouvementsAujourdhui}
          label="Mouvements aujourd'hui"
          trendLabel={mouvementTrend.label}
          trendBgColor={mouvementTrend.bg}
          trendTextColor={mouvementTrend.color}
          sparklineData={mouvementsSpark}
          sparklineColor={OBSIDIAN_COLORS.info}
          sparklineFillColor={OBSIDIAN_COLORS.info}
          onPress={onPressMouvements}
          fullWidth
          highlightLastPoint
        />

        <View style={styles.dayLabels}>
          {dayLabels.map((day, index) => (
            <Text
              key={`${day}-${index}`}
              style={[
                styles.dayLabel,
                weekTimeline[index]?.isToday && styles.dayLabelActive,
              ]}
            >
              {day}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

export const StatsGrid = React.memo(StatsGridComponent);

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },
  gridTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  fullCardWrap: {
    marginTop: 12,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  dayLabel: {
    color: OBSIDIAN_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 12,
  },
});
