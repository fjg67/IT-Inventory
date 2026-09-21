import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CAParcPCStatCard } from './CAParcPCStatCard';
import type { PCStatus } from './CAParcPCHeroCard';

const STATUS_ORDER: PCStatus[] = [
  'a_chaud', 'a_reusiner',
  'en_usinage', 'disponible',
  'en_panne', 'envoye',
];

export const CAParcPCStatGrid = ({
  counts,
  activeFilter,
  onFilterChange,
}: {
  counts:         Record<PCStatus, number>;
  activeFilter:   PCStatus | null;
  onFilterChange: (status: PCStatus | null) => void;
}) => (
  <View style={styles.grid}>
    {STATUS_ORDER.map((status) => (
      <CAParcPCStatCard
        key={status}
        status={status}
        count={counts[status] ?? 0}
        isActive={activeFilter === status}
        onPress={() => onFilterChange(activeFilter === status ? null : status)}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    gap:              8,
    paddingHorizontal: 12,
    paddingBottom:    10,
    justifyContent:   'space-between',
  },
});
