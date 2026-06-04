import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCountUp } from '@/hooks/useCountUp';
import { PCStateMeta } from '@/constants/pcStates';
import { PARC_PC_COLORS } from './tokens';

interface PCStateCardProps {
  meta: PCStateMeta;
  count: number;
  onPress?: () => void;
  active?: boolean;
}

export const PCStateCard: React.FC<PCStateCardProps> = ({ meta, count, onPress, active = false }) => {
  const displayValue = useCountUp(count, { duration: 500 });

  return (
    <Pressable onPress={onPress} style={[styles.card, { borderColor: meta.border, backgroundColor: meta.subtle }, active && styles.cardActive]}>
      <View style={[styles.leftAccent, { backgroundColor: meta.color }]} />
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: meta.subtle, borderColor: meta.border }]}>
          <Icon name={meta.icon} size={16} color={meta.color} />
        </View>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{count}</Text>
        </View>
      </View>
      <Text style={[styles.value, { color: meta.color }]}>{displayValue}</Text>
      <Text style={styles.label}>{meta.label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 118,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: PARC_PC_COLORS.bg_card,
  },
  cardActive: {
    borderWidth: 2,
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  value: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  label: {
    marginTop: 6,
    color: PARC_PC_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
