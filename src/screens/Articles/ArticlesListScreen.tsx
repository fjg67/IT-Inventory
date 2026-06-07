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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  FadeInUp,
  LinearTransition,
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
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { premiumSpacing } from '@/constants/premiumTheme';
import { useResponsive } from '@/utils/responsive';
import { exportSentPCsCSV, shareExportedFile } from '@/utils/csv';
import { useTheme } from '@/theme';

// Composants premium
import PremiumArticleHeader from './components/PremiumArticleHeader';
import SearchFilterWrapper from './components/SearchFilterWrapper';
import FiltersPanel, { SortOption, SORT_LABELS } from './components/FiltersPanel';
import SkeletonArticleList from './components/SkeletonArticleList';
import ArticleEmptyState from './components/ArticleEmptyState';
import FABMultiAction from './components/FABMultiAction';
import { ParcPCScreen } from '@/screens/ParcPCScreen';
import {
  ArticleCard,
  ArticleFAB,
  ArticleFilters as ArticleFiltersBar,
  ArticleSearchBar,
  ArticlesHeader,
} from '@/components/articles';
import { PCHeader } from './components/pc/PCHeader';
import { PCCard } from './components/pc/PCCard';
import { PCCardCompact } from './components/pc/PCCardCompact';
import { PCSearchBar } from './components/pc/PCSearchBar';
import { PCStateFilters } from './components/pc/PCStateFilters';
import { PCDisplayToggle } from './components/pc/PCDisplayToggle';
import { SendPCModal } from '@/components/modals/SendPCModal';
import { PCFAB } from '@/components/parcpc';
import { PanneDeclarationModal } from '@/components/panne';
import { panneRepository } from '@/database/repositories';
import FilterModal, { FilterOption } from './components/FilterModal';
import ArticlesFilterSheet, { ArticleFilterKey } from './components/ArticlesFilterSheet';
import {
  CODE_FAMILLE_OPTIONS,
  FAMILLE_OPTIONS,
  TYPE_OPTIONS,
  SOUS_TYPE_OPTIONS,
  MARQUE_OPTIONS,
} from '@/constants/articleFilterOptions';
import { isPCArticle, PCStateKey } from '@/constants/pcStates';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import type { SendPCFormState } from '@/hooks/useSendPCForm';
import type { PanneType, PannePriorite } from '@/types/pc.types';

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
const PC_DENSITY_STORAGE_KEY = 'pcDensityPreference';
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
  if (normalized.includes('chaud')) return 'A chaud';
  return 'A reusiner';
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
        Décommissionner cet article ?
      </Text>

      {/* Message */}
      <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
        L'article restera visible dans le parc, mais sera marqué comme décommissionné.
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
  actionType: 'sent' | 'available' | 'hot' | 'processing';
  articleLabel?: string;
  sourceAgencyLabel?: string;
  sourceAgencyEds?: string;
  destinationEds?: string;
  destinationEdsError?: string | null;
  recipientName?: string;
  recipientNameError?: string | null;
  onDestinationEdsChange?: (value: string) => void;
  onClearDestinationEdsError?: () => void;
  onRecipientNameChange?: (value: string) => void;
  onClearRecipientNameError?: () => void;
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
  recipientName,
  recipientNameError,
  onDestinationEdsChange,
  onClearDestinationEdsError,
  onRecipientNameChange,
  onClearRecipientNameError,
  onCancel,
  onConfirm,
}) => {
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const isSent = actionType === 'sent';
  const isHot = actionType === 'hot';
  const isProcessing = actionType === 'processing';
  const accent = isSent ? '#E11D48' : isHot ? '#059669' : isProcessing ? '#D97706' : '#2563EB';
  const accentDeep = isSent ? '#9F1239' : isHot ? '#065F46' : isProcessing ? '#92400E' : '#1E40AF';
  const modalSurface = isDark ? '#0B1220' : '#FFFFFF';
  const modalSurfaceAlt = isDark ? 'rgba(15,23,42,0.62)' : '#F8FAFC';
  const modalBorder = isDark ? `${accent}55` : `${accent}36`;
  const modalTextPrimary = isDark ? '#F8FAFC' : colors.textPrimary;
  const modalTextSecondary = isDark ? 'rgba(226,232,240,0.82)' : colors.textSecondary;
  const iconName = isSent ? 'send-outline' : isHot ? 'flash-outline' : isProcessing ? 'cog-play-outline' : 'check-circle-outline';
  const title = isSent ? 'Envoyer ce PC ?' : isHot ? 'Remettre ce PC à chaud ?' : isProcessing ? 'Passer ce PC en usinage ?' : 'Rendre ce PC disponible ?';
  const message = isSent
    ? 'Le poste sera retiré du parc actif et conservé dans la base de données.'
    : isHot
      ? 'Le poste sera basculé en statut À chaud et reviendra dans le parc actif.'
      : isProcessing
        ? 'Le poste passera en statut En usinage pour suivi atelier.'
        : 'Le poste sera déplacé dans la catégorie PC disponible et restera consultable.';
  const confirmLabel = isSent ? 'Confirmer l’envoi' : isHot ? 'Mettre à chaud' : isProcessing ? 'Passer en usinage' : 'Marquer disponible';
  const operationLabel = isSent ? 'Sortie agence' : isHot ? 'Retour à chaud' : isProcessing ? 'Mise en usinage' : 'Mise en disponibilité';
  const resultLabel = isSent ? 'Statut final: Envoyé' : isHot ? 'Statut final: À chaud' : isProcessing ? 'Statut final: En usinage' : 'Statut final: Disponible';
  const sourceAgencyDisplay = `${sourceAgencyLabel || 'Agence inconnue'}${sourceAgencyEds ? ` (EDS ${sourceAgencyEds})` : ''}`;

  return (
    <Animated.View
      style={[
        styles.pcActionModalCard,
        {
          backgroundColor: modalSurface,
          borderColor: modalBorder,
        },
        scaleStyle,
      ]}
    >
      <View style={[styles.pcActionTopAccent, { backgroundColor: accent }]} />
      <View pointerEvents="none" style={[styles.pcActionModalOrbOne, { backgroundColor: isDark ? `${accent}18` : `${accent}14` }]} />
      <View pointerEvents="none" style={[styles.pcActionModalOrbTwo, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)' }]} />

      <LinearGradient
        colors={isSent ? ['#FFF1F2', '#FBCFE8'] : isHot ? ['#DCFCE7', '#BBF7D0'] : isProcessing ? ['#FFF7ED', '#FED7AA'] : ['#DBEAFE', '#BFDBFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pcActionHero}
      >
        <View style={styles.pcActionHeroIconWrap}>
          <LinearGradient
            colors={[accent, accentDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pcActionHeroIconGradient}
          >
            <Icon name={iconName} size={23} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.pcActionHeroTextWrap}>
          <View style={[styles.pcActionEyebrowPill, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
            <Text style={[styles.pcActionEyebrow, { color: accent }]}>{isSent ? 'ACTION DE SORTIE' : 'ACTION DE STOCK'}</Text>
          </View>
          <Text style={[styles.pcActionTitle, { color: modalTextPrimary }]}>{title}</Text>
          <Text style={[styles.pcActionMessage, { color: modalTextSecondary }]}>{message}</Text>
        </View>
      </LinearGradient>

      <View style={styles.pcActionCommandStrip}>
        <View
          style={[
            styles.pcActionCommandChip,
            { backgroundColor: modalSurfaceAlt, borderColor: isDark ? 'rgba(148,163,184,0.24)' : '#E2E8F0' },
          ]}
        >
          <Icon name="laptop" size={13} color={colors.textMuted} />
          <Text numberOfLines={1} style={[styles.pcActionCommandChipText, { color: modalTextPrimary }]}>{articleLabel || 'PC inconnu'}</Text>
        </View>
        <View
          style={[
            styles.pcActionCommandChip,
            { backgroundColor: isDark ? `${accent}1E` : `${accent}14`, borderColor: isDark ? `${accent}52` : `${accent}3A` },
          ]}
        >
          <Icon name={iconName} size={13} color={accent} />
          <Text numberOfLines={1} style={[styles.pcActionCommandChipText, { color: accent }]}>{operationLabel}</Text>
        </View>
      </View>

      <View style={styles.pcActionInfoSection}>
        <View
          style={[
            styles.pcActionInfoCard,
            {
              backgroundColor: modalSurfaceAlt,
              borderColor: isDark ? 'rgba(148,163,184,0.25)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.pcActionInfoRow}>
            <Icon name="office-building-outline" size={14} color="#0F766E" />
            <Text style={[styles.pcActionInfoText, { color: modalTextSecondary }]}>Agence source: {sourceAgencyDisplay}</Text>
          </View>
          <View style={styles.pcActionInfoRow}>
            <Icon name="check-decagram-outline" size={14} color={accent} />
            <Text style={[styles.pcActionInfoText, { color: modalTextPrimary }]}>{resultLabel}</Text>
          </View>

          {isSent ? (
            <>
              <View style={styles.pcActionInputBlock}>
                <Text style={[styles.pcActionInputLabel, { color: modalTextSecondary }]}>Numero EDS agence destinataire</Text>
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
                      color: modalTextPrimary,
                      backgroundColor: modalSurface,
                      borderColor: destinationEdsError ? '#DC2626' : colors.borderSubtle,
                    },
                  ]}
                />
              </View>

              <View style={styles.pcActionInputBlock}>
                <Text style={[styles.pcActionInputLabel, { color: modalTextSecondary }]}>Personne destinataire</Text>
                <TextInput
                  value={recipientName ?? ''}
                  onChangeText={(value) => {
                    onRecipientNameChange?.(value);
                    if (recipientNameError) onClearRecipientNameError?.();
                  }}
                  placeholder="Ex: Marie Dupont"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[
                    styles.pcActionInput,
                    {
                      color: modalTextPrimary,
                      backgroundColor: modalSurface,
                      borderColor: recipientNameError ? '#DC2626' : colors.borderSubtle,
                    },
                  ]}
                />
              </View>

              {destinationEdsError || recipientNameError ? (
                <View style={styles.pcActionErrorRow}>
                  <Icon name="alert-circle-outline" size={13} color="#DC2626" />
                  <Text style={styles.pcActionErrorText}>{destinationEdsError ?? recipientNameError}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={[styles.pcActionHintRow, { backgroundColor: isDark ? `${accent}16` : `${accent}12`, borderColor: isDark ? `${accent}44` : `${accent}30` }]}>
              <Icon name="information-outline" size={14} color={accent} />
              <Text style={[styles.pcActionHintText, { color: modalTextSecondary }]}>L'action mettra a jour immediatement le statut du PC et la date de modification.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.pcActionActionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSubmitting}
          onPress={onCancel}
          style={[
            styles.pcActionBtn,
            styles.pcActionBtnGhost,
            { borderColor: colors.borderSubtle, backgroundColor: modalSurfaceAlt },
          ]}
        >
          <Text style={[styles.pcActionBtnGhostText, { color: modalTextSecondary }]}>Annuler</Text>
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

interface DeletePCModalContentProps {
  colors: any;
  isDark: boolean;
  isDeleting: boolean;
  scaleAnim: Animated.Shared<number>;
  articleLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeletePCModalContent: React.FC<DeletePCModalContentProps> = ({
  colors,
  isDark,
  isDeleting,
  scaleAnim,
  articleLabel,
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
          borderColor: isDark ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.16)',
        },
        scaleStyle,
      ]}
    >
      <View pointerEvents="none" style={[styles.deleteOrbOne, { backgroundColor: isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.08)' }]} />
      <View pointerEvents="none" style={[styles.deleteOrbTwo, { backgroundColor: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.05)' }]} />

      <View style={[styles.deleteIconWrap, { backgroundColor: isDark ? 'rgba(239,68,68,0.16)' : '#FEF2F2', borderColor: 'rgba(239,68,68,0.22)' }]}>
        <Icon name="delete-outline" size={32} color="#EF4444" />
      </View>

      <View style={styles.deletePcCommandStrip}>
        <View
          style={[
            styles.deletePcCommandChip,
            { backgroundColor: isDark ? 'rgba(15,23,42,0.45)' : '#F8FAFC', borderColor: isDark ? 'rgba(148,163,184,0.25)' : '#E2E8F0' },
          ]}
        >
          <Icon name="laptop" size={13} color={colors.textMuted} />
          <Text numberOfLines={1} style={[styles.deletePcCommandChipText, { color: colors.textPrimary }]}>{articleLabel}</Text>
        </View>
        <View
          style={[
            styles.deletePcCommandChip,
            { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', borderColor: isDark ? 'rgba(248,113,113,0.42)' : 'rgba(239,68,68,0.28)' },
          ]}
        >
          <Icon name="alert-octagon-outline" size={13} color="#DC2626" />
          <Text numberOfLines={1} style={[styles.deletePcCommandChipText, { color: '#B91C1C' }]}>Suppression définitive</Text>
        </View>
      </View>

      <Text style={[styles.deleteTitle, { color: colors.textPrimary }]}>
        Supprimer ce PC ?
      </Text>
      <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{articleLabel}</Text>
        {' '}sera retiré définitivement du parc.
      </Text>

      <View
        style={[
          styles.deletePcWarningCard,
          {
            backgroundColor: isDark ? 'rgba(127,29,29,0.2)' : '#FEF2F2',
            borderColor: isDark ? 'rgba(248,113,113,0.34)' : 'rgba(239,68,68,0.24)',
          },
        ]}
      >
        <Icon name="alert-circle-outline" size={15} color="#DC2626" />
        <Text style={[styles.deletePcWarningText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>Cette action est irréversible. Vérifie le hostname avant confirmation.</Text>
      </View>

      <View style={styles.deleteActionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isDeleting}
          onPress={onCancel}
          style={[
            styles.deleteBtn,
            styles.deleteBtnCancel,
            { backgroundColor: isDark ? 'rgba(100,116,139,0.12)' : '#F1F5F9', borderColor: isDark ? 'rgba(100,116,139,0.2)' : '#CBD5E1' },
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
            colors={['#DC2626', '#B91C1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.deleteBtnGradient}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Icon name="delete-outline" size={16} color="#FFFFFF" />
                <Text style={styles.deleteBtnConfirmText}>Supprimer</Text>
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
  const SENT_PC_SOURCE_AGENCY_LABEL = 'Siege Strasbourg';
  
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
  const isTabletTab = false;
  const isPCTab = lockPresetTypeArticle && normalizedPresetType === 'pc';
  const isManagedInventoryTab = isPCTab;

  // Debug logging
  useEffect(() => {
    console.log('[ArticlesListScreen] isTabletTab:', isTabletTab);
    console.log('[ArticlesListScreen] isPCTab:', isPCTab);
    console.log('[ArticlesListScreen] presetTypeArticle:', presetTypeArticle);
    console.log('[ArticlesListScreen] lockPresetTypeArticle:', lockPresetTypeArticle);
  }, [isTabletTab, isPCTab, presetTypeArticle, lockPresetTypeArticle]);
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const childSites = useAppSelector((state) => state.site.childSites);
  const selectedSubSiteId = useAppSelector((state) => state.site.selectedSubSiteId);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const effectiveSiteName = selectedSubSiteId != null
    ? (childSites.find(s => s.id === selectedSubSiteId)?.nom ?? siteActif?.nom ?? null)
    : (siteActif?.nom ?? null);
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
    condition: null,
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
  const [defectiveArticlesCount, setDefectiveArticlesCount] = useState(0);
  const [defectiveUnitsCount, setDefectiveUnitsCount] = useState(0);
  const [pcStatusFilter, setPcStatusFilter] = useState<'À chaud' | 'À reusiner' | 'En usinage' | 'Disponible' | 'Envoyé' | null>(null);
  const [pcSentHistory, setPcSentHistory] = useState<SentPCRecord[]>([]);
  const [pcSentCount, setPcSentCount] = useState(0);
  const [exportingSentCsv, setExportingSentCsv] = useState(false);
  const [pcDensity, setPcDensity] = useState<'comfort' | 'compact'>('comfort');
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
  const [quickHostnameError, setQuickHostnameError] = useState<string | null>(null);
  const [quickAssetError, setQuickAssetError] = useState<string | null>(null);
  const [isQuickDuplicateChecking, setIsQuickDuplicateChecking] = useState(false);
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

  // Delete modal state (article decommission)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scaleAnim = useSharedValue(0);

  // Delete PC modal state
  const [deletePCModalVisible, setDeletePCModalVisible] = useState(false);
  const [deletePCArticleId, setDeletePCArticleId] = useState<number | null>(null);
  const [isDeletingPC, setIsDeletingPC] = useState(false);
  const deletePCScaleAnim = useSharedValue(0);
  const [pcActionModal, setPCActionModal] = useState<{
    visible: boolean;
    type: 'sent' | 'available' | 'hot' | 'processing';
    articleId: string | number | null;
  }>({
    visible: false,
    type: 'sent',
    articleId: null,
  });
  const [isPCActionSubmitting, setIsPCActionSubmitting] = useState(false);
  const [destinationAgencyEds, setDestinationAgencyEds] = useState('');
  const [destinationAgencyEdsError, setDestinationAgencyEdsError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientNameError, setRecipientNameError] = useState<string | null>(null);
  const pcActionScaleAnim = useSharedValue(0);
  const quickModalIntro = useSharedValue(0);
  const quickFeedbackAnim = useSharedValue(0);
  const quickFeedbackPulse = useSharedValue(0);
  const listScrollY = useSharedValue(0);

  // ===== PC EN PANNE MODAL STATE =====
  const [selectedPCId, setSelectedPCId] = useState<string | null>(null);
  const [showPanneModal, setShowPanneModal] = useState(false);

  const quickModalIntroStyle = useAnimatedStyle(() => ({
    opacity: quickModalIntro.value,
    transform: [
      { translateY: (1 - quickModalIntro.value) * 20 },
      { scale: 0.96 + quickModalIntro.value * 0.04 },
    ],
  }));

  const quickFeedbackWrapStyle = useAnimatedStyle(() => ({
    opacity: quickFeedbackAnim.value,
    transform: [
      { translateY: (1 - quickFeedbackAnim.value) * 28 },
      { scale: 0.92 + quickFeedbackAnim.value * 0.08 },
    ],
  }));

  const quickFeedbackTabletAuraStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + quickFeedbackPulse.value * 0.42,
    transform: [{ scale: 0.76 + quickFeedbackPulse.value * 0.34 }],
  }));

  const quickFeedbackTabletIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - quickFeedbackPulse.value) * 4 },
      { scale: 0.9 + quickFeedbackPulse.value * 0.12 },
    ],
  }));

  const headerParallaxStyle = useAnimatedStyle(() => {
    const y = Math.max(0, Math.min(listScrollY.value, 120));
    return {
      transform: [
        { translateY: -y * 0.06 },
        { scale: 1 - y * 0.00028 },
      ],
    };
  });

  useEffect(() => {
    if (!quickFeedback.visible) {
      quickFeedbackAnim.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
      quickFeedbackPulse.value = withTiming(0, { duration: 140, easing: Easing.in(Easing.cubic) });
      return;
    }

    quickFeedbackAnim.value = 0;
    quickFeedbackPulse.value = 0;
    quickFeedbackAnim.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) });
    quickFeedbackPulse.value = withTiming(1, { duration: quickFeedback.type === 'success' ? 520 : 220, easing: Easing.out(Easing.cubic) });
  }, [quickFeedback.visible, quickFeedback.type, quickFeedbackAnim, quickFeedbackPulse]);

  const selectedPCActionArticle = useMemo(
    () => articles.find((a) => String(a.id) === String(pcActionModal.articleId)) ?? null,
    [articles, pcActionModal.articleId],
  );

  // Emplacements dynamiques du site actif
  const [siteEmplacements, setSiteEmplacements] = useState<string[]>([]);


  // Calculer si le FAB doit être affiché
  const showFAB = useMemo(() => {
    const shouldShow = !isSuperviseur;
    console.log('[ArticlesListScreen.showFAB] DEBUG:', {
      shouldShow,
      isSuperviseur,
      lockPresetTypeArticle,
      presetTypeArticle,
      isTabletTab,
    });
    return shouldShow;
  }, [isSuperviseur, isTabletTab]);

  const quickPCModelOptions = useMemo(() => {
    return PC_CATEGORY_OPTIONS.find((option) => option.value === quickPCCategory)?.models ?? PC_CATEGORY_OPTIONS[0].models;
  }, [quickPCCategory]);

  useEffect(() => {
    if (!isPCTab) return;
    if (!quickPCModelOptions.includes(quickPCModel)) {
      setQuickPCModel(quickPCModelOptions[0]);
    }
  }, [isPCTab, quickPCModel, quickPCModelOptions]);

  const handleQuickHostnameChange = useCallback((value: string) => {
    setQuickHostname(value.toUpperCase());
  }, [isPCTab]);

  const handleQuickAssetChange = useCallback((value: string) => {
    setQuickAsset(value.toUpperCase());
  }, []);

  useEffect(() => {
    if (!quickAddVisible || !isPCTab) {
      setQuickHostnameError(null);
      setQuickAssetError(null);
      setIsQuickDuplicateChecking(false);
      return;
    }

    const normalizedHostname = quickHostname.trim().toUpperCase();
    const normalizedAsset = quickAsset.trim().toUpperCase();

    if (!normalizedHostname && !normalizedAsset) {
      setQuickHostnameError(null);
      setQuickAssetError(null);
      setIsQuickDuplicateChecking(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsQuickDuplicateChecking(true);
      try {
        let hostnameError: string | null = null;
        let assetError: string | null = null;

        if (normalizedHostname) {
          const existingHostname = await articleRepository.findByReference(normalizedHostname);
          if (existingHostname) {
            hostnameError = `Hostname déjà utilisé: ${normalizedHostname}`;
          }
        }

        if (normalizedAsset) {
          const existingAsset = await articleRepository.findByReferenceOrBarcode(normalizedAsset);
          const existingBarcode = String(existingAsset?.barcode ?? '').trim().toUpperCase();
          if (existingAsset && existingBarcode === normalizedAsset) {
            assetError = `Asset déjà utilisé: ${normalizedAsset}`;
          }
        }

        if (!cancelled) {
          setQuickHostnameError(hostnameError);
          setQuickAssetError(assetError);
        }
      } catch (error) {
        console.error('Erreur vérification doublons PC:', error);
      } finally {
        if (!cancelled) {
          setIsQuickDuplicateChecking(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [quickAddVisible, isPCTab, quickHostname, quickAsset]);

  const isQuickSubmitBlocked = useMemo(() => {
    if (isQuickSaving) return true;
    if (!quickHostname.trim() || !quickAsset.trim()) return true;
    if (isPCTab && (isQuickDuplicateChecking || !!quickHostnameError || !!quickAssetError)) return true;
    return false;
  }, [
    isQuickSaving,
    quickHostname,
    quickAsset,
    isPCTab,
    isQuickDuplicateChecking,
    quickHostnameError,
    quickAssetError,
  ]);

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

    const EXCLUDED_ARTICLE_TYPES = ['PC'];

    const baseTypeFilter = lockPresetTypeArticle && presetTypeArticle
      ? { typeArticle: [presetTypeArticle] }
      : {};

    const baseSearchFilters = {
      searchQuery: '',
      categorieId: null,
      stockFaible: false,
      condition: null,
      codeFamille: null,
      famille: null,
      sousType: null,
      marque: null,
      emplacement: null,
      ...baseTypeFilter,
    };

    const nonPCSearchFilters = {
      searchQuery: '',
      categorieId: null,
      stockFaible: false,
      condition: null,
      codeFamille: null,
      famille: null,
      typeArticle: null,
      excludeTypeArticle: EXCLUDED_ARTICLE_TYPES,
      sousType: null,
      marque: null,
      emplacement: null,
    };

    try {
      const [allResult, lowStockResult, defectiveResult, emplacements, sentCount] = await Promise.all([
        isManagedInventoryTab
          ? articleRepository.search(
              effectiveSiteId,
              baseSearchFilters,
              0,
              1,
            )
          : articleRepository.search(
              effectiveSiteId,
              nonPCSearchFilters,
              0,
              1,
            ),
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
          : articleRepository.search(
              effectiveSiteId,
              {
                ...nonPCSearchFilters,
                stockFaible: true,
              },
              0,
              1,
            ),
        isManagedInventoryTab
          ? Promise.resolve({ data: [], total: 0 })
          : articleRepository.search(
              effectiveSiteId,
              {
                ...nonPCSearchFilters,
                condition: 'defectueux',
              },
              0,
              MANAGED_INVENTORY_FETCH_LIMIT,
            ),
        articleRepository.getDistinctEmplacements(effectiveSiteId),
        isPCTab ? pcSentService.countBySourceSite(String(effectiveSiteId)).catch(() => 0) : Promise.resolve(0),
      ]);

      const lowStock = typeof lowStockResult === 'number' ? lowStockResult : lowStockResult.total;
      const defectiveArticles = typeof defectiveResult === 'number' ? 0 : defectiveResult.total;
      const defectiveUnits = typeof defectiveResult === 'number'
        ? 0
        : (defectiveResult.data ?? []).reduce((sum, item) => sum + Math.max(0, item.defectiveCount ?? 0), 0);
      setTotalArticles(allResult.total);
      setAlertes(isPCTab ? 0 : lowStock);
      setDefectiveArticlesCount(defectiveArticles);
      setDefectiveUnitsCount(defectiveUnits);
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
    let cancelled = false;

    const loadPCDensityPreference = async () => {
      if (!isPCTab) return;
      try {
        const stored = await AsyncStorage.getItem(PC_DENSITY_STORAGE_KEY);
        if (!cancelled && (stored === 'comfort' || stored === 'compact')) {
          setPcDensity(stored);
        }
      } catch (error) {
        console.warn('Impossible de charger la densite PC:', error);
      }
    };

    loadPCDensityPreference();

    return () => {
      cancelled = true;
    };
  }, [isPCTab]);

  useEffect(() => {
    if (!isPCTab) return;

    AsyncStorage.setItem(PC_DENSITY_STORAGE_KEY, pcDensity).catch((error) => {
      console.warn('Impossible de sauvegarder la densite PC:', error);
    });
  }, [isPCTab, pcDensity]);

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
        const EXCLUDED_ARTICLE_TYPES = ['PC'];
        const serverFilters = isManagedInventoryTab
          ? { ...f, searchQuery: '' }
          : { ...f, excludeTypeArticle: EXCLUDED_ARTICLE_TYPES };

        const hasFilter =
          !isManagedInventoryTab ||
          serverFilters.searchQuery ||
          serverFilters.stockFaible ||
          serverFilters.condition ||
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

        let nextData = result.data;
        if (isPCTab) {
          const pcIds = nextData.map((article) => String(article.id));
          const activePannesByPcId = await panneRepository.getActivePannesByPcIds(pcIds);

          nextData = nextData.map((article) => {
            const activePanne = activePannesByPcId[String(article.id)];
            if (!activePanne) return article;

            return {
              ...article,
              panneType: activePanne.type_panne as PanneType,
              pannePriorite: activePanne.priorite as PannePriorite,
            };
          });
        }

        if (resetList) {
          setArticles(nextData);
          pageRef.current = isManagedInventoryTab ? 0 : 1;
          setPage(isManagedInventoryTab ? 0 : 1);
        } else {
          setArticles(prev => [...prev, ...nextData]);
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
    [effectiveSiteId, isManagedInventoryTab, isPCTab],
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
      }, 200),
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
      filters.condition != null ||
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
      ].filter((v) => Array.isArray(v) && v.length > 0).length;

      return baseCount + (filters.condition ? 1 : 0) + (isTabletTab && tabletStatusFilter !== 'all' ? 1 : 0);
    },
    [filters, lockPresetTypeArticle, isTabletTab, tabletStatusFilter],
  );

  const activeArticleChips = useMemo(() => {
    const chips: Array<{ key: string; icon: string; label: string; onRemove: () => void }> = [];

    if (filters.stockFaible) {
      chips.push({
        key: 'low-stock',
        icon: 'alert-circle-outline',
        label: 'Stock faible',
        onRemove: () => setFilters((prev) => ({ ...prev, stockFaible: false })),
      });
    }

    if (filters.condition === 'defectueux') {
      chips.push({
        key: 'defectueux',
        icon: 'tools',
        label: 'Defectueux',
        onRemove: () => setFilters((prev) => ({ ...prev, condition: null })),
      });
    }

    if (searchQuery.trim()) {
      chips.push({
        key: 'search',
        icon: 'magnify',
        label: `Recherche: ${searchQuery.trim()}`,
        onRemove: () => handleClearSearch(),
      });
    }

    if (filters.famille?.length) {
      chips.push({
        key: 'famille',
        icon: 'shape-outline',
        label: `Famille: ${filters.famille[0]}`,
        onRemove: () => setFilters((prev) => ({ ...prev, famille: null })),
      });
    }

    if (filters.marque?.length) {
      chips.push({
        key: 'marque',
        icon: 'tag-outline',
        label: `Marque: ${filters.marque[0]}`,
        onRemove: () => setFilters((prev) => ({ ...prev, marque: null })),
      });
    }

    return chips;
  }, [filters.condition, filters.famille, filters.marque, filters.stockFaible, handleClearSearch, searchQuery]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setPcStatusFilter(null);
    setTabletStatusFilter('all');
    setFilters({
      searchQuery: '',
      categorieId: null,
      stockFaible: false,
      condition: null,
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
      marque: isPCTab ? 'Constructeur' : 'Marque',
      modele: isPCTab ? 'Modèle PC' : 'Modèle',
      emplacement: isPCTab ? 'Zone / EDS' : 'Emplacement',
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
        const recipientLabel = row.recipientName ? ` | Destinataire: ${row.recipientName}` : '';

        return {
          id: `sent-${row.id}`,
          reference: row.asset?.trim() || row.hostname,
          nom: row.hostname,
          description: `Envoyé vers EDS ${row.destinationAgencyEds}${sourceLabel}${recipientLabel}`,
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

  const pcHeaderModelStats = useMemo(() => {
    if (!isPCTab) return [];

    const modelCounts = new Map<string, number>();
    for (const article of articles) {
      if (!isPCArticle(article)) continue;
      const model = (article.modele ?? '').trim() || 'Sans modèle';
      modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
    }

    return [...modelCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
      .slice(0, 4)
      .map(([label, count]) => ({ label, count }));
  }, [articles, isPCTab]);

  const pcHeaderModelTotalCount = useMemo(() => {
    if (!isPCTab) return 0;

    const distinctModels = new Set<string>();
    for (const article of articles) {
      if (!isPCArticle(article)) continue;
      const model = (article.modele ?? '').trim() || 'Sans modèle';
      distinctModels.add(model);
    }

    return distinctModels.size;
  }, [articles, isPCTab]);

  const pcHeaderRepartitionStats = useMemo(() => {
    if (!isPCTab) return [];

    const counts = [
      { label: 'Portable agence', count: 0 },
      { label: 'Portable siège', count: 0 },
      { label: 'Autres PC', count: 0 },
    ];

    for (const article of articles) {
      if (!isPCArticle(article)) continue;
      const values = [article.sousType, article.typeArticle, article.famille]
        .filter((value): value is string => !!value)
        .map((value) => value.toLowerCase());

      if (values.some((value) => value.includes('agence'))) {
        counts[0].count += 1;
      } else if (values.some((value) => value.includes('siège') || value.includes('siege'))) {
        counts[1].count += 1;
      } else {
        counts[2].count += 1;
      }
    }

    return counts.filter((item) => item.count > 0);
  }, [articles, isPCTab]);

  const pcHeaderCounts = useMemo<Record<PCStateKey, number>>(() => ({
    a_chaud: pcHotCount,
    a_reusiner: pcReconditioningCount,
    en_usinage: pcProcessingCount,
    disponible: pcAvailableCount,
    envoye: pcSentCount,
  }), [pcAvailableCount, pcHotCount, pcProcessingCount, pcReconditioningCount, pcSentCount]);

  // ===== NAVIGATION =====
  const handleMarkBreakdown = useCallback((articleId: number | string) => {
    setSelectedPCId(String(articleId));
    setShowPanneModal(true);
  }, []);

  const handleCreatePanne = useCallback(async (panneData: any) => {
    if (!selectedPCId) return;
    
    try {
      await panneRepository.createPanne({
        ...panneData,
        pc_id: selectedPCId,
      });

      // Mettre à jour le statut du PC
      const article = articles.find(a => String(a.id) === selectedPCId);
      if (article) {
        await articleRepository.update(article.id, {
          description: `Statut: en_panne | Type: ${panneData.type_panne}`,
          famille: 'PC en panne',
        });
      }

      setShowPanneModal(false);
      setSelectedPCId(null);
      
      // Rafraîchir la liste
      pageRef.current = 0;
      setPage(0);
      setHasMore(true);
      await Promise.all([loadArticles(true, false), loadStats()]);
      
      showQuickFeedback('success', 'Panne déclarée', 'La panne a été enregistrée avec succès.');
    } catch (error) {
      console.error('Erreur création panne:', error);
      showQuickFeedback('error', 'Erreur', 'Impossible de déclarer la panne.');
    }
  }, [selectedPCId, articles, loadArticles, loadStats, showQuickFeedback]);

  const handleArticlePress = useCallback(
    (articleId: number) => {
      navigation.navigate('ArticleDetail', {
        articleId,
        sourceTab: isPCTab ? 'PC' : 'Articles',
      });
    },
    [navigation, isPCTab],
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
      const filepath = await exportSentPCsCSV(pcSentHistory, SENT_PC_SOURCE_AGENCY_LABEL);
      await shareExportedFile(filepath);
      showQuickFeedback('success', 'Export CSV prêt', 'Le fichier PC envoyés a été généré.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      showQuickFeedback('error', 'Export impossible', message);
    } finally {
      setExportingSentCsv(false);
    }
  }, [pcSentHistory, showQuickFeedback]);

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

  const handleDeletePC = useCallback(
    (articleId: number) => {
      setDeletePCArticleId(articleId);
      setDeletePCModalVisible(true);
      deletePCScaleAnim.value = withTiming(1, { duration: 380, easing: Easing.elastic(1.2) });
    },
    [deletePCScaleAnim],
  );

  const cancelDeletePC = useCallback(() => {
    deletePCScaleAnim.value = withTiming(0, { duration: 200, easing: Easing.ease });
    setTimeout(() => {
      setDeletePCModalVisible(false);
      setDeletePCArticleId(null);
    }, 200);
  }, [deletePCScaleAnim]);

  const confirmDeletePC = useCallback(async () => {
    if (!deletePCArticleId) return;
    const article = articles.find((a) => a.id === deletePCArticleId);
    const label = article?.nom || article?.reference || 'ce PC';
    setIsDeletingPC(true);
    try {
      await articleRepository.deactivate(deletePCArticleId);
      setArticles((prev) => prev.filter((a) => a.id !== deletePCArticleId));
      setDeletePCModalVisible(false);
      deletePCScaleAnim.value = 0;
      setDeletePCArticleId(null);
      loadStats();
      showQuickFeedback('success', 'Supprimé', `${label} a été retiré du parc.`);
    } catch (err: any) {
      showQuickFeedback('error', 'Erreur', err?.message || 'Impossible de supprimer ce PC.');
    } finally {
      setIsDeletingPC(false);
    }
  }, [articles, deletePCArticleId, deletePCScaleAnim, loadStats, showQuickFeedback]);

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

      showQuickFeedback('success', 'Succès', 'Article décommissionné avec succès');
    } catch (err: any) {
      console.error('[ArticlesListScreen.confirmDecommissionTablet] Error:', err);
      const errorMsg = err?.message || 'Impossible de décommissionner cet article';
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
    if (isPCTab) {
      navigation.navigate('AddPC');
      return;
    }

    if (isManagedInventoryTab) {
      setQuickAddVisible(true);
      return;
    }

    navigation.navigate('ArticleEdit');
  }, [navigation, isManagedInventoryTab, isPCTab]);

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
    const isPC = true;

    if (!hostname) {
      showQuickFeedback('error', 'Champ requis', 'Le hostname du PC est obligatoire.');
      return;
    }
    if (!asset) {
      showQuickFeedback('error', 'Champ requis', "L'asset du PC est obligatoire.");
      return;
    }
    if (!effectiveSiteId) {
      showQuickFeedback('error', 'Site manquant', 'Aucun site actif sélectionné.');
      return;
    }
    if (isPCTab && isQuickDuplicateChecking) {
      showQuickFeedback('error', 'Vérification en cours', 'Patientez pendant la vérification des doublons.');
      return;
    }
    if (isPCTab && (quickHostnameError || quickAssetError)) {
      showQuickFeedback('error', 'Doublon détecté', 'Hostname ou asset déjà utilisé.');
      return;
    }

    setIsQuickSaving(true);
    try {
      const normalizedHostname = hostname.toUpperCase();
      const normalizedAsset = asset.toUpperCase();

      if (isPCTab) {
        const existingHostname = await articleRepository.findByReference(normalizedHostname);
        if (existingHostname) {
          setQuickHostnameError(`Hostname déjà utilisé: ${normalizedHostname}`);
          throw new Error('Hostname déjà utilisé.');
        }

        const existingAsset = await articleRepository.findByReferenceOrBarcode(normalizedAsset);
        const existingBarcode = String(existingAsset?.barcode ?? '').trim().toUpperCase();
        if (existingAsset && existingBarcode === normalizedAsset) {
          setQuickAssetError(`Asset déjà utilisé: ${normalizedAsset}`);
          throw new Error('Asset déjà utilisé.');
        }
      }

      const pcPayload = {
        nom: normalizedHostname,
        description: `Statut: ${quickPCStatus}`,
        barcode: normalizedAsset,
        famille: 'PC portable',
        typeArticle: presetTypeArticle ?? 'PC',
        sousType: quickPCCategory,
        marque: getBrandFromModel(quickPCModel),
        modele: quickPCModel,
        stockMini: 0,
        unite: 'unité',
        ...(effectiveSiteName ? { emplacement: effectiveSiteName } : {}),
      };

      const articleId = await articleRepository.create({
        reference: normalizedHostname,
        ...pcPayload,
      });

      await stockRepository.createOrUpdate(articleId, effectiveSiteId, 1);

      setQuickHostname('');
      setQuickAsset('');
      setQuickHostnameError(null);
      setQuickAssetError(null);
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
        'PC ajouté en base et stock mis à jour.',
      );
    } catch (error) {
      console.error('Erreur ajout PC:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      showQuickFeedback('error', 'Échec de synchronisation', `Impossible d'ajouter le PC. ${message}`);
    } finally {
      setIsQuickSaving(false);
    }
  }, [
    quickHostname,
    quickAsset,
    quickPCCategory,
    quickPCModel,
    quickPCStatus,
    effectiveSiteId,
    effectiveSiteName,
    isPCTab,
    isQuickDuplicateChecking,
    quickHostnameError,
    quickAssetError,
    presetTypeArticle,
    loadArticles,
    loadStats,
    showQuickFeedback,
  ]);

  const openPCActionModal = useCallback((type: 'sent' | 'available' | 'hot' | 'processing', articleId: number | string) => {
    setPCActionModal({ visible: true, type, articleId });
    pcActionScaleAnim.value = withTiming(1, {
      duration: 380,
      easing: Easing.elastic(1.08),
    });
  }, [pcActionScaleAnim]);

  const closePCActionModal = useCallback((withSuccessFeedback = false) => {
    const closeDuration = withSuccessFeedback ? 260 : 180;
    if (withSuccessFeedback) {
      pcActionScaleAnim.value = withSequence(
        withTiming(1.03, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }),
      );
    } else {
      pcActionScaleAnim.value = withTiming(0, {
        duration: 180,
        easing: Easing.ease,
      });
    }
    setTimeout(() => {
      setPCActionModal((prev) => ({ ...prev, visible: false, articleId: null }));
      setIsPCActionSubmitting(false);
    }, closeDuration);
  }, [pcActionScaleAnim]);

  const confirmPCSentAction = useCallback(async ({ edsNumber, recipient }: SendPCFormState) => {
    if (!pcActionModal.articleId) return;

    setIsPCActionSubmitting(true);
    try {
      Vibration.vibrate([0, 26, 58, 28]);

      const normalizedDestinationEds = edsNumber.trim();
      const normalizedRecipientName = recipient.trim();
      const targetArticleSent = articles.find((a) => String(a.id) === String(pcActionModal.articleId));
      if (targetArticleSent) {
        const techName = currentTechnicien
          ? `${currentTechnicien.prenom} ${currentTechnicien.nom}`.trim()
          : 'Technicien inconnu';

        await pcSentService.record({
          articleId: String(targetArticleSent.id),
          hostname: targetArticleSent.nom?.trim() || targetArticleSent.reference?.trim() || 'PC inconnu',
          displayName: targetArticleSent.displayName?.trim() || targetArticleSent.display_name?.trim() || undefined,
          asset: targetArticleSent.barcode?.trim(),
          model: targetArticleSent.modele?.trim(),
          brand: targetArticleSent.marque?.trim(),
          sourceSiteId: String(effectiveSiteId),
          sourceSiteName: SENT_PC_SOURCE_AGENCY_LABEL,
          sourceAgencyEds: siteActif?.edsNumber != null ? String(siteActif.edsNumber) : undefined,
          destinationAgencyEds: normalizedDestinationEds,
          recipientName: normalizedRecipientName,
          sentByUserId: currentTechnicien?.id != null ? String(currentTechnicien.id) : undefined,
          sentByName: techName,
        });
      }

      await articleRepository.update(pcActionModal.articleId, {
        description: `Statut: Envoyé | EDS destination: ${normalizedDestinationEds} | Destinataire: ${normalizedRecipientName}`,
        famille: 'PC envoyé',
        emplacement: `EDS ${normalizedDestinationEds}`,
      });
      setArticles((prev) => prev.map((article) => (
        String(article.id) === String(pcActionModal.articleId)
          ? {
              ...article,
              description: `Statut: Envoyé | EDS destination: ${normalizedDestinationEds} | Destinataire: ${normalizedRecipientName}`,
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
          sourceAgencyName: SENT_PC_SOURCE_AGENCY_LABEL,
          sourceAgencyEds: siteActif?.edsNumber != null ? String(siteActif.edsNumber) : undefined,
          destinationAgencyEds: normalizedDestinationEds,
        });

        const hostname = targetArticleSent.nom?.trim() || targetArticleSent.reference?.trim() || 'PC inconnu';
        const sourceAgencyLabel = SENT_PC_SOURCE_AGENCY_LABEL;
        const sourceEdsLabel = siteActif?.edsNumber ? ` (EDS ${siteActif.edsNumber})` : '';
        showQuickFeedback(
          'success',
          'PC envoyé',
          `${hostname} envoyé par ${sourceAgencyLabel}${sourceEdsLabel} vers l'agence EDS ${normalizedDestinationEds} pour ${normalizedRecipientName}.`,
        );
      } else {
        showQuickFeedback(
          'success',
          'PC envoyé',
          `Le PC a été marqué envoyé vers l'agence EDS ${normalizedDestinationEds} pour ${normalizedRecipientName}.`,
        );
      }
      await loadSentHistory();
      await loadStats();
      closePCActionModal(true);
      setIsPCActionSubmitting(false);
    } catch (error: any) {
      setIsPCActionSubmitting(false);
      showQuickFeedback(
        'error',
        'Erreur',
        error?.message || "Impossible d'envoyer ce PC.",
      );
      throw error;
    }
  }, [pcActionModal.articleId, articles, currentTechnicien, effectiveSiteId, siteActif, loadSentHistory, loadStats, showQuickFeedback, closePCActionModal]);

  const confirmPCAction = useCallback(async () => {
    if (!pcActionModal.articleId) return;

    if (pcActionModal.type === 'available') {
      Vibration.vibrate([0, 18, 38, 18]);
    } else if (pcActionModal.type === 'processing') {
      Vibration.vibrate([0, 18, 46, 20]);
    } else {
      Vibration.vibrate([0, 20, 44, 20]);
    }

    setIsPCActionSubmitting(true);
    try {
      if (pcActionModal.type === 'available') {
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
      } else if (pcActionModal.type === 'processing') {
        await articleRepository.update(pcActionModal.articleId, {
          description: 'Statut: En usinage',
          famille: 'PC portable',
        });
        setArticles((prev) => prev.map((article) => (
          article.id === pcActionModal.articleId
            ? {
                ...article,
                description: 'Statut: En usinage',
                famille: 'PC portable',
                dateModification: new Date(),
              }
            : article
        )));
        const targetArticleProcessing = articles.find((a) => String(a.id) === String(pcActionModal.articleId));
        if (targetArticleProcessing) {
          const techName = currentTechnicien
            ? `${currentTechnicien.prenom} ${currentTechnicien.nom}`.trim()
            : 'Technicien inconnu';
          notifyPCStatusChange({
            article: { ...targetArticleProcessing, description: 'Statut: En usinage', famille: 'PC portable' },
            nextStatus: 'En usinage',
            technicienName: techName,
          });
        }
        await loadStats();
        showQuickFeedback('success', 'PC en usinage', 'Le PC est passé en statut En usinage.');
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
      closePCActionModal(true);
    } catch (error: any) {
      setIsPCActionSubmitting(false);
      showQuickFeedback(
        'error',
        'Erreur',
        error?.message || (
          pcActionModal.type === 'available'
            ? 'Impossible de mettre ce PC en disponible.'
            : pcActionModal.type === 'processing'
              ? 'Impossible de passer ce PC en usinage.'
              : 'Impossible de remettre ce PC à chaud.'
        ),
      );
    }
  }, [pcActionModal, articles, currentTechnicien, loadStats, showQuickFeedback, closePCActionModal]);

  const handleMarkPCSent = useCallback((articleId: number | string) => {
    openPCActionModal('sent', articleId);
  }, [openPCActionModal]);

  const handleMarkPCAvailable = useCallback((articleId: number | string) => {
    openPCActionModal('available', articleId);
  }, [openPCActionModal]);

  const handleMarkPCHot = useCallback((articleId: number | string) => {
    openPCActionModal('hot', articleId);
  }, [openPCActionModal]);

  const handleMarkPCProcessing = useCallback((articleId: number | string) => {
    openPCActionModal('processing', articleId);
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
      filters.condition ||
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
    ({ item, index }: { item: Article; index: number }) => (
      <Animated.View
        entering={
          isPCTab && pcDensity === 'compact'
            ? FadeInUp.delay(Math.min(index, 12) * 20).duration(220)
            : FadeInUp.delay(Math.min(index, 10) * 40).duration(320)
        }
        layout={
          isPCTab
            ? LinearTransition.springify().damping(pcDensity === 'compact' ? 19 : 15).stiffness(pcDensity === 'compact' ? 260 : 210)
            : undefined
        }
        style={[
          styles.cardWrapper,
          isTablet && styles.cardWrapperTablet,
          isPCTab && pcDensity === 'compact' && styles.cardWrapperCompact,
        ]}
      >
        {isPCTab ? (
          pcDensity === 'compact' ? (
            <PCCardCompact
              article={item}
              index={index}
              onPress={pcStatusFilter === 'Envoyé' ? handleSentArticlePress : handleArticlePress}
              onMarkSent={handleMarkPCSent}
              onMarkHot={handleMarkPCHot}
              onMarkAvailable={handleMarkPCAvailable}
              onMarkProcessing={handleMarkPCProcessing}
              onDelete={handleDeletePC}
            />
          ) : (
            <PCCard
              article={item}
              index={index}
              onPress={pcStatusFilter === 'Envoyé' ? handleSentArticlePress : handleArticlePress}
              onMarkSent={handleMarkPCSent}
              onMarkHot={handleMarkPCHot}
              onMarkAvailable={handleMarkPCAvailable}
              onMarkProcessing={handleMarkPCProcessing}
              onDelete={handleDeletePC}
            />
          )
        ) : (
          <ArticleCard
            article={item}
            index={index}
            query={searchQuery}
            onPress={handleArticlePress}
          />
        )}
      </Animated.View>
    ),
    [handleArticlePress, handleSentArticlePress, pcStatusFilter, isTabletTab, handleDecommissionTablet, isPCTab, handleMarkPCSent, handleMarkPCAvailable, handleMarkPCHot, handleMarkPCProcessing, handleDeletePC, isTablet, pcDensity, searchQuery],
  );

  const normalizedTotalArticles = useMemo(
    () => Math.max(totalArticles, alertes),
    [totalArticles, alertes],
  );

  const normalizedAlertes = useMemo(
    () => Math.min(alertes, normalizedTotalArticles),
    [alertes, normalizedTotalArticles],
  );

  const stockOK = useMemo(
    () => Math.max(0, normalizedTotalArticles - normalizedAlertes),
    [normalizedAlertes, normalizedTotalArticles],
  );

  const quickHeaderStat = useMemo(() => {
    if (isPCTab) {
      const pcActifs = pcHotCount + pcReconditioningCount + pcProcessingCount + pcAvailableCount;
      return `${pcActifs} PC actifs`;
    }
    return `${displayedArticles.length} article${displayedArticles.length !== 1 ? 's' : ''} affiché${displayedArticles.length !== 1 ? 's' : ''}`;
  }, [isPCTab, pcHotCount, pcReconditioningCount, pcProcessingCount, pcAvailableCount, displayedArticles.length]);

  const pcWeeklyTrendDelta = useMemo(() => {
    if (!isPCTab) return 0;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const last7Start = now - 7 * dayMs;
    const prev7Start = now - 14 * dayMs;

    const activePCs = sortedArticles.filter((article) => isPCArticle(article) && !String(article.description ?? '').toLowerCase().includes('envoy'));

    const last7 = activePCs.filter((article) => {
      const t = new Date(article.dateCreation).getTime();
      return t >= last7Start;
    }).length;

    const prev7 = activePCs.filter((article) => {
      const t = new Date(article.dateCreation).getTime();
      return t >= prev7Start && t < last7Start;
    }).length;

    return last7 - prev7;
  }, [isPCTab, sortedArticles]);

  const pcHeaderTrendLabel = useMemo(() => {
    const safeDelta = Number.isFinite(pcWeeklyTrendDelta) ? pcWeeklyTrendDelta : 0;
    const prefix = safeDelta > 0 ? '+' : '';
    return `${prefix}${safeDelta} vs sem.`;
  }, [pcWeeklyTrendDelta]);

  const pcActiveFilterTags = useMemo(() => {
    if (!isPCTab) return [] as string[];
    const tags: string[] = [];
    if (pcStatusFilter) tags.push(`État: ${pcStatusFilter}`);
    if (filters.sousType?.length) tags.push(`Sous-type: ${filters.sousType.join(', ')}`);
    if (filters.marque?.length) tags.push(`Marque: ${filters.marque.join(', ')}`);
    if (filters.modele?.length) tags.push(`Modèle: ${filters.modele.join(', ')}`);
    if (filters.emplacement?.length) tags.push(`Emplacement: ${filters.emplacement.join(', ')}`);
    if (searchQuery.trim().length) tags.push(`Recherche: ${searchQuery.trim()}`);
    return tags;
  }, [filters.emplacement, filters.marque, filters.modele, filters.sousType, isPCTab, pcStatusFilter, searchQuery]);

  const handleListScroll = useCallback((event: any) => {
    listScrollY.value = event.nativeEvent.contentOffset.y;
  }, [listScrollY]);

  const renderFooter = useCallback(() => {
    return <View style={styles.listBottomSpacer} />;
  }, []);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <ArticleEmptyState
        type={emptyType}
        searchQuery={searchQuery}
        onAction={emptyAction}
        mode={isPCTab ? 'pc' : 'articles'}
      />
    );
  }, [isLoading, emptyType, searchQuery, emptyAction, isPCTab]);

const renderListHeader = useCallback(() => {
    if (!isPCTab) {
      return (
        <>
          <Animated.View style={headerParallaxStyle}>
            <ArticlesHeader
              totalArticles={normalizedTotalArticles}
              stockOk={stockOK}
              alertes={normalizedAlertes}
              defectueux={defectiveArticlesCount}
              onTotalPress={resetFilters}
              onStockOKPress={() => {
                if (filters.stockFaible) {
                  setFilters((prev) => ({ ...prev, stockFaible: false }));
                }
              }}
              onAlertesPress={() => {
                setFilters((prev) => ({ ...prev, stockFaible: !prev.stockFaible }));
              }}
              onDefectueuxPress={() => {
                setFilters((prev) => ({
                  ...prev,
                  condition: prev.condition === 'defectueux' ? null : 'defectueux',
                }));
              }}
            />
          </Animated.View>

          <View style={styles.articleSearchBlock}>
            <ArticleSearchBar
              value={searchQuery}
              onChangeText={handleSearchChange}
              onClear={handleClearSearch}
              resultsCount={searchQuery.trim().length > 0 ? displayedArticles.length : undefined}
            />

            <ArticleFiltersBar
              sortLabel={currentSortLabel}
              hasFilters={hasActiveFilters}
              onSortPress={() => setSortModalVisible(true)}
              onFiltersPress={() => setFiltersSheetVisible(true)}
              activeChips={activeArticleChips}
              onClearAll={resetFilters}
            />

            <View style={styles.quickFilterRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setFilters((prev) => ({
                    ...prev,
                    condition: prev.condition === 'defectueux' ? null : 'defectueux',
                  }));
                }}
                style={[
                  styles.quickFilterChip,
                  filters.condition === 'defectueux' && styles.quickFilterChipActive,
                ]}
              >
                <Icon
                  name="tools"
                  size={13}
                  color={filters.condition === 'defectueux' ? '#FCA5A5' : OBSIDIAN_COLORS.text_muted}
                />
                <Text
                  style={[
                    styles.quickFilterChipText,
                    filters.condition === 'defectueux' && styles.quickFilterChipTextActive,
                  ]}
                >
                  Defectueux ({defectiveUnitsCount} unites)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      );
    }

    return (
      <>
        {isPCTab ? (
          <Animated.View style={headerParallaxStyle}>
            <PCHeader
              total={pcHotCount + pcReconditioningCount + pcProcessingCount + pcAvailableCount + pcSentCount}
              activeLabel={pcStatusFilter ?? 'Tous les états'}
              trendLabel={pcHeaderTrendLabel}
              counts={pcHeaderCounts}
              modelStats={pcHeaderModelStats}
              modelTotalCount={pcHeaderModelTotalCount}
              repartitionStats={pcHeaderRepartitionStats}
              onStatePress={(state) => {
                if (state === null) {
                  setPcStatusFilter(null);
                  resetFilters();
                  return;
                }
                const next = state === 'a_chaud'
                  ? 'À chaud'
                  : state === 'a_reusiner'
                    ? 'À reusiner'
                    : state === 'en_usinage'
                      ? 'En usinage'
                      : state === 'disponible'
                        ? 'Disponible'
                        : 'Envoyé';
                setPcStatusFilter((prev) => prev === next ? null : next);
              }}
            />
          </Animated.View>
        ) : (
          <Animated.View style={headerParallaxStyle}>
            <PremiumArticleHeader
              title="Parc PC"
              mode="pc"
              statsMode={'full'}
              quickStatText={quickHeaderStat}
              pcTrendDelta={pcWeeklyTrendDelta}
              totalArticles={normalizedTotalArticles}
              stockOK={stockOK}
              alertes={normalizedAlertes}
              pcHot={pcHotCount}
              pcReconditioning={pcReconditioningCount}
              pcProcessing={pcProcessingCount}
              pcAvailable={pcAvailableCount}
              pcSent={pcSentCount}
              pcFocusedStats={
                pcCategoryStats
                  ? {
                      label: pcCategoryStats.label,
                      total: pcCategoryStats.total,
                      agence: pcCategoryStats.agence,
                      siege: pcCategoryStats.siege,
                    }
                  : null
              }
              pcFocusedModels={
                pcCategoryStats
                  ? pcCategoryStats.modelCounts.map((item) => ({ label: item.brand, count: item.count }))
                  : []
              }
              activePCModelLabel={filters.modele?.[0] ?? null}
              onAdd={handleAdd}
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
              onStockOKPress={() => setPcStatusFilter((prev) => prev === 'À chaud' ? null : 'À chaud')}
              onAlertesPress={() => setPcStatusFilter((prev) => prev === 'À reusiner' ? null : 'À reusiner')}
              onProcessingPress={() => setPcStatusFilter((prev) => prev === 'En usinage' ? null : 'En usinage')}
              onAvailablePress={() => setPcStatusFilter((prev) => prev === 'Disponible' ? null : 'Disponible')}
              onSentPress={() => setPcStatusFilter((prev) => prev === 'Envoyé' ? null : 'Envoyé')}
              isSyncing={refreshing}
            />
          </Animated.View>
        )}

        <SearchFilterWrapper
          maxWidth={contentMaxWidth ? contentMaxWidth : undefined}
        >
          <PCSearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            onClear={handleClearSearch}
            resultsCount={searchQuery.trim().length > 0 ? displayedArticles.length : undefined}
          />

          <PCStateFilters
            activeStatus={pcStatusFilter}
            counts={pcHeaderCounts}
            onStatusChange={(status) => setPcStatusFilter(status as typeof pcStatusFilter)}
          />

          {pcActiveFilterTags.length > 0 && (
            <View style={styles.pcFilterTagRow}>
              {pcActiveFilterTags.map((tag) => (
                <View key={tag} style={[styles.pcFilterTag, { backgroundColor: isDark ? 'rgba(0,122,57,0.16)' : 'rgba(0,122,57,0.10)' }]}>
                  <Text style={[styles.pcFilterTagText, { color: colors.primary }]} numberOfLines={1}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <PCDisplayToggle value={pcDensity} onChange={(mode) => setPcDensity(mode)} />
        </SearchFilterWrapper>

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

        <FiltersPanel
          sortBy={sortBy}
          sortLabel={currentSortLabel}
          showStockFaible={filters.stockFaible}
          showStockFaibleChip={!isManagedInventoryTab}
          filtersLabel="Filtres PC"
          hasActiveFilters={hasActiveFilters}
          activeFiltersCount={activeFiltersCount}
          onSortPress={() => setSortModalVisible(true)}
          onFiltersPress={() => setFiltersSheetVisible(true)}
          onStockFaibleToggle={toggleStockFaible}
          onReset={resetFilters}
        />
      </>
    );
  }, [
    isPCTab,
    totalArticles,
    stockOK,
    alertes,
    defectiveArticlesCount,
    defectiveUnitsCount,
    pcHotCount,
    pcReconditioningCount,
    pcProcessingCount,
    pcAvailableCount,
    pcSentCount,
    handleAdd,
    quickHeaderStat,
    pcWeeklyTrendDelta,
    resetFilters,
    filters.stockFaible,
    filters.condition,
    contentMaxWidth,
    searchQuery,
    handleSearchChange,
    handleClearSearch,
    pcActiveFilterTags,
    pcDensity,
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
    headerParallaxStyle,
    displayedArticles.length,
    activeArticleChips,
    isDark,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: OBSIDIAN_COLORS.bg_primary }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={OBSIDIAN_COLORS.bg_primary}
      />

      {/* Articles List */}
      <View style={styles.listContainer}>
      {isPCTab ? (
        <ParcPCScreen
          articles={articles}
          sentArticles={sentPcArticles}
          isLoading={isLoading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onArticlePress={handleArticlePress}
          onSentArticlePress={() => handleSentArticlePress(0)}
          onMarkSent={handleMarkPCSent}
          onMarkHot={handleMarkPCHot}
          onMarkAvailable={handleMarkPCAvailable}
          onMarkProcessing={handleMarkPCProcessing}
          onMarkBreakdown={handleMarkBreakdown}
          onResolveBreakdown={handleMarkPCAvailable}
          onDelete={handleDeletePC}
          onExportSentCsv={handleExportSentCsv}
          exportingSentCsv={exportingSentCsv}
          weeklyTrendDelta={pcWeeklyTrendDelta}
          onScroll={handleListScroll}
        />
      ) : isLoading ? (
        <>
          {renderListHeader()}
          <SkeletonArticleList count={6} />
        </>
      ) : (
        <FlashList<Article>
          data={displayedArticles}
          extraData={`${pcDensity}|${pcStatusFilter ?? 'all'}|${filters.condition ?? 'all'}|${filters.sousType?.join(',') ?? ''}|${filters.marque?.join(',') ?? ''}|${filters.modele?.join(',') ?? ''}|${filters.emplacement?.join(',') ?? ''}|${searchQuery}|${sortBy}`}
          keyExtractor={item => item.id.toString()}
          renderItem={renderArticle}
          numColumns={numColumns}
          estimatedItemSize={140}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          stickyHeaderIndices={[0]}
          contentContainerStyle={[
            styles.listContent,
            isTabletTab && styles.listContentTablet,
            contentMaxWidth && !isPCTab ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : {},
          ] as any}
          ListHeaderComponent={renderListHeader()}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
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

      {/* Bouton d'ajout dédié */}
      {!isSuperviseur && isTabletTab && (
        <View style={styles.mobileAddFabWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAdd}
            style={styles.mobileAddFab}
          >
            <LinearGradient
              colors={['#007A39', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mobileAddFabGradient}
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.mobileAddFabText}>Ajouter un article</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      {showFAB && (
        isPCTab ? (
          <PCFAB onPress={handleAdd} />
        ) : (
          <ArticleFAB onPress={handleAdd} />
        )
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
        title={isPCTab ? 'Trier les PC' : 'Trier par'}
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

                  <Text style={[styles.quickModalTitle, { color: colors.textPrimary }]}>{isPCTab ? 'Ajouter un PC portable' : 'Ajouter un article'}</Text>
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
                    {
                      borderColor: quickHostnameError ? '#DC2626' : !quickHostname.trim() ? colors.borderSubtle : '#007A39',
                      backgroundColor: quickHostnameError ? 'rgba(220,38,38,0.06)' : colors.backgroundSubtle,
                    },
                  ]}>
                    <View style={styles.quickInputIconWrap}>
                      <Icon name="laptop" size={16} color="#007A39" />
                    </View>
                    <TextInput
                      value={quickHostname}
                      onChangeText={handleQuickHostnameChange}
                      editable={!isQuickSaving}
                      placeholder={isPCTab ? getQuickHostnamePlaceholder(quickPCCategory) : 'Ex: TMAOP00123'}
                      placeholderTextColor={colors.textMuted}
                      keyboardType={isPCTab ? 'default' : 'number-pad'}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[
                        styles.quickInput,
                        { color: colors.textPrimary },
                      ]}
                    />
                    {isPCTab && (
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
                    )}
                  </View>
                  {quickHostnameError ? (
                    <View style={styles.quickFieldError}>
                      <Icon name="alert-circle" size={14} color="#DC2626" />
                      <Text style={styles.quickFieldErrorText}>{quickHostnameError}</Text>
                    </View>
                  ) : null}

                  <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Asset</Text>
                  <View style={[
                    styles.quickInputRow,
                    {
                      borderColor: quickAssetError ? '#DC2626' : colors.borderSubtle,
                      backgroundColor: quickAssetError ? 'rgba(220,38,38,0.06)' : colors.backgroundSubtle,
                    },
                  ]}>
                    <View style={styles.quickInputIconWrap}>
                      <Icon name="tag-outline" size={16} color="#007A39" />
                    </View>
                    <TextInput
                      value={quickAsset}
                      onChangeText={handleQuickAssetChange}
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
                  {quickAssetError ? (
                    <View style={styles.quickFieldError}>
                      <Icon name="alert-circle" size={14} color="#DC2626" />
                      <Text style={styles.quickFieldErrorText}>{quickAssetError}</Text>
                    </View>
                  ) : null}
                  {isPCTab && isQuickDuplicateChecking && !quickHostnameError && !quickAssetError ? (
                    <View style={styles.quickFieldInfo}>
                      <ActivityIndicator size="small" color="#007A39" />
                      <Text style={styles.quickFieldInfoText}>Vérification des doublons en cours...</Text>
                    </View>
                  ) : null}
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
                      disabled={isQuickSubmitBlocked}
                      onPress={handleQuickAddTablet}
                      style={[styles.quickBtn, styles.quickBtnPrimary, isQuickSubmitBlocked && styles.quickBtnPrimaryDisabled]}
                    >
                      <LinearGradient
                        colors={isQuickSubmitBlocked ? ['#94A3B8', '#64748B'] : ['#007A39', '#059669']}
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
          <Animated.View style={[styles.feedbackWrap, quickFeedbackWrapStyle]}>
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
                {quickFeedback.type === 'success' ? (
                  <View style={styles.feedbackTabletIconWrap}>
                    <Animated.View style={[styles.feedbackTabletAura, quickFeedbackTabletAuraStyle]} />
                    <Animated.View
                      style={[
                        styles.feedbackIconBubble,
                        styles.feedbackTabletBubble,
                        quickFeedbackTabletIconStyle,
                      ]}
                    >
                      <Icon name="tablet-cellphone" size={19} color="#FFFFFF" />
                      <View style={styles.feedbackTabletCheckDot}>
                        <Icon name="check-bold" size={9} color="#064E3B" />
                      </View>
                    </Animated.View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.feedbackIconBubble,
                      { backgroundColor: 'rgba(239,68,68,0.26)' },
                    ]}
                  >
                    <Icon
                      name="alert-octagon"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                )}
                <View style={styles.feedbackTextCol}>
                  <Text style={styles.feedbackTitle}>{quickFeedback.title}</Text>
                  <Text style={styles.feedbackMessage}>{quickFeedback.message}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {pcActionModal.visible && pcActionModal.type === 'sent' && selectedPCActionArticle ? (
        <SendPCModal
          visible={pcActionModal.visible}
          pc={selectedPCActionArticle}
          sourceAgencyLabel={SENT_PC_SOURCE_AGENCY_LABEL}
          sourceAgencyEds={siteActif?.edsNumber != null ? String(siteActif.edsNumber) : undefined}
          onClose={closePCActionModal}
          onSubmit={confirmPCSentAction}
        />
      ) : null}

      <Modal
        visible={pcActionModal.visible && pcActionModal.type !== 'sent'}
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
            sourceAgencyLabel={SENT_PC_SOURCE_AGENCY_LABEL}
            sourceAgencyEds={siteActif?.edsNumber != null ? String(siteActif.edsNumber) : undefined}
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

      {/* Delete PC Modal */}
      <Modal
        visible={deletePCModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDeletePC}
      >
        <View style={[styles.deleteModalBackdrop, { backgroundColor: isDark ? 'rgba(5,5,10,0.85)' : 'rgba(0,0,0,0.72)' }]}>
          <DeletePCModalContent
            colors={colors}
            isDark={isDark}
            isDeleting={isDeletingPC}
            scaleAnim={deletePCScaleAnim}
            articleLabel={articles.find((a) => a.id === deletePCArticleId)?.nom || articles.find((a) => a.id === deletePCArticleId)?.reference || 'ce PC'}
            onCancel={cancelDeletePC}
            onConfirm={confirmDeletePC}
          />
        </View>
      </Modal>

      {/* Panne Declaration Modal */}
      <PanneDeclarationModal
        visible={showPanneModal}
        pcId={selectedPCId}
        onClose={() => {
          setShowPanneModal(false);
          setSelectedPCId(null);
        }}
        onSubmit={handleCreatePanne}
      />
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
    paddingBottom: 100,
  },
  articleSearchBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  quickFilterRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickFilterChipActive: {
    borderColor: 'rgba(239,68,68,0.42)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  quickFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.text_muted,
  },
  quickFilterChipTextActive: {
    color: '#FCA5A5',
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
  cardWrapperCompact: {
    marginBottom: -2,
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
  quickFieldError: {
    marginTop: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.32)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    paddingVertical: 7,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickFieldErrorText: {
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  quickFieldInfo: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  quickFieldInfoText: {
    color: '#007A39',
    fontSize: 12,
    fontWeight: '600',
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
  pcFilterTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 4,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  pcFilterTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  pcFilterTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pcDensityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    marginBottom: 2,
  },
  pcDensityChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pcDensityChipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
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
  quickBtnPrimaryDisabled: {
    shadowOpacity: 0,
    elevation: 0,
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
  feedbackTabletIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTabletAura: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(52,211,153,0.55)',
  },
  feedbackTabletBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(167,243,208,0.36)',
  },
  feedbackTabletCheckDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6,78,59,0.24)',
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
    maxWidth: 402,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 24,
  },
  pcActionTopAccent: {
    height: 4,
    width: '100%',
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
    paddingVertical: 18,
    flexDirection: 'row',
    gap: 14,
  },
  pcActionHeroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  pcActionHeroIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcActionHeroTextWrap: {
    flex: 1,
  },
  pcActionEyebrowPill: {
    alignSelf: 'flex-start',
    minHeight: 20,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
    marginBottom: 7,
  },
  pcActionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pcActionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  pcActionMessage: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  pcActionCommandStrip: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  pcActionCommandChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  pcActionCommandChipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  pcActionInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  pcActionInfoCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 11,
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
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  pcActionHintRow: {
    marginTop: 6,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pcActionHintText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 15,
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
    borderRadius: 16,
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
    minHeight: 56,
    borderRadius: 16,
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
  mobileAddFabWrap: {
    position: 'absolute',
    right: premiumSpacing.lg,
    bottom: 26,
    zIndex: 10,
  },
  mobileAddFab: {
    overflow: 'hidden',
    borderRadius: 18,
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 10,
  },
  mobileAddFabGradient: {
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    borderRadius: 18,
  },
  mobileAddFabText: {
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
  deletePcCommandStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  deletePcCommandChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  deletePcCommandChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.15,
    flexShrink: 1,
  },
  deletePcWarningCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  deletePcWarningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
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
