import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface CASettingSectionProps {
  title:    string;
  icon:     string;
  children: React.ReactNode;
}

export const CASettingSection = ({ title, icon, children }: CASettingSectionProps) => (
  <View style={styles.section}>
    <View style={styles.label} accessibilityRole="header">
      <View style={styles.labelBar} aria-hidden />
      <Icon name={icon} size={12} color={CA_THEME.textMuted} />
      <Text style={styles.labelText}>{title}</Text>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  section:  { marginBottom: 4 },
  label:    { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  labelBar: { width: 3, height: 12, backgroundColor: CA_THEME.green },
  labelText: {
    fontSize: 9, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
    color: CA_THEME.textMuted,
  },
});
