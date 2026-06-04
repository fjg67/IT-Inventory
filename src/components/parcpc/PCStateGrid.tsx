import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PCStateKey, PCStateMeta } from '@/constants/pcStates';
import { PCStateCard } from './PCStateCard';

interface PCStateGridItem extends PCStateMeta {
  count: number;
}

interface PCStateGridProps {
  items: PCStateGridItem[];
  onPressState?: (state: PCStateKey) => void;
  activeStateKey?: PCStateKey | null;
}

export const PCStateGrid: React.FC<PCStateGridProps> = ({ items, onPressState, activeStateKey = null }) => {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.key} style={styles.cell}>
          <PCStateCard
            meta={item}
            count={item.count}
            active={activeStateKey === item.key}
            onPress={() => onPressState?.(item.key)}
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
    gap: 12,
  },
  cell: {
    width: '48.2%',
  },
});
