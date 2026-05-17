import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PARC_PC_COLORS } from './tokens';

interface PCSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export const PCSearchBar: React.FC<PCSearchBarProps> = ({ value, onChangeText, onClear }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, focused && styles.focused]}>
      <Icon name="magnify" size={18} color={focused ? PARC_PC_COLORS.green_light : PARC_PC_COLORS.text_muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Hostname, asset ou modele..."
        placeholderTextColor={PARC_PC_COLORS.text_dim}
        style={styles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
          <Icon name="close" size={16} color={PARC_PC_COLORS.text_muted} />
        </Pressable>
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
    borderWidth: 1.5,
    borderColor: PARC_PC_COLORS.border_card,
    backgroundColor: PARC_PC_COLORS.bg_card,
  },
  focused: {
    borderColor: PARC_PC_COLORS.green_border,
    backgroundColor: PARC_PC_COLORS.bg_card_elevated,
  },
  input: {
    flex: 1,
    color: PARC_PC_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PARC_PC_COLORS.bg_card,
  },
});
