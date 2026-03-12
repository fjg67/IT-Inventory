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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <LinearGradient
                  colors={item.role === 'superviseur' ? ['#F59E0B', '#D97706'] : ['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3 }}
                >
                  <Icon name={item.role === 'superviseur' ? 'eye-outline' : 'wrench-outline'} size={9} color="#FFF" />
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 }}>
                    {item.role === 'superviseur' ? 'Superviseur' : 'Technicien'}
                  </Text>
                </LinearGradient>
              </View>
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

  const statusDotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [0.9, 1.1]) }],
  }));

  return (
    <>
    <Animated.View
      entering={FadeInDown.duration(600).springify()}
      style={[styles.outerWrap, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}
    >
      {/* Left gradient accent bar */}
      <LinearGradient
        colors={['#6366F1', '#4338CA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />

      <View style={styles.container}>
        {/* ===== Top Row: Date + Status ===== */}
        <View style={styles.topRow}>
          <View style={styles.dateWrap}>
            <Icon name="calendar-month-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
          <LinearGradient
            colors={['#10B981', '#059669']}
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
            <View style={[styles.iconPillShadow, { shadowColor: '#6366F1' }]}>
              <LinearGradient
                colors={['#6366F1', '#4338CA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.avatar, isTablet && { width: 58, height: 58, borderRadius: 20 }]}
              >
                <View style={[styles.avatarInnerCircle, isTablet && { width: 36, height: 36, borderRadius: 12 }]}>
                  <Text style={[styles.avatarText, isTablet && { fontSize: fs(17) }]}>{initials}</Text>
                </View>
              </LinearGradient>
            </View>
            {/* Online dot */}
            <Animated.View style={[styles.onlineDot, statusDotStyle]}>
              <View style={[styles.onlineDotInner, { borderColor: colors.surface }]} />
            </Animated.View>
          </TouchableOpacity>

          {/* Greeting + Name */}
          <View style={styles.userInfo}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, { color: colors.textMuted }, isTablet && { fontSize: fs(18) }]}>
                {greetingText}
              </Text>
              <Text style={styles.waveEmoji}> {greetingEmoji}</Text>
            </View>
            <Text style={[styles.userName, { color: colors.textPrimary }, isTablet && { fontSize: fs(18) }]} numberOfLines={1}>
              {initials}
            </Text>
          </View>

          {/* Switch profile icon */}
          <TouchableOpacity
            style={[styles.switchProfileBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)' }]}
            onPress={() => {
              Vibration.vibrate(10);
              setShowTechnicienModal(true);
            }}
            activeOpacity={0.7}
          >
            <Icon name="account-switch-outline" size={18} color="#6366F1" />
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
              colors={['#6366F1', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sitePillGradient}
            >
              <View style={styles.siteIconDot}>
                <Icon name="map-marker" size={10} color="#6366F1" />
              </View>
              <Text style={styles.sitePillText} numberOfLines={1}>
                {site?.name ?? 'Aucun site'}
              </Text>
              <Icon name="chevron-down" size={13} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
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
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: premiumSpacing.lg + 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
  container: {
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingLeft: 22,
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
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  statusBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#FFFFFF',
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
  iconPillShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerCircle: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#4338CA',
    fontWeight: '900',
    fontSize: 14,
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
    letterSpacing: 0.2,
  },
  waveEmoji: {
    fontSize: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  // Switch profile button
  switchProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 7,
    borderRadius: 12,
  },
  siteIconDot: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  sitePillText: {
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
