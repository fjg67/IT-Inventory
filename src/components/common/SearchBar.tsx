// ============================================
// SEARCH BAR COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { colors, spacing, typography, borderRadius, deviceSizes } from '@/constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  onClear?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Rechercher...',
  leftIcon,
  onClear,
  onSubmit,
  autoFocus = false,
}) => {
  return (
    <View style={styles.container}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCorrect={false}
        autoCapitalize="none"
      />
      
      {value.length > 0 && onClear && (
        <Pressable onPress={onClear} style={styles.clearButton}>
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: deviceSizes.buttonMinHeight,
    paddingHorizontal: spacing.md,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  clearText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

export default SearchBar;
