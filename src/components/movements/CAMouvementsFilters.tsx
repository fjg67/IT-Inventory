import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

const FILTER_CONFIG = [
  {
    key:       'all',
    label:     'Tous',
    icon:      'format-list-bulleted',
    bgOn:      CA_THEME.green,
    borderOn:  CA_THEME.green,
    textOn:    CA_THEME.white,
    iconOn:    CA_THEME.white,
    bgOff:     CA_THEME.white,
    borderOff: CA_THEME.borderGray,
    textOff:   CA_THEME.textSecondary,
    iconOff:   CA_THEME.textMuted,
  },
  {
    key:       'entree',
    label:     'Entrée',
    icon:      'arrow-down-circle',
    bgOn:      CA_THEME.greenBg,
    borderOn:  CA_THEME.green,
    textOn:    CA_THEME.greenText,
    iconOn:    CA_THEME.green,
    bgOff:     CA_THEME.white,
    borderOff: CA_THEME.borderGray,
    textOff:   CA_THEME.textSecondary,
    iconOff:   CA_THEME.textMuted,
  },
  {
    key:       'sortie',
    label:     'Sortie',
    icon:      'arrow-up-circle',
    bgOn:      CA_THEME.dangerBg,
    borderOn:  CA_THEME.danger,
    textOn:    CA_THEME.dangerText,
    iconOn:    CA_THEME.danger,
    bgOff:     CA_THEME.white,
    borderOff: CA_THEME.borderGray,
    textOff:   CA_THEME.textSecondary,
    iconOff:   CA_THEME.textMuted,
  },
  {
    key:       'ajustement',
    label:     'Ajustement',
    icon:      'swap-vertical',
    bgOn:      CA_THEME.warningBg,
    borderOn:  CA_THEME.warning,
    textOn:    CA_THEME.warningText,
    iconOn:    CA_THEME.warning,
    bgOff:     CA_THEME.white,
    borderOff: CA_THEME.borderGray,
    textOff:   CA_THEME.textSecondary,
    iconOff:   CA_THEME.textMuted,
  },
  {
    key:       'transfert',
    label:     'Transfert',
    icon:      'swap-horizontal',
    bgOn:      CA_THEME.purpleBg,
    borderOn:  CA_THEME.purple,
    textOn:    CA_THEME.purpleText,
    iconOn:    CA_THEME.purple,
    bgOff:     CA_THEME.white,
    borderOff: CA_THEME.borderGray,
    textOff:   CA_THEME.textSecondary,
    iconOff:   CA_THEME.textMuted,
  },
];

export const CAMouvementsFilters = ({
  activeFilter,
  counts,
  onFilterChange,
}: {
  activeFilter:   string;
  counts:         Record<string, number>;
  onFilterChange: (key: string) => void;
}) => (
  <View style={styles.wrap}>
    {/* Label section */}
    <View style={styles.labelRow}>
      <View style={styles.labelBar} aria-hidden />
      <Text style={styles.label}>Filtres rapides</Text>
    </View>

    {/* Chips scrollables */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      accessibilityRole="list"
      accessibilityLabel="Filtrer les mouvements par type"
    >
      {FILTER_CONFIG.map((conf) => {
        const isActive = activeFilter === conf.key;
        const count = counts[conf.key] || 0;
        return (
          <Pressable
            key={conf.key}
            onPress={() => onFilterChange(conf.key)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? conf.bgOn      : conf.bgOff,
                borderColor:     isActive ? conf.borderOn  : conf.borderOff,
                borderWidth:     isActive ? 1.5            : 1,
              }
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${conf.label} (${count})`}
          >
            <Icon
              name={conf.icon}
              size={13}
              color={isActive ? conf.iconOn : conf.iconOff}
            />
            <Text style={[
              styles.chipLabel,
              { color: isActive ? conf.textOn : conf.textOff }
            ]}>
              {conf.label}
            </Text>
            {count > 0 && (
              <Text style={[
                styles.chipCount,
                { color: isActive ? conf.textOn : CA_THEME.textMuted }
              ]}>
                {count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrap:     { paddingHorizontal: 12, paddingBottom: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  labelBar: { width: 3, height: 12, backgroundColor: CA_THEME.green },
  label: {
    fontSize: 9, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
    color: CA_THEME.textMuted,
  },
  scroll:      { gap: 7, paddingRight: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 20,
  },
  chipLabel: { fontSize: 11, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600' },
  chipCount: { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
});
