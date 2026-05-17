import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';

interface Props {
  label: string;
  selected: boolean;
  identity: MovementIdentity;
  onPress: () => void;
}

const Component: React.FC<Props> = ({ label, selected, identity, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected
          ? { backgroundColor: identity.subtle, borderColor: identity.border, borderWidth: 1.5 }
          : null,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Icon
        name="warehouse"
        size={15}
        color={selected ? identity.color : MOVEMENT_COLORS.text_dim}
      />
      <Text
        style={[
          styles.label,
          { color: selected ? identity.color : MOVEMENT_COLORS.text_muted },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected ? (
        <Animated.View entering={FadeIn.duration(150)}>
          <Icon name="check-circle" size={12} color={identity.color} />
        </Animated.View>
      ) : null}
    </TouchableOpacity>
  );
};

export const StockSiteChip = memo(Component);

const styles = StyleSheet.create({
  chip: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});
