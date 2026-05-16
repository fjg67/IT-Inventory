import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface TrendPillProps {
  value: number;
}

export const TrendPill: React.FC<TrendPillProps> = ({ value }) => {
  const positive = value >= 0;
  return (
    <View style={[styles.wrap, { backgroundColor: positive ? OBSIDIAN_COLORS.green_subtle : OBSIDIAN_COLORS.danger_subtle, borderColor: positive ? OBSIDIAN_COLORS.border_accent : OBSIDIAN_COLORS.danger }]}>
      <Text style={[styles.text, { color: positive ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.danger }]}>
        {positive ? '↗' : '↘'} {positive ? '+' : ''}{value} vs hier
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
