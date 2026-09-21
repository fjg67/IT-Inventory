import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';
import { PieChart } from 'react-native-gifted-charts';

interface CAStockPieChartProps {
  totalArticles: number;
  articlesAlerte: number;
}

export const CAStockPieChart = ({ totalArticles, articlesAlerte }: CAStockPieChartProps) => {
  const stockNormal = Math.max(0, totalArticles - articlesAlerte);
  
  const pieData = [
    {
      value: stockNormal,
      color: CA_THEME.green,
      text: `${stockNormal}`,
    },
    {
      value: articlesAlerte,
      color: CA_THEME.danger,
      text: `${articlesAlerte}`,
    },
  ];

  // Si on n'a aucun article, on affiche un cercle gris
  if (totalArticles === 0) {
    pieData.push({ value: 1, color: CA_THEME.borderGray, text: '0' });
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>RÉPARTITION DU STOCK</Text>
      
      <View style={styles.content}>
        <View style={styles.chartWrapper}>
          <PieChart
            data={totalArticles === 0 ? [{ value: 1, color: CA_THEME.borderGray }] : pieData}
            donut
            innerRadius={30}
            radius={45}
            innerCircleColor={CA_THEME.white}
            centerLabelComponent={() => {
              return (
                <View style={styles.centerLabel}>
                  <Text style={styles.centerValue}>{totalArticles}</Text>
                </View>
              );
            }}
            isAnimated
            animationDuration={1000}
          />
        </View>

        <View style={styles.legendWrapper}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CA_THEME.green }]} />
            <View>
              <Text style={styles.legendLabel}>Stock Normal</Text>
              <Text style={styles.legendValue}>{stockNormal}</Text>
            </View>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CA_THEME.danger }]} />
            <View>
              <Text style={styles.legendLabel}>En Alerte</Text>
              <Text style={styles.legendValue}>{articlesAlerte}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CA_THEME.borderGray,
  },
  title: {
    fontSize: 12,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color: CA_THEME.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 18,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '800',
    color: CA_THEME.textPrimary,
  },
  legendWrapper: {
    flex: 1,
    paddingLeft: 24,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: CA_THEME.textSecondary,
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 16,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color: CA_THEME.textPrimary,
  },
});
