import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

type SendPCInfoCardProps = {
  sourceAgency: string;
};

export const SendPCInfoCard: React.FC<SendPCInfoCardProps> = ({ sourceAgency }) => {
  return (
    <Animated.View entering={FadeInDown.delay(350).duration(260)} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon name="office-building-outline" size={14} color={OBSIDIAN_COLORS.text_muted} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.label}>Agence source</Text>
          <Text style={styles.value}>{sourceAgency}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon name="send-check-outline" size={14} color={OBSIDIAN_COLORS.purple} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.label}>Statut final</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Envoye</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: OBSIDIAN_COLORS.purple,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 11,
  },
  value: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    backgroundColor: OBSIDIAN_COLORS.purple_subtle,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    color: OBSIDIAN_COLORS.purple,
    fontWeight: '700',
    fontSize: 12,
  },
});
