import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface VoiceCommandButtonProps {
  onPress: () => void;
}

export const VoiceCommandButton = ({ onPress }: VoiceCommandButtonProps) => {
  const insets = useSafeAreaInsets();
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    // Légère pulsation pour attirer l'attention
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800 }),
        withTiming(1.0,  { duration: 1800 })
      ), -1, true
    );
    return () => cancelAnimation(pulseAnim);
  }, [pulseAnim]);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <Animated.View style={[styles.container, { bottom: Math.max(insets.bottom, 16) + 80 }, btnStyle]}>
      <Pressable
        onPress={onPress}
        style={styles.btn}
        accessibilityLabel="Contrôle vocal"
        accessibilityRole="button"
        hitSlop={8}
      >
        <Icon name="microphone" size={24} color="white" />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    zIndex: 1000,
  },
  btn: {
    width: 60, 
    height: 60, 
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2, 
    borderColor: 'rgba(16, 185, 129, 0.40)',
    elevation: 8, 
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, 
    shadowRadius: 10,
  },
});
