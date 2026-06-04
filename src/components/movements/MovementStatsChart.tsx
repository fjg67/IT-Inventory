import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

export interface MovementChartBar {
  label: string;
  entrees: number;
  sorties: number;
  isToday?: boolean;
}

interface MovementStatsChartProps {
  data: MovementChartBar[];
  onClose: () => void;
  onOpenStats: () => void;
}

export const MovementStatsChart: React.FC<MovementStatsChartProps> = ({ data, onClose, onOpenStats }) => {
  const width = 312;
  const height = 126;
  const pad = 16;
  const chartHeight = 84;
  const slot = (width - pad * 2) / Math.max(1, data.length);
  const barWidth = Math.min(16, slot * 0.64);
  const maxValue = Math.max(1, ...data.map((item) => item.entrees + item.sorties));

  return (
    <Animated.View entering={FadeInDown.duration(240)} style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.title}>ACTIVITÉ 7 JOURS</Text>
        <View style={styles.actions}>
          <Pressable onPress={onOpenStats} style={styles.actionBtn}><Text style={styles.actionText}>Voir stats</Text></Pressable>
          <Pressable onPress={onClose} style={styles.iconBtn}><Icon name="close" size={15} color={OBSIDIAN_COLORS.text_muted} /></Pressable>
        </View>
      </View>

      <Svg width={width} height={height}>
        {[0, 1, 2, 3].map((step) => {
          const y = pad + (chartHeight / 3) * step;
          return <Line key={`grid-${step}`} x1={pad} y1={y} x2={width - pad} y2={y} stroke={OBSIDIAN_COLORS.border_subtle} strokeWidth={1} />;
        })}

        {data.map((item, index) => {
          const x = pad + index * slot + (slot - barWidth) / 2;
          const total = item.entrees + item.sorties;
          const totalHeight = (total / maxValue) * chartHeight;
          const entryHeight = total > 0 ? (item.entrees / total) * totalHeight : 0;
          const exitHeight = totalHeight - entryHeight;
          const baseY = pad + chartHeight;
          const exitsY = baseY - exitHeight;
          const entriesY = exitsY - entryHeight;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <Rect x={x} y={exitsY} width={barWidth} height={exitHeight} rx={4} fill={OBSIDIAN_COLORS.danger} opacity={item.isToday ? 0.95 : 0.6} />
              <Rect x={x} y={entriesY} width={barWidth} height={entryHeight} rx={4} fill={OBSIDIAN_COLORS.green_light} opacity={item.isToday ? 1 : 0.8} />
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.labelsRow}>
        {data.map((item, index) => (
          <Text key={`${item.label}-${index}`} style={[styles.dayLabel, item.isToday && styles.dayLabelToday]}>{item.label}</Text>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_card,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    padding: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  iconBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayLabel: {
    color: OBSIDIAN_COLORS.text_dim,
    fontSize: 10,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  dayLabelToday: {
    color: OBSIDIAN_COLORS.green_light,
  },
});
