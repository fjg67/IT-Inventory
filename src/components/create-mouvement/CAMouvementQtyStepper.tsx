import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, MOVEMENT_TYPE_CA } from '@/constants/caTheme';
import type { MovementType } from './CAMouvementTypeGrid';

interface CAMouvementQtyStepperProps {
  value:       number;
  onChange:    (newValue: number) => void;
  min?:        number;
  max?:        number;
  movementType: MovementType;
}

export const CAMouvementQtyStepper = ({
  value, onChange, min = 1, max = 9999, movementType,
}: CAMouvementQtyStepperProps) => {
  const typeConf = MOVEMENT_TYPE_CA[movementType];

  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <View style={styles.row} role="group" aria-label="Quantité">

      {/* Bouton − */}
      <Pressable
        onPress={decrement}
        disabled={value <= min}
        style={[styles.btnMinus, value <= min && styles.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Diminuer la quantité"
        accessibilityState={{ disabled: value <= min }}
        hitSlop={4}
      >
        <Icon name="minus" size={20}
          color={value <= min ? CA_THEME.textMuted : CA_THEME.danger} />
      </Pressable>

      {/* Affichage quantité */}
      <View style={styles.display}
        accessibilityLabel={`Quantité : ${value}`}
        accessibilityLiveRegion="polite">
        <Text style={styles.displayNum}>{value}</Text>
      </View>

      {/* Bouton + */}
      <Pressable
        onPress={increment}
        disabled={value >= max}
        style={[styles.btnPlus, { backgroundColor: typeConf.color }, value >= max && styles.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Augmenter la quantité"
        accessibilityState={{ disabled: value >= max }}
        hitSlop={4}
      >
        <Icon name="plus" size={20} color={CA_THEME.white} />
      </Pressable>

    </View>
  );
};

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnMinus: {
    width: 46, height: 46, borderRadius: 11,
    backgroundColor: CA_THEME.dangerBg,
    borderWidth: 1.5, borderColor: 'rgba(211,47,47,0.25)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  btnPlus: {
    width: 46, height: 46, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  btnDisabled: { opacity: 0.4 },
  display: {
    flex: 1,
    backgroundColor: CA_THEME.white,
    borderRadius: 11, borderWidth: 1, borderColor: CA_THEME.borderGray,
    paddingVertical: 10, alignItems: 'center',
  },
  displayNum: { fontSize: 26, fontWeight: '800', color: CA_THEME.textPrimary },
});
