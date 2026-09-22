import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface CAMouvementQtyStepperProps {
  value:       number;
  onChange:    (newValue: number) => void;
  min?:        number;
  max?:        number;
  themeColor?: string;
}

export const CAMouvementQtyStepper = ({
  value, onChange, min = 1, max = 9999, themeColor = CA_THEME.green,
}: CAMouvementQtyStepperProps) => {

  const [textValue, setTextValue] = useState(String(value));

  useEffect(() => {
    setTextValue(String(value));
  }, [value]);

  const handleTextChange = (text: string) => {
    // Garder uniquement les chiffres
    const numericText = text.replace(/[^0-9]/g, '');
    setTextValue(numericText);
    
    const num = parseInt(numericText, 10);
    if (!isNaN(num)) {
      if (num > max) {
        onChange(max);
      } else {
        onChange(num);
      }
    }
  };

  const handleBlur = () => {
    const num = parseInt(textValue, 10);
    if (isNaN(num) || num < min) {
      onChange(min);
      setTextValue(String(min));
    }
  };

  const decrement = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    onChange(Math.max(min, value - 1));
  };
  const increment = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    onChange(Math.min(max, value + 1));
  };

  return (
    <View style={styles.pillContainer} role="group" aria-label="Quantité">

      {/* Bouton − */}
      <Pressable
        onPress={decrement}
        disabled={value <= min}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, value <= min && styles.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Diminuer la quantité"
        accessibilityState={{ disabled: value <= min }}
        hitSlop={8}
      >
        <Icon name="minus" size={28}
          color={value <= min ? CA_THEME.textMuted : CA_THEME.greenDark} />
      </Pressable>

      {/* Affichage quantité modifiable */}
      <View style={styles.display} accessibilityLabel="Quantité">
        <TextInput
          style={styles.displayNum}
          value={textValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType="number-pad"
          selectTextOnFocus
          maxLength={4}
        />
      </View>

      {/* Bouton + */}
      <Pressable
        onPress={increment}
        disabled={value >= max}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, value >= max && styles.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Augmenter la quantité"
        accessibilityState={{ disabled: value >= max }}
        hitSlop={8}
      >
        <Icon name="plus" size={28} color={themeColor} />
      </Pressable>

    </View>
  );
};

const styles = StyleSheet.create({
  pillContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#F7FBF8',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: CA_THEME.greenBg2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  btn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1,
    borderColor: CA_THEME.greenBg2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  btnPressed: { backgroundColor: CA_THEME.greenBg2, transform: [{ scale: 0.94 }] },
  btnDisabled: { opacity: 0.55 },
  display: {
    width: 76,
    height: 58,
    borderRadius: 15,
    backgroundColor: CA_THEME.white,
    borderWidth: 1,
    borderColor: CA_THEME.greenBg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayNum: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: CA_THEME.greenDark,
    textAlign: 'center',
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
});
