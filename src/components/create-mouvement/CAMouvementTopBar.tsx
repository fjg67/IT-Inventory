import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface CAMouvementTopBarProps {
  onBack:       () => void;
  onHistory?:   () => void;
  onHelp?:      () => void;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CAMouvementTopBar = ({
  onBack, onHistory, onHelp
}: CAMouvementTopBarProps) => {
  const insets = useSafeAreaInsets();
  
  return (
  <View style={[styles.bar, { paddingTop: (insets.top || 40) + 10, paddingBottom: 13 }]}> 
    <Pressable onPress={onBack} style={({ pressed }) => [styles.backBtn, pressed && styles.controlPressed]}
      accessibilityRole="button" accessibilityLabel="Retour">
      <Icon name="arrow-left" size={19} color={CA_THEME.greenDark} />
    </Pressable>

    <View style={styles.titleContainer}>
      <View style={styles.subtitleRow}>
        <View style={styles.subtitleDot} />
        <Text style={styles.subtitle}>NOUVELLE OPÉRATION</Text>
        <View style={styles.subtitleDot} />
      </View>
      <Text style={styles.title}>Mouvement de stock</Text>
    </View>

    {onHistory && (
      <Pressable onPress={onHistory} style={({ pressed }) => [styles.iconBtn, pressed && styles.controlPressed]}
        accessibilityRole="button" accessibilityLabel="Historique des mouvements">
        <Icon name="clock-outline" size={18} color={CA_THEME.greenDark} />
      </Pressable>
    )}
    {onHelp && (
      <Pressable onPress={onHelp} style={({ pressed }) => [styles.iconBtn, pressed && styles.controlPressed]}
        accessibilityRole="button" accessibilityLabel="Aide">
        <Icon name="help-circle-outline" size={18} color={CA_THEME.greenDark} />
      </Pressable>
    )}
    <View style={styles.caRule} pointerEvents="none">
      <View style={[styles.caStripe, { backgroundColor: '#FFD700' }]} />
      <View style={[styles.caStripe, { backgroundColor: CA_THEME.greenLight }]} />
      <View style={[styles.caStripe, { backgroundColor: CA_THEME.greenDark }]} />
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: CA_THEME.white,
    paddingHorizontal: 12,
    gap:               8,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EEE7',
    elevation: 2,
    shadowColor: CA_THEME.greenDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    position: 'relative',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  subtitleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFD700' },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: CA_THEME.green,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: { 
    fontSize: 18,
    fontWeight: '900', 
    color: CA_THEME.textPrimary,
    letterSpacing: 0,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
    alignItems: 'center', justifyContent: 'center',
  },
  controlPressed: { backgroundColor: CA_THEME.greenBg2, transform: [{ scale: 0.95 }] },
  caRule: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, flexDirection: 'row' },
  caStripe: { flex: 1 },
});
