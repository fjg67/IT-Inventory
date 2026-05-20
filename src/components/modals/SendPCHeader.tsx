import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

export const SendPCHeader: React.FC = () => {
  const pulse = useSharedValue(1);
  const iconScale = useSharedValue(0.8);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    iconScale.value = withSpring(1, { damping: 10, stiffness: 160 });

    return () => {
      cancelAnimation(pulse);
      cancelAnimation(iconScale);
    };
  }, [iconScale, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.02)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.glowOrb} />

      <Animated.View entering={FadeIn.delay(100).duration(220)} style={styles.badge}>
        <Animated.View style={[styles.badgeDot, dotStyle]} />
        <Text style={styles.badgeText}>ACTION DE SORTIE</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(50).duration(180)} style={[styles.iconBox, iconStyle]}>
        <Icon name="send-outline" size={24} color={OBSIDIAN_COLORS.danger} />
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(150).duration(280)} style={styles.title}>
        Envoyer ce PC ?
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(250).duration(280)} style={styles.subtitle}>
        Le poste sera retire du parc actif et conserve dans la base de donnees.
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    position: 'absolute',
    right: -24,
    top: -14,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OBSIDIAN_COLORS.danger,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: OBSIDIAN_COLORS.danger,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 10,
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 13,
    lineHeight: 20,
  },
});
