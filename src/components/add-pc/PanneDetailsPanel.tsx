import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OBSIDIAN_COLORS } from '@/constants/colors';
import { PannePriorite, PanneType } from '@/types/pc.types';
import { PanneDescriptionInput, PanneWarningNote } from '@/components/panne';
import { PannePrioriteSelector } from './PannePrioriteSelector';
import { PanneTypeGrid } from './PanneTypeGrid';

interface PanneDetailsPanelProps {
  panneType: PanneType | null;
  priorite: PannePriorite;
  description: string;
  onPanneTypeChange: (type: PanneType) => void;
  onPrioriteChange: (priorite: PannePriorite) => void;
  onDescriptionChange: (description: string) => void;
}

export const PanneDetailsPanel: React.FC<PanneDetailsPanelProps> = ({
  panneType,
  priorite,
  description,
  onPanneTypeChange,
  onPrioriteChange,
  onDescriptionChange,
}) => {
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderIcon}>
          <Icon name="alert-circle-outline" size={16} color="#EF4444" />
        </View>
        <View style={styles.panelHeaderTextWrap}>
          <Text style={styles.panelHeaderTitle}>Détails de la panne</Text>
          <Text style={styles.panelHeaderSub}>Ces infos seront enregistrées dans l'historique du PC.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subLabel}>Type de panne *</Text>
        <PanneTypeGrid selected={panneType} onSelect={onPanneTypeChange} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subLabel}>Priorité</Text>
        <PannePrioriteSelector selected={priorite} onSelect={onPrioriteChange} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subLabel}>Description *</Text>
        <PanneDescriptionInput
          value={description}
          onChange={onDescriptionChange}
          minLength={10}
          maxLength={200}
        />
      </View>

      {priorite === 'critique' ? <PanneWarningNote isCritical /> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  panel: {
    marginTop: 8,
    backgroundColor: '#16231A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.22)',
    padding: 16,
    gap: 14,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  panelHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  panelHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.text_primary,
  },
  panelHeaderSub: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.text_muted,
    lineHeight: 16,
  },
  section: {
    gap: 8,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.text_secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
