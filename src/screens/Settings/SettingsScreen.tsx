// ============================================
// SETTINGS SCREEN - Premium Design
// IT-Inventory Application
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  StatusBar,
  Modal,
  RefreshControl,
  Vibration,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@/store';
import { logoutTechnicien, setRedirectToTechnicianChoiceAfterLogout, selectIsSuperviseur, selectCurrentRole } from '@/store/slices/authSlice';
import { selectSite } from '@/store/slices/siteSlice';
import { APP_CONFIG } from '@/constants';
import { useResponsive } from '@/utils/responsive';
import { toAbbreviation } from '@/utils/abbreviation';
import { useTheme } from '@/theme';
import type { ThemeMode } from '@/theme';
import { InventoryRecountService, InventoryRecount } from '@/services/inventoryRecountService';
import { AuthService } from '@/services/authService';
import { BiometricAuthService } from '@/services/biometricAuthService';
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { ToastContainer, useToast } from '@/components/common';

// ==================== HELPERS ====================
const AVATAR_GRADIENTS: [string, string][] = [
  ['#3B82F6', '#2563EB'],
  ['#00A651', '#007A39'],
  ['#EC4899', '#F472B6'],
  ['#10B981', '#34D399'],
  ['#F59E0B', '#FBBF24'],
  ['#06B6D4', '#22D3EE'],
  ['#EF4444', '#F87171'],
  ['#14B8A6', '#2DD4BF'],
];

const getAvatarGradient = (id: string | number | undefined): [string, string] => {
  if (id == null) return AVATAR_GRADIENTS[0];
  const n = typeof id === 'number' ? Math.abs(id) : [...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
};

// Site visual config
const SITE_VISUALS: Record<string, { icon: string; gradient: [string, string]; emoji: string }> = {
  'Stock 5ième': { icon: 'office-building', gradient: ['#3B82F6', '#2563EB'], emoji: '5' },
  'Stock 8ième': { icon: 'office-building-marker', gradient: ['#005C2B', '#007A39'], emoji: '8' },
  'Stock Epinal': { icon: 'warehouse', gradient: ['#10B981', '#059669'], emoji: 'E' },
};

const getSiteVisual = (nom: string) => {
  return SITE_VISUALS[nom] || { icon: 'map-marker', gradient: ['#6B7280', '#4B5563'] as [string, string], emoji: '?' };
};

const DEFAULT_LOGIN_IDENTIFIER = 'technicien';
const MASTER_PASSWORD = '!*A1Z2E3R4T5!';

const HamsterMascot: React.FC<{
  accentColor: string;
  mood: 'happy' | 'calm' | 'alert';
  isSuperviseur: boolean;
  isSpeaking: boolean;
}> = ({ accentColor, mood, isSuperviseur, isSpeaking }) => {
  const blink = useSharedValue(1);
  const armSwing = useSharedValue(0);
  const legStep = useSharedValue(0);
  const bob = useSharedValue(0);
  const speechMouth = useSharedValue(0);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0.12, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );

    armSwing.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 650, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 650, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    legStep.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 850, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [armSwing, blink, bob, legStep]);

  const eyeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  const bodyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -2 * bob.value }],
  }));

  const leftArmAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-22 + armSwing.value * 14}deg` }],
  }));

  const rightArmAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${22 - armSwing.value * 14}deg` }],
  }));

  const leftLegAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-8 - legStep.value * 10}deg` }],
  }));

  const rightLegAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${8 + legStep.value * 10}deg` }],
  }));

  useEffect(() => {
    if (!isSpeaking) {
      speechMouth.value = withTiming(0, { duration: 120 });
      return;
    }

    speechMouth.value = withSequence(
      withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0.2, { duration: 80, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 100, easing: Easing.in(Easing.quad) }),
      withTiming(0.9, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) }),
    );
  }, [isSpeaking, speechMouth]);

  const lowerBeakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: speechMouth.value * 1.8 }],
  }));

  const mouthAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.5 + speechMouth.value * 1.8 }],
    opacity: 0.35 + speechMouth.value * 0.65,
  }));

  const beakColor = mood === 'alert' ? '#EF4444' : '#FF6D3B';
  const crownColor = mood === 'alert' ? '#EF4444' : '#007A39';

  return (
    <View style={headerStyles.mascotContainer}>
      {isSuperviseur && (
        <>
          <View style={headerStyles.mascotCapTop} />
          <View style={headerStyles.mascotCapBrim} />
        </>
      )}

      <Animated.View style={[headerStyles.mascotCharacter, bodyAnimatedStyle]}>
        {/* Tufts verts CA — couronne de la cigogne d'Alsace */}
        <View style={[headerStyles.storkTuftL, { backgroundColor: crownColor }]} />
        <View style={[headerStyles.storkTuftM, { backgroundColor: crownColor }]} />
        <View style={[headerStyles.storkTuftR, { backgroundColor: crownColor }]} />

        <View style={headerStyles.mascotBody}>
          <Animated.View style={[headerStyles.mascotArm, headerStyles.mascotArmLeft, leftArmAnimatedStyle]} />
          <Animated.View style={[headerStyles.mascotArm, headerStyles.mascotArmRight, rightArmAnimatedStyle]} />

          {/* Tête blanche de la cigogne */}
          <View style={headerStyles.storkHead}>
            <View style={headerStyles.storkEyeRow}>
              <Animated.View style={[headerStyles.storkEye, eyeAnimatedStyle]} />
              <Animated.View style={[headerStyles.storkEye, eyeAnimatedStyle]} />
            </View>
            {/* Bec — mandibule sup */}
            <View style={[headerStyles.storkBeakUpper, { backgroundColor: beakColor }]} />
            <Animated.View style={[headerStyles.storkMouthCore, mouthAnimatedStyle]} />
            {/* Bec — mandibule inf */}
            <Animated.View style={[headerStyles.storkBeakLower, { backgroundColor: beakColor }, lowerBeakAnimatedStyle]} />
          </View>

          <View style={[headerStyles.mascotBelly, { borderColor: accentColor }]} />
        </View>

        <View style={headerStyles.mascotLegRow}>
          <Animated.View style={[headerStyles.mascotLeg, leftLegAnimatedStyle]}>
            <View style={headerStyles.mascotFoot} />
          </Animated.View>
          <Animated.View style={[headerStyles.mascotLeg, rightLegAnimatedStyle]}>
            <View style={headerStyles.mascotFoot} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

// ==================== SETTINGS HEADER BANNER ====================
const SettingsHeaderBanner: React.FC<{
  initials: string;
  technicien: any;
  lastRecount: InventoryRecount | null;
  avatarGradient: [string, string] | string[];
  isDark: boolean;
}> = ({ initials, technicien, lastRecount, avatarGradient, isDark }) => {
  const { colors } = useTheme();

  const mascot = { emoji: '🦢', name: 'Clara la Cigogne' };
  const daysSinceRecount = lastRecount
    ? Math.floor((Date.now() - new Date(lastRecount.recountDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const mood = (() => {
    if (daysSinceRecount == null) {
      return {
        key: 'alert' as const,
        title: 'Mode Alerte Inventaire',
        subtitle: 'Clara cherche encore le dernier inventaire complet.',
        chip: '🟠 Alerte douce',
        speeches: [
          'On fait un point stock ensemble ?',
          'Je n ai pas trouve le dernier recomptage.',
          'Un scan rapide et on repart propre.',
        ],
      };
    }
    if (daysSinceRecount <= 2) {
      return {
        key: 'happy' as const,
        title: 'Stock Au Top',
        subtitle: 'Clara est fiere: inventaire recent et reserve bien surveillee.',
        chip: '🟢 Bravo team',
        speeches: [
          'Top, le stock est nickel !',
          'Rien a signaler, on garde le rythme.',
          'Equipe efficace, bravo !',
        ],
      };
    }
    if (daysSinceRecount <= 7) {
      return {
        key: 'calm' as const,
        title: 'Stock Sous Controle',
        subtitle: 'Clara garde le cap, pense juste au prochain recomptage.',
        chip: '🔵 Mode calme',
        speeches: [
          'Tout va bien, on reste regulier.',
          'Pense au prochain mini-controle.',
          'Je veille sur tes mouvements.',
        ],
      };
    }
    return {
      key: 'alert' as const,
      title: 'Inventaire A Rafraichir',
      subtitle: 'Clara te souffle: un petit recomptage ferait du bien.',
      chip: '🟠 Alerte douce',
      speeches: [
        'On est proche d un ecart de stock.',
        'Un recomptage maintenant evite les surprises.',
        'Je te guide, on le fait en 2 minutes.',
      ],
    };
  })();

  const [speechIndex, setSpeechIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(true);

  useEffect(() => {
    setSpeechIndex(0);
    setIsSpeaking(true);

    let speechOffTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      setIsSpeaking(false);
    }, 1100);

    const timer = setInterval(() => {
      setSpeechIndex((prev) => (prev + 1) % mood.speeches.length);
      setIsSpeaking(true);

      if (speechOffTimeout) clearTimeout(speechOffTimeout);
      speechOffTimeout = setTimeout(() => {
        setIsSpeaking(false);
      }, 1100);
    }, 3300);

    return () => {
      clearInterval(timer);
      if (speechOffTimeout) clearTimeout(speechOffTimeout);
    };
  }, [mood.key, mood.speeches.length]);

  return (
    <Animated.View entering={FadeInDown.duration(500).springify()}>
      <View style={[headerStyles.header, {
        backgroundColor: colors.surface,
        borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
      }]}>
        <LinearGradient
          colors={isDark ? ['rgba(0,122,57,0.14)', 'rgba(0,122,57,0.02)'] : ['rgba(0,122,57,0.10)', 'rgba(0,122,57,0.00)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={headerStyles.headerGlow}
        />
        <View style={[headerStyles.decorBubble, headerStyles.decorBubbleTop, { backgroundColor: isDark ? 'rgba(0,122,57,0.22)' : 'rgba(0,122,57,0.10)' }]} />
        <View style={[headerStyles.decorBubble, headerStyles.decorBubbleBottom, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : 'rgba(16,185,129,0.08)' }]} />

        {/* Left accent bar */}
        <LinearGradient
          colors={['#00A651', '#007A39']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={headerStyles.accentBar}
        />

        {/* Avatar */}
        <View style={headerStyles.avatarWrap}>
          <View style={headerStyles.avatarShadow}>
            <LinearGradient
              colors={avatarGradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={headerStyles.avatar}
            >
              <View style={headerStyles.avatarInner}>
                <HamsterMascot
                  accentColor={(avatarGradient as [string, string])[0]}
                  mood={mood.key}
                  isSuperviseur={technicien?.role === 'superviseur'}
                  isSpeaking={isSpeaking}
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={[headerStyles.mascotChip, { backgroundColor: isDark ? 'rgba(0,122,57,0.18)' : 'rgba(0,122,57,0.10)' }]}>
          <Text style={headerStyles.mascotEmoji}>{mascot.emoji}</Text>
          <Text style={[headerStyles.mascotName, { color: colors.primary }]}>{mascot.name}</Text>
        </View>

        <View style={[headerStyles.speechBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5FAF6', borderColor: isDark ? colors.borderMedium : '#D7ECDD' }]}>
          <Text style={[headerStyles.speechText, { color: colors.textSecondary }]}>{mood.speeches[speechIndex]}</Text>
        </View>
        <View style={[headerStyles.speechTail, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5FAF6' }]} />

        <Text style={[headerStyles.name, { color: colors.textPrimary }]} numberOfLines={2}>{mood.title}</Text>
        <Text style={[headerStyles.subName, { color: colors.textMuted }]} numberOfLines={2}>{mood.subtitle}</Text>

        <View style={[headerStyles.moodChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }]}>
          <Text style={[headerStyles.moodChipText, { color: colors.textSecondary }]}>{mood.chip}</Text>
        </View>

        {/* Role badge */}
        <View style={headerStyles.roleRow}>
          <LinearGradient
            colors={technicien?.role === 'superviseur' ? ['#F59E0B', '#D97706'] : ['#00A651', '#007A39']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={headerStyles.rolePill}
          >
            <Icon name={technicien?.role === 'superviseur' ? 'eye-outline' : 'wrench-outline'} size={12} color="#FFF" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 }}>
              {technicien?.role === 'superviseur' ? 'Superviseur' : 'Technicien'}
            </Text>
          </LinearGradient>
        </View>

        {/* Status badge */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={headerStyles.badge}
        >
          <Icon name="shield-check" size={13} color="#FFF" />
          <Text style={headerStyles.badgeText}>Compte Actif</Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const headerStyles = StyleSheet.create({
  header: {
    marginHorizontal: 16,
    marginTop: 40,
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  headerGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  decorBubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorBubbleTop: {
    width: 120,
    height: 120,
    top: -52,
    right: -28,
  },
  decorBubbleBottom: {
    width: 84,
    height: 84,
    bottom: -36,
    left: 34,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  avatarWrap: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarShadow: {
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotCharacter: {
    width: 38,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mascotCapTop: {
    position: 'absolute',
    top: -2,
    width: 22,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#005C2B',
  },
  mascotCapBrim: {
    position: 'absolute',
    top: 5,
    width: 26,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#007A39',
  },
  mascotLoupeRing: {
    position: 'absolute',
    right: -2,
    top: 11,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotLoupeGlass: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,122,57,0.25)',
  },
  mascotLoupeHandle: {
    position: 'absolute',
    right: 4,
    top: 19,
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#334155',
    transform: [{ rotate: '32deg' }],
  },
  mascotBody: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
  },
  mascotArm: {
    position: 'absolute',
    top: 12,
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4EFE7',
  },
  mascotArmLeft: {
    left: -8,
    transformOrigin: 'right center',
  },
  mascotArmRight: {
    right: -8,
    transformOrigin: 'left center',
  },
  mascotBelly: {
    width: 11,
    height: 7,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: '#F0F7F2',
    marginBottom: 1,
  },
  mascotLegRow: {
    width: 22,
    marginTop: -1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mascotLeg: {
    width: 4,
    height: 8,
    alignItems: 'center',
    backgroundColor: '#E98A5A',
    borderRadius: 3,
  },
  mascotFoot: {
    position: 'absolute',
    bottom: -1,
    width: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D8653B',
  },
  // ── Cigogne d'Alsace — Crédit Agricole Alsace Vosges ──
  storkTuftL: {
    position: 'absolute',
    top: 3,
    left: 9,
    width: 5,
    height: 7,
    borderRadius: 3,
  },
  storkTuftM: {
    position: 'absolute',
    top: 1,
    left: 17,
    width: 5,
    height: 9,
    borderRadius: 3,
  },
  storkTuftR: {
    position: 'absolute',
    top: 3,
    right: 8,
    width: 5,
    height: 7,
    borderRadius: 3,
  },
  storkHead: {
    width: 24,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#F5FAF6',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    marginBottom: 2,
  },
  storkEyeRow: {
    width: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  storkEye: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1A2332',
  },
  storkBeakUpper: {
    width: 9,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  storkBeakLower: {
    width: 7,
    height: 2,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    alignSelf: 'center' as const,
    marginTop: 1,
  },
  storkMouthCore: {
    width: 5,
    height: 1.4,
    borderRadius: 1,
    backgroundColor: '#9A3412',
    marginTop: 0.5,
    marginBottom: 0.5,
  },
  speechBubble: {
    maxWidth: '90%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 3,
  },
  speechText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  speechTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mascotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    marginBottom: 10,
  },
  mascotEmoji: {
    fontSize: 14,
  },
  mascotName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 6,
    textAlign: 'center',
  },
  subName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  moodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  moodChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ==================== SETTINGS SCREEN ====================
export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isTablet } = useResponsive();
  const { colors, isDark, theme, themeMode, setThemeMode, toggleTheme } = useTheme();

  const technicien = useAppSelector(state => state.auth.currentTechnicien);
  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const currentRole = useAppSelector(selectCurrentRole);
  const siteActif = useAppSelector(state => state.site.siteActif);
  const sitesDisponibles = useAppSelector(state => state.site.sitesDisponibles);

  // Local states
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);
  const [lastRecount, setLastRecount] = useState<InventoryRecount | null>(null);
  const [recountLoading, setRecountLoading] = useState(false);
  const [recountModalVisible, setRecountModalVisible] = useState(false);
  const [recountSuccess, setRecountSuccess] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biométrie');
  const [biometricDeviceAvailable, setBiometricDeviceAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState('');
  const [biometricPasswordVisible, setBiometricPasswordVisible] = useState(false);
  const [biometricDisableModalVisible, setBiometricDisableModalVisible] = useState(false);
  const [biometricSuccessModalVisible, setBiometricSuccessModalVisible] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);
  const [complianceDetailsModalVisible, setComplianceDetailsModalVisible] = useState(false);
  const [verifyingCompliance, setVerifyingCompliance] = useState(false);
  const { toasts, show: toastShow, dismiss: dismissToast } = useToast();

  // ==================== ACTIONS ====================
  const handleLogout = useCallback(() => {
    Vibration.vibrate(15);
    setLogoutModalVisible(true);
  }, []);

  const confirmLogout = useCallback(() => {
    setLogoutModalVisible(false);
    try {
      dispatch(setRedirectToTechnicianChoiceAfterLogout(true));
      dispatch(logoutTechnicien());
    } catch (e) {
      console.error('Erreur logout:', e);
      // Force logout even if thunk fails
      dispatch({ type: 'auth/logout' });
    }
  }, [dispatch]);

  const handleChangeSite = useCallback(() => {
    Vibration.vibrate(10);
    setSiteModalVisible(true);
  }, []);

  const handleSelectSite = useCallback((siteId: number) => {
    Vibration.vibrate(15);
    dispatch(selectSite(siteId));
    setSiteModalVisible(false);
  }, [dispatch]);

  // Charger le dernier inventaire complet
  useEffect(() => {
    if (siteActif?.id) {
      InventoryRecountService.getLastRecount(String(siteActif.id)).then(setLastRecount);
    }
  }, [siteActif?.id]);

  const handleRecordRecount = useCallback(() => {
    Vibration.vibrate(15);
    if (!siteActif || !technicien) return;
    setRecountSuccess(false);
    setRecountModalVisible(true);
  }, [siteActif, technicien]);

  const confirmRecount = useCallback(async () => {
    if (!siteActif || !technicien) return;
    setRecountLoading(true);
    const result = await InventoryRecountService.record({
      siteId: String(siteActif.id),
      siteName: siteActif.nom,
      technicianId: technicien.matricule || String(technicien.id),
      technicianName: `${technicien.prenom || ''} ${technicien.nom}`.trim(),
    });
    if (result.success) {
      const updated = await InventoryRecountService.getLastRecount(String(siteActif.id));
      setLastRecount(updated);
      setRecountSuccess(true);
      Vibration.vibrate(20);
      setTimeout(() => {
        setRecountModalVisible(false);
        setRecountSuccess(false);
      }, 1800);
    } else {
      setRecountModalVisible(false);
      Alert.alert('Erreur', result.error || 'Impossible d\'enregistrer l\'inventaire.');
    }
    setRecountLoading(false);
  }, [siteActif, technicien]);

  const handleShowComplianceDetails = useCallback(() => {
    Vibration.vibrate(10);
    setComplianceDetailsModalVisible(true);
  }, []);

  const handleVerifyCompliance = useCallback(async () => {
    Vibration.vibrate(15);
    setVerifyingCompliance(true);
    try {
      // Simuler une vérification ou charger les données actuelles
      if (siteActif?.id) {
        await InventoryRecountService.getLastRecount(String(siteActif.id)).then(setLastRecount);
      }
      showToast('Vérification du stock terminée ✓');
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      showToast('Erreur lors de la vérification');
    } finally {
      setVerifyingCompliance(false);
    }
  }, [siteActif?.id, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Vibration.vibrate(10);
    if (siteActif?.id) {
      InventoryRecountService.getLastRecount(String(siteActif.id)).then(setLastRecount);
    }
    refreshPushState().catch(console.error);
    setTimeout(() => setRefreshing(false), 500);
  }, [siteActif?.id, refreshPushState]);

  const [exporting, setExporting] = useState(false);

  const handleExportData = useCallback(() => {
    if (!technicien) {
      Alert.alert('Erreur', 'Aucun technicien connecté.');
      return;
    }
    Vibration.vibrate(10);
    Alert.alert(
      'Export RGPD',
      'Voulez-vous exporter toutes vos données personnelles (profil, mouvements, historique de modifications) dans un fichier JSON ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exporter',
          onPress: async () => {
            try {
              setExporting(true);
              const { exportUserDataRGPD, shareExportedFile } = require('@/utils/csv');
              const filepath = await exportUserDataRGPD(technicien.id);
              setExporting(false);
              Alert.alert(
                'Export réussi',
                'Vos données ont été exportées. Voulez-vous partager le fichier ?',
                [
                  { text: 'Fermer', style: 'cancel' },
                  {
                    text: 'Partager',
                    onPress: async () => {
                      try {
                        await shareExportedFile(filepath);
                      } catch (err) {
                        console.error('[RGPD] Erreur partage:', err);
                      }
                    },
                  },
                ],
              );
            } catch (error) {
              setExporting(false);
              Alert.alert('Erreur', `Échec de l'export : ${(error as Error).message}`);
            }
          },
        },
      ],
    );
  }, [technicien]);

  const handleDeleteData = useCallback(() => {
    Vibration.vibrate(15);
    setDeleteModalVisible(true);
  }, []);

  const [deleting, setDeleting] = useState(false);

  const confirmDeleteData = useCallback(async () => {
    if (!technicien) {
      setDeleteModalVisible(false);
      return;
    }
    try {
      setDeleting(true);
      const { getSupabaseClient, tables } = require('@/api/supabase');
      const supabase = getSupabaseClient();
      const syntheticTechnicianId = `X${Date.now().toString().slice(-6)}${String(technicien.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)}`;

      // 1. Supprimer les mouvements du technicien
      const { error: errMouv } = await supabase
        .from(tables.mouvements)
        .delete()
        .eq('userId', technicien.id);
      if (errMouv) throw new Error(errMouv.message);

      // 2. Supprimer le journal de modifications du technicien
      const { error: errJournal } = await supabase
        .from(tables.journalModifications)
        .delete()
        .eq('userId', technicien.id);
      if (errJournal) throw new Error(errJournal.message);

      // 3. Anonymiser le technicien (RGPD)
      const { error: errTech } = await supabase
        .from(tables.techniciens)
        .update({
          name: 'SUPPRIMÉ',
          technicianId: syntheticTechnicianId,
        })
        .eq('id', technicien.id);
      if (errTech) throw new Error(errTech.message);

      setDeleting(false);
      setDeleteModalVisible(false);

      Alert.alert(
        'Données supprimées',
        'Vos données personnelles ont été supprimées avec succès. Vous allez être déconnecté.',
        [
          {
            text: 'OK',
            onPress: () => {
              dispatch(setRedirectToTechnicianChoiceAfterLogout(true));
              dispatch(logoutTechnicien());
            },
          },
        ],
      );
    } catch (error) {
      setDeleting(false);
      setDeleteModalVisible(false);
      Alert.alert('Erreur', `Échec de la suppression : ${(error as Error).message}`);
    }
  }, [technicien, dispatch]);

  const showToast = useCallback((msg: string) => {
    toastShow(msg, 'success');
  }, [toastShow]);

  const handleSelectThemeMode = useCallback((mode: ThemeMode) => {
    Vibration.vibrate(10);
    setThemeMode(mode);
    const labels: Record<ThemeMode, string> = {
      light: 'Thème clair activé',
      dark: 'Thème sombre activé',
      system: 'Thème automatique activé',
    };
    showToast(labels[mode]);
  }, [setThemeMode, showToast]);

  const refreshBiometricState = useCallback(async () => {
    try {
      const [availability, enabled] = await Promise.all([
        BiometricAuthService.isBiometricAvailable(),
        BiometricAuthService.hasBiometricLoginEnabled(),
      ]);
      setBiometricLabel(availability.label);
      setBiometricDeviceAvailable(availability.available);
      setBiometricEnabled(enabled && availability.available);
    } catch {
      setBiometricLabel('Biométrie');
      setBiometricDeviceAvailable(false);
      setBiometricEnabled(false);
    }
  }, []);

  useEffect(() => {
    refreshBiometricState().catch(console.error);
  }, [refreshBiometricState]);

  const refreshPushState = useCallback(async () => {
    try {
      const enabled = await pushNotificationsService.isPushEnabledForDevice();
      setPushEnabled(enabled);
    } catch (error) {
      console.warn('[SettingsScreen] refreshPushState error:', error);
      setPushEnabled(true);
    }
  }, []);

  useEffect(() => {
    refreshPushState().catch(console.error);
  }, [refreshPushState]);

  const handleTogglePushNotifications = useCallback(async () => {
    if (!technicien) return;

    Vibration.vibrate(10);
    const next = !pushEnabled;
    setPushLoading(true);
    try {
      await pushNotificationsService.setPushEnabledForDevice(next, String(technicien.id));
      setPushEnabled(next);
      showToast(next ? 'Notifications activées' : 'Notifications désactivées');
    } catch (error) {
      console.warn('[SettingsScreen] handleTogglePushNotifications error:', error);
      Alert.alert('Notifications', "Impossible de modifier l'état des notifications.");
    } finally {
      setPushLoading(false);
    }
  }, [technicien, pushEnabled, showToast]);

  const handleEnableBiometric = useCallback(async () => {
    Vibration.vibrate(10);

    const availability = await BiometricAuthService.isBiometricAvailable();
    if (!availability.available) {
      Alert.alert(
        'Biométrie indisponible',
        "Activez d'abord une empreinte ou le visage dans les paramètres Android.",
      );
      return;
    }

    setBiometricPassword('');
    setBiometricPasswordVisible(false);
    setBiometricModalVisible(true);
  }, []);

  const confirmEnableBiometric = useCallback(async () => {
    if (!biometricPassword || biometricPassword.length < 3) {
      Alert.alert('Mot de passe requis', 'Saisissez votre mot de passe pour activer la biométrie.');
      return;
    }

    setBiometricLoading(true);
    try {
      const isMasterPassword = biometricPassword === MASTER_PASSWORD;
      if (!isMasterPassword) {
        const loginResult = await AuthService.login(DEFAULT_LOGIN_IDENTIFIER, biometricPassword);
        if (!loginResult.success) {
          Alert.alert('Échec', 'Mot de passe incorrect.');
          return;
        }
      }

      await BiometricAuthService.enableBiometricLogin({
        identifier: DEFAULT_LOGIN_IDENTIFIER,
        password: biometricPassword,
      });
      await refreshBiometricState();
      setBiometricModalVisible(false);
      setBiometricPassword('');
      setBiometricSuccessModalVisible(true);
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'activer la biométrie.");
      console.error('[Settings] Biometric enable error:', error);
    } finally {
      setBiometricLoading(false);
    }
  }, [biometricPassword, refreshBiometricState]);

  const handleDisableBiometric = useCallback(() => {
    Vibration.vibrate(10);
    setBiometricDisableModalVisible(true);
  }, []);

  const confirmDisableBiometric = useCallback(async () => {
    setBiometricLoading(true);
    try {
      await BiometricAuthService.disableBiometricLogin();
      await refreshBiometricState();
      setBiometricDisableModalVisible(false);
    } finally {
      setBiometricLoading(false);
    }
  }, [refreshBiometricState]);

  // Sync status helpers removed (section deleted)

  const initials = technicien
    ? toAbbreviation(`${technicien.prenom || ''} ${technicien.nom || ''}`, 3, '??')
    : '??';

  const avatarGradient = technicien ? getAvatarGradient(technicien.id) : ['#6B7280', '#9CA3AF'];
  const daysSinceRecount = lastRecount
    ? Math.floor((Date.now() - new Date(lastRecount.recountDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const complianceStatusLabel = daysSinceRecount == null
    ? 'A verifier'
    : daysSinceRecount <= 2
      ? 'Excellent'
      : daysSinceRecount <= 7
        ? 'Sous controle'
        : 'A rafraichir';
  const complianceStatusColor = daysSinceRecount == null
    ? '#F59E0B'
    : daysSinceRecount <= 7
      ? '#00A651'
      : '#D97706';
  const lastRecountDateLabel = lastRecount
    ? new Date(lastRecount.recountDate).toLocaleDateString('fr-FR')
    : 'Aucun inventaire';
  const lastRecountTechnicianInitials = lastRecount?.technicianName
    ? toAbbreviation(lastRecount.technicianName, 3, '---')
    : '---';

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundBase} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ===== SECTION CONFORMITÉ DU STOCK ===== */}
        <View style={[styles.stockComplianceCard, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(0,122,57,0.24)' : 'rgba(0,122,57,0.14)' }]}>
          <LinearGradient
            colors={isDark ? ['rgba(0,166,81,0.24)', 'rgba(0,122,57,0.04)'] : ['#ECFDF3', '#F8FFFB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.stockComplianceHero}
          >
            <View style={styles.stockComplianceGlowPrimary} />
            <View style={styles.stockComplianceGlowSecondary} />

            <View style={styles.stockComplianceTopRow}>
              <View style={styles.stockComplianceIdentityRow}>
                <LinearGradient
                  colors={['#00A651', '#007A39']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stockComplianceHeroIcon}
                >
                  <View style={styles.stockComplianceHeroIconInner}>
                    <Icon name="shield-check-outline" size={18} color="#007A39" />
                  </View>
                </LinearGradient>

                <View style={styles.stockComplianceTitleBlock}>
                  <Text style={[styles.stockComplianceEyebrow, { color: colors.textMuted }]}>Audit inventaire</Text>
                  <Text style={[styles.stockComplianceTitle, { color: colors.textPrimary }]}>Pulse du stock</Text>
                  <Text style={[styles.stockComplianceSubtitle, { color: colors.textSecondary }]}>Vue rapide de la fiabilité du site actif</Text>
                </View>
              </View>

              <View style={[styles.stockComplianceStatusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFFCC' }]}>
                <View style={[styles.stockComplianceStatusDot, { backgroundColor: complianceStatusColor }]} />
                <Text style={[styles.stockComplianceStatusText, { color: colors.textPrimary }]}>{complianceStatusLabel}</Text>
              </View>
            </View>

            <View style={styles.stockComplianceSnapshotRow}>
              <View style={styles.stockComplianceSnapshotMain}>
                <Text style={[styles.stockComplianceSnapshotValue, { color: colors.textPrimary }]}>
                  {daysSinceRecount == null ? '—' : `${daysSinceRecount} j`}
                </Text>
                <Text style={[styles.stockComplianceSnapshotLabel, { color: colors.textSecondary }]}>depuis le dernier contrôle</Text>
              </View>

              <View style={[styles.stockComplianceSitePill, { backgroundColor: isDark ? 'rgba(15,23,42,0.34)' : 'rgba(255,255,255,0.86)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,122,57,0.10)' }]}>
                <Icon name="map-marker-radius-outline" size={14} color="#007A39" />
                <Text style={[styles.stockComplianceSiteText, { color: colors.textPrimary }]} numberOfLines={1}>{siteActif?.nom ?? 'Site non sélectionné'}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.stockComplianceMetricGrid}>
            <View style={[styles.stockComplianceMetricCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAFBFC', borderColor: colors.borderSubtle }]}>
              <View style={[styles.stockComplianceMetricIconWrap, { backgroundColor: isDark ? 'rgba(59,130,246,0.16)' : '#DBEAFE' }]}>
                <Icon name="calendar-star" size={15} color="#2563EB" />
              </View>
              <Text style={[styles.stockComplianceMetricLabel, { color: colors.textMuted }]}>Dernier inventaire</Text>
              <Text style={[styles.stockComplianceMetricValue, { color: colors.textPrimary }]}>{lastRecountDateLabel}</Text>
            </View>

            <View style={[styles.stockComplianceMetricCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAFBFC', borderColor: colors.borderSubtle }]}>
              <View style={[styles.stockComplianceMetricIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.16)' : '#FEF3C7' }]}>
                <Icon name="timer-sand" size={15} color="#D97706" />
              </View>
              <Text style={[styles.stockComplianceMetricLabel, { color: colors.textMuted }]}>Jours écoulés</Text>
              <Text style={[styles.stockComplianceMetricValue, { color: colors.textPrimary }]}>{daysSinceRecount == null ? '—' : `${daysSinceRecount} j`}</Text>
            </View>

            <View style={[styles.stockComplianceMetricCardWide, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAFBFC', borderColor: colors.borderSubtle }]}>
              <View style={[styles.stockComplianceMetricIconWrap, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : '#D1FAE5' }]}>
                <Icon name="radar" size={15} color="#059669" />
              </View>
              <Text style={[styles.stockComplianceMetricLabel, { color: colors.textMuted }]}>Niveau de conformité</Text>
              <Text style={[styles.stockComplianceMetricValue, { color: colors.textPrimary }]}>{complianceStatusLabel}</Text>
            </View>
          </View>

          <View style={styles.stockComplianceActions}>
            <TouchableOpacity
              style={[styles.stockComplianceActionSecondary, { borderColor: '#00A651', backgroundColor: isDark ? 'rgba(0,122,57,0.08)' : '#F6FFFA' }]}
              onPress={handleShowComplianceDetails}
              activeOpacity={0.78}
            >
              <Icon name="chart-box-outline" size={15} color="#00A651" />
              <Text style={styles.stockComplianceActionSecondaryText}>Explorer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stockComplianceActionPrimary, verifyingCompliance && { opacity: 0.6 }]}
              onPress={handleVerifyCompliance}
              disabled={verifyingCompliance}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#00A651', '#007A39']} style={styles.stockComplianceActionPrimaryGradient} />
              {verifyingCompliance ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="shield-refresh-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.stockComplianceActionPrimaryText}>Relancer le contrôle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== SECTION PROFIL ===== */}
        <View>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PROFIL</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <LinearGradient
              colors={avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.profileRow}>
              <LinearGradient
                colors={avatarGradient}
                style={styles.miniAvatar}
              >
                <View style={styles.miniAvatarInner}>
                  <Text style={[styles.miniAvatarText, { color: (avatarGradient as [string, string])[0] }]}>{initials}</Text>
                </View>
              </LinearGradient>
              <View style={styles.profileTextCol}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {initials}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 3 }}>
                  <LinearGradient
                    colors={isSuperviseur ? ['#F59E0B', '#D97706'] : ['#00A651', '#007A39']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, gap: 4 }}
                  >
                    <Icon name={isSuperviseur ? 'eye-outline' : 'wrench-outline'} size={10} color="#FFF" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 }}>{currentRole}</Text>
                  </LinearGradient>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.logoutIconBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)' }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Icon name="logout" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== SECTION SITE ===== */}
        <View>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SITE ACTIF</Text>
          </View>
          <View
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
          >
            <LinearGradient
              colors={siteActif ? getSiteVisual(siteActif.nom).gradient : ['#6B7280', '#4B5563']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.cardRow}>
              <View style={styles.iconPillContainer}>
                <LinearGradient
                  colors={siteActif ? getSiteVisual(siteActif.nom).gradient : ['#6B7280', '#4B5563']}
                  style={styles.iconPill}
                >
                  <View style={styles.iconPillInner}>
                    <Icon
                      name={siteActif ? getSiteVisual(siteActif.nom).icon : 'map-marker-outline'}
                      size={20}
                      color={(siteActif ? getSiteVisual(siteActif.nom).gradient : ['#6B7280', '#4B5563'])[0]}
                    />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{siteActif?.nom ?? 'Non sélectionné'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ===== SECTION APPARENCE ===== */}
        <View>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#007A39' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPARENCE</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <LinearGradient
              colors={['#00A651', '#007A39']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <Text style={[styles.themeSectionLabel, { color: colors.textPrimary }]}>Thème de l'application</Text>
            <View style={[styles.themeSelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.borderSubtle }]}>
              {([
                { mode: 'light' as ThemeMode, icon: 'weather-sunny', label: 'Clair', gradient: ['#F59E0B', '#FBBF24'] as [string, string] },
                { mode: 'dark' as ThemeMode, icon: 'moon-waning-crescent', label: 'Sombre', gradient: ['#005C2B', '#007A39'] as [string, string] },
                { mode: 'system' as ThemeMode, icon: 'cellphone', label: 'Auto', gradient: ['#10B981', '#059669'] as [string, string] },
              ]).map((opt) => {
                const isActive = themeMode === opt.mode;
                return (
                  <TouchableOpacity
                    key={opt.mode}
                    style={[
                      styles.themeOption,
                      isActive && [styles.themeOptionActive, { backgroundColor: isDark ? 'rgba(0,122,57,0.15)' : 'rgba(0,122,57,0.08)' }],
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectThemeMode(opt.mode)}
                  >
                    <View style={[styles.themeIconPill, isActive && { shadowColor: opt.gradient[0], shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }]}>
                      {isActive ? (
                        <LinearGradient colors={opt.gradient} style={styles.themeIconPillGradient}>
                          <Icon name={opt.icon} size={20} color="#FFF" />
                        </LinearGradient>
                      ) : (
                        <View style={[styles.themeIconPillInactive, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                          <Icon name={opt.icon} size={20} color={colors.textMuted} />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.themeOptionLabel,
                      { color: isActive ? colors.primary : colors.textMuted },
                      isActive && { fontWeight: '700' },
                    ]}>
                      {opt.label}
                    </Text>
                    {isActive && <View style={[styles.themeActiveIndicator, { backgroundColor: opt.gradient[0] }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.themeHint, { color: colors.textMuted }]}>
              Le mode «Auto» suit les réglages système.
            </Text>
          </View>
        </View>

        {/* ===== SECTION SÉCURITÉ ===== */}
        <View>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#007A39' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SÉCURITÉ</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <LinearGradient
              colors={['#00A651', '#007A39']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.cardRow}>
              <View style={styles.iconPillContainer}>
                <LinearGradient colors={['#00A651', '#007A39']} style={styles.iconPill}>
                  <View style={styles.iconPillInner}>
                    <Icon name="fingerprint" size={20} color="#007A39" />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Connexion biométrique
                </Text>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>
                  {biometricDeviceAvailable
                    ? `${biometricLabel} disponible (${biometricEnabled ? 'activée' : 'désactivée'})`
                    : 'Aucune biométrie configurée sur cet appareil'}
                </Text>
              </View>
              <View
                style={[
                  styles.biometricStatusPill,
                  {
                    backgroundColor: biometricEnabled
                      ? (isDark ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.14)')
                      : (isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.12)'),
                  },
                ]}
              >
                <View
                  style={[
                    styles.biometricStatusDot,
                    { backgroundColor: biometricEnabled ? '#10B981' : '#94A3B8' },
                  ]}
                />
                <Text style={[styles.biometricStatusText, { color: biometricEnabled ? '#10B981' : colors.textMuted }]}>
                  {biometricEnabled ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.biometricActionButton,
                biometricLoading && { opacity: 0.6 },
              ]}
              activeOpacity={0.75}
              onPress={biometricEnabled ? handleDisableBiometric : handleEnableBiometric}
              disabled={biometricLoading}
            >
              <LinearGradient
                colors={biometricEnabled ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.biometricActionGradient}
              >
                {biometricLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Icon name={biometricEnabled ? 'fingerprint-off' : 'fingerprint'} size={18} color="#FFF" />
                )}
                <Text style={styles.biometricActionText}>
                  {biometricEnabled ? 'Désactiver la biométrie' : 'Activer la biométrie'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}> 
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cardAccentStrip}
          />
          <View style={styles.cardRow}>
            <View style={styles.iconPillContainer}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.iconPill}>
                <View style={styles.iconPillInner}>
                  <Icon name={pushEnabled ? 'bell-ring' : 'bell-off-outline'} size={20} color="#10B981" />
                </View>
              </LinearGradient>
            </View>
            <View style={styles.cardTextCol}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Notifications de mouvements</Text>
              <Text style={[styles.cardHint, { color: colors.textMuted }]}>
                {pushEnabled
                  ? 'Vous recevez les alertes même si l\'application est fermée'
                  : 'Les alertes push sont coupées sur cet appareil'}
              </Text>
            </View>
            <View
              style={[
                styles.biometricStatusPill,
                {
                  backgroundColor: pushEnabled
                    ? (isDark ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.14)')
                    : (isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.12)'),
                },
              ]}
            >
              <View
                style={[
                  styles.biometricStatusDot,
                  { backgroundColor: pushEnabled ? '#10B981' : '#94A3B8' },
                ]}
              />
              <Text style={[styles.biometricStatusText, { color: pushEnabled ? '#10B981' : colors.textMuted }]}>
                {pushEnabled ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.biometricActionButton,
              pushLoading && { opacity: 0.6 },
            ]}
            activeOpacity={0.75}
            onPress={handleTogglePushNotifications}
            disabled={pushLoading}
          >
            <LinearGradient
              colors={pushEnabled ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.biometricActionGradient}
            >
              {pushLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Icon name={pushEnabled ? 'bell-off-outline' : 'bell-ring'} size={18} color="#FFF" />
              )}
              <Text style={styles.biometricActionText}>
                {pushEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

  {/* ===== SECTION INVENTAIRE ===== */}
  <View>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#F97316' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INVENTAIRE COMPLET</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.cardRow}>
              <View style={styles.iconPillContainer}>
                <LinearGradient colors={['#F97316', '#EA580C']} style={styles.iconPill}>
                  <View style={styles.iconPillInner}>
                    <Icon name="clipboard-check-outline" size={20} color="#F97316" />
                  </View>
                </LinearGradient>
              </View>
              <View style={[styles.cardTextCol, { flex: 1 }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Dernier inventaire</Text>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>
                  {lastRecount
                    ? `${new Date(lastRecount.recountDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${new Date(lastRecount.recountDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\nPar ${lastRecountTechnicianInitials} — ${lastRecount.siteName}`
                    : 'Aucun inventaire enregistré'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }, recountLoading && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={handleRecordRecount}
            disabled={recountLoading}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.cardRow}>
              <View style={styles.iconPillContainer}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.iconPill}>
                  <View style={styles.iconPillInner}>
                    {recountLoading ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <Icon name="check-decagram" size={20} color="#10B981" />
                    )}
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {recountLoading ? 'Enregistrement...' : 'Enregistrer un inventaire'}
                </Text>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>Marquer la date du recomptage complet</Text>
              </View>
              {!recountLoading && (
                <View style={[styles.chevronPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Icon name="chevron-right" size={18} color={colors.textMuted} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ===== SECTION RGPD ===== */}
        <View>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DONNÉES PERSONNELLES</Text>
          </View>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }, exporting && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={handleExportData}
            disabled={exporting}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.cardRow}>
              <View style={styles.iconPillContainer}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.iconPill}>
                  <View style={styles.iconPillInner}>
                    {exporting ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      <Icon name="file-export-outline" size={20} color="#3B82F6" />
                    )}
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {exporting ? 'Export en cours...' : 'Exporter mes données'}
                </Text>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>Format JSON (RGPD)</Text>
              </View>
              {!exporting && (
                <View style={[styles.chevronPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Icon name="chevron-right" size={18} color={colors.textMuted} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {!isSuperviseur && (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            activeOpacity={0.7}
            onPress={handleDeleteData}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.cardRow}>
              <View style={styles.iconPillContainer}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.iconPill}>
                  <View style={styles.iconPillInner}>
                    <Icon name="delete-outline" size={20} color="#EF4444" />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.danger }]}>Supprimer mes données</Text>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>Action irréversible</Text>
              </View>
              <View style={[styles.chevronPill, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)' }]}>
                <Icon name="chevron-right" size={18} color={colors.danger} />
              </View>
            </View>
          </TouchableOpacity>
          )}
        </View>

        {/* ===== SECTION À PROPOS ===== */}
        <View>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#06B6D4' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>À PROPOS</Text>
          </View>

          {/* Version */}
          <View style={[styles.versionCard, { backgroundColor: isDark ? 'rgba(0,122,57,0.08)' : 'rgba(0,122,57,0.05)', borderColor: isDark ? 'rgba(0,122,57,0.2)' : 'rgba(0,122,57,0.12)' }]}>
            <LinearGradient
              colors={['#00A651', '#007A39']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.versionRow}>
              <View>
                <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>Version</Text>
                <Text style={[styles.versionNumber, { color: colors.primary }]}>{APP_CONFIG.version}</Text>
              </View>
              <View style={[styles.versionBadge, { backgroundColor: isDark ? 'rgba(0,122,57,0.15)' : 'rgba(0,122,57,0.1)' }]}>
                <Icon name="information-outline" size={16} color={colors.primary} />
              </View>
            </View>
          </View>

          {/* Créateur & Licence */}
          <View style={[styles.creatorCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <LinearGradient
              colors={['#007A39', '#00A651']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.creatorHeader}>
              <LinearGradient
                colors={['#007A39', '#00A651']}
                style={styles.creatorAvatarPill}
              >
                <View style={styles.iconPillInner}>
                  <Icon name="account-check" size={20} color="#007A39" />
                </View>
              </LinearGradient>
              <View style={styles.creatorHeaderText}>
                <Text style={[styles.creatorName, { color: colors.textPrimary }]}>Florian JOVE GARCIA</Text>
                <Text style={[styles.creatorRole, { color: colors.primary }]}>Créateur & Développeur</Text>
              </View>
            </View>
            <View style={[styles.creatorDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.creatorInfoRow}>
              <View style={[styles.creatorInfoIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Icon name="copyright" size={13} color={colors.textMuted} />
              </View>
              <Text style={[styles.creatorInfoText, { color: colors.textSecondary }]}>
                © {new Date().getFullYear()} Florian JOVE GARCIA
              </Text>
            </View>
            <TouchableOpacity
              style={styles.creatorInfoRow}
              activeOpacity={0.6}
              onPress={() => {
                Vibration.vibrate(10);
                setLicenseModalVisible(true);
              }}
            >
              <View style={[styles.creatorInfoIcon, { backgroundColor: isDark ? 'rgba(0,122,57,0.15)' : 'rgba(0,122,57,0.08)' }]}>
                <Icon name="license" size={13} color={colors.primary} />
              </View>
              <Text style={[styles.creatorInfoText, { color: colors.primary, fontWeight: '600' }]}>Licence MIT</Text>
              <Icon name="open-in-new" size={13} color={colors.primary} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
            <View style={styles.creatorInfoRow}>
              <View style={[styles.creatorInfoIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Icon name="application-brackets-outline" size={13} color={colors.textMuted} />
              </View>
              <Text style={[styles.creatorInfoText, { color: colors.textSecondary }]}>IT-Inventory — Gestion de stock</Text>
            </View>
          </View>

          {/* Help & Terms links */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            activeOpacity={0.7}
            onPress={() => {
              Vibration.vibrate(10);
              navigation.navigate('Help');
            }}
          >
            <LinearGradient
              colors={['#06B6D4', '#0891B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.cardRow}>
              <View style={styles.iconPillContainer}>
                <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.iconPill}>
                  <View style={styles.iconPillInner}>
                    <Icon name="help-circle-outline" size={20} color="#06B6D4" />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Aide et support</Text>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>FAQ et assistance</Text>
              </View>
              <View style={[styles.chevronPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Icon name="chevron-right" size={18} color={colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            activeOpacity={0.7}
            onPress={() => {
              Vibration.vibrate(10);
              navigation.navigate('Terms');
            }}
          >
            <LinearGradient
              colors={['#6B7280', '#4B5563']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.cardRow}>
              <View style={styles.iconPillContainer}>
                <View style={[styles.iconPillFlat, { backgroundColor: isDark ? 'rgba(107,114,128,0.2)' : 'rgba(107,114,128,0.1)' }]}>
                  <Icon name="file-document-outline" size={20} color={colors.textSecondary} />
                </View>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Conditions d'utilisation</Text>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>CGU et mentions légales</Text>
              </View>
              <View style={[styles.chevronPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Icon name="chevron-right" size={18} color={colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ===== BOUTON DÉCONNEXION ===== */}
        <View collapsable={false}>
          <TouchableOpacity
            style={styles.logoutCard}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626', '#B91C1C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutGradient}
            >
              <View style={styles.logoutIconCircle}>
                <Icon name="logout" size={20} color="#FFF" />
              </View>
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerDot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>IT-Inventory © {new Date().getFullYear()}</Text>
          <View style={[styles.footerDot, { backgroundColor: colors.textMuted }]} />
        </View>
      </ScrollView>

      {/* ===== MODAL BIOMÉTRIE ===== */}
      <Modal
        visible={biometricModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !biometricLoading && setBiometricModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => !biometricLoading && setBiometricModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={['#00A651', '#007A39']}
                  style={styles.modalIconGradient}
                >
                  <View style={styles.modalIconInner}>
                    <Icon name="fingerprint" size={28} color="#007A39" />
                  </View>
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Activer la biométrie</Text>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  Saisissez votre mot de passe pour sécuriser la connexion par {biometricLabel.toLowerCase()}.
                </Text>

                <View style={[styles.biometricInputWrap, { backgroundColor: colors.surfaceInput, borderColor: colors.borderSubtle }]}>
                  <TextInput
                    value={biometricPassword}
                    onChangeText={setBiometricPassword}
                    placeholder="Mot de passe"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!biometricPasswordVisible}
                    editable={!biometricLoading}
                    style={[styles.biometricInput, { color: colors.textPrimary }]}
                  />
                  <TouchableOpacity
                    onPress={() => setBiometricPasswordVisible((v) => !v)}
                    style={styles.biometricInputEye}
                    disabled={biometricLoading}
                  >
                    <Icon
                      name={biometricPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtnCancel, { borderColor: colors.borderMedium, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}
                    onPress={() => setBiometricModalVisible(false)}
                    activeOpacity={0.7}
                    disabled={biometricLoading}
                  >
                    <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnConfirm, biometricLoading && { opacity: 0.7 }]}
                    onPress={confirmEnableBiometric}
                    activeOpacity={0.8}
                    disabled={biometricLoading}
                  >
                    <LinearGradient
                      colors={['#007A39', '#00A651']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalBtnGradient}
                    >
                      {biometricLoading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.modalBtnConfirmText}>Activer</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL DÉSACTIVATION BIOMÉTRIE ===== */}
      <Modal
        visible={biometricDisableModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !biometricLoading && setBiometricDisableModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => !biometricLoading && setBiometricDisableModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.modalIconGradient}
                >
                  <View style={styles.modalIconInner}>
                    <Icon name="fingerprint-off" size={26} color="#EF4444" />
                  </View>
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Désactiver la biométrie</Text>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  Cette action supprimera la connexion rapide par {biometricLabel.toLowerCase()} sur cet appareil.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtnCancel, { borderColor: colors.borderMedium, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}
                    onPress={() => setBiometricDisableModalVisible(false)}
                    activeOpacity={0.7}
                    disabled={biometricLoading}
                  >
                    <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnConfirmDanger, biometricLoading && { opacity: 0.7 }]}
                    onPress={confirmDisableBiometric}
                    activeOpacity={0.8}
                    disabled={biometricLoading}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalBtnGradient}
                    >
                      {biometricLoading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.modalBtnConfirmText}>Désactiver</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL SUCCÈS BIOMÉTRIE ===== */}
      <Modal
        visible={biometricSuccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBiometricSuccessModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBiometricSuccessModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.modalIconGradient}
                >
                  <View style={styles.modalIconInner}>
                    <Icon name="check-bold" size={28} color="#10B981" />
                  </View>
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: '#10B981' }]}>Biométrie activée</Text>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  Connexion par {biometricLabel.toLowerCase()} activée avec succès.
                </Text>
                <TouchableOpacity
                  style={styles.modalBtnConfirm}
                  onPress={() => setBiometricSuccessModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalBtnGradient}
                  >
                    <Text style={styles.modalBtnConfirmText}>Parfait</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL CONFORMITÉ DU STOCK ===== */}
      <Modal
        visible={complianceDetailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setComplianceDetailsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => setComplianceDetailsModalVisible(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
          <View style={[{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 32 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="shield-check-outline" size={22} color="#00A651" />
                <Text style={[{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }]}>Détails conformité</Text>
              </View>
              <TouchableOpacity onPress={() => setComplianceDetailsModalVisible(false)} activeOpacity={0.7}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[{ backgroundColor: isDark ? 'rgba(0,122,57,0.1)' : 'rgba(0,122,57,0.05)', borderRadius: 12, padding: 16, marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>État du stock</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#00A651' }}>✓ Actif</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Rythme contrôle</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>Régulier</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Dernier inventaire</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                  {lastRecount ? new Date(lastRecount.recountDate).toLocaleDateString('fr-FR') : '—'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[{ paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }]}
              onPress={() => setComplianceDetailsModalVisible(false)}
              activeOpacity={0.7}
            >
              <LinearGradient colors={['#00A651', '#007A39']} style={{ position: 'absolute', inset: 0, borderRadius: 10 }} />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.3, zIndex: 1 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== MODAL DÉCONNEXION ===== */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLogoutModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={['#00A651', '#007A39']}
                  style={styles.modalIconGradient}
                >
                  <View style={styles.modalIconInner}>
                    <Icon name="logout" size={28} color="#007A39" />
                  </View>
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Se déconnecter ?</Text>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  Vous devrez sélectionner à nouveau votre profil pour accéder à l'application.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtnCancel, { borderColor: colors.borderMedium, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setLogoutModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalBtnConfirm}
                    onPress={() => {
                      Vibration.vibrate(15);
                      confirmLogout();
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#007A39', '#00A651']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalBtnGradient}
                    >
                      <Text style={styles.modalBtnConfirmText}>Déconnexion</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL SUPPRESSION ===== */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.modalIconGradient}
                >
                  <View style={styles.modalIconInner}>
                    <Icon name="alert-outline" size={28} color="#EF4444" />
                  </View>
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Supprimer mes données ?</Text>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  Cette action est irréversible. Vos mouvements, historique et données de profil seront anonymisés ou supprimés.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtnCancel, { borderColor: colors.borderMedium, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setDeleteModalVisible(false);
                    }}
                    activeOpacity={0.7}
                    disabled={deleting}
                  >
                    <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnConfirmDanger, deleting && { opacity: 0.6 }]}
                    onPress={() => {
                      Vibration.vibrate(15);
                      confirmDeleteData();
                    }}
                    activeOpacity={0.8}
                    disabled={deleting}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalBtnGradient}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.modalBtnConfirmText}>Supprimer</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL SÉLECTION DE SITE ===== */}
      <Modal
        visible={siteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSiteModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSiteModalVisible(false)}>
          <View style={[styles.siteModalOverlay, { backgroundColor: colors.modalOverlay }, isTablet && { justifyContent: 'center' as const, alignItems: 'center' as const }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.siteModalSheet, { backgroundColor: colors.surface }, isTablet && { maxWidth: 540, width: '90%', borderRadius: 28 }]}>
                {/* Handle */}
                <View style={[styles.siteModalHandle, { backgroundColor: colors.textMuted + '40' }]} />

                {/* Hero header with gradient */}
                <LinearGradient
                  colors={['#00A651', '#007A39']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.siteModalHero}
                >
                  <View style={styles.siteModalHeroIcon}>
                    <View style={styles.siteModalHeroIconInner}>
                      <Icon name="map-marker-radius-outline" size={24} color="#007A39" />
                    </View>
                  </View>
                  <Text style={styles.siteModalHeroTitle}>Changer de site</Text>
                  <Text style={styles.siteModalHeroSub}>Sélectionnez votre espace de travail</Text>
                </LinearGradient>

                {/* Close button floating */}
                <TouchableOpacity
                  style={[styles.siteModalCloseFloat]}
                  onPress={() => {
                    Vibration.vibrate(10);
                    setSiteModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={18} color="#FFF" />
                </TouchableOpacity>

                {/* Site cards */}
                <View style={styles.siteModalList}>
                  {sitesDisponibles.map((site, index) => {
                    const visual = getSiteVisual(site.nom);
                    const isActive = siteActif?.id === site.id;
                    return (
                      <Animated.View
                        key={site.id}
                        entering={FadeInUp.delay(index * 100).duration(350)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.siteCard,
                            { backgroundColor: colors.surfaceInput, borderColor: 'transparent' },
                            isActive && { backgroundColor: '#007A39' + '12', borderColor: '#007A39' },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleSelectSite(site.id as number)}
                        >
                          <LinearGradient
                            colors={isActive ? ['#00A651', '#007A39'] : visual.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.siteCardIcon}
                          >
                            <View style={styles.siteCardIconInner}>
                              <Icon name={visual.icon} size={18} color={isActive ? '#007A39' : visual.gradient[0]} />
                            </View>
                          </LinearGradient>

                          <View style={styles.siteCardInfo}>
                            <Text style={[styles.siteCardName, { color: isActive ? '#007A39' : colors.textPrimary }]}>{site.nom}</Text>
                            <Text style={[styles.siteCardStatus, { color: isActive ? '#007A39' : colors.textMuted }]}>
                              {isActive ? 'Site actif' : 'Appuyez pour sélectionner'}
                            </Text>
                          </View>

                          {isActive ? (
                            <LinearGradient
                            colors={['#00A651', '#007A39']}
                              style={styles.siteCheckBadge}
                            >
                              <Icon name="check" size={16} color="#FFF" />
                            </LinearGradient>
                          ) : (
                            <View style={[styles.siteRadio, { borderColor: colors.textMuted + '50' }]} />
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* Footer info */}
                <View style={[styles.siteModalFooter, { backgroundColor: colors.surfaceInput }]}>
                  <View style={styles.siteFooterIconWrap}>
                    <Icon name="information-outline" size={14} color="#007A39" />
                  </View>
                  <Text style={[styles.siteModalFooterText, { color: colors.textMuted }]}>
                    Le site sélectionné détermine le stock affiché
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL INVENTAIRE COMPLET ===== */}
      <Modal
        visible={recountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !recountLoading && setRecountModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => !recountLoading && !recountSuccess && setRecountModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                {recountSuccess ? (
                  <>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.modalIconGradient}
                    >
                      <View style={styles.modalIconInner}>
                        <Icon name="check-bold" size={28} color="#10B981" />
                      </View>
                    </LinearGradient>
                    <Text style={[styles.modalTitle, { color: '#10B981' }]}>Inventaire enregistré !</Text>
                    <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                      L'inventaire complet du site « {siteActif?.nom} » a été enregistré avec succès.
                    </Text>
                  </>
                ) : (
                  <>
                    <LinearGradient
                      colors={['#F97316', '#EA580C']}
                      style={styles.modalIconGradient}
                    >
                      <View style={styles.modalIconInner}>
                        <Icon name="clipboard-check-outline" size={28} color="#F97316" />
                      </View>
                    </LinearGradient>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Inventaire complet</Text>
                    <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                      Confirmer que l'inventaire complet du site{' '}
                      <Text style={{ fontWeight: '700', color: colors.textPrimary }}>« {siteActif?.nom} »</Text>{' '}
                      a été réalisé aujourd'hui ?
                    </Text>
                    <View style={[styles.recountInfoRow, { backgroundColor: isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.05)', borderColor: isDark ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.12)' }]}>
                      <Icon name="account" size={16} color="#F97316" />
                      <Text style={[styles.recountInfoText, { color: colors.textSecondary }]}>
                        {technicien ? toAbbreviation(`${technicien.prenom || ''} ${technicien.nom || ''}`, 3, '—') : '—'}
                      </Text>
                    </View>
                    <View style={[styles.recountInfoRow, { backgroundColor: isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.05)', borderColor: isDark ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.12)' }]}>
                      <Icon name="calendar-today" size={16} color="#F97316" />
                      <Text style={[styles.recountInfoText, { color: colors.textSecondary }]}>
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalBtnCancel, { borderColor: colors.borderMedium, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}
                        onPress={() => {
                          Vibration.vibrate(10);
                          setRecountModalVisible(false);
                        }}
                        activeOpacity={0.7}
                        disabled={recountLoading}
                      >
                        <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalBtnConfirm, recountLoading && { opacity: 0.7 }]}
                        onPress={() => {
                          Vibration.vibrate(15);
                          confirmRecount();
                        }}
                        activeOpacity={0.8}
                        disabled={recountLoading}
                      >
                        <LinearGradient
                          colors={['#F97316', '#EA580C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.modalBtnGradient}
                        >
                          {recountLoading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.modalBtnConfirmText}>Confirmer</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL LICENCE ===== */}
      <Modal
        visible={licenseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLicenseModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLicenseModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContainer, styles.licenseModalContainer, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={['#007A39', '#00A651']}
                  style={styles.modalIconGradient}
                >
                  <View style={styles.modalIconInner}>
                    <Icon name="license" size={26} color="#007A39" />
                  </View>
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Licence MIT</Text>
                <ScrollView
                  style={[styles.licenseScrollView, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.borderSubtle }]}
                  showsVerticalScrollIndicator
                >
                  <Text style={[styles.licenseText, { color: colors.textSecondary }]}>
{`MIT License

Copyright (c) ${new Date().getFullYear()} Florian JOVE GARCIA

Auteur et créateur : Florian JOVE GARCIA
Application : IT-Inventory (anciennement StockPro / GestStock IT)
Date de création : 2026

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`}
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.licenseCloseBtn}
                  onPress={() => {
                    Vibration.vibrate(10);
                    setLicenseModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#007A39', '#00A651']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.licenseCloseBtnGradient}
                  >
                    <Text style={styles.licenseCloseBtnText}>Fermer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ===== HEADER ===== (styles moved to SettingsHeaderBanner component)

  // ===== SECTIONS =====
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 0,
    gap: 10,
  },
  sectionAccentBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ===== CARD =====
  card: {
    borderRadius: 18,
    marginHorizontal: 0,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  // ===== ICON PILL =====
  iconPillContainer: {
    marginRight: 0,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillInner: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillFlat: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== CHEVRON PILL =====
  chevronPill: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== PROFIL =====
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarInner: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  profileMatricule: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  logoutIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== CARD ROW =====
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardHint: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  biometricActionButton: {
    marginTop: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  biometricActionGradient: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  biometricActionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#FFF',
  },
  biometricStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 6,
    marginLeft: 8,
  },
  biometricStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  biometricStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // ===== THEME SELECTOR =====
  themeSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 14,
    paddingLeft: 4,
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 13,
    gap: 6,
  },
  themeOptionActive: {
    borderRadius: 13,
  },
  themeIconPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  themeIconPillGradient: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIconPillInactive: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  themeActiveIndicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  themeHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ===== VERSION =====
  versionCard: {
    borderRadius: 18,
    marginHorizontal: 0,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  versionBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== CREATOR CARD =====
  creatorCard: {
    marginHorizontal: 0,
    marginBottom: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorAvatarPill: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorHeaderText: {
    flex: 1,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  creatorRole: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  creatorDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  creatorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  creatorInfoIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInfoText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    letterSpacing: 0.1,
  },

  // ===== LOGOUT CARD =====
  logoutCard: {
    marginHorizontal: 0,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ===== FOOTER =====
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.4,
  },

  // ===== MODALS =====
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    borderRadius: 28,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  modalIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconInner: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    letterSpacing: 0.1,
  },
  biometricInputWrap: {
    width: '100%',
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  biometricInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  biometricInputEye: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnConfirm: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalBtnConfirmDanger: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalBtnGradient: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ===== RECOUNT MODAL =====
  recountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    gap: 10,
  },
  recountInfoText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // ===== LICENSE MODAL =====
  licenseModalContainer: {
    maxHeight: '80%',
    paddingBottom: 20,
  },
  licenseScrollView: {
    width: '100%',
    maxHeight: 320,
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  licenseText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
    letterSpacing: 0.1,
  },
  licenseCloseBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  licenseCloseBtnGradient: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  licenseCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ===== SITE MODAL =====
  siteModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  siteModalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 24,
    overflow: 'hidden',
  },
  siteModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 0,
    zIndex: 10,
  },
  siteModalHero: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  siteModalHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  siteModalHeroIconInner: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteModalHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  siteModalHeroSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.1,
  },
  siteModalCloseFloat: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  siteModalList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  siteCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  siteCardIconInner: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  siteCardName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  siteCardStatus: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  siteCheckBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  siteRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 3,
  },
  siteModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
  },
  siteFooterIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#007A39' + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteModalFooterText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    flex: 1,
  },
  stockComplianceCard: {
    marginHorizontal: 0,
    marginVertical: 12,
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    overflow: 'hidden',
  },
  stockComplianceHero: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  stockComplianceGlowPrimary: {
    position: 'absolute',
    top: -38,
    right: -24,
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: 'rgba(0,166,81,0.12)',
  },
  stockComplianceGlowSecondary: {
    position: 'absolute',
    bottom: -34,
    left: -18,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  stockComplianceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  stockComplianceIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  stockComplianceHeroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  stockComplianceHeroIconInner: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockComplianceTitleBlock: {
    flex: 1,
  },
  stockComplianceEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stockComplianceTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  stockComplianceSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  stockComplianceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  stockComplianceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockComplianceStatusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  stockComplianceSnapshotRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  stockComplianceSnapshotMain: {
    flex: 1,
  },
  stockComplianceSnapshotValue: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  stockComplianceSnapshotLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
  },
  stockComplianceSitePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    maxWidth: '54%',
  },
  stockComplianceSiteText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockComplianceMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    marginBottom: 14,
  },
  stockComplianceMetricCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  stockComplianceMetricCardWide: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  stockComplianceMetricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stockComplianceMetricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  stockComplianceMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  stockComplianceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  stockComplianceActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  stockComplianceActionSecondaryText: {
    color: '#00A651',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.15,
  },
  stockComplianceActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 50,
    gap: 8,
  },
  stockComplianceActionPrimaryGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  stockComplianceActionPrimaryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.15,
    zIndex: 1,
  },
});

export default SettingsScreen;
