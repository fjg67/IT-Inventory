import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface AvailabilityBarProps {
  total: number;
  stockOk: number;
  alertes: number;
}

const AvailabilityBarComponent: React.FC<AvailabilityBarProps> = ({ total, stockOk, alertes }) => {
  const progress = useSharedValue(0);
  React.useEffect(() => {
    const ratio = total > 0 ? Math.min(Math.max(stockOk / total, 0), 1) : 0;
    progress.value = withTiming(ratio, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [progress, stockOk, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const pct = total > 0 ? Math.round((stockOk / total) * 100) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.rowTop}>
        <Text style={styles.label}>DISPONIBILITE</Text>
        <Text style={styles.value}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fillOk, fillStyle]} />
      </View>

      <View style={styles.legendRow}>
        <View style={[styles.legendPill, styles.legendOk]}>
          <Text style={styles.legendOkText}>{`● Stock OK (${stockOk})`}</Text>
        </View>
        <View style={[styles.legendPill, styles.legendAlert]}>
          <Text style={styles.legendAlertText}>{`● Alertes (${alertes})`}</Text>
        </View>
      </View>
    </View>
  );
};

export const AvailabilityBar = React.memo(AvailabilityBarComponent);

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  value: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderRadius: 4,
    height: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  fillOk: {
    backgroundColor: OBSIDIAN_COLORS.green_primary,
    borderRadius: 4,
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  legendPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  legendOk: {
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
  },
  legendAlert: {
    backgroundColor: OBSIDIAN_COLORS.warning_subtle,
  },
  legendOkText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 11,
    fontWeight: '600',
  },
  legendAlertText: {
    color: OBSIDIAN_COLORS.warning,
    fontSize: 11,
    fontWeight: '600',
  },
});
