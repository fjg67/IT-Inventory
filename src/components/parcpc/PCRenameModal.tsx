import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Article } from '@/types';
import { articleRepository } from '@/database/repositories';
import { getSupabaseClient } from '@/api/supabase';
import { PARC_PC_COLORS } from './tokens';

interface PCRenameModalProps {
  pc: Article;
  onClose: () => void;
  onSuccess: (newDisplayName: string | null) => void;
}

export const PCRenameModal: React.FC<PCRenameModalProps> = ({ pc, onClose, onSuccess }) => {
  const currentHostname = (pc.nom ?? pc.reference ?? '').trim();
  const [hostname, setHostname] = useState(currentHostname);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = useMemo(() => hostname.trim().toUpperCase(), [hostname]);
  const isTooShort = trimmed.length < 2;
  const isTooLong = trimmed.length > 50;
  const isUnchanged = trimmed === currentHostname.toUpperCase();
  const isValid = !isTooShort && !isTooLong && !isUnchanged;

  const handleSave = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await articleRepository.update(pc.id, {
        nom: trimmed,
        reference: trimmed,
      });

      // Best effort sync with dedicated pc_portables table if it exists.
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('pc_portables')
          .update({ hostname: trimmed })
          .eq('id', String(pc.id));
      } catch {
        // Ignore optional table errors.
      }

      onSuccess(trimmed);
      Alert.alert('Succès', `Hostname mis à jour: "${trimmed}".`);
    } catch (e: any) {
      const message = String(e?.message ?? '').toLowerCase();
      if (message.includes('duplicate') || message.includes('unique')) {
        setError('Ce hostname existe déjà. Choisissez un autre nom.');
      } else {
        setError('Erreur lors de la sauvegarde. Réessayez.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Icon name="form-textbox" size={16} color={PARC_PC_COLORS.green_light} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Renommer le PC</Text>
              <Text style={styles.headerSub}>Modifier le hostname technique</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={PARC_PC_COLORS.text_muted} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.warnNote}>
              <Icon name="information-outline" size={14} color="#F59E0B" />
              <Text style={styles.warnNoteText}>
                Le hostname est l'identifiant officiel du PC. La mise à jour sera enregistrée dans Supabase.
              </Text>
            </View>

            <Text style={styles.label}>
              Nouveau hostname
            </Text>

            <View style={styles.inputWrap}>
              <TextInput
                value={hostname}
                onChangeText={(text) => {
                  setHostname(text);
                  setError(null);
                }}
                placeholder="Ex: KSAOP8725233"
                placeholderTextColor={PARC_PC_COLORS.text_muted}
                maxLength={50}
                autoFocus
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleSave}
                style={[
                  styles.input,
                  isTooShort && styles.inputWarn,
                  error && styles.inputError,
                  isValid && styles.inputOk,
                ]}
              />
              {hostname.length > 0 ? (
                <Pressable onPress={() => setHostname('')} style={styles.clearBtn} hitSlop={8}>
                  <Icon name="close" size={12} color={PARC_PC_COLORS.text_muted} />
                </Pressable>
              ) : null}
              <Text style={[styles.charCounter, hostname.length >= 40 && styles.charCounterWarn]}>{hostname.length}/50</Text>
            </View>

            {isTooShort ? (
              <View style={styles.hintRow}>
                <Icon name="alert-circle-outline" size={12} color="#F59E0B" />
                <Text style={styles.hintTextWarn}>Minimum 2 caracteres</Text>
              </View>
            ) : null}
            {isTooLong ? (
              <View style={styles.hintRow}>
                <Icon name="alert-circle-outline" size={12} color="#EF4444" />
                <Text style={styles.hintTextError}>Maximum 50 caracteres</Text>
              </View>
            ) : null}
            {error ? (
              <View style={styles.hintRow}>
                <Icon name="alert-outline" size={12} color="#EF4444" />
                <Text style={styles.hintTextError}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.examplesBox}>
              <Text style={styles.examplesTitle}>Exemples de hostnames</Text>
              <View style={styles.examplesRow}>
                {['KSAOP8725233', 'KSAOPSTR2401', 'KSAOPEPI0172', 'KSAOP8726120'].map((example) => (
                  <Pressable key={example} onPress={() => setHostname(example)} style={styles.exampleChip}>
                    <Text style={styles.exampleChipText}>{example}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.btnCancel} disabled={isLoading}>
              <Text style={styles.btnCancelText}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={[styles.btnSave, (!isValid || isLoading) && styles.btnSaveDisabled]} disabled={!isValid || isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="content-save-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.btnSaveText}>Enregistrer</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sheet: {
    borderRadius: 16,
    backgroundColor: PARC_PC_COLORS.bg_card,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.border_card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34,197,94,0.07)',
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0FDF4',
  },
  headerSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  warnNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(245,158,11,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.18)',
    marginBottom: 14,
  },
  warnNoteText: {
    fontSize: 11,
    color: '#6B7280',
    flex: 1,
    lineHeight: 16,
  },
  warnNoteHighlight: {
    color: '#86EFAC',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#16231A',
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.15)',
    padding: 12,
    paddingRight: 66,
    fontSize: 14,
    fontWeight: '600',
    color: '#F0FDF4',
  },
  inputWarn: {
    borderColor: 'rgba(245,158,11,0.40)',
  },
  inputError: {
    borderColor: 'rgba(239,68,68,0.40)',
  },
  inputOk: {
    borderColor: 'rgba(34,197,94,0.40)',
  },
  clearBtn: {
    position: 'absolute',
    right: 38,
    top: '50%',
    marginTop: -11,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCounter: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -8,
    fontSize: 10,
    color: '#374151',
  },
  charCounterWarn: {
    color: '#F59E0B',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  hintTextWarn: {
    fontSize: 11,
    color: '#F59E0B',
  },
  hintTextError: {
    fontSize: 11,
    color: '#EF4444',
  },
  examplesBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.08)',
  },
  examplesTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 7,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exampleChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#16231A',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.12)',
  },
  exampleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#86EFAC',
  },
  footer: {
    flexDirection: 'row',
    gap: 9,
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34,197,94,0.07)',
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16231A',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.10)',
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  btnSave: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1B8A3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnSaveDisabled: {
    opacity: 0.45,
  },
  btnSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
