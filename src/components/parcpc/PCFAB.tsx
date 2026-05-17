import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, SlideInDown, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { PARC_PC_COLORS } from './tokens';

interface PCFABProps {
  onPress: () => void;
}

export const PCFAB: React.FC<PCFABProps> = ({ onPress }) => {
  const scale = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [1, 0.92]) }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(220).duration(260)} style={styles.wrap}>
      <Animated.View entering={SlideInDown.delay(220).duration(420)} style={styles.glow} />
      <Animated.View entering={SlideInDown.delay(220).duration(420)} style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            scale.value = withSpring(1);
          }}
          onPressOut={() => {
            scale.value = withSpring(0);
          }}
        >
          <LinearGradient
            colors={['#22C55E', '#1B8A3E', '#116530']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Icon name="plus" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    zIndex: 30,
  },
  glow: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: PARC_PC_COLORS.green_primary,
    opacity: 0.18,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: PARC_PC_COLORS.green_light,
    shadowOpacity: 0.36,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
});
