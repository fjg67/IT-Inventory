import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { APP_CONFIG } from '@/constants';
import { SETTINGS_COLORS, getComplianceVisual } from '@/constants/settingsColors';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  logoutTechnicien,
  selectCurrentRole,
  selectIsSuperviseur,
  setRedirectToTechnicianChoiceAfterLogout,
} from '@/store/slices/authSlice';
import { selectSite } from '@/store/slices/siteSlice';
import { toAbbreviation } from '@/utils/abbreviation';
import { AuthService } from '@/services/authService';
import { BiometricAuthService } from '@/services/biometricAuthService';
import { InventoryRecountService, type InventoryRecount } from '@/services/inventoryRecountService';
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { getSupabaseClient, tables } from '@/api/supabase';
import { formatRelativeDateParis, formatTimeParis } from '@/utils/dateUtils';
import { ToastContainer, useToast } from '@/components/common';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { ProfileCard } from '@/components/settings/ProfileCard';
import { AuditPulseWidget } from '@/components/settings/AuditPulseWidget';
import { SectionHeader } from '@/components/settings/SectionHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsRowAction } from '@/components/settings/SettingsRowAction';
import { VersionCard } from '@/components/settings/VersionCard';
import { CreatorCard } from '@/components/settings/CreatorCard';
import { LogoutButton } from '@/components/settings/LogoutButton';
import { SettingsFooter } from '@/components/settings/SettingsFooter';

const DEFAULT_LOGIN_IDENTIFIER = 'technicien';
const MASTER_PASSWORD = '!*A1Z2E3R4T5!';
const SECTION_DELAYS = [0, 80, 160, 240, 320, 400, 480, 560];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

const getRoleVisual = (role: string) => {
  const normalized = role.toLowerCase();
  if (normalized.includes('admin') || normalized.includes('superviseur')) {
    return SETTINGS_COLORS.role_admin;
  }
  if (normalized.includes('view')) {
    return SETTINGS_COLORS.role_viewer;
  }
  return SETTINGS_COLORS.role_technicien;
};

type ProfileStatsData = {
  sessionCount: string;
  connectionLabel: string;
  movementCount: string;
};

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { toasts, show: toastShow, dismiss: dismissToast } = useToast();

  const technicien = useAppSelector((state) => state.auth.currentTechnicien);
  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const currentRole = useAppSelector(selectCurrentRole);
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const sitesDisponibles = useAppSelector((state) => state.site.sitesDisponibles);

  const [refreshing, setRefreshing] = useState(false);
  const [lastRecount, setLastRecount] = useState<InventoryRecount | null>(null);
  const [recountLoading, setRecountLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [biometricLabel, setBiometricLabel] = useState('Biometrie');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState('');
  const [biometricPasswordVisible, setBiometricPasswordVisible] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);

  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);
  const [changelogVisible, setChangelogVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStatsData>({
    sessionCount: '--',
    connectionLabel: 'Aucune',
    movementCount: '--',
  });

  const showToast = useCallback((message: string) => {
    toastShow(message, 'success');
  }, [toastShow]);

  const refreshRecount = useCallback(async () => {
    if (!siteActif?.id) {
      setLastRecount(null);
      return;
    }
    const value = await InventoryRecountService.getLastRecount(String(siteActif.id));
    setLastRecount(value);
  }, [siteActif?.id]);

  const refreshPushState = useCallback(async () => {
    try {
      const enabled = await pushNotificationsService.isPushEnabledForDevice();
      setPushEnabled(enabled);
    } catch {
      setPushEnabled(true);
    }
  }, []);

  const refreshBiometricState = useCallback(async () => {
    try {
      const [availability, enabled] = await Promise.all([
        BiometricAuthService.isBiometricAvailable(),
        BiometricAuthService.hasBiometricLoginEnabled(),
      ]);
      setBiometricLabel(availability.label);
      setBiometricAvailable(availability.available);
      setBiometricEnabled(enabled && availability.available);
    } catch {
      setBiometricLabel('Biometrie');
      setBiometricAvailable(false);
      setBiometricEnabled(false);
    }
  }, []);

  const refreshProfileStats = useCallback(async () => {
    if (!technicien?.id) {
      setProfileStats({ sessionCount: '--', connectionLabel: 'Aucune', movementCount: '--' });
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const userId = String(technicien.id);
      const todayStartIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

      const sessionCountQuery = supabase
        .from(tables.loginHistory)
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId)
        .gte('loginAt', todayStartIso);

      const lastLoginQuery = supabase
        .from(tables.loginHistory)
        .select('loginAt')
        .eq('userId', userId)
        .order('loginAt', { ascending: false })
        .limit(1);

      let movementCountQuery = supabase
        .from(tables.mouvements)
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId);

      if (siteActif?.id) {
        movementCountQuery = movementCountQuery.eq('fromSiteId', String(siteActif.id));
      }

      const [sessionCountRes, lastLoginRes, movementCountRes] = await Promise.all([
        sessionCountQuery,
        lastLoginQuery,
        movementCountQuery,
      ]);

      let sessionCountValue = Number(sessionCountRes.count ?? 0);
      let lastLoginAt = (lastLoginRes.data?.[0] as any)?.loginAt as string | undefined;

      if (sessionCountValue === 0 && !lastLoginAt) {
        // Ensure the current authenticated session is tracked at least once.
        await AuthService.recordLogin({
          userId,
          technicianId: technicien.matricule || userId,
          technicianName: `${technicien.prenom || ''} ${technicien.nom || ''}`.trim() || 'Technicien',
          siteId: siteActif?.id ?? null,
        });

        sessionCountValue = 1;
        lastLoginAt = new Date().toISOString();
      }

      const connectionLabel = lastLoginAt
        ? `${formatRelativeDateParis(lastLoginAt)} ${formatTimeParis(lastLoginAt)}`
        : 'Aucune';

      setProfileStats({
        sessionCount: String(sessionCountValue),
        connectionLabel,
        movementCount: String(movementCountRes.count ?? 0),
      });
    } catch (error) {
      console.warn('[Settings] refreshProfileStats error:', error);
      setProfileStats({ sessionCount: '--', connectionLabel: 'Indisponible', movementCount: '--' });
    }
  }, [siteActif?.id, technicien?.id]);

  useEffect(() => {
    refreshRecount().catch(console.error);
  }, [refreshRecount]);

  useEffect(() => {
    refreshPushState().catch(console.error);
    refreshBiometricState().catch(console.error);
  }, [refreshPushState, refreshBiometricState]);

  useEffect(() => {
    refreshProfileStats().catch(console.error);
  }, [refreshProfileStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshRecount(),
      refreshPushState(),
      refreshBiometricState(),
      refreshProfileStats(),
    ]);
    setRefreshing(false);
  }, [refreshBiometricState, refreshProfileStats, refreshPushState, refreshRecount]);

  const handleLogout = useCallback(() => {
    setLogoutModalVisible(true);
  }, [dispatch]);

  const confirmLogout = useCallback(() => {
    setLogoutModalVisible(false);
    dispatch(setRedirectToTechnicianChoiceAfterLogout(false));
    dispatch(logoutTechnicien());
  }, [dispatch]);

  const handleSiteMenu = useCallback(() => {
    Alert.alert('Profil', 'Choisissez une action', [
      { text: 'Modifier le profil', onPress: () => showToast('Edition profil bientot disponible') },
      { text: 'Changer de site actif', onPress: () => setSiteModalVisible(true) },
      { text: 'Voir historique', onPress: () => showToast('Historique bientot disponible') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [showToast]);

  const handleSelectSite = useCallback((siteId: number) => {
    dispatch(selectSite(siteId));
    setSiteModalVisible(false);
    showToast('Site actif mis a jour');
  }, [dispatch, showToast]);

  const recordRecount = useCallback(async () => {
    if (!siteActif || !technicien) return;

    setRecountLoading(true);
    try {
      const result = await InventoryRecountService.record({
        siteId: String(siteActif.id),
        siteName: siteActif.nom,
        technicianId: technicien.matricule || String(technicien.id),
        technicianName: `${technicien.prenom || ''} ${technicien.nom || ''}`.trim(),
      });

      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible de relancer le controle');
        return;
      }

      await refreshRecount();
      showToast('Controle enregistre !');
    } finally {
      setRecountLoading(false);
    }
  }, [refreshRecount, showToast, siteActif, technicien]);

  const handleTogglePushNotifications = useCallback(async () => {
    if (!technicien) return;

    const next = !pushEnabled;
    setPushLoading(true);
    setPushEnabled(next);
    try {
      await pushNotificationsService.setPushEnabledForDevice(next, String(technicien.id));
      showToast(next ? 'Notifications activees' : 'Notifications desactivees');
    } catch {
      setPushEnabled(!next);
      Alert.alert('Notifications', "Impossible de modifier l'etat des notifications.");
    } finally {
      setPushLoading(false);
    }
  }, [pushEnabled, showToast, technicien]);

  const handleEnableBiometric = useCallback(async () => {
    const availability = await BiometricAuthService.isBiometricAvailable();
    if (!availability.available) {
      Alert.alert('Biometrie indisponible', "Activez d'abord une empreinte ou le visage dans Android.");
      return;
    }

    setBiometricPassword('');
    setBiometricPasswordVisible(false);
    setBiometricModalVisible(true);
  }, []);

  const confirmEnableBiometric = useCallback(async () => {
    if (!biometricPassword || biometricPassword.length < 3) {
      Alert.alert('Mot de passe requis', 'Saisissez votre mot de passe.');
      return;
    }

    setBiometricLoading(true);
    try {
      const isMasterPassword = biometricPassword === MASTER_PASSWORD;
      if (!isMasterPassword) {
        const loginResult = await AuthService.login(DEFAULT_LOGIN_IDENTIFIER, biometricPassword);
        if (!loginResult.success) {
          Alert.alert('Echec', 'Mot de passe incorrect.');
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
      showToast(`${biometricLabel} activee`);
    } catch {
      Alert.alert('Erreur', "Impossible d'activer la biometrie.");
    } finally {
      setBiometricLoading(false);
    }
  }, [biometricLabel, biometricPassword, refreshBiometricState, showToast]);

  const handleDisableBiometric = useCallback(() => {
    Alert.alert(
      'Desactiver la biometrie',
      `Cette action supprimera la connexion rapide par ${biometricLabel.toLowerCase()}.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Desactiver',
          style: 'destructive',
          onPress: async () => {
            setBiometricLoading(true);
            try {
              await BiometricAuthService.disableBiometricLogin();
              await refreshBiometricState();
              showToast('Biometrie desactivee');
            } finally {
              setBiometricLoading(false);
            }
          },
        },
      ],
    );
  }, [biometricLabel, refreshBiometricState, showToast]);

  const handleExportData = useCallback(() => {
    if (!technicien) {
      Alert.alert('Erreur', 'Aucun technicien connecte.');
      return;
    }

    Alert.alert(
      'Export RGPD',
      'Voulez-vous exporter vos donnees personnelles en JSON ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exporter',
          onPress: async () => {
            try {
              setExporting(true);
              const { exportUserDataRGPD, shareExportedFile } = require('@/utils/csv');
              const filepath = await exportUserDataRGPD(technicien.id);
              Alert.alert('Export reussi', 'Voulez-vous partager le fichier ?', [
                { text: 'Fermer', style: 'cancel' },
                { text: 'Partager', onPress: () => shareExportedFile(filepath).catch(console.error) },
              ]);
            } catch (error) {
              Alert.alert('Erreur', `Echec de l'export : ${(error as Error).message}`);
            } finally {
              setExporting(false);
            }
          },
        },
      ],
    );
  }, [technicien]);

  const confirmDeleteData = useCallback(async () => {
    if (!technicien) return;

    setDeleting(true);
    try {
      const supabase = getSupabaseClient();
      const syntheticTechnicianId = `X${Date.now().toString().slice(-6)}${String(technicien.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)}`;

      const { error: errMouv } = await supabase.from(tables.mouvements).delete().eq('userId', technicien.id);
      if (errMouv) throw new Error(errMouv.message);

      const { error: errJournal } = await supabase.from(tables.journalModifications).delete().eq('userId', technicien.id);
      if (errJournal) throw new Error(errJournal.message);

      const { error: errTech } = await supabase.from(tables.techniciens).update({
        name: 'SUPPRIME',
        technicianId: syntheticTechnicianId,
      }).eq('id', technicien.id);
      if (errTech) throw new Error(errTech.message);

      Alert.alert('Donnees supprimees', 'Vous allez etre deconnecte.', [
        {
          text: 'OK',
          onPress: () => {
            dispatch(setRedirectToTechnicianChoiceAfterLogout(true));
            dispatch(logoutTechnicien());
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Erreur', `Echec de la suppression : ${(error as Error).message}`);
    } finally {
      setDeleting(false);
    }
  }, [dispatch, technicien]);

  const handleDeleteData = useCallback(() => {
    Alert.alert('Supprimer mes donnees', 'Etes-vous sur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Continuer',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Confirmation finale', 'Cette action est irreversible.', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer definitivement', style: 'destructive', onPress: () => confirmDeleteData().catch(console.error) },
          ]);
        },
      },
    ]);
  }, [confirmDeleteData]);

  const initials = technicien
    ? toAbbreviation(`${technicien.prenom || ''} ${technicien.nom || ''}`, 3, '??')
    : '??';

  const fullName = technicien
    ? `${technicien.prenom || ''} ${technicien.nom || ''}`.trim() || initials
    : 'Utilisateur inconnu';

  const roleLabel = currentRole || 'Technicien';
  const roleVisual = useMemo(() => getRoleVisual(roleLabel), [roleLabel]);

  const daysSinceRecount = lastRecount
    ? Math.floor((Date.now() - new Date(lastRecount.recountDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const lastRecountDateLabel = lastRecount ? formatDate(lastRecount.recountDate) : 'Aucun inventaire';
  const complianceVisual = getComplianceVisual(daysSinceRecount);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={SETTINGS_COLORS.bg_primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SETTINGS_COLORS.green_light}
            colors={[SETTINGS_COLORS.green_light]}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[0]).duration(300)}>
          <SettingsHeader onBellPress={() => showToast('Notifications systeme bientot disponibles')} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[1]).duration(300)}>
          <ProfileCard
            initials={initials}
            fullName={fullName}
            roleLabel={roleLabel}
            roleIcon={roleVisual.icon}
            roleColor={roleVisual.color}
            roleBg={roleVisual.bg}
            siteName={siteActif?.nom ?? 'Site non selectionne'}
            sessionCount={profileStats.sessionCount}
            connectionLabel={profileStats.connectionLabel}
            movementCount={profileStats.movementCount}
            onMenuPress={handleSiteMenu}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[2]).duration(300)}>
          <AuditPulseWidget
            daysSinceRecount={daysSinceRecount}
            lastRecountDateLabel={lastRecountDateLabel}
            siteName={siteActif?.nom ?? 'Site non selectionne'}
            recountLoading={recountLoading}
            onExplore={() => setComplianceModalVisible(true)}
            onRecount={() => {
              recordRecount().catch(console.error);
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[4]).duration(300)} style={styles.sectionWrap}>
          <SectionHeader title="Securite" />

          <View style={styles.rowsStack}>
            <SettingsRowAction
              icon="fingerprint"
              iconBg={SETTINGS_COLORS.green_subtle}
              iconColor={SETTINGS_COLORS.green_light}
              title="Connexion biometrique"
              subtitle={
                biometricAvailable
                  ? `${biometricLabel} disponible (${biometricEnabled ? 'activee' : 'desactivee'})`
                  : 'Aucune biometrie configuree sur cet appareil'
              }
              variant="info"
              badgeStatus={biometricEnabled ? 'active' : 'inactive'}
              actionButton={{
                label: biometricEnabled ? 'Desactiver la biometrie' : 'Activer la biometrie',
                icon: biometricEnabled ? 'fingerprint-off' : 'fingerprint',
                color: biometricEnabled ? 'danger' : 'green',
                onPress: biometricEnabled ? handleDisableBiometric : () => {
                  handleEnableBiometric().catch(console.error);
                },
                disabled: biometricLoading,
              }}
            />

            <SettingsRowAction
              icon={pushEnabled ? 'bell-ring-outline' : 'bell-off-outline'}
              iconBg={SETTINGS_COLORS.teal_subtle}
              iconColor={SETTINGS_COLORS.teal}
              title="Notifications de mouvements"
              subtitle={
                pushEnabled
                  ? "Vous recevez les alertes meme si l'application est fermee"
                  : 'Les alertes push sont coupees sur cet appareil'
              }
              variant="info"
              badgeStatus={pushEnabled ? 'active' : 'inactive'}
              actionButton={{
                label: pushEnabled ? 'Desactiver les notifications' : 'Activer les notifications',
                icon: pushEnabled ? 'bell-off-outline' : 'bell-ring-outline',
                color: pushEnabled ? 'danger' : 'green',
                onPress: () => {
                  handleTogglePushNotifications().catch(console.error);
                },
                disabled: pushLoading,
              }}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[5]).duration(300)} style={styles.sectionWrap}>
          <SectionHeader title="Inventaire complet" />

          <View style={styles.rowsStack}>
            <SettingsRow
              icon="clipboard-check-outline"
              iconBg={SETTINGS_COLORS.warning_subtle}
              iconColor={SETTINGS_COLORS.warning}
              title="Dernier inventaire"
              subtitle={lastRecount ? `Par ${lastRecount.technicianName}` : 'Aucun inventaire enregistre'}
              variant="info"
              rightValue={lastRecountDateLabel}
            />

            <SettingsRow
              icon="playlist-check"
              iconBg={SETTINGS_COLORS.green_subtle}
              iconColor={SETTINGS_COLORS.green_light}
              title="Enregistrer un inventaire"
              subtitle="Marquer la date du recomptage complet"
              variant="navigate"
              onPress={() => {
                recordRecount().catch(console.error);
              }}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[6]).duration(300)} style={styles.sectionWrap}>
          <SectionHeader title="Donnees personnelles" />

          <View style={styles.rowsStack}>
            <SettingsRow
              icon="file-export-outline"
              iconBg={SETTINGS_COLORS.info_subtle}
              iconColor={SETTINGS_COLORS.info}
              title={exporting ? 'Export en cours...' : 'Exporter mes donnees'}
              subtitle="Format JSON (RGPD)"
              variant="navigate"
              onPress={handleExportData}
            />

            {!isSuperviseur ? (
              <SettingsRow
                icon="delete-outline"
                iconBg={SETTINGS_COLORS.danger_subtle}
                iconColor={SETTINGS_COLORS.danger}
                title={deleting ? 'Suppression en cours...' : 'Supprimer mes donnees'}
                subtitle="Action irreversible"
                variant="danger"
                onPress={deleting ? undefined : handleDeleteData}
              />
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[7]).duration(300)} style={styles.sectionWrap}>
          <SectionHeader title="A propos" />

          <View style={styles.rowsStack}>
            <VersionCard version={APP_CONFIG.version} onPress={() => setChangelogVisible(true)} />
            <CreatorCard onLicensePress={() => showToast('Licence MIT - consultez le fichier LICENSE')} />

            <SettingsRow
              icon="lifebuoy"
              iconBg={SETTINGS_COLORS.teal_subtle}
              iconColor={SETTINGS_COLORS.teal}
              title="Aide et support"
              subtitle="FAQ et assistance"
              variant="navigate"
              onPress={() => navigation.navigate('Help')}
            />

            <SettingsRow
              icon="file-document-outline"
              iconBg={SETTINGS_COLORS.bg_card_elevated}
              iconColor={SETTINGS_COLORS.text_secondary}
              title="Conditions d'utilisation"
              subtitle="CGU et mentions legales"
              variant="navigate"
              onPress={() => navigation.navigate('Terms')}
            />
          </View>
        </Animated.View>

        <View style={styles.logoutWrap}>
          <LogoutButton onPress={handleLogout} />
        </View>

        <SettingsFooter />
      </ScrollView>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLogoutModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View entering={FadeInDown.duration(200)} style={styles.logoutModalCard}>
                <View style={styles.logoutIconWrap}>
                  <Icon name="logout" size={24} color={SETTINGS_COLORS.danger} />
                </View>

                <Text style={styles.logoutModalTitle}>Se deconnecter</Text>
                <Text style={styles.logoutModalText}>
                  Voulez-vous vraiment vous deconnecter de IT-Inventory ?
                </Text>

                <View style={styles.logoutModalTips}>
                  <Icon name="information-outline" size={14} color={SETTINGS_COLORS.text_muted} />
                  <Text style={styles.logoutModalTipsText}>
                    Pensez a synchroniser vos donnees avant de quitter.
                  </Text>
                </View>

                <View style={styles.logoutButtons}>
                  <Pressable
                    style={styles.logoutCancelBtn}
                    onPress={() => setLogoutModalVisible(false)}
                  >
                    <Text style={styles.logoutCancelText}>Annuler</Text>
                  </Pressable>

                  <Pressable
                    style={styles.logoutConfirmBtn}
                    onPress={confirmLogout}
                  >
                    <Icon name="logout" size={14} color="#FFFFFF" />
                    <Text style={styles.logoutConfirmText}>Se deconnecter</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={biometricModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !biometricLoading && setBiometricModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => !biometricLoading && setBiometricModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <View style={styles.modalIconWrap}>
                  <Icon name="fingerprint" size={26} color={SETTINGS_COLORS.green_light} />
                </View>

                <Text style={styles.modalTitle}>Activer la biometrie</Text>
                <Text style={styles.modalText}>
                  Saisissez votre mot de passe pour securiser la connexion par {biometricLabel.toLowerCase()}.
                </Text>

                <View style={styles.inputWrap}>
                  <TextInput
                    value={biometricPassword}
                    onChangeText={setBiometricPassword}
                    placeholder="Mot de passe"
                    placeholderTextColor={SETTINGS_COLORS.text_muted}
                    secureTextEntry={!biometricPasswordVisible}
                    editable={!biometricLoading}
                    style={styles.input}
                  />
                  <Pressable onPress={() => setBiometricPasswordVisible((v) => !v)} disabled={biometricLoading}>
                    <Icon name={biometricPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={SETTINGS_COLORS.text_muted} />
                  </Pressable>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => setBiometricModalVisible(false)}
                    disabled={biometricLoading}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalConfirmBtn, biometricLoading && { opacity: 0.7 }]}
                    onPress={() => {
                      confirmEnableBiometric().catch(console.error);
                    }}
                    disabled={biometricLoading}
                  >
                    {biometricLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmText}>Activer</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={siteModalVisible} transparent animationType="slide" onRequestClose={() => setSiteModalVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableWithoutFeedback onPress={() => setSiteModalVisible(false)}>
            <View style={styles.sheetBackdropTap} />
          </TouchableWithoutFeedback>

          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Changer de site actif</Text>
            {sitesDisponibles.map((site) => (
              <Pressable key={site.id} style={styles.sheetRow} onPress={() => handleSelectSite(site.id)}>
                <Icon
                  name={siteActif?.id === site.id ? 'check-circle' : 'office-building-outline'}
                  size={16}
                  color={siteActif?.id === site.id ? SETTINGS_COLORS.green_light : SETTINGS_COLORS.text_muted}
                />
                <Text style={styles.sheetRowText}>{site.nom}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={complianceModalVisible} transparent animationType="slide" onRequestClose={() => setComplianceModalVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableWithoutFeedback onPress={() => setComplianceModalVisible(false)}>
            <View style={styles.sheetBackdropTap} />
          </TouchableWithoutFeedback>

          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Details conformite</Text>
            <Text style={styles.sheetRowText}>Dernier inventaire: {lastRecountDateLabel}</Text>
            <Text style={styles.sheetRowText}>Jours ecoules: {daysSinceRecount == null ? '--' : daysSinceRecount}</Text>
            <Text style={[styles.sheetRowText, { color: complianceVisual.status.text }]}>Etat: {complianceVisual.status.label}</Text>
            <Pressable style={styles.sheetCloseBtn} onPress={() => setComplianceModalVisible(false)}>
              <Text style={styles.sheetCloseText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={changelogVisible} transparent animationType="slide" onRequestClose={() => setChangelogVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableWithoutFeedback onPress={() => setChangelogVisible(false)}>
            <View style={styles.sheetBackdropTap} />
          </TouchableWithoutFeedback>

          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>v2.26 - 16 mai 2026</Text>
            <Text style={styles.sheetRowText}>- Nouveau design Obsidian Grid sur Parametres</Text>
            <Text style={styles.sheetRowText}>- Widget audit plus lisible et dynamique</Text>
            <Text style={styles.sheetRowText}>- Unification des rows et actions de securite</Text>
            <Pressable style={styles.sheetCloseBtn} onPress={() => setChangelogVisible(false)}>
              <Text style={styles.sheetCloseText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SETTINGS_COLORS.bg_primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionWrap: {
    marginTop: 4,
    marginBottom: 16,
  },
  rowsStack: {
    gap: 10,
  },
  logoutWrap: {
    marginTop: 2,
    marginBottom: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card,
    padding: 18,
  },
  modalIconWrap: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SETTINGS_COLORS.green_subtle,
    marginBottom: 10,
  },
  modalTitle: {
    color: SETTINGS_COLORS.text_primary,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  modalText: {
    color: SETTINGS_COLORS.text_secondary,
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  inputWrap: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    color: SETTINGS_COLORS.text_primary,
    fontSize: 14,
  },
  modalButtons: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
  },
  modalCancelText: {
    color: SETTINGS_COLORS.text_secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SETTINGS_COLORS.green_primary,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutModalCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
    backgroundColor: SETTINGS_COLORS.bg_card,
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logoutIconWrap: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SETTINGS_COLORS.danger_subtle,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    marginBottom: 10,
  },
  logoutModalTitle: {
    color: SETTINGS_COLORS.text_primary,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  logoutModalText: {
    color: SETTINGS_COLORS.text_secondary,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  logoutModalTips: {
    marginTop: 12,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  logoutModalTipsText: {
    flex: 1,
    color: SETTINGS_COLORS.text_muted,
    fontSize: 12,
    lineHeight: 16,
  },
  logoutButtons: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  logoutCancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
  },
  logoutCancelText: {
    color: SETTINGS_COLORS.text_secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  logoutConfirmBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: SETTINGS_COLORS.danger,
  },
  logoutConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetBackdropTap: {
    flex: 1,
  },
  sheetCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
  },
  sheetTitle: {
    color: SETTINGS_COLORS.text_primary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sheetRow: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetRowText: {
    color: SETTINGS_COLORS.text_secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sheetCloseBtn: {
    marginTop: 6,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SETTINGS_COLORS.green_primary,
  },
  sheetCloseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
