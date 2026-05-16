import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MovementTypeMeta } from '@/constants/movementTypes';

interface MovementTypePillProps {
  meta: MovementTypeMeta;
}

export const MovementTypePill: React.FC<MovementTypePillProps> = ({ meta }) => (
  <View style={[styles.wrap, { backgroundColor: meta.bg, borderColor: meta.border }]}>
    <View style={[styles.dot, { backgroundColor: meta.text }]} />
    <Icon name={meta.icon} size={11} color={meta.text} />
    <Text style={[styles.label, { color: meta.text }]}>{meta.label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
