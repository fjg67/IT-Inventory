import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PanneDescriptionInputProps {
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
  minLength?: number;
}

export const PanneDescriptionInput: React.FC<PanneDescriptionInputProps> = ({
  value,
  onChange,
  maxLength = 500,
  minLength = 10,
}) => {
  const isValid = value.trim().length >= minLength;
  const charCount = value.length;
  const charCountStyle = isValid
    ? styles.charCountOk
    : charCount > 0
      ? styles.charCountWarn
      : styles.charCount;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Description de la panne *</Text>
        <Text style={charCountStyle}>
          {charCount} / {maxLength}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Décrivez le problème en détail..."
        placeholderTextColor={OBSIDIAN_COLORS.text_muted}
        multiline
        numberOfLines={4}
        maxLength={maxLength}
        style={[styles.input, !isValid && styles.inputInvalid, isValid && styles.inputValid]}
      />
      {!isValid && (
        <Text style={styles.helpText}>Minimum {minLength} caractères requis</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.text_primary,
  },
  charCount: {
    fontSize: 10,
    color: OBSIDIAN_COLORS.text_muted,
  },
  charCountWarn: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '700',
  },
  charCountOk: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0A0F0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputInvalid: {
    borderColor: 'rgba(245, 158, 11, 0.40)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  inputValid: {
    borderColor: 'rgba(34, 197, 94, 0.30)',
  },
  helpText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '500',
  },
});
