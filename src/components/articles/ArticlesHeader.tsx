import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { ArticleStatCard } from './ArticleStatCard';
import { AvailabilityBar } from './AvailabilityBar';

interface ArticlesHeaderProps {
  totalArticles: number;
  stockOk: number;
  alertes: number;
  onTotalPress: () => void;
  onStockOKPress: () => void;
  onAlertesPress: () => void;
}

const ArticlesHeaderComponent: React.FC<ArticlesHeaderProps> = ({
  totalArticles,
  stockOk,
  alertes,
  onTotalPress,
  onStockOKPress,
  onAlertesPress,
}) => {
  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.iconCircle}>
          <Icon name="cube-outline" size={18} color={OBSIDIAN_COLORS.green_light} />
        </View>

        <Text style={styles.title}>Articles</Text>

        <View style={styles.pillCount}>
          <Text style={styles.pillCountText}>{`${totalArticles} articles`}</Text>
        </View>
      </View>

      <View style={styles.updatedPill}>
        <View style={styles.dot} />
        <Text style={styles.updatedText}>Mis a jour il y a 2 min</Text>
      </View>

      <View style={styles.statsRow}>
        <ArticleStatCard
          icon="cube-outline"
          value={totalArticles}
          label="TOTAL"
          caption="Tous"
          color={OBSIDIAN_COLORS.green_light}
          subtle={OBSIDIAN_COLORS.green_subtle}
          onPress={onTotalPress}
        />
        <ArticleStatCard
          icon="check-circle-outline"
          value={stockOk}
          label="STOCK OK"
          caption="Dispo"
          color={OBSIDIAN_COLORS.green_light}
          subtle={OBSIDIAN_COLORS.green_subtle}
          onPress={onStockOKPress}
        />
        <ArticleStatCard
          icon="alert-circle-outline"
          value={alertes}
          label="ALERTES"
          caption="Critique"
          color={OBSIDIAN_COLORS.warning}
          subtle={OBSIDIAN_COLORS.warning_subtle}
          onPress={onAlertesPress}
        />
      </View>

      <AvailabilityBar total={totalArticles} stockOk={stockOk} alertes={alertes} />
    </Animated.View>
  );
};

export const ArticlesHeader = React.memo(ArticlesHeaderComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
  },
  pillCount: {
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderColor: OBSIDIAN_COLORS.border_accent,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillCountText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 12,
    fontWeight: '600',
  },
  updatedPill: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  dot: {
    backgroundColor: OBSIDIAN_COLORS.green_light,
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  updatedText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});
