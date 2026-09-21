import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { PCCategory } from '@/hooks/useAddPCForm';

interface AddPCCategorySelectorProps {
  selected: PCCategory | null;
  onSelect: (value: PCCategory) => void;
  activeColor: string;
  disabled?: boolean;
}

const OPTIONS: Array<{ key: PCCategory; label: string; icon: string }> = [
  { key: 'portable_siege', label: 'Portable siège', icon: 'office-building-outline' },
  { key: 'portable_agence', label: 'Portable agence', icon: 'storefront-outline' },
];

export const AddPCCategorySelector: React.FC<AddPCCategorySelectorProps> = ({
  selected,
  onSelect,
  activeColor,
  disabled = false,
}) => {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = option.key === selected;
        return (
          <Pressable
            key={option.key}
            disabled={disabled}
            onPress={() => onSelect(option.key)}
            style={[
              styles.chip,
              active
                ? { borderColor: activeColor, backgroundColor: 'rgba(0,125,112,0.08)' }
                : null,
            ]}
          >
            <Icon name={option.icon} size={18} color={active ? activeColor : '#5A5A55'} />
            <Text style={[styles.label, active ? { color: activeColor } : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,125,112,0.2)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
  },
});
