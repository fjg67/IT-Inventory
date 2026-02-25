import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  SlideInRight,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ShineEffect from './effects/ShineEffect';
import FloatingParticles from './effects/FloatingParticles';
import {
  premiumSpacing,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { isTablet as isTabletDevice } from '../../../utils/responsive';

interface ScanButtonXXLProps {
  onPress: () => void;
}

const ScanButtonXXL: React.FC<ScanButtonXXLProps> = ({ onPress }) => {
  const { width: screenWidth } = useWindowDimensions();
  const tablet = isTabletDevice(screenWidth);
  const buttonWidth = tablet ? Math.min(screenWidth - premiumSpacing.lg * 2, 600) : screenWidth - premiumSpacing.lg * 2;
  const buttonHeight = tablet ? 190 : 170;
  const iconSize = tablet ? 52 : 44;
  const iconCircleSize = tablet ? 86 : 74;

  // Icon pulse animation
  const iconScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: premiumAnimation.pulseDuration / 2 }),
        withTiming(1, { duration: premiumAnimation.pulseDuration / 2 }),
      ),
      -1,
      true,
    );
  }, [iconScale]);

  const iconPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Press animation
  const pressScale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(0.97, { duration: premiumAnimation.pressDuration });
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withTiming(1, { duration: premiumAnimation.pressDuration });
  }, [pressScale]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePress = useCallback(() => {
    Vibration.vibrate(15);
    onPress();
  }, [onPress]);

  return (
    <Animated.View
      entering={SlideInRight.delay(premiumAnimation.staggerDelay).springify().damping(16)}
      style={pressStyle}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={['#4338CA', '#6366F1', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, { width: buttonWidth, height: buttonHeight }]}
        >
          {/* Mesh dots */}
          {[
            { top: 16, right: 24, s: 5, o: 0.12 },
            { top: 36, right: 70, s: 3, o: 0.08 },
            { top: 24, left: 20, s: 4, o: 0.10 },
            { bottom: 24, right: 40, s: 3, o: 0.09 },
            { bottom: 16, left: 50, s: 5, o: 0.11 },
            { top: 50, left: 35, s: 3, o: 0.07 },
          ].map((d, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: d.top,
                bottom: d.bottom,
                left: d.left,
                right: d.right,
                width: d.s,
                height: d.s,
                borderRadius: d.s / 2,
                backgroundColor: `rgba(255,255,255,${d.o})`,
              }}
            />
          ))}

          {/* Floating particles */}
          <FloatingParticles
            count={5}
            width={buttonWidth}
            height={buttonHeight}
          />

          {/* Scanner icon with glow */}
          <Animated.View style={[styles.iconContainer, iconPulseStyle]}>
            <View style={[styles.iconGlowRing, { width: iconCircleSize + 14, height: iconCircleSize + 14, borderRadius: (iconCircleSize + 14) / 2 }]}>
              <View style={[styles.iconCircle, { width: iconCircleSize, height: iconCircleSize, borderRadius: iconCircleSize / 2 }]}>
                <Icon
                  name="barcode-scan"
                  size={iconSize}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </Animated.View>

          {/* Texts */}
          <Text style={styles.title}>Scanner un article</Text>
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleDot} />
            <Text style={styles.subtitle}>Entrée</Text>
            <View style={styles.subtitleDot} />
            <Text style={styles.subtitle}>Sortie</Text>
            <View style={styles.subtitleDot} />
            <Text style={styles.subtitle}>Consultation</Text>
          </View>

          {/* Shine effect */}
          <ShineEffect width={buttonWidth} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 170,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: premiumSpacing.xl,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconGlowRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  iconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.2,
  },
  subtitleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});

export default ScanButtonXXL;
