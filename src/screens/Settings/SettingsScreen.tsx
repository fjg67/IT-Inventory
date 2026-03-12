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
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@/store';
import { logoutTechnicien, setRedirectToTechnicianChoiceAfterLogout, selectIsSuperviseur, selectCurrentRole } from '@/store/slices/authSlice';
import { selectSite } from '@/store/slices/siteSlice';
import { APP_CONFIG } from '@/constants';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';
import type { ThemeMode } from '@/theme';
import { InventoryRecountService, InventoryRecount } from '@/services/inventoryRecountService';

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

// ==================== SETTINGS HEADER BANNER ====================
const SettingsHeaderBanner: React.FC<{
  initials: string;
  technicien: any;
  avatarGradient: [string, string] | string[];
  isDark: boolean;
}> = ({ initials, technicien, avatarGradient, isDark }) => {
  const { colors } = useTheme();

  const fullName = technicien
    ? `${technicien.prenom || ''} ${technicien.nom || ''}`.trim()
    : 'Utilisateur';

  return (
    <Animated.View entering={FadeInDown.duration(500).springify()}>
      <View style={[headerStyles.header, {
        backgroundColor: colors.surface,
        borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
      }]}>
        {/* Left accent bar */}
        <LinearGradient
          colors={['#6366F1', '#4338CA']}
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
                <Text style={[headerStyles.avatarText, { color: (avatarGradient as [string, string])[0] }]}>{initials}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Name */}
        <Text style={[headerStyles.name, { color: colors.textPrimary }]}>{initials}</Text>

        {/* Role badge */}
        <View style={headerStyles.roleRow}>
          <LinearGradient
            colors={technicien?.role === 'superviseur' ? ['#F59E0B', '#D97706'] : ['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 5 }}
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
    marginTop: 52,
    paddingTop: 28,
    paddingBottom: 24,
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
    shadowColor: '#6366F1',
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
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
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
  const { isTablet, contentMaxWidth } = useResponsive();
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Vibration.vibrate(10);
    if (siteActif?.id) {
      InventoryRecountService.getLastRecount(String(siteActif.id)).then(setLastRecount);
    }
    setTimeout(() => setRefreshing(false), 500);
  }, [siteActif?.id]);

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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundBase} />

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
        <SettingsHeaderBanner
          initials={initials}
          technicien={technicien}
          avatarGradient={avatarGradient}
          isDark={isDark}
        />

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
                    colors={isSuperviseur ? ['#F59E0B', '#D97706'] : ['#6366F1', '#4F46E5']}
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
        </View>

        {/* ===== SECTION INVENTAIRE (masqué pour superviseurs) ===== */}
        {!isSuperviseur && (
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
                    ? `${new Date(lastRecount.recountDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${new Date(lastRecount.recountDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\nPar ${lastRecount.technicianName} — ${lastRecount.siteName}`
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
        )}

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
                <View style={styles.iconPillInner}>
                  <Icon name="account-check" size={20} color="#4338CA" />
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

        {/* ===== DEV TOOLS ===== */}
        {__DEV__ && (
          <View>
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
                    <View style={styles.iconPillInner}>
                      <Icon name="database-remove-outline" size={20} color="#EF4444" />
                    </View>
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
          </View>
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
                  <View style={styles.modalIconInner}>
                    <Icon name="logout" size={28} color="#6366F1" />
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
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.siteModalHero}
                >
                  <View style={styles.siteModalHeroIcon}>
                    <View style={styles.siteModalHeroIconInner}>
                      <Icon name="map-marker-radius-outline" size={24} color="#6366F1" />
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
                            isActive && { backgroundColor: '#6366F1' + '12', borderColor: '#6366F1' },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleSelectSite(site.id as number)}
                        >
                          <LinearGradient
                            colors={isActive ? ['#6366F1', '#8B5CF6'] : visual.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.siteCardIcon}
                          >
                            <View style={styles.siteCardIconInner}>
                              <Icon name={visual.icon} size={18} color={isActive ? '#6366F1' : visual.gradient[0]} />
                            </View>
                          </LinearGradient>

                          <View style={styles.siteCardInfo}>
                            <Text style={[styles.siteCardName, { color: isActive ? '#6366F1' : colors.textPrimary }]}>{site.nom}</Text>
                            <Text style={[styles.siteCardStatus, { color: isActive ? '#6366F1' : colors.textMuted }]}>
                              {isActive ? 'Site actif' : 'Appuyez pour sélectionner'}
                            </Text>
                          </View>

                          {isActive ? (
                            <LinearGradient
                              colors={['#6366F1', '#8B5CF6']}
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
                    <Icon name="information-outline" size={14} color="#6366F1" />
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
                        {technicien ? `${(technicien.prenom || '?').charAt(0)}${(technicien.nom || '?').charAt(0)}`.toUpperCase() : '—'}
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
                  colors={['#4338CA', '#6366F1']}
                  style={styles.modalIconGradient}
                >
                  <View style={styles.modalIconInner}>
                    <Icon name="license" size={26} color="#4338CA" />
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

  // ===== HEADER ===== (styles moved to SettingsHeaderBanner component)

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
    shadowColor: '#6366F1',
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
    backgroundColor: '#6366F1' + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteModalFooterText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    flex: 1,
  },
});

export default SettingsScreen;
