import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface MovementsHeaderProps {
  totalLabel: string;
  todayCount: number;
  onOpenStats: () => void;
  onToggleSearch: () => void;
  searchActive: boolean;
}

export const MovementsHeader: React.FC<MovementsHeaderProps> = ({ totalLabel, todayCount, onOpenStats, onToggleSearch, searchActive }) => {
  const positive = todayCount > 0;

  return (
  <View style={styles.wrap}>
    <View style={styles.left}>
      <View style={styles.iconBox}>
        <Icon name="swap-horizontal" size={18} color={OBSIDIAN_COLORS.green_light} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Mouvements</Text>
        <Text style={styles.subtitle}>{totalLabel}</Text>
        <Text style={[styles.today, { color: positive ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_muted }]}>
          {positive ? '✓ ' : '− '}{todayCount} mouvement{todayCount !== 1 ? 's' : ''} aujourd'hui
        </Text>
      </View>
    </View>
    <View style={styles.actions}>
      <Pressable onPress={onOpenStats} style={styles.actionBtn}><Icon name="chart-bar" size={18} color={OBSIDIAN_COLORS.text_primary} /></Pressable>
      <Pressable onPress={onToggleSearch} style={styles.actionBtn}><Icon name={searchActive ? 'close' : 'magnify'} size={18} color={OBSIDIAN_COLORS.text_primary} /></Pressable>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_accent,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  today: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
  },
});
