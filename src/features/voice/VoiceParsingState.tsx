import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ParsedVoiceCommand } from '@/types/voice.types';

const ACTION_LABELS: Record<string, string> = {
  stock_entree: 'Entrée',
  stock_sortie: 'Sortie',
  stock_consultation: 'Consultation',
  pc_panne: 'PC en panne',
  site_change: 'Changement de site',
  unknown: 'Inconnue',
};

export const VoiceParsingState = ({ parsed }: { parsed: Partial<ParsedVoiceCommand> }) => {
  const rows = [
    { label: 'Action',    value: parsed.actionType ? ACTION_LABELS[parsed.actionType] : '?', ok: !!parsed.actionType && parsed.actionType !== 'unknown' },
    { label: 'Article/PC',   value: parsed.articleLabel ?? parsed.articleName ?? parsed.pcHostname, ok: !!parsed.articleId || !!parsed.pcHostname || !!parsed.targetSiteId },
    { label: 'Quantité',  value: parsed.quantity ? `${parsed.quantity} unité(s)` : '—', ok: !!parsed.quantity },
  ];

  const confidencePct = Math.round((parsed.confidence ?? 0) * 100);
  const isHighConfidence = confidencePct > 75;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyse de la commande</Text>
      
      <View style={styles.card}>
        {rows.map((row, i) => (
          row.value ? (
            <Animated.View
              key={row.label}
              entering={FadeInDown.delay(i * 80).duration(250)}
              style={styles.row}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <View style={styles.valueContainer}>
                <Text style={[styles.rowValue, !row.ok && styles.rowValueWarn]}>
                  {row.value}
                </Text>
                <Icon
                  name={row.ok ? 'check-circle' : 'alert-circle'}
                  size={18}
                  color={row.ok ? '#10B981' : '#F59E0B'}
                  style={styles.icon}
                />
              </View>
            </Animated.View>
          ) : null
        ))}
      </View>

      {/* Barre de confiance */}
      <View style={styles.confidenceContainer}>
        <Text style={styles.confLabel}>Confiance</Text>
        <View style={styles.confBar}>
          <View style={[
            styles.confFill,
            {
              width: `${confidencePct}%`,
              backgroundColor: isHighConfidence ? '#10B981' : '#F59E0B',
            }
          ]} />
        </View>
        <Text style={[styles.confPct, { color: isHighConfidence ? '#10B981' : '#F59E0B' }]}>
          {confidencePct}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rowValueWarn: {
    color: '#D97706',
  },
  icon: {
    marginLeft: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  confLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginRight: 12,
  },
  confBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  confFill: {
    height: '100%',
    borderRadius: 4,
  },
  confPct: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
});
