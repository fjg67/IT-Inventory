import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MovementIdentity, MovementType } from './movementTheme';
import { MovementTypeChip } from './MovementTypeChip';

interface Props {
  value: MovementType;
  identity: MovementIdentity;
  onChange: (value: MovementType) => void;
}

export const MovementTypeSelector: React.FC<Props> = ({ value, identity, onChange }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={[styles.accent, { backgroundColor: identity.color }]} />
        <Text style={[styles.title, { color: identity.color }]}>Type de mouvement *</Text>
      </View>

      <View style={styles.row}>
        <MovementTypeChip value="entree" selected={value === 'entree'} onPress={onChange} />
        <MovementTypeChip value="sortie" selected={value === 'sortie'} onPress={onChange} />
        <MovementTypeChip value="ajustement" selected={value === 'ajustement'} onPress={onChange} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  accent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
