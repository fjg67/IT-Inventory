import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadChildSites, loadSites, selectSite } from '@/store/slices/siteSlice';
import { FullScreenLoading } from '@/components';
import { siteRepository } from '@/database';
import { Site } from '@/types';
import { resolveSiteVisual } from '@/constants/siteConfig';
import {
  OnboardingFooter,
  OnboardingLayout,
  OnboardingLogo,
  ONBOARDING_COLORS,
  SiteCard,
} from '@/components/onboarding';

const getSiteSubtitle = (site: Site): string => {
  const rawAddress = (site.adresse ?? '').trim();
  if (!rawAddress) return 'Site de travail';

  const sanitized = rawAddress
    .replace(/\bprofil\s*(eb|bi)\b/gi, '')
    .replace(/\b(eb|bi)\b/gi, '')
    .replace(/\s*([,;|/\-])\s*/g, '$1 ')
    .replace(/^[,;|/\-]\s*|\s*[,;|/\-]$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return sanitized || 'Site de travail';
};

export const SiteSelectionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const rememberMe = route.params?.rememberMe ?? true;
  const branch = route.params?.branch as string | undefined;

  const { sitesDisponibles, childSites, isLoading } = useAppSelector((state) => state.site);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');
  const [newEdsNumber, setNewEdsNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [parentSiteId, setParentSiteId] = useState<string | number | null>(null);

  const displaySites = useMemo(
    () => (branch === 'strasbourg' ? childSites : sitesDisponibles),
    [branch, childSites, sitesDisponibles],
  );

  useEffect(() => {
    dispatch(loadSites()).then((result: any) => {
      if (branch !== 'strasbourg' || !result?.payload) return;

      const sites = result.payload as Site[];
      const parent = sites.find((site) => {
        const value = site.nom.toLowerCase();
        return value.includes('strasbourg') || value.includes('siege');
      });

      if (parent) {
        setParentSiteId(parent.id);
        dispatch(loadChildSites(parent.id));
      }
    });
  }, [branch, dispatch]);

  useEffect(() => {
    if (displaySites.length === 1) {
      const onlySite = displaySites[0];
      handleSelectSite(onlySite).catch(() => {});
    }
  }, [displaySites]);

  const handleAddSite = useCallback(async () => {
    const name = newSiteName.trim();
    if (!name) return;

    setIsCreating(true);
    try {
      const newId = await siteRepository.create({
        nom: name,
        code: name,
        adresse: newSiteAddress.trim() || undefined,
        edsNumber: newEdsNumber.trim() || undefined,
        actif: true,
      });

      setNewSiteName('');
      setNewSiteAddress('');
      setNewEdsNumber('');
      setShowAddModal(false);
      await dispatch(loadSites());

      if (branch === 'agences' && newId) {
        await dispatch(selectSite(newId)).unwrap();
        await AsyncStorage.setItem('lastSite', String(newId));
        navigation.navigate('Auth', { rememberMe, siteId: newId });
      }
    } catch (error) {
      console.warn('[SiteSelection] add site failed', error);
    } finally {
      setIsCreating(false);
    }
  }, [branch, dispatch, navigation, newEdsNumber, newSiteAddress, newSiteName, rememberMe]);

  const handleSelectSite = useCallback(
    async (site: Site) => {
      Vibration.vibrate(10);
      await dispatch(selectSite(site.id)).unwrap();
      await AsyncStorage.setItem('lastSite', String(site.id));
      await AsyncStorage.setItem('lastSiteName', site.nom);

      navigation.navigate('Auth', {
        rememberMe,
        siteId: site.id,
        ...(parentSiteId ? { parentSiteId } : {}),
      });
    },
    [dispatch, navigation, parentSiteId, rememberMe],
  );

  if (isLoading && displaySites.length === 0) {
    return <FullScreenLoading message="Chargement des sites..." />;
  }

  return (
    <OnboardingLayout step={2} totalSteps={3}>
      <StatusBar barStyle="light-content" backgroundColor={ONBOARDING_COLORS.bg_primary} />

      <OnboardingLogo />

      <Animated.View entering={FadeInDown.delay(180).duration(220)} style={styles.guidance}>
        <Icon name="map-marker" size={16} color={ONBOARDING_COLORS.text_secondary} />
        <Text style={styles.guidanceText}>Selectionnez votre site de travail</Text>
        <Icon name="map-marker" size={16} color={ONBOARDING_COLORS.text_secondary} />
      </Animated.View>

      {branch === 'agences' ? (
        <TouchableOpacity style={styles.addAgenceBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
          <Icon name="plus-circle-outline" size={17} color={ONBOARDING_COLORS.green_light} />
          <Text style={styles.addAgenceText}>Creer une agence</Text>
        </TouchableOpacity>
      ) : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {displaySites.map((site, index) => {
          const visual = resolveSiteVisual(site.nom);
          return (
            <View key={String(site.id)} style={styles.cardWrap}>
              <SiteCard
                title={site.nom}
                subtitle={getSiteSubtitle(site)}
                icon={visual.icon}
                color={visual.color}
                bg={visual.bg}
                delay={230 + index * 60}
                onPress={() => {
                  handleSelectSite(site).catch(() => {});
                }}
              />
            </View>
          );
        })}

        <OnboardingFooter />
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <TouchableWithoutFeedback onPress={() => !isCreating && setShowAddModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Nouvelle agence</Text>

                  <TextInput
                    value={newSiteName}
                    onChangeText={setNewSiteName}
                    placeholder="Nom de l'agence"
                    placeholderTextColor={ONBOARDING_COLORS.text_muted}
                    style={styles.input}
                    editable={!isCreating}
                  />

                  <TextInput
                    value={newSiteAddress}
                    onChangeText={setNewSiteAddress}
                    placeholder="Adresse"
                    placeholderTextColor={ONBOARDING_COLORS.text_muted}
                    style={styles.input}
                    editable={!isCreating}
                  />

                  <TextInput
                    value={newEdsNumber}
                    onChangeText={setNewEdsNumber}
                    placeholder="Numero EDS (optionnel)"
                    placeholderTextColor={ONBOARDING_COLORS.text_muted}
                    style={styles.input}
                    editable={!isCreating}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)} disabled={isCreating}>
                      <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.confirmBtn, (!newSiteName.trim() || isCreating) && styles.confirmBtnDisabled]}
                      onPress={() => {
                        handleAddSite().catch(() => {});
                      }}
                      disabled={!newSiteName.trim() || isCreating}
                    >
                      {isCreating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.confirmText}>Creer</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  guidance: {
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guidanceText: {
    color: ONBOARDING_COLORS.text_muted,
    fontSize: 14,
    fontWeight: '500',
  },
  addAgenceBtn: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_accent,
    backgroundColor: ONBOARDING_COLORS.green_subtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  addAgenceText: {
    color: ONBOARDING_COLORS.green_light,
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  cardWrap: {
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_subtle,
    backgroundColor: ONBOARDING_COLORS.bg_card,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    color: ONBOARDING_COLORS.text_primary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  input: {
    minHeight: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_subtle,
    backgroundColor: ONBOARDING_COLORS.bg_card_elevated,
    color: ONBOARDING_COLORS.text_primary,
    fontSize: 13,
    paddingHorizontal: 12,
  },
  modalButtons: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_subtle,
    backgroundColor: ONBOARDING_COLORS.bg_card_elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: ONBOARDING_COLORS.text_secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    backgroundColor: ONBOARDING_COLORS.green_primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default SiteSelectionScreen;