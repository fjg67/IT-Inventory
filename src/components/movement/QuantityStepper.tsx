import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';

interface Props {
  identity: MovementIdentity;
  value: number;
  min: number;
  onValueChange: (next: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onIncrementHoldStart: () => void;
  onDecrementHoldStart: () => void;
  onHoldEnd: () => void;
}

export const QuantityStepper: React.FC<Props> = ({
  identity,
  value,
  min,
  onValueChange,
  onIncrement,
  onDecrement,
  onIncrementHoldStart,
  onDecrementHoldStart,
  onHoldEnd,
}) => {
  const canDecrease = value > min;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={[styles.accent, { backgroundColor: identity.color }]} />
        <Text style={[styles.title, { color: identity.color }]}>Quantite *</Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, { opacity: canDecrease ? 1 : 0.4 }]}
          onPress={onDecrement}
          onPressIn={onDecrementHoldStart}
          onPressOut={onHoldEnd}
          disabled={!canDecrease}
        >
          <Icon name="minus" size={20} color={MOVEMENT_COLORS.danger} />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(value)}
            onChangeText={onValueChange}
            textAlign="center"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: identity.colorDark, borderColor: identity.border }]}
          onPress={onIncrement}
          onPressIn={onIncrementHoldStart}
          onPressOut={onHoldEnd}
        >
          <Icon name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
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
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    justifyContent: 'center',
  },
  input: {
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 28,
    fontWeight: '800',
  },
});
