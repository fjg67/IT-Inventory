import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { PanneType, PannePriorite } from '@/types/pc.types';
import { PanneTypeGrid } from './PanneTypeGrid';
import { PannePrioriteSelector } from './PannePrioriteSelector';
import { PanneDescriptionInput } from './PanneDescriptionInput';
import { PanneTicketInput } from './PanneTicketInput';
import { PanneWarningNote } from './PanneWarningNote';
import { PanneDeclarationFooter } from './PanneDeclarationFooter';

interface PanneDeclarationModalProps {
  visible?: boolean;
  pcId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
  onSubmit?: (panne: {
    type_panne: PanneType;
    description: string;
    priorite: PannePriorite;
    ticket_sav?: string;
    technicien_id?: string;
    statut_reparation: string;
  }) => Promise<void>;
  onCreatePanne?: (panne: {
    pc_id: string;
    type_panne: PanneType;
    description: string;
    priorite: PannePriorite;
    ticket_sav?: string;
    technicien_id?: string;
    statut_reparation: string;
  }) => Promise<void>;
}

export const PanneDeclarationModal: React.FC<PanneDeclarationModalProps> = ({
  visible = false,
  pcId,
  onClose,
  onSuccess,
  onSubmit,
  onCreatePanne,
}) => {
  const insets = useSafeAreaInsets();
  const [typePanne, setTypePanne] = useState<PanneType | null>(null);
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState<PannePriorite>('moyenne');
  const [ticketSAV, setTicketSAV] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = typePanne !== null && description.trim().length >= 10;
  const isCritical = priorite === 'critique';

  const handleConfirm = async () => {
    if (!isValid || isLoading || !typePanne) return;

    setIsLoading(true);
    try {
      const payload = {
        type_panne: typePanne,
        description: description.trim(),
        priorite,
        ticket_sav: ticketSAV.trim() || undefined,
        technicien_id: undefined,
        statut_reparation: 'en_attente',
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else if (onCreatePanne && pcId) {
        await onCreatePanne({
          pc_id: pcId,
          ...payload,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('[PanneDeclarationModal] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={[styles.modalSheet, { paddingBottom: Math.max(16, insets.bottom) }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerHandle} />
            <Text style={styles.headerTitle}>Déclarer une panne</Text>
          </View>

          {/* Scroll content */}
          <View style={styles.content}>
            {/* Section Type */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Type de panne *</Text>
              <PanneTypeGrid selected={typePanne} onSelect={setTypePanne} />
            </View>

            {/* Section Description */}
            <View style={styles.section}>
              <PanneDescriptionInput
                value={description}
                onChange={setDescription}
                minLength={10}
              />
            </View>

            {/* Section Priorité */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Niveau de priorité</Text>
              <PannePrioriteSelector selected={priorite} onSelect={setPriorite} />
            </View>

            {/* Warning si critique */}
            {isCritical && (
              <View style={styles.section}>
                <PanneWarningNote isCritical={isCritical} />
              </View>
            )}

            {/* Section Ticket SAV */}
            <View style={styles.section}>
              <PanneTicketInput value={ticketSAV} onChange={setTicketSAV} />
            </View>
          </View>

          {/* Footer */}
          <PanneDeclarationFooter
            onCancel={onClose}
            onConfirm={handleConfirm}
            isLoading={isLoading}
            isValid={isValid}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.border_card,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: OBSIDIAN_COLORS.text_dim,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.text_primary,
  },
  content: {
    gap: 16,
    marginBottom: 12,
    paddingBottom: 8,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.text_primary,
  },
});
