// ============================================
// StockSiteSelector — Chips — Obsidian Grid
// IT-Inventory Application
// ============================================
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeIn,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAC } from './createArticleColors';

export interface SiteChipItem {
  id: number;
  nom: string;
}

interface Props {
  sites: SiteChipItem[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

const Chip: React.FC<{
  site: SiteChipItem;
  active: boolean;
  onPress: () => void;
}> = ({ site, active, onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          styles.chip,
          active && styles.chipActive,
        ]}
        onPress={handlePress}
        activeOpacity={1}
      >
        {active && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.checkBadge}>
            <Icon name="check" size={10} color={CAC.green_light} />
          </Animated.View>
        )}
        <Icon
          name="office-building"
          size={16}
          color={active ? CAC.green_light : CAC.text_muted}
        />
        <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
          {site.nom}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const StockSiteSelector: React.FC<Props> = ({ sites, selectedIds, onToggle }) => {
  if (sites.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucun site disponible</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {sites.map(site => (
        <Chip
          key={site.id}
          site={site}
          active={selectedIds.includes(site.id)}
          onPress={() => onToggle(site.id)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: CAC.bg_card_elevated,
    borderWidth: 1.5,
    borderColor: CAC.border_subtle,
    position: 'relative',
  },
  chipActive: {
    backgroundColor: CAC.green_subtle,
    borderColor: CAC.border_accent,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: CAC.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CAC.green_light,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: CAC.text_muted,
  },
  chipLabelActive: {
    fontWeight: '700',
    color: CAC.green_light,
  },
  empty: { padding: 12 },
  emptyText: { fontSize: 13, color: CAC.text_muted },
});
