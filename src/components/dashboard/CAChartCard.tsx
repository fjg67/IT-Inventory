import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';
import { LineChart } from 'react-native-gifted-charts';

interface CAChartCardProps {
  value: number;
  label: string;
  trend?: number[];
  onPress?: () => void;
}

const SHORT_DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const CAChartCard = ({ value, label, trend, onPress }: CAChartCardProps) => {
  const chartData = useMemo(() => {
    if (!trend || trend.length === 0) return [];
    const now = new Date();
    return trend.map((v, index) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (trend.length - 1 - index));
      return { 
        value: v,
        label: SHORT_DAYS[d.getDay()],
        labelTextStyle: { color: CA_THEME.textSecondary, fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium, marginTop: 4 }
      };
    });
  }, [trend]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title}>MOUVEMENTS</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Aujourd'hui</Text>
        </View>
      </View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.chartContainer}>
        {chartData.length > 0 ? (
          <LineChart
            data={chartData}
            height={60}
            width={300} // Sera masqué par l'overflow mais garantit l'affichage
            hideDataPoints
            thickness={2}
            color={CA_THEME.green}
            hideYAxisText
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            isAnimated
            animationDuration={1200}
            curved
            areaChart
            startFillColor={CA_THEME.green}
            endFillColor={CA_THEME.white}
            startOpacity={0.2}
            endOpacity={0.0}
            initialSpacing={0}
            endSpacing={0}
            adjustToWidth
          />
        ) : (
          <View style={styles.emptyChart} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius: 8,
    padding: 16,
    paddingBottom: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CA_THEME.borderGray,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color: CA_THEME.textSecondary,
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: 'rgba(27, 138, 62, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: CA_THEME.green,
    fontSize: 10,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
  },
  value: {
    fontSize: 28,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '800',
    color: CA_THEME.textPrimary,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: CA_THEME.textSecondary,
    marginBottom: 16,
  },
  chartContainer: {
    marginHorizontal: -16,
  },
  emptyChart: {
    height: 2,
    backgroundColor: CA_THEME.green,
    opacity: 0.2,
  },
});
