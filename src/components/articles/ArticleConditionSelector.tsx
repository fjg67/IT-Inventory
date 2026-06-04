import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ArticleCondition } from '@/types/article.types';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface ArticleConditionSelectorProps {
  condition: ArticleCondition;
  defectiveCount: number;
  totalStock: number;
  conditionNote?: string;
  onChange: (data: {
    condition: ArticleCondition;
    defectiveCount: number;
    conditionNote?: string;
  }) => void;
}

export const ArticleConditionSelector: React.FC<ArticleConditionSelectorProps> = ({
  condition,
  defectiveCount,
  totalStock,
  conditionNote,
  onChange,
}) => {
  const handleSelectCondition = (newCondition: ArticleCondition) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange({
      condition: newCondition,
      defectiveCount: newCondition === 'bon_etat' ? 0 : Math.max(0, defectiveCount),
      conditionNote: newCondition === 'bon_etat' ? undefined : conditionNote,
    });
  };

  const handleDefectiveCountChange = (delta: number) => {
    const newCount = Math.max(0, Math.min(totalStock, defectiveCount + delta));
    onChange({ condition, defectiveCount: newCount, conditionNote });
  };

  const safeTotal = Math.max(0, totalStock);
  const safeDefective = Math.max(0, Math.min(defectiveCount, safeTotal));

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitle}>Etat de l'article</Text>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          onPress={() => handleSelectCondition('bon_etat')}
          style={[
            styles.toggleBtn,
            condition === 'bon_etat' ? styles.toggleBtnOkActive : styles.toggleBtnOkInactive,
          ]}
        >
          <View
            style={[
              styles.toggleIconCircle,
              condition === 'bon_etat' ? styles.toggleIconCircleOkActive : styles.toggleIconCircleInactive,
            ]}
          >
            <Icon name="check-circle-outline" size={20} color={condition === 'bon_etat' ? '#22C55E' : '#6B7280'} />
          </View>
          <Text style={[styles.toggleLabel, { color: condition === 'bon_etat' ? '#86EFAC' : '#6B7280' }]}>Bon etat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelectCondition('defectueux')}
          style={[
            styles.toggleBtn,
            condition === 'defectueux' ? styles.toggleBtnDefActive : styles.toggleBtnDefInactive,
          ]}
        >
          <View
            style={[
              styles.toggleIconCircle,
              condition === 'defectueux' ? styles.toggleIconCircleDefActive : styles.toggleIconCircleInactive,
            ]}
          >
            <Icon name="alert-circle-outline" size={20} color={condition === 'defectueux' ? '#EF4444' : '#6B7280'} />
          </View>
          <Text style={[styles.toggleLabel, { color: condition === 'defectueux' ? '#FCA5A5' : '#6B7280' }]}>Defectueux</Text>
        </TouchableOpacity>
      </View>

      {condition === 'defectueux' ? (
        <View style={styles.defectPanel}>
          <Text style={styles.defectPanelTitle}>Combien d'unites sont defectueuses ?</Text>
          <Text style={styles.defectPanelSub}>Stock total: {safeTotal}</Text>

          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => handleDefectiveCountChange(-1)}
              disabled={safeDefective <= 0}
              style={[styles.stepBtn, styles.stepBtnMinus]}
            >
              <Text style={[styles.stepBtnText, { color: safeDefective <= 0 ? '#374151' : '#EF4444' }]}>-</Text>
            </TouchableOpacity>

            <View style={styles.stepValueContainer}>
              <Text style={styles.stepValue}>{safeDefective}</Text>
              <Text style={styles.stepUnit}>unites defectueuses</Text>
            </View>

            <TouchableOpacity
              onPress={() => handleDefectiveCountChange(1)}
              disabled={safeDefective >= safeTotal}
              style={[styles.stepBtn, styles.stepBtnPlus]}
            >
              <Text style={[styles.stepBtnText, { color: safeDefective >= safeTotal ? '#374151' : '#22C55E' }]}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noteInput}>
            <Text style={styles.noteLabel}>Note sur la defaillance (optionnel)</Text>
            <TextInput
              value={conditionNote ?? ''}
              onChangeText={(text) => onChange({ condition, defectiveCount: safeDefective, conditionNote: text })}
              placeholder="Decrire le probleme..."
              placeholderTextColor="#374151"
              multiline
              numberOfLines={2}
              style={styles.noteTextInput}
            />
          </View>
        </View>
      ) : (
        <View style={styles.goodStateNote}>
          <Icon name="check-circle-outline" size={16} color="#22C55E" />
          <Text style={styles.goodStateText}>Toutes les unites sont en bon etat.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: '#1B8A3E' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#F0FDF4' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  toggleBtnOkActive: {
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderColor: 'rgba(34,197,94,0.40)',
  },
  toggleBtnOkInactive: {
    backgroundColor: '#16231A',
    borderColor: 'rgba(34,197,94,0.08)',
  },
  toggleBtnDefActive: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.40)',
  },
  toggleBtnDefInactive: {
    backgroundColor: '#16231A',
    borderColor: 'rgba(239,68,68,0.08)',
  },
  toggleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconCircleOkActive: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  toggleIconCircleDefActive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  toggleIconCircleInactive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  toggleLabel: { fontSize: 13, fontWeight: '700' },
  defectPanel: {
    backgroundColor: '#16231A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.20)',
    padding: 16,
    gap: 10,
  },
  defectPanelTitle: { fontSize: 13, fontWeight: '700', color: '#F0FDF4' },
  defectPanelSub: { fontSize: 12, color: '#6B7280' },
  stepper: {
    flexDirection: 'row',
    backgroundColor: '#0A0F0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
    overflow: 'hidden',
  },
  stepBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnMinus: { borderRightWidth: 1, borderRightColor: 'rgba(239,68,68,0.12)' },
  stepBtnPlus: { borderLeftWidth: 1, borderLeftColor: 'rgba(239,68,68,0.12)' },
  stepBtnText: { fontSize: 22, fontWeight: '700' },
  stepValueContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EF4444',
    fontVariant: ['tabular-nums'],
  },
  stepUnit: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  noteInput: { gap: 6 },
  noteLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  noteTextInput: {
    backgroundColor: '#0A0F0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    padding: 10,
    color: '#F0FDF4',
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  goodStateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.12)',
  },
  goodStateText: { fontSize: 12, color: '#86EFAC', fontWeight: '500' },
});
