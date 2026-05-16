import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface DateSeparatorProps {
  title: string;
  isToday?: boolean;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ title, isToday = false }) => (
  <Animated.View entering={FadeIn.duration(220)} style={styles.wrap}>
    <View style={styles.line} />
    <View style={[styles.pill, isToday && styles.pillToday]}>
      <Text style={[styles.title, isToday && styles.titleToday]}>{title}</Text>
    </View>
    <View style={styles.line} />
  </Animated.View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: OBSIDIAN_COLORS.border_subtle,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  pillToday: {
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderColor: OBSIDIAN_COLORS.border_accent,
  },
  title: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  titleToday: {
    color: OBSIDIAN_COLORS.green_light,
  },
});
