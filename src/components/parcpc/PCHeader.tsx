import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PARC_PC_COLORS } from './tokens';

interface PCHeaderProps {
  activeCount: number;
  trendLabel: string;
}

export const PCHeader: React.FC<PCHeaderProps> = ({ activeCount, trendLabel }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon name="laptop" size={18} color={PARC_PC_COLORS.green_light} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Parc PC</Text>
        <View style={styles.pills}>
          <View style={styles.primaryPill}>
            <Text style={styles.primaryPillText}>{activeCount} PC actifs</Text>
          </View>
          <View style={styles.secondaryPill}>
            <Text style={styles.secondaryPillText}>{trendLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PARC_PC_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.green_border,
  },
  content: {
    flex: 1,
  },
  title: {
    color: PARC_PC_COLORS.text_primary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  primaryPill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: PARC_PC_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.green_border,
  },
  primaryPillText: {
    color: PARC_PC_COLORS.green_light,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryPill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: PARC_PC_COLORS.bg_card,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.border_card,
  },
  secondaryPillText: {
    color: PARC_PC_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
