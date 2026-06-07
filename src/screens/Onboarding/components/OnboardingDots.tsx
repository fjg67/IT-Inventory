import React from 'react';
import { StyleSheet, View } from 'react-native';

type OnboardingDotsProps = {
  total: number;
  active: number;
};

export const OnboardingDots: React.FC<OnboardingDotsProps> = ({ total, active }) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#22C55E',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(34,197,94,0.25)',
  },
});
