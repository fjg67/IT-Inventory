import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { SlideContent } from '../components/SlideContent';
import { PulsingRing } from '../components/PulsingRing';

type SlideWelcomeProps = {
  isActive: boolean;
};

const LogoTiroirs: React.FC<{ size: number }> = ({ size }) => (
  <View style={[styles.iconWrap, { width: size, height: size }]}>
    <View style={styles.iconLine} />
    <View style={styles.iconLine} />
    <View style={styles.iconLine} />
    <View style={styles.iconStem} />
  </View>
);

export const SlideWelcome: React.FC<SlideWelcomeProps> = ({ isActive }) => (
  <OnboardingSlide>
    <View style={styles.illustrationWrap}>
      <PulsingRing active={isActive} size={132} color="rgba(34,197,94,0.35)" delay={0} />
      <PulsingRing active={isActive} size={164} color="rgba(34,197,94,0.2)" delay={260} />

      <View style={styles.logoSquare}>
        <LogoTiroirs size={34} />
      </View>

      <Text style={styles.badge}>01</Text>
    </View>

    <SlideContent
      title="Bienvenue sur IT-Inventory"
      description="Pilotez votre stock IT avec une interface rapide, claire et pensée pour le terrain."
    />
  </OnboardingSlide>
);

const styles = StyleSheet.create({
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSquare: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B8A3E',
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.4)',
    elevation: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  badge: {
    marginTop: 14,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#6B7280',
  },
  iconWrap: {
    justifyContent: 'space-between',
    position: 'relative',
  },
  iconLine: {
    height: 6,
    borderRadius: 2,
    backgroundColor: '#DCFCE7',
  },
  iconStem: {
    position: 'absolute',
    right: -4,
    top: 2,
    width: 3,
    height: 30,
    borderRadius: 2,
    backgroundColor: '#86EFAC',
  },
});
