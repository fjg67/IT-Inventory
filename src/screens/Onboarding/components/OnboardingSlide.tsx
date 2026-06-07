import React from 'react';
import { StyleSheet, View } from 'react-native';

type OnboardingSlideProps = {
  children: React.ReactNode;
};

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ children }) => (
  <View style={styles.container}>{children}</View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 16,
  },
});
