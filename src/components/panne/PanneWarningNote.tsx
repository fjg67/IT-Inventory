import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PanneWarningNoteProps {
  isCritical: boolean;
}

export const PanneWarningNote: React.FC<PanneWarningNoteProps> = ({ isCritical }) => {
  if (!isCritical) return null;

  return (
    <View style={styles.warningBanner}>
      <View style={styles.warningIcon}>
        <Icon name="alert-octagon-outline" size={16} color="#FFFFFF" />
      </View>
      <View style={styles.warningContent}>
        <Text style={styles.warningTitle}>Priorité critique</Text>
        <Text style={styles.warningText}>Une notification sera envoyée aux responsables.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  warningBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  warningIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
    gap: 2,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warningText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 15,
  },
});
