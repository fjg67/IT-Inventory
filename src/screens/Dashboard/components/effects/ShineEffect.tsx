import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { premiumAnimation } from '../../../../constants/premiumTheme';

interface ShineEffectProps {
  /** Largeur du conteneur parent */
  width?: number;
}

/**
 * Effet de brillance (ligne lumineuse qui traverse horizontalement)
 * S'utilise en overlay dans un conteneur avec overflow: hidden
 */
const ShineEffect: React.FC<ShineEffectProps> = ({ width = 400 }) => {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withDelay(
          premiumAnimation.shineDelay,
          withTiming(width, {
            duration: premiumAnimation.shineDuration,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        withTiming(-width, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [width, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: '25deg' },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -50,
    bottom: -50,
    width: 60,
  },
  gradient: {
    flex: 1,
  },
});

export default ShineEffect;
