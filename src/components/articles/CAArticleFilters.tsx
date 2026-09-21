import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface CAArticleFiltersProps {
  sortLabel: string;
  hasFilters: boolean;
  onSortPress: () => void;
  onFiltersPress: () => void;
  defectiveCount?: number;
  showDefective?: boolean;
  onToggleDefective?: () => void;
}

export const CAArticleFilters = ({
  sortLabel,
  hasFilters,
  onSortPress,
  onFiltersPress,
  defectiveCount = 0,
  showDefective = false,
  onToggleDefective,
}: CAArticleFiltersProps) => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <Pressable style={[styles.dropdown, hasFilters && styles.dropdownActive]} onPress={onSortPress}
        accessibilityRole="button" accessibilityLabel="Changer le tri">
        <Icon name="sort" size={16} color={hasFilters ? CA_THEME.green : CA_THEME.textSecondary} />
        <Text style={[styles.dropdownText, hasFilters && styles.dropdownTextActive]} numberOfLines={1}>{sortLabel}</Text>
        <Icon name="chevron-down" size={16} color={CA_THEME.textMuted} />
      </Pressable>

      <Pressable style={[styles.dropdown, hasFilters && styles.dropdownActive]} onPress={onFiltersPress}
        accessibilityRole="button" accessibilityLabel="Ouvrir les filtres">
        <Icon name="filter-variant" size={16} color={hasFilters ? CA_THEME.green : CA_THEME.textSecondary} />
        <Text style={[styles.dropdownText, hasFilters && styles.dropdownTextActive]}>Filtres</Text>
        <Icon name="chevron-down" size={16} color={CA_THEME.textMuted} />
      </Pressable>
    </View>

    {onToggleDefective && (
      <Pressable
        onPress={onToggleDefective}
        style={[styles.defChip, showDefective && styles.defChipActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: showDefective }}
      >
        <Icon
          name="hammer-wrench"
          size={14}
          color={showDefective ? CA_THEME.danger : CA_THEME.textMuted}
        />
        <Text style={[
          styles.defChipText,
          { color: showDefective ? CA_THEME.danger : CA_THEME.textMuted }
        ]}>
          Défectueux ({defectiveCount} unités)
        </Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap:  { paddingHorizontal: 12, marginBottom: 10 },
  row:   { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dropdown: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: CA_THEME.white,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderRadius:    8,
  },
  dropdownActive: {
    borderColor: CA_THEME.green,
    backgroundColor: CA_THEME.greenBg,
  },
  dropdownText: { flex: 1, fontSize: 13, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.textSecondary },
  dropdownTextActive: { color: CA_THEME.greenText },
  defChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: CA_THEME.dangerBg,
    borderWidth: 1, borderColor: 'rgba(211,47,47,0.22)',
    alignSelf: 'flex-start',
  },
  defChipActive: {
    borderColor: CA_THEME.danger,
    borderWidth: 1.5,
  },
  defChipText: { fontSize: 12, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600' },
});
