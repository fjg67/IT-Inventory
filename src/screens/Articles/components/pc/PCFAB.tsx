import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PCFABProps {
  onPress: () => void;
}

export const PCFAB: React.FC<PCFABProps> = ({ onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.fab}>
      <Icon name="plus" size={24} color="#FFFFFF" />
      <Text style={styles.label}>Ajouter</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: OBSIDIAN_COLORS.green_primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: OBSIDIAN_COLORS.green_light,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
