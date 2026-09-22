import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';
import { MOVEMENT_IDENTITIES } from '../movement/movementTheme';
import type { MovementType } from '../movement/movementTheme';

export const CAMouvementTypeGrid = ({
  selected,
  onSelect,
}: {
  selected:  MovementType | null;
  onSelect:  (type: MovementType) => void;
}) => (
  <View style={styles.grid}>
    {(Object.entries(MOVEMENT_IDENTITIES) as [MovementType, typeof MOVEMENT_IDENTITIES.entree][]).map(
      ([key, conf]) => {
        const isSelected = selected === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[
              styles.btn,
              isSelected && styles.btnSelected,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={conf.label}
          >
            {isSelected && (
              <View style={styles.checkDot}>
                <Icon name="check" size={14} color={CA_THEME.white} />
              </View>
            )}
            <View style={[styles.iconWrap, { backgroundColor: conf.subtle }]}>
              <Icon name={conf.icon} size={28} color={conf.colorDark} />
            </View>
            <Text style={[styles.btnLabel, isSelected && { color: CA_THEME.green, fontWeight: '800' }]}>
              {conf.label}
            </Text>
          </Pressable>
        );
      }
    )}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  btn: {
    flexBasis: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: CA_THEME.white,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  btnSelected: {
    borderColor: CA_THEME.green,
    backgroundColor: CA_THEME.greenBg,
    elevation: 4,
    shadowColor: CA_THEME.green,
    shadowOpacity: 0.15,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 14, fontWeight: '600', color: CA_THEME.textPrimary,
  },
  checkDot: {
    position: 'absolute', top: 12, right: 12,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: CA_THEME.green,
    alignItems: 'center', justifyContent: 'center',
  },
});
