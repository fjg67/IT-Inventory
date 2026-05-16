import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, useSharedValue, withTiming } from 'react-native-reanimated';
import { PCStateStatsGrid } from './PCStateStatsGrid';
import { PC_STATE_COLORS, PCStateKey } from '@/constants/pcStates';
import { OBSIDIAN_COLORS } from '@/constants/colors';

type BrandStat = { label: string; count: number };

interface PCHeaderProps {
  total: number;
  activeLabel: string;
  trendLabel: string;
  counts: Record<PCStateKey, number>;
  modelStats: BrandStat[];
  modelTotalCount: number;
  repartitionStats: BrandStat[];
  onStatePress?: (state: PCStateKey | null) => void;
}

const CollapsibleSection: React.FC<{
  title: string;
  count: number;
  children: React.ReactNode;
}> = ({ title, count, children }) => {
  const [open, setOpen] = useState(true);
  const rotation = useSharedValue(open ? 1 : 0);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => {
      const next = !prev;
      rotation.value = withTiming(next ? 1 : 0, { duration: 180 });
      return next;
    });
  };

  return (
    <View style={styles.section}>
      <Pressable onPress={toggle} style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>{title}</Text>
          <Text style={styles.sectionCount}>{count} éléments</Text>
        </View>
        <Icon name="chevron-down" size={20} color={OBSIDIAN_COLORS.text_muted} />
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
};

export const PCHeader: React.FC<PCHeaderProps> = ({ total, activeLabel, trendLabel, counts, modelStats, modelTotalCount, repartitionStats, onStatePress }) => {
  const activeCount = useMemo(() => counts.a_chaud + counts.a_reusiner + counts.en_usinage + counts.disponible, [counts]);

  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.wrap}>
      <View style={styles.titleRow}>
        <View style={styles.titleBadge}>
          <Icon name="laptop" size={18} color={OBSIDIAN_COLORS.green_light} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Parc PC</Text>
          <View style={styles.pillsRow}>
            <View style={styles.activePill}><Text style={styles.activePillText}>{activeCount} PC actifs</Text></View>
            <View style={styles.secondaryPill}><Text style={styles.secondaryPillText}>{activeLabel ? `${trendLabel} · ${activeLabel}` : trendLabel}</Text></View>
          </View>
        </View>
      </View>

      <PCStateStatsGrid total={total} counts={counts} onStatePress={onStatePress} />

      <CollapsibleSection title="MODÈLES" count={modelTotalCount}>
        <View style={styles.inlineGrid}>
          {modelStats.map((item) => (
            <View key={item.label} style={styles.miniCard}>
              <Icon name="laptop" size={18} color={OBSIDIAN_COLORS.green_light} />
              <Text style={styles.miniValue}>{item.count}</Text>
              <Text style={styles.miniLabel} numberOfLines={2}>{item.label}</Text>
            </View>
          ))}
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="RÉPARTITION" count={total}>
        <View style={styles.inlineGrid}>
          {repartitionStats.map((item, index) => {
            const meta = PC_STATE_COLORS[(index === 0 ? 'a_chaud' : index === 1 ? 'disponible' : 'a_reusiner') as PCStateKey];
            return (
              <View key={item.label} style={[styles.miniCard, { borderColor: meta.border, backgroundColor: meta.bg }]}>
                <Icon name={meta.icon} size={18} color={meta.text} />
                <Text style={[styles.miniValue, { color: meta.text }]}>{item.count}</Text>
                <Text style={styles.miniLabel} numberOfLines={1}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </CollapsibleSection>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_accent,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  activePill: {
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activePillText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryPill: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  secondaryPillText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionEyebrow: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  sectionCount: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionBody: {
    gap: 10,
  },
  inlineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  miniCard: {
    width: '48.4%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    padding: 12,
    minHeight: 92,
    gap: 6,
  },
  miniValue: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  miniLabel: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
