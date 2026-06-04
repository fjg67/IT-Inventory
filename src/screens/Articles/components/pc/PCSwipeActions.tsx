import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PCSwipeActionsProps {
  height: number;
  onHot: () => void;
  onAvailable?: () => void;
  onProcessing?: () => void;
  actionVariant?: 'hot' | 'available' | 'processing';
  onSent: () => void;
  onBreakdown?: () => void;
  onDelete: () => void;
}

const ActionButton: React.FC<{ label: string; sublabel: string; icon: string; backgroundColor: string; onPress: () => void }> = ({ label, sublabel, icon, backgroundColor, onPress }) => (
  <Pressable onPress={onPress} style={[styles.button, { backgroundColor }]}> 
    <Icon name={icon} size={20} color="#FFFFFF" />
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.sublabel}>{sublabel}</Text>
  </Pressable>
);

export const PCSwipeActions: React.FC<PCSwipeActionsProps> = ({ height, onHot, onAvailable, onProcessing, actionVariant = 'hot', onSent, onBreakdown, onDelete }) => {
  const middleAction =
    actionVariant === 'available'
      ? {
          label: 'Disponible',
          sublabel: 'STOCK',
          icon: 'check-circle-outline',
          backgroundColor: OBSIDIAN_COLORS.info,
          onPress: onAvailable ?? onHot,
        }
      : actionVariant === 'processing'
        ? {
            label: 'En usinage',
            sublabel: 'ATELIER',
            icon: 'cog-play-outline',
            backgroundColor: OBSIDIAN_COLORS.warning,
            onPress: onProcessing ?? onHot,
          }
        : {
            label: 'À chaud',
            sublabel: 'REMISE',
            icon: 'flash-outline',
            backgroundColor: OBSIDIAN_COLORS.green_primary,
            onPress: onHot,
          };

  return (
    <View style={[styles.wrap, { height }]}> 
      <ActionButton label="Envoyé" sublabel="SORTIE" icon="send" backgroundColor={OBSIDIAN_COLORS.purple} onPress={onSent} />
      <ActionButton
        label={middleAction.label}
        sublabel={middleAction.sublabel}
        icon={middleAction.icon}
        backgroundColor={middleAction.backgroundColor}
        onPress={middleAction.onPress}
      />
      {onBreakdown ? (
        <ActionButton label="En panne" sublabel="PANNE" icon="laptop-off" backgroundColor="#EF4444" onPress={onBreakdown} />
      ) : (
        <ActionButton label="Supprimer" sublabel="RETIRER" icon="trash-can-outline" backgroundColor={OBSIDIAN_COLORS.danger} onPress={onDelete} />
      )}
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
