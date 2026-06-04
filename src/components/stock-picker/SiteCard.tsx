import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { OBSIDIAN_COLORS } from '@/constants/colors';
import { StockPickerSiteConfig } from '@/constants/siteConfig';
import { SiteStatPill } from './SiteStatPill';

interface SiteCardProps {
  site: StockPickerSiteConfig;
  isActive: boolean;
  onPress: () => void;
  index: number;
  stats?: {
    articles: number;
    pcs: number;
  };
}

export const SiteCard: React.FC<SiteCardProps> = ({ site, isActive, onPress, index, stats }) => {
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.97, { damping: 11, stiffness: 180 }),
      withSpring(1, { damping: 12, stiffness: 190 }),
    );
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(260)} style={cardStyle}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={[
          styles.card,
          { borderColor: isActive ? 'rgba(34,197,94,0.4)' : OBSIDIAN_COLORS.border_subtle, backgroundColor: isActive ? OBSIDIAN_COLORS.bg_card_elevated : OBSIDIAN_COLORS.bg_card },
        ]}
      >
        <View style={[styles.leftAccent, { backgroundColor: site.color }]} />

        <View style={styles.mainRow}>
          <View style={[styles.avatar, { backgroundColor: site.subtle, borderColor: site.border }]}>
            <Text style={[styles.abbr, { color: site.color }]}>{site.abbr}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.siteLabel}>{site.label}</Text>
            <Text style={styles.siteSubtitle}>{site.subtitle}</Text>
          </View>

          {isActive ? (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIF</Text>
            </View>
          ) : (
            <Icon name="chevron-right" size={21} color={OBSIDIAN_COLORS.text_dim} />
          )}
        </View>

        <View style={styles.statsRow}>
          <SiteStatPill icon="package-variant-closed" label={`${stats?.articles ?? 0} articles`} accent={site.color} />
          <SiteStatPill icon="monitor" label={`${stats?.pcs ?? 0} PC`} accent={site.color} />
          <SiteStatPill icon={isActive ? 'check-circle' : 'circle-outline'} label={isActive ? 'Actif' : 'Inactif'} accent={isActive ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_muted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 98,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abbr: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  siteLabel: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 16,
    fontWeight: '700',
  },
  siteSubtitle: {
    marginTop: 2,
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
  },
  activeBadge: {
    minHeight: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_accent,
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: OBSIDIAN_COLORS.green_light,
  },
  activeText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statsRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
});

export default SiteCard;
