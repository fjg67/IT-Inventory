import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadChildSites, loadSiblingSites, loadSites, selectSite } from '@/store/slices/siteSlice';
import { FullScreenLoading } from '@/components';
import { siteRepository } from '@/database';
import { articleRepository } from '@/database/repositories/articleRepository';
import { Site } from '@/types';
import { resolveSiteVisual } from '@/constants/siteConfig';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { isPCArticle } from '@/constants/pcStates';
import { CA_THEME } from '@/constants/caTheme';
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
  const startupMode = route.params?.startupMode === true;

  const { sitesDisponibles, childSites, isLoading, siteActif } = useAppSelector((state) => state.site);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');
  const [newEdsNumber, setNewEdsNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [parentSiteId, setParentSiteId] = useState<string | number | null>(null);
  const [startupStatsBySiteId, setStartupStatsBySiteId] = useState<Record<string, { articles: number; pcs: number }>>({});
  const [showStartupLoader, setShowStartupLoader] = useState(false);
  const startupLoaderStartRef = useRef<number | null>(null);

  const displaySites = useMemo(
    () => (branch === 'strasbourg' ? childSites : sitesDisponibles),
    [branch, childSites, sitesDisponibles],
  );

  const startupSites = useMemo(() => {
    if (!startupMode) {
      return childSites.length > 0 ? childSites : sitesDisponibles;
    }

    // In startup mode, never fallback to parent buckets (Agences / Strasbourg General).
    // Show concrete siblings/children when available, otherwise keep only the active site.
    if (childSites.length > 0) return childSites;
    return siteActif ? [siteActif] : [];
  }, [childSites, siteActif, sitesDisponibles, startupMode]);

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
    if (!startupMode || !siteActif?.id) return;

    // Startup picker should show concrete selectable sites (siblings or children).
    dispatch(loadSiblingSites(siteActif.id));
  }, [dispatch, siteActif?.id, startupMode]);

  useEffect(() => {
    if (!startupMode) {
      setShowStartupLoader(false);
      startupLoaderStartRef.current = null;
      return;
    }

    if (startupLoaderStartRef.current === null) {
      startupLoaderStartRef.current = Date.now();
    }

    const elapsed = Date.now() - (startupLoaderStartRef.current ?? Date.now());
    const minVisibleMs = 420;
    const remaining = Math.max(0, minVisibleMs - elapsed);
    const fallbackWait = childSites.length === 0 ? Math.max(0, 900 - elapsed) : 0;

    const timer = setTimeout(() => {
      setShowStartupLoader(false);
    }, Math.max(remaining, fallbackWait));

    return () => {
      clearTimeout(timer);
    };
  }, [childSites.length, startupMode]);

  useEffect(() => {
    if (!startupMode || startupSites.length === 0) return;

    let cancelled = false;

    const fetchSiteStats = async () => {
      const entries = await Promise.all(
        startupSites.map(async (site) => {
          try {
            let page = 0;
            const limit = 250;
            let hasMore = true;
            let totalArticles = 0;
            let pcCount = 0;

            // Fetch pages to compute accurate per-site PC counts
            while (hasMore && page < 50) {
              const result = await articleRepository.findAll(site.id, page, limit);
              if (page === 0) {
                totalArticles = result.total;
              }

              pcCount += result.data.filter((article) => isPCArticle(article)).length;
              hasMore = result.hasMore;
              page += 1;
            }

            return [String(site.id), { articles: totalArticles, pcs: pcCount }] as const;
          } catch {
            return [String(site.id), { articles: 0, pcs: 0 }] as const;
          }
        }),
      );

      if (!cancelled) {
        setStartupStatsBySiteId(Object.fromEntries(entries));
      }
    };

    fetchSiteStats().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [startupMode, startupSites]);

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

      if (startupMode) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        return;
      }

      navigation.navigate('Auth', {
        rememberMe,
        siteId: site.id,
        ...(parentSiteId ? { parentSiteId } : {}),
      });
    },
    [dispatch, navigation, parentSiteId, rememberMe, startupMode],
  );

  useEffect(() => {
    if (!startupMode && displaySites.length === 1) {
      handleSelectSite(displaySites[0]).catch(() => {});
    }
  }, [displaySites, handleSelectSite, startupMode]);

  if (!startupMode && isLoading && displaySites.length === 0) {
    return <FullScreenLoading message="Chargement des sites..." />;
  }

  if (startupMode) {
    return (
      <SafeAreaView style={styles.caStartupSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={CA_THEME.lightGray} />
        <View style={styles.caStartupContent}>
          <View style={styles.caBrandRow}>
            <View style={styles.caBrandIcon}><Icon name="leaf" size={22} color="#FFFFFF" /></View>
            <View><Text style={styles.caBrandTitle}>IT-Inventory</Text><Text style={styles.caBrandSubtitle}>GESTION DES ÉQUIPEMENTS</Text></View>
          </View>
          <Animated.View entering={FadeInDown.delay(80).duration(260)} style={styles.caWelcome}>
            <Text style={styles.caEyebrow}>BIENVENUE</Text>
            <Text style={styles.caTitle}>Sur quel site êtes-vous ?</Text>
            <Text style={styles.caSubtitle}>Choisissez le stock à consulter et gérer pour cette session.</Text>
          </Animated.View>
          {showStartupLoader ? (
            <View style={styles.caLoader}><ActivityIndicator size="small" color={CA_THEME.green} /><Text style={styles.caSubtitle}>Chargement des sites...</Text></View>
          ) : (
            <ScrollView contentContainerStyle={styles.caSiteList} showsVerticalScrollIndicator={false}>
              {startupSites.map((site, index) => {
                const visual = resolveSiteVisual(site.nom);
                const stats = startupStatsBySiteId[String(site.id)];
                return <Animated.View key={String(site.id)} entering={FadeInDown.delay(120 + index * 65).duration(260)}>
                  <TouchableOpacity activeOpacity={0.86} onPress={() => handleSelectSite(site).catch(() => {})} style={styles.caSiteCard}>
                    <View style={[styles.caSiteIcon, { backgroundColor: visual.bg }]}><Icon name={visual.icon} size={23} color={CA_THEME.green} /></View>
                    <View style={styles.caSiteInfo}><Text style={styles.caSiteName}>{site.nom}</Text><Text style={styles.caSiteAddress} numberOfLines={1}>{getSiteSubtitle(site)}</Text>{stats ? <Text style={styles.caSiteStats}>{stats.articles} articles · {stats.pcs} PC</Text> : null}</View>
                    <View style={styles.caSiteArrow}><Icon name="arrow-right" size={18} color={CA_THEME.green} /></View>
                  </TouchableOpacity>
                </Animated.View>;
              })}
              {startupSites.length === 0 ? <Text style={styles.caEmpty}>Aucun site disponible pour ce compte.</Text> : null}
            </ScrollView>
          )}
          <View style={styles.caFooter}><View style={styles.caStripeGold} /><View style={styles.caStripeLight} /><View style={styles.caStripeDark} /></View>
        </View>
      </SafeAreaView>
    );
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
  caStartupSafeArea: {
    flex: 1,
    backgroundColor: CA_THEME.lightGray,
  },
  caStartupContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
  },
  caBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 34,
  },
  caBrandIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: CA_THEME.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caBrandTitle: {
    color: CA_THEME.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  caBrandSubtitle: {
    color: CA_THEME.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  caWelcome: {
    marginBottom: 20,
    gap: 7,
  },
  caEyebrow: {
    color: CA_THEME.green,
    fontSize: 10,
    fontWeight: '800',
  },
  caTitle: {
    color: CA_THEME.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  caSubtitle: {
    color: CA_THEME.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  caLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  caSiteList: {
    gap: 10,
    paddingBottom: 18,
  },
  caSiteCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CA_THEME.borderGray,
    backgroundColor: '#FFFFFF',
  },
  caSiteIcon: {
    width: 46,
    height: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caSiteInfo: {
    flex: 1,
    minWidth: 0,
  },
  caSiteName: {
    color: CA_THEME.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  caSiteAddress: {
    color: CA_THEME.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  caSiteStats: {
    color: CA_THEME.green,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
  },
  caSiteArrow: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: CA_THEME.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caFooter: {
    height: 4,
    flexDirection: 'row',
    marginTop: 'auto',
    marginBottom: 10,
  },
  caStripeGold: { flex: 1, backgroundColor: '#FFD700' },
  caStripeLight: { flex: 1, backgroundColor: CA_THEME.greenLight },
  caStripeDark: { flex: 1, backgroundColor: CA_THEME.greenDark },
  caEmpty: {
    color: CA_THEME.textSecondary,
    textAlign: 'center',
    paddingVertical: 28,
  },
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
  startupSafeArea: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.bg_primary,
  },
  startupBgTop: {
    position: 'absolute',
    top: -100,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 140,
    backgroundColor: OBSIDIAN_COLORS.green_glow,
  },
  startupContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  startupBgBottom: {
    position: 'absolute',
    right: -110,
    bottom: -150,
    width: 300,
    height: 300,
    borderRadius: 180,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  startupLoaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  startupLoaderBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,125,112,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,125,112,0.28)',
  },
  startupLoaderTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  startupLoaderSubtitle: {
    color: 'rgba(229,231,235,0.76)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SiteSelectionScreen;