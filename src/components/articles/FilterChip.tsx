import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeOut, Layout } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface FilterChipProps {
  icon: string;
  label: string;
  onRemove: () => void;
  danger?: boolean;
}

const FilterChipComponent: React.FC<FilterChipProps> = ({ icon, label, onRemove, danger = false }) => {
  return (
    <Animated.View layout={Layout.springify()} exiting={FadeOut.duration(180)}>
      <View style={[styles.chip, danger ? styles.dangerChip : styles.greenChip]}>
        <Icon name={icon} size={14} color={danger ? OBSIDIAN_COLORS.danger : OBSIDIAN_COLORS.green_light} />
        <Text style={[styles.label, danger ? styles.dangerLabel : styles.greenLabel]}>{label}</Text>
        <Pressable onPress={onRemove} hitSlop={10}>
          <Icon name="close" size={14} color={danger ? OBSIDIAN_COLORS.danger : OBSIDIAN_COLORS.green_light} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

export const FilterChip = React.memo(FilterChipComponent);

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  greenChip: {
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderColor: OBSIDIAN_COLORS.border_accent,
  },
  dangerChip: {
    backgroundColor: OBSIDIAN_COLORS.danger_subtle,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  greenLabel: {
    color: OBSIDIAN_COLORS.green_light,
  },
  dangerLabel: {
    color: OBSIDIAN_COLORS.danger,
  },
});
