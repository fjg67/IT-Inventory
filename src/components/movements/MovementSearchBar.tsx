import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface MovementSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
  visible: boolean;
  resultsCount?: number;
}

export const MovementSearchBar: React.FC<MovementSearchBarProps> = ({ value, onChangeText, onCancel, visible, resultsCount }) => {
  const [focused, setFocused] = useState(false);
  if (!visible) return null;

  return (
    <Animated.View entering={FadeInDown.duration(260)} style={styles.wrap}>
      <View style={[styles.bar, focused && styles.barFocused]}>
        <Icon name="magnify" size={18} color={focused ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_muted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Rechercher article, référence, opérateur..."
          placeholderTextColor={OBSIDIAN_COLORS.text_dim}
          style={styles.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText('')} style={styles.clearBtn}><Icon name="close" size={16} color={OBSIDIAN_COLORS.text_muted} /></Pressable>
        ) : null}
        <Pressable onPress={onCancel} style={styles.cancelBtn}><Text style={styles.cancelText}>Annuler</Text></Pressable>
      </View>
      {typeof resultsCount === 'number' ? <View style={styles.resultsPill}><Text style={styles.resultsText}>{resultsCount} résultats</Text></View> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  bar: {
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
  barFocused: {
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
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
  },
  cancelBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  cancelText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 12,
    fontWeight: '700',
  },
  resultsPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: OBSIDIAN_COLORS.info_subtle,
  },
  resultsText: {
    color: OBSIDIAN_COLORS.info,
    fontSize: 11,
    fontWeight: '700',
  },
});
