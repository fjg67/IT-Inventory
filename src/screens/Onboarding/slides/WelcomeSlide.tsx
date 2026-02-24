import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { onboardingTheme } from '@/constants/onboardingTheme';

const WelcomeSlide = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.iconContainer, animatedIconStyle, onboardingTheme.shadows.glow]}
        entering={FadeInDown.duration(800).springify()}
      >
        <MaterialCommunityIcons 
          name="cube-outline" 
          size={120} 
          color={onboardingTheme.colors.primaryLight} 
        />
      </Animated.View>

      <Animated.Text 
        style={styles.title}
        entering={FadeInDown.delay(300).duration(800)}
      >
        Bienvenue sur{'\n'}IT-Inventory
      </Animated.Text>
      
      <Animated.Text 
        style={styles.subtitle}
        entering={FadeInDown.delay(500).duration(800)}
      >
        Gérez votre stock de consommables informatiques avec simplicité et efficacité.
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
  iconContainer: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 9999,
    padding: 40,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  title: {
    ...onboardingTheme.typography.title,
    marginBottom: 16,
  },
  subtitle: {
    ...onboardingTheme.typography.subtitle,
  },
});

export default WelcomeSlide;
