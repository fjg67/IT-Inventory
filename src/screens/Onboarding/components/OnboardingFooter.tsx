import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type OnboardingFooterProps = {
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
};

export const OnboardingFooter: React.FC<OnboardingFooterProps> = ({ isLast, onNext, onSkip }) => (
  <View style={styles.footer}>
    <Pressable onPress={onNext} style={({ pressed }) => [styles.nextBtn, pressed && styles.nextBtnPressed]}>
      <Text style={styles.nextText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
      <Icon name={isLast ? 'rocket-launch-outline' : 'arrow-right'} size={16} color="#FFFFFF" />
    </Pressable>

    {!isLast ? (
      <Pressable onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>PASSER</Text>
      </Pressable>
    ) : (
      <View style={styles.skipPlaceholder} />
    )}
  </View>
);

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    gap: 14,
  },
  nextBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#1B8A3E',
    elevation: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  nextBtnPressed: {
    backgroundColor: '#156B2F',
    transform: [{ scale: 0.97 }],
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipBtn: {
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1.2,
  },
  skipPlaceholder: {
    height: 18,
  },
});
