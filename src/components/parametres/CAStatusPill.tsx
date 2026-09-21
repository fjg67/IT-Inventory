import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

export const CAStatusPill = ({ active }: { active: boolean }) => (
  <View style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
    accessibilityLabel={active ? 'Actif' : 'Inactif'}>
    <View style={[styles.dot, { backgroundColor: active ? CA_THEME.green : CA_THEME.textMuted }]} />
    <Text style={[styles.text, { color: active ? CA_THEME.greenText : CA_THEME.textMuted }]}>
      {active ? 'Active' : 'Inactive'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1,
  },
  pillActive:   { backgroundColor: CA_THEME.greenBg,   borderColor: CA_THEME.greenBg2 },
  pillInactive: { backgroundColor: CA_THEME.lightGray, borderColor: CA_THEME.borderGray },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '700' },
});
