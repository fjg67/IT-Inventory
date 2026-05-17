import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface InfoBadgeProps {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export const InfoBadge: React.FC<InfoBadgeProps> = React.memo(({ label, icon, color, bg }) => (
  <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '4D' }]}>
    <Icon name={icon} size={12} color={color} />
    <Text style={[styles.text, { color }]} numberOfLines={1}>{label}</Text>
  </View>
));

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
