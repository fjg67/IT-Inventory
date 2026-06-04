import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PANNE_TYPE_CONFIG, PRIORITE_CONFIG } from '@/types/pc.types';
import { PCPanne } from '@/types/pc.types';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PanneBannerProps {
  activePanne: PCPanne;
}

export const PanneBanner: React.FC<PanneBannerProps> = ({ activePanne }) => {
  const typeConfig = PANNE_TYPE_CONFIG[activePanne.type_panne];
  const priorityConfig = PRIORITE_CONFIG[activePanne.priorite];
  const isCritical = activePanne.priorite === 'critique';

  return (
    <View style={[styles.banner, isCritical && styles.bannerCritical]}>
      <View style={[styles.bannerIcon, { backgroundColor: isCritical ? 'rgba(255,255,255,0.2)' : `${typeConfig.color}25` }]}>
        <Icon name={isCritical ? 'alert-octagon' : typeConfig.icon} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>PC en panne</Text>
        <Text style={styles.bannerSubtitle}>
          {typeConfig.label} · {priorityConfig.label}
        </Text>
      </View>
      <View style={styles.priorityBadge}>
        <Text style={[styles.priorityBadgeText, { color: isCritical ? '#FFFFFF' : priorityConfig.color }]}>
          {priorityConfig.label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.30)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  bannerCritical: {
    backgroundColor: '#EF4444',
    borderColor: '#B91C1C',
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
