import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

export type StepStatus = 'done' | 'active' | 'pending';

const STEP_ICONS = {
  article:  'barcode',
  type:     'swap-horizontal',
  details:  'check',
};

interface Step {
  key:    string;
  label:  string;
  status: StepStatus;
}

interface CAMouvementStepperProps {
  steps: Step[];
}

export const CAMouvementStepper = ({ steps }: CAMouvementStepperProps) => (
  <View style={styles.wrapper}
    accessibilityRole="progressbar"
    accessibilityLabel={`${steps.find(s => s.status === 'active')?.label ?? ''} — Étape ${steps.findIndex(s => s.status === 'active') + 1} sur ${steps.length}`}
  >
    <View style={styles.stepsRow} aria-hidden>
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          {/* Ligne entre étapes */}
          {i > 0 && (
            <View style={[
              styles.line,
              { backgroundColor: step.status !== 'pending' ? CA_THEME.white : 'rgba(255,255,255,0.30)' }
            ]} />
          )}
          {/* Cercle étape */}
          <View style={styles.stepItem}>
            <View style={[
              styles.circle,
              step.status === 'done'    && styles.circleDone,
              step.status === 'active'  && styles.circleActive,
              step.status === 'pending' && styles.circlePending,
            ]}>
              {step.status === 'done' ? (
                <Icon name="check" size={12} color={CA_THEME.green} />
              ) : step.status === 'active' ? (
                <Icon name={STEP_ICONS[step.key as keyof typeof STEP_ICONS]} size={12} color={CA_THEME.white} />
              ) : (
                <Text style={styles.circleNum}>{i + 1}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              step.status === 'active'  && styles.stepLabelActive,
              step.status === 'done'    && styles.stepLabelDone,
            ]}>
              {step.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>

    {/* Bande tricolore CA */}
    <View style={styles.triband} aria-hidden>
      <View style={[styles.stripe, { backgroundColor: '#FFD700' }]} />
      <View style={[styles.stripe, { backgroundColor: CA_THEME.greenLight }]} />
      <View style={[styles.stripe, { backgroundColor: CA_THEME.greenDark }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: CA_THEME.green,
    paddingTop:      12,
    paddingBottom:   14,
    paddingHorizontal: 20,
    position:        'relative',
  },
  stepsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  stepItem: { alignItems: 'center', gap: 5, zIndex: 1 },
  line:     { flex: 1, height: 2, marginBottom: 16, marginHorizontal: 2 },

  // Cercles
  circle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  circleDone: {
    backgroundColor: CA_THEME.white,
    borderColor:     CA_THEME.white,
  },
  circleActive: {
    backgroundColor: CA_THEME.greenLight,
    borderColor:     CA_THEME.greenLight,
  },
  circlePending: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderColor:     'rgba(255,255,255,0.40)',
  },
  circleNum: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  // Labels
  stepLabel:       { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.72)' },
  stepLabelActive: { color: CA_THEME.white, fontWeight: '700' },
  stepLabelDone:   { color: 'rgba(255,255,255,0.65)' },

  triband: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, flexDirection: 'row' },
  stripe:  { flex: 1 },
});
