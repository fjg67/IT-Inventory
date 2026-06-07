import React from 'react';
import { StyleSheet, View } from 'react-native';

type OnboardingBackgroundProps = {
  accentColor: string;
};

export const OnboardingBackground: React.FC<OnboardingBackgroundProps> = ({ accentColor }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={styles.grid} />
    <View style={[styles.haloTopRight, { backgroundColor: accentColor }]} />
    <View style={styles.haloBottomLeft} />
  </View>
);

const styles = StyleSheet.create({
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0F0D',
    borderColor: 'rgba(34,197,94,0.06)',
    borderWidth: 1,
    opacity: 0.55,
  },
  haloTopRight: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 140,
    top: -30,
    right: -70,
    opacity: 0.16,
  },
  haloBottomLeft: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 130,
    left: -90,
    bottom: -70,
    backgroundColor: 'rgba(34,197,94,0.09)',
  },
});
