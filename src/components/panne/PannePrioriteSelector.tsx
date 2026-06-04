import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PannePriorite, PRIORITE_CONFIG } from '@/types/pc.types';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PannePrioriteSelectorProps {
  selected: PannePriorite;
  onSelect: (priority: PannePriorite) => void;
}

const PRIORITIES: PannePriorite[] = ['basse', 'moyenne', 'haute', 'critique'];

export const PannePrioriteSelector: React.FC<PannePrioriteSelectorProps> = ({ selected, onSelect }) => (
  <View style={styles.priorityRow}>
    {PRIORITIES.map((p) => {
      const config = PRIORITE_CONFIG[p];
      const isActive = selected === p;
      const isCritical = p === 'critique';

      return (
        <TouchableOpacity
          key={p}
          onPress={() => onSelect(p)}
          style={[
            styles.priorityBtn,
            {
              backgroundColor: isActive
                ? isCritical
                  ? '#EF4444'
                  : config.subtle
                : '#16231A',
              borderColor: isActive ? config.border : 'rgba(255, 255, 255, 0.04)',
            },
          ]}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.priorityLabel,
              { color: isActive ? (isCritical ? 'white' : config.color) : OBSIDIAN_COLORS.text_muted },
            ]}
          >
            {config.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  priorityRow: {
    flexDirection: 'row',
    gap: 7,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
