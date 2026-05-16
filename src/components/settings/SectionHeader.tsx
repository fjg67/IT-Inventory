import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View style={styles.row}>
    <View style={styles.bar} />
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bar: {
    width: 3,
    height: 16,
    borderRadius: 3,
    backgroundColor: SETTINGS_COLORS.green_primary,
  },
  title: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: SETTINGS_COLORS.text_muted,
    fontWeight: '700',
  },
});
