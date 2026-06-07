import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { SlideContent } from '../components/SlideContent';

type SlideTracingProps = {
  isActive: boolean;
};

type FeatureItem = {
  icon: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  delay: number;
};

const FEATURES: FeatureItem[] = [
  {
    icon: 'trending-up',
    label: 'Mouvements en temps reel',
    color: '#22C55E',
    subtle: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.22)',
    delay: 200,
  },
  {
    icon: 'history',
    label: 'Historique detaille',
    color: '#8B5CF6',
    subtle: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.22)',
    delay: 320,
  },
  {
    icon: 'file-chart-outline',
    label: 'Rapports et suivi',
    color: '#3B82F6',
    subtle: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.22)',
    delay: 440,
  },
];

const FeatureRow: React.FC<{ feature: FeatureItem; index: number; isActive: boolean }> = ({ feature, index, isActive }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);

    if (!isActive) {
      progress.value = 0;
      return;
    }

    progress.value = withDelay(feature.delay, withTiming(1, { duration: 280 }));

    return () => {
      cancelAnimation(progress);
    };
  }, [feature.delay, isActive, progress]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * 22 }],
  }));

  return (
    <Animated.View style={[styles.featureRow, index < FEATURES.length - 1 ? styles.featureRowBorder : null, rowStyle]}>
      <View style={[styles.featureIcon, { backgroundColor: feature.subtle, borderColor: feature.border }]}>
        <Icon name={feature.icon} size={18} color={feature.color} />
      </View>
      <Text style={[styles.featureLabel, { color: feature.color }]}>{feature.label}</Text>
    </Animated.View>
  );
};

export const SlideTracing: React.FC<SlideTracingProps> = ({ isActive }) => (
  <OnboardingSlide>
    <View style={styles.illustrationWrap}>
      <View style={styles.featureCard}>
        {FEATURES.map((feature, index) => (
          <FeatureRow key={feature.label} feature={feature} index={index} isActive={isActive} />
        ))}
      </View>
    </View>

    <SlideContent
      title="Tracabilite complete"
      description="Suivez vos operations en temps reel avec historique, contexte et reporting fiables."
    />
  </OnboardingSlide>
);

const styles = StyleSheet.create({
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCard: {
    width: '90%',
    backgroundColor: '#16231A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.10)',
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34,197,94,0.06)',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
