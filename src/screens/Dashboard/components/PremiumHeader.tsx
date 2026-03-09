import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumTypography,
  premiumShadows,
  premiumSpacing,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';
import { useAppSelector, useAppDispatch } from '@/store';
import { loginTechnicien } from '@/store/slices/authSlice';
import { Technicien } from '@/types';
import { useResponsive } from '@/utils/responsive';

interface PremiumHeaderProps {
  user: {
    firstName: string;
    lastName: string;
  };
  site: {
    name: string;
  } | null;
  syncStatus: 'synced' | 'syncing' | 'pending' | 'error' | 'idle';
  syncPendingCount?: number;
  isConnected: boolean;
  supabaseReachable?: boolean;
  onSiteChange: () => void;
}

const AVATAR_GRADIENTS: [string, string][] = [
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#6366F1'],
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

const getInitials = (t: Technicien): string =>
  `${(t.nom?.charAt(0) || '')}${(t.prenom?.charAt(0) || '')}`.toUpperCase() || '?';

const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  user,
  site,
  syncStatus: _syncStatus,
  syncPendingCount: _syncPendingCount = 0,
  isConnected: _isConnected,
  supabaseReachable: _supabaseReachable = false,
  onSiteChange,
}) => {
  const dispatch = useAppDispatch();
  const { isTablet, fs } = useResponsive();
  const { colors, isDark } = useTheme();
  const techniciens = useAppSelector((state) => state.auth.techniciens);
  const currentTechnicien = useAppSelector((state) => state.auth.currentTechnicien);
  const [showTechnicienModal, setShowTechnicienModal] = useState(false);

  const handleSelectTechnicien = useCallback(
    async (t: Technicien) => {
      if (t.id === currentTechnicien?.id) {
        setShowTechnicienModal(false);
        return;
      }
      Vibration.vibrate(10);
      try {
        await dispatch(loginTechnicien({ technicienId: t.id, persist: true })).unwrap();
        setShowTechnicienModal(false);
      } catch {
        // ignore
      }
    },
    [dispatch, currentTechnicien?.id],
  );

  const renderTechnicienItem = useCallback(
    ({ item, index }: { item: Technicien; index: number }) => {
      const gradient = getAvatarGradient(item.id);
      const isCurrent = item.id === currentTechnicien?.id;
      const initials = getInitials(item);
      return (
        <Animated.View entering={FadeInDown.duration(350).delay(index * 60)}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSelectTechnicien(item)}
            style={[
              styles.technicienRow,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
              isCurrent && {
                backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
              },
            ]}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.technicienAvatar}
            >
              <Text style={styles.technicienAvatarText}>{initials}</Text>
            </LinearGradient>
            <View style={styles.technicienInfo}>
              <Text style={[styles.technicienName, { color: colors.textPrimary }]}>
                {initials}
              </Text>
              <Text style={[styles.technicienRole, { color: colors.textMuted }]}>
                Technicien
              </Text>
            </View>
            {isCurrent ? (
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.checkBadge}
              >
                <Icon name="check" size={14} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={[styles.selectBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Icon name="chevron-right" size={18} color={colors.textMuted} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [currentTechnicien?.id, handleSelectTechnicien, colors, isDark],
  );

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  // Greeting based on time
  const { greetingText, greetingEmoji } = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return { greetingText: 'Bonne nuit', greetingEmoji: '🌙' };
    if (h < 12) return { greetingText: 'Bonjour', greetingEmoji: '👋' };
    if (h < 18) return { greetingText: 'Bon après-midi', greetingEmoji: '☀️' };
    return { greetingText: 'Bonsoir', greetingEmoji: '🌆' };
  }, []);

  // Formatted date
  const dateStr = useMemo(() => {
    const now = new Date();
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
  }, []);

  // Animated glow pulse
  const glowAnim = useSharedValue(0);
  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [glowAnim]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.4, 0.8]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [1, 1.15]) }],
  }));

  const statusDotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [0.9, 1.1]) }],
  }));

  return (
    <>
    <Animated.View
      entering={FadeInDown.duration(600).springify()}
      style={[styles.outerWrap, { borderColor: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)' }]}
    >
      <LinearGradient
        colors={isDark
          ? ['#0C0820', '#1A1050', '#2A1870', '#1A1050', '#0F0A2E']
          : ['#1E1B6E', '#312E81', '#4338CA', '#6366F1', '#4F46E5']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* ===== Decorative background ===== */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Large orb top-right */}
          <View style={[styles.orbLarge, { right: -40, top: -50 }]}>
            <LinearGradient
              colors={['rgba(167,139,250,0.35)', 'rgba(99,102,241,0.05)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
          {/* Medium orb center-left */}
          <View style={[styles.orbMedium, { left: 20, top: -20 }]}>
            <LinearGradient
              colors={['rgba(124,58,237,0.2)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          {/* Small accent orb bottom-left */}
          <View style={[styles.orbSmall, { left: -15, bottom: -15 }]}>
            <LinearGradient
              colors={['rgba(167,139,250,0.2)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          {/* Accent orb bottom-right */}
          <View style={[styles.orbSmall, { right: 30, bottom: -10 }]}>
            <LinearGradient
              colors={['rgba(59,130,246,0.15)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          {/* Light streak */}
          <View style={styles.lightStreak} />
          <View style={styles.lightStreak2} />
          {/* Dots texture */}
          {[
            { top: 14, right: 50, s: 3, o: 0.2 },
            { top: 8, right: 100, s: 2, o: 0.12 },
            { top: 30, right: 20, s: 2.5, o: 0.15 },
            { top: 22, left: 85, s: 2, o: 0.1 },
            { top: 6, left: 145, s: 3, o: 0.08 },
            { bottom: 18, right: 65, s: 2, o: 0.1 },
            { bottom: 10, left: 55, s: 2.5, o: 0.12 },
            { bottom: 30, right: 110, s: 1.5, o: 0.08 },
            { top: 40, left: 30, s: 1.5, o: 0.06 },
          ].map((d, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: (d as any).top,
                bottom: (d as any).bottom,
                right: (d as any).right,
                left: (d as any).left,
                width: d.s,
                height: d.s,
                borderRadius: d.s,
                backgroundColor: `rgba(255,255,255,${d.o})`,
              }}
            />
          ))}
        </View>

        {/* ===== Top Row: Date + Status ===== */}
        <View style={styles.topRow}>
          <View style={styles.dateWrap}>
            <Icon name="calendar-month-outline" size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <LinearGradient
            colors={['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusBadge}
          >
            <View style={styles.statusBadgeDot} />
            <Text style={styles.statusBadgeText}>En ligne</Text>
          </LinearGradient>
        </View>

        {/* ===== Main Row: Avatar + Info ===== */}
        <View style={styles.mainRow}>
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => {
              Vibration.vibrate(10);
              setShowTechnicienModal(true);
            }}
            activeOpacity={0.85}
          >
            <Animated.View style={[styles.avatarGlowRing, glowStyle]} />
            <View style={styles.avatarBorder}>
              <LinearGradient
                colors={['#FFFFFF', '#E8E0FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.avatar, isTablet && { width: 60, height: 60, borderRadius: 20 }]}
              >
                <Text style={[styles.avatarText, isTablet && { fontSize: fs(20) }]}>{initials}</Text>
              </LinearGradient>
            </View>
            {/* Online dot */}
            <Animated.View style={[styles.onlineDot, statusDotStyle]}>
              <View style={styles.onlineDotInner} />
            </Animated.View>
          </TouchableOpacity>

          {/* Greeting + Name */}
          <View style={styles.userInfo}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, isTablet && { fontSize: fs(18) }]}>
                {greetingText}
              </Text>
              <Text style={styles.waveEmoji}> {greetingEmoji}</Text>
            </View>
            <Text style={[styles.userName, isTablet && { fontSize: fs(18) }]} numberOfLines={1}>
              {initials}
            </Text>
          </View>

          {/* Switch profile icon */}
          <TouchableOpacity
            style={styles.switchProfileBtn}
            onPress={() => {
              Vibration.vibrate(10);
              setShowTechnicienModal(true);
            }}
            activeOpacity={0.7}
          >
            <Icon name="account-switch-outline" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* ===== Bottom Row: Site Pill ===== */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Vibration.vibrate(10);
              onSiteChange();
            }}
            style={styles.sitePill}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sitePillGradient}
            >
              <View style={styles.siteIconDot}>
                <Icon name="map-marker" size={10} color="#FFFFFF" />
              </View>
              <Text style={styles.siteName} numberOfLines={1}>
                {site?.name ?? 'Aucun site'}
              </Text>
              <Icon name="chevron-down" size={13} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>

      {/* Modal choix technicien */}
      <Modal
        visible={showTechnicienModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTechnicienModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowTechnicienModal(false)}>
            <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]} />
          </TouchableWithoutFeedback>
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />
            <View style={styles.modalHeaderRow}>
              <LinearGradient
                colors={['#4338CA', '#6366F1']}
                style={styles.modalIconWrap}
              >
                <Icon name="account-switch" size={20} color="#FFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Changer de profil</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Sélectionnez un profil technique
                </Text>
              </View>
            </View>
            <View style={[styles.modalDivider, { backgroundColor: colors.divider }]} />
            <FlatList
              data={techniciens}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTechnicienItem}
              style={styles.technicienListContainer}
              contentContainerStyle={styles.technicienListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Icon name="account-off-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.modalEmpty, { color: colors.textMuted }]}>Aucun autre profil disponible</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                Vibration.vibrate(10);
                setShowTechnicienModal(false);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4338CA', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalCloseBtnInner}
              >
                <Icon name="close" size={16} color="#FFF" />
                <Text style={styles.modalCloseText}>Fermer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    borderRadius: 28,
    borderWidth: 1.5,
    marginBottom: premiumSpacing.lg,
    overflow: 'hidden',
    ...premiumShadows.md,
    shadowColor: '#4338CA',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  container: {
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  // Decorative elements
  orbLarge: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  orbMedium: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
  },
  orbSmall: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  lightStreak: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  lightStreak2: {
    position: 'absolute',
    top: '70%',
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  // Top row: date + status
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  statusBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#6EE7B7',
    textTransform: 'uppercase',
  },

  // Main row: avatar + info
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  // Avatar
  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },
  avatarGlowRing: {
    position: 'absolute',
    top: -7,
    left: -7,
    right: -7,
    bottom: -7,
    borderRadius: 24,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  avatarBorder: {
    padding: 2.5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#4338CA',
    fontWeight: '900',
    fontSize: 19,
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDotInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#1E1B6E',
  },

  // User info
  userInfo: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },
  waveEmoji: {
    fontSize: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // Switch profile button
  switchProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Bottom row: site pill
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Site pill
  sitePill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sitePillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  siteIconDot: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  siteName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    maxWidth: 160,
  },

  // Modal styles (unchanged)
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: premiumSpacing.lg,
    paddingBottom: premiumSpacing.xl + 24,
    maxHeight: '70%',
    ...premiumShadows.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: premiumSpacing.sm,
  },
  modalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDivider: {
    height: 1,
    marginBottom: premiumSpacing.sm,
  },
  technicienListContainer: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: 340,
  },
  technicienListContent: {
    paddingVertical: premiumSpacing.xs,
    gap: 6,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: premiumSpacing.sm,
    marginBottom: premiumSpacing.md,
  },
  modalTitle: {
    ...premiumTypography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  technicienRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  technicienAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  technicienAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  technicienInfo: {
    flex: 1,
  },
  technicienName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  technicienRole: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: premiumSpacing.xl,
    gap: 8,
  },
  modalEmpty: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalCloseBtn: {
    marginTop: premiumSpacing.md,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalCloseBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderRadius: 14,
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PremiumHeader;
