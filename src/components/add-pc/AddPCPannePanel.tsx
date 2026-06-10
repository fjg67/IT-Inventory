import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { PannePriorite, PanneType } from '@/types/pc.types';
import { PanneDescriptionInput } from '@/components/panne/PanneDescriptionInput';
import { PannePrioriteSelector } from '@/components/panne/PannePrioriteSelector';
import { PanneTypeGrid } from '@/components/panne/PanneTypeGrid';

interface AddPCPannePanelProps {
  panneType: PanneType | null;
  priorite: PannePriorite;
  description: string;
  onPanneTypeChange: (type: PanneType) => void;
  onPrioriteChange: (priorite: PannePriorite) => void;
  onDescriptionChange: (description: string) => void;
}

export const AddPCPannePanel: React.FC<AddPCPannePanelProps> = ({
  panneType,
  priorite,
  description,
  onPanneTypeChange,
  onPrioriteChange,
  onDescriptionChange,
}) => {
  return (
    <Animated.View entering={FadeInDown.duration(240)} style={styles.panel}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Icon name="alert-octagon-outline" size={15} color="#EF4444" />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Détails de la panne</Text>
          <Text style={styles.subtitle}>Ces informations seront créées dans le ticket panne.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Type de panne *</Text>
        <PanneTypeGrid selected={panneType} onSelect={onPanneTypeChange} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Priorité</Text>
        <PannePrioriteSelector selected={priorite} onSelect={onPrioriteChange} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description *</Text>
        <PanneDescriptionInput value={description} onChange={onDescriptionChange} minLength={10} maxLength={200} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  panel: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.30)',
    backgroundColor: 'rgba(127,29,29,0.14)',
    padding: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: '#FCA5A5',
    fontSize: 11,
  },
  section: {
    gap: 7,
  },
  label: {
    color: '#FECACA',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
});
