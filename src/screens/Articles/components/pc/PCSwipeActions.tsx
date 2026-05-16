import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PCSwipeActionsProps {
  height: number;
  onHot: () => void;
  onSent: () => void;
  onDelete: () => void;
}

const ActionButton: React.FC<{ label: string; sublabel: string; icon: string; backgroundColor: string; onPress: () => void }> = ({ label, sublabel, icon, backgroundColor, onPress }) => (
  <Pressable onPress={onPress} style={[styles.button, { backgroundColor }]}> 
    <Icon name={icon} size={20} color="#FFFFFF" />
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.sublabel}>{sublabel}</Text>
  </Pressable>
);

export const PCSwipeActions: React.FC<PCSwipeActionsProps> = ({ height, onHot, onSent, onDelete }) => {
  return (
    <View style={[styles.wrap, { height }]}> 
      <ActionButton label="Envoyé" sublabel="SORTIE" icon="send" backgroundColor={OBSIDIAN_COLORS.purple} onPress={onSent} />
      <ActionButton label="À chaud" sublabel="REMISE" icon="flash" backgroundColor={OBSIDIAN_COLORS.green_primary} onPress={onHot} />
      <ActionButton label="Supprimer" sublabel="RETIRER" icon="trash-can-outline" backgroundColor={OBSIDIAN_COLORS.danger} onPress={onDelete} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    width: 240,
    alignSelf: 'stretch',
  },
  button: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sublabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
