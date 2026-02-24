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
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumColors,
  premiumTypography,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
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
  /** True si Supabase a répondu récemment */
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

/**
 * Header premium avec avatar dégradé, statut sync animé et sélecteur de site
 */
const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  user,
  site,
  syncStatus,
  syncPendingCount = 0,
  isConnected,
  supabaseReachable = false,
  onSiteChange,
}) => {
  const dispatch = useAppDispatch();
  const { isTablet, fs } = useResponsive();
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
            style={[styles.technicienRow, isCurrent && styles.technicienRowCurrent]}
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
              <Text style={styles.technicienName}>
                {initials}
              </Text>
              <Text style={styles.technicienRole}>
                Technicien
              </Text>
            </View>
            {isCurrent ? (
              <View style={styles.checkBadge}>
                <Icon name="check" size={14} color={premiumColors.text.inverse} />
              </View>
            ) : (
              <View style={styles.selectBadge}>
                <Icon name="chevron-right" size={18} color={premiumColors.text.tertiary} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [currentTechnicien?.id, handleSelectTechnicien],
  );

  // Animation du badge sync (pulse)
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

  // Initiales de l'avatar
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  // Couleur et texte du statut : Hors ligne / Connecté à Supabase / Supabase indisponible
  const getSyncConfig = () => {
    if (!isConnected) {
      return { color: premiumColors.text.tertiary, text: 'Hors ligne', icon: 'wifi-off' as const };
    }
    if (supabaseReachable) {
      return { color: premiumColors.success.base, text: 'Connecté', icon: 'cloud-check' as const };
    }
    return { color: premiumColors.warning.base, text: 'Supabase indisponible', icon: 'cloud-off-outline' as const };
  };

  const syncConfig = getSyncConfig();

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.container}>
      {/* Avatar (cliquable → liste des techniciens du compte) */}
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => {
          Vibration.vibrate(10);
          setShowTechnicienModal(true);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[...premiumColors.gradients.avatar]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.avatar, isTablet && { width: 56, height: 56, borderRadius: 28 }]}
        >
          <Text style={[styles.avatarText, isTablet && { fontSize: fs(18) }]}>{initials}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Infos utilisateur */}
      <View style={styles.userInfo}>
        <Text style={styles.greeting}>
          Bonjour 👋
        </Text>
        <TouchableOpacity
          style={styles.siteSelector}
          onPress={() => {
            Vibration.vibrate(10);
            onSiteChange();
          }}
          activeOpacity={0.7}
        >
          <Icon
            name="map-marker"
            size={14}
            color={premiumColors.primary.base}
          />
          <Text style={styles.siteName} numberOfLines={1}>
            {site?.name ?? 'Sélectionner un site'}
          </Text>
          <Icon
            name="chevron-down"
            size={16}
            color={premiumColors.primary.base}
          />
        </TouchableOpacity>
      </View>

      {/* Badge sync */}
      <Animated.View style={syncPulseStyle}>
        <View
          style={[
            styles.syncBadge,
            { backgroundColor: syncConfig.color + '15' },
          ]}
        >
          <Icon
            name={syncConfig.icon}
            size={isTablet ? 20 : 16}
            color={syncConfig.color}
          />
          <Text
            style={[styles.syncText, { color: syncConfig.color }]}
            numberOfLines={1}
          >
            {syncConfig.text}
          </Text>
        </View>
      </Animated.View>

      {/* Modal choix technicien (même compte, même données de stock) */}
      <Modal
        visible={showTechnicienModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTechnicienModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowTechnicienModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconWrap}>
                <Icon name="account-switch" size={22} color={premiumColors.primary.base} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Changer de profil</Text>
                <Text style={styles.modalSubtitle}>
                  Sélectionnez un profil technique
                </Text>
              </View>
            </View>
            <View style={styles.modalDivider} />
            <FlatList
              data={techniciens}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTechnicienItem}
              style={styles.technicienListContainer}
              contentContainerStyle={styles.technicienListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Icon name="account-off-outline" size={40} color={premiumColors.text.tertiary} />
                  <Text style={styles.modalEmpty}>Aucun autre profil disponible</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                Vibration.vibrate(10);
                setShowTechnicienModal(false);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(37,99,235,0.08)', 'rgba(37,99,235,0.03)']}
                style={styles.modalCloseBtnInner}
              >
                <Icon name="close" size={18} color={premiumColors.primary.base} />
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
    paddingVertical: premiumSpacing.md,
    paddingHorizontal: premiumSpacing.lg,
    backgroundColor: premiumColors.surface,
    borderRadius: premiumBorderRadius.xl,
    ...premiumShadows.sm,
    marginBottom: premiumSpacing.lg,
  },
  avatarContainer: {
    marginRight: premiumSpacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...premiumShadows.md,
  },
  avatarText: {
    ...premiumTypography.bodyMedium,
    color: premiumColors.text.inverse,
    fontWeight: '700',
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
    marginRight: premiumSpacing.sm,
  },
  greeting: {
    ...premiumTypography.body,
    color: premiumColors.text.secondary,
  },
  userName: {
    ...premiumTypography.bodySemiBold,
    color: premiumColors.text.primary,
  },
  siteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  siteName: {
    ...premiumTypography.caption,
    color: premiumColors.primary.base,
    fontWeight: '500',
    maxWidth: 160,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: premiumSpacing.sm,
    paddingVertical: premiumSpacing.xs,
    borderRadius: premiumBorderRadius.full,
    gap: 4,
  },
  syncText: {
    ...premiumTypography.small,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: premiumColors.surface,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: premiumColors.primary.base + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: premiumColors.borderLight,
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
    backgroundColor: premiumColors.border,
    alignSelf: 'center',
    marginTop: premiumSpacing.sm,
    marginBottom: premiumSpacing.md,
  },
  modalTitle: {
    ...premiumTypography.h3,
    color: premiumColors.text.primary,
    marginBottom: 2,
  },
  modalSubtitle: {
    ...premiumTypography.small,
    color: premiumColors.text.tertiary,
  },
  technicienRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: premiumColors.background,
  },
  technicienRowCurrent: {
    backgroundColor: premiumColors.primary.base + '10',
    borderWidth: 1.5,
    borderColor: premiumColors.primary.base + '30',
  },
  technicienAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    ...premiumShadows.sm,
  },
  technicienAvatarText: {
    ...premiumTypography.bodySemiBold,
    color: premiumColors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  technicienInfo: {
    flex: 1,
  },
  technicienName: {
    ...premiumTypography.bodySemiBold,
    color: premiumColors.text.primary,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  technicienRole: {
    ...premiumTypography.small,
    color: premiumColors.text.tertiary,
    marginTop: 2,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: premiumColors.success.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...premiumShadows.sm,
  },
  selectBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: premiumColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: premiumSpacing.xl,
    gap: 8,
  },
  modalEmpty: {
    ...premiumTypography.caption,
    color: premiumColors.text.tertiary,
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
    gap: 8,
    borderRadius: 14,
  },
  modalCloseText: {
    ...premiumTypography.bodySemiBold,
    color: premiumColors.primary.base,
    fontSize: 15,
  },
});

export default PremiumHeader;
