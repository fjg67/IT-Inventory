import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getAvatarColor } from '@/utils/avatarColors';

type AvatarBadgeProps = {
  initials: string;
  size?: number;
};

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({ initials, size = 48 }) => {
  const color = getAvatarColor(initials);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: 14,
          backgroundColor: color.bg,
          shadowColor: color.shadow,
        },
      ]}
    >
      <Text style={[styles.text, { color: color.text }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
