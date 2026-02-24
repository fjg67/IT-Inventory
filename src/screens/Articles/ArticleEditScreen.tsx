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
import { ArticleForm, Site } from '@/types';
import debounce from 'lodash/debounce';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Camera, useCameraDevices, useCodeScanner, useCameraPermission } from 'react-native-vision-camera';
import { uploadArticleImage, isRemoteUrl } from '@/services/imageUploadService';
import { useResponsive } from '@/utils/responsive';

const REF_SCAN_CODE_TYPES = [
  'ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93',
  'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec',
] as const;

// ==================== MAIN SCREEN ====================
export const ArticleEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth } = useResponsive();

  const { articleId, famille: familleParam } = route.params || {};
  const isEditing = !!articleId;
  const { lastBarcode } = useAppSelector(state => state.scan);
  const siteActif = useAppSelector(state => state.site.siteActif);

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
    { value: 'Souris', label: 'Souris', icon: 'mouse', color: '#6366F1' },
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
    { value: 'Scanner doc', label: 'Scanner doc', icon: 'scanner', color: '#4F46E5' },
    { value: 'Ensemble de matériel', label: 'Ensemble de matériel', icon: 'package-variant-closed', color: '#78716C' },
  ];
  const TYPE_OPTIONS = useMemo(() => {
    const keys = new Set(TYPE_STATIC.map(x => x.value));
    const fromDb = typesFromDb.filter(t => !keys.has(t.value));
    return [...TYPE_STATIC, ...fromDb];
  }, [typesFromDb]);

  const SOUS_TYPE_OPTIONS: { value: string; label: string; icon: string; color: string }[] = [
    { value: 'Filaire', label: 'Filaire', icon: 'ethernet', color: '#6366F1' },
    { value: 'Sans fil', label: 'Sans fil', icon: 'wifi', color: '#3B82F6' },
    { value: 'Agence', label: 'Agence', icon: 'office-building', color: '#0EA5E9' },
    { value: 'Siège', label: 'Siège', icon: 'domain', color: '#14B8A6' },
    { value: 'D6000', label: 'D6000', icon: 'dock-bottom', color: '#8B5CF6' },
    { value: '4 ports', label: '4 ports', icon: 'usb', color: '#7C3AED' },
    { value: 'Filtre confidentialité 14"', label: 'Filtre confidentialité 14"', icon: 'eye-off', color: '#EF4444' },
    { value: 'Filtre confidentialité 15.6"', label: 'Filtre confidentialité 15.6"', icon: 'eye-off', color: '#DC2626' },
    { value: 'Filtre confidentialité 16"', label: 'Filtre confidentialité 16"', icon: 'eye-off', color: '#B91C1C' },
    { value: 'Filtre confidentialité VIP', label: 'Filtre confidentialité VIP', icon: 'eye-off-outline', color: '#9F1239' },
    { value: 'Tablette', label: 'Tablette', icon: 'tablet', color: '#06B6D4' },
    { value: 'Pour présentation', label: 'Pour présentation', icon: 'presentation', color: '#F97316' },
    { value: 'Kit clavier souris', label: 'Kit clavier souris', icon: 'keyboard-variant', color: '#A855F7' },
    { value: 'Clavier / Souris', label: 'Clavier / Souris', icon: 'mouse', color: '#6366F1' },
    { value: 'Plantronics', label: 'Plantronics', icon: 'headset', color: '#EC4899' },
    { value: 'Sacoche', label: 'Sacoche', icon: 'bag-personal', color: '#78716C' },
    { value: 'Sac à dos', label: 'Sac à dos', icon: 'bag-suitcase', color: '#92400E' },
    { value: 'Plantronics SF V1', label: 'Plantronics SF V1', icon: 'headphones', color: '#DB2777' },
    { value: 'Plantronics SF V2', label: 'Plantronics SF V2', icon: 'headphones', color: '#BE185D' },
    { value: 'Plantronics filaire', label: 'Plantronics filaire', icon: 'headset', color: '#9D174D' },
    { value: 'Epsos', label: 'Epsos', icon: 'printer', color: '#4F46E5' },
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
    { value: 'Avec feuille à feuille', label: 'Feuille à feuille', icon: 'file-document-multiple', color: '#4338CA' },
    { value: 'Projecteur', label: 'Projecteur', icon: 'projector', color: '#7C2D12' },
    { value: 'Kit audio', label: 'Kit audio', icon: 'music-box', color: '#BE123C' },
    { value: 'Kit complet', label: 'Kit complet', icon: 'package-variant', color: '#15803D' },
  ];

  const filteredTypes = useMemo(() => {
    if (!typeSearch.trim()) return TYPE_OPTIONS;
    const s = typeSearch.toLowerCase();
    return TYPE_OPTIONS.filter(t => t.label.toLowerCase().includes(s));
  }, [typeSearch]);

  const filteredSousTypes = useMemo(() => {
    if (!sousTypeSearch.trim()) return SOUS_TYPE_OPTIONS;
    const s = sousTypeSearch.toLowerCase();
    return SOUS_TYPE_OPTIONS.filter(t => t.label.toLowerCase().includes(s));
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

  // ===== Computed =====
  const isFormValid = useMemo(() => {
    const baseValid =
      reference.trim().length >= 2 &&
      nom.trim().length >= 2 &&
      parseFloat(stockMini) >= 0 &&
      !isNaN(parseFloat(stockMini));

    if (isEditing) {
      // En mode édition, seuls référence, nom et seuil sont obligatoires
      return baseValid;
    }

    // En mode création, tous les champs sont obligatoires
    return (
      baseValid &&
      codeFamille != null &&
      famille != null &&
      typeArticle != null &&
      sousType != null &&
      marque != null &&
      emplacement != null
    );
  }, [reference, nom, stockMini, codeFamille, famille, typeArticle, sousType, marque, emplacement, isEditing]);

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
        const article = await articleRepository.findById(articleId, siteActif?.id);
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
  }, [articleId, isEditing, lastBarcode, loadRefOptions, navigation, siteActif]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

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
        if (ref.trim().length < 2) {
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

        // Mettre à jour le stock actuel sur le site actif (upsert pour créer si absent)
        if (siteActif) {
          const newQty = parseInt(stockActuel, 10) || 0;
          await stockRepository.createOrUpdate(articleId, siteActif.id, newQty);
          console.log('[ArticleEdit] Stock mis à jour sur Supabase:', newQty, 'site:', siteActif.id);
        }
      } else {
        const newArticleId = await articleRepository.create(data);

        // Créer le stock initial sur chaque site sélectionné
        const qtyInitiale = parseInt(stockActuel, 10) || 0;
        for (const siteId of selectedSiteIds) {
          await stockRepository.createOrUpdate(newArticleId, siteId, qtyInitiale);
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
        if (isEditing && articleId) {
          // Naviguer vers la page de détail de l'article mis à jour
          navigation.replace('ArticleDetail', { articleId });
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

  // ===== Loading =====
  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Chargement...</Text>
      </View>
    );
  }

  // ==================== RENDER ====================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* ===== IMMERSIVE HEADER ===== */}
      <LinearGradient
        colors={['#1E3A8A', '#1E40AF', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Geometric decorations */}
        <View style={styles.headerDeco1} />
        <View style={styles.headerDeco2} />
        <View style={styles.headerDeco3} />
        <View style={styles.headerDeco4} />
        <View style={styles.headerDeco5} />

        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { Vibration.vibrate(10); navigation.goBack(); }}
          >
            <Icon name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Modifier l\'article' : 'Nouvel Article'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditing ? 'Mise à jour des informations' : 'Ajouter au stock IT'}
            </Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Icon name={isEditing ? 'pencil-outline' : 'plus-circle-outline'} size={22} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : undefined]}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== SECTION: INFORMATIONS PRINCIPALES ===== */}
          <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Icon name="information-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Informations principales</Text>
            </View>
            <View style={styles.sectionCard}>

            {/* --- REFERENCE --- */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Référence</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <View style={[
                styles.inputBox,
                refStatus === 'available' && reference.length >= 2 && styles.inputBoxSuccess,
              ]}>
                <TextInput
                  style={styles.inputText}
                  placeholder="REF-123..."
                  placeholderTextColor="#9CA3AF"
                  value={reference}
                  onChangeText={handleReferenceChange}
                  autoCapitalize="characters"
                  maxLength={20}
                  editable={!isEditing}
                />
                <View style={styles.inputActions}>
                  {!isEditing && (
                    <TouchableOpacity
                      style={styles.inlineBtn}
                      onPress={async () => {
                        Vibration.vibrate(15);
                        if (!hasPermission) {
                          const granted = await requestPermission();
                          if (granted) setShowScanRefModal(true);
                          else Alert.alert('Autorisation', 'Autorisez l\'accès à la caméra pour scanner le code-barres.');
                          return;
                        }
                        setShowScanRefModal(true);
                      }}
                    >
                      <View style={[styles.inlineBtnCircle, { backgroundColor: 'rgba(37,99,235,0.08)' }]}>
                        <Icon name="barcode-scan" size={18} color="#2563EB" />
                      </View>
                    </TouchableOpacity>
                  )}
                  {refStatus === 'checking' && (
                    <ActivityIndicator size="small" color="#2563EB" style={{ marginLeft: 6 }} />
                  )}
                  {refStatus === 'available' && reference.length >= 2 && (
                    <Animated.View entering={ZoomIn.duration(200)}>
                      <Icon name="check-circle" size={20} color="#10B981" style={{ marginLeft: 6 }} />
                    </Animated.View>
                  )}
                </View>
              </View>
              {refStatus === 'available' && reference.length >= 2 && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.validationMsg}>
                  <Icon name="check" size={13} color="#10B981" />
                  <Text style={[styles.validationText, { color: '#10B981' }]}>Référence valide</Text>
                </Animated.View>
              )}
            </View>

            {/* --- NOM --- */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Nom</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <View style={[
                styles.inputBox,
                nom.length >= 2 && styles.inputBoxSuccess,
              ]}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Désignation de l'article"
                  placeholderTextColor="#9CA3AF"
                  value={nom}
                  onChangeText={setNom}
                  maxLength={100}
                />
                {nom.length >= 2 && (
                  <Animated.View entering={ZoomIn.duration(200)}>
                    <Icon name="check-circle" size={20} color="#10B981" />
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Code Famille */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Code Famille</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerBtn}
                activeOpacity={0.7}
                onPress={() => { Vibration.vibrate(10); setShowFamilleModal(true); }}
              >
                <Icon name="tag-outline" size={20} color={codeFamille ? '#2563EB' : '#9CA3AF'} />
                <Text style={[styles.pickerText, codeFamille && styles.pickerTextSelected]}>
                  {codeFamille ? `Famille ${codeFamille}` : 'Aucun code famille'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Famille */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Famille</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerBtn}
                activeOpacity={0.7}
                onPress={() => { Vibration.vibrate(10); setShowFamilleTypeModal(true); }}
              >
                {famille ? (
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: FAMILLE_OPTIONS.find(f => f.value === famille)?.bgColor || '#F3F4F6',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon
                      name={FAMILLE_OPTIONS.find(f => f.value === famille)?.icon || 'help-circle-outline'}
                      size={16}
                      color={FAMILLE_OPTIONS.find(f => f.value === famille)?.color || '#9CA3AF'}
                    />
                  </View>
                ) : (
                  <Icon name="shape-outline" size={20} color="#9CA3AF" />
                )}
                <Text style={[styles.pickerText, famille && styles.pickerTextSelected]}>
                  {famille || 'Sélectionner une famille'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            </View>
          </Animated.View>

          {/* ===== SECTION: CLASSIFICATION ===== */}
          <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                <Icon name="shape-outline" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.sectionTitle}>Classification</Text>
            </View>
            <View style={styles.sectionCard}>

            {/* Type */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Type</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerBtn}
                activeOpacity={0.7}
                onPress={() => { Vibration.vibrate(10); setShowTypeModal(true); }}
              >
                {typeArticle ? (
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: (TYPE_OPTIONS.find(t => t.value === typeArticle)?.color || '#9CA3AF') + '15',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon
                      name={TYPE_OPTIONS.find(t => t.value === typeArticle)?.icon || 'help-circle-outline'}
                      size={16}
                      color={TYPE_OPTIONS.find(t => t.value === typeArticle)?.color || '#9CA3AF'}
                    />
                  </View>
                ) : (
                  <Icon name="format-list-bulleted-type" size={20} color="#9CA3AF" />
                )}
                <Text style={[styles.pickerText, typeArticle && styles.pickerTextSelected]}>
                  {typeArticle || 'Sélectionner un type'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Sous-type */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Sous-type</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerBtn}
                activeOpacity={0.7}
                onPress={() => { Vibration.vibrate(10); setShowSousTypeModal(true); }}
              >
                {sousType ? (
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: (SOUS_TYPE_OPTIONS.find(t => t.value === sousType)?.color || '#9CA3AF') + '15',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon
                      name={SOUS_TYPE_OPTIONS.find(t => t.value === sousType)?.icon || 'help-circle-outline'}
                      size={16}
                      color={SOUS_TYPE_OPTIONS.find(t => t.value === sousType)?.color || '#9CA3AF'}
                    />
                  </View>
                ) : (
                  <Icon name="tag-text-outline" size={20} color="#9CA3AF" />
                )}
                <Text style={[styles.pickerText, sousType && styles.pickerTextSelected]}>
                  {sousType || 'Sélectionner un sous-type'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Marque */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Marque</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerBtn}
                activeOpacity={0.7}
                onPress={() => { Vibration.vibrate(10); setShowMarqueModal(true); }}
              >
                {marque ? (
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: (MARQUE_OPTIONS.find(m => m.value === marque)?.color || '#6B7280') + '18',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{
                      fontSize: 10, fontWeight: '800',
                      color: MARQUE_OPTIONS.find(m => m.value === marque)?.color || '#6B7280',
                    }}>
                      {MARQUE_OPTIONS.find(m => m.value === marque)?.initials || '?'}
                    </Text>
                  </View>
                ) : (
                  <Icon name="domain" size={20} color="#9CA3AF" />
                )}
                <Text style={[styles.pickerText, marque && styles.pickerTextSelected]}>
                  {marque || 'Sélectionner une marque'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Site */}
            {!isEditing && sites.length > 1 && (
              <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Site</Text>
                  <Text style={styles.required}>*</Text>
                </View>
                {sites.map((site) => {
                  const checked = selectedSiteIds.includes(site.id);
                  return (
                    <TouchableOpacity
                      key={site.id}
                      style={[styles.siteItem, checked && styles.siteItemChecked]}
                      activeOpacity={0.7}
                      onPress={() => {
                        Vibration.vibrate(10);
                        setSelectedSiteIds([site.id]);
                      }}
                    >
                      <View style={[styles.radioOuter, checked && styles.radioOuterSelected]}>
                        {checked && (
                          <Animated.View entering={ZoomIn.springify()} style={styles.radioInner} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.siteText, checked && styles.siteTextChecked]}>
                          {site.nom}
                        </Text>
                        {site.adresse ? (
                          <Text style={styles.siteAddr}>{site.adresse}</Text>
                        ) : null}
                      </View>
                      {checked && (
                        <Animated.View entering={ZoomIn.duration(200)}>
                          <Icon name="check-circle" size={22} color="#3B82F6" />
                        </Animated.View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Emplacement */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Emplacement</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={[styles.pickerBtn, emplacement && { borderColor: (EMPLACEMENT_OPTIONS.find(e => e.value === emplacement)?.color || '#E5E7EB') + '40' }]}
                activeOpacity={0.7}
                onPress={() => { Vibration.vibrate(10); setShowEmplacementModal(true); }}
              >
                {emplacement ? (
                  <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: (EMPLACEMENT_OPTIONS.find(e => e.value === emplacement)?.color || '#6366F1') + '15',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon
                      name={EMPLACEMENT_OPTIONS.find(e => e.value === emplacement)?.icon || 'map-marker'}
                      size={18}
                      color={EMPLACEMENT_OPTIONS.find(e => e.value === emplacement)?.color || '#6366F1'}
                    />
                  </View>
                ) : (
                  <Icon name="map-marker-outline" size={20} color="#9CA3AF" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerText, emplacement && styles.pickerTextSelected]}>
                    {emplacement || 'Sélectionner un emplacement'}
                  </Text>
                  {emplacement && (
                    <Text style={{ fontSize: 11, color: EMPLACEMENT_OPTIONS.find(e => e.value === emplacement)?.color || '#9CA3AF', marginTop: 1 }}>
                      {EMPLACEMENT_OPTIONS.find(e => e.value === emplacement)?.zone || ''}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            </View>
          </Animated.View>

          {/* ===== SECTION: STOCK ===== */}
          <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <Icon name="package-variant" size={18} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Stock</Text>
            </View>
            <View style={styles.sectionCard}>
            <View style={styles.stockRow}>
              {/* Stock Actuel */}
              <View style={styles.stockCard}>
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.10)', 'rgba(59, 130, 246, 0.03)']}
                  style={styles.stockCardGradient}
                >
                  <View style={[styles.stockCardIcon, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
                    <Icon name="package-variant" size={24} color="#2563EB" />
                  </View>
                  <Text style={styles.stockCardLabel}>Stock actuel</Text>
                  <View style={styles.stockCardInputBox}>
                    <TextInput
                      style={styles.stockCardInput}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      value={stockActuel}
                      onChangeText={setStockActuel}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </LinearGradient>
              </View>

              {/* Seuil d'alerte */}
              <View style={styles.stockCard}>
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.10)', 'rgba(245, 158, 11, 0.03)']}
                  style={styles.stockCardGradient}
                >
                  <View style={[styles.stockCardIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                    <Icon name="bell-alert-outline" size={24} color="#F59E0B" />
                  </View>
                  <Text style={styles.stockCardLabel}>Seuil d'alerte</Text>
                  <View style={[styles.stockCardInputBox, { borderColor: '#FDE68A' }]}>
                    <TextInput
                      style={styles.stockCardInput}
                      placeholder="5"
                      placeholderTextColor="#9CA3AF"
                      value={stockMini}
                      onChangeText={setStockMini}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Info hint */}
            <View style={styles.stockHint}>
              <Icon name="information-outline" size={14} color="#9CA3AF" />
              <Text style={styles.stockHintText}>
                Une alerte sera affichée si le stock descend sous le seuil
              </Text>
            </View>
            </View>
          </Animated.View>

          {/* ===== SECTION: INFORMATIONS COMPLÉMENTAIRES ===== */}
          <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <Icon name="text-box-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.sectionTitle}>Informations complémentaires</Text>
            </View>
            <View style={styles.sectionCard}>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description (optionnel)</Text>
              <View style={styles.textareaBox}>
                <TextInput
                  style={styles.textarea}
                  placeholder="Détails supplémentaires..."
                  placeholderTextColor="#9CA3AF"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={200}
                />
                <Text style={styles.charCount}>{description.length}/200</Text>
              </View>
            </View>
            </View>
          </Animated.View>

          {/* ===== SECTION: PHOTO ===== */}
          <Animated.View entering={FadeInUp.delay(450).springify()} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
                <Icon name="camera-outline" size={18} color="#EC4899" />
              </View>
              <Text style={styles.sectionTitle}>Photo</Text>
            </View>
            <View style={styles.sectionCard}>

            {!photoUri ? (
              /* Empty state */
              <View style={styles.photoEmpty}>
                <LinearGradient
                  colors={['rgba(236, 72, 153, 0.08)', 'rgba(236, 72, 153, 0.02)']}
                  style={styles.photoEmptyGradient}
                >
                  <View style={styles.photoEmptyIcon}>
                    <Icon name="camera-plus-outline" size={40} color="#EC4899" />
                  </View>
                  <Text style={styles.photoEmptyTitle}>Ajouter une photo</Text>
                  <Text style={styles.photoEmptySubtitle}>Prenez ou choisissez une photo de l'article</Text>

                  <View style={styles.photoButtons}>
                    <TouchableOpacity style={styles.photoBtnCamera} activeOpacity={0.7} onPress={handleTakePhoto}>
                      <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.photoBtnGradient}>
                        <Icon name="camera" size={20} color="#FFF" />
                        <Text style={styles.photoBtnCameraText}>Caméra</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.photoBtnGallery} activeOpacity={0.7} onPress={handlePickGallery}>
                      <Icon name="image-multiple-outline" size={20} color="#374151" />
                      <Text style={styles.photoBtnGalleryText}>Galerie</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            ) : (
              /* Preview */
              <Animated.View entering={ZoomIn.duration(300)}>
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" />

                  {/* Remove button */}
                  <TouchableOpacity style={styles.photoRemoveBtn} onPress={handleRemovePhoto} activeOpacity={0.7}>
                    <View style={styles.photoRemoveBg}>
                      <Icon name="close" size={16} color="#EF4444" />
                    </View>
                  </TouchableOpacity>

                  {/* Change button */}
                  <View style={styles.photoChangeRow}>
                    <TouchableOpacity style={styles.photoChangeBtn} activeOpacity={0.7} onPress={handleTakePhoto}>
                      <Icon name="camera" size={16} color="#2563EB" />
                      <Text style={styles.photoChangeText}>Reprendre</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoChangeBtn} activeOpacity={0.7} onPress={handlePickGallery}>
                      <Icon name="image-multiple-outline" size={16} color="#2563EB" />
                      <Text style={styles.photoChangeText}>Galerie</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}
            </View>
          </Animated.View>

          {/* Spacer for button */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== STICKY SUBMIT ===== */}
      <LinearGradient
        colors={['rgba(248,250,252,0)', 'rgba(248,250,252,0.95)', '#F8FAFC']}
        style={styles.stickyBottom}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting || showSuccess}
          style={[styles.submitTouchable, (!isFormValid || isSubmitting) && styles.submitTouchableDisabled]}
        >
          <LinearGradient
            colors={showSuccess ? ['#10B981', '#059669'] : (isFormValid ? ['#3B82F6', '#1D4ED8'] : ['#D1D5DB', '#9CA3AF'])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.submitText}>
                  {isEditing ? 'Mise à jour en cours...' : 'Création en cours...'}
                </Text>
              </>
            ) : showSuccess ? (
              <>
                <Animated.View entering={ZoomIn.duration(300)}>
                  <Icon name="check-circle" size={26} color="#FFF" />
                </Animated.View>
                <Text style={styles.submitText}>
                  {isEditing ? 'Article mis à jour !' : 'Article créé !'}
                </Text>
              </>
            ) : (
              <>
                <Icon name="check-circle-outline" size={24} color="#FFF" />
                <Text style={styles.submitText}>
                  {isEditing ? 'Mettre à jour' : 'Créer l\'article'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

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
            {/* Header */}
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

            {/* Cadre de scan central */}
            <View style={styles.scanFrameCenter}>
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCTL]} />
                <View style={[styles.scanCorner, styles.scanCTR]} />
                <View style={[styles.scanCorner, styles.scanCBL]} />
                <View style={[styles.scanCorner, styles.scanCBR]} />
              </View>
            </View>

            {/* Hint en bas */}
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

      {/* ===== CODE FAMILLE MODAL ===== */}
      <Modal visible={showFamilleModal} transparent animationType="slide" onRequestClose={() => setShowFamilleModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowFamilleModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Code Famille</Text>

                <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                  {/* None option */}
                  <TouchableOpacity
                    style={[styles.modalItem, codeFamille === null && styles.modalItemActive]}
                    onPress={() => { setCodeFamille(null); setShowFamilleModal(false); Vibration.vibrate(10); }}
                  >
                    <Icon
                      name={codeFamille === null ? 'radiobox-marked' : 'radiobox-blank'}
                      size={22}
                      color={codeFamille === null ? '#2563EB' : '#D1D5DB'}
                    />
                    <Text style={[styles.modalItemText, codeFamille === null && styles.modalItemTextActive]}>
                      Aucun code famille
                    </Text>
                  </TouchableOpacity>

                  {CODE_FAMILLE_OPTIONS.map(code => {
                    const selected = codeFamille === code;
                    return (
                      <TouchableOpacity
                        key={code}
                        style={[styles.modalItem, selected && styles.modalItemActive]}
                        onPress={() => { setCodeFamille(code); setShowFamilleModal(false); Vibration.vibrate(10); }}
                      >
                        <View style={{
                          width: 36, height: 36, borderRadius: 10,
                          backgroundColor: selected ? 'rgba(37,99,235,0.1)' : '#F3F4F6',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        }}>
                          <Text style={{
                            fontSize: 15, fontWeight: '700',
                            color: selected ? '#2563EB' : '#6B7280',
                          }}>{code}</Text>
                        </View>
                        <Text style={[styles.modalItemText, selected && styles.modalItemTextActive]}>
                          Famille {code}
                        </Text>
                        {selected && (
                          <Icon name="check-circle" size={22} color="#2563EB" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12, marginHorizontal: 4 }} />
                  <TouchableOpacity
                    style={styles.addOptionRow}
                    onPress={() => { Vibration.vibrate(10); setAddCodeFamilleInput(''); setShowAddCodeFamilleModal(true); }}
                  >
                    <View style={styles.addOptionIconWrap}>
                      <Icon name="plus" size={24} color="#2563EB" />
                    </View>
                    <Text style={styles.addOptionText}>Ajouter un code famille</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== FAMILLE MODAL ===== */}
      <Modal visible={showFamilleTypeModal} transparent animationType="slide" onRequestClose={() => setShowFamilleTypeModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowFamilleTypeModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { maxHeight: '75%' }]}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Famille de l'article</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, marginHorizontal: 20, textAlign: 'center' }}>
                  Sélectionnez le type de famille pour cet article
                </Text>

                <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                  {/* Option aucune */}
                  <TouchableOpacity
                    style={[styles.modalItem, famille === null && styles.modalItemActive]}
                    onPress={() => { setFamille(null); setShowFamilleTypeModal(false); Vibration.vibrate(10); }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 12,
                      backgroundColor: '#F3F4F6',
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                    }}>
                      <Icon name="close" size={20} color="#9CA3AF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemText, famille === null && styles.modalItemTextActive]}>
                        Aucune famille
                      </Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                        Article non classé
                      </Text>
                    </View>
                    {famille === null && (
                      <Icon name="check-circle" size={22} color="#2563EB" />
                    )}
                  </TouchableOpacity>

                  {/* Séparateur */}
                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 8, marginHorizontal: 4 }} />

                  {/* Options famille */}
                  {FAMILLE_OPTIONS.map((fam, index) => {
                    const selected = famille === fam.value;
                    return (
                      <Animated.View key={fam.value} entering={FadeInUp.delay(index * 50).duration(300)}>
                        <TouchableOpacity
                          style={[
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              marginHorizontal: 4,
                              marginVertical: 3,
                              borderRadius: 14,
                              backgroundColor: selected ? fam.bgColor : 'transparent',
                              borderWidth: selected ? 1.5 : 0,
                              borderColor: selected ? fam.color + '40' : 'transparent',
                            },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (fam.value === 'Kit') {
                              setShowFamilleTypeModal(false);
                              Vibration.vibrate(10);
                              navigation.navigate('Kit');
                              return;
                            }
                            setFamille(fam.value); setShowFamilleTypeModal(false); Vibration.vibrate(10);
                          }}
                        >
                          {/* Icône avec fond coloré */}
                          <View style={{
                            width: 48, height: 48, borderRadius: 14,
                            backgroundColor: selected ? fam.color + '20' : fam.bgColor,
                            alignItems: 'center', justifyContent: 'center', marginRight: 14,
                            shadowColor: selected ? fam.color : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: selected ? 0.3 : 0,
                            shadowRadius: 8,
                            elevation: selected ? 4 : 0,
                          }}>
                            <Icon name={fam.icon} size={24} color={fam.color} />
                          </View>

                          {/* Texte */}
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 16, fontWeight: selected ? '700' : '500',
                              color: selected ? fam.color : '#1F2937',
                            }}>
                              {fam.emoji}  {fam.label}
                            </Text>
                          </View>

                          {/* Check */}
                          {selected && (
                            <View style={{
                              width: 28, height: 28, borderRadius: 14,
                              backgroundColor: fam.color,
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon name="check" size={16} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}

                  <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12, marginHorizontal: 4 }} />
                  <TouchableOpacity
                    style={styles.addOptionRow}
                    onPress={() => { Vibration.vibrate(10); setAddFamilleInput(''); setShowAddFamilleModal(true); }}
                  >
                    <View style={styles.addOptionIconWrap}>
                      <Icon name="plus" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={styles.addOptionText}>Ajouter une famille</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== TYPE MODAL ===== */}
      <Modal visible={showTypeModal} transparent animationType="slide" onRequestClose={() => setShowTypeModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Type d'article</Text>

                {/* Barre de recherche */}
                <View style={styles.modalSearch}>
                  <Icon name="magnify" size={18} color="#9CA3AF" />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Rechercher un type..."
                    placeholderTextColor="#9CA3AF"
                    value={typeSearch}
                    onChangeText={setTypeSearch}
                  />
                  {typeSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setTypeSearch('')}>
                      <Icon name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                  {/* Aucun */}
                  <TouchableOpacity
                    style={[styles.modalItem, typeArticle === null && styles.modalItemActive]}
                    onPress={() => { setTypeArticle(null); setShowTypeModal(false); setTypeSearch(''); Vibration.vibrate(10); }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Icon name="close" size={18} color="#9CA3AF" />
                    </View>
                    <Text style={[styles.modalItemText, typeArticle === null && styles.modalItemTextActive]}>Aucun type</Text>
                    {typeArticle === null && <Icon name="check-circle" size={20} color="#2563EB" style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>

                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 6 }} />

                  {filteredTypes.map((t, index) => {
                    const selected = typeArticle === t.value;
                    return (
                      <TouchableOpacity
                        key={t.value}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingVertical: 12, paddingHorizontal: 14,
                          marginVertical: 2, marginHorizontal: 2,
                          borderRadius: 12,
                          backgroundColor: selected ? t.color + '12' : 'transparent',
                          borderWidth: selected ? 1.5 : 0,
                          borderColor: selected ? t.color + '35' : 'transparent',
                        }}
                        activeOpacity={0.7}
                        onPress={() => { setTypeArticle(t.value); setShowTypeModal(false); setTypeSearch(''); Vibration.vibrate(10); }}
                      >
                        <View style={{
                          width: 40, height: 40, borderRadius: 10,
                          backgroundColor: selected ? t.color + '20' : t.color + '10',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                          shadowColor: selected ? t.color : 'transparent',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: selected ? 0.25 : 0,
                          shadowRadius: 6, elevation: selected ? 3 : 0,
                        }}>
                          <Icon name={t.icon} size={20} color={t.color} />
                        </View>
                        <Text style={{
                          flex: 1, fontSize: 15,
                          fontWeight: selected ? '700' : '500',
                          color: selected ? t.color : '#1F2937',
                        }}>{t.label}</Text>
                        {selected && (
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.color, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="check" size={14} color="#FFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {filteredTypes.length === 0 && typeSearch && (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                      <Icon name="magnify-close" size={40} color="#D1D5DB" />
                      <Text style={{ fontSize: 15, color: '#9CA3AF', marginTop: 8 }}>Aucun résultat</Text>
                    </View>
                  )}

                  <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12, marginHorizontal: 4 }} />
                  <TouchableOpacity
                    style={styles.addOptionRow}
                    onPress={() => { Vibration.vibrate(10); setAddTypeInput(''); setShowAddTypeModal(true); }}
                  >
                    <View style={[styles.addOptionIconWrap, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                      <Icon name="plus" size={24} color="#6366F1" />
                    </View>
                    <Text style={styles.addOptionText}>Ajouter un type</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL AJOUTER CODE FAMILLE ===== */}
      <Modal visible={showAddCodeFamilleModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAddCodeFamilleModal(false)}>
          <View style={styles.addOptionModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.addOptionModalBox}>
                <Text style={styles.addOptionModalTitle}>Nouveau code famille</Text>
                <TextInput
                  style={styles.addOptionInput}
                  placeholder="Ex: 18"
                  placeholderTextColor="#9CA3AF"
                  value={addCodeFamilleInput}
                  onChangeText={setAddCodeFamilleInput}
                  autoCapitalize="characters"
                  maxLength={10}
                />
                <View style={styles.addOptionModalActions}>
                  <TouchableOpacity style={styles.addOptionBtnCancel} onPress={() => setShowAddCodeFamilleModal(false)}>
                    <Text style={styles.addOptionBtnCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addOptionBtnSubmit, (!addCodeFamilleInput.trim() || addingRefOption) && { opacity: 0.6 }]}
                    disabled={!addCodeFamilleInput.trim() || addingRefOption}
                    onPress={async () => {
                      const code = addCodeFamilleInput.trim();
                      if (!code) return;
                      setAddingRefOption(true);
                      try {
                        await refOptionsRepository.createCodeFamille(code);
                        await loadRefOptions();
                        setCodeFamille(code);
                        setShowAddCodeFamilleModal(false);
                        setAddCodeFamilleInput('');
                        Vibration.vibrate(10);
                        Alert.alert('Ajouté', `Code famille "${code}" enregistré.`);
                      } catch (e) {
                        Alert.alert('Erreur', (e as Error).message);
                      } finally {
                        setAddingRefOption(false);
                      }
                    }}
                  >
                    {addingRefOption ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.addOptionBtnSubmitText}>Valider</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL AJOUTER FAMILLE ===== */}
      <Modal visible={showAddFamilleModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAddFamilleModal(false)}>
          <View style={styles.addOptionModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.addOptionModalBox}>
                <Text style={styles.addOptionModalTitle}>Nouvelle famille</Text>
                <TextInput
                  style={styles.addOptionInput}
                  placeholder="Ex: Moniteur"
                  placeholderTextColor="#9CA3AF"
                  value={addFamilleInput}
                  onChangeText={setAddFamilleInput}
                  maxLength={50}
                />
                <View style={styles.addOptionModalActions}>
                  <TouchableOpacity style={styles.addOptionBtnCancel} onPress={() => setShowAddFamilleModal(false)}>
                    <Text style={styles.addOptionBtnCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addOptionBtnSubmit, (!addFamilleInput.trim() || addingRefOption) && { opacity: 0.6 }]}
                    disabled={!addFamilleInput.trim() || addingRefOption}
                    onPress={async () => {
                      const value = addFamilleInput.trim();
                      if (!value) return;
                      setAddingRefOption(true);
                      try {
                        await refOptionsRepository.createFamille(value);
                        await loadRefOptions();
                        setFamille(value);
                        setShowAddFamilleModal(false);
                        setAddFamilleInput('');
                        Vibration.vibrate(10);
                        Alert.alert('Ajouté', `Famille "${value}" enregistrée.`);
                      } catch (e) {
                        Alert.alert('Erreur', (e as Error).message);
                      } finally {
                        setAddingRefOption(false);
                      }
                    }}
                  >
                    {addingRefOption ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.addOptionBtnSubmitText}>Valider</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MODAL AJOUTER TYPE ===== */}
      <Modal visible={showAddTypeModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAddTypeModal(false)}>
          <View style={styles.addOptionModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.addOptionModalBox}>
                <Text style={styles.addOptionModalTitle}>Nouveau type d'article</Text>
                <TextInput
                  style={styles.addOptionInput}
                  placeholder="Ex: Écran"
                  placeholderTextColor="#9CA3AF"
                  value={addTypeInput}
                  onChangeText={setAddTypeInput}
                  maxLength={50}
                />
                <View style={styles.addOptionModalActions}>
                  <TouchableOpacity style={styles.addOptionBtnCancel} onPress={() => setShowAddTypeModal(false)}>
                    <Text style={styles.addOptionBtnCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addOptionBtnSubmit, (!addTypeInput.trim() || addingRefOption) && { opacity: 0.6 }]}
                    disabled={!addTypeInput.trim() || addingRefOption}
                    onPress={async () => {
                      const value = addTypeInput.trim();
                      if (!value) return;
                      setAddingRefOption(true);
                      try {
                        await refOptionsRepository.createTypeArticle(value);
                        await loadRefOptions();
                        setTypeArticle(value);
                        setShowAddTypeModal(false);
                        setAddTypeInput('');
                        Vibration.vibrate(10);
                        Alert.alert('Ajouté', `Type "${value}" enregistré.`);
                      } catch (e) {
                        Alert.alert('Erreur', (e as Error).message);
                      } finally {
                        setAddingRefOption(false);
                      }
                    }}
                  >
                    {addingRefOption ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.addOptionBtnSubmitText}>Valider</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== SOUS-TYPE MODAL ===== */}
      <Modal visible={showSousTypeModal} transparent animationType="slide" onRequestClose={() => setShowSousTypeModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSousTypeModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Sous-type</Text>

                {/* Barre de recherche */}
                <View style={styles.modalSearch}>
                  <Icon name="magnify" size={18} color="#9CA3AF" />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Rechercher un sous-type..."
                    placeholderTextColor="#9CA3AF"
                    value={sousTypeSearch}
                    onChangeText={setSousTypeSearch}
                  />
                  {sousTypeSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setSousTypeSearch('')}>
                      <Icon name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                  {/* Aucun */}
                  <TouchableOpacity
                    style={[styles.modalItem, sousType === null && styles.modalItemActive]}
                    onPress={() => { setSousType(null); setShowSousTypeModal(false); setSousTypeSearch(''); Vibration.vibrate(10); }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Icon name="close" size={18} color="#9CA3AF" />
                    </View>
                    <Text style={[styles.modalItemText, sousType === null && styles.modalItemTextActive]}>Aucun sous-type</Text>
                    {sousType === null && <Icon name="check-circle" size={20} color="#2563EB" style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>

                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 6 }} />

                  {filteredSousTypes.map((st) => {
                    const selected = sousType === st.value;
                    return (
                      <TouchableOpacity
                        key={st.value}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingVertical: 12, paddingHorizontal: 14,
                          marginVertical: 2, marginHorizontal: 2,
                          borderRadius: 12,
                          backgroundColor: selected ? st.color + '12' : 'transparent',
                          borderWidth: selected ? 1.5 : 0,
                          borderColor: selected ? st.color + '35' : 'transparent',
                        }}
                        activeOpacity={0.7}
                        onPress={() => { setSousType(st.value); setShowSousTypeModal(false); setSousTypeSearch(''); Vibration.vibrate(10); }}
                      >
                        <View style={{
                          width: 40, height: 40, borderRadius: 10,
                          backgroundColor: selected ? st.color + '20' : st.color + '10',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                          shadowColor: selected ? st.color : 'transparent',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: selected ? 0.25 : 0,
                          shadowRadius: 6, elevation: selected ? 3 : 0,
                        }}>
                          <Icon name={st.icon} size={20} color={st.color} />
                        </View>
                        <Text style={{
                          flex: 1, fontSize: 15,
                          fontWeight: selected ? '700' : '500',
                          color: selected ? st.color : '#1F2937',
                        }}>{st.label}</Text>
                        {selected && (
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: st.color, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="check" size={14} color="#FFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {filteredSousTypes.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                      <Icon name="magnify-close" size={40} color="#D1D5DB" />
                      <Text style={{ fontSize: 15, color: '#9CA3AF', marginTop: 8 }}>Aucun résultat</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== MARQUE MODAL ===== */}
      <Modal visible={showMarqueModal} transparent animationType="slide" onRequestClose={() => setShowMarqueModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowMarqueModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { maxHeight: '75%' }]}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Marque</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16, marginHorizontal: 20, textAlign: 'center' }}>
                  Sélectionnez la marque du produit
                </Text>

                <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                  {/* Aucune */}
                  <TouchableOpacity
                    style={[styles.modalItem, marque === null && styles.modalItemActive]}
                    onPress={() => { setMarque(null); setShowMarqueModal(false); Vibration.vibrate(10); }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Icon name="close" size={20} color="#9CA3AF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemText, marque === null && styles.modalItemTextActive]}>Aucune marque</Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Marque non spécifiée</Text>
                    </View>
                    {marque === null && <Icon name="check-circle" size={22} color="#2563EB" />}
                  </TouchableOpacity>

                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 8, marginHorizontal: 4 }} />

                  {MARQUE_OPTIONS.map((m, index) => {
                    const selected = marque === m.value;
                    return (
                      <Animated.View key={m.value} entering={FadeInUp.delay(index * 40).duration(300)}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingVertical: 12, paddingHorizontal: 14,
                            marginVertical: 3, marginHorizontal: 2,
                            borderRadius: 14,
                            backgroundColor: selected ? m.color + '10' : 'transparent',
                            borderWidth: selected ? 1.5 : 0,
                            borderColor: selected ? m.color + '30' : 'transparent',
                          }}
                          activeOpacity={0.7}
                          onPress={() => { setMarque(m.value); setShowMarqueModal(false); Vibration.vibrate(10); }}
                        >
                          {/* Logo simulé */}
                          <View style={{
                            width: 48, height: 48, borderRadius: 14,
                            backgroundColor: selected ? m.color + '18' : m.color + '0C',
                            alignItems: 'center', justifyContent: 'center', marginRight: 14,
                            borderWidth: 1.5,
                            borderColor: selected ? m.color + '40' : m.color + '15',
                            shadowColor: selected ? m.color : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: selected ? 0.3 : 0,
                            shadowRadius: 8, elevation: selected ? 4 : 0,
                          }}>
                            <Text style={{
                              fontSize: 14, fontWeight: '900', letterSpacing: -0.5,
                              color: m.color,
                            }}>{m.initials}</Text>
                          </View>

                          {/* Infos */}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Icon name={m.icon} size={14} color={selected ? m.color : '#9CA3AF'} style={{ marginRight: 6 }} />
                              <Text style={{
                                fontSize: 16, fontWeight: selected ? '700' : '500',
                                color: selected ? m.color : '#1F2937',
                              }}>{m.label}</Text>
                            </View>
                          </View>

                          {/* Check */}
                          {selected && (
                            <View style={{
                              width: 28, height: 28, borderRadius: 14,
                              backgroundColor: m.color,
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon name="check" size={16} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== EMPLACEMENT MODAL ===== */}
      <Modal visible={showEmplacementModal} transparent animationType="slide" onRequestClose={() => setShowEmplacementModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowEmplacementModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
                <View style={styles.modalHandle} />
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                  <View style={{
                    width: 52, height: 52, borderRadius: 16,
                    backgroundColor: '#6366F115',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                  }}>
                    <Icon name="map-marker-radius" size={28} color="#6366F1" />
                  </View>
                  <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 4 }]}>Emplacement de stockage</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, textAlign: 'center', paddingHorizontal: 20 }}>
                    Où sera rangé cet article ?
                  </Text>
                </View>

                {/* Barre de recherche */}
                <View style={styles.modalSearch}>
                  <Icon name="magnify" size={18} color="#9CA3AF" />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Rechercher un emplacement..."
                    placeholderTextColor="#9CA3AF"
                    value={emplacementSearch}
                    onChangeText={setEmplacementSearch}
                  />
                  {emplacementSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setEmplacementSearch('')}>
                      <Icon name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                  {/* Aucun */}
                  <TouchableOpacity
                    style={[styles.modalItem, emplacement === null && styles.modalItemActive]}
                    onPress={() => { setEmplacement(null); setShowEmplacementModal(false); setEmplacementSearch(''); Vibration.vibrate(10); }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Icon name="map-marker-off" size={22} color="#9CA3AF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemText, emplacement === null && styles.modalItemTextActive]}>Aucun emplacement</Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Non attribué</Text>
                    </View>
                    {emplacement === null && <Icon name="check-circle" size={22} color="#2563EB" />}
                  </TouchableOpacity>

                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 8, marginHorizontal: 4 }} />

                  {/* Titre 5ème étage */}
                  {filteredEmplacements.some(e => e.etage === '5') && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8, gap: 8 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: '#3B82F615', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="layers" size={14} color="#3B82F6" />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#3B82F6', letterSpacing: 0.5, textTransform: 'uppercase' }}>5ème étage</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: '#3B82F615', marginLeft: 4 }} />
                    </View>
                  )}

                  {/* Items 5ème étage */}
                  {filteredEmplacements.filter(e => e.etage === '5').map((emp, index) => {
                    const selected = emplacement === emp.value;
                    return (
                      <Animated.View key={emp.value} entering={FadeInUp.delay(index * 40).duration(300)}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingVertical: 11, paddingHorizontal: 12,
                            marginVertical: 2, marginHorizontal: 2,
                            borderRadius: 14,
                            backgroundColor: selected ? emp.color + '12' : 'transparent',
                            borderWidth: selected ? 1.5 : 0,
                            borderColor: selected ? emp.color + '35' : 'transparent',
                          }}
                          activeOpacity={0.7}
                          onPress={() => { setEmplacement(emp.value); setShowEmplacementModal(false); setEmplacementSearch(''); Vibration.vibrate(10); }}
                        >
                          {/* Icône avec fond */}
                          <View style={{
                            width: 48, height: 48, borderRadius: 14,
                            backgroundColor: selected ? emp.color + '20' : emp.bgColor,
                            alignItems: 'center', justifyContent: 'center', marginRight: 12,
                            shadowColor: selected ? emp.color : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: selected ? 0.3 : 0,
                            shadowRadius: 8, elevation: selected ? 4 : 0,
                          }}>
                            <Text style={{ fontSize: 22 }}>{emp.emoji}</Text>
                          </View>

                          {/* Infos */}
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 15, fontWeight: selected ? '700' : '600',
                              color: selected ? emp.color : '#1F2937',
                            }}>{emp.label}</Text>
                            <Text style={{
                              fontSize: 12, marginTop: 2,
                              color: selected ? emp.color + 'AA' : '#9CA3AF',
                            }}>{emp.zone}</Text>
                          </View>

                          {/* Badge étage */}
                          <View style={{
                            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                            backgroundColor: selected ? emp.color + '15' : '#F3F4F6',
                            marginRight: 8,
                          }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: selected ? emp.color : '#6B7280' }}>
                              É{emp.etage}
                            </Text>
                          </View>

                          {/* Check */}
                          {selected && (
                            <View style={{
                              width: 26, height: 26, borderRadius: 13,
                              backgroundColor: emp.color,
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon name="check" size={15} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}

                  {/* Titre 8ème étage */}
                  {filteredEmplacements.some(e => e.etage === '8') && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8, gap: 8, marginTop: 6 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: '#F59E0B15', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="layers" size={14} color="#F59E0B" />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B', letterSpacing: 0.5, textTransform: 'uppercase' }}>8ème étage</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: '#F59E0B15', marginLeft: 4 }} />
                    </View>
                  )}

                  {/* Items 8ème étage */}
                  {filteredEmplacements.filter(e => e.etage === '8').map((emp, index) => {
                    const selected = emplacement === emp.value;
                    return (
                      <Animated.View key={emp.value} entering={FadeInUp.delay((index + 7) * 40).duration(300)}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingVertical: 11, paddingHorizontal: 12,
                            marginVertical: 2, marginHorizontal: 2,
                            borderRadius: 14,
                            backgroundColor: selected ? emp.color + '12' : 'transparent',
                            borderWidth: selected ? 1.5 : 0,
                            borderColor: selected ? emp.color + '35' : 'transparent',
                          }}
                          activeOpacity={0.7}
                          onPress={() => { setEmplacement(emp.value); setShowEmplacementModal(false); setEmplacementSearch(''); Vibration.vibrate(10); }}
                        >
                          {/* Icône avec fond */}
                          <View style={{
                            width: 48, height: 48, borderRadius: 14,
                            backgroundColor: selected ? emp.color + '20' : emp.bgColor,
                            alignItems: 'center', justifyContent: 'center', marginRight: 12,
                            shadowColor: selected ? emp.color : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: selected ? 0.3 : 0,
                            shadowRadius: 8, elevation: selected ? 4 : 0,
                          }}>
                            <Text style={{ fontSize: 22 }}>{emp.emoji}</Text>
                          </View>

                          {/* Infos */}
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 15, fontWeight: selected ? '700' : '600',
                              color: selected ? emp.color : '#1F2937',
                            }}>{emp.label}</Text>
                            <Text style={{
                              fontSize: 12, marginTop: 2,
                              color: selected ? emp.color + 'AA' : '#9CA3AF',
                            }}>{emp.zone}</Text>
                          </View>

                          {/* Badge étage */}
                          <View style={{
                            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                            backgroundColor: selected ? emp.color + '15' : '#F3F4F6',
                            marginRight: 8,
                          }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: selected ? emp.color : '#6B7280' }}>
                              É{emp.etage}
                            </Text>
                          </View>

                          {/* Check */}
                          {selected && (
                            <View style={{
                              width: 26, height: 26, borderRadius: 13,
                              backgroundColor: emp.color,
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon name="check" size={15} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}

                  {filteredEmplacements.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                      <Icon name="map-marker-question" size={40} color="#D1D5DB" />
                      <Text style={{ fontSize: 15, color: '#9CA3AF', marginTop: 8 }}>Aucun emplacement trouvé</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ===== SUCCESS OVERLAY ===== */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.successContent}>
            {/* Cercle animé avec pulse */}
            <Animated.View entering={ZoomIn.delay(100).springify().damping(8)} style={styles.successCircleOuter}>
              <View style={styles.successCircle}>
                <Animated.View entering={ZoomIn.delay(300).duration(400)}>
                  <Icon name="check-bold" size={52} color="#FFF" />
                </Animated.View>
              </View>
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(400).duration(400)} style={styles.successTitle}>
              {isEditing ? 'Mis à jour !' : 'Article créé !'}
            </Animated.Text>

            <Animated.View entering={FadeInUp.delay(550).duration(350)} style={styles.successInfoRow}>
              <Icon name="tag-outline" size={16} color="#64748B" />
              <Text style={styles.successRef}>{reference}</Text>
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(650).duration(350)} style={styles.successName}>
              {nom}
            </Animated.Text>

            {isEditing && (
              <Animated.View entering={FadeInUp.delay(800).duration(350)} style={styles.successStockBadge}>
                <Icon name="package-variant" size={16} color="#2563EB" />
                <Text style={styles.successStockText}>
                  Stock : {stockActuel} · Seuil : {stockMini}
                </Text>
              </Animated.View>
            )}

            <Animated.Text entering={FadeIn.delay(900).duration(400)} style={styles.successSubtext}>
              {isEditing ? 'Redirection vers l\'article...' : 'Retour à la liste...'}
            </Animated.Text>
          </Animated.View>
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20,
  },

  // ===== PREMIUM HEADER =====
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 44) + 10 : 54,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDeco1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerDeco2: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerDeco3: {
    position: 'absolute',
    top: 20,
    left: '40%' as any,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerDeco4: {
    position: 'absolute',
    top: -10,
    right: 60,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerDeco5: {
    position: 'absolute',
    bottom: 10,
    right: 40,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(191,219,254,0.8)',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== PREMIUM SECTIONS =====
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
    marginTop: -8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },

  // ===== PREMIUM FIELDS =====
  fieldGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
  },
  required: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  rowFields: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // ===== PREMIUM INPUT BOX =====
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputBoxSuccess: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: 'rgba(16,185,129,0.02)',
    shadowColor: '#10B981',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  inputBoxError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    shadowColor: '#EF4444',
    shadowOpacity: 0.12,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    padding: 0,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineBtn: {
    padding: 2,
  },
  inlineBtnCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },

  // ===== VALIDATION =====
  validationMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ===== PREMIUM PICKER =====
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  pickerTextSelected: {
    color: '#111827',
    fontWeight: '600',
  },

  // ===== PREMIUM STOCK CARDS =====
  stockRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stockCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: '#FFFFFF',
  },
  stockCardGradient: {
    padding: 18,
    alignItems: 'center',
  },
  stockCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stockCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockCardInputBox: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  stockCardInput: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    padding: 0,
  },
  stockHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(59,130,246,0.04)',
    borderRadius: 10,
  },
  stockHintText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    fontWeight: '500',
  },

  // ===== PREMIUM TEXTAREA =====
  textareaBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  textarea: {
    fontSize: 15,
    color: '#111827',
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 65,
    fontWeight: '400',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 6,
    fontWeight: '600',
  },

  // ===== PREMIUM SITE SELECTOR =====
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  siteItemChecked: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.04)',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2.5,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  siteText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  siteTextChecked: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  siteAddr: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '400',
  },

  // ===== PREMIUM STICKY SUBMIT =====
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 30,
  },
  submitTouchable: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  submitTouchableDisabled: {
    shadowOpacity: 0,
    shadowColor: '#9CA3AF',
    elevation: 2,
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 18,
    gap: 12,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // ===== MODAL SCAN RÉFÉRENCE =====
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
    letterSpacing: 0.3,
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
    borderColor: '#3B82F6',
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
    backgroundColor: '#2563EB',
    borderRadius: 12,
    marginTop: 16,
  },
  scanModalPermissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },

  // ===== PREMIUM MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '65%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
    fontWeight: '500',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  modalItemActive: {
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderRadius: 12,
    marginHorizontal: -4,
    paddingHorizontal: 10,
    borderBottomColor: 'transparent',
  },
  addOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(37,99,235,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(37,99,235,0.15)',
    borderStyle: 'dashed',
  },
  addOptionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(37,99,235,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.2,
  },
  addOptionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  addOptionModalBox: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  addOptionModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  addOptionInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  addOptionModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addOptionBtnCancel: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addOptionBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  addOptionBtnSubmit: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addOptionBtnSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  modalItemTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  // ===== PREMIUM PHOTO =====
  photoEmpty: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(236,72,153,0.15)',
    borderStyle: 'dashed',
  },
  photoEmptyGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  photoEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(236,72,153,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  photoEmptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  photoEmptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '400',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  photoBtnCamera: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  photoBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  photoBtnCameraText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  photoBtnGallery: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  photoBtnGalleryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  photoPreview: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  photoRemoveBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  photoChangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  photoChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.12)',
  },
  photoChangeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  // ===== PREMIUM SUCCESS =====
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 24,
    minWidth: 280,
  },
  successCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  successInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  successRef: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  successName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
  },
  successStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(37,99,235,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  successStockText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  successSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 20,
    fontWeight: '500',
  },
});

export default ArticleEditScreen;
