import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
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
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

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
  sortLabel?: string;
  showStockFaible: boolean;
  showStockFaibleChip?: boolean;
  filtersLabel?: string;
  hasActiveFilters: boolean;
  activeFiltersCount?: number;
  onSortPress: () => void;
  onFiltersPress?: () => void;
  onStockFaibleToggle: () => void;
  onReset: () => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  sortBy,
  sortLabel,
  showStockFaible,
  showStockFaibleChip = true,
  filtersLabel = 'Filtres',
  hasActiveFilters,
  activeFiltersCount = 0,
  onSortPress,
  onFiltersPress,
  onStockFaibleToggle,
  onReset,
}) => {
  const { colors, isDark } = useTheme();
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
      {/* Row 1: Sort + Filters */}
      <View style={styles.dropdownRow}>
        <Pressable
          style={({ pressed }) => ([
            styles.dropdown,
            {
              backgroundColor: pressed
                ? (isDark ? 'rgba(255,255,255,0.08)' : '#F8FAFC')
                : (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'),
              borderColor: colors.borderSubtle,
            },
            tablet && { height: 46, paddingHorizontal: premiumSpacing.lg },
            pressed && styles.dropdownPressed,
          ])}
          onPress={() => { Vibration.vibrate(10); onSortPress(); }}
        >
          <View style={[styles.dropdownIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
            <Icon name="sort" size={14} color={colors.textSecondary} />
          </View>
          <Text
            style={[styles.dropdownText, { color: colors.textPrimary }, tablet && { fontSize: 14 }]}
            numberOfLines={1}
          >
            {sortLabel ?? SORT_LABELS[sortBy]}
          </Text>
          <Icon name="chevron-down" size={16} color={colors.textMuted} />
          <View style={[styles.dropdownAccent, { backgroundColor: colors.primary }]} />
        </Pressable>

        {onFiltersPress ? (
          <Pressable
            style={({ pressed }) => ([
              styles.dropdown,
              {
                backgroundColor: pressed
                  ? (isDark ? 'rgba(255,255,255,0.08)' : '#F8FAFC')
                  : (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'),
                borderColor: activeFiltersCount > 0 ? colors.primary + '50' : colors.borderSubtle,
              },
              tablet && { height: 46, paddingHorizontal: premiumSpacing.lg },
              pressed && styles.dropdownPressed,
            ])}
            onPress={() => { Vibration.vibrate(10); onFiltersPress(); }}
          >
            <View
              style={[
                styles.dropdownIconWrap,
                {
                  backgroundColor: activeFiltersCount > 0
                    ? colors.primary + '15'
                    : isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                },
              ]}
            >
              <Icon
                name="filter-variant"
                size={14}
                color={activeFiltersCount > 0 ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.dropdownText,
                { color: colors.textPrimary },
                activeFiltersCount > 0 && { color: colors.primary, fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {filtersLabel}
            </Text>
            {activeFiltersCount > 0 ? (
              <View style={[styles.filterCountBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterCountText}>{activeFiltersCount}</Text>
              </View>
            ) : (
              <Icon name="chevron-down" size={16} color={colors.textMuted} />
            )}
            {activeFiltersCount > 0 && <View style={[styles.dropdownAccent, { backgroundColor: colors.primary }]} />}
          </Pressable>
        ) : null}
      </View>

      {/* Row 2: Chips + Reset */}
      <View style={styles.chipsRow}>
        {showStockFaibleChip && (
          <Animated.View style={chipAnimStyle}>
            <TouchableOpacity
              style={[
                styles.chip,
                showStockFaible
                  ? {
                      backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)',
                      borderColor: colors.warning + '50',
                    }
                  : {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      borderColor: colors.borderSubtle,
                    },
              ]}
              onPress={handleToggleStock}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.chipIconWrap,
                  {
                    backgroundColor: showStockFaible
                      ? colors.warning + '20'
                      : isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                  },
                ]}
              >
                <Icon
                  name="alert-circle-outline"
                  size={13}
                  color={showStockFaible ? colors.warning : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  showStockFaible
                    ? { color: colors.warning, fontWeight: '600' }
                    : { color: colors.textSecondary },
                  tablet && { fontSize: 13 },
                ]}
              >
                Stock faible
              </Text>
              {showStockFaible && (
                <View style={[styles.chipActiveIndicator, { backgroundColor: colors.warning }]} />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {hasActiveFilters && (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
            <TouchableOpacity
              style={[
                styles.resetButton,
                {
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary + '20',
                },
              ]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Icon name="refresh" size={14} color={colors.primary} />
              <Text style={[styles.resetText, { color: colors.primary }, tablet && { fontSize: 13 }]}>
                Reset
              </Text>
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
    paddingVertical: 12,
    gap: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  dropdownPressed: {
    transform: [{ scale: 0.992 }],
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  dropdownAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    opacity: 0.95,
  },
  filterCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 7,
    paddingRight: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  chipIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipActiveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default FiltersPanel;
