// components/add-pc/PCSuccessRings.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface PCSuccessRingsProps {
  color: string;
  trigger: boolean;
}

const RINGS = [
  { size: 120, delay: 100 },
  { size: 95, delay: 220 },
  { size: 70, delay: 340 },
];

export const PCSuccessRings: React.FC<PCSuccessRingsProps> = ({ color, trigger }) => {
  // Explicit shared values (no hooks in loops)
  const opacity0 = useSharedValue(0);
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const scale0 = useSharedValue(1);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);

  const opacities = [opacity0, opacity1, opacity2];
  const scales = [scale0, scale1, scale2];

  useEffect(() => {
    if (!trigger) return;

    // Reset first
    opacities.forEach((o) => { o.value = 0; });
    scales.forEach((s) => { s.value = 1; });

    RINGS.forEach((ring, i) => {
      opacities[i].value = withDelay(
        ring.delay,
        withSequence(
          withTiming(0.75, { duration: 80 }),
          withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }),
        ),
      );
      scales[i].value = withDelay(
        ring.delay,
        withSequence(
          withTiming(1.0, { duration: 0 }),
          withTiming(1.45, { duration: 700, easing: Easing.out(Easing.quad) }),
        ),
      );
    });

    return () => {
      opacities.forEach((o) => cancelAnimation(o));
      scales.forEach((s) => cancelAnimation(s));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const style0 = useAnimatedStyle(() => ({
    opacity: opacity0.value,
    transform: [{ scale: scale0.value }],
  }));
  const style1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
    transform: [{ scale: scale1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [{ scale: scale2.value }],
  }));
  const ringStyles = [style0, style1, style2];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {RINGS.map((ring, i) => (
        <Animated.View
          key={ring.size}
          style={[
            styles.ring,
            ringStyles[i],
            {
              width: ring.size,
              height: ring.size,
              borderRadius: ring.size / 2,
              borderColor: color,
              top: '50%',
              left: '50%',
              marginTop: -(ring.size / 2),
              marginLeft: -(ring.size / 2),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});
