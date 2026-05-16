import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface MovementFABProps {
  open: boolean;
  onToggle: () => void;
  onScan: () => void;
  onEntry: () => void;
  onExit: () => void;
  onAdjust: () => void;
  onTransfer: () => void;
}

export const MovementFAB: React.FC<MovementFABProps> = ({ open, onToggle, onScan, onEntry, onExit, onAdjust, onTransfer }) => (
  <View style={styles.wrap}>
    {open ? (
      <Animated.View entering={FadeInUp.duration(220)} style={styles.sheet}>
        {[
          { icon: 'barcode-scan', label: 'Scanner', description: 'Ouvrir le scan', color: OBSIDIAN_COLORS.green_light, onPress: onScan },
          { icon: 'arrow-down-bold', label: 'Entrée', description: 'Ajouter stock', color: OBSIDIAN_COLORS.green_light, onPress: onEntry },
          { icon: 'arrow-up-bold', label: 'Sortie', description: 'Retirer stock', color: OBSIDIAN_COLORS.danger, onPress: onExit },
          { icon: 'tune-vertical', label: 'Ajustement', description: 'Corriger stock', color: OBSIDIAN_COLORS.warning, onPress: onAdjust },
          { icon: 'swap-horizontal', label: 'Transfert', description: 'Déplacer stock', color: OBSIDIAN_COLORS.purple, onPress: onTransfer },
        ].map((item) => (
          <Pressable key={item.label} onPress={item.onPress} style={styles.sheetItem}>
            <View style={[styles.sheetIcon, { backgroundColor: `${item.color}18` }]}>
              <Icon name={item.icon} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetLabel}>{item.label}</Text>
              <Text style={styles.sheetDesc}>{item.description}</Text>
            </View>
          </Pressable>
        ))}
      </Animated.View>
    ) : null}
    <Pressable onPress={onToggle} style={styles.fab}>
      <LinearGradient colors={[OBSIDIAN_COLORS.green_primary, OBSIDIAN_COLORS.green_light]} style={styles.fabInner}>
        <Icon name={open ? 'close' : 'plus'} size={24} color="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    alignItems: 'flex-end',
    gap: 12,
  },
  sheet: {
    width: 260,
    gap: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
  },
  sheetIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetLabel: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '700',
  },
  sheetDesc: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: OBSIDIAN_COLORS.green_light,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
