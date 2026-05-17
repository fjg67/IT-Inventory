import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PARC_PC_COLORS } from './tokens';
import { PCStateBar } from './PCStateBar';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PCRepartitionSectionProps {
  total: number;
  agence: number;
  siege: number;
  agencePct: number;
  siegePct: number;
}

export const PCRepartitionSection: React.FC<PCRepartitionSectionProps> = ({ total, agence, siege, agencePct, siegePct }) => {
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
          <Text style={styles.eyebrow}>Repartition</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{total} elements</Text>
        </View>
      </Pressable>
      {open ? (
        <View style={styles.card}>
          <View style={styles.labelsRow}>
            <View>
              <Text style={styles.labelTop}>Portable agence</Text>
              <Text style={styles.labelValue}>{agence}</Text>
            </View>
            <View style={styles.labelEnd}>
              <Text style={styles.labelTop}>Portable siege</Text>
              <Text style={styles.labelValue}>{siege}</Text>
            </View>
          </View>
          <PCStateBar
            height={10}
            segments={[
              { key: 'agence', value: agence, total: Math.max(total, 1), color: PARC_PC_COLORS.green_primary },
              { key: 'siege', value: siege, total: Math.max(total, 1), color: PARC_PC_COLORS.info },
            ]}
          />
          <View style={styles.bottomRow}>
            <View style={styles.metaItem}>
              <Icon name="office-building" size={12} color={PARC_PC_COLORS.green_light} />
              <Text style={styles.metaText}>{agencePct}%</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="office-building-marker" size={12} color={PARC_PC_COLORS.info} />
              <Text style={styles.metaText}>{siegePct}%</Text>
            </View>
          </View>
        </View>
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.border_subtle,
    backgroundColor: PARC_PC_COLORS.bg_card,
    padding: 16,
    gap: 14,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  labelEnd: {
    alignItems: 'flex-end',
  },
  labelTop: {
    color: PARC_PC_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelValue: {
    marginTop: 4,
    color: PARC_PC_COLORS.text_primary,
    fontSize: 22,
    fontWeight: '900',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: PARC_PC_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
