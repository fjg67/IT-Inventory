import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, PC_STATUS_CA } from '@/constants/caTheme';
import type { PCStatus } from './CAParcPCHeroCard';

interface CAParcPCStatCardProps {
  status:   PCStatus;
  count:    number;
  isActive: boolean;
  onPress:  () => void;
}

export const CAParcPCStatCard = ({
  status, count, isActive, onPress
}: CAParcPCStatCardProps) => {
  const conf = PC_STATUS_CA[status];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { borderTopColor: conf.color },
        isActive && styles.cardActive,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${conf.label} : ${count} PC`}
      accessibilityState={{ selected: isActive }}
    >
      {/* Ligne top : icône + badge compteur */}
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: conf.subtle }]}>
          <Icon name={conf.icon} size={15} color={conf.color} />
        </View>
        <View style={[styles.countBadge, { backgroundColor: conf.subtle }]}>
          <Text style={[styles.countText, { color: conf.textDark }]}>{count}</Text>
        </View>
      </View>

      {/* Grand nombre */}
      <Text style={[styles.bigNum, { color: conf.color }]}>{count}</Text>

      {/* Label statut */}
      <Text style={styles.label}>{conf.label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width:           '47%',
    backgroundColor: CA_THEME.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderTopWidth:  3,
    padding:         11,
    overflow:        'hidden',
  },
  // Légère élévation quand filtre actif
  cardActive: {
    elevation:    3,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  countBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 20,
  },
  countText: { fontSize: 11, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
  bigNum: {
    fontSize:   26,
    fontFamily: CA_THEME.fontFamilyBold,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 3,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize:       9,
    fontFamily:     CA_THEME.fontFamilyBold,
    fontWeight:     '700',
    textTransform:  'uppercase',
    letterSpacing:  0.8,
    color:          CA_THEME.textMuted,
  },
});
