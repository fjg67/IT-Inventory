import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useCountUp } from '@/hooks/useCountUp';
import { MovementTypeMeta } from '@/constants/movementTypes';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface MovementStatCardProps {
  meta: MovementTypeMeta;
  value: number;
  index: number;
  onPress: () => void;
}

export const MovementStatCard: React.FC<MovementStatCardProps> = ({ meta, value, index, onPress }) => {
  const count = useCountUp(value);

  return (
    <Animated.View entering={FadeInUp.delay(index * 40).duration(240)} style={styles.wrap}>
      <Pressable onPress={onPress} style={[styles.card, { borderColor: meta.border, backgroundColor: meta.bg }]}>
        <Text style={[styles.sign, { color: meta.text }]}>{meta.sign}</Text>
        <Text style={[styles.value, { color: OBSIDIAN_COLORS.text_primary }]}>{count}</Text>
        <Text style={styles.label}>{meta.label}</Text>
        <View style={[styles.bottomBar, { backgroundColor: meta.text }]} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 110,
  },
  card: {
    height: 90,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    overflow: 'hidden',
  },
  sign: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 22,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  label: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    opacity: 0.4,
  },
});
