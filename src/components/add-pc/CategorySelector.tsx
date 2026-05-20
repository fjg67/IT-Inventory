import React from 'react';
import { StyleSheet, View } from 'react-native';
import CategoryChip from './CategoryChip';
import { PCCategory, PC_CATEGORY_OPTIONS } from '@/hooks/useAddPCForm';

interface CategorySelectorProps {
  value: PCCategory | null;
  onChange: (value: PCCategory) => void;
  disabled?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange, disabled = false }) => {
  return (
    <View style={styles.row}>
      {PC_CATEGORY_OPTIONS.map((option) => (
        <CategoryChip
          key={option.key}
          label={option.label}
          icon={option.icon}
          selected={value === option.key}
          onPress={() => onChange(option.key)}
          disabled={disabled}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default CategorySelector;
