import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { onboardingTheme } from '@/constants/onboardingTheme';

interface SiteNodeProps {
  delay: number;
  x: number;
  y: number;
  size?: number;
  color?: string;
}

const SiteNode: React.FC<SiteNodeProps> = ({ 
  delay, 
  x, 
  y, 
  size = 40, 
  color = onboardingTheme.colors.primaryLight 
}) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1));
  }, [delay, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    left: x,
    top: y,
    opacity: scale.value,
  }));

  return (
    <Animated.View style={[styles.node, { width: size, height: size, borderColor: color }, animatedStyle]}>
      <MaterialCommunityIcons name="warehouse" size={size/2} color={color} />
    </Animated.View>
  );
};

const MultiSiteSlide = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {/* Main Hub */}
        <SiteNode delay={500} x={80} y={40} size={60} color={onboardingTheme.colors.accent} />
        {/* Satellites */}
        <SiteNode delay={1000} x={20} y={120} size={40} />
        <SiteNode delay={1200} x={140} y={120} size={40} />
      </View>

      <Animated.Text 
        style={styles.title}
        entering={FadeInDown.delay(300).duration(800)}
      >
        Gestion multi-sites
      </Animated.Text>
      
      <Animated.Text 
        style={styles.subtitle}
        entering={FadeInDown.delay(500).duration(800)}
      >
        Gérez les stocks de plusieurs entrepôts et effectuez des transferts en toute simplicité.
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
    height: 200,
    width: 200,
    marginBottom: 20,
    position: 'relative',
  },
  node: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    ...onboardingTheme.typography.title,
    marginBottom: 16,
  },
  subtitle: {
    ...onboardingTheme.typography.subtitle,
  },
});

export default MultiSiteSlide;
