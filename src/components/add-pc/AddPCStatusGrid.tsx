import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PC_STATUS_UI } from '@/constants/pcStatusColors';
import { PCStatus } from '@/types/pc.types';
import { AddPCStatusChip } from './AddPCStatusChip';

const STATUS_ORDER: PCStatus[] = [
  'a_chaud',
  'a_reusiner',
  'en_usinage',
  'disponible',
  'envoye',
  'en_panne',
];

interface AddPCStatusGridProps {
  selected: PCStatus | null;
  onSelect: (status: PCStatus) => void;
}

export const AddPCStatusGrid: React.FC<AddPCStatusGridProps> = ({ selected, onSelect }) => {
  return (
    <View style={styles.grid}>
      {STATUS_ORDER.map((status) => (
        <View key={status} style={styles.itemWrap}>
          <AddPCStatusChip
            statusKey={status}
            config={PC_STATUS_UI[status]}
            isActive={selected === status}
            onPress={onSelect}
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
    marginTop: 4,
    marginHorizontal: -4,
  },
  itemWrap: {
    width: '33.3333%',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});
