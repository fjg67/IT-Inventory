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

import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FilterButton = ({ active, icon, label, onPress, rightIcon }: any) => {
  const press = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.95]) }],
  }));

  const handlePressIn = () => { press.value = withSpring(1); };
  const handlePressOut = () => { press.value = withSpring(0); };
  const handlePress = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    if (onPress) onPress();
  };

  return (
    <AnimatedPressable
      style={[styles.dropdown, active && styles.dropdownActive, style]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Icon name={icon} size={16} color={active ? CA_THEME.green : CA_THEME.textSecondary} />
      <Text style={[styles.dropdownText, active && styles.dropdownTextActive]} numberOfLines={1}>{label}</Text>
      {rightIcon && <Icon name={rightIcon} size={16} color={CA_THEME.textMuted} />}
    </AnimatedPressable>
  );
};

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
      <FilterButton
        active={hasFilters}
        icon="sort"
        label={sortLabel}
        rightIcon="chevron-down"
        onPress={onSortPress}
      />
      <FilterButton
        active={hasFilters}
        icon="filter-variant"
        label="Filtres"
        rightIcon="chevron-down"
        onPress={onFiltersPress}
      />
    </View>

    {onToggleDefective && (
      <Pressable
        onPress={() => {
          ReactNativeHapticFeedback.trigger('impactLight');
          onToggleDefective();
        }}
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
