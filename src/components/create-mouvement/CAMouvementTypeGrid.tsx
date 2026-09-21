import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, MOVEMENT_TYPE_CA } from '@/constants/caTheme';

export type MovementType = 'entree' | 'sortie' | 'ajustement' | 'transfert';

export const CAMouvementTypeGrid = ({
  selected,
  onSelect,
}: {
  selected:  MovementType | null;
  onSelect:  (type: MovementType) => void;
}) => (
  <View style={styles.grid}>
    {(Object.entries(MOVEMENT_TYPE_CA) as [MovementType, typeof MOVEMENT_TYPE_CA.entree][]).map(
      ([key, conf]) => {
        const isSelected = selected === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[
              styles.btn,
              {
                backgroundColor: conf.subtle,
                borderColor:     isSelected ? conf.color : conf.border,
                borderWidth:     isSelected ? 2 : 1.5,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={conf.label}
          >
            {isSelected && (
              <View style={[styles.checkDot, { backgroundColor: conf.color }]}>
                <Icon name="check" size={10} color={CA_THEME.white} />
              </View>
            )}
            <Icon name={conf.icon} size={28} color={conf.color} />
            <Text style={[styles.btnLabel, { color: conf.textDark }]}>{conf.label}</Text>
          </Pressable>
        );
      }
    )}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  btn: {
    width:          '48%',
    alignItems:     'center',
    paddingVertical: 16,
    borderRadius:   12,
    gap:            8,
    position:       'relative',
  },
  checkDot: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  btnLabel: { fontSize: 13, fontWeight: '700' },
});
