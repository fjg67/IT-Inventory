import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

interface ProfileStatsRowProps {
  sessionCount: string;
  connectionLabel: string;
  movementCount: string;
}

export const ProfileStatsRow: React.FC<ProfileStatsRowProps> = ({ sessionCount, connectionLabel, movementCount }) => (
  <View style={styles.row}>
    <View style={styles.col}>
      <Text style={styles.value}>{sessionCount}</Text>
      <Text style={styles.label}>Session</Text>
    </View>
    <View style={styles.col}>
      <Text style={styles.value}>{connectionLabel}</Text>
      <Text style={styles.label}>Connexion</Text>
    </View>
    <View style={styles.col}>
      <Text style={styles.value}>{movementCount}</Text>
      <Text style={styles.label}>Mouvements</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    color: SETTINGS_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    marginTop: 4,
    color: SETTINGS_COLORS.text_muted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '600',
  },
});
