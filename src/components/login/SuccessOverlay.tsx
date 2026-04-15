// ============================================
// SUCCESS OVERLAY — Animation premium post-login
// IT-Inventory Application — Light mode
// Morphing shield → radial burst → stagger reveal
// ============================================

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  Vibration,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SW } = Dimensions.get('window');

// ===== PALETTE — Light =====
const INDIGO = '#007A39';
const VIOLET = '#005C2B';
const BLUE = '#3B82F6';
const CYAN = '#06B6D4';
const EMERALD = '#10B981';

// ===== SPARK SEEDS =====
const NUM_SPARKS = 18;
const SPARK_SEEDS = Array.from({ length: NUM_SPARKS }, (_, i) => {
  const angle = (i / NUM_SPARKS) * Math.PI * 2;
  const radius = 90 + Math.random() * 130;
  return {
    targetX: Math.cos(angle) * radius,
    targetY: Math.sin(angle) * radius,
    size: 4 + Math.random() * 6,
    delay: 180 + Math.random() * 240,
    color: [INDIGO, VIOLET, BLUE, CYAN, EMERALD, '#A78BFA'][Math.floor(Math.random() * 6)],
  };
});

// ===== RING SEEDS =====
const NUM_RINGS = 3;
const RING_SEEDS = Array.from({ length: NUM_RINGS }, (_, i) => ({
  delay: 120 + i * 130,
  maxScale: 2.8 + i * 1.2,
  borderWidth: 1.8 - i * 0.35,
}));

// ===== LETTER ANIMATION =====
const AnimatedLetter: React.FC<{
  char: string;
  index: number;
  trigger: boolean;
}> = ({ char, index, trigger }) => {
  const translateY = useSharedValue(28);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (!trigger) {
      translateY.value = 28;
      opacity.value = 0;
      scale.value = 0.5;
      return;
    }
    const d = 560 + index * 36;
    translateY.value = withDelay(d, withSpring(0, { damping: 13, stiffness: 150 }));
    opacity.value = withDelay(d, withTiming(1, { duration: 170 }));
    scale.value = withDelay(d, withSpring(1, { damping: 10, stiffness: 160 }));
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.letterChar, style]}>
      {char === ' ' ? '  ' : char}
    </Animated.Text>
  );
};

// ===== SPARK COMPONENT =====
const Spark: React.FC<{
  seed: (typeof SPARK_SEEDS)[0];
  trigger: boolean;
}> = ({ seed, trigger }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (!trigger) {
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0;
      return;
    }
    translateX.value = withDelay(
      seed.delay,
      withTiming(seed.targetX, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      seed.delay,
      withTiming(seed.targetY, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(
      seed.delay,
      withSequence(
        withTiming(0.9, { duration: 90 }),
        withDelay(220, withTiming(0, { duration: 220 })),
      ),
    );
    scale.value = withDelay(
      seed.delay,
      withSequence(
        withSpring(1.25, { damping: 6, stiffness: 170 }),
        withDelay(170, withTiming(0, { duration: 180 })),
      ),
    );
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: seed.size,
    height: seed.size,
    borderRadius: seed.size / 2,
    backgroundColor: seed.color,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
    shadowColor: seed.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  }));

  return <Animated.View style={style} />;
};

// ===== EXPANDING RING =====
const ExpandingRing: React.FC<{
  seed: (typeof RING_SEEDS)[0];
  trigger: boolean;
}> = ({ seed, trigger }) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!trigger) {
      scale.value = 0.3;
      opacity.value = 0;
      return;
    }
    scale.value = withDelay(
      seed.delay,
      withTiming(seed.maxScale, { duration: 780, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(
      seed.delay,
      withSequence(
        withTiming(0.34, { duration: 140 }),
        withTiming(0, { duration: 640 }),
      ),
    );
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: seed.borderWidth,
    borderColor: 'rgba(0, 122, 57, 0.24)',
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
};

// ===== PROPS =====
interface SuccessOverlayProps {
  visible: boolean;
  userName: string;
  onAnimationComplete: () => void;
}

// ===== MAIN COMPONENT =====
export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
  visible,
  userName,
  onAnimationComplete,
}) => {
  const bgProgress = useSharedValue(0);
  const shieldScale = useSharedValue(0);
  const shieldRotate = useSharedValue(-12);
  const morphProgress = useSharedValue(0);
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const dividerWidth = useSharedValue(0);
  const userY = useSharedValue(16);
  const userOpacity = useSharedValue(0);
  const panelScale = useSharedValue(0.9);
  const panelLift = useSharedValue(22);
  const panelOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  const triggerComplete = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  const welcomeText = 'Bienvenue';
  const cleanUserName = userName?.trim();
  const showUserBadge = Boolean(cleanUserName && !/^technicien$/i.test(cleanUserName));

  useEffect(() => {
    if (!visible) {
      bgProgress.value = 0;
      shieldScale.value = 0;
      shieldRotate.value = -12;
      morphProgress.value = 0;
      glowScale.value = 0;
      glowOpacity.value = 0;
      subtitleY.value = 20;
      subtitleOpacity.value = 0;
      dividerWidth.value = 0;
      userY.value = 16;
      userOpacity.value = 0;
      panelScale.value = 0.9;
      panelLift.value = 22;
      panelOpacity.value = 0;
      overlayOpacity.value = 1;
      return;
    }

    // Phase 1 — White background sweep
    bgProgress.value = withTiming(1, {
      duration: 220,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    // Phase 2 — Shield icon
    Vibration.vibrate([0, 12, 40, 10]);
    shieldScale.value = withDelay(
      70,
      withSpring(1, { damping: 11, stiffness: 150 }),
    );
    shieldRotate.value = withDelay(
      70,
      withSpring(0, { damping: 15, stiffness: 130 }),
    );

    // Phase 3 — Morph → check
    morphProgress.value = withDelay(
      260,
      withTiming(1, { duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );

    // Glow
    glowScale.value = withDelay(
      220,
      withSequence(
        withSpring(1.5, { damping: 9, stiffness: 120 }),
        withTiming(1.15, { duration: 420 }),
      ),
    );
    glowOpacity.value = withDelay(
      220,
      withSequence(
        withTiming(0.28, { duration: 140 }),
        withTiming(0.05, { duration: 620 }),
      ),
    );

    panelScale.value = withDelay(90, withSpring(1, { damping: 14, stiffness: 140 }));
    panelLift.value = withDelay(90, withSpring(0, { damping: 16, stiffness: 150 }));
    panelOpacity.value = withDelay(90, withTiming(1, { duration: 220 }));

    // Phase 4 — Text
    subtitleY.value = withDelay(420, withSpring(0, { damping: 17, stiffness: 140 }));
    subtitleOpacity.value = withDelay(420, withTiming(1, { duration: 180 }));

    dividerWidth.value = withDelay(
      760,
      withTiming(1, { duration: 260, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );

    userY.value = withDelay(860, withSpring(0, { damping: 16, stiffness: 140 }));
    userOpacity.value = withDelay(860, withTiming(1, { duration: 180 }));

    // Phase 5 — Fade out
    overlayOpacity.value = withDelay(
      1900,
      withTiming(0, { duration: 340 }, (finished) => {
        if (finished) {
          runOnJS(triggerComplete)();
        }
      }),
    );
  }, [visible]);

  // ===== Animated styles =====
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bgProgress.value,
      [0, 1],
      ['rgba(248, 250, 253, 0)', 'rgba(248, 250, 253, 0.98)'],
    ),
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: shieldScale.value },
      { rotate: `${shieldRotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const shieldOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(morphProgress.value, [0, 0.4, 0.6], [1, 1, 0]),
  }));

  const checkOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(morphProgress.value, [0.4, 0.7, 1], [0, 0.5, 1]),
    transform: [{ scale: interpolate(morphProgress.value, [0.4, 1], [0.5, 1]) }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: subtitleY.value }],
    opacity: subtitleOpacity.value,
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    width: interpolate(dividerWidth.value, [0, 1], [0, 100]),
    opacity: dividerWidth.value,
  }));

  const userStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: userY.value }],
    opacity: userOpacity.value,
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: panelScale.value }, { translateY: panelLift.value }],
    opacity: panelOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, fadeStyle]}>
        {/* Background */}
        <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} />

        {/* Expanding rings */}
        <View style={styles.ringsContainer}>
          {RING_SEEDS.map((seed, i) => (
            <ExpandingRing key={i} seed={seed} trigger={visible} />
          ))}
        </View>

        {/* Spark particles */}
        <View style={styles.sparksContainer}>
          {SPARK_SEEDS.map((seed, i) => (
            <Spark key={i} seed={seed} trigger={visible} />
          ))}
        </View>

        {/* Central content */}
        <Animated.View style={[styles.centerPanel, panelStyle]}>
          <View style={styles.centerContent}>
          {/* Glow orb */}
          <Animated.View style={[styles.glowOrb, glowStyle]} />

          {/* Icon — shield → check */}
          <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
            <LinearGradient
              colors={['#005C2B', '#007A39', '#4EB35A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Animated.View style={[styles.morphLayer, shieldOpacity]}>
                <Icon name="shield-check-outline" size={44} color="#FFF" />
              </Animated.View>
              <Animated.View style={[styles.morphLayer, checkOpacity]}>
                <Icon name="check-bold" size={48} color="#FFF" />
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* "Connexion réussie" */}
          <Animated.View style={subtitleStyle}>
            <Text style={styles.subtitleText}>Connexion réussie</Text>
          </Animated.View>

          {/* Staggered "Bienvenue !" */}
          <View style={styles.letterRow}>
            {welcomeText.split('').map((char, i) => (
              <AnimatedLetter key={i} char={char} index={i} trigger={visible} />
            ))}
          </View>

          {/* Divider */}
          <Animated.View style={[styles.divider, dividerStyle]} />

          {/* User badge */}
          {showUserBadge ? (
            <Animated.View style={userStyle}>
              <View style={styles.userBadge}>
                <Icon name="account-circle-outline" size={18} color="#007A39" />
                <Text style={styles.userText}>{cleanUserName}</Text>
              </View>
            </Animated.View>
          ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ===== STYLES =====
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringsContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPanel: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,57,0.14)',
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: 28,
    shadowColor: '#0B1B12',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 26,
    elevation: 16,
  },
  sparksContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  glowOrb: {
    position: 'absolute',
    top: -18,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#E8F5E9',
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 36,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 24,
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 14,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  morphLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#007A39',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  letterChar: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.4,
  },
  divider: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#C8E6C9',
    marginBottom: 10,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 8,
  },
  userText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007A39',
    letterSpacing: 0.3,
  },
});

export default SuccessOverlay;
