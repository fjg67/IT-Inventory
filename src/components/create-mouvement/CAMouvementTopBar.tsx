import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface CAMouvementTopBarProps {
  onBack:       () => void;
  onHistory?:   () => void;
  onHelp?:      () => void;
}

export const CAMouvementTopBar = ({
  onBack, onHistory, onHelp
}: CAMouvementTopBarProps) => (
  <View style={styles.bar}>
    <Pressable onPress={onBack} style={styles.backBtn}
      accessibilityRole="button" accessibilityLabel="Retour">
      <Icon name="arrow-left" size={18} color={CA_THEME.textSecondary} />
    </Pressable>

    <Text style={styles.title}>Mouvement de stock</Text>

    {onHistory && (
      <Pressable onPress={onHistory} style={styles.iconBtn}
        accessibilityRole="button" accessibilityLabel="Historique des mouvements">
        <Icon name="clock-outline" size={15} color={CA_THEME.textMuted} />
      </Pressable>
    )}
    {onHelp && (
      <Pressable onPress={onHelp} style={styles.iconBtn}
        accessibilityRole="button" accessibilityLabel="Aide">
        <Icon name="help-circle-outline" size={15} color={CA_THEME.textMuted} />
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: CA_THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: CA_THEME.borderGray,
    paddingHorizontal: 12,
    paddingVertical:   10,
    gap:               8,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: CA_THEME.textPrimary, textAlign: 'center' },
  iconBtn: {
    width: 30, height: 30, borderRadius: 7,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
    alignItems: 'center', justifyContent: 'center',
  },
});
