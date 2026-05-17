import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ONBOARDING_COLORS } from './tokens';

type StepDotsProps = {
  step: 1 | 2 | 3;
  totalSteps?: number;
};

export const StepDots: React.FC<StepDotsProps> = ({ step, totalSteps = 3 }) => {
  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const active = index < step;
        return (
          <View
            key={`step-${index}`}
            style={[
              styles.dot,
              active ? styles.dotActive : styles.dotInactive,
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    borderRadius: 999,
  },
  dotActive: {
    width: 8,
    height: 8,
    backgroundColor: ONBOARDING_COLORS.green_primary,
    shadowColor: ONBOARDING_COLORS.green_light,
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: ONBOARDING_COLORS.border_card,
  },
});
