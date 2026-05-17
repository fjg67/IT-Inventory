import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ADC } from './articleDetailColors';

interface ArticleInfoRowProps {
  label: string;
  isLast?: boolean;
  children: React.ReactNode;
}

export const ArticleInfoRow: React.FC<ArticleInfoRowProps> = React.memo(({ label, isLast, children }) => (
  <View style={[styles.row, !isLast && styles.border]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueWrap}>{children}</View>
  </View>
));

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: ADC.border_subtle,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: ADC.text_muted,
    flex: 0,
    minWidth: 90,
  },
  valueWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
