import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import LinearGradient from 'react-native-linear-gradient';
import { CA_THEME } from '@/constants/caTheme';

const SLIDER_WIDTH = Dimensions.get('window').width - 48; // padding 24
const BUTTON_SIZE = 50;
const MAX_TRANSLATE = SLIDER_WIDTH - BUTTON_SIZE - 4; // 4px padding inside

import { MovementIdentity } from '../movement/movementTheme';

interface CASwipeToConfirmProps {
  onConfirm: () => void;
  isLoading?: boolean;
  identity?: MovementIdentity;
}

export const CASwipeToConfirm = ({ onConfirm, isLoading }: CASwipeToConfirmProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const themeColor = CA_THEME.green;

  const handleConfirm = () => {
    ReactNativeHapticFeedback.trigger('notificationSuccess');
    setConfirmed(true);
    onConfirm();
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      runOnJS(ReactNativeHapticFeedback.trigger)('selection');
    })
    .onUpdate((event) => {
      if (confirmed || isLoading) return;
      let nextX = startX.value + event.translationX;
      nextX = Math.max(0, Math.min(nextX, MAX_TRANSLATE));
      translateX.value = nextX;
    })
    .onEnd(() => {
      if (confirmed || isLoading) return;
      if (translateX.value > MAX_TRANSLATE * 0.85) {
        // Confirmed
        translateX.value = withSpring(MAX_TRANSLATE, { damping: 15, stiffness: 100 });
        runOnJS(handleConfirm)();
      } else {
        // Reset
        translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
        runOnJS(ReactNativeHapticFeedback.trigger)('impactLight');
      }
    });

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedGradientStyle = useAnimatedStyle(() => ({
    width: translateX.value + BUTTON_SIZE,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(confirmed || isLoading ? 0 : 1 - (translateX.value / MAX_TRANSLATE), { duration: 150 }),
  }));

  const animatedConfirmedTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(confirmed ? 1 : 0, { duration: 300 }),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.gradientContainer, animatedGradientStyle]}>
        <LinearGradient
          colors={[CA_THEME.greenLight, themeColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
        <Animated.Text style={[styles.text, animatedTextStyle]}>
          Glisser pour valider
        </Animated.Text>
        <Animated.Text style={[styles.textConfirmed, animatedConfirmedTextStyle]}>
          Validé
        </Animated.Text>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.button, animatedButtonStyle]}>
          {isLoading ? (
            <Icon name="loading" size={24} color={themeColor} style={styles.spinner} />
          ) : confirmed ? (
            <Icon name="check" size={24} color={themeColor} />
          ) : (
            <Icon name="chevron-double-right" size={24} color={themeColor} />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    width: '100%',
    backgroundColor: '#F0F7F2',
    borderRadius: 28,
    justifyContent: 'center',
    padding: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CA_THEME.greenBg2,
  },
  gradientContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 28,
    overflow: 'hidden',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: CA_THEME.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  text: {
    color: CA_THEME.greenDark,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 56, // matching container height
  },
  textConfirmed: {
    color: CA_THEME.white,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
    lineHeight: 56,
  },
  spinner: {
  },
});
