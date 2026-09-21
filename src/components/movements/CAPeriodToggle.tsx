import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

export type Period = 'today' | '7days' | '30days';

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'today',  label: "Aujourd'hui" },
  { key: '7days',  label: '7 jours' },
  { key: '30days', label: '30 jours' },
];

interface CAPeriodToggleProps {
  selected:    Period;
  onChange:    (period: Period) => void;
  vsYesterday?: number;   // comparaison vs hier (%)
}

export const CAPeriodToggle = ({ selected, onChange, vsYesterday }: CAPeriodToggleProps) => (
  <View style={styles.container}>

    {/* Toggle pills */}
    <View style={styles.toggleRow} role="group" aria-label="Sélectionner la période">
      {PERIODS.map(({ key, label }) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          style={[styles.tog, selected === key && styles.togActive]}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected === key }}
          accessibilityLabel={label}
        >
          <Text style={[styles.togText, selected === key && styles.togTextActive]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>

    {/* Comparaison vs hier */}
    {vsYesterday !== undefined && (
      <View style={styles.vsPill} accessibilityLabel={`${vsYesterday >= 0 ? '+' : ''}${vsYesterday}% vs hier`}>
        <Icon
          name={vsYesterday >= 0 ? 'trending-up' : 'trending-down'}
          size={12}
          color={vsYesterday >= 0 ? CA_THEME.green : CA_THEME.danger}
        />
        <Text style={[
          styles.vsText,
          { color: vsYesterday >= 0 ? CA_THEME.greenText : CA_THEME.dangerText }
        ]}>
          {vsYesterday >= 0 ? '+' : ''}{vsYesterday}% vs hier
        </Text>
      </View>
    )}

  </View>
);

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingBottom: 10 },
  toggleRow: {
    flexDirection:   'row',
    backgroundColor: CA_THEME.white,
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    padding:         3,
    gap:             2,
    marginBottom:    8,
  },
  tog: {
    flex:            1,
    paddingVertical: 7,
    borderRadius:    20,
    alignItems:      'center',
  },
  togActive:    { backgroundColor: CA_THEME.green },
  togText:      { fontSize: 13, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.textMuted },
  togTextActive:{ color: CA_THEME.white },
  vsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius:   20,
    backgroundColor: CA_THEME.greenBg,
    borderWidth:    1,
    borderColor:    CA_THEME.greenBg2,
    alignSelf:      'flex-start',
  },
  vsText: { fontSize: 11, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600' },
});
