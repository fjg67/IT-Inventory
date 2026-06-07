import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PCSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  resultsCount?: number;
  placeholder?: string;
}

export const PCSearchBar: React.FC<PCSearchBarProps> = ({ value, onChangeText, onClear, resultsCount, placeholder = 'Hostname, asset ou modèle...' }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <Icon name="magnify" size={18} color={focused ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={OBSIDIAN_COLORS.text_dim}
        style={styles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8} style={styles.clearButton}>
          <Icon name="close" size={16} color={OBSIDIAN_COLORS.text_muted} />
        </Pressable>
      )}
      {typeof resultsCount === 'number' && value.trim().length > 0 ? (
        <View style={styles.badge}><Text style={styles.badgeText}>{resultsCount}</Text></View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_card,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
  },
  wrapFocused: {
    borderColor: OBSIDIAN_COLORS.border_accent,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
  },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_accent,
  },
  badgeText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 11,
    fontWeight: '800',
  },
});
