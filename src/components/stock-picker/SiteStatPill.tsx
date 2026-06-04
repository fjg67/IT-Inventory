import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { OBSIDIAN_COLORS } from '@/constants/colors';

interface SiteStatPillProps {
  icon: string;
  label: string;
  accent?: string;
}

export const SiteStatPill: React.FC<SiteStatPillProps> = ({ icon, label, accent = OBSIDIAN_COLORS.text_secondary }) => {
  return (
    <View style={styles.pill}>
      <Icon name={icon} size={12} color={accent} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  text: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SiteStatPill;
