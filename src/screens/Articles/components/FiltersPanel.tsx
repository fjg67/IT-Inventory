import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumColors,
  premiumTypography,
  premiumSpacing,
  premiumBorderRadius,
  premiumShadows,
} from '../../../constants/premiumTheme';

export type SortOption = 'nom' | 'reference' | 'stock_asc' | 'stock_desc' | 'date';

export const SORT_LABELS: Record<SortOption, string> = {
  nom: 'Nom A-Z',
  reference: 'Référence',
  stock_asc: 'Stock ↑',
  stock_desc: 'Stock ↓',
  date: 'Date ajout',
};

interface FiltersPanelProps {
  sortBy: SortOption;
  showStockFaible: boolean;
  hasActiveFilters: boolean;
  activeFiltersCount?: number;
  onSortPress: () => void;
  onFiltersPress?: () => void;
  onStockFaibleToggle: () => void;
  onReset: () => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  sortBy,
  showStockFaible,
  hasActiveFilters,
  activeFiltersCount = 0,
  onSortPress,
  onFiltersPress,
  onStockFaibleToggle,
  onReset,
}) => {
  // Animation du chip au toggle
  const chipScale = useSharedValue(1);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const chipAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chipScale.value }],
  }));

  const handleToggleStock = useCallback(() => {
    Vibration.vibrate(10);
    chipScale.value = withSequence(
      withTiming(1.08, { duration: 80 }),
      withTiming(1, { duration: 80 }),
    );
    onStockFaibleToggle();
  }, [onStockFaibleToggle, chipScale]);

  const handleReset = useCallback(() => {
    Vibration.vibrate(10);
    onReset();
  }, [onReset]);

  return (
    <View style={[styles.container, tablet && { paddingHorizontal: premiumSpacing.xl }]}>
      {/* Ligne 1 : Tri + Filtres */}
      <View style={styles.dropdownRow}>
        <TouchableOpacity
          style={[styles.dropdown, tablet && { height: 48, paddingHorizontal: premiumSpacing.lg }]}
          onPress={() => { Vibration.vibrate(10); onSortPress(); }}
          activeOpacity={0.7}
        >
          <Icon name="sort" size={tablet ? 20 : 16} color={premiumColors.text.secondary} />
          <Text style={[styles.dropdownText, tablet && { fontSize: 14 }]} numberOfLines={1}>
            {SORT_LABELS[sortBy]}
          </Text>
          <Icon name="chevron-down" size={tablet ? 20 : 16} color={premiumColors.text.tertiary} />
        </TouchableOpacity>
        {onFiltersPress ? (
          <TouchableOpacity
            style={[styles.dropdown, activeFiltersCount > 0 && styles.dropdownActive, tablet && { height: 48, paddingHorizontal: premiumSpacing.lg }]}
            onPress={() => { Vibration.vibrate(10); onFiltersPress(); }}
            activeOpacity={0.7}
          >
            <Icon
              name="filter-variant"
              size={tablet ? 20 : 16}
              color={activeFiltersCount > 0 ? premiumColors.primary.base : premiumColors.text.secondary}
            />
            <Text
              style={[
                styles.dropdownText,
                activeFiltersCount > 0 && styles.dropdownTextActive,
              ]}
              numberOfLines={1}
            >
              Filtres{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </Text>
            <Icon name="chevron-down" size={tablet ? 20 : 16} color={premiumColors.text.tertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Ligne 2 : Chips + Reset */}
      <View style={styles.chipsRow}>
        <Animated.View style={chipAnimStyle}>
          <TouchableOpacity
            style={[
              styles.chip,
              showStockFaible && styles.chipActive,
            ]}
            onPress={handleToggleStock}
            activeOpacity={0.7}
          >
            <Icon
              name="alert-circle-outline"
              size={tablet ? 18 : 14}
              color={showStockFaible ? premiumColors.warning.dark : premiumColors.text.tertiary}
            />
            <Text
              style={[
                styles.chipText,
                showStockFaible && styles.chipTextActive,
                tablet && { fontSize: 14 },
              ]}
            >
              Stock faible
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {hasActiveFilters && (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Icon name="refresh" size={tablet ? 18 : 14} color={premiumColors.primary.base} />
              <Text style={[styles.resetText, tablet && { fontSize: 14 }]}>Réinitialiser</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: premiumSpacing.lg,
    paddingVertical: premiumSpacing.sm,
    gap: premiumSpacing.sm,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: premiumSpacing.sm,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: premiumColors.surface,
    borderRadius: premiumBorderRadius.md,
    borderWidth: 1,
    borderColor: premiumColors.border,
    paddingHorizontal: premiumSpacing.md,
    height: 42,
    gap: premiumSpacing.xs,
  },
  dropdownText: {
    ...premiumTypography.caption,
    color: premiumColors.text.secondary,
    flex: 1,
  },
  dropdownActive: {
    borderColor: premiumColors.primary.base + '40',
    backgroundColor: premiumColors.primary.base + '06',
  },
  dropdownTextActive: {
    color: premiumColors.primary.base,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: premiumSpacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: premiumSpacing.md,
    paddingVertical: premiumSpacing.sm,
    borderRadius: premiumBorderRadius.full,
    backgroundColor: premiumColors.surface,
    borderWidth: 1,
    borderColor: premiumColors.border,
    gap: premiumSpacing.xs,
  },
  chipActive: {
    backgroundColor: premiumColors.warning.base + '15',
    borderColor: premiumColors.warning.base + '40',
  },
  chipText: {
    ...premiumTypography.small,
    color: premiumColors.text.tertiary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: premiumColors.warning.dark,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: premiumSpacing.sm,
    paddingVertical: premiumSpacing.xs,
  },
  resetText: {
    ...premiumTypography.small,
    color: premiumColors.primary.base,
    fontWeight: '600',
  },
});

export default FiltersPanel;
