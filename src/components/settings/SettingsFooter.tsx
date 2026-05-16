import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

export const SettingsFooter: React.FC = () => (
  <View style={styles.wrap}>
    <Text style={styles.text}>· IT-Inventory © 2026 ·</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 6,
  },
  text: {
    color: SETTINGS_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '500',
  },
});
