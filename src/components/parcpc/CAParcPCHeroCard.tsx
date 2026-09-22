import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, PC_STATUS_CA } from '@/constants/caTheme';
import { PCDonutChart } from './PCDonutChart';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export type PCStatus = keyof typeof PC_STATUS_CA;

interface CAParcPCHeroCardProps {
  totalCount: number;
  counts:     Record<PCStatus, number>;
}

export const CAParcPCHeroCard = ({ totalCount, counts }: CAParcPCHeroCardProps) => {
  const segments = (Object.entries(PC_STATUS_CA) as [string, { color: string, label: string }][]).map(([key, conf]) => ({
    key,
    value: counts[key as PCStatus] ?? 0,
    color: conf.color,
    label: conf.label,
  })).filter(s => s.value > 0);

  // We sort segments by value for the chart so the biggest is first
  const sortedSegments = [...segments].sort((a, b) => b.value - a.value);

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.card}>
      <View style={styles.contentRow}>
        
        {/* Left column: Title, Total, and Legend */}
        <View style={styles.leftCol}>
          <View style={styles.headerRow}>
            <View style={styles.iconWrap} aria-hidden>
              <Icon name="laptop" size={20} color={CA_THEME.green} />
            </View>
            <Text style={styles.cardTitle}>Vue d'ensemble</Text>
          </View>
          
          <View style={styles.legendContainer}>
            {(Object.entries(PC_STATUS_CA) as [string, { color: string, label: string }][]).map(([key, conf], index) => {
              const count = counts[key as PCStatus] ?? 0;
              return (
                <React.Fragment key={key}>
                  <Animated.View entering={FadeIn.delay(100 + index * 50) as any} style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: conf.color }]} aria-hidden />
                    <Text style={styles.legendLabel}>{conf.label}</Text>
                    <Text style={[styles.legendCount, { color: conf.color }]}>{count}</Text>
                  </Animated.View>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Right column: Donut Chart */}
        <View style={styles.rightCol}>
          <PCDonutChart 
            segments={sortedSegments} 
            total={totalCount} 
            size={110} 
            strokeWidth={12} 
          />
        </View>

      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    // Ombre premium (Glassmorphism shadow effect)
    shadowColor: CA_THEME.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,151,130,0.1)',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    paddingRight: 16,
  },
  rightCol: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: CA_THEME.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: CA_THEME.fontFamilyBold,
    color: CA_THEME.textPrimary,
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 13,
    fontFamily: CA_THEME.fontFamilyMedium,
    color: CA_THEME.textMuted,
    flex: 1,
  },
  legendCount: {
    fontSize: 14,
    fontFamily: CA_THEME.fontFamilyBold,
  },
});
