import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface MovementStats {
  entree:      number;
  sortie:      number;
  ajustement:  number;
  transfert:   number;
}

const STAT_CONFIG = [
  {
    key:        'entree',
    label:      'Entrée',
    icon:       'arrow-down-circle',
    topColor:   CA_THEME.green,
    iconBg:     CA_THEME.greenBg,
    iconColor:  CA_THEME.green,
    numColor:   CA_THEME.green,
    getVal:     (s: MovementStats) => s.entree,
  },
  {
    key:        'sortie',
    label:      'Sortie',
    icon:       'arrow-up-circle',
    topColor:   CA_THEME.danger,
    iconBg:     CA_THEME.dangerBg,
    iconColor:  CA_THEME.danger,
    numColor:   CA_THEME.danger,
    getVal:     (s: MovementStats) => s.sortie,
  },
  {
    key:        'ajustement',
    label:      'Ajustement',
    icon:       'swap-vertical',
    topColor:   CA_THEME.warning,
    iconBg:     CA_THEME.warningBg,
    iconColor:  CA_THEME.warning,
    numColor:   CA_THEME.warning,
    getVal:     (s: MovementStats) => s.ajustement,
  },
  {
    key:        'transfert',
    label:      'Transfert',
    icon:       'swap-horizontal',
    topColor:   CA_THEME.purple,
    iconBg:     CA_THEME.purpleBg,
    iconColor:  CA_THEME.purple,
    numColor:   CA_THEME.purple,
    getVal:     (s: MovementStats) => s.transfert,
  },
] as const;

export const CAMouvementsStatRow = ({
  stats,
  activeType,
  onTypeChange,
}: {
  stats:          MovementStats;
  activeType:     string | null;
  onTypeChange:   (key: string | null) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.scroll}
    accessibilityRole="list"
    accessibilityLabel="Statistiques par type de mouvement"
  >
    {STAT_CONFIG.map((conf) => {
      const val      = conf.getVal(stats) || 0;
      const isActive = activeType === conf.key;

      return (
        <Pressable
          key={conf.key}
          onPress={() => onTypeChange(isActive ? null : conf.key)}
          style={[styles.card, { borderTopColor: conf.topColor }, isActive && styles.cardActive]}
          accessibilityRole="button"
          accessibilityLabel={`${conf.label} : ${val}`}
          accessibilityState={{ selected: isActive }}
        >
          <View style={[styles.iconWrap, { backgroundColor: conf.iconBg }]}>
            <Icon name={conf.icon} size={13} color={conf.iconColor} />
          </View>
          <Text style={[styles.number, { color: conf.numColor }]}>{val}</Text>
          <Text style={styles.label}>{conf.label}</Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 12,
    paddingVertical:   12,
    gap:               8,
    flexDirection:     'row',
  },
  card: {
    minWidth:        90,
    backgroundColor: CA_THEME.white,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderTopWidth:  3,
    padding:         10,
  },
  cardActive: {
    elevation:    3,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 24, height: 24, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  number: { fontSize: 24, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', lineHeight: 28, marginBottom: 2 },
  label:  { fontSize: 9, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: CA_THEME.textMuted },
});
