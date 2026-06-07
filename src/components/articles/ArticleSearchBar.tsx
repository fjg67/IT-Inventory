import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface ArticleSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  resultsCount?: number;
}

const ArticleSearchBarComponent: React.FC<ArticleSearchBarProps> = ({ value, onChangeText, onClear, resultsCount }) => {
  const [focused, setFocused] = useState(false);

  const iconColor = useMemo(() => (focused ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_muted), [focused]);

  return (
    <View>
      <View style={[styles.wrap, focused && styles.wrapFocused]}>
        <Icon name="magnify" size={18} color={iconColor} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          placeholder="Rechercher par reference ou nom..."
          placeholderTextColor={OBSIDIAN_COLORS.text_dim}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
        />

        {value.length > 0 ? (
          <Pressable onPress={onClear} style={styles.clearBtn}>
            <Icon name="close" size={14} color={OBSIDIAN_COLORS.text_muted} />
          </Pressable>
        ) : null}
      </View>

      {value.trim() && resultsCount !== undefined ? (
        <View style={styles.resultsPill}>
          <Text style={styles.resultsText}>{`${resultsCount} resultats pour "${value.trim()}"`}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const ArticleSearchBar = React.memo(ArticleSearchBarComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_card,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  wrapFocused: {
    borderColor: OBSIDIAN_COLORS.border_accent,
  },
  input: {
    color: OBSIDIAN_COLORS.text_primary,
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    paddingVertical: 10,
  },
  clearBtn: {
    alignItems: 'center',
    borderRadius: 10,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  resultsPill: {
    alignSelf: 'flex-start',
    backgroundColor: OBSIDIAN_COLORS.info_subtle,
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resultsText: {
    color: OBSIDIAN_COLORS.info,
    fontSize: 11,
    fontWeight: '600',
  },
});
