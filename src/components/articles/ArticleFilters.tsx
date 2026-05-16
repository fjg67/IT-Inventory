import React from 'react';
import { FlatList, LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { FilterChip } from './FilterChip';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface ActiveChip {
  key: string;
  icon: string;
  label: string;
  onRemove: () => void;
}

interface ArticleFiltersProps {
  sortLabel: string;
  hasFilters: boolean;
  onSortPress: () => void;
  onFiltersPress: () => void;
  activeChips: ActiveChip[];
  onClearAll?: () => void;
}

const ArticleFiltersComponent: React.FC<ArticleFiltersProps> = ({
  sortLabel,
  hasFilters,
  onSortPress,
  onFiltersPress,
  activeChips,
  onClearAll,
}) => {
  const openSort = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSortPress();
  };

  const openFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onFiltersPress();
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable style={[styles.btn, hasFilters && styles.btnActive]} onPress={openSort}>
          <Icon name="sort" size={14} color={hasFilters ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_muted} />
          <Text style={[styles.btnText, hasFilters && styles.btnTextActive]} numberOfLines={1}>{sortLabel}</Text>
          <Icon name="chevron-down" size={16} color={OBSIDIAN_COLORS.text_muted} />
        </Pressable>

        <Pressable style={[styles.btn, hasFilters && styles.btnActive]} onPress={openFilters}>
          <Icon name="filter-variant" size={14} color={hasFilters ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_muted} />
          <Text style={[styles.btnText, hasFilters && styles.btnTextActive]}>Filtres</Text>
          <Icon name="chevron-down" size={16} color={OBSIDIAN_COLORS.text_muted} />
        </Pressable>
      </View>

      {activeChips.length > 0 ? (
        <FlatList
          horizontal
          data={activeChips}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsList}
          renderItem={({ item }) => (
            <FilterChip icon={item.icon} label={item.label} onRemove={item.onRemove} />
          )}
          ListFooterComponent={
            onClearAll && activeChips.length > 1 ? (
              <FilterChip icon="delete-sweep-outline" label="Tout effacer" onRemove={onClearAll} danger />
            ) : null
          }
        />
      ) : null}
    </View>
  );
};

export const ArticleFilters = React.memo(ArticleFiltersComponent);

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_card,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  btnActive: {
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderColor: OBSIDIAN_COLORS.border_accent,
  },
  btnText: {
    color: OBSIDIAN_COLORS.text_primary,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  btnTextActive: {
    color: OBSIDIAN_COLORS.green_light,
  },
  chipsList: {
    gap: 8,
    marginTop: 10,
    paddingBottom: 2,
  },
});
