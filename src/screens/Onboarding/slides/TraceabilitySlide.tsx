// ============================================
// TRACEABILITY SLIDE - Design premium
// IT-Inventory Onboarding
// ============================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { onboardingTheme } from '@/constants/onboardingTheme';

const FEATURES = [
  {
    icon: 'chart-timeline-variant' as const,
    label: 'Mouvements en temps réel',
  },
  {
    icon: 'history' as const,
    label: 'Historique détaillé',
  },
  {
    icon: 'file-document-multiple-outline' as const,
    label: 'Rapports et suivi',
  },
];

const FeatureRow = ({ icon, label, delay }: { icon: string; label: string; delay: number }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(1, { duration: 0 })
      )
    );
    translateX.value = withDelay(delay, withTiming(0, { duration: 400 }));
  }, [delay, opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.featureRow, animatedStyle]}>
      <View style={styles.iconCircle}>
        <Icon name={icon as any} size={22} color={onboardingTheme.colors.primaryLight} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </Animated.View>
  );
};

const TraceabilitySlide = () => {
  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.card}
        entering={FadeIn.duration(400)}
      >
        <View style={styles.cardInner}>
          {FEATURES.map((item, index) => (
            <FeatureRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              delay={400 + index * 180}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.Text
        style={styles.title}
        entering={FadeInUp.delay(300).duration(500)}
      >
        Traçabilité complète
      </Animated.Text>

      <Animated.Text
        style={styles.subtitle}
        entering={FadeInUp.delay(500).duration(500)}
      >
        Suivez chaque mouvement de stock et consultez l'historique détaillé de vos opérations.
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: onboardingTheme.layout.slidePadding,
  },
  card: {
    marginBottom: 36,
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    ...onboardingTheme.shadows.card,
  },
  cardInner: {
    gap: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: onboardingTheme.colors.text.primary,
    flex: 1,
  },
  title: {
    ...onboardingTheme.typography.title,
    marginBottom: 16,
    fontSize: 30,
  },
  subtitle: {
    ...onboardingTheme.typography.subtitle,
  },
});

export default TraceabilitySlide;
