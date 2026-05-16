import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

interface CreatorCardProps {
  onLicensePress: () => void;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ onLicensePress }) => (
  <View style={styles.card}>
    <View style={styles.glow} />

    <View style={styles.topRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>FJG</Text>
      </View>
      <View style={styles.infoCol}>
        <Text style={styles.name}>Florian JOVE GARCIA</Text>
        <Text style={styles.role}>Createur et Developpeur</Text>
      </View>
    </View>

    <View style={styles.divider} />

    <Text style={styles.row}>© {new Date().getFullYear()} Florian JOVE GARCIA</Text>

    <Pressable onPress={onLicensePress} style={styles.licenseRow}>
      <Text style={styles.licenseText}>Licence MIT</Text>
    </Pressable>

    <Text style={styles.row}>IT-Inventory - Gestion de stock</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
    padding: 16,
    gap: 8,
  },
  glow: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 84,
    height: 84,
    borderRadius: 50,
    backgroundColor: SETTINGS_COLORS.green_glow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SETTINGS_COLORS.green_primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    color: SETTINGS_COLORS.text_primary,
    fontSize: 15,
    fontWeight: '700',
  },
  role: {
    marginTop: 2,
    color: SETTINGS_COLORS.text_secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 2,
    height: 1,
    backgroundColor: SETTINGS_COLORS.border_subtle,
  },
  row: {
    color: SETTINGS_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
  },
  licenseRow: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: SETTINGS_COLORS.green_subtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  licenseText: {
    color: SETTINGS_COLORS.green_light,
    fontSize: 12,
    fontWeight: '700',
  },
});
