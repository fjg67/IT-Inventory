import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { REPARATION_CONFIG } from '@/types/pc.types';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { PCPanne, PCStatus } from '@/types/pc.types';

interface PanneResolutionSheetProps {
  panne: PCPanne;
  onClose: () => void;
  onSuccess: () => void;
  onUpdatePanne: (panneId: string, updates: Partial<PCPanne>) => Promise<void>;
  onUpdatePCStatus: (pcId: string, newStatus: PCStatus) => Promise<void>;
}

const STATUS_OPTIONS: { label: string; value: 'resolu' | 'irreparable'; icon: string; color: string }[] = [
  { label: 'Résolu', value: 'resolu', icon: 'check-circle-outline', color: '#22C55E' },
  { label: 'Irréparable', value: 'irreparable', icon: 'close-circle-outline', color: '#6B7280' },
];

const PC_STATUS_OPTIONS: { label: string; value: PCStatus }[] = [
  { label: 'Disponible', value: 'disponible' },
  { label: 'À reusiner', value: 'a_reusiner' },
  { label: 'Envoyé', value: 'envoye' },
];

export const PanneResolutionSheet: React.FC<PanneResolutionSheetProps> = ({
  panne,
  onClose,
  onSuccess,
  onUpdatePanne,
  onUpdatePCStatus,
}) => {
  const [resolution, setResolution] = useState<'resolu' | 'irreparable'>('resolu');
  const [note, setNote] = useState('');
  const [newPCStatus, setNewPCStatus] = useState<PCStatus>('disponible');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = note.trim().length >= 5;

  const handleResolve = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    try {
      const finalStatus = resolution === 'resolu' ? newPCStatus : 'a_reusiner';

      await onUpdatePanne(panne.id, {
        statut_reparation: resolution,
        note_resolution: note.trim(),
        resolu_par: 'Utilisateur',
        resolu_at: new Date().toISOString(),
      });

      await onUpdatePCStatus(panne.pc_id, finalStatus);

      onSuccess();
    } catch (error) {
      console.error('[PanneResolutionSheet] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(280)} style={styles.sheet}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerHandle} />
        <Text style={styles.headerTitle}>Résoudre la panne</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Statut résolution */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Statut de résolution</Text>
          <View style={styles.resolutionGroup}>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setResolution(option.value)}
                style={[
                  styles.resolutionOption,
                  resolution === option.value && { borderColor: option.color },
                ]}
                activeOpacity={0.85}
              >
                <Icon name={option.icon} size={18} color={option.color} />
                <Text style={[styles.resolutionLabel, { color: option.color }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note résolution */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note de résolution *</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Décrivez la résolution apportée..."
            placeholderTextColor={OBSIDIAN_COLORS.text_muted}
            multiline
            numberOfLines={3}
            maxLength={300}
            style={[styles.input, !isValid && styles.inputInvalid]}
          />
          <Text style={[styles.charCount, !isValid && { color: '#EF4444' }]}>
            {note.length} / 300
          </Text>
        </View>

        {/* Nouveau statut PC (si résolu) */}
        {resolution === 'resolu' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Statut du PC après réparation</Text>
            <View style={styles.statusGroup}>
              {PC_STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setNewPCStatus(option.value)}
                  style={[
                    styles.statusOption,
                    newPCStatus === option.value && styles.statusOptionActive,
                  ]}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.statusLabel,
                      newPCStatus === option.value && styles.statusLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onClose}
          disabled={isLoading}
          style={[styles.cancelBtn, isLoading && styles.btnDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResolve}
          disabled={!isValid || isLoading}
          style={[styles.resolveBtn, (!isValid || isLoading) && styles.btnDisabled]}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isValid ? ['#22C55E', '#15803D'] : ['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resolveBtnGradient}
          >
            {isLoading ? (
              <Icon name="loading" size={16} color="#FFFFFF" />
            ) : (
              <>
                <Icon name="check-circle" size={16} color="#FFFFFF" />
                <Text style={styles.resolveText}>Confirmer</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.border_card,
    paddingHorizontal: 16,
    paddingTop: 12,
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
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.text_primary,
  },
  resolutionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  resolutionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#16231A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  resolutionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0A0F0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  inputInvalid: {
    borderColor: 'rgba(239, 68, 68, 0.40)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  charCount: {
    fontSize: 10,
    color: OBSIDIAN_COLORS.text_muted,
    alignSelf: 'flex-end',
  },
  statusGroup: {
    gap: 6,
  },
  statusOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#16231A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#22C55E',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.text_primary,
  },
  statusLabelActive: {
    color: '#22C55E',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.border_card,
    paddingTop: 12,
    paddingBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resolveBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.text_primary,
  },
  resolveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
