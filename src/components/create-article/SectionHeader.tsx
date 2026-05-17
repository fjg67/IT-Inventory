// ============================================
// SectionHeader — Obsidian Grid
// IT-Inventory Application
// ============================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SectionAccent, CAC } from './createArticleColors';

interface Props {
  accent: SectionAccent;
  title?: string;
}

export const SectionHeader: React.FC<Props> = ({ accent, title }) => (
  <View style={styles.row}>
    <View style={[styles.bar, { backgroundColor: accent.color }]} />
    <View style={[styles.iconBox, { backgroundColor: accent.bg, borderColor: accent.border }]}>
      <Icon name={accent.icon} size={18} color={accent.color} />
    </View>
    <Text style={styles.title}>{title ?? accent.label}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  bar: {
    width: 3,
    height: 28,
    borderRadius: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: CAC.text_primary,
    flex: 1,
  },
});
