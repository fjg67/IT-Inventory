import React from 'react';
import { StyleSheet, View } from 'react-native';
import StatusChip from './StatusChip';
import { PC_STATUS_OPTIONS, PCStatus } from '@/hooks/useAddPCForm';

interface StatusSelectorProps {
  value: PCStatus | null;
  onChange: (value: PCStatus) => void;
  disabled?: boolean;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ value, onChange, disabled = false }) => {
  return (
    <View style={styles.wrap}>
      {PC_STATUS_OPTIONS.map((status) => (
        <StatusChip
          key={status.key}
          value={status.key}
          label={status.label}
          icon={status.icon}
          selected={value === status.key}
          onPress={() => onChange(status.key)}
          disabled={disabled}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default StatusSelector;
