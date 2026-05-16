import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Vibration, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TAB_BAR_COLORS } from '@/constants/tabConfig';

interface ScanButtonProps {
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const ScanButton: React.FC<ScanButtonProps> = ({ isFocused, onPress, onLongPress }) => {
  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.35);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200 }),
        withTiming(0.3, { duration: 800 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(ringScale);
      cancelAnimation(ringOpacity);
      ringScale.value = 1;
      ringOpacity.value = 0.35;
    };
  }, [ringOpacity, ringScale]);

  useEffect(() => {
    if (isFocused) {
      buttonRotation.value = withSequence(
        withSpring(5, { damping: 11, stiffness: 220 }),
        withSpring(0, { damping: 12, stiffness: 220 }),
      );
    }
  }, [buttonRotation, isFocused]);

  const handlePress = () => {
    Vibration.vibrate(18);
    buttonScale.value = withSequence(
      withSpring(0.88, { damping: 10, stiffness: 280 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    ringOpacity.value = withSequence(
      withTiming(0, { duration: 80 }),
      withTiming(1, { duration: 120 }),
      withTiming(0.3, { duration: 120 }),
    );
    onPress();
  };

  const buttonAnim = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
      { rotate: `${buttonRotation.value}deg` },
    ],
  }));

  const ringAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.ring, ringAnim]} />

      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        accessibilityRole="tab"
        accessibilityState={isFocused ? { selected: true } : {}}
        style={styles.pressable}
      >
        <Animated.View style={[styles.buttonOuter, buttonAnim]}>
          <LinearGradient
            colors={isFocused ? ['#22C55E', '#1B8A3E'] : ['#1B8A3E', '#145C2A']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.button}
          >
            <Icon name="barcode-scan" size={26} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  pressable: {
    minHeight: 56,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  buttonOuter: {
    width: 56,
    height: 56,
    borderRadius: 16,
    shadowColor: TAB_BAR_COLORS.greenLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScanButton;
