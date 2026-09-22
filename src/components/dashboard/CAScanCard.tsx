import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CAScanCardProps {
  onScan: () => void;
  onEntree: () => void;
  onSortie: () => void;
  onConsultation: () => void;
}

export const CAScanCard = ({ onScan, onEntree, onSortie, onConsultation }: CAScanCardProps) => (
  <View style={styles.card}>
    <Text style={styles.title}>Scanner un article</Text>
    <Text style={styles.subtitle}>Toucher pour scanner ou choisissez une action</Text>

    <View style={styles.scanRow}>
      {/* Icône barcode */}
      <View style={styles.barcodeIcon} aria-hidden>
        <Icon name="barcode-scan" size={28} color={CA_THEME.green} />
      </View>
      {/* Bouton scan */}
      <TouchableOpacity onPress={onScan} style={styles.scanButton}
        activeOpacity={0.8}
        accessibilityRole="button" accessibilityLabel="Ouvrir le scanner">
        <Icon name="qrcode-scan" size={22} color={CA_THEME.white} />
      </TouchableOpacity>
    </View>

    {/* 3 boutons d'action */}
    <View style={styles.actionsRow}>
      <ActionButton
        label="Entrée"
        icon="arrow-down-circle-outline"
        color={CA_THEME.green}
        bgColor={CA_THEME.greenBg}
        onPress={onEntree}
      />
      <ActionButton
        label="Sortie"
        icon="arrow-up-circle-outline"
        color={CA_THEME.danger}
        bgColor={CA_THEME.dangerBg}
        onPress={onSortie}
      />
      <ActionButton
        label="Consultation"
        icon="magnify"
        color={CA_THEME.info}
        bgColor={CA_THEME.infoBg}
        onPress={onConsultation}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    borderLeftColor: CA_THEME.green,
    padding:         14,
    marginBottom:    14,
  },
  title:    { fontSize: 15, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', color: CA_THEME.textPrimary, marginBottom: 3 },
  subtitle: { fontSize: 12, color: CA_THEME.textSecondary, marginBottom: 12 },
  scanRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   16,
  },
  barcodeIcon: {
    width:           48,
    height:          48,
    borderRadius:    8,
    backgroundColor: CA_THEME.greenBg,
    borderWidth:     1.5,
    borderColor:     CA_THEME.greenBg2,
    alignItems:      'center',
    justifyContent:  'center',
  },
  scanButton: {
    flex: 1,
    marginLeft: 12,
    height:          48,
    borderRadius:    8,
    backgroundColor: CA_THEME.green,
    alignItems:      'center',
    justifyContent:  'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap:           8,
  },
});

// Bouton d'action (Entrée / Sortie / Consultation)
const ActionButton = ({ label, icon, color, bgColor, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flex:            1,
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             6,
      paddingVertical: 10,
      borderRadius:    6,
      backgroundColor: bgColor,
      borderWidth:     1,
      borderColor:     color,
    }}
    activeOpacity={0.7}
    accessibilityRole="button"
  >
    <Icon name={icon} size={14} color={color} />
    <Text style={{ fontSize: 11, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color }}>{label}</Text>
  </TouchableOpacity>
);
