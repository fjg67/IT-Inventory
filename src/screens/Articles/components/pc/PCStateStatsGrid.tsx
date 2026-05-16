import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PCStateCard } from './PCStateCard';
import { PC_STATE_COLORS, PC_STATE_ORDER, PCStateKey } from '@/constants/pcStates';

interface PCStateStatsGridProps {
  total: number;
  counts: Record<PCStateKey, number>;
  onStatePress?: (state: PCStateKey | null) => void;
}

export const PCStateStatsGrid: React.FC<PCStateStatsGridProps> = ({ total, counts, onStatePress }) => {
  return (
    <View style={styles.grid}>
      <View style={styles.fullWidthCell}>
        <PCStateCard
          meta={{ ...PC_STATE_COLORS.a_chaud, label: 'PC portables' }}
          value={total}
          total
          index={0}
          onPress={() => onStatePress?.(null)}
        />
      </View>
      {PC_STATE_ORDER.map((state, index) => (
        <View key={state} style={styles.halfCell}>
          <PCStateCard
            meta={PC_STATE_COLORS[state]}
            value={counts[state] ?? 0}
            index={index + 1}
            onPress={() => onStatePress?.(state)}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fullWidthCell: {
    width: '100%',
  },
  halfCell: {
    width: '48.5%',
  },
});
