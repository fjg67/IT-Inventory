import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GridBackground } from './GridBackground';
import { StepDots } from './StepDots';
import { ONBOARDING_COLORS } from './tokens';

type OnboardingLayoutProps = {
  children: React.ReactNode;
  step: 1 | 2 | 3;
  totalSteps?: number;
};

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  step,
  totalSteps = 3,
}) => {
  return (
    <View style={styles.container}>
      <GridBackground />

      <View style={[styles.glowCircle, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glowCircle, styles.glowBottom]} pointerEvents="none" />

      <View style={styles.content}>
        <StepDots step={step} totalSteps={totalSteps} />
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.bg_primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: ONBOARDING_COLORS.green_glow,
  },
  glowTop: {
    top: -60,
    right: -60,
    width: 200,
    height: 200,
  },
  glowBottom: {
    bottom: 80,
    left: -40,
    width: 120,
    height: 120,
    opacity: 0.5,
  },
});
