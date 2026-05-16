import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useCountUp } from '@/hooks/useCountUp';
import { PCStateMeta } from '@/constants/pcStates';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PCStateCardProps {
  meta: PCStateMeta;
  value: number;
  total?: boolean;
  index: number;
  onPress?: () => void;
}

export const PCStateCard: React.FC<PCStateCardProps> = ({ meta, value, total = false, index, onPress }) => {
  const count = useCountUp(value);

  return (
    <Animated.View entering={FadeInUp.delay(index * 40).duration(260)} style={[styles.wrap, total && styles.wrapTotal]}>
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          total && styles.cardTotal,
          {
            borderColor: meta.border,
            backgroundColor: total ? OBSIDIAN_COLORS.bg_card_elevated : meta.bg,
          },
        ]}
      >
        <View style={[styles.leftBar, { backgroundColor: meta.text }]} />
        <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={20} color={meta.text} />
        </View>
        <View style={styles.content}>
          <View style={styles.rowTop}>
            <Text style={[styles.value, total && styles.valueTotal, { color: meta.text }]}>{count}</Text>
            {total && <View style={styles.totalPill}><Text style={styles.totalPillText}>TOTAL</Text></View>}
          </View>
          <Text style={styles.label}>{meta.label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  wrapTotal: {
    width: '100%',
  },
  card: {
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTotal: {
    minHeight: 96,
  },
  leftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  valueTotal: {
    fontSize: 52,
  },
  label: {
    marginTop: 4,
    color: 'rgba(240, 253, 244, 0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  totalPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_accent,
  },
  totalPillText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
