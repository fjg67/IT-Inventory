// ============================================
// DescriptionTextarea — Obsidian Grid
// IT-Inventory Application
// ============================================
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CAC } from './createArticleColors';

const MAX_CHARS = 200;

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export const DescriptionTextarea: React.FC<Props> = ({ value, onChange }) => {
  const [focused, setFocused] = React.useState(false);
  const count = value.length;
  const countColor =
    count >= MAX_CHARS ? CAC.danger :
    count >= 180       ? CAC.warning :
    CAC.text_dim;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.optional}> (optionnel)</Text>
      </View>

      <View style={[
        styles.box,
        focused && { borderColor: CAC.warning },
      ]}>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          value={value}
          onChangeText={t => onChange(t.slice(0, MAX_CHARS))}
          placeholder="Détails supplémentaires..."
          placeholderTextColor={CAC.text_dim}
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Text style={[styles.counter, { color: countColor }]}>
          {count}/{MAX_CHARS}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: CAC.text_primary },
  optional: { fontSize: 12, color: CAC.text_muted },
  box: {
    backgroundColor: CAC.bg_card_elevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CAC.border_subtle,
    padding: 14,
  },
  input: {
    fontSize: 14,
    color: CAC.text_primary,
    minHeight: 100,
    paddingVertical: 0,
  },
  counter: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
});
