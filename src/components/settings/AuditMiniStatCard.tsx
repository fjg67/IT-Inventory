import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

interface AuditMiniStatCardProps {
  icon: string;
  label: string;
  value: string;
  iconColor: string;
}

export const AuditMiniStatCard: React.FC<AuditMiniStatCardProps> = ({ icon, label, value, iconColor }) => (
  <View style={styles.card}>
    <Icon name={icon} size={14} color={iconColor} />
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 76,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  label: {
    color: SETTINGS_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '500',
  },
  value: {
    color: SETTINGS_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
