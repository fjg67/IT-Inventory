// ============================================
// SETTINGS SCREEN - Premium Design
// IT-Inventory Application
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  RefreshControl,
  Vibration,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@/store';
import { logoutTechnicien, setRedirectToTechnicianChoiceAfterLogout } from '@/store/slices/authSlice';
import { selectSite } from '@/store/slices/siteSlice';
import { APP_CONFIG } from '@/constants';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';
import type { ThemeMode } from '@/theme';

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

// Site visual config
const SITE_VISUALS: Record<string, { icon: string; gradient: [string, string]; emoji: string }> = {
  'Stock 5ième': { icon: 'office-building', gradient: ['#3B82F6', '#2563EB'], emoji: '5' },
  'Stock 8ième': { icon: 'office-building-marker', gradient: ['#8B5CF6', '#6366F1'], emoji: '8' },
  'Stock Epinal': { icon: 'warehouse', gradient: ['#10B981', '#059669'], emoji: 'E' },
};

const getSiteVisual = (nom: string) => {
  return SITE_VISUALS[nom] || { icon: 'map-marker', gradient: ['#6B7280', '#4B5563'] as [string, string], emoji: '?' };
};

// ==================== SETTINGS SCREEN ====================
export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, isDark, theme, themeMode, setThemeMode, toggleTheme } = useTheme();

  const technicien = useAppSelector(state => state.auth.currentTechnicien);
  const siteActif = useAppSelector(state => state.site.siteActif);
  const sitesDisponibles = useAppSelector(state => state.site.sitesDisponibles);

  // Local states
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Vibration.vibrate(10);
    // Données Supabase : pas de sync locale, on laisse le temps au refresh visuel
    setTimeout(() => setRefreshing(false), 500);
  }, []);

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
          technicianId: null,
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

  const handleResetDatabase = useCallback(() => {
    Vibration.vibrate(15);
    Alert.alert(
      'Information',
      "L'application utilise uniquement Supabase. Il n'y a pas de base locale à réinitialiser.",
      [{ text: 'OK' }],
    );
  }, []);

  const showToast = useCallback((msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert('', msg);
    }
  }, []);

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

  // Sync status helpers removed (section deleted)

  const initials = technicien
    ? `${technicien.nom?.charAt(0) || ''}${technicien.prenom?.charAt(0) || ''}`.toUpperCase()
    : '??';

  const avatarGradient = technicien ? getAvatarGradient(technicien.id) : ['#6B7280', '#9CA3AF'];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'light-content'} backgroundColor={colors.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : {},
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
        {/* ===== HEADER PREMIUM ===== */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={['#4338CA', '#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Mesh decorative dots */}
            {[
              { top: 14, right: 28, s: 5, o: 0.14 },
              { top: 32, right: 65, s: 3, o: 0.10 },
              { top: 55, left: 22, s: 6, o: 0.12 },
              { top: 20, left: 55, s: 3, o: 0.08 },
              { bottom: 28, right: 42, s: 4, o: 0.11 },
              { bottom: 14, left: 38, s: 4, o: 0.13 },
              { top: 42, right: 18, s: 3, o: 0.09 },
              { bottom: 45, left: 62, s: 5, o: 0.07 },
            ].map((d, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: d.top,
                  bottom: d.bottom,
                  left: d.left,
                  right: d.right,
                  width: d.s,
                  height: d.s,
                  borderRadius: d.s / 2,
                  backgroundColor: `rgba(255,255,255,${d.o})`,
                }}
              />
            ))}

            {/* Avatar with glow ring */}
            <View style={styles.avatarGlowRing}>
              <LinearGradient
                colors={avatarGradient}
                style={styles.headerAvatar}
              >
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </LinearGradient>
            </View>

            {/* Name & Role */}
            <Text style={styles.headerName}>{initials}</Text>
            <View style={styles.headerRoleRow}>
              <View style={styles.headerRoleDot} />
              <Text style={styles.headerMatricule}>Technicien</Text>
            </View>

            {/* Glass badge */}
            <View style={styles.headerBadge}>
              <View style={styles.badgeIconPill}>
                <Icon name="lightning-bolt" size={11} color="#FBBF24" />
              </View>
              <Text style={styles.headerBadgeText}>Compte Actif</Text>
            </View>

            {/* Accent underline */}
            <View style={styles.headerUnderline} />
          </LinearGradient>
        </Animated.View>

        {/* ===== SECTION PROFIL ===== */}
        <Animated.View entering={SlideInRight.delay(100).springify().damping(18)}>
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
                <Text style={styles.miniAvatarText}>{initials}</Text>
              </LinearGradient>
              <View style={styles.profileTextCol}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {initials}
                </Text>
                <Text style={[styles.profileMatricule, { color: colors.textSecondary }]}>Technicien</Text>
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
        </Animated.View>

        {/* ===== SECTION SITE ===== */}
        <Animated.View entering={SlideInRight.delay(180).springify().damping(18)}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SITE ACTIF</Text>
          </View>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            activeOpacity={0.7}
            onPress={handleChangeSite}
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
                  <Icon
                    name={siteActif ? getSiteVisual(siteActif.nom).icon : 'map-marker-outline'}
                    size={20}
                    color="#FFF"
                  />
                </LinearGradient>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{siteActif?.nom ?? 'Non sélectionné'}</Text>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>Appuyez pour changer</Text>
              </View>
              <View style={[styles.chevronPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Icon name="chevron-right" size={18} color={colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ===== SECTION APPARENCE ===== */}
        <Animated.View entering={SlideInRight.delay(260).springify().damping(18)}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#8B5CF6' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPARENCE</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <Text style={[styles.themeSectionLabel, { color: colors.textPrimary }]}>Thème de l'application</Text>
            <View style={[styles.themeSelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.borderSubtle }]}>
              {([
                { mode: 'light' as ThemeMode, icon: 'weather-sunny', label: 'Clair', gradient: ['#F59E0B', '#FBBF24'] as [string, string] },
                { mode: 'dark' as ThemeMode, icon: 'moon-waning-crescent', label: 'Sombre', gradient: ['#6366F1', '#4338CA'] as [string, string] },
                { mode: 'system' as ThemeMode, icon: 'cellphone', label: 'Auto', gradient: ['#10B981', '#059669'] as [string, string] },
              ]).map((opt) => {
                const isActive = themeMode === opt.mode;
                return (
                  <TouchableOpacity
                    key={opt.mode}
                    style={[
                      styles.themeOption,
                      isActive && [styles.themeOptionActive, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)' }],
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
        </Animated.View>

        {/* ===== SECTION RGPD ===== */}
        <Animated.View entering={SlideInRight.delay(340).springify().damping(18)}>
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
                  {exporting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Icon name="file-export-outline" size={20} color="#FFF" />
                  )}
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
                  <Icon name="delete-outline" size={20} color="#FFF" />
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
        </Animated.View>

        {/* ===== SECTION À PROPOS ===== */}
        <Animated.View entering={SlideInRight.delay(420).springify().damping(18)}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccentBar, { backgroundColor: '#06B6D4' }]} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>À PROPOS</Text>
          </View>

          {/* Version */}
          <View style={[styles.versionCard, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)', borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)' }]}>
            <LinearGradient
              colors={['#6366F1', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.versionRow}>
              <View>
                <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>Version</Text>
                <Text style={[styles.versionNumber, { color: colors.primary }]}>{APP_CONFIG.version}</Text>
              </View>
              <View style={[styles.versionBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)' }]}>
                <Icon name="information-outline" size={16} color={colors.primary} />
              </View>
            </View>
          </View>

          {/* Créateur & Licence */}
          <View style={[styles.creatorCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <LinearGradient
              colors={['#4338CA', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccentStrip}
            />
            <View style={styles.creatorHeader}>
              <LinearGradient
                colors={['#4338CA', '#6366F1']}
                style={styles.creatorAvatarPill}
              >
                <Icon name="account-check" size={20} color="#FFF" />
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
              <View style={[styles.creatorInfoIcon, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)' }]}>
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
                  <Icon name="help-circle-outline" size={20} color="#FFF" />
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
        </Animated.View>

        {/* ===== DEV TOOLS ===== */}
        {__DEV__ && (
          <Animated.View entering={FadeInUp.delay(500).duration(400)}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionAccentBar, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DÉVELOPPEMENT</Text>
            </View>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              activeOpacity={0.7}
              onPress={handleResetDatabase}
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
                    <Icon name="database-remove-outline" size={20} color="#FFF" />
                  </LinearGradient>
                </View>
                <View style={styles.cardTextCol}>
                  <Text style={[styles.cardTitle, { color: colors.danger }]}>
                    Réinitialiser la base
                  </Text>
                  <Text style={[styles.cardHint, { color: colors.textMuted }]}>Debug uniquement</Text>
                </View>
                <View style={[styles.chevronPill, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)' }]}>
                  <Icon name="chevron-right" size={18} color={colors.danger} />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

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
                  colors={['#6366F1', '#4338CA']}
                  style={styles.modalIconGradient}
                >
                  <Icon name="logout" size={36} color="#FFF" />
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
                      colors={['#4338CA', '#6366F1']}
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
                  <Icon name="alert-outline" size={36} color="#FFF" />
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
                <View style={[styles.siteModalHandle, { backgroundColor: colors.textMuted }]} />

                {/* Header */}
                <View style={styles.siteModalHeader}>
                  <View>
                    <Text style={[styles.siteModalTitle, { color: colors.textPrimary }]}>Changer de site</Text>
                    <Text style={[styles.siteModalSubtitle, { color: colors.textSecondary }]}>
                      Sélectionnez votre espace de travail
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.siteModalClose, { backgroundColor: colors.surfaceInput }]}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setSiteModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Site cards */}
                <View style={styles.siteModalList}>
                  {sitesDisponibles.map((site, index) => {
                    const visual = getSiteVisual(site.nom);
                    const isActive = siteActif?.id === site.id;
                    return (
                      <Animated.View
                        key={site.id}
                        entering={FadeInUp.delay(index * 80).duration(300)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.siteCard,
                            { backgroundColor: colors.surfaceInput, borderColor: colors.borderSubtle },
                            isActive && { backgroundColor: colors.successBg, borderColor: colors.success, borderWidth: 2 },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleSelectSite(site.id as number)}
                        >
                          <LinearGradient
                            colors={visual.gradient}
                            style={styles.siteCardIcon}
                          >
                            <Icon name={visual.icon} size={24} color="#FFF" />
                          </LinearGradient>

                          <View style={styles.siteCardInfo}>
                            <Text style={[styles.siteCardName, { color: colors.textPrimary }]}>{site.nom}</Text>
                          </View>

                          {isActive ? (
                            <View style={styles.siteActiveBadge}>
                              <Icon name="check-circle" size={22} color={colors.success} />
                            </View>
                          ) : (
                            <View style={[styles.siteRadio, { borderColor: colors.textMuted }]} />
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* Info */}
                <View style={styles.siteModalFooter}>
                  <Icon name="information-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.siteModalFooterText, { color: colors.textMuted }]}>
                    Le site sélectionné détermine le stock affiché
                  </Text>
                </View>
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
                  colors={['#4338CA', '#6366F1']}
                  style={styles.modalIconGradient}
                >
                  <Icon name="license" size={32} color="#FFF" />
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
                    colors={['#4338CA', '#6366F1']}
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

  // ===== HEADER =====
  header: {
    paddingTop: 52,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  avatarGlowRing: {
    width: 92,
    height: 92,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 14,
  },
  headerAvatar: {
    width: 78,
    height: 78,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerAvatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  headerRoleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  headerMatricule: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeIconPill: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: 'rgba(251,191,36,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerUnderline: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 16,
  },

  // ===== SECTIONS =====
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 16,
    gap: 10,
  },
  sectionAccentBar: {
    width: 3,
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
    marginHorizontal: 16,
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
    width: 3,
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
  miniAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
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
    marginHorizontal: 16,
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
    marginHorizontal: 16,
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
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
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
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 20,
  },
  siteModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  siteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  siteModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  siteModalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  siteModalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteModalList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  siteCardActive: {
    borderWidth: 2,
  },
  siteCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  siteCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  siteCardName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  siteCardAddr: {
    fontSize: 13,
  },
  siteActiveBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 5,
  },
  siteModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
    gap: 6,
  },
  siteModalFooterText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default SettingsScreen;
