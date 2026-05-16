import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MovementFilterChip } from './MovementFilterChip';
import { MovementTypeKey } from '@/constants/movementTypes';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface MovementFiltersProps {
  counts: Record<MovementTypeKey, number>;
  activeType: MovementTypeKey;
  onTypeChange: (type: MovementTypeKey) => void;
}

export const MovementFilters: React.FC<MovementFiltersProps> = ({ counts, activeType, onTypeChange }) => (
  <View style={styles.wrap}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Icon name="filter-variant" size={12} color={OBSIDIAN_COLORS.text_muted} />
        <Text style={styles.title}>FILTRES RAPIDES</Text>
      </View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {(['tous', 'entree', 'sortie', 'ajustement', 'transfert'] as const).map((type) => (
        <MovementFilterChip key={type} type={type} active={activeType === type} count={counts[type]} onPress={() => onTypeChange(type)} />
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chips: {
    gap: 8,
  },
});
