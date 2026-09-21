import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { CA_THEME } from '@/constants/caTheme';

interface CAAvailabilityBarProps {
  stockOkCount:  number;
  alertesCount:  number;
  totalCount:    number;
  activeFilter:  'ok' | 'alertes' | null;
  onFilterChange:(filter: 'ok' | 'alertes' | null) => void;
}

export const CAAvailabilityBar = ({
  stockOkCount, alertesCount, totalCount,
  activeFilter, onFilterChange,
}: CAAvailabilityBarProps) => {
  const pct = totalCount > 0 ? Math.round((stockOkCount / totalCount) * 100) : 0;

  const fillStyle = useAnimatedStyle(() => ({
    width: withSpring(`${pct}%`, { damping: 20, stiffness: 90 })
  }));

  const alertStyle = useAnimatedStyle(() => ({
    width: withSpring(`${totalCount > 0 ? Math.round((alertesCount / totalCount) * 100) : 0}%`, { damping: 20, stiffness: 90 })
  }));

  return (
    <View style={styles.container}>

      {/* Label + pourcentage */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>DISPONIBILITÉ</Text>
        <Text style={styles.percent}>{pct}%</Text>
      </View>

      {/* Barre de progression */}
      <View style={styles.track} accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}>
        <Animated.View style={[styles.fill, fillStyle]} />
        {alertesCount > 0 && (
          <Animated.View style={[styles.alertPart, alertStyle]} />
        )}
      </View>

      {/* Chips filtres */}
      <View style={styles.chipsRow}>
        <Pressable
          onPress={() => onFilterChange(activeFilter === 'ok' ? null : 'ok')}
          style={[styles.chip, styles.chipOk, activeFilter === 'ok' && styles.chipOkActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeFilter === 'ok' }}
        >
          <View style={[styles.chipDot, { backgroundColor: CA_THEME.green }]} />
          <Text style={[styles.chipText, { color: CA_THEME.greenText }]}>
            Stock OK ({stockOkCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onFilterChange(activeFilter === 'alertes' ? null : 'alertes')}
          style={[styles.chip, styles.chipAl, activeFilter === 'alertes' && styles.chipAlActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeFilter === 'alertes' }}
        >
          <View style={[styles.chipDot, { backgroundColor: CA_THEME.warning }]} />
          <Text style={[styles.chipText, { color: CA_THEME.warning }]}>
            Alertes ({alertesCount})
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { paddingHorizontal: 12, paddingBottom: 10, backgroundColor: CA_THEME.lightGray },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: {
    fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
    color: CA_THEME.textMuted,
  },
  percent:     { fontSize: 13, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', color: CA_THEME.green },
  track: {
    height: 7, borderRadius: 4,
    backgroundColor: CA_THEME.dangerBg,
    flexDirection: 'row', overflow: 'hidden',
    marginBottom: 8,
  },
  fill:        { backgroundColor: CA_THEME.green, height: '100%' },
  alertPart:   { backgroundColor: CA_THEME.warning, height: '100%', opacity: 0.5 },
  chipsRow:    { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  chipOk: {
    backgroundColor: CA_THEME.greenBg,
    borderColor:     CA_THEME.greenBg2,
  },
  chipOkActive: { borderColor: CA_THEME.green, borderWidth: 1.5 },
  chipAl: {
    backgroundColor: CA_THEME.warningBg,
    borderColor:     'rgba(230,81,0,0.28)',
  },
  chipAlActive: { borderColor: CA_THEME.warning, borderWidth: 1.5 },
  chipDot:  { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 10, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600' },
});
