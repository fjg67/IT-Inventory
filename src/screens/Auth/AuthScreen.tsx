// ============================================
// AUTH SCREEN - Premium Profile Selection
// IT-Inventory - Interface Premium
// ============================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TextInput,
  Vibration,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadTechniciens, loadTechniciensBySite, loginTechnicien } from '@/store/slices/authSlice';
import { FullScreenLoading } from '@/components';
import { Technicien } from '@/types';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';
import { SUPABASE_CONFIG } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== HELPERS ====================
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

const getInitials = (technicien: Technicien): string => {
  const p = technicien.prenom?.charAt(0) || '';
  const n = technicien.nom?.charAt(0) || '';
  return `${p}${n}`.toUpperCase();
};

// ==================== BACKGROUND BLOBS ====================
const { height: SCREEN_H } = Dimensions.get('window');
const BLOBS = [
  { size: 320, x: -80, y: -60, colors: ['rgba(59,130,246,0.06)', 'rgba(59,130,246,0)'] as const },
  { size: 280, x: SCREEN_WIDTH - 100, y: SCREEN_H * 0.35, colors: ['rgba(99,102,241,0.05)', 'rgba(99,102,241,0)'] as const },
  { size: 200, x: -50, y: SCREEN_H * 0.65, colors: ['rgba(6,182,212,0.04)', 'rgba(6,182,212,0)'] as const },
];

// Decorative dots
const DOTS = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  size: 3 + Math.random() * 4,
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * SCREEN_H,
  opacity: 0.04 + Math.random() * 0.07,
  color: ['#3B82F6', '#6366F1', '#8B5CF6', '#06B6D4'][Math.floor(Math.random() * 4)],
}));

// ==================== MAIN AUTH SCREEN ====================
export const AuthScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const route = useRoute();
  const { isTablet } = useResponsive();
  const { colors, isDark } = useTheme();
  const params = (route.params ?? {}) as { rememberMe?: boolean; siteId?: string | number; parentSiteId?: string | number };
  const rememberMe = params.rememberMe ?? true;
  const siteId = params.siteId;
  const parentSiteId = params.parentSiteId;
  const { techniciens, isLoading, error } = useAppSelector(state => state.auth);
  const siteActif = useAppSelector(state => state.site.siteActif);

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPrenom, setNewPrenom] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newMatricule, setNewMatricule] = useState('');
  const [newRole, setNewRole] = useState<'TECHNICIAN' | 'superviseur'>('TECHNICIAN');
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Input focus states
  const [prenomFocused, setPrenomFocused] = useState(false);
  const [nomFocused, setNomFocused] = useState(false);
  const [matriculeFocused, setMatriculeFocused] = useState(false);

  // Validation
  const prenomError = useMemo(() => {
    if (newPrenom.length === 0) return '';
    if (newPrenom.trim().length < 2) return 'Au moins 2 caractères';
    return '';
  }, [newPrenom]);

  const nomError = useMemo(() => {
    if (newNom.length === 0) return '';
    if (newNom.trim().length < 2) return 'Au moins 2 caractères';
    return '';
  }, [newNom]);

  const isFormValid = useMemo(
    () =>
      newPrenom.trim().length >= 2 &&
      newNom.trim().length >= 2 &&
      !prenomError &&
      !nomError,
    [newPrenom, newNom, prenomError, nomError],
  );

  useEffect(() => {
    // If parentSiteId is set, load technicians from the parent site (shared across all sub-sites)
    const effectiveSiteId = parentSiteId || siteId;
    if (effectiveSiteId) {
      dispatch(loadTechniciensBySite(effectiveSiteId));
    } else {
      dispatch(loadTechniciens());
    }
  }, [dispatch, siteId, parentSiteId]);

  const handleSelectTechnicien = useCallback(
    async (technicien: Technicien) => {
      Vibration.vibrate(10);
      try {
        await dispatch(loginTechnicien({ technicienId: technicien.id, persist: rememberMe })).unwrap();
      } catch (err) {
        console.error('Erreur de connexion:', err);
      }
    },
    [dispatch],
  );

  const handleCreateTechnicien = useCallback(async () => {
    if (!isFormValid) return;

    setIsCreating(true);
    try {
      const siteName = siteActif?.nom ?? 'Non défini';
      const roleLabel = newRole === 'superviseur' ? 'Superviseur' : 'Technicien';
      const matriculeText = newMatricule.trim() || 'Non renseigné';
      const prenomTrimmed = newPrenom.trim();
      const nomTrimmed = newNom.trim();

      const emailSubject = `[IT-Inventory] Demande de création de profil – ${prenomTrimmed} ${nomTrimmed}`;

      const roleBg = newRole === 'superviseur' ? '#FEF3C7' : '#EEF2FF';
      const roleColor = newRole === 'superviseur' ? '#92400E' : '#4338CA';
      const roleIcon = newRole === 'superviseur' ? '👑' : '🔧';
      const initials = `${prenomTrimmed.charAt(0)}${nomTrimmed.charAt(0)}`.toUpperCase();

      const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#EEEDF5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px;">

    <!-- HEADER GRADIENT -->
    <div style="background:linear-gradient(135deg,#4338CA 0%,#6366F1 50%,#818CF8 100%);border-radius:20px 20px 0 0;padding:40px 32px 48px 32px;text-align:center;position:relative;">
      <div style="position:absolute;top:16px;right:24px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.08);"></div>
      <div style="position:absolute;bottom:-8px;left:32px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
      <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.15);margin:0 auto 16px auto;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:24px;line-height:56px;">📋</span>
      </div>
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 6px 0;letter-spacing:-0.3px;">Nouvelle demande de profil</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;font-weight:500;">IT-Inventory · ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <!-- AVATAR CARD -->
    <div style="background:#FFFFFF;margin-top:-20px;margin-left:24px;margin-right:24px;border-radius:16px;padding:20px;text-align:center;box-shadow:0 4px 24px rgba(67,56,202,0.12);position:relative;z-index:2;">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#818CF8);margin:0 auto 12px auto;line-height:64px;text-align:center;">
        <span style="color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:1px;">${initials}</span>
      </div>
      <p style="margin:0 0 2px 0;font-size:18px;font-weight:700;color:#111827;">${prenomTrimmed} ${nomTrimmed}</p>
      <p style="margin:0;font-size:13px;color:#9CA3AF;">Demande en attente de validation</p>
    </div>

    <!-- MAIN CONTENT -->
    <div style="background:#FFFFFF;border-radius:0 0 20px 20px;padding:28px 32px 32px 32px;">

      <p style="color:#6B7280;font-size:13px;margin:0 0 24px 0;text-align:center;line-height:1.5;">Une nouvelle demande de création de profil a été soumise depuis l'application mobile.</p>

      <!-- INFO ROWS -->
      <div style="background:#F9FAFB;border-radius:14px;padding:4px 0;overflow:hidden;">

        <div style="display:flex;padding:14px 20px;border-bottom:1px solid #F3F4F6;">
          <table style="width:100%;border-collapse:collapse;"><tr>
            <td style="width:40px;vertical-align:middle;"><span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#EEF2FF,#E0E7FF);border-radius:10px;text-align:center;line-height:36px;font-size:16px;">👤</span></td>
            <td style="vertical-align:middle;padding-left:12px;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Prénom</p>
              <p style="margin:2px 0 0 0;font-size:15px;color:#111827;font-weight:600;">${prenomTrimmed}</p>
            </td>
          </tr></table>
        </div>

        <div style="display:flex;padding:14px 20px;border-bottom:1px solid #F3F4F6;">
          <table style="width:100%;border-collapse:collapse;"><tr>
            <td style="width:40px;vertical-align:middle;"><span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#EEF2FF,#E0E7FF);border-radius:10px;text-align:center;line-height:36px;font-size:16px;">📛</span></td>
            <td style="vertical-align:middle;padding-left:12px;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Nom</p>
              <p style="margin:2px 0 0 0;font-size:15px;color:#111827;font-weight:600;">${nomTrimmed}</p>
            </td>
          </tr></table>
        </div>

        <div style="display:flex;padding:14px 20px;border-bottom:1px solid #F3F4F6;">
          <table style="width:100%;border-collapse:collapse;"><tr>
            <td style="width:40px;vertical-align:middle;"><span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#EEF2FF,#E0E7FF);border-radius:10px;text-align:center;line-height:36px;font-size:16px;">🔢</span></td>
            <td style="vertical-align:middle;padding-left:12px;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Matricule</p>
              <p style="margin:2px 0 0 0;font-size:15px;color:#111827;font-weight:600;font-family:'SF Mono',Menlo,monospace;">${matriculeText}</p>
            </td>
          </tr></table>
        </div>

        <div style="display:flex;padding:14px 20px;border-bottom:1px solid #F3F4F6;">
          <table style="width:100%;border-collapse:collapse;"><tr>
            <td style="width:40px;vertical-align:middle;"><span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,${newRole === 'superviseur' ? '#FEF9C3,#FEF3C7' : '#EEF2FF,#E0E7FF'});border-radius:10px;text-align:center;line-height:36px;font-size:16px;">${roleIcon}</span></td>
            <td style="vertical-align:middle;padding-left:12px;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Rôle demandé</p>
              <p style="margin:4px 0 0 0;"><span style="display:inline-block;background:${roleBg};color:${roleColor};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;">${roleLabel}</span></p>
            </td>
          </tr></table>
        </div>

        <div style="display:flex;padding:14px 20px;">
          <table style="width:100%;border-collapse:collapse;"><tr>
            <td style="width:40px;vertical-align:middle;"><span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-radius:10px;text-align:center;line-height:36px;font-size:16px;">📍</span></td>
            <td style="vertical-align:middle;padding-left:12px;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Site</p>
              <p style="margin:2px 0 0 0;font-size:15px;color:#111827;font-weight:600;">${siteName}</p>
            </td>
          </tr></table>
        </div>

      </div>

      <!-- ACTION BOX -->
      <div style="margin-top:24px;background:linear-gradient(135deg,#EEF2FF,#E0E7FF);border-radius:14px;padding:20px;text-align:center;border:1px solid #C7D2FE;">
        <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#4338CA;">⚡ Action requise</p>
        <p style="margin:0;font-size:13px;color:#6366F1;line-height:1.5;">Merci de créer ce profil dans la base de données Supabase.</p>
      </div>

      <!-- FOOTER -->
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #F3F4F6;text-align:center;">
        <p style="color:#C4C4C4;font-size:11px;margin:0 0 4px 0;">Envoyé automatiquement par</p>
        <p style="color:#9CA3AF;font-size:12px;font-weight:600;margin:0;">📱 IT-Inventory v1.8</p>
      </div>

    </div>
  </div>
</body>
</html>`.trim();

      const url = `${SUPABASE_CONFIG.url}/functions/v1/send-stock-alert-email`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        },
        body: JSON.stringify({
          to: 'florian.jove.garcia@gmail.com',
          subject: emailSubject,
          htmlContent: emailHtml,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Edge Function error:', errData);
        Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Réessayez plus tard.');
        setIsCreating(false);
        return;
      }

      Vibration.vibrate(20);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setIsModalVisible(false);
        setNewPrenom('');
        setNewNom('');
        setNewMatricule('');
        setNewRole('TECHNICIAN');
      }, 2000);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }, [isFormValid, newNom, newPrenom, newMatricule, newRole, siteActif]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setNewPrenom('');
    setNewNom('');
    setNewMatricule('');
    setNewRole('TECHNICIAN');
    setPrenomFocused(false);
    setNomFocused(false);
    setMatriculeFocused(false);
  }, []);

  // ==================== RENDER HELPERS ====================
  const renderTechnicien = useCallback(
    ({ item, index }: { item: Technicien; index: number }) => {
      const gradient = getAvatarGradient(item.id);
      return (
        <Animated.View entering={FadeInUp.delay(1000 + index * 120).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSelectTechnicien(item)}
            style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, shadowColor: isDark ? '#000' : '#64748B' }]}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileAvatar}
            >
              <Text style={styles.profileAvatarText}>
                {getInitials(item)}
              </Text>
            </LinearGradient>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {getInitials(item)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <LinearGradient
                  colors={item.role === 'superviseur' ? ['#F59E0B', '#D97706'] : ['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 }}
                >
                  <Icon name={item.role === 'superviseur' ? 'eye-outline' : 'wrench-outline'} size={11} color="#FFF" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 }}>
                    {item.role === 'superviseur' ? 'Superviseur' : 'Technicien'}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.profileChevron}>
              <Icon name="chevron-right" size={22} color={colors.primaryLight} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [handleSelectTechnicien],
  );

  const renderEmpty = useCallback(
    () => (
      <Animated.View entering={FadeIn.delay(1000).duration(600)} style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? colors.primaryGlow : '#EEF2FF', borderColor: isDark ? colors.primaryGlowStrong : '#E0E7FF' }]}>
          <Icon name="account-plus-outline" size={48} color={colors.primaryDark} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aucun profil trouvé</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Créez votre premier profil{'\n'}technicien pour commencer
        </Text>
        <TouchableOpacity
          style={[styles.emptyCta, { shadowColor: isDark ? '#000' : '#4F46E5' }]}
          onPress={() => {
            Vibration.vibrate(15);
            setIsModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#4F46E5', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyCtaGradient}
          >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="account-plus" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.emptyCtaText}>Créer un profil</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>Commencez maintenant</Text>
            </View>
            <Icon name="arrow-right" size={20} color="rgba(255,255,255,0.8)" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    ),
    [],
  );

  const renderFooter = useCallback(
    () =>
      techniciens.length > 0 ? (
        <Animated.View entering={FadeInUp.delay(1200 + techniciens.length * 120).duration(400)}>
          <TouchableOpacity
            style={[styles.addButton, { borderColor: isDark ? colors.primaryGlow : '#E0E7FF', backgroundColor: isDark ? colors.surfaceElevated : '#FAFBFF' }]}
            onPress={() => {
              Vibration.vibrate(10);
              setIsModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.addIconCircle, { backgroundColor: isDark ? colors.primaryGlow : '#EEF2FF' }]}>
              <Icon name="plus" size={22} color={colors.primaryDark} />
            </View>
            <Text style={[styles.addButtonText, { color: colors.primaryDark }]}>Ajouter un profil</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null,
    [techniciens.length],
  );

  // Helper for input border
  const getInputBorder = (focused: boolean, err: string) => {
    if (focused) return colors.secondary;
    if (err) return colors.danger;
    return isDark ? colors.borderStrong : '#E2E8F0';
  };

  if (isLoading && techniciens.length === 0 && !isCreating) {
    return <FullScreenLoading message="Chargement des profils..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundBase} />

      {/* Background decoration */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BLOBS.map((b, i) => (
          <LinearGradient
            key={i}
            colors={b.colors as unknown as string[]}
            style={{
              position: 'absolute',
              width: b.size,
              height: b.size,
              borderRadius: b.size / 2,
              left: b.x,
              top: b.y,
            }}
          />
        ))}
        {DOTS.map((d) => (
          <View
            key={d.id}
            style={{
              position: 'absolute',
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              left: d.x,
              top: d.y,
              opacity: d.opacity,
              backgroundColor: d.color,
            }}
          />
        ))}
      </View>

      {/* Logo */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        style={styles.headerSection}
      >
        <View style={[styles.logoBox, { shadowColor: colors.primaryDark }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>IT-Inventory</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(650).duration(500)}>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>Gestion de stock IT</Text>
        </Animated.View>

        {siteActif && (
          <Animated.View entering={FadeInUp.delay(720).duration(400)}>
            <View style={[styles.siteBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#EEF2FF', borderColor: isDark ? 'rgba(99,102,241,0.25)' : '#C7D2FE' }]}>
              <Icon name="map-marker" size={14} color={isDark ? '#818CF8' : '#6366F1'} />
              <Text style={[styles.siteBadgeText, { color: isDark ? '#A5B4FC' : '#4F46E5' }]}>{siteActif.nom}</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={ZoomIn.delay(800).duration(400)}>
          <LinearGradient
            colors={['transparent', isDark ? colors.primaryGlow : '#C7D2FE', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separator}
          />
        </Animated.View>
      </Animated.View>

      {/* Instruction */}
      <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.instructionWrap}>
        <View style={[styles.instructionDot, { backgroundColor: isDark ? colors.primaryGlow : '#C7D2FE' }]} />
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          {techniciens.length > 0
            ? 'Sélectionnez votre profil pour continuer'
            : 'Bienvenue sur IT-Inventory'}
        </Text>
        <View style={[styles.instructionDot, { backgroundColor: isDark ? colors.primaryGlow : '#C7D2FE' }]} />
      </Animated.View>

      {/* Erreur */}
      {error ? (
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.errorBanner, { backgroundColor: colors.dangerBg, borderColor: isDark ? colors.dangerBorder : '#FECACA' }]}>
          <Icon name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={[styles.errorBannerText, { color: colors.danger }]}>{error}</Text>
        </Animated.View>
      ) : null}

      {/* Liste profils */}
      <FlatList
        data={techniciens}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTechnicien}
        contentContainerStyle={[styles.list, isTablet && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 640, alignSelf: 'center' }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        {...(isTablet ? { numColumns: 2, columnWrapperStyle: { gap: 16 } } : {})}
      />

      {/* Version */}
      <View style={styles.footer}>
        <View style={[styles.footerBadge, { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' }]}>
          <Icon name="lock-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Données protégées et chiffrées</Text>
        </View>
        <Text style={[styles.versionText, { color: isDark ? colors.textMuted : '#CBD5E1' }]}>Version 1.0.0</Text>
      </View>

      {/* ===== MODAL CRÉATION ===== */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalWrapper}
            >
              <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                {/* Handle */}
                <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />

                {showSuccess ? (
                  /* ===== SUCCESS STATE ===== */
                  <Animated.View entering={ZoomIn.springify()} style={styles.successContainer}>
                    <View style={styles.successCircle}>
                      <Icon name="email-check-outline" size={44} color="#FFF" />
                    </View>
                    <Text style={[styles.successText, { color: colors.success }]}>Demande envoyée !</Text>
                    <Text style={[styles.successSubtext, { color: colors.textSecondary }]}>Votre demande sera traitée sous peu</Text>
                  </Animated.View>
                ) : (
                  /* ===== FORM ===== */
                  <>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity
                        onPress={() => {
                          Vibration.vibrate(10);
                          closeModal();
                        }}
                        style={[styles.closeBtn, { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' }]}
                        activeOpacity={0.7}
                      >
                        <Icon name="close" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Icon + Title centered */}
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                      <LinearGradient
                        colors={['#6366F1', '#4F46E5']}
                        style={{ width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
                      >
                        <Icon name="account-plus-outline" size={28} color="#FFF" />
                      </LinearGradient>
                      <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Demander un profil</Text>
                      <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Remplissez vos informations pour demander un accès
                      </Text>
                    </View>

                    {/* Input Prénom */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Prénom</Text>
                        <Text style={[styles.requiredStar, { color: colors.danger }]}> *</Text>
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            borderColor: getInputBorder(prenomFocused, prenomError),
                            borderWidth: prenomFocused ? 2 : 1.5,
                            backgroundColor: colors.surfaceInput,
                          },
                        ]}
                      >
                        <Icon name="account-outline" size={18} color={prenomFocused ? '#6366F1' : colors.textMuted} style={{ marginRight: 10 }} />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Ex: Jean"
                          placeholderTextColor={colors.textMuted}
                          value={newPrenom}
                          onChangeText={setNewPrenom}
                          onFocus={() => setPrenomFocused(true)}
                          onBlur={() => setPrenomFocused(false)}
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                        {newPrenom.trim().length >= 2 && !prenomError && (
                          <Icon name="check-circle" size={20} color={colors.success} />
                        )}
                        {prenomError ? (
                          <Icon name="close-circle" size={20} color={colors.danger} />
                        ) : null}
                      </View>
                      {prenomError ? (
                        <Text style={[styles.errorMsg, { color: colors.danger }]}>{prenomError}</Text>
                      ) : null}
                    </View>

                    {/* Input Nom */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Nom</Text>
                        <Text style={[styles.requiredStar, { color: colors.danger }]}> *</Text>
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            borderColor: getInputBorder(nomFocused, nomError),
                            borderWidth: nomFocused ? 2 : 1.5,
                            backgroundColor: colors.surfaceInput,
                          },
                        ]}
                      >
                        <Icon name="badge-account-horizontal-outline" size={18} color={nomFocused ? '#6366F1' : colors.textMuted} style={{ marginRight: 10 }} />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Ex: Dupont"
                          placeholderTextColor={colors.textMuted}
                          value={newNom}
                          onChangeText={setNewNom}
                          onFocus={() => setNomFocused(true)}
                          onBlur={() => setNomFocused(false)}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                        {newNom.trim().length >= 2 && !nomError && (
                          <Icon name="check-circle" size={20} color={colors.success} />
                        )}
                        {nomError ? (
                          <Icon name="close-circle" size={20} color={colors.danger} />
                        ) : null}
                      </View>
                      {nomError ? (
                        <Text style={[styles.errorMsg, { color: colors.danger }]}>{nomError}</Text>
                      ) : null}
                    </View>

                    {/* Input Matricule */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Matricule</Text>
                        <Text style={[styles.optionalTag, { color: colors.textMuted }]}>  Optionnel</Text>
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            borderColor: matriculeFocused ? colors.secondary : (isDark ? colors.borderStrong : '#E2E8F0'),
                            borderWidth: matriculeFocused ? 2 : 1.5,
                            backgroundColor: colors.surfaceInput,
                          },
                        ]}
                      >
                        <Icon name="identifier" size={18} color={matriculeFocused ? '#6366F1' : colors.textMuted} style={{ marginRight: 10 }} />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Ex: T-12345"
                          placeholderTextColor={colors.textMuted}
                          value={newMatricule}
                          onChangeText={setNewMatricule}
                          onFocus={() => setMatriculeFocused(true)}
                          onBlur={() => setMatriculeFocused(false)}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    {/* Role Selector */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Rôle demandé</Text>
                        <Text style={[styles.requiredStar, { color: colors.danger }]}> *</Text>
                      </View>
                      <View style={styles.roleRow}>
                        <TouchableOpacity
                          style={[
                            styles.roleCard,
                            { backgroundColor: colors.surfaceInput, borderColor: isDark ? colors.borderStrong : '#E2E8F0' },
                            newRole === 'TECHNICIAN' && styles.roleCardActive,
                          ]}
                          onPress={() => { setNewRole('TECHNICIAN'); Vibration.vibrate(8); }}
                          activeOpacity={0.7}
                        >
                          {newRole === 'TECHNICIAN' ? (
                            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.roleIconPill}>
                              <View style={styles.roleIconInner}>
                                <Icon name="wrench-outline" size={18} color="#6366F1" />
                              </View>
                            </LinearGradient>
                          ) : (
                            <View style={[styles.roleIconPlain, { backgroundColor: colors.background }]}>
                              <Icon name="wrench-outline" size={18} color={colors.textMuted} />
                            </View>
                          )}
                          <Text style={[styles.roleLabel, { color: newRole === 'TECHNICIAN' ? '#6366F1' : colors.textSecondary }]}>
                            Technicien
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.roleCard,
                            { backgroundColor: colors.surfaceInput, borderColor: isDark ? colors.borderStrong : '#E2E8F0' },
                            newRole === 'superviseur' && styles.roleCardActiveSuperviseur,
                          ]}
                          onPress={() => { setNewRole('superviseur'); Vibration.vibrate(8); }}
                          activeOpacity={0.7}
                        >
                          {newRole === 'superviseur' ? (
                            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.roleIconPill}>
                              <View style={styles.roleIconInner}>
                                <Icon name="shield-star-outline" size={18} color="#F59E0B" />
                              </View>
                            </LinearGradient>
                          ) : (
                            <View style={[styles.roleIconPlain, { backgroundColor: colors.background }]}>
                              <Icon name="shield-star-outline" size={18} color={colors.textMuted} />
                            </View>
                          )}
                          <Text style={[styles.roleLabel, { color: newRole === 'superviseur' ? '#D97706' : colors.textSecondary }]}>
                            Superviseur
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Boutons */}
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.cancelBtn, { borderColor: isDark ? colors.borderStrong : '#E2E8F0' }]}
                        onPress={() => {
                          Vibration.vibrate(10);
                          closeModal();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Annuler</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.submitBtn,
                          (!isFormValid || isCreating) && styles.submitBtnDisabled,
                        ]}
                        onPress={() => {
                          Vibration.vibrate(15);
                          handleCreateTechnicien();
                        }}
                        activeOpacity={0.8}
                        disabled={!isFormValid || isCreating}
                      >
                        <LinearGradient
                          colors={
                            isFormValid && !isCreating
                              ? ['#6366F1', '#4F46E5']
                              : isDark ? [colors.surfaceElevated, colors.surfaceElevated] : ['#94A3B8', '#64748B']
                          }
                          style={styles.submitBtnGradient}
                        >
                          {isCreating ? (
                            <>
                              <ActivityIndicator color="#FFF" size="small" />
                              <Text style={styles.submitBtnText}>Envoi...</Text>
                            </>
                          ) : (
                            <>
                              <Icon name="send" size={20} color="#FFF" />
                              <Text style={styles.submitBtnText}>Envoyer la demande</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header / Logo
  headerSection: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 8,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  siteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  siteBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    width: 160,
    height: 1.5,
    borderRadius: 1,
  },

  // Instruction
  instructionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  instructionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexGrow: 1,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    minHeight: 72,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
    minWidth: 0,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileMatricule: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  profileChevron: {
    marginLeft: 4,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCta: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 8,
  },
  emptyCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 18,
  },
  emptyCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 16,
    gap: 10,
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    width: '100%',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 0,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Inputs
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  requiredStar: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  errorMsg: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Buttons
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Success
  successContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
  },
  successSubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 6,
  },

  // Role selector
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  roleCardActive: {
    borderColor: '#6366F1',
    borderWidth: 2,
    backgroundColor: 'rgba(99,102,241,0.04)',
  },
  roleCardActiveSuperviseur: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: 'rgba(245,158,11,0.04)',
  },
  roleIconPill: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  roleIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconPlain: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AuthScreen;
