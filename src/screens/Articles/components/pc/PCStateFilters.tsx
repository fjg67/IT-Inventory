import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PCStateFilterButton } from './PCStateFilterButton';
import { PC_STATE_COLORS, PCStateKey, PCStateMeta } from '@/constants/pcStates';

interface PCStateFiltersProps {
  activeStatus: string | null;
  counts: Record<PCStateKey, number>;
  onStatusChange: (status: string | null) => void;
}

const FILTER_ORDER: Array<{ key: PCStateKey; meta: PCStateMeta }> = [
  { key: 'a_chaud', meta: PC_STATE_COLORS.a_chaud },
  { key: 'a_reusiner', meta: PC_STATE_COLORS.a_reusiner },
  { key: 'en_usinage', meta: PC_STATE_COLORS.en_usinage },
  { key: 'disponible', meta: PC_STATE_COLORS.disponible },
  { key: 'envoye', meta: PC_STATE_COLORS.envoye },
];

const toLabel = (key: PCStateKey) => PC_STATE_COLORS[key].label;

export const PCStateFilters: React.FC<PCStateFiltersProps> = ({ activeStatus, counts, onStatusChange }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {FILTER_ORDER.map(({ key, meta }) => {
          const label = toLabel(key);
          return (
            <View key={key} style={styles.cell}>
              <PCStateFilterButton
                meta={meta}
                active={activeStatus === label}
                count={counts[key] ?? 0}
                onPress={() => onStatusChange(activeStatus === label ? null : label)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '48.4%',
  },
});
