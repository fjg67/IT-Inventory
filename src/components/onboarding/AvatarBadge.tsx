import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

type AvatarBadgeProps = {
  initials: string;
  size?: number;
};

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({ initials, size = 48 }) => {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: 14,
          backgroundColor: CA_THEME.greenBg,
          borderWidth: 1,
          borderColor: CA_THEME.greenBg2,
          shadowColor: CA_THEME.green,
        },
      ]}
    >
      <Text style={[styles.text, { color: CA_THEME.greenText }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
