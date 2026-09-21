import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, PC_STATUS_CA } from '@/constants/caTheme';
import type { PCStatus } from './CAParcPCHeroCard';

interface CAParcPCSearchBarProps {
  query:          string;
  onQueryChange:  (text: string) => void;
  onClear:        () => void;
  statusCounts:   Record<PCStatus, number>;
  activeStatus:   PCStatus | null;
  onStatusChange: (status: PCStatus | null) => void;
}

export const CAParcPCSearchBar = ({
  query,
  onQueryChange,
  onClear,
  statusCounts,
  activeStatus,
  onStatusChange,
}: CAParcPCSearchBarProps) => (
  <View style={styles.wrap}>

    {/* Barre de recherche */}
    <View style={styles.inputRow}>
      <Icon name="magnify" size={16} color={CA_THEME.textMuted} />
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Hostname, asset ou modèle..."
        placeholderTextColor={CA_THEME.textMuted}
        style={styles.input}
        returnKeyType="search"
        accessibilityLabel="Rechercher un PC"
      />
      {query.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8}
          accessibilityRole="button" accessibilityLabel="Effacer">
          <Icon name="close" size={15} color={CA_THEME.textMuted} />
        </Pressable>
      )}
    </View>

    {/* Chips statut scrollables */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsScroll}>
      {Object.entries(PC_STATUS_CA).map(([key, conf]) => {
        const isActive = activeStatus === key;
        const count    = statusCounts[key as PCStatus] ?? 0;
        return (
          <Pressable
            key={key}
            onPress={() => onStatusChange(isActive ? null : key as PCStatus)}
            style={[
              styles.chip,
              isActive
                ? { backgroundColor: conf.subtle, borderColor: conf.color, borderWidth: 1.5 }
                : { backgroundColor: CA_THEME.white, borderColor: CA_THEME.borderGray, borderWidth: 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${conf.label} (${count})`}
          >
            <Icon name={conf.icon} size={11}
              color={isActive ? conf.color : CA_THEME.textMuted} />
            <Text style={[
              styles.chipLabel,
              { color: isActive ? conf.textDark : CA_THEME.textSecondary }
            ]}>
              {conf.label}
            </Text>
            <Text style={[
              styles.chipCount,
              { color: isActive ? conf.color : CA_THEME.textMuted }
            ]}>
              {count}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>

  </View>
);

const styles = StyleSheet.create({
  wrap:       { paddingHorizontal: 12, paddingBottom: 10 },
  inputRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   CA_THEME.white,
    borderWidth:       1,
    borderColor:       CA_THEME.borderGray,
    borderRadius:      8,
    paddingHorizontal: 12,
    paddingVertical:   9,
    marginBottom:      8,
  },
  input: { flex: 1, fontSize: 13, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.textPrimary, padding: 0 },
  chipsScroll: { gap: 6, paddingRight: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  chipLabel: { fontSize: 11, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600' },
  chipCount: { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
});
