import React from 'react';
import { StyleSheet, View } from 'react-native';
import ModelChip from './ModelChip';

interface ModelSelectorProps {
  value: string | null;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ value, options, onChange, disabled = false }) => {
  return (
    <View style={styles.column}>
      {options.map((model) => (
        <ModelChip
          key={model}
          label={model}
          selected={value === model}
          onPress={() => onChange(model)}
          disabled={disabled}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
});

export default ModelSelector;
