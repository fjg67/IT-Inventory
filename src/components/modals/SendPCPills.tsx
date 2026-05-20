import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

type SendPCPillsProps = {
  hostname: string;
};

export const SendPCPills: React.FC<SendPCPillsProps> = ({ hostname }) => {
  return (
    <Animated.View entering={FadeIn.delay(300).duration(240)} style={styles.row}>
      <View style={styles.hostnamePill}>
        <Icon name="laptop" size={13} color={OBSIDIAN_COLORS.text_muted} />
        <Text numberOfLines={1} style={styles.hostnameText}>{hostname}</Text>
      </View>

      <View style={styles.typePill}>
        <Icon name="arrow-top-right" size={13} color={OBSIDIAN_COLORS.purple} />
        <Text style={styles.typeText}>Sortie agence</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  hostnamePill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  hostnameText: {
    flex: 1,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '600',
  },
  typePill: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    backgroundColor: OBSIDIAN_COLORS.purple_subtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  typeText: {
    color: OBSIDIAN_COLORS.purple,
    fontSize: 13,
    fontWeight: '600',
  },
});
