import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PCStateBar, PCStateBarSegment } from './PCStateBar';
import { PARC_PC_COLORS } from './tokens';

interface PCTotalCardProps {
  total: number;
  segments: PCStateBarSegment[];
}

export const PCTotalCard: React.FC<PCTotalCardProps> = ({ total, segments }) => {
  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.aura} />
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Icon name="laptop" size={22} color={PARC_PC_COLORS.green_light} />
        </View>
        <View style={styles.valueWrap}>
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.label}>PC portables</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TOTAL</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <PCStateBar segments={segments} height={8} />

      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendValue}>{segment.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: PARC_PC_COLORS.bg_card_elevated,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.green_border,
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    top: -30,
    right: -28,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: PARC_PC_COLORS.green_subtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PARC_PC_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.green_border,
  },
  valueWrap: {
    flex: 1,
    marginLeft: 14,
  },
  total: {
    color: PARC_PC_COLORS.green_light,
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 46,
    letterSpacing: -1.4,
  },
  label: {
    color: PARC_PC_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  badge: {
    minHeight: 26,
    borderRadius: 999,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: PARC_PC_COLORS.bg_card,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.border_card,
  },
  badgeText: {
    color: PARC_PC_COLORS.text_dim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 18,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendValue: {
    color: PARC_PC_COLORS.text_primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
