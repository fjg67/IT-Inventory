import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

export const CADateSeparator = ({ label }: { label: string }) => (
  <View style={styles.row} accessibilityRole="header">
    <View style={styles.line} aria-hidden />
    <View style={styles.pill}>
      <Text style={styles.text}>{label}</Text>
    </View>
    <View style={styles.line} aria-hidden />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 10, gap: 8,
  },
  line: {
    flex: 1, height: 1,
    backgroundColor: CA_THEME.borderGray,
  },
  pill: {
    paddingHorizontal: 12, paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: CA_THEME.white,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
  },
  text: {
    fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.0,
    color: CA_THEME.textMuted,
  },
});
