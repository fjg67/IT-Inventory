import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

export const CAConditionBadge = ({
  condition,
  defectiveCount = 0,
}: {
  condition:      string;
  defectiveCount?: number;
}) => {
  const isDefective = condition === 'defectueux' || condition === 'broken';

  return (
    <View style={[
      styles.badge,
      isDefective ? styles.badgeDef : styles.badgeOk,
    ]}>
      <Icon
        name={isDefective ? 'alert' : 'check-circle'}
        size={11}
        color={isDefective ? CA_THEME.danger : CA_THEME.green}
      />
      <Text style={[
        styles.text,
        { color: isDefective ? CA_THEME.danger : CA_THEME.greenText },
      ]}>
        {isDefective && defectiveCount > 0
          ? `${defectiveCount} défectueux`
          : isDefective ? 'Défectueux' : 'Bon état'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4, alignSelf: 'flex-start',
  },
  badgeOk:  { backgroundColor: CA_THEME.greenBg },
  badgeDef: { backgroundColor: CA_THEME.dangerBg },
  text:     { fontSize: 10, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600' },
});
