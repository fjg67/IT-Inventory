import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PanneTicketInputProps {
  value: string;
  onChange: (text: string) => void;
}

export const PanneTicketInput: React.FC<PanneTicketInputProps> = ({ value, onChange }) => (
  <View style={styles.container}>
    <Text style={styles.label}>Numéro de ticket SAV (optionnel)</Text>
    <View style={styles.inputWrapper}>
      <Icon name="ticket-outline" size={14} color={OBSIDIAN_COLORS.text_muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ex: SAV-2024-001234"
        placeholderTextColor={OBSIDIAN_COLORS.text_muted}
        style={styles.input}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.text_primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16231A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
  },
});
