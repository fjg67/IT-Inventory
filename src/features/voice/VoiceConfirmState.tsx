import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ParsedVoiceCommand } from '@/types/voice.types';

interface VoiceConfirmStateProps {
  parsed: ParsedVoiceCommand;
  onConfirm: () => void;
  onCancel: () => void;
}

export const VoiceConfirmState = ({ parsed, onConfirm, onCancel }: VoiceConfirmStateProps) => {
  const [countdown, setCountdown] = useState(5);
  const progressAnim = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { 
          clearInterval(interval); 
          onConfirm(); 
        }
        return c - 1;
      });
    }, 1000);
    progressAnim.value = withTiming(0, { duration: 5000 });
    return () => clearInterval(interval);
  }, []);

  const ACTION_CONFIG: Record<string, any> = {
    stock_entree:  { color: '#10B981', icon: 'arrow-down-circle', label: 'Entrée de stock' },
    stock_sortie:  { color: '#EF4444', icon: 'arrow-up-circle',   label: 'Sortie de stock' },
    stock_ajustement: { color: '#F59E0B', icon: 'tune',           label: 'Ajustement de stock' },
    stock_transfert: { color: '#3B82F6', icon: 'swap-horizontal', label: 'Transfert de stock' },
    pc_panne:      { color: '#EF4444', icon: 'laptop-off',        label: 'PC en panne'      },
    pc_status:     { color: '#8B5CF6', icon: 'laptop',            label: 'Statut du PC'     },
    pc_transfert:  { color: '#3B82F6', icon: 'swap-horizontal',   label: 'Transfert de PC'  },
    site_change:   { color: '#3B82F6', icon: 'domain',            label: 'Changement de site'},
    stock_consultation: { color: '#8B5CF6', icon: 'magnify',      label: 'Consultation' },
  };

  const conf = ACTION_CONFIG[parsed.actionType] || { color: '#6B7280', icon: 'help-circle', label: 'Action inconnue' };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderLeftColor: conf.color }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: `${conf.color}18`, borderColor: `${conf.color}30` }]}>
            <Icon name={conf.icon} size={24} color={conf.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>Confirmer {conf.label} ?</Text>
            <Text style={styles.cardSub}>L'action sera exécutée</Text>
          </View>
        </View>

        {/* Détails */}
        <View style={styles.details}>
          {parsed.articleLabel && (
            <DetailRow label={parsed.actionType === 'site_change' ? "Site cible" : "Article"} value={parsed.articleLabel} />
          )}
          {parsed.quantity !== undefined && ['stock_entree', 'stock_sortie', 'stock_ajustement', 'stock_transfert'].includes(parsed.actionType) && (
            <DetailRow
              label="Quantité"
              value={
                parsed.actionType === 'stock_entree' ? `+${parsed.quantity}` : 
                parsed.actionType === 'stock_sortie' ? `-${parsed.quantity}` :
                parsed.actionType === 'stock_ajustement' ? `= ${parsed.quantity}` :
                `${parsed.quantity}`
              }
              color={parsed.actionType === 'stock_entree' ? '#10B981' : parsed.actionType === 'stock_sortie' ? '#EF4444' : undefined}
            />
          )}
          {parsed.targetSiteLabel && ['stock_transfert', 'pc_transfert'].includes(parsed.actionType) && (
            <DetailRow label="Site destination" value={parsed.targetSiteLabel} />
          )}
          {parsed.pcHostname && (
            <DetailRow label="PC" value={parsed.pcHostname} />
          )}
          {parsed.panneType && parsed.actionType === 'pc_panne' && (
            <DetailRow label="Type panne" value={parsed.panneType} />
          )}
          {parsed.pcStatus && parsed.actionType === 'pc_status' && (
            <DetailRow label="Nouveau statut" value={parsed.pcStatus.replace('_', ' ')} />
          )}
        </View>

        {/* Countdown bar */}
        <View style={styles.countdownBar}>
          <Animated.View style={[
            styles.countdownFill, 
            { backgroundColor: conf.color }, 
            useAnimatedStyle(() => ({ width: `${progressAnim.value * 100}%` }))
          ]} />
        </View>
        <Text style={styles.countdownText}>Exécution automatique dans {countdown}s</Text>

        {/* Boutons */}
        <View style={styles.btns}>
          <Pressable onPress={onCancel} style={styles.btnCancel}>
            <Text style={styles.btnCancelText}>Annuler</Text>
          </Pressable>
          <Pressable onPress={onConfirm} style={[styles.btnConfirm, { backgroundColor: conf.color }]}>
            <Icon name="check" size={18} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.btnConfirmText}>Confirmer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const DetailRow = ({ label, value, color }: { label: string, value: string, color?: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, color ? { color } : null]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardSub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  details: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  countdownBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  countdownFill: {
    height: '100%',
  },
  countdownText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  btnConfirm: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
