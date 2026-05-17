import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';

interface Props {
  identity: MovementIdentity;
  value: string;
  onChange: (next: string) => void;
}

export const CommentTextarea: React.FC<Props> = ({ identity, value, onChange }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={[styles.accent, { backgroundColor: identity.color }]} />
        <Text style={[styles.title, { color: identity.color }]}>Commentaire (optionnel)</Text>
      </View>

      <View style={[styles.box, focused && { borderColor: identity.border }]}>
        <TextInput
          style={styles.input}
          multiline
          maxLength={200}
          value={value}
          onChangeText={onChange}
          placeholder="Motif, precision..."
          placeholderTextColor={MOVEMENT_COLORS.text_dim}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical="top"
        />
        <Text style={[styles.counter, value.length > 180 && { color: MOVEMENT_COLORS.warning }]}>{value.length}/200</Text>
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
  box: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    minHeight: 90,
    padding: 12,
  },
  input: {
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 14,
    minHeight: 58,
  },
  counter: {
    alignSelf: 'flex-end',
    color: MOVEMENT_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '600',
  },
});
