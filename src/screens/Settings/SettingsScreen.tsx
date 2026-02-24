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
  Switch,
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
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@/store';
import { logoutTechnicien, setRedirectToTechnicianChoiceAfterLogout } from '@/store/slices/authSlice';
import { selectSite } from '@/store/slices/siteSlice';
import { APP_CONFIG } from '@/constants';
import { preferencesService } from '@/services/preferencesService';
import { useResponsive } from '@/utils/responsive';

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

const formatSyncDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Jamais';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ==================== SETTINGS SCREEN ====================
export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth } = useResponsive();

  const technicien = useAppSelector(state => state.auth.currentTechnicien);
  const siteActif = useAppSelector(state => state.site.siteActif);
  const sitesDisponibles = useAppSelector(state => state.site.sitesDisponibles);
  const { isConnected, supabaseReachable, syncStatus, pendingCount, lastSyncDate } = useAppSelector(
    state => state.network,
  );

  // Local states - préférences chargées depuis AsyncStorage
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [vibrations, setVibrations] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);

  // Charger les préférences au montage
  useEffect(() => {
    preferencesService.load().then((prefs) => {
      setDarkMode(prefs.darkMode);
      setNotifications(prefs.notifications);
      setVibrations(prefs.vibrations);
      setPrefsLoaded(true);
    });
  }, []);

  // ==================== ACTIONS ====================
  const handleLogout = useCallback(() => {
    Vibration.vibrate(15);
    setLogoutModalVisible(true);
  }, []);

  const confirmLogout = useCallback(() => {
    setLogoutModalVisible(false);
    dispatch(setRedirectToTechnicianChoiceAfterLogout(true));
    dispatch(logoutTechnicien());
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

  const handleForceSync = useCallback(async () => {
    // Données 100 % Supabase : pas de sync locale
    Alert.alert('Info', 'Les données sont lues directement depuis Supabase.');
  }, []);

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

  const handleToggleDarkMode = useCallback(async () => {
    Vibration.vibrate(10);
    const newVal = !darkMode;
    setDarkMode(newVal);
    await preferencesService.set('darkMode', newVal);
    showToast(newVal ? 'Thème sombre activé' : 'Thème clair activé');
  }, [darkMode, showToast]);

  const handleToggleNotifications = useCallback(async () => {
    Vibration.vibrate(10);
    const newVal = !notifications;
    setNotifications(newVal);
    await preferencesService.set('notifications', newVal);
    showToast(newVal ? 'Notifications activées' : 'Notifications désactivées');
  }, [notifications, showToast]);

  const handleToggleVibrations = useCallback(async () => {
    const newVal = !vibrations;
    // Vibrer une dernière fois si on désactive
    if (!newVal) {
      Vibration.vibrate(10);
    }
    setVibrations(newVal);
    await preferencesService.set('vibrations', newVal);
    // Vibrer pour confirmer si on active
    if (newVal) {
      Vibration.vibrate([0, 30, 50, 30]);
    }
    showToast(newVal ? 'Vibrations activées' : 'Vibrations désactivées');
  }, [vibrations, showToast]);

  // Sync status helpers
  const getSyncLabel = () => {
    switch (syncStatus) {
      case 'synced': return 'Synchronisé';
      case 'pending': return `${pendingCount} en attente`;
      case 'syncing': return 'En cours...';
      case 'error': return 'Erreur';
      default: return 'Inconnu';
    }
  };

  const getSyncBadgeColor = () => {
    switch (syncStatus) {
      case 'synced': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' };
      case 'error': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' };
      default: return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' };
    }
  };

  const initials = technicien
    ? `${technicien.nom?.charAt(0) || ''}${technicien.prenom?.charAt(0) || ''}`.toUpperCase()
    : '??';

  const avatarGradient = technicien ? getAvatarGradient(technicien.id) : ['#6B7280', '#9CA3AF'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

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
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* ===== HEADER PREMIUM ===== */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Avatar */}
            <LinearGradient
              colors={avatarGradient}
              style={styles.headerAvatar}
            >
              <Text style={styles.headerAvatarText}>{initials}</Text>
            </LinearGradient>

            {/* Nom et matricule */}
            <Text style={styles.headerName}>
              {initials}
            </Text>
            <Text style={styles.headerMatricule}>Technicien</Text>

            {/* Badge statut */}
            <View style={styles.headerBadge}>
              <Icon name="lightning-bolt" size={14} color="#FBBF24" />
              <Text style={styles.headerBadgeText}>Compte Actif</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ===== SECTION PROFIL ===== */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>PROFIL</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <LinearGradient
                colors={avatarGradient}
                style={styles.miniAvatar}
              >
                <Text style={styles.miniAvatarText}>{initials}</Text>
              </LinearGradient>
              <View style={styles.profileTextCol}>
                <Text style={styles.profileName}>
                  {initials}
                </Text>
                <Text style={styles.profileMatricule}>Technicien</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutIconBtn}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Icon name="logout" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ===== SECTION SITE ===== */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>SITE ACTIF</Text>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={handleChangeSite}
          >
            <View style={styles.cardRow}>
              <LinearGradient
                colors={siteActif ? getSiteVisual(siteActif.nom).gradient : ['#6B7280', '#4B5563']}
                style={styles.siteActiveIcon}
              >
                <Icon
                  name={siteActif ? getSiteVisual(siteActif.nom).icon : 'map-marker-outline'}
                  size={22}
                  color="#FFF"
                />
              </LinearGradient>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>{siteActif?.nom ?? 'Non sélectionné'}</Text>
                <Text style={styles.cardHint}>Appuyez pour changer de site</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ===== SECTION SYNCHRONISATION ===== */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>SYNCHRONISATION</Text>
          <View style={styles.card}>
            {/* État */}
            <View style={styles.syncRow}>
              <Text style={styles.syncLabel}>État</Text>
              <View style={[styles.syncBadge, { backgroundColor: getSyncBadgeColor().bg }]}>
                {syncStatus === 'synced' && (
                  <Icon name="check" size={14} color="#10B981" style={{ marginRight: 4 }} />
                )}
                {syncStatus === 'error' && (
                  <Icon name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.syncBadgeText, { color: getSyncBadgeColor().text }]}>
                  {getSyncLabel()}
                </Text>
              </View>
            </View>

            {/* Connexion */}
            <View style={styles.syncRow}>
              <Text style={styles.syncLabel}>Connexion</Text>
              <View
                style={[
                  styles.syncBadge,
                  {
                    backgroundColor: isConnected
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                  },
                ]}
              >
                <Icon
                  name={isConnected ? 'lightning-bolt' : 'wifi-off'}
                  size={14}
                  color={isConnected ? '#FBBF24' : '#EF4444'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.syncBadgeText,
                    {
                      color: !isConnected ? '#EF4444' : supabaseReachable ? '#10B981' : '#F59E0B',
                    },
                  ]}
                >
                  {!isConnected ? 'Hors ligne' : supabaseReachable ? 'Connecté' : 'Non connecté'}
                </Text>
              </View>
            </View>

            {/* Dernière sync */}
            <View style={styles.syncRow}>
              <Text style={styles.syncLabel}>Dernière sync</Text>
              <Text style={styles.syncValue}>{formatSyncDate(lastSyncDate)}</Text>
            </View>

            {/* Séparateur */}
            <View style={styles.divider} />

            {/* Bouton forcer sync */}
            <TouchableOpacity
              style={[styles.forceSyncBtn, syncing && styles.forceSyncBtnActive]}
              activeOpacity={0.7}
              onPress={handleForceSync}
              disabled={syncing || !isConnected}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
              ) : (
                <Icon name="sync" size={20} color={isConnected ? '#2563EB' : '#9CA3AF'} style={{ marginRight: 8 }} />
              )}
              <Text style={[styles.forceSyncText, !isConnected && { color: '#9CA3AF' }]}>
                {syncing ? 'Synchronisation...' : 'Forcer la synchronisation'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ===== SECTION PRÉFÉRENCES ===== */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <Text style={styles.sectionTitle}>PRÉFÉRENCES</Text>

          {/* Notifications */}
          <View style={styles.card}>
            <View style={styles.prefRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Icon name={notifications ? 'bell-ring-outline' : 'bell-off-outline'} size={22} color="#F59E0B" />
              </View>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefLabel}>Notifications</Text>
                <Text style={styles.prefHint}>{notifications ? 'Alertes email stock activées' : 'Alertes email désactivées'}</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Vibrations */}
          <View style={styles.card}>
            <View style={styles.prefRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Icon name={vibrations ? 'vibrate' : 'vibrate-off'} size={22} color="#3B82F6" />
              </View>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefLabel}>Vibrations</Text>
                <Text style={styles.prefHint}>{vibrations ? 'Retour haptique activé' : 'Retour haptique désactivé'}</Text>
              </View>
              <Switch
                value={vibrations}
                onValueChange={handleToggleVibrations}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Animated.View>

        {/* ===== SECTION RGPD ===== */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <Text style={styles.sectionTitle}>DONNÉES PERSONNELLES (RGPD)</Text>

          <TouchableOpacity
            style={[styles.card, exporting && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={handleExportData}
            disabled={exporting}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                {exporting ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Icon name="file-export-outline" size={22} color="#3B82F6" />
                )}
              </View>
              <Text style={styles.actionLabel}>
                {exporting ? 'Export en cours...' : 'Exporter mes données'}
              </Text>
              {!exporting && <Icon name="chevron-right" size={20} color="#D1D5DB" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={handleDeleteData}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Icon name="delete-outline" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Supprimer mes données</Text>
              <Icon name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ===== SECTION À PROPOS ===== */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)}>
          <Text style={styles.sectionTitle}>À PROPOS</Text>

          {/* Version */}
          <View style={styles.versionCard}>
            <Text style={styles.versionLabel}>Version de l'application</Text>
            <Text style={styles.versionNumber}>{APP_CONFIG.version}</Text>
          </View>

          {/* Créateur & Licence */}
          <View style={styles.creatorCard}>
            <View style={styles.creatorHeader}>
              <View style={styles.creatorAvatarCircle}>
                <Icon name="account-check" size={22} color="#FFF" />
              </View>
              <View style={styles.creatorHeaderText}>
                <Text style={styles.creatorName}>Florian JOVE GARCIA</Text>
                <Text style={styles.creatorRole}>Créateur & Développeur</Text>
              </View>
            </View>
            <View style={styles.creatorDivider} />
            <View style={styles.creatorInfoRow}>
              <Icon name="copyright" size={15} color="#9CA3AF" />
              <Text style={styles.creatorInfoText}>
                © {new Date().getFullYear()} Florian JOVE GARCIA — Tous droits réservés
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
              <Icon name="license" size={15} color="#2563EB" />
              <Text style={[styles.creatorInfoText, { color: '#2563EB', fontWeight: '500', textDecorationLine: 'underline' }]}>Licence MIT</Text>
              <Icon name="open-in-new" size={14} color="#2563EB" />
            </TouchableOpacity>
            <View style={styles.creatorInfoRow}>
              <Icon name="application-brackets-outline" size={15} color="#9CA3AF" />
              <Text style={styles.creatorInfoText}>IT-Inventory — Application mobile de gestion de stock</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              Vibration.vibrate(10);
              navigation.navigate('Help');
            }}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Icon name="help-circle-outline" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.actionLabel}>Aide et support</Text>
              <Icon name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              Vibration.vibrate(10);
              navigation.navigate('Terms');
            }}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                <Icon name="file-document-outline" size={22} color="#6B7280" />
              </View>
              <Text style={styles.actionLabel}>Conditions d'utilisation</Text>
              <Icon name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ===== DEV TOOLS ===== */}
        {__DEV__ && (
          <Animated.View entering={FadeInUp.delay(650).duration(400)}>
            <Text style={styles.sectionTitle}>DÉVELOPPEMENT</Text>
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={handleResetDatabase}
            >
              <View style={styles.cardRow}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Icon name="database-remove-outline" size={22} color="#EF4444" />
                </View>
                <Text style={[styles.actionLabel, { color: '#EF4444' }]}>
                  Réinitialiser la base de données
                </Text>
                <Icon name="chevron-right" size={20} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ===== BOUTON DÉCONNEXION ===== */}
        <Animated.View entering={FadeInUp.delay(700).duration(400)}>
          <TouchableOpacity
            style={styles.logoutCard}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <View style={styles.logoutIconCircle}>
              <Icon name="logout" size={22} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 IT-Inventory - Tous droits réservés</Text>
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
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <Animated.View entering={ZoomIn.springify()} style={styles.modalContainer}>
                <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                  <Icon name="logout" size={48} color="#2563EB" />
                </View>
                <Text style={styles.modalTitle}>Se déconnecter ?</Text>
                <Text style={styles.modalDescription}>
                  Vous devrez sélectionner à nouveau votre profil pour accéder à l'application.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalBtnCancel}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setLogoutModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalBtnCancelText}>Annuler</Text>
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
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.modalBtnGradient}
                    >
                      <Text style={styles.modalBtnConfirmText}>Déconnexion</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
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
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <Animated.View entering={ZoomIn.springify()} style={styles.modalContainer}>
                <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Icon name="alert-outline" size={48} color="#EF4444" />
                </View>
                <Text style={styles.modalTitle}>Supprimer mes données ?</Text>
                <Text style={styles.modalDescription}>
                  Cette action est irréversible. Vos mouvements, historique de modifications et données de profil seront anonymisés ou supprimés. Vous serez ensuite déconnecté.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalBtnCancel}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setDeleteModalVisible(false);
                    }}
                    activeOpacity={0.7}
                    disabled={deleting}
                  >
                    <Text style={styles.modalBtnCancelText}>Annuler</Text>
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
                      colors={['#F87171', '#EF4444']}
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
              </Animated.View>
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
          <View style={[styles.siteModalOverlay, isTablet && { justifyContent: 'center' as const, alignItems: 'center' as const }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.siteModalSheet, isTablet && { maxWidth: 540, width: '90%', borderRadius: 28 }]}>
                {/* Handle */}
                <View style={styles.siteModalHandle} />

                {/* Header */}
                <View style={styles.siteModalHeader}>
                  <View>
                    <Text style={styles.siteModalTitle}>Changer de site</Text>
                    <Text style={styles.siteModalSubtitle}>
                      Sélectionnez votre espace de travail
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.siteModalClose}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setSiteModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="close" size={20} color="#6B7280" />
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
                            isActive && styles.siteCardActive,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleSelectSite(site.id as number)}
                        >
                          {/* Icône site avec dégradé */}
                          <LinearGradient
                            colors={visual.gradient}
                            style={styles.siteCardIcon}
                          >
                            <Icon name={visual.icon} size={24} color="#FFF" />
                          </LinearGradient>

                          {/* Infos */}
                          <View style={styles.siteCardInfo}>
                            <Text style={styles.siteCardName}>{site.nom}</Text>
                          </View>

                          {/* Badge actif ou radio */}
                          {isActive ? (
                            <View style={styles.siteActiveBadge}>
                              <Icon name="check-circle" size={22} color="#10B981" />
                            </View>
                          ) : (
                            <View style={styles.siteRadio} />
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* Info */}
                <View style={styles.siteModalFooter}>
                  <Icon name="information-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.siteModalFooterText}>
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
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <Animated.View entering={ZoomIn.springify()} style={[styles.modalContainer, styles.licenseModalContainer]}>
                <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                  <Icon name="license" size={40} color="#2563EB" />
                </View>
                <Text style={styles.modalTitle}>Licence MIT</Text>
                <ScrollView style={styles.licenseScrollView} showsVerticalScrollIndicator>
                  <Text style={styles.licenseText}>
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
                    colors={['#3B82F6', '#2563EB']}
                    style={styles.licenseCloseBtnGradient}
                  >
                    <Text style={styles.licenseCloseBtnText}>Fermer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ===== HEADER =====
  header: {
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  headerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerAvatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerMatricule: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ===== SECTIONS =====
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 20,
  },

  // ===== CARD =====
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  // ===== PROFIL =====
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  profileMatricule: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== SITE ACTIVE ICON =====
  siteActiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  // ===== CARD ROW (Site, Actions) =====
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // ===== SYNC =====
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  syncLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  forceSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
  },
  forceSyncBtnActive: {
    opacity: 0.7,
  },
  forceSyncText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },

  // ===== PREFERENCES =====
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  prefHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // ===== ACTIONS =====
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 14,
  },

  // ===== VERSION =====
  versionCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
  },
  versionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },

  // ===== CREATOR CARD =====
  creatorCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.12)',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorHeaderText: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  creatorRole: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
    marginTop: 1,
  },
  creatorDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  creatorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  creatorInfoText: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#6B7280',
    flex: 1,
  },

  // ===== LOGOUT CARD =====
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 10,
  },
  logoutIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  // ===== FOOTER =====
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // ===== MODALS =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  modalIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalBtnConfirm: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalBtnConfirmDanger: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalBtnGradient: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  licenseText: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
  },
  licenseCloseBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  licenseCloseBtnGradient: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  licenseCloseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ===== SITE MODAL =====
  siteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  siteModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  siteModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
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
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  siteModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  siteModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
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
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  siteCardActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  siteCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  siteCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  siteCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  siteCardAddr: {
    fontSize: 13,
    color: '#6B7280',
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
    borderColor: '#D1D5DB',
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
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default SettingsScreen;
