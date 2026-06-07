import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type VersionVariant = 'danger' | 'success';

type VersionCardProps = {
  label: string;
  value: string;
  variant: VersionVariant;
};

export const VersionCard: React.FC<VersionCardProps> = ({ label, value, variant }) => {
  const isDanger = variant === 'danger';
  return (
    <View style={[styles.versionCard, isDanger ? styles.versionCardDanger : styles.versionCardSuccess]}>
      <Text style={styles.versionLabel}>{label}</Text>
      <Text style={[styles.versionValue, { color: isDanger ? '#FCA5A5' : '#86EFAC' }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  versionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: '#111A14',
  },
  versionCardDanger: {
    borderColor: 'rgba(239,68,68,0.22)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  versionCardSuccess: {
    borderColor: 'rgba(34,197,94,0.18)',
  },
  versionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  versionValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
