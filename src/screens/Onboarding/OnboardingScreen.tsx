import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@/navigation/types';
import { OnboardingBackground } from './components/OnboardingBackground';
import { OnboardingDots } from './components/OnboardingDots';
import { OnboardingFooter } from './components/OnboardingFooter';
import { SlideMultiSite } from './slides/SlideMultiSite';
import { SlideScan } from './slides/SlideScan';
import { SlideTracing } from './slides/SlideTracing';
import { SlideWelcome } from './slides/SlideWelcome';

const SLIDES = ['welcome', 'scan', 'tracing', 'multisite'] as const;
type SlideId = typeof SLIDES[number];

const ONBOARDING_KEY = '@it-inventory/onboarding_seen';

const SLIDE_ACCENTS: Record<SlideId, { color: string }> = {
  welcome: { color: '#22C55E' },
  scan: { color: '#22C55E' },
  tracing: { color: '#8B5CF6' },
  multisite: { color: '#F59E0B' },
};

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const pagerRef = useRef<FlatList<SlideId>>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  const isLast = activeIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[activeIndex];

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      try {
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!cancelled && done === 'true') {
          navigation.replace('Login');
          return;
        }
      } finally {
        if (!cancelled) {
          setCheckingOnboarding(false);
        }
      }
    };

    checkOnboarding().catch(() => {
      if (!cancelled) {
        setCheckingOnboarding(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigation]);

  const handleFinish = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Login');
  }, [navigation]);

  const handleSkip = useCallback(() => {
    handleFinish().catch(() => {});
  }, [handleFinish]);

  const goNext = useCallback(() => {
    if (isLast) {
      handleFinish().catch(() => {});
      return;
    }

    pagerRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  }, [activeIndex, handleFinish, isLast]);

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = event.nativeEvent.layoutMeasurement.width;
    if (!width) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextIndex >= 0 && nextIndex < SLIDES.length) {
      setActiveIndex(nextIndex);
    }
  }, []);

  const renderSlide = useCallback(({ item }: { item: SlideId }) => {
    if (item === 'welcome') {
      return (
        <View style={[styles.slidePage, { width }]}> 
          <SlideWelcome isActive={activeIndex === 0} />
        </View>
      );
    }

    if (item === 'scan') {
      return (
        <View style={[styles.slidePage, { width }]}> 
          <SlideScan isActive={activeIndex === 1} />
        </View>
      );
    }

    if (item === 'tracing') {
      return (
        <View style={[styles.slidePage, { width }]}> 
          <SlideTracing isActive={activeIndex === 2} />
        </View>
      );
    }

    return (
      <View style={[styles.slidePage, { width }]}> 
        <SlideMultiSite isActive={activeIndex === 3} />
      </View>
    );
  }, [activeIndex, width]);

  const accentColor = useMemo(() => SLIDE_ACCENTS[activeSlide].color, [activeSlide]);

  if (checkingOnboarding) {
    return (
      <View style={styles.loaderScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0F0D" />
        <ActivityIndicator size="small" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F0D" />

      <OnboardingBackground accentColor={accentColor} />

      <FlatList
        ref={pagerRef}
        style={styles.pager}
        data={SLIDES}
        keyExtractor={(item) => item}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      <View style={[styles.footer, { paddingBottom: 40 + (insets.bottom || 0) }]}> 
        <OnboardingDots total={SLIDES.length} active={activeIndex} />
        <OnboardingFooter isLast={isLast} onNext={goNext} onSkip={handleSkip} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderScreen: {
    flex: 1,
    backgroundColor: '#0A0F0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  pager: {
    flex: 1,
  },
  slidePage: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    gap: 16,
  },
});

export default OnboardingScreen;
