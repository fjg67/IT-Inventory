// ============================================
// ARTICLE EDIT SCREEN - Premium Design
// IT-Inventory Application - Création & Modification
// ============================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Vibration,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeOutUp,
  FadeIn,
  ZoomIn,
  SlideInRight,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store';
import { articleRepository, siteRepository, stockRepository, refOptionsRepository } from '@/database';
import { syncService } from '@/api/sync.service';
import { supabase, tables } from '@/api/supabase';
import { showAlert } from '@/store/slices/uiSlice';
import { clearScannedArticle } from '@/store/slices/scanSlice';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { ArticleForm, Site } from '@/types';
import debounce from 'lodash/debounce';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Camera, useCameraDevices, useCodeScanner, useCameraPermission } from 'react-native-vision-camera';
import { uploadArticleImage, isRemoteUrl } from '@/services/imageUploadService';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';
import { CAC, SECTION_ACCENTS } from '@/components/create-article/createArticleColors';
import { CreateArticleHero } from '@/components/create-article/CreateArticleHero';
import { FormProgressBar } from '@/components/create-article/FormProgressBar';
import { SectionHeader } from '@/components/create-article/SectionHeader';
import { SectionCard } from '@/components/create-article/SectionCard';
import { FormField } from '@/components/create-article/FormField';
import { FormDropdown } from '@/components/create-article/FormDropdown';
import { DropdownBottomSheet } from '@/components/create-article/DropdownBottomSheet';
import { StockSiteSelector } from '@/components/create-article/StockSiteSelector';
import { StockLevelCard } from '@/components/create-article/StockLevelCard';
import { DescriptionTextarea } from '@/components/create-article/DescriptionTextarea';
import { PhotoUploadZone } from '@/components/create-article/PhotoUploadZone';
import { CreateArticleFooter } from '@/components/create-article/CreateArticleFooter';

const REF_SCAN_CODE_TYPES = [
  'ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93',
  'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec',
] as const;

type HeaderConsumableIcon = {
  icon: string;
  top: number;
  left?: number;
  right?: number;
  rotate: string;
  size: number;
  opacity: number;
};

const HEADER_CONSUMABLE_ICONS: HeaderConsumableIcon[] = [
  { icon: 'mouse', top: 26, left: 30, rotate: '-10deg', size: 14, opacity: 0.24 },
  { icon: 'keyboard-outline', top: 18, right: 34, rotate: '8deg', size: 14, opacity: 0.23 },
  { icon: 'usb-port', top: 168, left: 42, rotate: '-8deg', size: 13, opacity: 0.22 },
  { icon: 'cable-data', top: 160, right: 32, rotate: '10deg', size: 14, opacity: 0.22 },
  { icon: 'headset', top: 98, right: 20, rotate: '-9deg', size: 14, opacity: 0.2 },
  { icon: 'battery-charging', top: 98, left: 18, rotate: '9deg', size: 13, opacity: 0.19 },
];

// ==================== MAIN SCREEN ====================
export const ArticleEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, isDark, theme } = useTheme();
  const { gradients } = theme;

  const { articleId, famille: familleParam } = route.params || {};
  const isEditing = !!articleId;
  const { lastBarcode } = useAppSelector(state => state.scan);
  const siteActif = useAppSelector(state => state.site.siteActif);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const childSites = useAppSelector(state => state.site.childSites);
  const selectedSubSiteId = useAppSelector(state => state.site.selectedSubSiteId);

  // Quand il y a des sous-sites et qu'aucun n'est choisi, on doit cibler un sous-site précis pour l'écriture
  const hasChildSites = childSites.length > 0;
  const [localTargetSiteId, setLocalTargetSiteId] = useState<string | null>(
    siteActif?.id != null ? String(siteActif.id) : null,
  );
  const writeSiteId = useMemo(() => {
    if (!hasChildSites) return effectiveSiteId; // Pas de sous-sites
    if (selectedSubSiteId) return selectedSubSiteId; // Sous-site déjà choisi dans le Dashboard
    return localTargetSiteId ?? effectiveSiteId;
  }, [hasChildSites, selectedSubSiteId, localTargetSiteId, effectiveSiteId]);
  const isArticleCreateMode = !isEditing && !isPCEditMode;

  // ===== Data =====
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ===== Form state =====
  const [reference, setReference] = useState('');
  const [nom, setNom] = useState('');
  const [codeFamille, setCodeFamille] = useState<string | null>(null);
  const [famille, setFamille] = useState<string | null>(familleParam || null);
  const [typeArticle, setTypeArticle] = useState<string | null>(null);
  const [sousType, setSousType] = useState<string | null>(null);
  const [marque, setMarque] = useState<string | null>(null);
  const [emplacement, setEmplacement] = useState<string | null>(null);
  const [stockActuel, setStockActuel] = useState('0');
  const [stockMini, setStockMini] = useState('5');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);

  // ===== UI state =====
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refStatus, setRefStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  // Modals
  const [showScanRefModal, setShowScanRefModal] = useState(false);

  // Caméra pour scan référence (doit être APRÈS la déclaration de showScanRefModal)
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back') ?? devices[0];
  const showScanRefModalRef = useRef(false);
  showScanRefModalRef.current = showScanRefModal;

  // Validation par consensus : le même code doit être lu au moins 3 fois pour être accepté
  const scanBufferRef = useRef<{ value: string; count: number }>({ value: '', count: 0 });
  const SCAN_CONSENSUS_MIN = 3;

  const codeScannerRef = useCodeScanner({
    codeTypes: [...REF_SCAN_CODE_TYPES],
    onCodeScanned: (codes) => {
      if (!showScanRefModalRef.current || codes.length === 0 || !codes[0].value) return;
      const value = codes[0].value.trim();
      if (!value) return;

      // Validation par consensus
      if (scanBufferRef.current.value === value) {
        scanBufferRef.current.count += 1;
      } else {
        // Nouveau code détecté, on repart à 1
        scanBufferRef.current = { value, count: 1 };
      }

      // Accepter seulement si lu au moins SCAN_CONSENSUS_MIN fois de suite
      if (scanBufferRef.current.count < SCAN_CONSENSUS_MIN) return;

      // Code validé par consensus
      scanBufferRef.current = { value: '', count: 0 };
      Vibration.vibrate([0, 30, 60, 30]);
      setReference(value);
      checkReference(value);
      setShowScanRefModal(false);
    },
  });
  const [showFamilleModal, setShowFamilleModal] = useState(false);
  const [showFamilleTypeModal, setShowFamilleTypeModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSousTypeModal, setShowSousTypeModal] = useState(false);
  const [showMarqueModal, setShowMarqueModal] = useState(false);
  const [showEmplacementModal, setShowEmplacementModal] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [sousTypeSearch, setSousTypeSearch] = useState('');
  const [emplacementSearch, setEmplacementSearch] = useState('');

  // Options chargées depuis la base (ajouts utilisateur)
  const [codeFamillesFromDb, setCodeFamillesFromDb] = useState<string[]>([]);
  const [famillesFromDb, setFamillesFromDb] = useState<{ value: string; label: string; icon: string; color: string; bgColor: string }[]>([]);
  const [typesFromDb, setTypesFromDb] = useState<{ value: string; label: string; icon: string; color: string }[]>([]);
  const [showAddCodeFamilleModal, setShowAddCodeFamilleModal] = useState(false);
  const [addCodeFamilleInput, setAddCodeFamilleInput] = useState('');
  const [showAddFamilleModal, setShowAddFamilleModal] = useState(false);
  const [addFamilleInput, setAddFamilleInput] = useState('');
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);

  const isPCEditMode = useMemo(() => {
    if (!isEditing) return false;
    const candidates = [familleParam, famille, typeArticle, sousType, nom]
      .filter((value): value is string => !!value)
      .map((value) => value.toLowerCase());
    return candidates.some((value) =>
      value.includes('pc') ||
      value.includes('portable') ||
      value.includes('laptop')
    );
  }, [isEditing, familleParam, famille, typeArticle, sousType, nom]);
  const [addTypeInput, setAddTypeInput] = useState('');
  const [addingRefOption, setAddingRefOption] = useState(false);

  const CODE_FAMILLE_STATIC = ['10', '11', '12', '13', '14', '15', '16', '17', '50'];
  const CODE_FAMILLE_OPTIONS = useMemo(() => {
    const set = new Set<string>([...CODE_FAMILLE_STATIC, ...codeFamillesFromDb]);
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [codeFamillesFromDb]);

  const FAMILLE_STATIC: { value: string; label: string; icon: string; color: string; bgColor: string; emoji: string }[] = [
    { value: 'Accessoires', label: 'Accessoires', icon: 'puzzle-outline', color: '#8B5CF6', bgColor: '#8B5CF615', emoji: '🎮' },
    { value: 'Audio', label: 'Audio', icon: 'headphones', color: '#EC4899', bgColor: '#EC489915', emoji: '🎧' },
    { value: 'Câble', label: 'Câble', icon: 'cable-data', color: '#F59E0B', bgColor: '#F59E0B15', emoji: '🔌' },
    { value: 'Chargeur', label: 'Chargeur', icon: 'battery-charging', color: '#10B981', bgColor: '#10B98115', emoji: '🔋' },
    { value: 'Electrique', label: 'Électrique', icon: 'flash', color: '#3B82F6', bgColor: '#3B82F615', emoji: '⚡' },
    { value: 'Ergonomie', label: 'Ergonomie', icon: 'human-handsup', color: '#06B6D4', bgColor: '#06B6D415', emoji: '🪑' },
    { value: 'Kit', label: 'Kit', icon: 'toolbox-outline', color: '#EF4444', bgColor: '#EF444415', emoji: '🧰' },
    { value: 'Kit Audio', label: 'Kit Audio', icon: 'headset', color: '#EC4899', bgColor: '#EC489915', emoji: '🎧' },
    { value: 'Kit Clavier Souris CHERRY', label: 'Kit Clavier Souris CHERRY', icon: 'keyboard-variant', color: '#CC0000', bgColor: '#CC000015', emoji: '⌨️' },
    { value: 'Kit Clavier Souris DELL', label: 'Kit Clavier Souris DELL', icon: 'keyboard-variant', color: '#0076CE', bgColor: '#0076CE15', emoji: '⌨️' },
    { value: 'Kit Clavier Souris Urban Factory', label: 'Kit Clavier Souris Urban Factory', icon: 'keyboard-variant', color: '#E11D48', bgColor: '#E11D4815', emoji: '⌨️' },
  ];
  const FAMILLE_OPTIONS = useMemo(() => {
    const fromDb = famillesFromDb
      .filter(f => !FAMILLE_STATIC.some(s => s.value === f.value))
      .map(f => ({ ...f, emoji: '📦' }));
    return [...FAMILLE_STATIC, ...fromDb];
  }, [famillesFromDb]);

  const TYPE_STATIC: { value: string; label: string; icon: string; color: string }[] = [
    { value: 'Souris', label: 'Souris', icon: 'mouse', color: '#007A39' },
    { value: 'Clavier', label: 'Clavier', icon: 'keyboard', color: '#8B5CF6' },
    { value: 'Dock', label: 'Dock', icon: 'dock-bottom', color: '#0EA5E9' },
    { value: 'HUB USB', label: 'HUB USB', icon: 'usb', color: '#14B8A6' },
    { value: 'Sécurité', label: 'Sécurité', icon: 'shield-lock', color: '#EF4444' },
    { value: 'Pointeur laser', label: 'Pointeur laser', icon: 'laser-pointer', color: '#F97316' },
    { value: 'Dongle', label: 'Dongle', icon: 'bluetooth', color: '#3B82F6' },
    { value: 'Protection', label: 'Protection', icon: 'shield-check', color: '#10B981' },
    { value: 'Clavier / Souris', label: 'Clavier / Souris', icon: 'keyboard-variant', color: '#7C3AED' },
    { value: 'Casque', label: 'Casque', icon: 'headset', color: '#EC4899' },
    { value: 'Base de charge', label: 'Base de charge', icon: 'battery-charging-wireless', color: '#22C55E' },
    { value: 'Affichage', label: 'Affichage', icon: 'monitor', color: '#2563EB' },
    { value: 'Rallonge', label: 'Rallonge', icon: 'power-plug', color: '#F59E0B' },
    { value: 'USB A / USB C', label: 'USB A / USB C', icon: 'usb-port', color: '#06B6D4' },
    { value: 'USB C / Lightning', label: 'USB C / Lightning', icon: 'cable-data', color: '#A855F7' },
    { value: 'USB A / Micro USB', label: 'USB A / Micro USB', icon: 'usb', color: '#64748B' },
    { value: 'Réseau', label: 'Réseau', icon: 'lan', color: '#0D9488' },
    { value: 'USB C', label: 'USB C', icon: 'usb-port', color: '#7C3AED' },
    { value: 'Alimentation', label: 'Alimentation', icon: 'power', color: '#DC2626' },
    { value: 'Multiprise', label: 'Multiprise', icon: 'power-socket-eu', color: '#EA580C' },
    { value: "Bras d'écran", label: "Bras d'écran", icon: 'monitor-screenshot', color: '#0891B2' },
    { value: 'Scanner doc', label: 'Scanner doc', icon: 'scanner', color: '#007A39' },
    { value: 'Ensemble de matériel', label: 'Ensemble de matériel', icon: 'package-variant-closed', color: '#78716C' },
  ];
  const TYPE_OPTIONS = useMemo(() => {
    const keys = new Set(TYPE_STATIC.map(x => x.value));
    const fromDb = typesFromDb.filter(t => !keys.has(t.value));
    return [...TYPE_STATIC, ...fromDb];
  }, [typesFromDb]);

  const SOUS_TYPE_OPTIONS: { value: string; label: string; icon: string; color: string }[] = [
    { value: 'Filaire', label: 'Filaire', icon: 'ethernet', color: '#007A39' },
    { value: 'Sans fil', label: 'Sans fil', icon: 'wifi', color: '#3B82F6' },
    { value: 'Agence', label: 'Agence', icon: 'office-building', color: '#0EA5E9' },
    { value: 'Siège', label: 'Siège', icon: 'domain', color: '#14B8A6' },
    { value: 'D6000', label: 'D6000', icon: 'dock-bottom', color: '#8B5CF6' },
    { value: '4 ports', label: '4 ports', icon: 'usb', color: '#7C3AED' },
    { value: 'Filtre confidentialité 14"', label: 'Filtre confidentialité 14"', icon: 'eye-off', color: '#EF4444' },
    { value: 'Filtre confidentialité 15.6"', label: 'Filtre confidentialité 15.6"', icon: 'eye-off', color: '#DC2626' },
    { value: 'Filtre confidentialité 16"', label: 'Filtre confidentialité 16"', icon: 'eye-off', color: '#B91C1C' },
    { value: 'Filtre confidentialité VIP', label: 'Filtre confidentialité VIP', icon: 'eye-off-outline', color: '#9F1239' },
    { value: 'Pour présentation', label: 'Pour présentation', icon: 'presentation', color: '#F97316' },
    { value: 'Kit clavier souris', label: 'Kit clavier souris', icon: 'keyboard-variant', color: '#A855F7' },
    { value: 'Clavier / Souris', label: 'Clavier / Souris', icon: 'mouse', color: '#007A39' },
    { value: 'Plantronics', label: 'Plantronics', icon: 'headset', color: '#EC4899' },
    { value: 'Sacoche', label: 'Sacoche', icon: 'bag-personal', color: '#78716C' },
    { value: 'Sac à dos', label: 'Sac à dos', icon: 'bag-suitcase', color: '#92400E' },
    { value: 'Plantronics SF V1', label: 'Plantronics SF V1', icon: 'headphones', color: '#DB2777' },
    { value: 'Plantronics SF V2', label: 'Plantronics SF V2', icon: 'headphones', color: '#BE185D' },
    { value: 'Plantronics filaire', label: 'Plantronics filaire', icon: 'headset', color: '#9D174D' },
    { value: 'Epsos', label: 'Epsos', icon: 'printer', color: '#007A39' },
    { value: 'Poly', label: 'Poly', icon: 'microphone', color: '#7C3AED' },
    { value: 'DisplayPort / USB C 1m', label: 'DP / USB C 1m', icon: 'cable-data', color: '#2563EB' },
    { value: 'DisplayPort / HDMI 3m', label: 'DP / HDMI 3m', icon: 'cable-data', color: '#1D4ED8' },
    { value: 'HDMI 3 et 2 mètre', label: 'HDMI 3 et 2m', icon: 'video-input-hdmi', color: '#1E40AF' },
    { value: 'HDMI 5 et 10 mètre', label: 'HDMI 5 et 10m', icon: 'video-input-hdmi', color: '#1E3A8A' },
    { value: '2m', label: '2 mètres', icon: 'ruler', color: '#64748B' },
    { value: '3m', label: '3 mètres', icon: 'ruler', color: '#475569' },
    { value: 'Générique', label: 'Générique', icon: 'cube-outline', color: '#9CA3AF' },
    { value: 'TP', label: 'TP', icon: 'router-wireless', color: '#0D9488' },
    { value: '65 watt', label: '65 Watt', icon: 'flash', color: '#F59E0B' },
    { value: 'Mini UC', label: 'Mini UC', icon: 'desktop-tower', color: '#0891B2' },
    { value: 'Bras Ergotron', label: 'Bras Ergotron', icon: 'arm-flex', color: '#059669' },
    { value: 'Avec feuille à feuille', label: 'Feuille à feuille', icon: 'file-document-multiple', color: '#005C2B' },
    { value: 'Projecteur', label: 'Projecteur', icon: 'projector', color: '#7C2D12' },
    { value: 'Kit audio', label: 'Kit audio', icon: 'music-box', color: '#BE123C' },
    { value: 'Kit complet', label: 'Kit complet', icon: 'package-variant', color: '#15803D' },
  ];

  const filteredTypes = useMemo(() => {
    const sortedTypes = [...TYPE_OPTIONS].sort((a, b) =>
      a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }),
    );
    if (!typeSearch.trim()) return sortedTypes;
    const s = typeSearch.toLowerCase();
    return sortedTypes.filter(t => t.label.toLowerCase().includes(s));
  }, [TYPE_OPTIONS, typeSearch]);

  const filteredSousTypes = useMemo(() => {
    const sortedSousTypes = [...SOUS_TYPE_OPTIONS].sort((a, b) =>
      a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }),
    );
    if (!sousTypeSearch.trim()) return sortedSousTypes;
    const s = sousTypeSearch.toLowerCase();
    return sortedSousTypes.filter(t => t.label.toLowerCase().includes(s));
  }, [sousTypeSearch]);

  const EMPLACEMENT_OPTIONS: { value: string; label: string; icon: string; color: string; bgColor: string; emoji: string; etage: string; zone: string }[] = [
    { value: 'Stock 5 - R2E3', label: 'Stock 5 - R2E3', icon: 'archive-outline', color: '#3B82F6', bgColor: '#3B82F612', emoji: '📦', etage: '5', zone: 'Rangée 2, Étagère 3' },
    { value: 'Stock 5 - R2E4', label: 'Stock 5 - R2E4', icon: 'archive-outline', color: '#2563EB', bgColor: '#2563EB12', emoji: '📦', etage: '5', zone: 'Rangée 2, Étagère 4' },
    { value: 'Stock 5 - R4E3', label: 'Stock 5 - R4E3', icon: 'bookshelf', color: '#8B5CF6', bgColor: '#8B5CF612', emoji: '🗄️', etage: '5', zone: 'Rangée 4, Étagère 3' },
    { value: 'Stock 5 - R4E4', label: 'Stock 5 - R4E4', icon: 'bookshelf', color: '#7C3AED', bgColor: '#7C3AED12', emoji: '🗄️', etage: '5', zone: 'Rangée 4, Étagère 4' },
    { value: 'Stock 5 - R5E2', label: 'Stock 5 - R5E2', icon: 'package-variant', color: '#06B6D4', bgColor: '#06B6D412', emoji: '📋', etage: '5', zone: 'Rangée 5, Étagère 2' },
    { value: 'Stock 5 - R5E3', label: 'Stock 5 - R5E3', icon: 'package-variant', color: '#0891B2', bgColor: '#0891B212', emoji: '📋', etage: '5', zone: 'Rangée 5, Étagère 3' },
    { value: 'Stock 5 - R5E5', label: 'Stock 5 - R5E5', icon: 'package-variant-closed', color: '#0D9488', bgColor: '#0D948812', emoji: '📋', etage: '5', zone: 'Rangée 5, Étagère 5' },
    { value: 'Stock 8 - Armoire', label: 'Stock 8 - Armoire', icon: 'wardrobe-outline', color: '#F59E0B', bgColor: '#F59E0B12', emoji: '🚪', etage: '8', zone: 'Armoire principale' },
    { value: 'Stock 8 - Tiroir', label: 'Stock 8 - Tiroir', icon: 'drawer', color: '#EF4444', bgColor: '#EF444412', emoji: '🗃️', etage: '8', zone: 'Tiroir de rangement' },
  ];

  // Mapping nom de site → préfixe d'emplacement
  const SITE_TO_EMPLACEMENT_PREFIX: Record<string, string> = {
    'Stock 5ième': 'Stock 5',
    'Stock 8ième': 'Stock 8',
    'Stock Epinal': 'Stock Epinal',
  };

  const filteredEmplacements = useMemo(() => {
    // Filtrer par sites sélectionnés
    let options = EMPLACEMENT_OPTIONS;

    // En mode édition, on utilise le site actif ; en création, les sites sélectionnés
    const selectedSiteNames = isEditing
      ? (siteActif ? [siteActif.nom] : [])
      : sites.filter(s => selectedSiteIds.includes(s.id)).map(s => s.nom);

    if (selectedSiteNames.length > 0) {
      const prefixes = selectedSiteNames
        .map(name => SITE_TO_EMPLACEMENT_PREFIX[name])
        .filter(Boolean);

      if (prefixes.length > 0) {
        options = options.filter(e =>
          prefixes.some(prefix => e.value.startsWith(prefix)),
        );
      }
    }

    // Filtrer par recherche
    if (emplacementSearch.trim()) {
      const s = emplacementSearch.toLowerCase();
      options = options.filter(e => e.label.toLowerCase().includes(s) || e.zone.toLowerCase().includes(s));
    }

    return options;
  }, [emplacementSearch, selectedSiteIds, sites, isEditing, siteActif]);

  const MARQUE_OPTIONS: { value: string; label: string; icon: string; color: string; initials: string }[] = [
    { value: 'DELL', label: 'DELL', icon: 'laptop', color: '#0076CE', initials: 'DE' },
    { value: 'Cherry', label: 'Cherry', icon: 'keyboard', color: '#CC0000', initials: 'CH' },
    { value: 'StarTec', label: 'StarTec', icon: 'star-circle', color: '#FFB900', initials: 'ST' },
    { value: '3M', label: '3M', icon: 'shield-check', color: '#FF0000', initials: '3M' },
    { value: 'Générique', label: 'Générique', icon: 'cube-outline', color: '#6B7280', initials: 'GN' },
    { value: 'Plantronics', label: 'Plantronics', icon: 'headset', color: '#2D2D2D', initials: 'PL' },
    { value: 'Aurora', label: 'Aurora', icon: 'weather-night', color: '#7C3AED', initials: 'AU' },
    { value: 'Urban Factory', label: 'Urban Factory', icon: 'bag-suitcase', color: '#E11D48', initials: 'UF' },
    { value: 'Epsos', label: 'Epsos', icon: 'printer', color: '#003399', initials: 'EP' },
    { value: 'Poly', label: 'Poly', icon: 'microphone', color: '#00B388', initials: 'PO' },
    { value: 'HP', label: 'HP', icon: 'monitor', color: '#0096D6', initials: 'HP' },
    { value: 'Ergotron', label: 'Ergotron', icon: 'arm-flex', color: '#F97316', initials: 'ER' },
    { value: 'Fujitsu', label: 'Fujitsu', icon: 'server', color: '#E4002B', initials: 'FU' },
  ];

  const sortedMarqueOptions = useMemo(
    () => [...MARQUE_OPTIONS].sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })),
    [MARQUE_OPTIONS],
  );

  // ===== Computed =====
  const isFormValid = useMemo(() => {
    const baseValid =
      reference.trim().length >= 7 &&
      nom.trim().length >= 2 &&
      parseFloat(stockMini) >= 0 &&
      !isNaN(parseFloat(stockMini));

    if (isEditing) {
      // En mode édition, seuls référence, nom et seuil sont obligatoires
      return baseValid;
    }

    // En mode création, tous les champs sont obligatoires
    const isSiege = siteActif?.nom === 'Siège Strasbourg';
    return (
      baseValid &&
      codeFamille != null &&
      famille != null &&
      typeArticle != null &&
      sousType != null &&
      marque != null &&
      (!isSiege || emplacement != null)
    );
  }, [reference, nom, stockMini, codeFamille, famille, typeArticle, sousType, marque, emplacement, isEditing, siteActif]);

  // Réinitialiser l'emplacement si les sites changent et qu'il n'est plus compatible
  useEffect(() => {
    if (!emplacement) return;
    const selectedSiteNames = sites.filter(s => selectedSiteIds.includes(s.id)).map(s => s.nom);
    if (selectedSiteNames.length === 0) return;
    const prefixes = selectedSiteNames
      .map(name => SITE_TO_EMPLACEMENT_PREFIX[name])
      .filter(Boolean);
    if (prefixes.length > 0 && !prefixes.some(prefix => emplacement.startsWith(prefix))) {
      setEmplacement(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteIds]);

  // ===== Load ref options from DB =====
  const loadRefOptions = useCallback(async () => {
    try {
      const [codes, familles, types] = await Promise.all([
        refOptionsRepository.findAllCodeFamilles(),
        refOptionsRepository.findAllFamilles(),
        refOptionsRepository.findAllTypesArticle(),
      ]);
      setCodeFamillesFromDb(codes);
      setFamillesFromDb(familles);
      setTypesFromDb(types);
    } catch (e) {
      console.warn('Chargement options ref:', e);
    }
  }, []);

  // ===== Load data =====
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allSites] = await Promise.all([siteRepository.findAll(), loadRefOptions()]);
      setSites(allSites);

      // Pre-select active site
      if (!isEditing && siteActif) {
        setSelectedSiteIds([siteActif.id]);
      }

      if (isEditing && articleId) {
        const article = await articleRepository.findById(articleId, writeSiteId);
        if (article) {
          setReference(article.reference);
          setNom(article.nom);
          setCodeFamille(article.codeFamille || null);
          setFamille(article.famille || null);
          setTypeArticle(article.typeArticle || null);
          setSousType(article.sousType || null);
          setMarque(article.marque || null);
          setEmplacement(article.emplacement || null);
          setStockActuel((article.quantiteActuelle ?? 0).toString());
          setStockMini(article.stockMini.toString());
          setDescription(article.description || '');
          setPhotoUri(article.photoUrl || null);
          setRefStatus('available');
        } else {
          navigation.goBack();
        }
      } else if (lastBarcode) {
        setReference(lastBarcode);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, isEditing, lastBarcode, loadRefOptions, navigation, writeSiteId]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // Recharger le stock quand le sous-site sélectionné change
  useEffect(() => {
    if (isEditing && articleId && writeSiteId) {
      articleRepository.findById(articleId, writeSiteId).then(result => {
        if (result) setStockActuel((result.quantiteActuelle ?? 0).toString());
      }).catch(() => {});
    }
  }, [writeSiteId]);

  useEffect(() => {
    if (lastBarcode && !isEditing) {
      setReference(lastBarcode);
      dispatch(clearScannedArticle());
    }
  }, [lastBarcode, isEditing, dispatch]);

  // ===== Reference validation (format uniquement ; les références en double sont autorisées) =====
  const checkReference = useMemo(
    () =>
      debounce((ref: string) => {
        if (ref.trim().length < 7) {
          setRefStatus('idle');
          return;
        }
        setRefStatus('available');
      }, 300),
    [],
  );

  const handleReferenceChange = (text: string) => {
    const upper = text.toUpperCase();
    setReference(upper);
    checkReference(upper);
  };

  const generateReference = () => {
    Vibration.vibrate(10);
    const prefix = 'ART';
    const num = Date.now().toString().slice(-5);
    const ref = `${prefix}-${num}`;
    setReference(ref);
    setRefStatus('available');
  };

  // ===== Photo =====
  const handleTakePhoto = async () => {
    Vibration.vibrate(10);
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });
      if (!result.didCancel && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        Vibration.vibrate(15);
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  const handlePickGallery = async () => {
    Vibration.vibrate(10);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });
      if (!result.didCancel && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        Vibration.vibrate(15);
      }
    } catch (err) {
      console.warn('Gallery error:', err);
    }
  };

  const handleRemovePhoto = () => {
    Vibration.vibrate(10);
    Alert.alert('Supprimer la photo', 'Voulez-vous retirer cette photo ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setPhotoUri(null) },
    ]);
  };

  // ===== Submit =====
  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    Vibration.vibrate(15);

    try {
      // Upload de l'image vers Supabase Storage si c'est un fichier local
      let finalPhotoUrl: string | undefined = undefined;
      if (photoUri) {
        if (isRemoteUrl(photoUri)) {
          // Déjà une URL Supabase, on la garde
          finalPhotoUrl = photoUri;
        } else {
          // C'est un fichier local, on l'upload
          try {
            finalPhotoUrl = await uploadArticleImage(photoUri, reference.trim());
            console.log('[ArticleEdit] Image uploadée:', finalPhotoUrl);
          } catch (uploadErr) {
            console.warn('[ArticleEdit] Échec upload image:', uploadErr);
            // On continue sans image plutôt que de bloquer la sauvegarde
            Alert.alert(
              'Avertissement',
              "L'image n'a pas pu être uploadée. L'article sera sauvegardé sans photo.",
            );
          }
        }
      }

      const data: ArticleForm = {
        reference: reference.trim(),
        nom: nom.trim(),
        codeFamille: codeFamille || undefined,
        famille: famille || undefined,
        typeArticle: typeArticle || undefined,
        sousType: sousType || undefined,
        marque: marque || undefined,
        emplacement: emplacement || undefined,
        stockMini: parseFloat(stockMini),
        unite: 'Pcs',
        description: description.trim() || undefined,
        photoUrl: finalPhotoUrl,
      };

      if (isEditing && articleId) {
        // Mise à jour article dans Supabase (via articleRepository)
        await articleRepository.update(articleId, data);
        console.log('[ArticleEdit] Article mis à jour sur Supabase (id:', articleId, ')');

        // Mettre à jour le stock actuel sur le site cible
        if (writeSiteId) {
          const newQty = parseInt(stockActuel, 10) || 0;
          await stockRepository.createOrUpdate(articleId, writeSiteId, newQty);
          console.log('[ArticleEdit] Stock mis à jour sur Supabase:', newQty, 'site:', writeSiteId);
        }
      } else {
        const newArticleId = await articleRepository.create(data);

        // Créer le stock initial sur le site effectif (sous-site sélectionné ou site parent)
        const qtyInitiale = parseInt(stockActuel, 10) || 0;
        if (writeSiteId) {
          await stockRepository.createOrUpdate(newArticleId, writeSiteId, qtyInitiale);
        }

        // Sync directe vers Supabase (insert)
        supabase.from(tables.articles).insert({
          reference: data.reference,
          name: data.nom,
          description: data.description || null,
          category: data.famille || null,
          codeFamille: data.codeFamille || null,
          articleType: data.typeArticle || null,
          brand: data.marque || null,
          emplacement: data.emplacement || null,
          minStock: data.stockMini,
          unit: data.unite,
          imageUrl: data.photoUrl || null,
        }).then(({ error }) => {
          if (error) console.warn('[ArticleEdit] Sync Supabase insert échouée:', error.message);
          else console.log('[ArticleEdit] Article inséré sur Supabase');
        });
      }

      setIsSubmitting(false);
      setShowSuccess(true);
      Vibration.vibrate([0, 30, 60, 30]);

      setTimeout(() => {
        setShowSuccess(false);
        if (isEditing) {
          // Retourner à la liste des articles après mise à jour
          navigation.navigate('ArticlesList');
        } else {
          navigation.goBack();
        }
      }, 1800);
    } catch (error: any) {
      console.error('[ArticleEdit] ERREUR handleSubmit:', error?.message || error);
      setIsSubmitting(false);
      Vibration.vibrate(50);
      Alert.alert(
        'Erreur',
        `Impossible d'enregistrer l'article.\n\n${error?.message || 'Erreur inconnue'}`,
      );
    }
  };

  // ===== Progression du formulaire =====
  const completedSections = useMemo(() => {
    const section1 = isPCEditMode
      ? reference.trim().length >= 3 && nom.trim().length >= 2
      : reference.trim().length >= 7 && nom.trim().length >= 2 && !!codeFamille && !!famille;

    const section2 = isPCEditMode ? true : !!(typeArticle && sousType && marque);
    const section3 = isEditing ? true : selectedSiteIds.length > 0;

    const stockActuelValue = Number(stockActuel);
    const stockMiniValue = Number(stockMini);
    const section4 =
      Number.isFinite(stockActuelValue) &&
      Number.isFinite(stockMiniValue) &&
      stockActuelValue >= 0 &&
      stockMiniValue >= 0;

    const section5 = description.trim().length > 0;
    const section6 = !!photoUri;

    return [section1, section2, section3, section4, section5, section6].filter(Boolean).length;
  }, [
    isPCEditMode,
    isEditing,
    reference,
    nom,
    codeFamille,
    famille,
    typeArticle,
    sousType,
    marque,
    selectedSiteIds,
    stockActuel,
    stockMini,
    description,
    photoUri,
  ]);

  // ===== DropdownItem helpers =====
  const codeFamilleItems = useMemo(() => CODE_FAMILLE_OPTIONS.map(c => ({
    value: c, label: `Famille ${c}`, badge: c,
  })), [CODE_FAMILLE_OPTIONS]);

  const familleItems = useMemo(() => FAMILLE_OPTIONS.map(f => ({
    value: f.value, label: f.label, icon: f.icon, color: f.color,
  })), [FAMILLE_OPTIONS]);

  const typeItems = useMemo(() => TYPE_OPTIONS.map(t => ({
    value: t.value, label: t.label, icon: t.icon, color: t.color,
  })), [TYPE_OPTIONS]);

  const sousTypeItems = useMemo(() => SOUS_TYPE_OPTIONS.map(t => ({
    value: t.value, label: t.label, icon: t.icon, color: t.color,
  })), []);

  const marqueItems = useMemo(() => sortedMarqueOptions.map(m => ({
    value: m.value, label: m.label, icon: m.icon, color: m.color,
  })), [sortedMarqueOptions]);

  const emplacementItems = useMemo(() => filteredEmplacements.map(e => ({
    value: e.value, label: e.label, icon: e.icon, color: e.color,
  })), [filteredEmplacements]);

  // ===== Loading =====
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

// ==================== RENDER (OBSIDIAN GRID) ====================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F0D" />

      {/* HERO HEADER */}
      <CreateArticleHero
        isEditing={isEditing}
        isPCEditMode={isPCEditMode}
        onBack={() => { Vibration.vibrate(10); navigation.goBack(); }}
      />

      {/* PROGRESS BAR */}
      <FormProgressBar completed={completedSections} total={6} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ======= SECTION 1 : INFORMATIONS PRINCIPALES ======= */}
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.sectionWrap}>
            <SectionHeader accent={SECTION_ACCENTS[isPCEditMode ? 'infos' : 'infos']} title={isPCEditMode ? 'Identité du poste' : 'Informations principales'} />
            <SectionCard>
              {!isPCEditMode && (
                <FormField
                  label="Référence"
                  required
                  sectionBorderColor={SECTION_ACCENTS.infos.border}
                  leftIcon="barcode"
                  value={reference}
                  onChangeText={handleReferenceChange}
                  placeholder="REF-123..."
                  autoCapitalize="characters"
                  maxLength={30}
                  editable={!isEditing}
                  isValid={refStatus === 'available' && reference.length >= 7}
                  onScan={!isEditing ? async () => {
                    Vibration.vibrate(15);
                    if (!hasPermission) {
                      const granted = await requestPermission();
                      if (granted) setShowScanRefModal(true);
                      else Alert.alert('Autorisation', "Autorisez l'accès à la caméra pour scanner.");
                      return;
                    }
                    setShowScanRefModal(true);
                  } : undefined}
                />
              )}

              <FormField
                label={isPCEditMode ? 'Hostname' : 'Nom'}
                required
                sectionBorderColor={SECTION_ACCENTS.infos.border}
                leftIcon="pencil-outline"
                value={nom}
                onChangeText={setNom}
                placeholder={isPCEditMode ? 'Hostname du poste...' : "Désignation de l'article"}
                maxLength={100}
                isValid={nom.trim().length >= 2}
              />

              {!isPCEditMode && (
                <FormDropdown
                  label="Code Famille"
                  required
                  value={codeFamille}
                  placeholder="Aucun code famille"
                  leftIcon="tag-outline"
                  sectionBorderColor={SECTION_ACCENTS.infos.border}
                  onPress={() => { Vibration.vibrate(10); setShowFamilleModal(true); }}
                />
              )}

              {!isPCEditMode && (
                <FormDropdown
                  label="Famille"
                  required
                  value={famille}
                  placeholder="Sélectionner une famille"
                  leftIcon="shape-outline"
                  sectionBorderColor={SECTION_ACCENTS.infos.border}
                  onPress={() => { Vibration.vibrate(10); setShowFamilleTypeModal(true); }}
                />
              )}
            </SectionCard>
          </Animated.View>

          {/* ======= SECTION 2 : CLASSIFICATION ======= */}
          {!isPCEditMode && (
            <Animated.View entering={FadeInDown.delay(120).duration(300)} style={styles.sectionWrap}>
              <SectionHeader accent={SECTION_ACCENTS.classif} />
              <SectionCard>
                <FormDropdown
                  label="Type"
                  required
                  value={typeArticle}
                  placeholder="Sélectionner un type"
                  leftIcon="format-list-bulleted-type"
                  sectionBorderColor={SECTION_ACCENTS.classif.border}
                  onPress={() => { Vibration.vibrate(10); setShowTypeModal(true); }}
                />
                <FormDropdown
                  label="Sous-type"
                  required
                  value={sousType}
                  placeholder="Sélectionner un sous-type"
                  leftIcon="tag-text-outline"
                  sectionBorderColor={SECTION_ACCENTS.classif.border}
                  onPress={() => { Vibration.vibrate(10); setShowSousTypeModal(true); }}
                  disabled={!typeArticle}
                  disabledHint={!typeArticle ? 'Sélectionnez d\'abord un type' : undefined}
                />
                <FormDropdown
                  label="Marque"
                  required
                  value={marque}
                  placeholder="Sélectionner une marque"
                  leftIcon="star-circle-outline"
                  sectionBorderColor={SECTION_ACCENTS.classif.border}
                  onPress={() => { Vibration.vibrate(10); setShowMarqueModal(true); }}
                />
              </SectionCard>
            </Animated.View>
          )}

          {/* ======= SECTION 3 : STOCK CONCERNÉ ======= */}
          <Animated.View entering={FadeInDown.delay(180).duration(300)} style={styles.sectionWrap}>
            <SectionHeader accent={SECTION_ACCENTS.stock_site} />
            <SectionCard style={{ gap: 0 }}>
              {isEditing ? (
                <View style={styles.siteInfoRow}>
                  <Icon name="office-building" size={16} color={SECTION_ACCENTS.stock_site.color} />
                  <Text style={styles.siteInfoText}>{siteActif?.nom ?? 'Site actif'}</Text>
                </View>
              ) : (
                <StockSiteSelector
                  sites={sites}
                  selectedIds={selectedSiteIds}
                  onToggle={(id) => {
                    Vibration.vibrate(10);
                    setSelectedSiteIds(prev =>
                      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                    );
                  }}
                />
              )}
            </SectionCard>
          </Animated.View>

          {/* ======= SECTION 4 : NIVEAUX DE STOCK ======= */}
          <Animated.View entering={FadeInDown.delay(240).duration(300)} style={styles.sectionWrap}>
            <SectionHeader accent={SECTION_ACCENTS.stock_level} />
            <SectionCard>
              <View style={styles.stockLevelRow}>
                <StockLevelCard
                  label="STOCK ACTUEL"
                  iconName="package-variant"
                  iconColor={SECTION_ACCENTS.stock_level.color}
                  iconBg={SECTION_ACCENTS.stock_level.bg}
                  borderColor={SECTION_ACCENTS.stock_level.border}
                  value={parseInt(stockActuel, 10) || 0}
                  onChange={(v) => setStockActuel(String(v))}
                  plusColor="#22C55E"
                />
                <StockLevelCard
                  label="SEUIL D'ALERTE"
                  iconName="bell-alert-outline"
                  iconColor="#F59E0B"
                  iconBg="rgba(245, 158, 11, 0.12)"
                  borderColor="rgba(245, 158, 11, 0.4)"
                  value={parseInt(stockMini, 10) || 0}
                  onChange={(v) => setStockMini(String(v))}
                  plusColor="#F59E0B"
                  minusColor="#F59E0B"
                />
              </View>
              <View style={styles.infoNote}>
                <Icon name="information-outline" size={13} color="#3B82F6" />
                <Text style={styles.infoNoteText}>
                  Une alerte sera affichée si le stock descend sous le seuil
                </Text>
              </View>
            </SectionCard>
          </Animated.View>

          {/* ======= SECTION 5 : INFORMATIONS COMPLÉMENTAIRES ======= */}
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.sectionWrap}>
            <SectionHeader accent={SECTION_ACCENTS.complement} />
            <SectionCard>
              <DescriptionTextarea
                value={description}
                onChange={setDescription}
              />
            </SectionCard>
          </Animated.View>

          {/* ======= SECTION 6 : PHOTO ======= */}
          <Animated.View entering={FadeInDown.delay(360).duration(300)} style={styles.sectionWrap}>
            <SectionHeader accent={SECTION_ACCENTS.photo} />
            <SectionCard>
              <PhotoUploadZone
                photoUri={photoUri}
                onCamera={handleTakePhoto}
                onGallery={handlePickGallery}
                onRemove={handleRemovePhoto}
              />
            </SectionCard>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER STICKY */}
      <CreateArticleFooter
        isValid={isFormValid}
        isLoading={isSubmitting}
        showSuccess={showSuccess}
        onSubmit={handleSubmit}
        isEditing={isEditing}
      />

      {/* ===== MODAL SCAN RÉFÉRENCE (caméra) ===== */}
      <Modal
        visible={showScanRefModal}
        animationType="slide"
        onRequestClose={() => setShowScanRefModal(false)}
      >
        <View style={styles.scanModalContainer}>
          {hasPermission && device && (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={showScanRefModal}
              codeScanner={codeScannerRef}
              photo={false}
              video={false}
              audio={false}
            />
          )}
          <View style={styles.scanModalOverlay} pointerEvents="box-none">
            <View style={styles.scanModalHeader}>
              <TouchableOpacity
                style={styles.scanModalCloseBtn}
                onPress={() => { Vibration.vibrate(10); setShowScanRefModal(false); }}
              >
                <Icon name="close" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.scanModalTitle}>Scanner le code-barres</Text>
              <View style={{ width: 44 }} />
            </View>
            <View style={styles.scanFrameCenter}>
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCTL]} />
                <View style={[styles.scanCorner, styles.scanCTR]} />
                <View style={[styles.scanCorner, styles.scanCBL]} />
                <View style={[styles.scanCorner, styles.scanCBR]} />
              </View>
            </View>
            <View style={styles.scanModalBottom}>
              <Text style={styles.scanModalHint}>Visez le code-barres pour remplir la référence</Text>
              {!hasPermission && (
                <TouchableOpacity
                  style={styles.scanModalPermissionBtn}
                  onPress={async () => {
                    const granted = await requestPermission();
                    if (!granted) Alert.alert('Autorisation', 'Autorisez la caméra dans les paramètres.');
                  }}
                >
                  <Text style={styles.scanModalPermissionText}>Autoriser la caméra</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== DROPDOWNS BOTTOM SHEETS ===== */}
      <DropdownBottomSheet
        visible={showFamilleModal}
        title="Code Famille"
        items={codeFamilleItems}
        selectedValue={codeFamille}
        onSelect={(item) => { setCodeFamille(item.value || null); Vibration.vibrate(10); }}
        onClose={() => setShowFamilleModal(false)}
        nullable
        nullLabel="Aucun code famille"
      />

      <DropdownBottomSheet
        visible={showFamilleTypeModal}
        title="Famille"
        items={familleItems}
        selectedValue={famille}
        onSelect={(item) => { setFamille(item.value || null); Vibration.vibrate(10); }}
        onClose={() => setShowFamilleTypeModal(false)}
        nullable
        nullLabel="Aucune famille"
      />

      <DropdownBottomSheet
        visible={showTypeModal}
        title="Type"
        items={typeItems}
        selectedValue={typeArticle}
        onSelect={(item) => {
          setTypeArticle(item.value || null);
          setSousType(null);
          Vibration.vibrate(10);
        }}
        onClose={() => setShowTypeModal(false)}
        accentColor="#8B5CF6"
        nullable
        nullLabel="Aucun type"
      />

      <DropdownBottomSheet
        visible={showSousTypeModal}
        title="Sous-type"
        items={sousTypeItems}
        selectedValue={sousType}
        onSelect={(item) => { setSousType(item.value || null); Vibration.vibrate(10); }}
        onClose={() => setShowSousTypeModal(false)}
        accentColor="#8B5CF6"
        nullable
        nullLabel="Aucun sous-type"
      />

      <DropdownBottomSheet
        visible={showMarqueModal}
        title="Marque"
        items={marqueItems}
        selectedValue={marque}
        onSelect={(item) => { setMarque(item.value || null); Vibration.vibrate(10); }}
        onClose={() => setShowMarqueModal(false)}
        accentColor="#8B5CF6"
        nullable
        nullLabel="Aucune marque"
      />

      <DropdownBottomSheet
        visible={showEmplacementModal}
        title="Emplacement"
        items={emplacementItems}
        selectedValue={emplacement}
        onSelect={(item) => { setEmplacement(item.value || null); Vibration.vibrate(10); }}
        onClose={() => setShowEmplacementModal(false)}
        nullable
        nullLabel="Aucun emplacement"
      />

    </View>
  );
};

// ==================== STYLES (OBSIDIAN GRID) ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0F0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 16,
    gap: 24,
  },
  sectionWrap: {
    gap: 0,
  },
  stockLevelRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 8,
    padding: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  siteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  siteInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F0FDF4',
  },
  // === SCAN MODAL ===
  scanModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  scanModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 44) + 8 : 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  scanModalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  scanFrameCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: '#22C55E',
  },
  scanCTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  scanCTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  scanCBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  scanCBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
  scanModalBottom: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  scanModalHint: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scanModalPermissionBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    marginTop: 16,
  },
  scanModalPermissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
