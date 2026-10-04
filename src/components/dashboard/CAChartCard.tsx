import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
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
  const { width: viewportWidth } = useWindowDimensions();
  const chartWidth = Math.max(220, viewportWidth - 72);
  const previousValue = trend && trend.length > 1 ? trend[trend.length - 2] : value;
  const delta = value - previousValue;
  const deltaLabel = delta === 0 ? 'Stable' : `${delta > 0 ? '+' : ''}${delta} vs hier`;
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
        <View style={styles.titleGroup}>
          <Text style={styles.title}>MOUVEMENTS</Text>
          <Text style={styles.subtitle}>Activité des 7 derniers jours</Text>
        </View>
        <View style={styles.badge}>
          <View style={styles.liveDot} />
          <Text style={styles.badgeText}>Aujourd’hui</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={[styles.deltaBadge, delta < 0 && styles.deltaBadgeDown]}>
          <Text style={[styles.deltaText, delta < 0 && styles.deltaTextDown]}>{deltaLabel}</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartGrid}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>
        {chartData.length > 0 ? (
          <LineChart
            data={chartData}
            height={94}
            width={chartWidth}
            hideDataPoints
            thickness={2.5}
            color={CA_THEME.green}
            hideYAxisText
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            isAnimated
            animationDuration={1200}
            curved
            areaChart
            startFillColor={CA_THEME.greenLight}
            endFillColor={CA_THEME.greenBg}
            startOpacity={0.28}
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
    borderRadius: 14,
    padding: 16,
    paddingBottom: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CA_THEME.borderGray,
    overflow: 'hidden',
    shadowColor: CA_THEME.greenDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleGroup: { gap: 3 },
  title: {
    fontSize: 12,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color: CA_THEME.textSecondary,
    letterSpacing: 0.5,
  },
  subtitle: { color: CA_THEME.textMuted, fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: CA_THEME.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: CA_THEME.green },
  badgeText: {
    color: CA_THEME.green,
    fontSize: 10,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
  },
  value: {
    fontSize: 30,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '800',
    color: CA_THEME.textPrimary,
    lineHeight: 34,
  },
  label: {
    fontSize: 12,
    color: CA_THEME.textSecondary,
    marginTop: 2,
  },
  kpiRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 },
  deltaBadge: { backgroundColor: CA_THEME.greenBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 3 },
  deltaBadgeDown: { backgroundColor: CA_THEME.dangerBg },
  deltaText: { color: CA_THEME.greenText, fontFamily: CA_THEME.fontFamilyBold, fontSize: 10 },
  deltaTextDown: { color: CA_THEME.dangerText },
  chartContainer: {
    height: 112,
    marginHorizontal: -4,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartGrid: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingVertical: 8 },
  gridLine: { height: StyleSheet.hairlineWidth, backgroundColor: CA_THEME.greenBg2, opacity: 0.55 },
  chart: {
    alignSelf: 'center',
  },
  emptyChart: {
    height: 2,
    backgroundColor: CA_THEME.green,
    opacity: 0.2,
  },
});
