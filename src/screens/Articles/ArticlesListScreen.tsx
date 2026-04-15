// ============================================
// ARTICLES LIST SCREEN - Premium Redesign
// GestStock IT - Interface Premium Articles
// ============================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Vibration,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { debounce } from 'lodash';
import { useAppSelector } from '@/store';
import { selectIsSuperviseur } from '@/store/slices/authSlice';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { notifyPCStatusChange } from '@/services/pcStatusNotificationService';
import { pcSentService, SentPCRecord } from '@/services/pcSentService';
import { articleRepository, stockRepository } from '@/database';
import { Article, ArticleFilters, PaginatedResult, SyncStatus } from '@/types';
import { APP_CONFIG } from '@/constants';
import { premiumSpacing } from '@/constants/premiumTheme';
import { useResponsive } from '@/utils/responsive';
import { exportSentPCsCSV, shareExportedFile } from '@/utils/csv';
import { useTheme } from '@/theme';

// Composants premium
import PremiumArticleHeader from './components/PremiumArticleHeader';
import PremiumSearchBar from './components/PremiumSearchBar';
import FiltersPanel, { SortOption, SORT_LABELS } from './components/FiltersPanel';
import PremiumArticleCard from './components/PremiumArticleCard';
import SkeletonArticleList from './components/SkeletonArticleList';
import ArticleEmptyState from './components/ArticleEmptyState';
import FABMultiAction from './components/FABMultiAction';
import FilterModal, { FilterOption } from './components/FilterModal';
import ArticlesFilterSheet, { ArticleFilterKey } from './components/ArticlesFilterSheet';
import {
  CODE_FAMILLE_OPTIONS,
  FAMILLE_OPTIONS,
  TYPE_OPTIONS,
  SOUS_TYPE_OPTIONS,
  MARQUE_OPTIONS,
} from '@/constants/articleFilterOptions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const PC_CATEGORY_OPTIONS = [
  {
    value: 'Portable siège',
    label: 'Portable siège',
    models: ['DELL Latitude 5440 tactile', 'DELL Latitude 5440 non tactile'],
  },
  {
    value: 'Portable agence',
    label: 'Portable agence',
    models: ['HP EliteBook', 'DELL Latitude 5550'],
  },
] as const;

const PC_STATUS_OPTIONS = ['À chaud', 'À reusiner', 'En usinage', 'Disponible'] as const;
const PC_STATUS_FILTER_OPTIONS = ['À chaud', 'À reusiner', 'En usinage', 'Disponible', 'Envoyé'] as const;
const TABLET_SORT_LABELS: Partial<Record<SortOption, string>> = {
  nom: 'Hostname A-Z',
  reference: 'Asset',
  date: 'Dernière mise à jour',
};
const PC_SORT_LABELS: Partial<Record<SortOption, string>> = {
  nom: 'Hostname A-Z',
  reference: 'Asset',
  date: 'Dernière mise à jour',
};
const MANAGED_INVENTORY_FETCH_LIMIT = 1000;
const PC_FILTER_CATEGORY_OPTIONS: FilterOption[] = [
  { id: null, label: 'Toutes' },
  ...PC_CATEGORY_OPTIONS.map((category) => ({
    id: category.value,
    label: category.label,
  })),
];

const getInventoryStatus = (description?: string) => {
  const normalized = (description ?? '').toLowerCase();
  if (normalized.includes('disponible')) return 'Disponible';
  if (normalized.includes('usinage') || normalized.includes('en train d\'usiner')) return 'En usinage';
  if (normalized.includes('reusin') || normalized.includes('recondition')) return 'A reusiner';
  if (normalized.includes('a chaud') || normalized.includes('à chaud')) return 'A chaud';
  return null;
};

const getBrandFromModel = (model: string) => {
  const normalized = model.toLowerCase();
  if (normalized.includes('hp')) return 'HP';
  if (normalized.includes('dell')) return 'DELL';
  return 'DELL';
};

const getQuickHostnamePlaceholder = (category: (typeof PC_CATEGORY_OPTIONS)[number]['value']) => {
  if (category === 'Portable agence') {
    return 'Ex: KSAOP8725XXX';
  }

  return 'Ex: KSAOPTRXXXX';
};

const getQuickHostnameHint = (category: (typeof PC_CATEGORY_OPTIONS)[number]['value']) => {
  if (category === 'Portable agence') {
    return 'Format agence conseille: KSAOP8725XXX';
  }

  return 'Format siege conseille: KSAOPTRXXXX';
};

const getTechnicienAcronym = (prenom?: string, nom?: string) => {
  const p = (prenom ?? '').trim();
  const n = (nom ?? '').trim();
  const first = p[0] ?? '';
  const second = n[0] ?? '';
  const acronym = `${first}${second}`.toUpperCase();
  return acronym || undefined;
};

const isTabletDecommissionedArticle = (article: Article) => {
  const normalized = (article.description ?? '').toLowerCase();
  return normalized.includes('decommission') || normalized.includes('décommission');
};

// Delete Modal Component
interface DeleteModalContentProps {
  colors: any;
  isDark: boolean;
  isDeleting: boolean;
  scaleAnim: Animated.Shared<number>;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteModalContent: React.FC<DeleteModalContentProps> = ({
  colors,
  isDark,
  isDeleting,
  scaleAnim,
  onCancel,
  onConfirm,
}) => {
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.deleteModalContent,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(0,122,57,0.2)' : 'rgba(0,122,57,0.15)',
        },
        scaleStyle,
      ]}
    >
      {/* Decorative Orbs */}
      <View pointerEvents="none" style={[styles.deleteOrbOne, { backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.12)' }]} />
      <View pointerEvents="none" style={[styles.deleteOrbTwo, { backgroundColor: isDark ? 'rgba(0,122,57,0.08)' : 'rgba(0,122,57,0.08)' }]} />

      {/* Icon */}
      <View style={[styles.deleteIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.16)' : '#FEF3C7' }]}>
        <Icon name="power-plug-off-outline" size={32} color="#D97706" />
      </View>

      {/* Title */}
      <Text style={[styles.deleteTitle, { color: colors.textPrimary }]}>
        Décommissionner cette tablette ?
      </Text>

      {/* Message */}
      <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
        La tablette restera visible dans le parc, mais sera marquée comme décommissionnée.
      </Text>

      {/* Action Buttons */}
      <View style={styles.deleteActionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isDeleting}
          onPress={onCancel}
          style={[
            styles.deleteBtn,
            styles.deleteBtnCancel,
            { backgroundColor: isDark ? 'rgba(100,116,139,0.12)' : '#F1F5F9', borderColor: isDark ? 'rgba(100,116,139,0.2)' : '#CBD5E1' }
          ]}
        >
          <Text style={[styles.deleteBtnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isDeleting}
          onPress={onConfirm}
          style={[styles.deleteBtn, styles.deleteBtnConfirm]}
        >
          <LinearGradient
            colors={['#D97706', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.deleteBtnGradient}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Icon name="check-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.deleteBtnConfirmText}>Décommissionner</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

interface PCActionModalContentProps {
  colors: any;
  isDark: boolean;
  scaleAnim: Animated.Shared<number>;
  isSubmitting: boolean;
  actionType: 'sent' | 'available' | 'hot';
  articleLabel?: string;
  sourceAgencyLabel?: string;
  sourceAgencyEds?: string;
  destinationEds?: string;
  destinationEdsError?: string | null;
  onDestinationEdsChange?: (value: string) => void;
  onClearDestinationEdsError?: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const PCActionModalContent: React.FC<PCActionModalContentProps> = ({
  colors,
  isDark,
  scaleAnim,
  isSubmitting,
  actionType,
  articleLabel,
  sourceAgencyLabel,
  sourceAgencyEds,
  destinationEds,
  destinationEdsError,
  onDestinationEdsChange,
  onClearDestinationEdsError,
  onCancel,
  onConfirm,
}) => {
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const isSent = actionType === 'sent';
  const isHot = actionType === 'hot';
  const accent = isSent ? '#E11D48' : isHot ? '#059669' : '#2563EB';
  const iconName = isSent ? 'send-outline' : isHot ? 'flash-outline' : 'check-circle-outline';
  const title = isSent ? 'Envoyer ce PC ?' : isHot ? 'Remettre ce PC a chaud ?' : 'Rendre ce PC disponible ?';
  const message = isSent
    ? 'Le poste sera retiré du parc actif et conservé dans la base de données.'
    : isHot
      ? 'Le poste sera basculé en statut A chaud et reviendra dans le parc actif.'
      : 'Le poste sera déplacé dans la catégorie PC disponible et restera consultable.';
  const confirmLabel = isSent ? 'Confirmer l’envoi' : isHot ? 'Mettre a chaud' : 'Marquer disponible';

  return (
    <Animated.View
      style={[
        styles.pcActionModalCard,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? `${accent}33` : `${accent}22`,
        },
        scaleStyle,
      ]}
    >
      <View pointerEvents="none" style={[styles.pcActionModalOrbOne, { backgroundColor: isDark ? `${accent}18` : `${accent}14` }]} />
      <View pointerEvents="none" style={[styles.pcActionModalOrbTwo, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)' }]} />

      <LinearGradient
        colors={isSent ? ['#FFF1F2', '#FFE4E6'] : isHot ? ['#ECFDF5', '#D1FAE5'] : ['#EFF6FF', '#DBEAFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pcActionHero}
      >
        <View style={[styles.pcActionHeroIconWrap, { backgroundColor: '#FFFFFF' }]}>
          <Icon name={iconName} size={24} color={accent} />
        </View>
        <View style={styles.pcActionHeroTextWrap}>
          <Text style={[styles.pcActionEyebrow, { color: accent }]}>{isSent ? 'ACTION DE SORTIE' : 'ACTION DE STOCK'}</Text>
          <Text style={[styles.pcActionTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.pcActionMessage, { color: colors.textSecondary }]}>{message}</Text>
        </View>
      </LinearGradient>

      {isSent ? (
        <View style={styles.pcActionInfoSection}>
          <View
            style={[
              styles.pcActionInfoCard,
              {
                backgroundColor: isDark ? 'rgba(15,23,42,0.42)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(148,163,184,0.25)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.pcActionInfoRow}>
              <Icon name="laptop" size={14} color="#0F172A" />
              <Text style={[styles.pcActionInfoText, { color: colors.textPrimary }]}>PC: {articleLabel || 'Inconnu'}</Text>
            </View>
            <View style={styles.pcActionInfoRow}>
              <Icon name="office-building-outline" size={14} color="#0F766E" />
              <Text style={[styles.pcActionInfoText, { color: colors.textSecondary }]}>Agence expeditrice: {sourceAgencyLabel || 'Agence inconnue'}{sourceAgencyEds ? ` (EDS ${sourceAgencyEds})` : ''}</Text>
            </View>

            <View style={styles.pcActionInputBlock}>
              <Text style={[styles.pcActionInputLabel, { color: colors.textSecondary }]}>Numero EDS agence destinataire</Text>
              <TextInput
                value={destinationEds ?? ''}
                onChangeText={(value) => {
                  onDestinationEdsChange?.(value.replace(/[^\d]/g, ''));
                  if (destinationEdsError) onClearDestinationEdsError?.();
                }}
                placeholder="Ex: 872"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={3}
                style={[
                  styles.pcActionInput,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surface,
                    borderColor: destinationEdsError ? '#DC2626' : colors.borderSubtle,
                  },
                ]}
              />
            </View>

            {destinationEdsError ? (
              <View style={styles.pcActionErrorRow}>
                <Icon name="alert-circle-outline" size={13} color="#DC2626" />
                <Text style={styles.pcActionErrorText}>{destinationEdsError}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.pcActionActionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSubmitting}
          onPress={onCancel}
          style={[
            styles.pcActionBtn,
            styles.pcActionBtnGhost,
            { borderColor: colors.borderSubtle, backgroundColor: colors.backgroundSubtle },
          ]}
        >
          <Text style={[styles.pcActionBtnGhostText, { color: colors.textSecondary }]}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSubmitting}
          onPress={onConfirm}
          style={[styles.pcActionBtn, styles.pcActionBtnPrimary]}
        >
          <LinearGradient
            colors={isSent ? ['#E11D48', '#BE123C'] : isHot ? ['#059669', '#047857'] : ['#2563EB', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pcActionBtnPrimaryGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Icon name={iconName} size={16} color="#FFFFFF" />
                <Text style={styles.pcActionBtnPrimaryText}>{confirmLabel}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ArticlesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // DEBUG MASSIF
  console.log('=== [ArticlesListScreen] MOUNT ===');
  console.log('route:', route);
  console.log('route.name:', route.name);
  console.log('route.params:', route.params);
  console.log('route.params?.presetTypeArticle:', route.params?.presetTypeArticle);
  console.log('route.params?.lockPresetTypeArticle:', route.params?.lockPresetTypeArticle);
  console.log('route.params?.params:', route.params?.params);
  console.log('=== END DEBUG ===');
  
  const presetTypeArticle = route.params?.presetTypeArticle?.trim() || route.params?.params?.presetTypeArticle?.trim();
  const lockPresetTypeArticle = route.params?.lockPresetTypeArticle === true || route.params?.params?.lockPresetTypeArticle === true;
  const presetTypeValues = presetTypeArticle ? [presetTypeArticle] : null;
  const normalizedPresetType = (presetTypeArticle ?? '').toLowerCase().trim();
  const isTabletTab =
    lockPresetTypeArticle &&
    normalizedPresetType === 'tablette';
  const isPCTab = lockPresetTypeArticle && normalizedPresetType === 'pc';
  const isManagedInventoryTab = isTabletTab || isPCTab;

  // Debug logging
  useEffect(() => {
    console.log('[ArticlesListScreen] isTabletTab:', isTabletTab);
    console.log('[ArticlesListScreen] isPCTab:', isPCTab);
    console.log('[ArticlesListScreen] presetTypeArticle:', presetTypeArticle);
    console.log('[ArticlesListScreen] lockPresetTypeArticle:', lockPresetTypeArticle);
  }, [isTabletTab, isPCTab, presetTypeArticle, lockPresetTypeArticle]);
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const currentTechnicien = useAppSelector((state) => state.auth.currentTechnicien);
  const { isTablet, contentMaxWidth, rv } = useResponsive();
  const { colors, isDark } = useTheme();
  const numColumns = rv({ phone: 1, tablet: 2 });

  // ===== STATE =====
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filters, setFilters] = useState<ArticleFilters>({
    searchQuery: '',
    categorieId: null,
    stockFaible: route.params?.filter === 'lowStock',
    codeFamille: null,
    famille: null,
    typeArticle: presetTypeValues,
    sousType: null,
    marque: null,
    modele: null,
    emplacement: null,
  });
  const [sortBy, setSortBy] = useState<SortOption>('nom');

  // Stats
  const [totalArticles, setTotalArticles] = useState(0);
  const [alertes, setAlertes] = useState(0);
  const [pcHotCount, setPCHotCount] = useState(0);
  const [pcReconditioningCount, setPCReconditioningCount] = useState(0);
  const [pcProcessingCount, setPCProcessingCount] = useState(0);
  const [pcAvailableCount, setPCAvailableCount] = useState(0);
  const [pcStatusFilter, setPcStatusFilter] = useState<'À chaud' | 'À reusiner' | 'En usinage' | 'Disponible' | 'Envoyé' | null>(null);
  const [pcSentHistory, setPcSentHistory] = useState<SentPCRecord[]>([]);
  const [pcSentCount, setPcSentCount] = useState(0);
  const [exportingSentCsv, setExportingSentCsv] = useState(false);
  const [tabletStatusFilter, setTabletStatusFilter] = useState<'all' | 'active' | 'decommissioned'>('all');

  // Modals
    const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filtersSheetVisible, setFiltersSheetVisible] = useState(false);
  const [activeFilterModal, setActiveFilterModal] = useState<ArticleFilterKey | null>(null);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickHostname, setQuickHostname] = useState('');
  const [quickAsset, setQuickAsset] = useState('');
  const [quickPCCategory, setQuickPCCategory] = useState<(typeof PC_CATEGORY_OPTIONS)[number]['value']>('Portable siège');
  const [quickPCModel, setQuickPCModel] = useState<string>(PC_CATEGORY_OPTIONS[0].models[0]);
  const [quickPCStatus, setQuickPCStatus] = useState<(typeof PC_STATUS_OPTIONS)[number]>('À chaud');
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [scanTarget, setScanTarget] = useState<'hostname' | 'asset' | null>(null);
  const scanTargetRef = useRef<'hostname' | 'asset' | null>(null);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);
  const { hasPermission: hasCamPermission, requestPermission: requestCamPermission } = useCameraPermission();
  const camDevices = useCameraDevices();
  const camDevice = camDevices.find(d => d.position === 'back') ?? camDevices[0];
  const [quickFeedback, setQuickFeedback] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scaleAnim = useSharedValue(0);
  const [pcActionModal, setPCActionModal] = useState<{
    visible: boolean;
    type: 'sent' | 'available' | 'hot';
    articleId: string | number | null;
  }>({
    visible: false,
    type: 'sent',
    articleId: null,
  });
  const [isPCActionSubmitting, setIsPCActionSubmitting] = useState(false);
  const [destinationAgencyEds, setDestinationAgencyEds] = useState('');
  const [destinationAgencyEdsError, setDestinationAgencyEdsError] = useState<string | null>(null);
  const pcActionScaleAnim = useSharedValue(0);
  const quickModalIntro = useSharedValue(0);

  const quickModalIntroStyle = useAnimatedStyle(() => ({
    opacity: quickModalIntro.value,
    transform: [
      { translateY: (1 - quickModalIntro.value) * 20 },
      { scale: 0.96 + quickModalIntro.value * 0.04 },
    ],
  }));

  const selectedPCActionArticle = useMemo(
    () => articles.find((a) => String(a.id) === String(pcActionModal.articleId)) ?? null,
    [articles, pcActionModal.articleId],
  );

  // Emplacements dynamiques du site actif
  const [siteEmplacements, setSiteEmplacements] = useState<string[]>([]);

  // Calculer si le FAB doit être affiché
  const showFAB = useMemo(() => {
    // Strictement: afficher FAB SEULEMENT si ce n'est vraiment pas le mode Tablette
    const shouldShow = !isSuperviseur && (lockPresetTypeArticle !== true || (presetTypeArticle ?? '').toLowerCase().trim() !== 'tablette');
    console.log('[ArticlesListScreen.showFAB] DEBUG:', {
      shouldShow,
      isSuperviseur,
      lockPresetTypeArticle,
      presetTypeArticle,
      isTabletTab,
    });
    return shouldShow;
  }, [isSuperviseur, lockPresetTypeArticle, presetTypeArticle, isTabletTab]);

  const quickPCModelOptions = useMemo(() => {
    return PC_CATEGORY_OPTIONS.find((option) => option.value === quickPCCategory)?.models ?? PC_CATEGORY_OPTIONS[0].models;
  }, [quickPCCategory]);

  useEffect(() => {
    if (!isPCTab) return;
    if (!quickPCModelOptions.includes(quickPCModel)) {
      setQuickPCModel(quickPCModelOptions[0]);
    }
  }, [isPCTab, quickPCModel, quickPCModelOptions]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // ===== Barcode scanner (hostname + asset) =====
  useEffect(() => {
    scanTargetRef.current = scanTarget;
  }, [scanTarget]);

  const onCodeScanned = useCallback((codes: { value?: string }[]) => {
    if (!scanTargetRef.current || codes.length === 0 || !codes[0]?.value) return;
    const value = codes[0].value.trim();
    if (!value) return;
    const now = Date.now();
    if (lastScannedRef.current?.value === value && now - lastScannedRef.current.at < 2500) return;
    lastScannedRef.current = { value, at: now };
    Vibration.vibrate([0, 30, 60, 30]);
    const target = scanTargetRef.current;
    setScanTarget(null);
    if (target === 'asset') {
      setQuickAsset(value);
    } else if (target === 'hostname') {
      setQuickHostname(value.toUpperCase());
    }
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93', 'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec'],
    onCodeScanned: onCodeScanned,
  });

  const showQuickFeedback = useCallback(
    (type: 'success' | 'error', title: string, message: string) => {
      setQuickFeedback({ visible: true, type, title, message });

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      feedbackTimerRef.current = setTimeout(() => {
        setQuickFeedback((prev) => ({ ...prev, visible: false }));
      }, 2400);
    },
    [],
  );

  const loadSentHistory = useCallback(async () => {
    if (!effectiveSiteId || !isPCTab) {
      setPcSentHistory([]);
      return;
    }

    try {
      const rows = await pcSentService.listBySourceSite(String(effectiveSiteId));
      setPcSentHistory(rows);
    } catch (error) {
      console.error('Erreur chargement historique PC envoyés:', error);
      setPcSentHistory([]);
    }
  }, [effectiveSiteId, isPCTab]);

  // ===== LOAD STATS =====
  const loadStats = useCallback(async () => {
    if (!effectiveSiteId) return;

    const baseTypeFilter = lockPresetTypeArticle && presetTypeArticle
      ? { typeArticle: [presetTypeArticle] }
      : {};

    const baseSearchFilters = {
      searchQuery: '',
      categorieId: null,
      stockFaible: false,
      codeFamille: null,
      famille: null,
      sousType: null,
      marque: null,
      emplacement: null,
      ...baseTypeFilter,
    };

    try {
      const [allResult, lowStockResult, emplacements, sentCount] = await Promise.all([
        isManagedInventoryTab
          ? articleRepository.search(
              effectiveSiteId,
              baseSearchFilters,
              0,
              1,
            )
          : articleRepository.findAll(effectiveSiteId, 0),
        isManagedInventoryTab
          ? articleRepository.search(
              effectiveSiteId,
              {
                searchQuery: '',
                categorieId: null,
                stockFaible: true,
                codeFamille: null,
                famille: null,
                sousType: null,
                marque: null,
                emplacement: null,
                ...baseTypeFilter,
              },
              0,
              1,
            )
          : articleRepository.countLowStock(effectiveSiteId),
        articleRepository.getDistinctEmplacements(effectiveSiteId),
        isPCTab ? pcSentService.countBySourceSite(String(effectiveSiteId)).catch(() => 0) : Promise.resolve(0),
      ]);

      const lowStock = typeof lowStockResult === 'number' ? lowStockResult : lowStockResult.total;
      setTotalArticles(allResult.total);
      setAlertes(isPCTab ? 0 : lowStock);
      setSiteEmplacements(emplacements);
      setPcSentCount(sentCount);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  }, [effectiveSiteId, isManagedInventoryTab, isPCTab, lockPresetTypeArticle, presetTypeArticle]);

  useEffect(() => {
    if (!isPCTab) return;
    const hot = articles.filter((article) => getInventoryStatus(article.description) === 'A chaud').length;
    const reconditioning = articles.filter((article) => getInventoryStatus(article.description) === 'A reusiner').length;
    const processing = articles.filter((article) => getInventoryStatus(article.description) === 'En usinage').length;
    const available = articles.filter((article) => getInventoryStatus(article.description) === 'Disponible').length;
    setPCHotCount(hot);
    setPCReconditioningCount(reconditioning);
    setPCProcessingCount(processing);
    setPCAvailableCount(available);
  }, [articles, isPCTab]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadSentHistory();
  }, [loadSentHistory]);

  // Appliquer le filtre "stock faible" quand on arrive depuis le tableau de bord (clic Alertes stock)
  useEffect(() => {
    if (route.params?.filter === 'lowStock') {
      setFilters((prev) => ({ ...prev, stockFaible: true }));
      setPage(0);
      setHasMore(true);
    }
  }, [route.params?.filter]);

  useEffect(() => {
    if (!presetTypeArticle) return;

    setFilters((prev) => ({
      ...prev,
      typeArticle: [presetTypeArticle],
    }));
    setPage(0);
    setHasMore(true);
  }, [presetTypeArticle]);

  // ===== LOAD ARTICLES =====
  const pageRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadArticles = useCallback(
    async (resetList = false, silent = false) => {
      if (!effectiveSiteId) {
        if (!silent) setIsLoading(false);
        return;
      }

      const currentPage = isManagedInventoryTab ? 0 : resetList ? 0 : pageRef.current;
      const showInitialLoader = resetList && !hasLoadedOnceRef.current && !silent;

      if (showInitialLoader) {
        setIsLoading(true);
      } else if (!silent && !resetList) {
        setIsLoadingMore(true);
      }

      try {
        let result: PaginatedResult<Article>;
        const f = filtersRef.current;
        const serverFilters = isManagedInventoryTab
          ? { ...f, searchQuery: '' }
          : f;

        const hasFilter =
          serverFilters.searchQuery ||
          serverFilters.stockFaible ||
          (serverFilters.codeFamille && serverFilters.codeFamille.length > 0) ||
          (serverFilters.famille && serverFilters.famille.length > 0) ||
          (serverFilters.typeArticle && serverFilters.typeArticle.length > 0) ||
          (serverFilters.sousType && serverFilters.sousType.length > 0) ||
          (serverFilters.marque && serverFilters.marque.length > 0) ||
          (serverFilters.emplacement && serverFilters.emplacement.length > 0);
        if (hasFilter) {
          result = await articleRepository.search(
            effectiveSiteId,
            serverFilters,
            currentPage,
            isManagedInventoryTab ? MANAGED_INVENTORY_FETCH_LIMIT : undefined,
          );
        } else {
          result = await articleRepository.findAll(
            effectiveSiteId,
            currentPage,
            isManagedInventoryTab ? MANAGED_INVENTORY_FETCH_LIMIT : undefined,
          );
        }

        if (resetList) {
          setArticles(result.data);
          pageRef.current = isManagedInventoryTab ? 0 : 1;
          setPage(isManagedInventoryTab ? 0 : 1);
        } else {
          setArticles(prev => [...prev, ...result.data]);
          pageRef.current = currentPage + 1;
          setPage(currentPage + 1);
        }

        setHasMore(isManagedInventoryTab ? false : result.hasMore);
      } catch (error) {
        console.error('Erreur chargement articles:', error);
      } finally {
        if (showInitialLoader) {
          setIsLoading(false);
        }
        if (!silent && !resetList) {
          setIsLoadingMore(false);
        }
        if (resetList) {
          hasLoadedOnceRef.current = true;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveSiteId, isManagedInventoryTab],
  );

  // Reload when filters change
  useEffect(() => {
    pageRef.current = 0;
    setPage(0);
    setHasMore(true);
    loadArticles(true);
  }, [filters, effectiveSiteId, loadArticles]);

  // Recharger articles et stats à chaque retour sur l'écran (données toujours à jour)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!effectiveSiteId) return;
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadStats();
      loadSentHistory();
      pageRef.current = 0;
      setPage(0);
      setHasMore(true);
      loadArticles(true, true);
    }, [effectiveSiteId, loadStats, loadSentHistory, loadArticles]),
  );

  // ===== SEARCH =====
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
        setFilters(prev => ({ ...prev, searchQuery: query }));
      }, APP_CONFIG.search.debounceDelay),
    [],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      debouncedSearch(text);
    },
    [debouncedSearch],
  );

  const handleClearSearch = useCallback(() => {
    debouncedSearch.cancel();
    setSearchQuery('');
    setFilters(prev => ({ ...prev, searchQuery: '' }));
  }, [debouncedSearch]);

  // ===== FILTERS =====
  const toggleStockFaible = useCallback(() => {
    setFilters(prev => ({ ...prev, stockFaible: !prev.stockFaible }));
  }, []);

  const handleSortSelect = useCallback(
    (value: string | number | null) => {
      setSortBy((value as SortOption) || 'nom');
    },
    [],
  );

  const hasActiveFilters = useMemo(
    () =>
      filters.stockFaible ||
      (isTabletTab && tabletStatusFilter !== 'all') ||
      pcStatusFilter !== null ||
      searchQuery.length > 0 ||
      (filters.codeFamille && filters.codeFamille.length > 0) ||
      (filters.famille && filters.famille.length > 0) ||
      (!lockPresetTypeArticle && filters.typeArticle && filters.typeArticle.length > 0) ||
      (filters.sousType && filters.sousType.length > 0) ||
      (filters.marque && filters.marque.length > 0) ||
      (filters.modele && filters.modele.length > 0) ||
      (filters.emplacement && filters.emplacement.length > 0),
    [filters, pcStatusFilter, searchQuery, lockPresetTypeArticle, isTabletTab, tabletStatusFilter],
  );

  const activeFiltersCount = useMemo(
    () => {
      const baseCount = [
        filters.codeFamille,
        filters.famille,
        lockPresetTypeArticle ? null : filters.typeArticle,
        filters.sousType,
        filters.marque,
        filters.modele,
        filters.emplacement,
      ].filter(
        (v) => v && v.length > 0,
      ).length;

      return baseCount + (isTabletTab && tabletStatusFilter !== 'all' ? 1 : 0);
    },
    [filters, lockPresetTypeArticle, isTabletTab, tabletStatusFilter],
  );

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setPcStatusFilter(null);
    setTabletStatusFilter('all');
    setFilters({
      searchQuery: '',
      categorieId: null,
      stockFaible: false,
      codeFamille: null,
      famille: null,
      typeArticle: lockPresetTypeArticle ? presetTypeValues : null,
      sousType: null,
      marque: null,
      modele: null,
      emplacement: null,
    });
    setSortBy('nom');
  }, [lockPresetTypeArticle, presetTypeValues]);

  const handleFilterSelect = useCallback((key: ArticleFilterKey, values: string[]) => {
    if (lockPresetTypeArticle && key === 'typeArticle') {
      setActiveFilterModal(null);
      setFiltersSheetVisible(true);
      return;
    }

    setFilters((prev) => ({ ...prev, [key]: values.length > 0 ? values : null }));
    setActiveFilterModal(null);
    setFiltersSheetVisible(true);
  }, [lockPresetTypeArticle]);

  const filterOptionsByKey = useMemo(() => {
    const toOptions = (items: { value: string; label: string }[]): FilterOption[] =>
      [{ id: null, label: 'Tous' }, ...items.map((i) => ({ id: i.value, label: i.label }))];

    const dynamicBrands = Array.from(
      new Set(
        [...articles, ...pcSentHistory.map((row) => ({ marque: row.brand }))]
          .map((a) => a.marque?.trim())
          .filter((v): v is string => !!v),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const dynamicModels = Array.from(
      new Set(
        [...articles, ...pcSentHistory.map((row) => ({ modele: row.model }))]
          .map((a) => a.modele?.trim())
          .filter((v): v is string => !!v),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const dynamicBrandOptions: FilterOption[] = [
      { id: null, label: 'Tous' },
      ...dynamicBrands.map((b) => ({ id: b, label: b })),
    ];

    const dynamicModelOptions: FilterOption[] = [
      { id: null, label: 'Tous' },
      ...dynamicModels.map((model) => ({ id: model, label: model })),
    ];

    return {
      codeFamille: [{ id: null, label: 'Tous' }, ...CODE_FAMILLE_OPTIONS.map((c) => ({ id: c, label: `Famille ${c}` }))],
      famille: toOptions(FAMILLE_OPTIONS),
      typeArticle: toOptions(TYPE_OPTIONS),
      sousType: isPCTab ? PC_FILTER_CATEGORY_OPTIONS : toOptions(SOUS_TYPE_OPTIONS),
      marque: isManagedInventoryTab ? dynamicBrandOptions : toOptions(MARQUE_OPTIONS),
      modele: isPCTab ? dynamicModelOptions : [{ id: null, label: 'Tous' }],
      emplacement: [{ id: null, label: 'Tous' }, ...siteEmplacements.map((e) => ({ id: e, label: e }))],
    };
  }, [siteEmplacements, articles, isManagedInventoryTab, isPCTab, pcSentHistory]);

  const activeFilterModalConfig = useMemo(() => {
    if (!activeFilterModal) return null;
    const titles: Record<ArticleFilterKey, string> = {
      codeFamille: 'Code famille',
      famille: 'Famille',
      typeArticle: 'Type',
      sousType: isPCTab ? 'Portable agence / siège' : 'Sous-type',
      marque: isTabletTab ? 'Constructeur tablette' : isPCTab ? 'Constructeur' : 'Marque',
      modele: isPCTab ? 'Modèle PC' : 'Modèle',
      emplacement: isTabletTab ? 'Zone de stockage' : isPCTab ? 'Zone / EDS' : 'Emplacement',
    };
    return {
      key: activeFilterModal,
      title: titles[activeFilterModal],
      options: filterOptionsByKey[activeFilterModal],
      selectedValues: filters[activeFilterModal] ?? [],
    };
  }, [activeFilterModal, filterOptionsByKey, filters, isPCTab]);

  // ===== SORT ARTICLES =====
  const sortedArticles = useMemo(() => {
    const sorted = [...articles];
    switch (sortBy) {
      case 'nom':
        return sorted.sort((a, b) => a.nom.localeCompare(b.nom));
      case 'reference':
        return sorted.sort((a, b) => a.reference.localeCompare(b.reference));
      case 'stock_asc':
        return sorted.sort(
          (a, b) => (a.quantiteActuelle ?? 0) - (b.quantiteActuelle ?? 0),
        );
      case 'stock_desc':
        return sorted.sort(
          (a, b) => (b.quantiteActuelle ?? 0) - (a.quantiteActuelle ?? 0),
        );
      case 'date':
        return sorted.sort(
          (a, b) =>
            new Date(b.dateModification).getTime() -
            new Date(a.dateModification).getTime(),
        );
      default:
        return sorted;
    }
  }, [articles, sortBy]);

  // ===== PC STATUS FILTER =====
  const sentPcArticles = useMemo<Article[]>(() => {
    return [...pcSentHistory]
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .map((row) => {
        const sentAt = new Date(row.sentAt || row.createdAt);
        const sourceLabel = row.sourceSiteName ? ` par ${row.sourceSiteName}` : '';

        return {
          id: `sent-${row.id}`,
          reference: row.asset?.trim() || row.hostname,
          nom: row.hostname,
          description: `Envoyé vers EDS ${row.destinationAgencyEds}${sourceLabel}`,
          barcode: row.asset,
          famille: 'PC portable',
          typeArticle: 'PC',
          sousType: 'Portable agence',
          marque: row.brand,
          modele: row.model,
          emplacement: `EDS ${row.destinationAgencyEds}`,
          stockMini: 0,
          unite: 'unité',
          actif: false,
          dateCreation: sentAt,
          dateModification: sentAt,
          syncStatus: SyncStatus.SYNCED,
          quantiteActuelle: 0,
        };
      });
  }, [pcSentHistory]);

  const displayedArticles = useMemo(() => {
    let filtered = pcStatusFilter === 'Envoyé' ? sentPcArticles : sortedArticles;

    if (isManagedInventoryTab && searchQuery.trim().length > 0) {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((article) => {
        const haystack = [
          article.reference,
          article.nom,
          article.description,
          article.barcode,
          article.modele,
          article.marque,
          article.famille,
          article.sousType,
          article.emplacement,
        ]
          .filter((value): value is string => !!value)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });
    }

    if (isPCTab && pcStatusFilter !== 'Envoyé') {
      filtered = filtered.filter((article) => !((article.description ?? '').toLowerCase().includes('envoy')));
    }

    if (isTabletTab) {
      if (tabletStatusFilter === 'decommissioned') {
        filtered = filtered.filter((article) => isTabletDecommissionedArticle(article));
      } else if (tabletStatusFilter === 'active') {
        filtered = filtered.filter((article) => !isTabletDecommissionedArticle(article));
      }
    }

    if (isPCTab) {
      if (filters.sousType && filters.sousType.length > 0) {
        filtered = filtered.filter((article) => {
          const articleType = (article.sousType ?? '').trim();
          return filters.sousType?.includes(articleType) ?? true;
        });
      }

      if (filters.marque && filters.marque.length > 0) {
        filtered = filtered.filter((article) => {
          const articleBrand = (article.marque ?? '').trim();
          return filters.marque?.includes(articleBrand) ?? true;
        });
      }

      if (filters.modele && filters.modele.length > 0) {
        filtered = filtered.filter((article) => {
          const articleModel = (article.modele ?? '').trim();
          return filters.modele?.includes(articleModel) ?? true;
        });
      }

      if (filters.emplacement && filters.emplacement.length > 0) {
        filtered = filtered.filter((article) => {
          const articleLocation = (article.emplacement ?? '').trim();
          return filters.emplacement?.includes(articleLocation) ?? true;
        });
      }
    }

    if (!isPCTab || pcStatusFilter === null || pcStatusFilter === 'Envoyé') return filtered;

    return filtered.filter((article) => {
      const normalized = (article.description ?? '').toLowerCase();
      if (pcStatusFilter === 'À chaud') {
        return normalized.includes('a chaud') || normalized.includes('à chaud');
      }
      if (pcStatusFilter === 'À reusiner') {
        return normalized.includes('reusin') || normalized.includes('recondition');
      }
      if (pcStatusFilter === 'En usinage') {
        return normalized.includes('usinage') || normalized.includes('en train d\'usiner');
      }
      if (pcStatusFilter === 'Disponible') {
        return normalized.includes('disponible');
      }
      return true;
    });
  }, [sortedArticles, sentPcArticles, isManagedInventoryTab, searchQuery, isPCTab, isTabletTab, pcStatusFilter, tabletStatusFilter, filters.sousType, filters.marque, filters.modele, filters.emplacement]);

  const tabletDecommissionedStats = useMemo(() => {
    if (!isTabletTab) {
      return { count: 0, names: [] as string[] };
    }

    const decommissioned = sortedArticles.filter((article) => isTabletDecommissionedArticle(article));
    const names = decommissioned.map((article) => article.nom).slice(0, 3);
    return { count: decommissioned.length, names };
  }, [isTabletTab, sortedArticles]);

  const pcCategoryStats = useMemo(() => {
    if (!isPCTab || pcStatusFilter === null) return null;

    const agenceBrands = new Map<string, number>();
    const siegeBrands = new Map<string, number>();
    const otherBrands = new Map<string, number>();
    const modelCounts = new Map<string, number>();
    let agence = 0;
    let siege = 0;
    let other = 0;

    const addBrand = (map: Map<string, number>, brandLabel: string) => {
      map.set(brandLabel, (map.get(brandLabel) ?? 0) + 1);
    };

    for (const article of displayedArticles) {
      const values = [article.sousType, article.typeArticle, article.famille]
        .filter((value): value is string => !!value)
        .map((value) => value.toLowerCase());

      const isAgence = values.some((value) => value.includes('agence'));
      const isSiege = values.some((value) => value.includes('siège') || value.includes('siege'));
      const brand = (article.marque ?? '').trim() || 'Sans marque';
      const model = (article.modele ?? '').trim() || 'Sans modèle';

      modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);

      if (isAgence) {
        agence += 1;
        addBrand(agenceBrands, brand);
      } else if (isSiege) {
        siege += 1;
        addBrand(siegeBrands, brand);
      } else {
        other += 1;
        addBrand(otherBrands, brand);
      }
    }

    const toSortedEntries = (map: Map<string, number>) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
        .map(([brand, count]) => ({ brand, count }));

    return {
      label: pcStatusFilter,
      total: displayedArticles.length,
      agence,
      siege,
      other,
      modelCounts: toSortedEntries(modelCounts),
      agenceBrands: toSortedEntries(agenceBrands),
      siegeBrands: toSortedEntries(siegeBrands),
      otherBrands: toSortedEntries(otherBrands),
    };
  }, [isPCTab, pcStatusFilter, displayedArticles]);

  // ===== NAVIGATION =====
  const handleArticlePress = useCallback(
    (articleId: number) => {
      navigation.navigate('ArticleDetail', {
        articleId,
        sourceTab: isTabletTab ? 'Tablette' : isPCTab ? 'PC' : 'Articles',
      });
    },
    [navigation, isTabletTab, isPCTab],
  );

  const handleSentArticlePress = useCallback((_articleId: number) => {
    showQuickFeedback('success', 'PC envoyé', 'PC déjà envoyé. EDS visible sur la carte.');
  }, [showQuickFeedback]);

  const handleExportSentCsv = useCallback(async () => {
    if (pcSentHistory.length === 0) {
      showQuickFeedback('error', 'Aucun export', 'Aucun PC envoyé à exporter.');
      return;
    }

    setExportingSentCsv(true);
    try {
      const filepath = await exportSentPCsCSV(pcSentHistory, siteActif?.nom ?? undefined);
      await shareExportedFile(filepath);
      showQuickFeedback('success', 'Export CSV prêt', 'Le fichier PC envoyés a été généré.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      showQuickFeedback('error', 'Export impossible', message);
    } finally {
      setExportingSentCsv(false);
    }
  }, [pcSentHistory, siteActif, showQuickFeedback]);

  const handleDecommissionTablet = useCallback(
    (articleId: number) => {
      setDeleteArticleId(articleId);
      setDeleteModalVisible(true);
      scaleAnim.value = withTiming(1, {
        duration: 400,
        easing: Easing.elastic(1.2),
      });
    },
    [scaleAnim],
  );

  const confirmDecommissionTablet = useCallback(async () => {
    if (!deleteArticleId) return;

    console.log('[ArticlesListScreen.confirmDecommissionTablet] Start for id:', deleteArticleId);
    setIsDeleting(true);
    try {
      const current = articles.find((a) => a.id === deleteArticleId);
      const currentDescription = (current?.description ?? '').trim();
      const nextDescription = currentDescription.toLowerCase().includes('décommission') || currentDescription.toLowerCase().includes('decommission')
        ? currentDescription
        : `Statut: Décommissionnée${currentDescription ? ` | ${currentDescription}` : ''}`;

      await articleRepository.update(deleteArticleId, {
        description: nextDescription,
      });

      setArticles((prevArticles) =>
        prevArticles.map((a) =>
          a.id === deleteArticleId
            ? {
                ...a,
                description: nextDescription,
                dateModification: new Date(),
              }
            : a,
        ),
      );
      
      // Fermer la modale
      setDeleteModalVisible(false);
      scaleAnim.value = 0;
      setDeleteArticleId(null);

      showQuickFeedback('success', 'Succès', 'Tablette décommissionnée avec succès');
    } catch (err: any) {
      console.error('[ArticlesListScreen.confirmDecommissionTablet] Error:', err);
      const errorMsg = err?.message || 'Impossible de décommissionner la tablette';
      showQuickFeedback('error', 'Erreur', errorMsg);
    } finally {
      setIsDeleting(false);
    }
  }, [articles, deleteArticleId, scaleAnim, showQuickFeedback]);

  const cancelDeleteTablet = useCallback(() => {
    scaleAnim.value = withTiming(0, {
      duration: 200,
      easing: Easing.ease,
    });
    setTimeout(() => {
      setDeleteModalVisible(false);
      setDeleteArticleId(null);
    }, 200);
  }, [scaleAnim]);

  const handleAdd = useCallback(() => {
    if (isManagedInventoryTab) {
      setQuickAddVisible(true);
      return;
    }

    navigation.navigate('ArticleEdit');
  }, [navigation, isManagedInventoryTab]);

  useEffect(() => {
    if (!quickAddVisible) return;

    quickModalIntro.value = 0;
    quickModalIntro.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [quickAddVisible, quickModalIntro]);

  const handleQuickAddTablet = useCallback(async () => {
    const hostname = quickHostname.trim();
    const asset = quickAsset.trim();
    const isPC = isPCTab;

    if (!hostname) {
      Alert.alert('Champ requis', `Le hostname du ${isPC ? 'PC' : 'portable'} est obligatoire.`);
      return;
    }
    if (!asset) {
      Alert.alert('Champ requis', `L'asset du ${isPC ? 'PC' : 'portable'} est obligatoire.`);
      return;
    }
    if (!effectiveSiteId) {
      Alert.alert('Site manquant', 'Aucun site actif sélectionné.');
      return;
    }

    setIsQuickSaving(true);
    try {
      const normalizedHostname = hostname.toUpperCase();
      const existing = await articleRepository.findByReference(normalizedHostname);

      let articleId: string | number;

      if (isPC) {
        const pcPayload = {
          nom: normalizedHostname,
          description: `Statut: ${quickPCStatus}`,
          barcode: asset.toUpperCase(),
          famille: 'PC portable',
          typeArticle: presetTypeArticle ?? 'PC',
          sousType: quickPCCategory,
          marque: getBrandFromModel(quickPCModel),
          modele: quickPCModel,
          stockMini: 0,
          unite: 'unité',
        };

        if (existing) {
          articleId = existing.id;
          await articleRepository.update(existing.id, pcPayload);
        } else {
          articleId = await articleRepository.create({
            reference: normalizedHostname,
            ...pcPayload,
          });
        }
      } else {
        const tabletteFamille = 'Tablette';
        const tabletteCodeFamille = '50';

        if (existing) {
          articleId = existing.id;
          await articleRepository.update(existing.id, {
            nom: normalizedHostname,
            description: `Asset: ${asset.toUpperCase()}`,
            barcode: asset.toUpperCase(),
            codeFamille: tabletteCodeFamille,
            famille: tabletteFamille,
            typeArticle: presetTypeArticle ?? 'Tablette',
            sousType: 'Tablette',
            marque: 'Samsung',
            stockMini: 0,
            unite: 'unité',
          });
        } else {
          articleId = await articleRepository.create({
            reference: normalizedHostname,
            nom: normalizedHostname,
            description: `Asset: ${asset.toUpperCase()}`,
            barcode: asset.toUpperCase(),
            codeFamille: tabletteCodeFamille,
            famille: tabletteFamille,
            typeArticle: presetTypeArticle ?? 'Tablette',
            sousType: 'Tablette',
            marque: 'Samsung',
            stockMini: 0,
            unite: 'unité',
          });
        }
      }

      await stockRepository.createOrUpdate(articleId, effectiveSiteId, 1);

      setQuickHostname('');
      setQuickAsset('');
      setQuickPCCategory('Portable siège');
      setQuickPCModel(PC_CATEGORY_OPTIONS[0].models[0]);
      setQuickPCStatus('À chaud');
      setQuickAddVisible(false);

      pageRef.current = 0;
      setPage(0);
      setHasMore(true);
      await Promise.all([loadArticles(true), loadStats()]);
      showQuickFeedback(
        'success',
        'Synchronisation OK',
        existing
          ? isPC
            ? 'PC mis à jour en base et stock synchronisé.'
            : 'Tablette mise à jour en base et stock synchronisé.'
          : isPC
            ? 'PC ajouté en base et stock mis à jour.'
            : 'Tablette ajoutée en base et stock mis à jour.',
      );
    } catch (error) {
      console.error(`Erreur ajout ${isPC ? 'PC' : 'tablette'}:`, error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      showQuickFeedback('error', 'Echec de synchronisation', `Impossible d'ajouter le ${isPC ? 'PC' : 'portable'}. ${message}`);
    } finally {
      setIsQuickSaving(false);
    }
  }, [
    isPCTab,
    quickHostname,
    quickAsset,
    quickPCCategory,
    quickPCModel,
    quickPCStatus,
    effectiveSiteId,
    presetTypeArticle,
    loadArticles,
    loadStats,
    showQuickFeedback,
  ]);

  const openPCActionModal = useCallback((type: 'sent' | 'available' | 'hot', articleId: number | string) => {
    setPCActionModal({ visible: true, type, articleId });
    if (type === 'sent') {
      setDestinationAgencyEds('');
      setDestinationAgencyEdsError(null);
    } else {
      setDestinationAgencyEds('');
      setDestinationAgencyEdsError(null);
    }
    pcActionScaleAnim.value = withTiming(1, {
      duration: 380,
      easing: Easing.elastic(1.08),
    });
  }, [articles, pcActionScaleAnim]);

  const closePCActionModal = useCallback(() => {
    pcActionScaleAnim.value = withTiming(0, {
      duration: 180,
      easing: Easing.ease,
    });
    setTimeout(() => {
      setPCActionModal((prev) => ({ ...prev, visible: false, articleId: null }));
      setIsPCActionSubmitting(false);
      setDestinationAgencyEds('');
      setDestinationAgencyEdsError(null);
    }, 180);
  }, [pcActionScaleAnim]);

  const confirmPCAction = useCallback(async () => {
    if (!pcActionModal.articleId) return;

    if (pcActionModal.type === 'sent') {
      const normalizedDestinationEds = destinationAgencyEds.trim();
      if (!/^\d{1,3}$/.test(normalizedDestinationEds)) {
        setDestinationAgencyEdsError('Renseignez un numéro EDS valide (max 3 chiffres).');
        return;
      }
      setDestinationAgencyEdsError(null);
    }

    setIsPCActionSubmitting(true);
    try {
      if (pcActionModal.type === 'sent') {
        const normalizedDestinationEds = destinationAgencyEds.trim();
        const targetArticleSent = articles.find((a) => String(a.id) === String(pcActionModal.articleId));
        if (targetArticleSent) {
          const techName = currentTechnicien
            ? `${currentTechnicien.prenom} ${currentTechnicien.nom}`.trim()
            : 'Technicien inconnu';

          await pcSentService.record({
            articleId: String(targetArticleSent.id),
            hostname: targetArticleSent.nom?.trim() || targetArticleSent.reference?.trim() || 'PC inconnu',
            asset: targetArticleSent.barcode?.trim(),
            model: targetArticleSent.modele?.trim(),
            brand: targetArticleSent.marque?.trim(),
            sourceSiteId: String(effectiveSiteId),
            sourceSiteName: siteActif?.nom ?? undefined,
            sourceAgencyEds: siteActif?.edsNumber != null ? String(siteActif.edsNumber) : undefined,
            destinationAgencyEds: normalizedDestinationEds,
            sentByUserId: currentTechnicien?.id != null ? String(currentTechnicien.id) : undefined,
            sentByName: techName,
          });
        }

        await articleRepository.update(pcActionModal.articleId, {
          description: `Statut: Envoyé | EDS destination: ${normalizedDestinationEds}`,
          famille: 'PC envoyé',
          emplacement: `EDS ${normalizedDestinationEds}`,
        });
        setArticles((prev) => prev.map((article) => (
          String(article.id) === String(pcActionModal.articleId)
            ? {
                ...article,
                description: `Statut: Envoyé | EDS destination: ${normalizedDestinationEds}`,
                famille: 'PC envoyé',
                emplacement: `EDS ${normalizedDestinationEds}`,
                dateModification: new Date(),
              }
            : article
        )));
        if (targetArticleSent) {
          const techName = currentTechnicien
            ? `${currentTechnicien.prenom} ${currentTechnicien.nom}`.trim()
            : 'Technicien inconnu';
          const techAcronym = getTechnicienAcronym(currentTechnicien?.prenom, currentTechnicien?.nom);
          notifyPCStatusChange({
            article: targetArticleSent,
            nextStatus: 'Envoyé',
            technicienName: techName,
            technicienAcronym: techAcronym,
            sourceAgencyName: siteActif?.nom,
            sourceAgencyEds: siteActif?.edsNumber != null ? String(siteActif.edsNumber) : undefined,
            destinationAgencyEds: normalizedDestinationEds,
          });

          const hostname = targetArticleSent.nom?.trim() || targetArticleSent.reference?.trim() || 'PC inconnu';
          const sourceAgencyLabel = siteActif?.nom?.trim() || 'Agence inconnue';
          const sourceEdsLabel = siteActif?.edsNumber ? ` (EDS ${siteActif.edsNumber})` : '';
          showQuickFeedback(
            'success',
            'PC envoyé',
            `${hostname} envoyé par ${sourceAgencyLabel}${sourceEdsLabel} vers l'agence EDS ${normalizedDestinationEds}.`,
          );
        } else {
          showQuickFeedback(
            'success',
            'PC envoyé',
            `Le PC a été marqué envoyé vers l'agence EDS ${normalizedDestinationEds}.`,
          );
        }
        await loadSentHistory();
        await loadStats();
      } else if (pcActionModal.type === 'available') {
        await articleRepository.update(pcActionModal.articleId, {
          description: 'Statut: Disponible',
          famille: 'PC disponible',
        });
        setArticles((prev) => prev.map((article) => (
          article.id === pcActionModal.articleId
            ? {
                ...article,
                description: 'Statut: Disponible',
                famille: 'PC disponible',
                dateModification: new Date(),
              }
            : article
        )));
        const targetArticleAvailable = articles.find((a) => String(a.id) === String(pcActionModal.articleId));
        if (targetArticleAvailable) {
          const techName = currentTechnicien
            ? `${currentTechnicien.prenom} ${currentTechnicien.nom}`.trim()
            : 'Technicien inconnu';
          notifyPCStatusChange({
            article: { ...targetArticleAvailable, description: 'Statut: Disponible', famille: 'PC disponible' },
            nextStatus: 'Disponible',
            technicienName: techName,
          });
        }
        await loadStats();
        showQuickFeedback('success', 'PC disponible', 'Le PC a été déplacé dans la catégorie disponible.');
      } else {
        await articleRepository.update(pcActionModal.articleId, {
          description: 'Statut: À chaud',
          famille: 'PC portable',
        });
        setArticles((prev) => prev.map((article) => (
          article.id === pcActionModal.articleId
            ? {
                ...article,
                description: 'Statut: À chaud',
                famille: 'PC portable',
                dateModification: new Date(),
              }
            : article
        )));
        const targetArticleHot = articles.find((a) => String(a.id) === String(pcActionModal.articleId));
        if (targetArticleHot) {
          const techName = currentTechnicien
            ? `${currentTechnicien.prenom} ${currentTechnicien.nom}`.trim()
            : 'Technicien inconnu';
          notifyPCStatusChange({
            article: { ...targetArticleHot, description: 'Statut: À chaud', famille: 'PC portable' },
            nextStatus: 'À chaud',
            technicienName: techName,
          });
        }
        await loadStats();
        showQuickFeedback('success', 'PC à chaud', 'Le PC a été remis en statut à chaud.');
      }
      closePCActionModal();
    } catch (error: any) {
      setIsPCActionSubmitting(false);
      showQuickFeedback(
        'error',
        'Erreur',
        error?.message || (
          pcActionModal.type === 'sent'
            ? "Impossible d'envoyer ce PC."
            : pcActionModal.type === 'available'
              ? 'Impossible de mettre ce PC en disponible.'
              : 'Impossible de remettre ce PC à chaud.'
        ),
      );
    }
  }, [pcActionModal, articles, currentTechnicien, destinationAgencyEds, effectiveSiteId, siteActif, loadStats, loadSentHistory, showQuickFeedback, closePCActionModal]);

  const handleMarkPCSent = useCallback((articleId: number | string) => {
    openPCActionModal('sent', articleId);
  }, [openPCActionModal]);

  const handleMarkPCAvailable = useCallback((articleId: number | string) => {
    openPCActionModal('available', articleId);
  }, [openPCActionModal]);

  const handleMarkPCHot = useCallback((articleId: number | string) => {
    openPCActionModal('hot', articleId);
  }, [openPCActionModal]);

  const handleScan = useCallback(() => {
    navigation.navigate('Scan');
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    if (isManagedInventoryTab) return;
    if (!isLoadingMore && hasMore) {
      loadArticles(false);
    }
  }, [isManagedInventoryTab, isLoadingMore, hasMore, loadArticles]);

  const handleRefresh = useCallback(async () => {
    Vibration.vibrate(10);
    setRefreshing(true);
    pageRef.current = 0;
    setPage(0);
    setHasMore(true);
    await loadArticles(true);
    await loadStats();
    setRefreshing(false);
  }, [loadArticles, loadStats]);

  // ===== MODAL OPTIONS =====
  const sortOptions = useMemo<FilterOption[]>(() => {
    if (isTabletTab) {
      return [
        { id: 'nom', label: TABLET_SORT_LABELS.nom ?? 'Hostname A-Z' },
        { id: 'reference', label: TABLET_SORT_LABELS.reference ?? 'Asset' },
        { id: 'date', label: TABLET_SORT_LABELS.date ?? 'Dernière mise à jour' },
      ];
    }

    if (isPCTab) {
      return [
        { id: 'nom', label: PC_SORT_LABELS.nom ?? 'Hostname A-Z' },
        { id: 'reference', label: PC_SORT_LABELS.reference ?? 'Asset' },
        { id: 'date', label: PC_SORT_LABELS.date ?? 'Dernière mise à jour' },
      ];
    }

    return Object.entries(SORT_LABELS).map(([key, label]) => ({
      id: key,
      label,
    }));
  }, [isPCTab, isTabletTab]);

  const currentSortLabel = useMemo(() => {
    if (isTabletTab) {
      return TABLET_SORT_LABELS[sortBy] ?? TABLET_SORT_LABELS.nom ?? 'Hostname A-Z';
    }

    if (isPCTab) {
      return PC_SORT_LABELS[sortBy] ?? PC_SORT_LABELS.nom ?? 'Hostname A-Z';
    }

    return SORT_LABELS[sortBy];
  }, [isPCTab, isTabletTab, sortBy]);

  // ===== EMPTY STATE TYPE =====
  const emptyType = useMemo(() => {
    if (searchQuery.length > 0) return 'no-results' as const;
    if (
      pcStatusFilter !== null ||
      filters.stockFaible ||
      filters.codeFamille ||
      filters.famille ||
      (!lockPresetTypeArticle && filters.typeArticle) ||
      filters.sousType ||
      filters.marque ||
      filters.modele ||
      filters.emplacement
    )
      return 'no-filters' as const;
    return 'no-articles' as const;
  }, [searchQuery, filters, pcStatusFilter, lockPresetTypeArticle]);

  const emptyAction = useMemo(() => {
    if (emptyType === 'no-results') return handleClearSearch;
    if (emptyType === 'no-filters') return resetFilters;
    return handleAdd;
  }, [emptyType, handleClearSearch, resetFilters, handleAdd]);

  // ===== RENDER =====
  const renderArticle = useCallback(
    ({ item }: { item: Article }) => (
      <View style={[styles.cardWrapper, isTablet && styles.cardWrapperTablet]}>
        <PremiumArticleCard 
          article={item} 
          onPress={isPCTab && pcStatusFilter === 'Envoyé' ? handleSentArticlePress : handleArticlePress}
          onDecommission={isTabletTab ? handleDecommissionTablet : undefined}
          onMarkSent={isPCTab ? handleMarkPCSent : undefined}
          onMarkAvailable={isPCTab ? handleMarkPCAvailable : undefined}
          onMarkHot={isPCTab ? handleMarkPCHot : undefined}
        />
      </View>
    ),
    [handleArticlePress, handleSentArticlePress, pcStatusFilter, isTabletTab, handleDecommissionTablet, isPCTab, handleMarkPCSent, handleMarkPCAvailable, handleMarkPCHot, isTablet],
  );

  const stockOK = useMemo(
    () => Math.max(0, totalArticles - alertes),
    [totalArticles, alertes],
  );

  const renderFooter = useCallback(() => {
    return <View style={styles.listBottomSpacer} />;
  }, []);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <ArticleEmptyState
        type={emptyType}
        searchQuery={searchQuery}
        onAction={isTabletTab ? undefined : emptyAction}
        mode={isTabletTab ? 'tablettes' : isPCTab ? 'pc' : 'articles'}
      />
    );
  }, [isLoading, emptyType, searchQuery, emptyAction, isTabletTab, isPCTab]);

  const renderListHeader = useCallback(() => (
    <>
      <PremiumArticleHeader
        title={isTabletTab ? 'Tablettes' : isPCTab ? 'Parc PC' : 'Articles'}
        mode={isTabletTab ? 'tablettes' : isPCTab ? 'pc' : 'articles'}
        statsMode={isTabletTab ? 'totalOnly' : 'full'}
        totalArticles={totalArticles}
        stockOK={stockOK}
        alertes={alertes}
        pcHot={pcHotCount}
        pcReconditioning={pcReconditioningCount}
        pcProcessing={pcProcessingCount}
        pcAvailable={pcAvailableCount}
        pcSent={pcSentCount}
        pcFocusedStats={
          isPCTab && pcCategoryStats
            ? {
                label: pcCategoryStats.label,
                total: pcCategoryStats.total,
                agence: pcCategoryStats.agence,
                siege: pcCategoryStats.siege,
              }
            : null
        }
        pcFocusedModels={
          isPCTab && pcCategoryStats
            ? pcCategoryStats.modelCounts.map((item) => ({ label: item.brand, count: item.count }))
            : []
        }
        activePCModelLabel={filters.modele?.[0] ?? null}
        tabletDecommissionedCount={tabletDecommissionedStats.count}
        tabletDecommissionedNames={tabletDecommissionedStats.names}
        activeTabletFilter={tabletStatusFilter}
        onAdd={handleAdd}
        onTabletFilterChange={(next) => setTabletStatusFilter(next)}
        onPCModelPress={(label) => {
          setFilters((prev) => {
            const isSameModel = prev.modele?.length === 1 && prev.modele[0] === label;
            return {
              ...prev,
              modele: isSameModel ? null : [label],
            };
          });
        }}
        onTotalPress={() => {
          resetFilters();
          setPcStatusFilter(null);
        }}
        onStockOKPress={
          isTabletTab
            ? undefined
            : isPCTab
              ? () => setPcStatusFilter((prev) => prev === 'À chaud' ? null : 'À chaud')
              : () => {
                  if (filters.stockFaible) {
                    setFilters(prev => ({ ...prev, stockFaible: false }));
                  }
                }
        }
        onAlertesPress={
          isTabletTab
            ? undefined
            : isPCTab
              ? () => setPcStatusFilter((prev) => prev === 'À reusiner' ? null : 'À reusiner')
              : () => {
                  setFilters(prev => ({ ...prev, stockFaible: !prev.stockFaible }));
                }
        }
        onProcessingPress={
          isPCTab
            ? () => setPcStatusFilter((prev) => prev === 'En usinage' ? null : 'En usinage')
            : undefined
        }
        onAvailablePress={
          isPCTab
            ? () => setPcStatusFilter((prev) => prev === 'Disponible' ? null : 'Disponible')
            : undefined
        }
        onSentPress={
          isPCTab
            ? () => setPcStatusFilter((prev) => prev === 'Envoyé' ? null : 'Envoyé')
            : undefined
        }
      />

      <View style={[
        styles.searchWrapper,
        isTabletTab && styles.searchWrapperTablet,
        contentMaxWidth && !isPCTab ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : {},
      ]}>
        <PremiumSearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          onClear={handleClearSearch}
          placeholder={isTabletTab ? 'Rechercher par hostname ou asset...' : isPCTab ? 'Rechercher par hostname, asset ou modèle...' : 'Rechercher par référence ou nom...'}
        />
      </View>

      {isPCTab && (
        <>
          <View style={styles.pcStatusFilterRow}>
            {PC_STATUS_FILTER_OPTIONS.map((status) => {
              const isActive = pcStatusFilter === status;
              const activeColor =
                status === 'À chaud'
                  ? '#059669'
                  : status === 'En usinage'
                    ? '#EA580C'
                  : status === 'Disponible'
                    ? '#2563EB'
                    : status === 'Envoyé'
                      ? '#BE123C'
                      : '#D97706';
              const activeBg =
                status === 'À chaud'
                  ? '#ECFDF5'
                  : status === 'En usinage'
                    ? '#FFF7ED'
                  : status === 'Disponible'
                    ? '#DBEAFE'
                    : status === 'Envoyé'
                      ? '#FFF1F2'
                      : '#FFFBEB';
              return (
                <TouchableOpacity
                  key={status}
                  activeOpacity={0.8}
                  onPress={() => setPcStatusFilter(isActive ? null : status)}
                  style={[
                    styles.pcStatusFilterBtn,
                    {
                      backgroundColor: isActive ? activeBg : colors.backgroundSubtle,
                      borderColor: isActive ? activeColor : colors.borderSubtle,
                    },
                  ]}
                >
                  <Icon
                    name={status === 'À chaud' ? 'flash' : status === 'En usinage' ? 'cog-play-outline' : status === 'Disponible' ? 'check-circle' : status === 'Envoyé' ? 'send-outline' : 'wrench'}
                    size={14}
                    color={isActive ? activeColor : colors.textMuted}
                  />
                  <Text numberOfLines={1} style={[styles.pcStatusFilterText, { color: isActive ? activeColor : colors.textSecondary }]}>
                    {status}
                  </Text>
                  {isActive && (
                    <Icon name="close-circle" size={14} color={activeColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {pcStatusFilter === 'Envoyé' && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleExportSentCsv}
              disabled={exportingSentCsv}
              style={[
                styles.pcSentExportBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  opacity: exportingSentCsv ? 0.65 : 1,
                },
              ]}
            >
              {exportingSentCsv ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Icon name="file-delimited-outline" size={16} color={colors.primary} />
              )}
              <Text style={[styles.pcSentExportBtnText, { color: colors.textPrimary }]}>
                {exportingSentCsv ? 'Export CSV en cours...' : 'Exporter les PC envoyés (CSV)'}
              </Text>
            </TouchableOpacity>
          )}

        </>
      )}

      <FiltersPanel
        sortBy={sortBy}
        sortLabel={currentSortLabel}
        showStockFaible={filters.stockFaible}
        showStockFaibleChip={!isManagedInventoryTab}
        filtersLabel={isTabletTab ? 'Filtres tablette' : isPCTab ? 'Filtres PC' : 'Filtres'}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
        onSortPress={() => setSortModalVisible(true)}
        onFiltersPress={() => setFiltersSheetVisible(true)}
        onStockFaibleToggle={toggleStockFaible}
        onReset={resetFilters}
      />
    </>
  ), [
    isTabletTab,
    isPCTab,
    totalArticles,
    stockOK,
    alertes,
    pcHotCount,
    pcReconditioningCount,
    pcProcessingCount,
    pcAvailableCount,
    pcSentCount,
    handleAdd,
    resetFilters,
    filters.stockFaible,
    tabletStatusFilter,
    tabletDecommissionedStats.count,
    tabletDecommissionedStats.names,
    contentMaxWidth,
    searchQuery,
    handleSearchChange,
    handleClearSearch,
    pcStatusFilter,
    handleExportSentCsv,
    exportingSentCsv,
    sortBy,
    isManagedInventoryTab,
    hasActiveFilters,
    activeFiltersCount,
    toggleStockFaible,
    pcCategoryStats,
    filters.modele,
    colors,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />

      {renderListHeader()}

      {/* Articles List */}
      <View style={styles.listContainer}>
      {isLoading ? (
        <SkeletonArticleList count={6} />
      ) : (
        <FlashList<Article>
          data={displayedArticles}
          keyExtractor={item => item.id.toString()}
          renderItem={renderArticle}
          numColumns={numColumns}
          estimatedItemSize={140}
          contentContainerStyle={[
            styles.listContent,
            isTabletTab && styles.listContentTablet,
            contentMaxWidth && !isPCTab ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : {},
          ] as any}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
      </View>

      {/* Bouton Ajouter Tablette - UNIQUEMENT en mode Tablette */}
      {!isSuperviseur && isTabletTab && (
        <View style={styles.tabletteAddFabWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAdd}
            style={styles.tabletteAddFab}
          >
            <LinearGradient
              colors={['#007A39', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabletteAddFabGradient}
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.tabletteAddFabText}>Ajouter une tablette</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB Multi-Action – MASQUÉ en mode Tablette */}
      {showFAB && (
        <FABMultiAction onScan={handleScan} onAdd={handleAdd} />
      )}

      {/* Modals */}
      <ArticlesFilterSheet
        visible={filtersSheetVisible}
        filterValues={{
          codeFamille: filters.codeFamille ?? null,
          famille: filters.famille ?? null,
          typeArticle: filters.typeArticle ?? null,
          sousType: filters.sousType ?? null,
          marque: filters.marque ?? null,
          modele: filters.modele ?? null,
          emplacement: filters.emplacement ?? null,
        }}
        allowedKeys={isTabletTab ? ['marque', 'emplacement'] : isPCTab ? ['sousType', 'marque', 'modele', 'emplacement'] : undefined}
        onClose={() => setFiltersSheetVisible(false)}
        onSelectRow={(key) => {
          setFiltersSheetVisible(false);
          setActiveFilterModal(key);
        }}
      />
      {activeFilterModalConfig && (
        <FilterModal
          visible={!!activeFilterModal}
          title={activeFilterModalConfig.title}
          options={activeFilterModalConfig.options}
          multiSelect
          selectedValues={activeFilterModalConfig.selectedValues as string[]}
          onSelectMulti={(values) =>
            handleFilterSelect(activeFilterModalConfig.key, values)
          }
          onClose={() => {
            setActiveFilterModal(null);
            setFiltersSheetVisible(true);
          }}
        />
      )}
      <FilterModal
        visible={sortModalVisible}
        title={isTabletTab ? 'Trier les tablettes' : isPCTab ? 'Trier les PC' : 'Trier par'}
        options={sortOptions}
        selectedValue={sortBy}
        onSelect={handleSortSelect}
        onClose={() => setSortModalVisible(false)}
      />

      <Modal
        visible={quickAddVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isQuickSaving) setQuickAddVisible(false);
        }}
      >
        <View style={styles.quickModalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.quickModalKeyboardWrapper}
          >
            <Animated.View style={[styles.quickModalFrame, quickModalIntroStyle]}>
              <ScrollView
                style={styles.quickModalScroll}
                contentContainerStyle={styles.quickModalScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                <View style={[styles.quickModalCard, { backgroundColor: colors.surface }]}> 
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(16,185,129,0.16)', 'rgba(14,165,233,0.04)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.quickTopAccent}
                  />
                  <View pointerEvents="none" style={styles.quickDecoOrbOne} />
                  <View pointerEvents="none" style={styles.quickDecoOrbTwo} />
                  <View pointerEvents="none" style={styles.quickDecoGrid} />

                  <LinearGradient
                    colors={isPCTab ? ['#0B5D3B', '#083D2A'] : ['#F3FBF8', '#E3F4EE', '#E9F7FB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.tabletHero, !isPCTab && styles.tabletHeroLight]}
                  >
                    <View style={[styles.tabletHeroGlow, isPCTab ? styles.pcHeroGlow : styles.tabletHeroGlowLight]} />
                    <View style={[styles.tabletHeroGlowSecondary, !isPCTab && styles.tabletHeroGlowSecondaryLight]} />
                    <View style={styles.tabletMockup}>
                      <View style={[styles.tabletBezel, isPCTab ? styles.pcBezel : styles.tabletBezelLight]}>
                        <LinearGradient
                          colors={isPCTab ? ['#0F172A', '#1F2937'] : ['#FFFFFF', '#F1F9F6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.tabletScreen}
                        >
                          <Icon name={isPCTab ? 'laptop' : 'tablet-dashboard'} size={34} color={isPCTab ? '#86EFAC' : '#0284C7'} />
                        </LinearGradient>
                        <View style={[styles.tabletCameraDot, !isPCTab && styles.tabletCameraDotLight]} />
                      </View>
                    </View>
                    <View style={styles.tabletHeroTextWrap}>
                      <Text style={[styles.tabletHeroBrand, !isPCTab && styles.tabletHeroBrandLight]}>{isPCTab ? 'PARC PORTABLE' : 'Samsung'}</Text>
                      <Text style={[styles.tabletHeroModel, !isPCTab && styles.tabletHeroModelLight]}>{isPCTab ? quickPCModel : 'Galaxy Tab'}</Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.quickMetaRow}>
                    <View style={[styles.quickMetaPill, { backgroundColor: 'rgba(0,122,57,0.12)', borderColor: 'rgba(5,150,105,0.22)' }]}>
                      <Icon name="shield-check-outline" size={13} color="#007A39" />
                      <Text style={styles.quickMetaPillText}>Ajout sécurisé</Text>
                    </View>
                    <View style={[styles.quickMetaPill, { backgroundColor: 'rgba(14,165,233,0.14)', borderColor: 'rgba(14,116,144,0.2)' }]}>
                      <Icon name={isPCTab ? 'laptop' : 'database-sync-outline'} size={13} color="#0369A1" />
                      <Text style={[styles.quickMetaPillText, { color: '#0369A1' }]}>{isPCTab ? quickPCCategory : 'Synchro stock'}</Text>
                    </View>
                  </View>

                  <Text style={[styles.quickModalTitle, { color: colors.textPrimary }]}>{isPCTab ? 'Ajouter un PC portable' : 'Ajouter une tablette'}</Text>
                  <Text style={[styles.quickModalSubtitle, { color: colors.textSecondary }]}>{isPCTab ? 'Catégorie, modèle, statut, hostname et asset obligatoires' : 'Hostname et Asset obligatoires'}</Text>
                  <View style={[styles.quickSectionDivider, { backgroundColor: colors.borderSubtle }]} />

                  {isPCTab && (
                    <>
                      <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Catégorie</Text>
                      <View style={styles.quickChoiceRow}>
                        {PC_CATEGORY_OPTIONS.map((option) => {
                          const selected = quickPCCategory === option.value;
                          return (
                            <TouchableOpacity
                              key={option.value}
                              activeOpacity={0.8}
                              disabled={isQuickSaving}
                              onPress={() => setQuickPCCategory(option.value)}
                              style={[
                                styles.quickChoiceChip,
                                {
                                  backgroundColor: selected ? '#E8F8F0' : colors.backgroundSubtle,
                                  borderColor: selected ? '#007A39' : colors.borderSubtle,
                                },
                              ]}
                            >
                              <Icon name="laptop" size={15} color={selected ? '#007A39' : colors.textMuted} />
                              <Text style={[styles.quickChoiceChipText, { color: selected ? '#007A39' : colors.textSecondary }]}>{option.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Modèle</Text>
                      <View style={styles.quickChoiceRow}>
                        {quickPCModelOptions.map((model) => {
                          const selected = quickPCModel === model;
                          return (
                            <TouchableOpacity
                              key={model}
                              activeOpacity={0.8}
                              disabled={isQuickSaving}
                              onPress={() => setQuickPCModel(model)}
                              style={[
                                styles.quickChoiceChip,
                                styles.quickChoiceChipWide,
                                {
                                  backgroundColor: selected ? '#ECFDF5' : colors.backgroundSubtle,
                                  borderColor: selected ? '#10B981' : colors.borderSubtle,
                                },
                              ]}
                            >
                              <Icon name="tag-outline" size={15} color={selected ? '#059669' : colors.textMuted} />
                              <Text style={[styles.quickChoiceChipText, { color: selected ? '#059669' : colors.textSecondary }]}>{model}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Statut</Text>
                      <View style={styles.quickChoiceRow}>
                        {PC_STATUS_OPTIONS.map((status) => {
                          const selected = quickPCStatus === status;
                          const activeColor =
                            status === 'À chaud'
                              ? '#059669'
                              : status === 'En usinage'
                                ? '#EA580C'
                                : status === 'Disponible'
                                  ? '#2563EB'
                                  : '#D97706';
                          return (
                            <TouchableOpacity
                              key={status}
                              activeOpacity={0.8}
                              disabled={isQuickSaving}
                              onPress={() => setQuickPCStatus(status)}
                              style={[
                                styles.quickChoiceChip,
                                {
                                  backgroundColor: selected ? `${activeColor}14` : colors.backgroundSubtle,
                                  borderColor: selected ? activeColor : colors.borderSubtle,
                                },
                              ]}
                            >
                              <Icon name={status === 'À chaud' ? 'flash-outline' : status === 'En usinage' ? 'cog-play-outline' : status === 'Disponible' ? 'check-circle-outline' : 'wrench-outline'} size={15} color={selected ? activeColor : colors.textMuted} />
                              <Text style={[styles.quickChoiceChipText, { color: selected ? activeColor : colors.textSecondary }]}>{status}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Hostname <Text style={{ color: '#EF4444' }}>*</Text></Text>
                  <View style={[
                    styles.quickInputRow,
                    { borderColor: !quickHostname.trim() ? colors.borderSubtle : '#007A39', backgroundColor: colors.backgroundSubtle },
                  ]}>
                    <View style={styles.quickInputIconWrap}>
                      <Icon name="laptop" size={16} color="#007A39" />
                    </View>
                    <TextInput
                      value={quickHostname}
                      onChangeText={setQuickHostname}
                      editable={!isQuickSaving}
                      placeholder={isPCTab ? getQuickHostnamePlaceholder(quickPCCategory) : 'Ex: TC22-STRAS-014'}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[
                        styles.quickInput,
                        { color: colors.textPrimary },
                      ]}
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        Vibration.vibrate(15);
                        if (!camDevice) {
                          Alert.alert('Caméra indisponible', "Aucune caméra n'a été détectée.");
                          return;
                        }
                        if (!hasCamPermission) {
                          const granted = await requestCamPermission();
                          if (!granted) {
                            Alert.alert(
                              'Accès à la caméra',
                              "L'accès à la caméra est nécessaire pour scanner.",
                              [
                                { text: 'Annuler', style: 'cancel' },
                                { text: 'Paramètres', onPress: () => Linking.openSettings() },
                              ],
                            );
                            return;
                          }
                        }
                        setScanTarget('hostname');
                      }}
                      disabled={isQuickSaving}
                      style={styles.quickScanBtn}
                      activeOpacity={0.75}
                    >
                      <View style={styles.quickScanBtnInner}>
                        <Icon name="barcode-scan" size={19} color="#007A39" />
                      </View>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.quickHint, { color: colors.textMuted }]}>{isPCTab ? getQuickHostnameHint(quickPCCategory) : 'Exemple: code parc ou hostname MDM'}</Text>

                  <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Asset</Text>
                  <View style={[
                    styles.quickInputRow,
                    { borderColor: colors.borderSubtle, backgroundColor: colors.backgroundSubtle },
                  ]}>
                    <View style={styles.quickInputIconWrap}>
                      <Icon name="tag-outline" size={16} color="#007A39" />
                    </View>
                    <TextInput
                      value={quickAsset}
                      onChangeText={setQuickAsset}
                      editable={!isQuickSaving}
                      placeholder={isPCTab ? 'Ex: AO44XXXX' : 'Ex: AST-001245'}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[
                        styles.quickInput,
                        { color: colors.textPrimary },
                      ]}
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        Vibration.vibrate(15);
                        if (!camDevice) {
                          Alert.alert('Caméra indisponible', "Aucune caméra n'a été détectée.");
                          return;
                        }
                        if (!hasCamPermission) {
                          const granted = await requestCamPermission();
                          if (!granted) {
                            Alert.alert(
                              'Accès à la caméra',
                              "L'accès à la caméra est nécessaire pour scanner.",
                              [
                                { text: 'Annuler', style: 'cancel' },
                                { text: 'Paramètres', onPress: () => Linking.openSettings() },
                              ],
                            );
                            return;
                          }
                        }
                        setScanTarget('asset');
                      }}
                      disabled={isQuickSaving}
                      style={styles.quickScanBtn}
                      activeOpacity={0.75}
                    >
                      <View style={styles.quickScanBtnInner}>
                        <Icon name="barcode-scan" size={19} color="#007A39" />
                      </View>
                    </TouchableOpacity>
                  </View>
                  {isPCTab && (
                    <Text style={[styles.quickHint, { color: colors.textMuted }]}>Le modèle et le statut seront visibles directement sur la carte PC.</Text>
                  )}

                  <View style={styles.quickActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={isQuickSaving}
                      onPress={() => setQuickAddVisible(false)}
                      style={[styles.quickBtn, styles.quickBtnGhost, { borderColor: colors.borderSubtle, backgroundColor: colors.backgroundSubtle }]}
                    >
                      <Text style={[styles.quickBtnGhostText, { color: colors.textSecondary }]}>Annuler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isQuickSaving}
                      onPress={handleQuickAddTablet}
                      style={[styles.quickBtn, styles.quickBtnPrimary]}
                    >
                      <LinearGradient
                        colors={['#007A39', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.quickBtnPrimaryGradient}
                      >
                        {isQuickSaving ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Icon name="content-save-check-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.quickBtnPrimaryText}>{isPCTab ? 'Enregistrer le PC' : 'Enregistrer'}</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ===== BARCODE CAMERA MODAL (hostname + asset) ===== */}
      <Modal
        visible={scanTarget !== null}
        animationType="slide"
        onRequestClose={() => setScanTarget(null)}
      >
        <View style={styles.qaCameraContainer}>
          {camDevice && hasCamPermission ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={camDevice}
              isActive={scanTarget !== null}
              codeScanner={codeScanner}
              photo={false}
              video={false}
              audio={false}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
          )}
          <View style={styles.qaCameraOverlay} pointerEvents="box-none">
            <View style={styles.qaCameraHeader}>
              <TouchableOpacity
                style={styles.qaCameraCloseBtn}
                onPress={() => { Vibration.vibrate(10); setScanTarget(null); }}
              >
                <Icon name="close" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.qaCameraTitle}>{scanTarget === 'hostname' ? 'Scanner le hostname' : "Scanner l'asset"}</Text>
              <View style={{ width: 42 }} />
            </View>
            <View style={styles.qaCameraFrameWrap}>
              <View style={styles.qaCameraFrame}>
                <View style={[styles.qaCameraCorner, styles.qaCamCTL]} />
                <View style={[styles.qaCameraCorner, styles.qaCamCTR]} />
                <View style={[styles.qaCameraCorner, styles.qaCamCBL]} />
                <View style={[styles.qaCameraCorner, styles.qaCamCBR]} />
              </View>
            </View>
            <Text style={styles.qaCameraHint}>Positionnez le code-barres dans le cadre</Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={quickFeedback.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickFeedback((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.feedbackOverlay} pointerEvents="box-none">
          <View style={styles.feedbackWrap}>
            <LinearGradient
              colors={
                quickFeedback.type === 'success'
                  ? ['#064E3B', '#065F46']
                  : ['#7F1D1D', '#991B1B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.feedbackCard}
            >
              <View style={styles.feedbackRow}>
                <View
                  style={[
                    styles.feedbackIconBubble,
                    {
                      backgroundColor:
                        quickFeedback.type === 'success'
                          ? 'rgba(16,185,129,0.26)'
                          : 'rgba(239,68,68,0.26)',
                    },
                  ]}
                >
                  <Icon
                    name={quickFeedback.type === 'success' ? 'check-decagram' : 'alert-octagon'}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.feedbackTextCol}>
                  <Text style={styles.feedbackTitle}>{quickFeedback.title}</Text>
                  <Text style={styles.feedbackMessage}>{quickFeedback.message}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pcActionModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closePCActionModal}
      >
        <View style={[styles.pcActionModalBackdrop, { backgroundColor: isDark ? 'rgba(3,7,18,0.82)' : 'rgba(15,23,42,0.42)' }]}>
          <PCActionModalContent
            colors={colors}
            isDark={isDark}
            scaleAnim={pcActionScaleAnim}
            isSubmitting={isPCActionSubmitting}
            actionType={pcActionModal.type}
            articleLabel={selectedPCActionArticle?.nom || selectedPCActionArticle?.reference || undefined}
            sourceAgencyLabel={siteActif?.nom || undefined}
            sourceAgencyEds={siteActif?.edsNumber != null ? String(siteActif.edsNumber) : undefined}
            destinationEds={destinationAgencyEds}
            destinationEdsError={destinationAgencyEdsError}
            onDestinationEdsChange={setDestinationAgencyEds}
            onClearDestinationEdsError={() => setDestinationAgencyEdsError(null)}
            onCancel={closePCActionModal}
            onConfirm={confirmPCAction}
          />
        </View>
      </Modal>

      {/* Delete Confirmation Modal - Premium & Magical */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDeleteTablet}
      >
        <View style={[styles.deleteModalBackdrop, { backgroundColor: isDark ? 'rgba(5,5,10,0.85)' : 'rgba(0,0,0,0.7)' }]}>
          <DeleteModalContent
            colors={colors}
            isDark={isDark}
            isDeleting={isDeleting}
            scaleAnim={scaleAnim}
            onCancel={cancelDeleteTablet}
            onConfirm={confirmDecommissionTablet}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  searchWrapper: {
    paddingTop: premiumSpacing.md,
  },
  searchWrapperTablet: {
    paddingHorizontal: premiumSpacing.md,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: premiumSpacing.sm,
    paddingBottom: 100, // Espace pour le FAB
  },
  listContentTablet: {
    paddingHorizontal: premiumSpacing.sm,
    paddingBottom: 116,
  },
  cardWrapper: {},
  cardWrapperTablet: {
    flex: 1,
    paddingHorizontal: premiumSpacing.sm,
  },
  footerLoader: {
    paddingVertical: premiumSpacing.xl,
    alignItems: 'center',
  },
  listBottomSpacer: {
    height: 80,
  },
  quickModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.4)',
    justifyContent: 'center',
    paddingHorizontal: premiumSpacing.lg,
  },
  quickModalKeyboardWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  quickModalFrame: {
    maxHeight: '92%',
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  quickModalScroll: {
    flexGrow: 0,
  },
  quickModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: premiumSpacing.md + 2,
  },
  quickModalCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    padding: premiumSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  quickTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
  },
  quickDecoOrbOne: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -54,
    right: -42,
    backgroundColor: 'rgba(0,122,57,0.11)',
  },
  quickDecoOrbTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    bottom: -32,
    left: -26,
    backgroundColor: 'rgba(14,165,233,0.11)',
  },
  quickDecoGrid: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 82,
    height: 82,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    opacity: 0.25,
  },
  tabletHero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: premiumSpacing.md + 2,
    overflow: 'hidden',
    position: 'relative',
  },
  tabletHeroLight: {
    borderColor: 'rgba(14,116,144,0.18)',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  tabletHeroGlow: {
    position: 'absolute',
    right: -22,
    top: -18,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34,211,238,0.22)',
  },
  pcHeroGlow: {
    backgroundColor: 'rgba(134,239,172,0.18)',
  },
  tabletHeroGlowLight: {
    backgroundColor: 'rgba(14,165,233,0.2)',
  },
  tabletHeroGlowSecondary: {
    position: 'absolute',
    left: -28,
    bottom: -22,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(148,163,184,0.14)',
  },
  tabletHeroGlowSecondaryLight: {
    backgroundColor: 'rgba(16,185,129,0.16)',
  },
  tabletMockup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletBezel: {
    width: 130,
    height: 86,
    borderRadius: 12,
    backgroundColor: '#020617',
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletBezelLight: {
    backgroundColor: '#D9F3EA',
    borderColor: 'rgba(14,116,144,0.28)',
  },
  pcBezel: {
    width: 150,
    height: 92,
  },
  tabletScreen: {
    flex: 1,
    width: '100%',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletCameraDot: {
    position: 'absolute',
    top: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
  },
  tabletCameraDotLight: {
    backgroundColor: '#94A3B8',
  },
  tabletHeroTextWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  tabletHeroBrand: {
    color: '#E2E8F0',
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  tabletHeroBrandLight: {
    color: '#0F766E',
  },
  tabletHeroModel: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  tabletHeroModelLight: {
    color: '#0F172A',
  },
  quickMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: premiumSpacing.sm + 2,
    flexWrap: 'wrap',
  },
  quickMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  quickMetaPillText: {
    color: '#007A39',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  quickModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 30,
    marginTop: 1,
  },
  quickModalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    marginBottom: premiumSpacing.sm,
    lineHeight: 19,
  },
  quickSectionDivider: {
    width: '100%',
    height: 1,
    opacity: 0.7,
    marginBottom: premiumSpacing.md,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: premiumSpacing.sm,
    marginBottom: 6,
  },
  quickInputRow: {
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 11,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickInputIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(0,122,57,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  quickHint: {
    fontSize: 12,
    marginTop: 5,
  },
  quickChoiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChoiceChip: {
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickChoiceChipWide: {
    width: '100%',
  },
  quickChoiceChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pcStatusFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  pcStatusFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '48%',
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pcStatusFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pcStatusInsightCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pcStatusInsightText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  pcSentExportBtn: {
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pcSentExportBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pcStatsNumbersWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  pcStatsNumberCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pcStatsNumberValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  pcStatsNumberLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  pcBrandBreakdownCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  pcBrandGroup: {
    gap: 6,
  },
  pcBrandGroupTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  pcBrandChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pcBrandChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pcBrandChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pcStatusDetailsCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  pcStatusDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  pcStatusDetailsTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pcStatusDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  pcStatusDetailsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pcStatusDetailsName: {
    flex: 1.2,
    fontSize: 12,
    fontWeight: '700',
  },
  pcStatusDetailsCategoryChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 120,
  },
  pcStatusDetailsCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pcStatusDetailsModel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: premiumSpacing.sm,
    marginTop: premiumSpacing.lg + 2,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  quickBtnGhost: {
    borderWidth: 1.2,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  quickBtnPrimary: {
    paddingVertical: 0,
    overflow: 'hidden',
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 6,
  },
  quickBtnPrimaryGradient: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickBtnGhostText: {
    fontWeight: '800',
    fontSize: 15,
  },
  quickBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  quickScanBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,122,57,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,57,0.16)',
  },
  quickScanBtnInner: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ===== Asset camera modal =====
  qaCameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  qaCameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  qaCameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  qaCameraCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaCameraTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  qaCameraFrameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  qaCameraFrame: {
    width: 240,
    height: 240,
  },
  qaCameraCorner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderWidth: 4,
    borderColor: '#007A39',
  },
  qaCamCTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  qaCamCTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  qaCamCBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  qaCamCBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  qaCameraHint: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 80,
  },
  feedbackOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: premiumSpacing.lg,
    paddingBottom: 120,
  },
  feedbackWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 14,
  },
  feedbackCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedbackIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTextCol: {
    flex: 1,
  },
  feedbackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackMessage: {
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  pcActionModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: premiumSpacing.lg,
  },
  pcActionModalCard: {
    width: '100%',
    maxWidth: 388,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 24,
  },
  pcActionModalOrbOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -76,
    right: -62,
  },
  pcActionModalOrbTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -34,
    left: -34,
  },
  pcActionHero: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    gap: 14,
  },
  pcActionHeroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  pcActionHeroTextWrap: {
    flex: 1,
  },
  pcActionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  pcActionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  pcActionMessage: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  pcActionInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  pcActionInfoCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  pcActionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pcActionInfoText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  pcActionInputBlock: {
    marginTop: 6,
    gap: 6,
  },
  pcActionInputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  pcActionInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pcActionErrorRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pcActionErrorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  pcActionActionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 2,
  },
  pcActionBtn: {
    flex: 1,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcActionBtnGhost: {
    borderWidth: 1,
  },
  pcActionBtnGhostText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pcActionBtnPrimary: {
    overflow: 'hidden',
  },
  pcActionBtnPrimaryGradient: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pcActionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tabletteAddFabWrap: {
    position: 'absolute',
    right: premiumSpacing.lg,
    bottom: 26,
    zIndex: 10,
  },
  tabletteAddFab: {
    overflow: 'hidden',
    borderRadius: 18,
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 10,
  },
  tabletteAddFabGradient: {
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    borderRadius: 18,
  },
  tabletteAddFabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  // Delete Modal Styles
  deleteModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '85%',
    maxWidth: 360,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  deleteOrbOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -60,
    right: -40,
  },
  deleteOrbTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    bottom: -30,
    left: -35,
  },
  deleteIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EF4444' + '30',
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  deleteMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  deleteActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteBtn: {
    flex: 1,
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnCancel: {
    borderWidth: 1,
  },
  deleteBtnCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtnConfirm: {
    paddingVertical: 0,
    overflow: 'hidden',
  },
  deleteBtnGradient: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ArticlesListScreen;
