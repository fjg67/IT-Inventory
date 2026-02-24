// ============================================
// LOADING COMPONENT - IT-Inventory Application
// ============================================

import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

interface LoadingProps {
  visible?: boolean;
  message?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({
  visible = true,
  message,
  overlay = false,
  size = 'large',
}) => {
  if (!visible) return null;

  const content = (
    <View style={overlay ? styles.overlayContainer : styles.inlineContainer}>
      <View style={overlay ? styles.overlayContent : undefined}>
        <ActivityIndicator size={size} color={colors.primary} />
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        {content}
      </Modal>
    );
  }

  return content;
};

interface FullScreenLoadingProps {
  message?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({ message }) => {
  // ===== Animations =====
  const iconPulse = useSharedValue(1);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.15);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Icon breathing
    iconPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Glow breathing
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Expanding rings
    ring1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    ring2.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
    ring3.value = withDelay(
      1600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );

    // Dots animation
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withDelay(600, withTiming(0, { duration: 0 })),
      ),
      -1,
    );
    dot2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withDelay(600, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
    dot3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withDelay(600, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );

    // Progress bar
    progressWidth.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const makeRingStyle = (ringVal: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(ringVal.value, [0, 1], [0.6, 2.2]) }],
      opacity: interpolate(ringVal.value, [0, 0.3, 1], [0.4, 0.2, 0]),
    }));

  const ring1Style = makeRingStyle(ring1);
  const ring2Style = makeRingStyle(ring2);
  const ring3Style = makeRingStyle(ring3);

  const makeDotStyle = (dotVal: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      transform: [{ translateY: interpolate(dotVal.value, [0, 1], [0, -6]) }],
      opacity: interpolate(dotVal.value, [0, 1], [0.3, 1]),
    }));

  const dot1Style = makeDotStyle(dot1);
  const dot2Style = makeDotStyle(dot2);
  const dot3Style = makeDotStyle(dot3);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressWidth.value, [0, 1], [0, 100])}%` as any,
  }));

  return (
    <View style={splashStyles.container}>
      <LinearGradient
        colors={['#0B1120', '#111B33', '#162044']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={splashStyles.gradient}
      >
        {/* Floating decorative orbs */}
        <View style={splashStyles.orb1} />
        <View style={splashStyles.orb2} />
        <View style={splashStyles.orb3} />

        {/* Center content */}
        <View style={splashStyles.centerContent}>
          {/* Ripple rings */}
          <View style={splashStyles.ringsContainer}>
            <Animated.View style={[splashStyles.ring, ring1Style]} />
            <Animated.View style={[splashStyles.ring, ring2Style]} />
            <Animated.View style={[splashStyles.ring, ring3Style]} />
          </View>

          {/* Glow */}
          <Animated.View style={[splashStyles.glowCircle, glowStyle]} />

          {/* Icon */}
          <Animated.View entering={FadeIn.delay(200).duration(600)} style={splashStyles.iconWrapper}>
            <Animated.View style={iconStyle}>
              <LinearGradient
                colors={['#3B82F6', '#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={splashStyles.iconCircle}
              >
                <Icon name="cube-scan" size={38} color="#FFF" />
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* App name */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <Text style={splashStyles.appName}>StockPro</Text>
            <Text style={splashStyles.appTagline}>Gestion de stock intelligente</Text>
          </Animated.View>

          {/* Loading indicator */}
          <Animated.View entering={FadeInUp.delay(700).duration(500)} style={splashStyles.loadingSection}>
            {/* Progress bar */}
            <View style={splashStyles.progressTrack}>
              <Animated.View style={[splashStyles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={['#3B82F6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={splashStyles.progressGradient}
                />
              </Animated.View>
            </View>

            {/* Message with animated dots */}
            <View style={splashStyles.messageRow}>
              <Text style={splashStyles.loadingMessage}>
                {message || 'Chargement'}
              </Text>
              {!message && (
                <View style={splashStyles.dotsRow}>
                  <Animated.View style={[splashStyles.dot, dot1Style]} />
                  <Animated.View style={[splashStyles.dot, dot2Style]} />
                  <Animated.View style={[splashStyles.dot, dot3Style]} />
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Bottom watermark */}
        <Animated.View entering={FadeIn.delay(1000).duration(800)} style={splashStyles.footer}>
          <View style={splashStyles.footerLine} />
          <Text style={splashStyles.footerText}>IT-Inventory</Text>
          <View style={splashStyles.footerLine} />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

// ==================== SPLASH LOADING STYLES ====================
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Floating orbs
  orb1: {
    position: 'absolute',
    top: '12%',
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  orb2: {
    position: 'absolute',
    bottom: '18%',
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  orb3: {
    position: 'absolute',
    top: '40%',
    left: '15%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },

  // Center
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Rings
  ringsContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },

  // Glow
  glowCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },

  // Icon
  iconWrapper: {
    marginBottom: 32,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(148, 163, 184, 0.7)',
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 48,
  },

  // Loading section
  loadingSection: {
    alignItems: 'center',
    width: 200,
  },

  // Progress bar
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },

  // Message row
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  loadingMessage: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.6)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(148, 163, 184, 0.6)',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLine: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.25)',
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

// ==================== INLINE/OVERLAY LOADING STYLES ====================
const styles = StyleSheet.create({
  inlineContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 150,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default Loading;
