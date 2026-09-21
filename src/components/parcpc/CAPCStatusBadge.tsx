import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, PC_STATUS_CA } from '@/constants/caTheme';
import type { PCStatus } from './CAParcPCHeroCard';

export const CAPCStatusBadge = ({ status }: { status: PCStatus }) => {
  const conf = PC_STATUS_CA[status];
  return (
    <View style={[
      styles.badge,
      { backgroundColor: conf.subtle, borderColor: conf.border }
    ]}
      accessibilityLabel={`Statut : ${conf.label}`}
    >
      <Icon name={conf.icon} size={11} color={conf.color} />
      <Text style={[styles.text, { color: conf.textDark }]}>{conf.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
    borderWidth:       1,
  },
  text: { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
});
