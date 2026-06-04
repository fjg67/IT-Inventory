import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PanneType, PANNE_TYPE_CONFIG } from '@/types/pc.types';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PanneTypeGridProps {
  selected: PanneType | null;
  onSelect: (type: PanneType) => void;
}

const TYPES: PanneType[] = ['materielle', 'logicielle', 'batterie', 'reseau', 'autre'];

export const PanneTypeGrid: React.FC<PanneTypeGridProps> = ({ selected, onSelect }) => (
  <View style={styles.grid}>
    {TYPES.map((type) => {
      const config = PANNE_TYPE_CONFIG[type];
      const isActive = selected === type;
      return (
        <TouchableOpacity
          key={type}
          onPress={() => onSelect(type)}
          style={[
            styles.typeBtn,
            isActive && {
              backgroundColor: `${config.color}18`,
              borderColor: `${config.color}45`,
            },
          ]}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.typeBtnIcon,
              isActive && { backgroundColor: `${config.color}20` },
            ]}
          >
            <Icon name={config.icon} size={20} color={config.color} />
          </View>
          <Text style={[styles.typeBtnLabel, { color: isActive ? config.color : OBSIDIAN_COLORS.text_secondary }]}>
            {config.label}
          </Text>
          {isActive && (
            <View style={[styles.checkMark, { backgroundColor: config.color }]}>
              <Icon name="check" size={10} color="white" />
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    width: '47.5%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#16231A',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  typeBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  typeBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
