import React, { useEffect, useState, useCallback } from 'react';
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
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  SlideInRight,
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
  syncStatus,
  syncPendingCount: _syncPendingCount = 0,
  isConnected,
  supabaseReachable = false,
  onSiteChange,
}) => {
  const dispatch = useAppDispatch();
  const { isTablet, fs } = useResponsive();
  const { colors, gradients, isDark } = useTheme();
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

  // Sync pulse animation
  const syncPulse = useSharedValue(1);

  useEffect(() => {
    if (syncStatus === 'syncing' || syncStatus === 'pending') {
      syncPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      syncPulse.value = withTiming(1, { duration: 200 });
    }
  }, [syncStatus, syncPulse]);

  const syncPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: syncPulse.value }],
  }));

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const getSyncConfig = () => {
    if (!isConnected) {
      return { color: '#94A3B8', text: 'Hors ligne', icon: 'wifi-off' as const };
    }
    if (supabaseReachable) {
      return { color: '#10B981', text: 'Connecté', icon: 'cloud-check' as const };
    }
    return { color: '#F59E0B', text: 'Indisponible', icon: 'cloud-off-outline' as const };
  };

  const syncConfig = getSyncConfig();

  return (
    <Animated.View entering={SlideInRight.springify().damping(18)} style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      {/* Left accent strip */}
      <LinearGradient
        colors={[...gradients.avatar]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentStrip}
      />

      {/* Avatar */}
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => {
          Vibration.vibrate(10);
          setShowTechnicienModal(true);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.avatarGlow}>
          <LinearGradient
            colors={[...gradients.avatar]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.avatar, isTablet && { width: 56, height: 56, borderRadius: 16 }]}
          >
            <Text style={[styles.avatarText, isTablet && { fontSize: fs(18) }]}>{initials}</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>

      {/* User info */}
      <View style={styles.userInfo}>
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>
          Bonjour <Text style={{ fontSize: 16 }}>👋</Text>
        </Text>
        <TouchableOpacity
          style={[styles.siteSelector, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)' }]}
          onPress={() => {
            Vibration.vibrate(10);
            onSiteChange();
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.siteIconPill, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)' }]}>
            <Icon name="map-marker" size={10} color={colors.primary} />
          </View>
          <Text style={[styles.siteName, { color: colors.primary }]} numberOfLines={1}>
            {site?.name ?? 'Sélectionner'}
          </Text>
          <Icon name="chevron-down" size={14} color={colors.primary} style={{ opacity: 0.6 }} />
        </TouchableOpacity>
      </View>

      {/* Sync badge */}
      <Animated.View style={syncPulseStyle}>
        <View style={[styles.syncBadge, { backgroundColor: isDark ? `${syncConfig.color}18` : `${syncConfig.color}12` }]}>
          <View style={[styles.syncDot, { backgroundColor: syncConfig.color }]} />
          <Text style={[styles.syncText, { color: syncConfig.color }]} numberOfLines={1}>
            {syncConfig.text}
          </Text>
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 20,
    borderRadius: 18,
    borderWidth: 1,
    ...premiumShadows.sm,
    marginBottom: premiumSpacing.lg,
    overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarGlow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  siteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  siteIconPill: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteName: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 130,
    letterSpacing: -0.1,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
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
