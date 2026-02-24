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

const { width: SW, height: SH } = Dimensions.get('window');

// ===== PALETTE — Light =====
const INDIGO = '#4F46E5';
const VIOLET = '#7C3AED';
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
    delay: 300 + Math.random() * 300,
    color: [INDIGO, VIOLET, BLUE, CYAN, EMERALD, '#A78BFA'][Math.floor(Math.random() * 6)],
  };
});

// ===== RING SEEDS =====
const NUM_RINGS = 3;
const RING_SEEDS = Array.from({ length: NUM_RINGS }, (_, i) => ({
  delay: 200 + i * 200,
  maxScale: 3.2 + i * 1.6,
  borderWidth: 2 - i * 0.4,
}));

// ===== CONFETTI SEEDS =====
const NUM_CONFETTI = 12;
const CONFETTI_SEEDS = Array.from({ length: NUM_CONFETTI }, (_, i) => ({
  startX: (Math.random() - 0.5) * SW * 0.8,
  targetY: -(80 + Math.random() * 200),
  driftX: (Math.random() - 0.5) * 100,
  size: 6 + Math.random() * 4,
  delay: 400 + Math.random() * 400,
  rotation: Math.random() * 360,
  color: [INDIGO, VIOLET, BLUE, CYAN, EMERALD, '#F59E0B', '#EC4899'][Math.floor(Math.random() * 7)],
  isSquare: Math.random() > 0.5,
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
    const d = 850 + index * 50;
    translateY.value = withDelay(d, withSpring(0, { damping: 12, stiffness: 110 }));
    opacity.value = withDelay(d, withTiming(1, { duration: 200 }));
    scale.value = withDelay(d, withSpring(1, { damping: 9, stiffness: 130 }));
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
      withTiming(seed.targetX, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      seed.delay,
      withTiming(seed.targetY, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(
      seed.delay,
      withSequence(
        withTiming(0.9, { duration: 120 }),
        withDelay(350, withTiming(0, { duration: 300 })),
      ),
    );
    scale.value = withDelay(
      seed.delay,
      withSequence(
        withSpring(1.3, { damping: 5 }),
        withDelay(250, withTiming(0, { duration: 250 })),
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

// ===== CONFETTI COMPONENT =====
const Confetti: React.FC<{
  seed: (typeof CONFETTI_SEEDS)[0];
  trigger: boolean;
}> = ({ seed, trigger }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!trigger) {
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 0;
      rotate.value = 0;
      return;
    }
    translateX.value = withDelay(
      seed.delay,
      withTiming(seed.driftX, { duration: 1200, easing: Easing.out(Easing.quad) }),
    );
    translateY.value = withDelay(
      seed.delay,
      withTiming(seed.targetY, { duration: 1200, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withDelay(
      seed.delay,
      withSequence(
        withTiming(0.8, { duration: 150 }),
        withDelay(600, withTiming(0, { duration: 400 })),
      ),
    );
    rotate.value = withDelay(
      seed.delay,
      withTiming(seed.rotation, { duration: 1200 }),
    );
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: SW / 2 + seed.startX,
    top: SH * 0.45,
    width: seed.size,
    height: seed.isSquare ? seed.size : seed.size * 0.5,
    borderRadius: seed.isSquare ? 2 : seed.size,
    backgroundColor: seed.color,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
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
      withTiming(seed.maxScale, { duration: 1100, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(
      seed.delay,
      withSequence(
        withTiming(0.4, { duration: 200 }),
        withTiming(0, { duration: 900 }),
      ),
    );
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: seed.borderWidth,
    borderColor: 'rgba(79, 70, 229, 0.3)',
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
  const overlayOpacity = useSharedValue(1);

  const triggerComplete = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  const welcomeText = 'Bienvenue !';

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
      overlayOpacity.value = 1;
      return;
    }

    // Phase 1 — White background sweep
    bgProgress.value = withTiming(1, {
      duration: 350,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    // Phase 2 — Shield icon
    Vibration.vibrate([0, 15, 80, 15]);
    shieldScale.value = withDelay(
      150,
      withSpring(1, { damping: 11, stiffness: 130 }),
    );
    shieldRotate.value = withDelay(
      150,
      withSpring(0, { damping: 14 }),
    );

    // Phase 3 — Morph → check
    morphProgress.value = withDelay(
      550,
      withTiming(1, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );

    // Glow
    glowScale.value = withDelay(
      450,
      withSequence(
        withSpring(1.6, { damping: 8 }),
        withTiming(1.2, { duration: 600 }),
      ),
    );
    glowOpacity.value = withDelay(
      450,
      withSequence(
        withTiming(0.35, { duration: 200 }),
        withTiming(0.08, { duration: 800 }),
      ),
    );

    // Phase 4 — Text
    subtitleY.value = withDelay(700, withSpring(0, { damping: 16 }));
    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: 250 }));

    dividerWidth.value = withDelay(
      1150,
      withTiming(1, { duration: 450, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );

    userY.value = withDelay(1250, withSpring(0, { damping: 16 }));
    userOpacity.value = withDelay(1250, withTiming(1, { duration: 250 }));

    // Phase 5 — Fade out
    overlayOpacity.value = withDelay(
      2600,
      withTiming(0, { duration: 500 }, (finished) => {
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

        {/* Confetti */}
        {CONFETTI_SEEDS.map((seed, i) => (
          <Confetti key={i} seed={seed} trigger={visible} />
        ))}

        {/* Central content */}
        <View style={styles.centerContent}>
          {/* Glow orb */}
          <Animated.View style={[styles.glowOrb, glowStyle]} />

          {/* Icon — shield → check */}
          <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
            <LinearGradient
              colors={['#4F46E5', '#6366F1', '#818CF8']}
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
          <Animated.View style={userStyle}>
            <View style={styles.userBadge}>
              <Icon name="account-circle-outline" size={18} color="#4F46E5" />
              <Text style={styles.userText}>{userName}</Text>
            </View>
          </Animated.View>
        </View>
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
    top: -25,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#EEF2FF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 28,
    shadowColor: '#4F46E5',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  letterChar: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  divider: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#E0E7FF',
    marginBottom: 18,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: 8,
  },
  userText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.3,
  },
});

export default SuccessOverlay;
