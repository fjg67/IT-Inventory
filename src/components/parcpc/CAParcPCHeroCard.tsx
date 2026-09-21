import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, PC_STATUS_CA } from '@/constants/caTheme';

export type PCStatus = keyof typeof PC_STATUS_CA;

interface CAParcPCHeroCardProps {
  totalCount: number;
  counts:     Record<PCStatus, number>;
}

export const CAParcPCHeroCard = ({ totalCount, counts }: CAParcPCHeroCardProps) => {
  const segments = Object.entries(PC_STATUS_CA).map(([key, conf]) => ({
    key,
    count: counts[key as PCStatus] ?? 0,
    color: conf.color,
    label: conf.label,
  })).filter(s => s.count > 0);

  return (
    <View style={styles.card}>
      {/* Ligne top : icône + nombre + badge total */}
      <View style={styles.topRow}>
        <View style={styles.iconWrap} aria-hidden>
          <Icon name="laptop" size={22} color={CA_THEME.green} />
        </View>
        <View style={styles.numBlock}>
          <Text style={styles.bigNum} accessibilityLabel={`${totalCount} PC portables`}>
            {totalCount}
          </Text>
          <Text style={styles.numLabel}>PC PORTABLES</Text>
        </View>
        <View style={styles.totalTag}>
          <Text style={styles.totalTagText}>Total</Text>
        </View>
      </View>

      {/* Barre de répartition colorée */}
      <View style={styles.segBar}
        accessibilityRole="progressbar"
        accessibilityLabel={`Répartition : ${segments.map(s => `${s.count} ${s.label}`).join(', ')}`}
      >
        {totalCount > 0 && segments.map(seg => (
          <View
            key={seg.key}
            style={[
              styles.segPart,
              {
                flex: seg.count,
                backgroundColor: seg.color,
              }
            ]}
          />
        ))}
        {totalCount === 0 && (
          <View style={[styles.segPart, { flex: 1, backgroundColor: CA_THEME.borderGray }]} />
        )}
      </View>

      {/* Légende dots */}
      <View style={styles.dotsRow}>
        {Object.entries(PC_STATUS_CA).map(([key, conf]) => (
          <View key={key} style={styles.dotItem}>
            <View style={[styles.dot, { backgroundColor: conf.color }]} aria-hidden />
            <Text style={[styles.dotCount, { color: conf.color }]}>
              {counts[key as PCStatus] ?? 0}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    borderLeftColor: CA_THEME.green,
    padding:         14,
    marginHorizontal: 12,
    marginBottom:    10,
  },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 11,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  numBlock: { flex: 1 },
  bigNum: { fontSize: 36, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '800', color: CA_THEME.green, lineHeight: 40 },
  numLabel: {
    fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    color: CA_THEME.textMuted,
  },
  totalTag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
  },
  totalTagText: { fontSize: 11, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.greenText },
  segBar: {
    height: 6, borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: CA_THEME.borderGray,
  },
  segPart: { height: '100%' },
  dotsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  dotItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:     { width: 8, height: 8, borderRadius: 4 },
  dotCount:{ fontSize: 12, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
});
