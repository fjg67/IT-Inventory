import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MovementIdentity, MovementType, MOVEMENT_IDENTITIES, MOVEMENT_COLORS } from './movementTheme';

interface Props {
  value: MovementType;
  selected: boolean;
  onPress: (value: MovementType) => void;
}

const Component: React.FC<Props> = ({ value, selected, onPress }) => {
  const identity = MOVEMENT_IDENTITIES[value];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected
          ? { borderColor: identity.border, backgroundColor: identity.subtle, borderWidth: 1.5 }
          : null,
      ]}
      onPress={() => onPress(value)}
      activeOpacity={0.85}
    >
      <View style={[styles.iconCircle, selected ? { backgroundColor: identity.subtle } : null]}>
        <Icon
          name={identity.icon}
          size={20}
          color={selected ? identity.color : MOVEMENT_COLORS.text_dim}
        />
      </View>
      <Text style={[styles.label, { color: selected ? identity.color : MOVEMENT_COLORS.text_muted }]}>
        {identity.label}
      </Text>
    </TouchableOpacity>
  );
};

export const MovementTypeChip = memo(Component);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MOVEMENT_COLORS.bg_card_elevated,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
