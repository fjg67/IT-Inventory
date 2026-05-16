import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MovementTypeMeta } from '@/constants/movementTypes';

interface MovementQTEBadgeProps {
  meta: MovementTypeMeta;
  value: string;
}

export const MovementQTEBadge: React.FC<MovementQTEBadgeProps> = ({ meta, value }) => (
  <LinearGradient colors={[meta.bg, meta.bg]} style={[styles.wrap, { borderColor: meta.border }]}>
    <Text style={[styles.label, { color: meta.text }]}>QTE</Text>
    <Text style={[styles.value, { color: meta.text }]}>{value}</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  wrap: {
    minWidth: 62,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
});
