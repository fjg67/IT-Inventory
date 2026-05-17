import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Article } from '@/types';
import { ADC } from './articleDetailColors';
import { ArticleStatCard } from './ArticleStatCard';

interface ArticleStatsRowProps {
  article: Article;
  stockActuel: number;
  mouvementsCount: number;
}

export const ArticleStatsRow: React.FC<ArticleStatsRowProps> = ({ article, stockActuel, mouvementsCount }) => {
  const isLow = stockActuel <= article.stockMini;
  const isCritical = stockActuel === 0 && article.stockMini > 0;

  return (
    <View style={styles.row}>
      <ArticleStatCard
        icon="package-variant"
        value={stockActuel}
        label="Stock actuel"
        iconBg={isLow ? ADC.danger_subtle : ADC.info_subtle}
        iconColor={isLow ? ADC.danger : ADC.info}
        valueColor={isCritical ? ADC.danger : isLow ? ADC.warning : ADC.text_primary}
        showAlert={isLow}
        delay={0}
      />
      <ArticleStatCard
        icon="bell-alert-outline"
        value={article.stockMini}
        label="Stock mini"
        iconBg={ADC.warning_subtle}
        iconColor={ADC.warning}
        valueColor={ADC.warning}
        delay={80}
      />
      <ArticleStatCard
        icon="swap-vertical"
        value={mouvementsCount}
        label="Mouvements"
        iconBg={ADC.purple_subtle}
        iconColor={ADC.purple}
        valueColor={ADC.purple}
        delay={160}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
