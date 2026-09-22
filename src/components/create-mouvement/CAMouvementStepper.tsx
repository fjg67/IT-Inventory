import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
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
  themeColor?: string;
  themeSubtle?: string;
}

export const CAMouvementStepper = ({ steps, themeColor = CA_THEME.green, themeSubtle = CA_THEME.greenLight }: CAMouvementStepperProps) => (
  <Animated.View style={styles.wrapper}
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
              { backgroundColor: step.status === 'pending' ? CA_THEME.borderGray : themeColor }
            ]} />
          )}
          {/* Cercle étape */}
          <View style={styles.stepItem}>
            <View style={[
              styles.circle,
              step.status === 'done'    && { backgroundColor: themeColor, borderColor: themeColor },
              step.status === 'active'  && { backgroundColor: themeSubtle, borderColor: themeColor },
              step.status === 'pending' && styles.circlePending,
            ]}>
              {step.status === 'done' ? (
                <Icon name="check" size={14} color={CA_THEME.white} />
              ) : step.status === 'active' ? (
                <Icon name={STEP_ICONS[step.key as keyof typeof STEP_ICONS]} size={14} color={themeColor} />
              ) : (
                <Text style={styles.circleNum}>{i + 1}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              step.status === 'active'  && { color: themeColor, fontWeight: '700' },
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
  </Animated.View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: CA_THEME.white,
    paddingTop:      16,
    paddingBottom:   16,
    paddingHorizontal: 24,
    position:        'relative',
    borderBottomWidth: 1,
    borderBottomColor: CA_THEME.borderGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  stepsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  stepItem: { alignItems: 'center', gap: 6, zIndex: 1 },
  line:     { flex: 1, height: 2, marginBottom: 18, marginHorizontal: 4, borderRadius: 1 },

  // Cercles
  circle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  circlePending: {
    backgroundColor: CA_THEME.white,
    borderColor:     CA_THEME.borderGray,
  },
  circleNum: { fontSize: 12, fontWeight: '600', color: CA_THEME.textMuted },

  // Labels
  stepLabel:       { fontSize: 11, fontWeight: '600', color: CA_THEME.textMuted },
  stepLabelDone:   { color: CA_THEME.textPrimary },

  triband: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
  stripe:  { flex: 1 },
});
