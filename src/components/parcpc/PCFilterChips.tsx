import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { PCStateKey, PC_STATE_COLORS } from '@/constants/pcStates';
import { PCFilterChip } from './PCFilterChip';

interface PCFilterChipsProps {
  activeStates: PCStateKey[];
  counts: Record<PCStateKey, number>;
  onToggle: (state: PCStateKey) => void;
}

export const PCFilterChips: React.FC<PCFilterChipsProps> = ({ activeStates, counts, onToggle }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {(Object.keys(PC_STATE_COLORS) as PCStateKey[]).map((key) => (
        <PCFilterChip
          key={key}
          meta={PC_STATE_COLORS[key]}
          count={counts[key] ?? 0}
          active={activeStates.includes(key)}
          onPress={() => onToggle(key)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingRight: 16,
  },
});
