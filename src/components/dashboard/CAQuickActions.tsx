import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const QUICK_ACTIONS = [
  {
    key:      'entree',
    label:    'Entrée',
    icon:     'arrow-down-circle',
    color:    CA_THEME.green,
    bgColor:  CA_THEME.greenBg,
    leftBorder: CA_THEME.green,
  },
  {
    key:      'sortie',
    label:    'Sortie',
    icon:     'arrow-up-circle',
    color:    CA_THEME.danger,
    bgColor:  CA_THEME.white,
    leftBorder: CA_THEME.danger,
  },
  {
    key:      'ajustement',
    label:    'Ajustement',
    icon:     'tune-vertical',
    color:    CA_THEME.warning,
    bgColor:  CA_THEME.white,
    leftBorder: CA_THEME.warning,
  },
  {
    key:      'transfert',
    label:    'Transfert',
    icon:     'swap-horizontal',
    color:    CA_THEME.purple,
    bgColor:  CA_THEME.white,
    leftBorder: CA_THEME.purple,
  },
];

export const CAQuickActions = ({ onAction }: { onAction: (key: string) => void }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionBar} aria-hidden />
      <Text style={styles.sectionTitle}>Actions rapides</Text>
    </View>
    <View style={styles.grid}>
      {QUICK_ACTIONS.map(action => (
        <Pressable
          key={action.key}
          onPress={() => onAction(action.key)}
          style={[styles.btn, { borderLeftColor: action.leftBorder }]}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <View style={[styles.btnIcon, { backgroundColor: `${action.color}18` }]}>
            <Icon name={action.icon} size={20} color={action.color} />
          </View>
          <Text style={styles.btnLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: { paddingHorizontal: 0, marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  sectionBar: {
    width: 3, height: 16,
    backgroundColor: CA_THEME.green,
    borderRadius:    0,
  },
  sectionTitle: {
    fontSize:   11,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color:      CA_THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing:  1.2,
  },
  grid: {
    display:   'flex',
    flexDirection: 'row',
    flexWrap:  'wrap',
    gap:       10,
  },
  btn: {
    width:           '48%',
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: CA_THEME.white,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  btnIcon:  {
    width: 34, height: 34, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  btnLabel: { fontSize: 13, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.textPrimary },
});
