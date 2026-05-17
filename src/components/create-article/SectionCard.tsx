// ============================================
// SectionCard — Obsidian Grid
// IT-Inventory Application
// ============================================
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { CAC } from './createArticleColors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SectionCard: React.FC<Props> = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: CAC.bg_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CAC.border_subtle,
    padding: 20,
    gap: 16,
  },
});
