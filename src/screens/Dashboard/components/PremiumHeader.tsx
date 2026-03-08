import React, { useState, useCallback, useEffect } from 'react';
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
  onSiteChange: _onSiteChange,
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
      style={[styles.outerWrap, { borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)' }]}
    >
      <LinearGradient
        colors={isDark
          ? ['#0F0A2E', '#1A1145', '#2D1B69', '#1E1250']
          : ['#312E81', '#4338CA', '#6366F1', '#7C3AED']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Decorative background layer */}
        <View style={StyleSheet.absoluteFill}>
          {/* Large ambient orb top-right */}
          <View style={[styles.orbLarge, { right: -30, top: -40 }]}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(99, 102, 241, 0.05)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
          {/* Small accent orb left */}
          <View style={[styles.orbSmall, { left: -15, bottom: -10 }]}>
            <LinearGradient
              colors={['rgba(167, 139, 250, 0.2)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          {/* Thin horizontal light streak */}
          <View style={styles.lightStreak} />
          {/* Scattered dots for texture */}
          {[
            { top: 12, right: 45, s: 3, o: 0.2 },
            { top: 8, right: 90, s: 2, o: 0.12 },
            { top: 28, right: 25, s: 2.5, o: 0.15 },
            { top: 20, left: 80, s: 2, o: 0.1 },
            { top: 6, left: 140, s: 3, o: 0.08 },
            { bottom: 15, right: 60, s: 2, o: 0.1 },
            { bottom: 8, left: 50, s: 2.5, o: 0.12 },
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

        {/* Main Content */}
        <View style={styles.contentRow}>
          {/* Avatar with glow */}
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

          {/* Info column */}
          <View style={styles.userInfo}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, isTablet && { fontSize: fs(18) }]}>
                Bonjour
              </Text>
              <Text style={styles.waveEmoji}> 👋</Text>
            </View>
            <Text style={[styles.userName, isTablet && { fontSize: fs(16) }]} numberOfLines={1}>
              {initials}
            </Text>

            {/* Site pill */}
            <View style={styles.sitePill}>
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sitePillGradient}
              >
                <View style={styles.siteIconDot}>
                  <Icon name="map-marker" size={9} color="#FFFFFF" />
                </View>
                <Text style={styles.siteName} numberOfLines={1}>
                  {site?.name ?? 'Aucun site'}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Right badge: Compte actif */}
          <View style={styles.statusBadgeWrap}>
            <LinearGradient
              colors={['rgba(16,185,129,0.25)', 'rgba(16,185,129,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.statusBadge}
            >
              <View style={styles.statusBadgeDot} />
              <Text style={styles.statusBadgeText}>Actif</Text>
            </LinearGradient>
          </View>
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
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: premiumSpacing.lg,
    overflow: 'hidden',
    ...premiumShadows.md,
    shadowColor: '#4338CA',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  container: {
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  // Decorative elements
  orbLarge: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
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
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Content
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Avatar
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatarGlowRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 22,
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
  },
  avatarBorder: {
    padding: 2.5,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 15,
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
    bottom: -1,
    right: -1,
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
    borderColor: '#312E81',
  },

  // User info
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.1,
  },
  waveEmoji: {
    fontSize: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Site pill
  sitePill: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    overflow: 'hidden',
  },
  sitePillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  siteIconDot: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  siteName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    maxWidth: 120,
  },

  // Status badge
  statusBadgeWrap: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#6EE7B7',
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
