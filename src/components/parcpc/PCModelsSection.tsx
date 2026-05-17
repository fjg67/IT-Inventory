import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PARC_PC_COLORS } from './tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ModelStat {
  label: string;
  count: number;
}

interface PCModelsSectionProps {
  items: ModelStat[];
}

export const PCModelsSection: React.FC<PCModelsSectionProps> = ({ items }) => {
  const [open, setOpen] = useState(true);
  const rotation = useSharedValue(1);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => {
      const next = !prev;
      rotation.value = withTiming(next ? 1 : 0, { duration: 200 });
      return next;
    });
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));

  return (
    <View style={styles.section}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={iconStyle}>
            <Icon name="chevron-right" size={18} color={PARC_PC_COLORS.text_muted} />
          </Animated.View>
          <Text style={styles.eyebrow}>Modeles</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{items.length} elements</Text>
        </View>
      </Pressable>
      {open ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {items.map((item) => (
            <View key={item.label} style={styles.chip}>
              <Icon name="laptop" size={14} color={PARC_PC_COLORS.green_light} />
              <Text style={styles.chipLabel} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.chipCount}>{item.count}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    color: PARC_PC_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  badge: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: PARC_PC_COLORS.bg_card,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.border_subtle,
  },
  badgeText: {
    color: PARC_PC_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    gap: 10,
    paddingRight: 16,
  },
  chip: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PARC_PC_COLORS.bg_card_elevated,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.border_subtle,
  },
  chipLabel: {
    maxWidth: 180,
    color: PARC_PC_COLORS.text_primary,
    fontSize: 12,
    fontWeight: '700',
  },
  chipCount: {
    color: PARC_PC_COLORS.green_light,
    fontSize: 12,
    fontWeight: '800',
  },
});
