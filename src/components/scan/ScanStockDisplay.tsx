import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCountUp } from '@/hooks/useCountUp';
import { ScanStockBar } from './ScanStockBar';
import { SCAN_COLORS } from './tokens';

type ScanStockDisplayProps = {
  quantity: number;
  unit?: string;
  minStock?: number;
};

export const ScanStockDisplay: React.FC<ScanStockDisplayProps> = ({ quantity, unit, minStock = 0 }) => {
  const count = useCountUp(quantity, { duration: 400 });

  const status = useMemo(() => {
    if (quantity <= 0) {
      return { label: 'RUPTURE', color: SCAN_COLORS.danger, bg: SCAN_COLORS.danger_subtle, icon: 'alert-octagon-outline', progress: 0 };
    }
    if (minStock > 0 && quantity <= minStock) {
      return { label: 'Stock faible', color: SCAN_COLORS.warning, bg: SCAN_COLORS.warning_subtle, icon: 'alert-outline', progress: Math.min(1, quantity / Math.max(minStock * 2, 1)) };
    }
    return { label: 'En stock', color: SCAN_COLORS.green_light, bg: SCAN_COLORS.green_subtle, icon: 'trending-up', progress: minStock > 0 ? Math.min(1, quantity / (minStock * 3)) : 1 };
  }, [minStock, quantity]);

  return (
    <View>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>STOCK ACTUEL</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{count}</Text>
            <Text style={styles.unit}>{unit || 'unites'}</Text>
          </View>
        </View>

        <View style={[styles.pill, { backgroundColor: status.bg, borderColor: `${status.color}66` }]}>
          <Icon name={status.icon} size={14} color={status.color} />
          <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <ScanStockBar progress={status.progress} color={status.color} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    color: SCAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  value: {
    color: SCAN_COLORS.text_primary,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: SCAN_COLORS.text_muted,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pill: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
