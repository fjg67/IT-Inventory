import React from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

export const CAArticleSearchBar = ({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (t: string) => void;
  onClear: () => void;
}) => (
  <View style={styles.wrap}>
    <View style={styles.inputRow}>
      <Icon name="magnify" size={20} color={CA_THEME.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Rechercher par référence ou nom..."
        placeholderTextColor={CA_THEME.textMuted}
        style={styles.input}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Rechercher un article"
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8}
          accessibilityRole="button" accessibilityLabel="Effacer la recherche">
          <Icon name="close" size={18} color={CA_THEME.textMuted} />
        </Pressable>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, marginBottom: 10 },
  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    backgroundColor: CA_THEME.white,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderRadius:    12,
    paddingHorizontal: 14,
    paddingVertical:   12,
    shadowColor: CA_THEME.greenDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  input: {
    flex:       1,
    fontSize:   14,
    fontFamily: CA_THEME.fontFamilyMedium,
    color:      CA_THEME.textPrimary,
    padding:    0,
  },
});
