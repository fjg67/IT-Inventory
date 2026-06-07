import React, { useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { type InitStep, useSplashSequence } from '@/hooks/useSplashSequence';
import { SplashBrand } from '@/components/splash/SplashBrand';
import { SplashDots } from '@/components/splash/SplashDots';
import { SplashLogo } from '@/components/splash/SplashLogo';
import { SplashProgressBar } from '@/components/splash/SplashProgressBar';
import { SplashStripes } from '@/components/splash/SplashStripes';

type SplashScreenProps = {
  step?: InitStep;
  message?: string;
  isError?: boolean;
  onRetry?: () => void;
};

export const SplashScreen: React.FC<SplashScreenProps> = ({
  step,
  message,
  isError = false,
  onRetry,
}) => {
  const [stripesVisible, setStripesVisible] = useState(true);
  const { statusText, progressValue, isReady } = useSplashSequence({
    step,
    message,
    isError,
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F0D" />

      {stripesVisible ? <SplashStripes onComplete={() => setStripesVisible(false)} /> : null}

      <View style={styles.content}>
        <SplashLogo />
        <SplashBrand />

        <Animated.View entering={FadeInDown.delay(760).duration(280)} style={styles.progressSection}>
          <SplashProgressBar progressValue={progressValue} label={statusText} isError={isError} />

          {!isError ? (
            <SplashDots showReadyCheck={isReady} />
          ) : (
            <Animated.View entering={FadeIn.duration(180)} style={styles.errorNote}>
              <Text style={styles.errorText}>Connexion impossible. Verifiez votre reseau.</Text>
              {onRetry ? (
                <Pressable onPress={onRetry} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Reessayer</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          )}
        </Animated.View>
      </View>

      <Text style={styles.version}>v2.26</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0F0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 10,
    paddingHorizontal: 28,
  },
  progressSection: {
    marginTop: 8,
    alignItems: 'center',
    gap: 12,
    minHeight: 70,
  },
  errorNote: {
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    position: 'absolute',
    bottom: 32,
    fontSize: 11,
    color: 'rgba(134,239,172,0.18)',
    letterSpacing: 0.5,
  },
});
