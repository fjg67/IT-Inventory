// ============================================
// SITE SELECTION SCREEN - IT-Inventory
// Premium site selection after login
// ============================================

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  Vibration,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadSites, selectSite, loadChildSites } from '@/store/slices/siteSlice';
import { FullScreenLoading } from '@/components';
import { siteRepository } from '@/database';
import { Site } from '@/types';
import { useTheme } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_H } = Dimensions.get('window');

// ==================== SITE ICONS & COLORS ====================
const SITE_CONFIGS: Record<string, { icon: string; gradient: [string, string]; emoji: string }> = {
  strasbourg: { icon: 'city-variant-outline', gradient: ['#3B82F6', '#1D4ED8'], emoji: '🏛️' },
  'siège': { icon: 'city-variant-outline', gradient: ['#3B82F6', '#1D4ED8'], emoji: '🏛️' },
  epinal: { icon: 'pine-tree', gradient: ['#10B981', '#059669'], emoji: '🌲' },
  'stock 5': { icon: 'archive-outline', gradient: ['#007A39', '#007A39'], emoji: '📦' },
  'stock 8': { icon: 'archive-outline', gradient: ['#F59E0B', '#D97706'], emoji: '📦' },
  tcs: { icon: 'tools', gradient: ['#EF4444', '#DC2626'], emoji: '🛠️' },
};

const DEFAULT_CONFIG = { icon: 'map-marker-outline', gradient: ['#8B5CF6', '#6D28D9'] as [string, string], emoji: '📍' };

const getSiteConfig = (siteName: string) => {
  const key = siteName.toLowerCase().trim();
  for (const [k, v] of Object.entries(SITE_CONFIGS)) {
    if (key.includes(k)) return v;
  }
  return DEFAULT_CONFIG;
};

const getSiteSubtitle = (site: Site): string => {
  const rawAddress = (site.adresse ?? '').trim();
  if (!rawAddress) return 'Site de travail';

  // Hide EB/BI profile labels from the card subtitle while keeping useful address text.
  const sanitized = rawAddress
    .replace(/\bprofil\s*(eb|bi)\b/gi, '')
    .replace(/\b(eb|bi)\b/gi, '')
    .replace(/\s*([,;|/\-])\s*/g, '$1 ')
    .replace(/^[,;|/\-]\s*|\s*[,;|/\-]$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return sanitized || 'Site de travail';
};

// ==================== DECORATIVE ELEMENTS ====================
const BLOBS = [
  { size: 300, x: -100, y: -40, colors: ['rgba(59,130,246,0.06)', 'rgba(59,130,246,0)'] as const },
  { size: 260, x: SCREEN_WIDTH - 80, y: SCREEN_H * 0.4, colors: ['rgba(16,185,129,0.05)', 'rgba(16,185,129,0)'] as const },
  { size: 180, x: -40, y: SCREEN_H * 0.7, colors: ['rgba(139,92,246,0.04)', 'rgba(139,92,246,0)'] as const },
];

const DOTS = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  size: 3 + Math.random() * 3,
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * SCREEN_H,
  opacity: 0.04 + Math.random() * 0.06,
  color: ['#3B82F6', '#10B981', '#8B5CF6', '#06B6D4'][Math.floor(Math.random() * 4)],
}));

// ==================== MAIN COMPONENT ====================
export const SiteSelectionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const params = (route.params ?? {}) as { rememberMe?: boolean; branch?: string };
  const rememberMe = params.rememberMe ?? true;
  const branch = params.branch;

  const { sitesDisponibles, childSites, isLoading } = useAppSelector(state => state.site);

  // For strasbourg branch, show child sites from DB; otherwise show top-level sites
  const displaySites = branch === 'strasbourg' ? childSites : sitesDisponibles;

  // Add site modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');
  const [newEdsNumber, setNewEdsNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [parentSiteId, setParentSiteId] = useState<string | number | null>(null);

  const handleAddSite = useCallback(async () => {
    const name = newSiteName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      const newId = await siteRepository.create({ nom: name, code: name, adresse: newSiteAddress.trim() || undefined, edsNumber: newEdsNumber.trim() || undefined, actif: true });
      if (branch === 'agences' && newId) {
        // Agences: après création, sélectionner et naviguer directement
        await dispatch(loadSites());
        await dispatch(selectSite(newId));
        setNewSiteName('');
        setNewSiteAddress('');
        setNewEdsNumber('');
        navigation.navigate('Auth', { rememberMe, siteId: newId });
      } else {
        setNewSiteName('');
        setNewSiteAddress('');
        setNewEdsNumber('');
        setShowAddModal(false);
        dispatch(loadSites());
      }
    } catch (e) {
      console.error('[SiteSelection] Erreur création site:', e);
    } finally {
      setIsCreating(false);
    }
  }, [newSiteName, newSiteAddress, newEdsNumber, dispatch, branch, navigation, rememberMe]);

  // Floating animation for the location pin
  const pinFloat = useSharedValue(0);

  useEffect(() => {
    pinFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinFloat.value * -6 }],
  }));

  useEffect(() => {
    dispatch(loadSites()).then((result) => {
      // If strasbourg branch, find the parent site and load its children
      if (branch === 'strasbourg' && result.payload) {
        const sites = result.payload as Site[];
        const parent = sites.find(s =>
          s.nom.toLowerCase().includes('strasbourg') || s.nom.toLowerCase().includes('siège'),
        );
        if (parent) {
          setParentSiteId(parent.id);
          dispatch(loadChildSites(parent.id));
        }
      }
    });
  }, [dispatch, branch]);

  const handleSelectSite = useCallback(
    async (site: Site) => {
      Vibration.vibrate(10);
      await dispatch(selectSite(site.id));
      navigation.navigate('Auth', {
        rememberMe,
        siteId: site.id,
        ...(parentSiteId ? { parentSiteId } : {}),
      });
    },
    [dispatch, navigation, rememberMe, parentSiteId],
  );

  const renderSiteCard = useCallback(
    ({ item, index }: { item: Site; index: number }) => {
      const config = getSiteConfig(item.nom);
      const subtitle = getSiteSubtitle(item);
      return (
        <Animated.View entering={FadeInUp.delay(800 + index * 150).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSelectSite(item)}
            style={[
              styles.siteCard,
              {
                backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                borderColor: isDark ? colors.borderSubtle : '#E8ECF4',
                shadowColor: isDark ? '#000' : '#64748B',
              },
            ]}
          >
            {/* Site icon */}
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.siteIconCircle}
            >
              <Icon name={config.icon} size={24} color="#FFF" />
            </LinearGradient>

            {/* Site info */}
            <View style={styles.siteInfo}>
              <Text
                style={[styles.siteName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.nom}
              </Text>
              <Text
                style={[styles.siteAddress, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>

            {/* Chevron */}
            <View
              style={[
                styles.siteChevronBg,
                { backgroundColor: isDark ? 'rgba(0,122,57,0.1)' : '#F1F8E9' },
              ]}
            >
              <Icon name="chevron-right" size={20} color={config.gradient[0]} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [handleSelectSite, colors, isDark],
  );

  if (isLoading && sitesDisponibles.length === 0) {
    return <FullScreenLoading message="Chargement des sites..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundBase}
      />

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
        {DOTS.map(d => (
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

      {/* Logo + Title */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.headerSection}>
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

        <Animated.View entering={ZoomIn.delay(800).duration(400)}>
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(0,122,57,0.15)' : '#B2DFDB', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separator}
          />
        </Animated.View>
      </Animated.View>

      {/* Instruction */}
      <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.instructionWrap}>
        <Animated.View style={pinStyle}>
          <Icon name="map-marker" size={16} color={isDark ? '#4EB35A' : '#007A39'} />
        </Animated.View>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          {branch === 'agences' ? 'Créez votre agence' : 'Sélectionnez votre site de travail'}
        </Text>
        <Animated.View style={pinStyle}>
          <Icon name="map-marker" size={16} color={isDark ? '#4EB35A' : '#007A39'} />
        </Animated.View>
      </Animated.View>

      {/* ===== MODE AGENCES : formulaire de création inline ===== */}
      {branch === 'agences' ? (
        <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.agenceFormWrap}>
          <View style={[
            styles.agenceFormCard,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#E8ECF4',
              shadowColor: isDark ? '#000' : '#64748B',
            },
          ]}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.agenceFormIcon}
            >
              <Icon name="office-building-marker-outline" size={28} color="#FFF" />
            </LinearGradient>

            <Text style={[styles.agenceFormTitle, { color: colors.textPrimary }]}>
              Nouvelle agence
            </Text>
            <Text style={[styles.agenceFormSubtitle, { color: colors.textMuted }]}>
              Saisissez les informations de votre agence Crédit Agricole
            </Text>

            {/* Nom de l'agence CA */}
            <View style={styles.agenceFieldWrap}>
              <Text style={[styles.agenceFieldLabel, { color: colors.textSecondary }]}>Nom de l'agence CA *</Text>
              <View style={[
                styles.agenceFieldInput,
                { backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC', borderColor: isDark ? colors.borderSubtle : '#E2E8F0' },
              ]}>
                <Icon name="domain" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.agenceFieldText, { color: colors.textPrimary }]}
                  placeholder="Ex: Strasbourg, Colmar, Mulhouse..."
                  placeholderTextColor={colors.textMuted}
                  value={newSiteName}
                  onChangeText={setNewSiteName}
                  autoFocus
                />
              </View>
            </View>

            {/* Numéro EDS */}
            <View style={styles.agenceFieldWrap}>
              <Text style={[styles.agenceFieldLabel, { color: colors.textSecondary }]}>Numéro EDS *</Text>
              <View style={[
                styles.agenceFieldInput,
                { backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC', borderColor: isDark ? colors.borderSubtle : '#E2E8F0' },
              ]}>
                <Icon name="identifier" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.agenceFieldText, { color: colors.textPrimary }]}
                  placeholder="Ex: 123"
                  placeholderTextColor={colors.textMuted}
                  value={newEdsNumber}
                  onChangeText={(t) => setNewEdsNumber(t.replace(/[^0-9]/g, '').slice(0, 3))}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            {/* Bouton créer */}
            <TouchableOpacity
              style={[styles.agenceCreateBtn, (!newSiteName.trim() || !newEdsNumber.trim()) && { opacity: 0.5 }]}
              onPress={handleAddSite}
              disabled={!newSiteName.trim() || !newEdsNumber.trim() || isCreating}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.agenceCreateBtnGradient}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name="plus-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.agenceCreateBtnText}>Créer l'agence</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
        <>
        {/* Sites list */}
        <FlatList
          data={displaySites}
          keyExtractor={item => item.id.toString()}
          renderItem={renderSiteCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeIn.delay(1000).duration(600)} style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: isDark ? 'rgba(0,122,57,0.1)' : '#E8F5E9',
                    borderColor: isDark ? 'rgba(0,122,57,0.2)' : '#C8E6C9',
                  },
                ]}
              >
                <Icon name="map-marker-off-outline" size={48} color={colors.primaryDark} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aucun site disponible</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Contactez l'administrateur pour{'\n'}ajouter des sites
              </Text>
            </Animated.View>
          }
        />
        </>
      )}

      {/* Add site button (only for non-branch mode) */}
      {!branch && (
      <Animated.View entering={FadeInUp.delay(1100).duration(400)} style={styles.addBtnWrap}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { Vibration.vibrate(10); setShowAddModal(true); }}
          style={[
            styles.addSiteBtn,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? 'rgba(0,122,57,0.3)' : '#B2DFDB',
            },
          ]}
        >
          <View style={styles.addIconCircle}>
            <Icon name="plus" size={20} color="#FFF" />
          </View>
          <Text style={[styles.addSiteBtnText, { color: isDark ? '#4EB35A' : '#007A39' }]}>
            Ajouter un lieu
          </Text>
        </TouchableOpacity>
      </Animated.View>
      )}

      {/* Add site modal (non-agences) */}
      <Modal visible={showAddModal && branch !== 'agences'} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[
              styles.modalContent,
              { backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF' },
            ]}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={['#007A39', '#007A39']}
                  style={styles.modalIconCircle}
                >
                  <Icon name="map-marker-plus-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nouveau lieu</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Ajoutez un site de travail
                </Text>
              </View>

              {/* Name field */}
              <View style={styles.modalField}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Nom du site *</Text>
                <View style={[
                  styles.modalInput,
                  { backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC', borderColor: isDark ? colors.borderSubtle : '#E2E8F0' },
                ]}>
                  <Icon name="city-variant-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.modalInputText, { color: colors.textPrimary }]}
                    placeholder="Ex: Lyon, Marseille..."
                    placeholderTextColor={colors.textMuted}
                    value={newSiteName}
                    onChangeText={setNewSiteName}
                    autoFocus
                  />
                </View>
              </View>

              {/* Address field */}
              <View style={styles.modalField}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Adresse</Text>
                <View style={[
                  styles.modalInput,
                  { backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC', borderColor: isDark ? colors.borderSubtle : '#E2E8F0' },
                ]}>
                  <Icon name="map-marker-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.modalInputText, { color: colors.textPrimary }]}
                    placeholder="Ex: Lyon, Rhône-Alpes"
                    placeholderTextColor={colors.textMuted}
                    value={newSiteAddress}
                    onChangeText={setNewSiteAddress}
                  />
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: isDark ? colors.borderSubtle : '#E2E8F0' }]}
                  onPress={() => { setShowAddModal(false); setNewSiteName(''); setNewSiteAddress(''); }}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, !newSiteName.trim() && { opacity: 0.5 }]}
                  onPress={handleAddSite}
                  disabled={!newSiteName.trim() || isCreating}
                >
                  <LinearGradient
                    colors={['#007A39', '#007A39']}
                    style={styles.modalConfirmGradient}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Icon name="check" size={18} color="#FFF" />
                        <Text style={styles.modalConfirmText}>Créer</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <View
          style={[
            styles.footerBadge,
            { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' },
          ]}
        >
          <Icon name="shield-check-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Données protégées et chiffrées
          </Text>
        </View>
        <Text style={[styles.versionText, { color: isDark ? colors.textMuted : '#CBD5E1' }]}>
          Version 1.5.0
        </Text>
      </View>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
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
    marginBottom: 16,
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
  instruction: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexGrow: 1,
  },

  // Site Card
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    minHeight: 80,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  siteIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  siteAddress: {
    fontSize: 13,
    fontWeight: '500',
  },
  siteChevronBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
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
  },

  // Add button
  addBtnWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  addSiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 10,
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#007A39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSiteBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  modalInputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
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

  // Agence form
  agenceFormWrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  agenceFormCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  agenceFormIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  agenceFormTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  agenceFormSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  agenceFieldWrap: {
    width: '100%',
    marginBottom: 14,
  },
  agenceFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  agenceFieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  agenceFieldText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  agenceCreateBtn: {
    width: '100%',
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  agenceCreateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  agenceCreateBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
