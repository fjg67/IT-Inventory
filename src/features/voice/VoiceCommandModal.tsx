import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { VoiceListeningState } from './VoiceListeningState';
import { VoiceParsingState } from './VoiceParsingState';
import { VoiceConfirmState } from './VoiceConfirmState';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';

export const VoiceCommandModal = ({ voice }: { voice: ReturnType<typeof useVoiceCommand> }) => {
  if (!voice.isOpen) return null;

  const renderContent = () => {
    switch (voice.state) {
      case 'idle':
        return (
          <View style={styles.center}>
            <Text style={styles.title}>Prêt à écouter</Text>
            <Text style={styles.subtitle}>Appuyez sur le micro pour parler</Text>
            <Pressable onPress={voice.startVoice} style={styles.bigMicBtn}>
              <Icon name="microphone" size={48} color="white" />
            </Pressable>
          </View>
        );

      case 'listening':
        return <VoiceListeningState transcript={voice.transcript} />;

      case 'processing':
        return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.processingText}>Analyse de la commande...</Text>
          </View>
        );

      case 'confirm':
        return (
          <>
            <VoiceParsingState parsed={voice.parsed!} />
            <VoiceConfirmState
              parsed={voice.parsed!}
              onConfirm={voice.confirmAndExecute}
              onCancel={voice.cancel}
            />
          </>
        );

      case 'executing':
        return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.processingText}>Exécution en cours...</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.center}>
            <Icon name="check-circle" size={80} color="#10B981" />
            <Text style={styles.successTitle}>Succès !</Text>
            <Text style={styles.successText}>{voice.result}</Text>
          </View>
        );

      case 'error':
        return (
          <View style={styles.center}>
            <Icon name="alert-circle" size={80} color="#EF4444" />
            <Text style={styles.errorTitle}>Oups !</Text>
            <Text style={styles.errorText}>{voice.error?.message}</Text>
            
            {voice.error?.suggestions && voice.error.suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                <Text style={styles.suggestionsLabel}>Vouliez-vous dire :</Text>
                {voice.error.suggestions.map((s, i) => (
                  <Text key={i} style={styles.suggestionItem}>• {s}</Text>
                ))}
              </View>
            )}

            <Pressable onPress={voice.startVoice} style={styles.retryBtn}>
              <Icon name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={voice.isOpen}
      transparent
      animationType="fade"
      onRequestClose={voice.cancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contrôle vocal</Text>
            <Pressable onPress={voice.cancel} style={styles.closeBtn} hitSlop={10}>
              <Icon name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Dynamic Content */}
          <View style={styles.body}>
            {renderContent()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  body: {
    padding: 24,
    minHeight: 300,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
  },
  bigMicBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  processingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  suggestionsBox: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  suggestionsLabel: {
    fontWeight: 'bold',
    color: '#B91C1C',
    marginBottom: 8,
  },
  suggestionItem: {
    color: '#991B1B',
    marginBottom: 4,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
