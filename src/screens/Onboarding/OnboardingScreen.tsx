// ============================================
// ONBOARDING SCREEN - IT-Inventory Application
// Écran principal de présentation - Design premium
// ============================================

import React, { useRef, useState } from 'react';
import { View, StyleSheet, StatusBar, Dimensions } from 'react-native';
import Swiper from 'react-native-swiper';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import WelcomeSlide from './slides/WelcomeSlide';
import ScanSlide from './slides/ScanSlide';
import TraceabilitySlide from './slides/TraceabilitySlide';
import MultiSiteSlide from './slides/MultiSiteSlide';
import SlideIndicator from './components/SlideIndicator';
import OnboardingButton from './components/OnboardingButton';
import { onboardingTheme } from '@/constants/onboardingTheme';
import { useResponsive } from '@/utils/responsive';

const { width: W, height: H } = Dimensions.get('window');
const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: Math.random() * W,
  top: Math.random() * H,
  size: Math.random() * 4 + 2,
  opacity: Math.random() * 0.08 + 0.03,
}));

const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const swiperRef = useRef<Swiper>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = 4;
  const { isTablet, contentMaxWidth } = useResponsive();

  const handleNext = () => {
    if (currentIndex < totalSlides - 1) {
      if (swiperRef.current) {
        swiperRef.current.scrollBy(1);
      }
    } else {
      handleStart();
    }
  };

  const handleSkip = () => {
    handleStart();
  };

  const handleStart = async () => {
    // Marquer l'onboarding comme vu
    await AsyncStorage.setItem('@it-inventory/onboarding_seen', 'true');
    // Aller vers la page de connexion premium
    navigation.replace('Login');
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={onboardingTheme.colors.gradient.start} 
        translucent 
      />
      
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Particules flottantes */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {PARTICLES.map((p) => (
            <View
              key={p.id}
              style={[
                styles.particle,
                {
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  opacity: p.opacity,
                },
              ]}
            />
          ))}
        </View>

        <View style={[styles.contentContainer, isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : undefined]}>
          <Swiper
            ref={swiperRef}
            loop={false}
            showsPagination={false}
            onIndexChanged={(index) => setCurrentIndex(index)}
            scrollEventThrottle={16}
          >
            <WelcomeSlide />
            <ScanSlide />
            <TraceabilitySlide />
            <MultiSiteSlide />
          </Swiper>
        </View>

        {/* Indicateurs */}
        <View style={styles.indicatorContainer}>
          <SlideIndicator total={totalSlides} current={currentIndex} />
        </View>

        {/* Boutons */}
        <View style={[styles.buttonsContainer, isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' } : undefined]}>
          <OnboardingButton
            title={currentIndex === totalSlides - 1 ? 'Commencer' : 'Suivant'}
            onPress={handleNext}
            primary
            style={styles.mainButton}
          />
          
          {currentIndex < totalSlides - 1 ? (
            <OnboardingButton
              title="Passer"
              onPress={handleSkip}
              secondary
            />
          ) : (
            <View style={styles.spacer} /> // Placeholder pour garder l'espacement
          )}
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#FFF',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 150, // Espace pour les boutons
  },
  indicatorContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  mainButton: {
    marginBottom: 8,
  },
  spacer: {
    height: 50,
  },
});

export default OnboardingScreen;
