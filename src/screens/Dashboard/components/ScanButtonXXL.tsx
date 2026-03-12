import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumSpacing,
  premiumAnimation,
} from '../../../constants/premiumTheme';

interface ScanButtonXXLProps {
  onPress: () => void;
}

const ScanButtonXXL: React.FC<ScanButtonXXLProps> = ({ onPress }) => {
  // Scan line animation
  const scanLineAnim = useSharedValue(0);
  useEffect(() => {
    scanLineAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [scanLineAnim]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: interpolate(scanLineAnim.value, [0, 1], [8, 38]),
    opacity: interpolate(scanLineAnim.value, [0, 0.5, 1], [0.4, 1, 0.4]),
  }));

  // Glow pulse
  const glowAnim = useSharedValue(0);
  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [glowAnim]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.15, 0.4]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [1, 1.12]) }],
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
    <Animated.View style={pressStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.outerWrap}>
          {/* Animated glow behind card */}
          <Animated.View style={[styles.outerGlow, glowStyle]} />

          <LinearGradient
            colors={['#4338CA', '#6366F1', '#818CF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
          >
            {/* Glass overlay */}
            <View style={styles.glassOverlay} />

            {/* Decorative circles */}
            <View style={styles.decoCircle1} />
            <View style={styles.decoCircle2} />

            {/* Left icon */}
            <View style={styles.iconSection}>
              <View style={styles.iconContainer}>
                <View style={styles.barcodeLines}>
                  {[6, 4, 7, 3, 6, 4, 7, 5, 3].map((h, i) => (
                    <View
                      key={i}
                      style={[styles.barcodeLine, { height: h * 2.8, opacity: 0.7 + (i % 2) * 0.3 }]}
                    />
                  ))}
                </View>
                <Animated.View style={[styles.scanLine, scanLineStyle]} />
              </View>
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <Text style={styles.title}>Scanner un article</Text>
              <View style={styles.tagsRow}>
                {[
                  { label: 'Entrée', icon: 'arrow-up-bold' },
                  { label: 'Sortie', icon: 'arrow-down-bold' },
                  { label: 'Consultation', icon: 'eye-outline' },
                ].map((tag) => (
                  <View key={tag.label} style={styles.tag}>
                    <Icon name={tag.icon} size={9} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.tagText}>{tag.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right arrow */}
            <View style={styles.arrowCircle}>
              <Icon name="chevron-right" size={20} color="#6366F1" />
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    marginBottom: premiumSpacing.lg,
    position: 'relative',
  },
  outerGlow: {
    position: 'absolute',
    top: 4,
    left: 8,
    right: 8,
    bottom: -4,
    borderRadius: 24,
    backgroundColor: '#6366F1',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 16,
    overflow: 'hidden',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decoCircle1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -40,
    left: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  iconSection: {
    position: 'relative',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  barcodeLine: {
    width: 2.2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  scanLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#FCA5A5',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  contentSection: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
    color: '#FFF',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.92)',
  },
  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default ScanButtonXXL;
