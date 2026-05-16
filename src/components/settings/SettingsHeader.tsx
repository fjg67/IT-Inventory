import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

interface SettingsHeaderProps {
  onBellPress?: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ onBellPress }) => (
  <View style={styles.row}>
    <View>
      <Text style={styles.title}>Parametres</Text>
      <Text style={styles.subtitle}>Personnalisez votre experience</Text>
    </View>

    <Pressable onPress={onBellPress} style={styles.bellBtn}>
      <Icon name="bell-outline" size={20} color={SETTINGS_COLORS.text_secondary} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: SETTINGS_COLORS.text_primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: SETTINGS_COLORS.text_muted,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card,
  },
});
