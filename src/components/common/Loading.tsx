// ============================================
// LOADING COMPONENT - IT-Inventory Application
// ============================================

import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal, Image } from 'react-native';
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
  messages?: string[];
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({ message, messages }) => {
  const rotatingMessages = useMemo(
    () => (messages && messages.length > 0 ? messages : ['Chargement']),
    [messages],
  );
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length <= 1 || message) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [messages, message, rotatingMessages.length]);

  useEffect(() => {
    setMessageIndex(0);
  }, [rotatingMessages.length]);

  const activeMessage = message || rotatingMessages[messageIndex];

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
  const logoRotate = useSharedValue(0);
  const cardFloatY = useSharedValue(0);

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

    // Subtle logo rotation + glass card float
    logoRotate.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
    );
    cardFloatY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
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

  const logoRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${logoRotate.value}deg` }],
  }));

  const floatingCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardFloatY.value }],
  }));

  return (
    <View style={splashStyles.container}>
      <LinearGradient
        colors={[
          colors.backgroundDark,
          '#123020',
          colors.primaryDark,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={splashStyles.gradient}
      >
        {/* App atmosphere layers (Scan/Mouvements style) */}
        <LinearGradient
          colors={['rgba(16,185,129,0.14)', 'rgba(16,185,129,0.03)', 'transparent']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.8, y: 0.75 }}
          style={splashStyles.atmoTop}
        />
        <LinearGradient
          colors={['rgba(59,130,246,0.10)', 'rgba(59,130,246,0.04)', 'transparent']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.7, y: 0.2 }}
          end={{ x: 0.1, y: 0.9 }}
          style={splashStyles.atmoBottom}
        />

        <LinearGradient
          colors={[
            'rgba(255,255,255,0.02)',
            'rgba(255,255,255,0)',
            'rgba(0,0,0,0.28)',
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={splashStyles.vignetteLayer}
        />

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

          {/* Brand icon card */}
          <Animated.View entering={FadeIn.delay(200).duration(600)} style={[splashStyles.iconWrapper, floatingCardStyle]}>
            <Animated.View style={[splashStyles.rotatingHalo, logoRotateStyle]} />
            <Animated.View style={iconStyle}>
              <LinearGradient
                colors={['rgba(0,92,43,0.98)', 'rgba(0,122,57,0.98)', 'rgba(17,200,118,0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={splashStyles.iconCircle}
              >
                <View style={splashStyles.iconInnerPlate}>
                  <Image
                    source={require('@/assets/images/logo.png')}
                    resizeMode="contain"
                    style={splashStyles.brandLogo}
                  />
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* App name */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <Text style={splashStyles.appName}>IT-Inventory</Text>
            <Text style={splashStyles.appTagline}>Gestion de stock intelligente</Text>
            <View style={splashStyles.statusBadge}>
              <Icon name="shield-check-outline" size={12} color="#8EF0BC" />
              <Text style={splashStyles.statusBadgeText}>Connexion securisee</Text>
            </View>
          </Animated.View>

          {/* Loading indicator */}
          <Animated.View entering={FadeInUp.delay(700).duration(500)} style={splashStyles.loadingSection}>
            {/* Progress bar */}
            <View style={splashStyles.progressTrack}>
              <Animated.View style={[splashStyles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={['#11C876', '#007A39']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={splashStyles.progressGradient}
                />
              </Animated.View>
            </View>

            <View style={splashStyles.progressMetaRow}>
              <Text style={splashStyles.progressMetaText}>Initialisation</Text>
              <Text style={splashStyles.progressMetaText}>En cours</Text>
            </View>

            {/* Message with animated dots */}
            <View style={splashStyles.messageRow}>
              <Text style={splashStyles.loadingMessage}>
                {activeMessage}
              </Text>
              {!message && (!messages || messages.length <= 1) && (
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
          <Text style={splashStyles.footerText}>IT-Inventory Mobile</Text>
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

  // App atmosphere
  atmoTop: {
    position: 'absolute',
    top: -90,
    left: -70,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  atmoBottom: {
    position: 'absolute',
    right: -90,
    bottom: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  vignetteLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  // Floating orbs
  orb1: {
    position: 'absolute',
    top: '10%',
    right: -20,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(0, 122, 57, 0.14)',
  },
  orb2: {
    position: 'absolute',
    bottom: '8%',
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  orb3: {
    position: 'absolute',
    top: '53%',
    left: '18%',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(78, 179, 90, 0.16)',
  },

  // Center
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Rings
  ringsContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.2,
    borderColor: 'rgba(17, 200, 118, 0.24)',
  },

  // Glow
  glowCircle: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(17, 200, 118, 0.16)',
  },

  // Icon
  iconWrapper: {
    marginBottom: 30,
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 15,
  },
  rotatingHalo: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: 'rgba(17, 200, 118, 0.32)',
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
  },
  iconInnerPlate: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  brandLogo: {
    width: 50,
    height: 50,
  },

  // Text
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.9,
    textAlign: 'center',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(148, 163, 184, 0.86)',
    letterSpacing: 1.3,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  statusBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(142, 240, 188, 0.32)',
    backgroundColor: 'rgba(17, 200, 118, 0.12)',
    marginBottom: 42,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#8EF0BC',
    textTransform: 'uppercase',
  },

  // Loading section
  loadingSection: {
    alignItems: 'center',
    width: 230,
  },

  // Progress bar
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressMetaText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(186, 203, 220, 0.65)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Message row
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  loadingMessage: {
    fontSize: 13,
    color: 'rgba(186, 203, 220, 0.72)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(186, 203, 220, 0.72)',
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
    width: 32,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.35)',
    fontWeight: '600',
    letterSpacing: 1.6,
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
