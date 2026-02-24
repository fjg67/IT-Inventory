// ============================================
// ONBOARDING BUTTON - IT-Inventory Application
// Bouton premium avec dégradé et glow
// ============================================

import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { onboardingTheme } from '@/constants/onboardingTheme';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  primary?: boolean;
  secondary?: boolean;
  style?: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const OnboardingButton: React.FC<OnboardingButtonProps> = ({
  title,
  onPress,
  primary = false,
  secondary = false,
  style,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  const handlePress = () => {
    Vibration.vibrate(10);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (primary) {
    return (
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.touchable}
        >
          <LinearGradient
            colors={['#3B82F6', '#2563EB', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.primaryText}>{title}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.secondaryButton}
        activeOpacity={0.7}
      >
        <Text style={styles.secondaryText}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  touchable: {
    width: '100%',
    shadowColor: onboardingTheme.colors.primaryLight,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  gradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: onboardingTheme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default OnboardingButton;
