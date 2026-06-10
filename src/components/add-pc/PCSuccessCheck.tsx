// components/add-pc/PCSuccessCheck.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PCSuccessCheckProps {
  color: string;
  subtle: string;
  border: string;
  icon: string;
  trigger: boolean;
}

export const PCSuccessCheck: React.FC<PCSuccessCheckProps> = ({
  color,
  subtle,
  border,
  icon,
  trigger,
}) => {
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0.3);
  const iconOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;

    // Reset
    scale.value = 0.2;
    opacity.value = 0;
    iconScale.value = 0.3;
    iconOpacity.value = 0;
    glowOpacity.value = 0;

    // Cercle pop-in
    scale.value = withSpring(1.0, { damping: 10, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 120 });

    // Icône décalée de 120ms
    iconScale.value = withDelay(120, withSpring(1.0, { damping: 8, stiffness: 200 }));
    iconOpacity.value = withDelay(120, withTiming(1, { duration: 150 }));

    // Glow pulse
    glowOpacity.value = withDelay(80, withTiming(0.5, { duration: 150 }));
    const glowTimer = setTimeout(() => {
      glowOpacity.value = withTiming(0, { duration: 800 });
    }, 400);

    return () => {
      clearTimeout(glowTimer);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(iconScale);
      cancelAnimation(iconOpacity);
      cancelAnimation(glowOpacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Glow derrière */}
      <Animated.View
        style={[styles.glow, glowStyle, { backgroundColor: color }]}
      />

      {/* Cercle principal */}
      <Animated.View
        style={[
          styles.circle,
          circleStyle,
          {
            backgroundColor: subtle,
            borderColor: border,
            shadowColor: color,
          },
        ]}
      >
        {/* Icône ✓ */}
        <Animated.View style={iconStyle}>
          <Icon name={icon} size={32} color={color} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  circle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
});
