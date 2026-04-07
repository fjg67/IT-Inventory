// ============================================
// NO CONNECTION SCREEN - IT-Inventory Application
// Beautiful offline screen when no internet
// ============================================

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  FadeInDown,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch } from '@/store';
import { setNetworkState, setSupabaseReachable } from '@/store/slices/networkSlice';
import { getSupabaseClient, tables } from '@/api/supabase';

export const NoConnectionScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  // ===== Animations =====
  const iconFloat = useSharedValue(0);
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);
  const waveOffset = useSharedValue(0);
  const retryRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.1);

  useEffect(() => {
    // Floating icon
    iconFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Pulse rings
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    pulse2.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2800, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
    pulse3.value = withDelay(
      1800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2800, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );

    // Wave
    waveOffset.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    // Glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(iconFloat.value, [0, 1], [0, -12]) }],
  }));

  const makePulseStyle = (val: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(val.value, [0, 1], [0.5, 2.5]) }],
      opacity: interpolate(val.value, [0, 0.3, 1], [0.5, 0.25, 0]),
    }));

  const pulse1Style = makePulseStyle(pulse1);
  const pulse2Style = makePulseStyle(pulse2);
  const pulse3Style = makePulseStyle(pulse3);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleRetry = useCallback(async () => {
    // Spin animation
    retryRotation.value = withTiming(retryRotation.value + 360, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    const state = await NetInfo.fetch();
    dispatch(
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      }),
    );

    if (state.isConnected && state.isInternetReachable) {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.from(tables.sites).select('id').limit(1).maybeSingle();
        dispatch(setSupabaseReachable(!error));
      } catch {
        dispatch(setSupabaseReachable(false));
      }
    }
  }, [dispatch, retryRotation]);

  const retryIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${retryRotation.value}deg` }],
  }));

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#0B1120', '#111B33', '#162044']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradient}
      >
        {/* Decorative orbs */}
        <View style={s.orb1} />
        <View style={s.orb2} />
        <View style={s.orb3} />

        {/* Broken signal lines (decoration) */}
        <Animated.View entering={FadeIn.delay(600).duration(1000)} style={s.signalLine1} />
        <Animated.View entering={FadeIn.delay(800).duration(1000)} style={s.signalLine2} />
        <Animated.View entering={FadeIn.delay(1000).duration(1000)} style={s.signalLine3} />

        {/* Center content */}
        <View style={s.centerContent}>
          {/* Pulse rings */}
          <View style={s.pulseContainer}>
            <Animated.View style={[s.pulseRing, pulse1Style]} />
            <Animated.View style={[s.pulseRing, pulse2Style]} />
            <Animated.View style={[s.pulseRing, pulse3Style]} />
          </View>

          {/* Glow */}
          <Animated.View style={[s.glowCircle, glowStyle]} />

          {/* Main icon */}
          <Animated.View entering={FadeIn.delay(200).duration(600)} style={s.iconWrapper}>
            <Animated.View style={iconStyle}>
              <LinearGradient
                colors={['#EF4444', '#F97316', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.iconCircle}
              >
                <Icon name="wifi-off" size={40} color="#FFF" />
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <Text style={s.title}>Connexion perdue</Text>
            <Text style={s.subtitle}>
              Impossible d'accéder à l'application sans connexion internet
            </Text>
          </Animated.View>

          {/* Info cards */}
          <Animated.View entering={FadeInUp.delay(600).duration(600)} style={s.infoCards}>
            <View style={s.infoCard}>
              <View style={s.infoIconBg}>
                <Icon name="wifi-strength-off" size={18} color="#F97316" />
              </View>
              <View style={s.infoTextContainer}>
                <Text style={s.infoTitle}>Vérifiez votre Wi-Fi</Text>
                <Text style={s.infoDesc}>Activez le Wi-Fi ou les données mobiles</Text>
              </View>
            </View>

            <View style={s.cardDivider} />

            <View style={s.infoCard}>
              <View style={[s.infoIconBg, { backgroundColor: 'rgba(0, 122, 57, 0.12)' }]}>
                <Icon name="server-network-off" size={18} color="#007A39" />
              </View>
              <View style={s.infoTextContainer}>
                <Text style={s.infoTitle}>Serveur inaccessible</Text>
                <Text style={s.infoDesc}>Le service peut être temporairement indisponible</Text>
              </View>
            </View>
          </Animated.View>

          {/* Retry button */}
          <Animated.View entering={FadeInDown.delay(800).duration(600)}>
            <TouchableOpacity onPress={handleRetry} activeOpacity={0.8}>
              <LinearGradient
                colors={['#00A651', '#007A39']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.retryButton}
              >
                <Animated.View style={retryIconStyle}>
                  <Icon name="refresh" size={20} color="#FFF" />
                </Animated.View>
                <Text style={s.retryText}>Réessayer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View entering={FadeIn.delay(1000).duration(800)} style={s.footer}>
          <View style={s.footerLine} />
          <Text style={s.footerText}>IT-Inventory</Text>
          <View style={s.footerLine} />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Orbs
  orb1: {
    position: 'absolute',
    top: '10%',
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  orb2: {
    position: 'absolute',
    bottom: '15%',
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
  },
  orb3: {
    position: 'absolute',
    top: '45%',
    left: '10%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 57, 0.06)',
  },

  // Signal lines (decorative broken lines)
  signalLine1: {
    position: 'absolute',
    top: '18%',
    left: '8%',
    width: 40,
    height: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 1,
    transform: [{ rotate: '-30deg' }],
  },
  signalLine2: {
    position: 'absolute',
    top: '22%',
    right: '12%',
    width: 25,
    height: 2,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  signalLine3: {
    position: 'absolute',
    bottom: '25%',
    right: '8%',
    width: 35,
    height: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 1,
    transform: [{ rotate: '-15deg' }],
  },

  // Pulse
  pulseContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },

  // Glow
  glowCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },

  // Icon
  iconWrapper: {
    marginBottom: 32,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 15,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Center content
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Text
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(148, 163, 184, 0.7)',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
    maxWidth: 280,
  },

  // Info cards
  infoCards: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(148, 163, 184, 0.5)',
    lineHeight: 15,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },

  // Retry button
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
