// ============================================
// MOUVEMENT FORM SCREEN - Premium Design
// IT-Inventory Application
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
  Alert,
  Modal,
  Dimensions,
  Linking,
  Image,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  LinearTransition,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { clearScannedArticle } from '@/store/slices/scanSlice';
import { showAlert } from '@/store/slices/uiSlice';
import { mouvementRepository, articleRepository } from '@/database';
import { syncService } from '@/api';
import { Article, MouvementStockForm } from '@/types';
import { ERROR_MESSAGES } from '@/constants';
import debounce from 'lodash/debounce';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const SCAN_FRAME = 240;

// Types supportés par la caméra
const BARCODE_TYPES = [
  'ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93',
  'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec',
] as const;

// ==================== TYPES ====================
type MouvementType = 'entree' | 'sortie' | 'ajustement';

const TYPE_CONFIG: Record<MouvementType, {
  icon: string; label: string; color: string; lightColor: string;
  bgColor: string; gradient: string[];
}> = {
  entree: {
    icon: 'arrow-up-bold-circle-outline',
    label: 'Entrée',
    color: '#10B981',
    lightColor: '#34D399',
    bgColor: 'rgba(16,185,129,0.08)',
    gradient: ['#34D399', '#10B981'],
  },
  sortie: {
    icon: 'arrow-down-bold-circle-outline',
    label: 'Sortie',
    color: '#EF4444',
    lightColor: '#F87171',
    bgColor: 'rgba(239,68,68,0.08)',
    gradient: ['#F87171', '#EF4444'],
  },
  ajustement: {
    icon: 'swap-vertical-circle-outline',
    label: 'Ajustement',
    color: '#F59E0B',
    lightColor: '#FBBF24',
    bgColor: 'rgba(245,158,11,0.08)',
    gradient: ['#FBBF24', '#F59E0B'],
  },
};

const HEADER_THEME: Record<MouvementType, {
  gradient: string[];
  stepDoneGradient: string[];
  stepActiveGradient: string[];
  doneTextColor: string;
  glyphTint: string;
  glyphIcons: string[];
}> = {
  entree: {
    gradient: ['#065F46', '#0E9F6E', '#34D399'],
    stepDoneGradient: ['#34D399', '#10B981'],
    stepActiveGradient: ['#34D399', '#059669'],
    doneTextColor: '#6EE7B7',
    glyphTint: 'rgba(6,78,59,0.36)',
    glyphIcons: ['tray-arrow-down', 'package-variant-plus', 'login-variant', 'arrow-bottom-left-thick'],
  },
  sortie: {
    gradient: ['#7F1D1D', '#B91C1C', '#EF4444'],
    stepDoneGradient: ['#FB7185', '#EF4444'],
    stepActiveGradient: ['#F87171', '#DC2626'],
    doneTextColor: '#FCA5A5',
    glyphTint: 'rgba(127,29,29,0.36)',
    glyphIcons: ['tray-arrow-up', 'package-variant-remove', 'logout-variant', 'arrow-top-right-thick'],
  },
  ajustement: {
    gradient: ['#92400E', '#D97706', '#F59E0B'],
    stepDoneGradient: ['#FCD34D', '#F59E0B'],
    stepActiveGradient: ['#FBBF24', '#D97706'],
    doneTextColor: '#FDE68A',
    glyphTint: 'rgba(146,64,14,0.34)',
    glyphIcons: ['swap-vertical-circle-outline', 'tune-variant', 'wrench-cog', 'scale-balance'],
  },
};

// ==================== MAIN SCREEN ====================
export const MouvementFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, gradients, isDark } = useTheme();

  const siteActif = useAppSelector(state => state.site.siteActif);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const childSites = useAppSelector(state => state.site.childSites);
  const selectedSubSiteId = useAppSelector(state => state.site.selectedSubSiteId);
  const technicien = useAppSelector(state => state.auth.currentTechnicien);

  // Site cible pour le mouvement : sous-site spécifique ou site actif par défaut
  const [localTargetSiteId, setLocalTargetSiteId] = useState<string | null>(
    siteActif?.id != null ? String(siteActif.id) : null,
  );
  const targetSiteId = useMemo(() => {
    if (childSites.length === 0) return effectiveSiteId; // Pas de sous-sites, on utilise le site actif
    if (selectedSubSiteId) return selectedSubSiteId; // Sous-site sélectionné explicitement
    return localTargetSiteId ?? effectiveSiteId; // Sinon le local ou le site actif
  }, [childSites, selectedSubSiteId, localTargetSiteId, effectiveSiteId]);
  const { scannedArticle, isScanning } = useAppSelector(state => state.scan);

  // Camera / Scanner
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back') ?? devices[0];
  const [showCamera, setShowCamera] = useState(false);
  const showCameraRef = useRef(false);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);
  const handleScannedBarcodeRef = useRef<(barcode: string) => void>(() => {});

  const initialArticleId = route.params?.articleId;
  const initialType = route.params?.type as MouvementType | undefined;

  // ===== Form state =====
  const [article, setArticle] = useState<Article | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [type, setType] = useState<MouvementType>(initialType ?? 'entree');
  const [quantite, setQuantite] = useState(1);
  const [commentaire, setCommentaire] = useState('');

  // ===== UI state =====
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ===== Animation State =====
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (showSuccess) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1.05, { damping: 8, stiffness: 150 }),
        withTiming(1, { duration: 200 })
      );
    }
  }, [showSuccess, buttonScale]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });





  // ===== Recharger le stock quand le site cible change =====
  useEffect(() => {
    if (article && targetSiteId) {
      articleRepository.findById(article.id, targetSiteId).then(result => {
        if (result) setArticle(result);
      }).catch(() => {});
    }
  }, [targetSiteId]);

  // ===== Computed =====
  const stockActuel = article?.quantiteActuelle ?? 0;
  const nouveauStock = useMemo(() => {
    if (!article) return null;
    switch (type) {
      case 'entree': return stockActuel + quantite;
      case 'sortie': return stockActuel - quantite;
      case 'ajustement': return quantite;
      default: return stockActuel;
    }
  }, [article, type, quantite, stockActuel]);

  const isFormValid = useMemo(() => {
    if (!article || quantite <= 0) return false;
    if (type === 'sortie' && quantite > stockActuel) return false;
    return true;
  }, [article, type, quantite, stockActuel]);

  const currentStep = useMemo(() => {
    if (!article) return 0;
    if (type) return 2;
    return 1;
  }, [article, type]);

  const typeColor = TYPE_CONFIG[type]?.color ?? colors.primary;
  const typeGradient = TYPE_CONFIG[type]?.gradient ?? gradients.primary;
  const typeBgColor = TYPE_CONFIG[type]?.bgColor ?? 'rgba(0,122,57,0.08)';
  const headerTheme = HEADER_THEME[type] ?? HEADER_THEME.entree;

  // ===== Load article =====
  const loadArticle = useCallback(async (articleId: number) => {
    if (!targetSiteId) return;
    const result = await articleRepository.findById(articleId, targetSiteId);
    if (result) setArticle(result);
  }, [targetSiteId]);

  useEffect(() => {
    if (initialArticleId && targetSiteId) {
      loadArticle(initialArticleId).catch(() => {});
    }
  }, [initialArticleId, targetSiteId, loadArticle]);

  useEffect(() => {
    if (scannedArticle) setArticle(scannedArticle);
  }, [scannedArticle]);

  // ===== Search =====
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!effectiveSiteId || query.length < 2) {
          setSuggestions([]);
          setSearching(false);
          return;
        }
        setSearching(true);
        try {
          const result = await articleRepository.search(effectiveSiteId, { searchQuery: query, stockFaible: false }, 0, 8);
          setSuggestions(result.data);
        } catch {
          setSuggestions([]);
        } finally {
          setSearching(false);
        }
      }, 350),
    [effectiveSiteId],
  );

  const handleSearchChange = (text: string) => {
    setBarcodeInput(text);
    debouncedSearch(text);
  };

  const handleSelectSuggestion = (a: Article) => {
    setArticle(a);
    setBarcodeInput('');
    setSuggestions([]);
    setErrors({});
    Vibration.vibrate(10);
  };

  const searchByBarcode = async () => {
    if (!barcodeInput.trim() || !effectiveSiteId) return;
    const result = await articleRepository.findByReferenceOrBarcode(barcodeInput.trim(), effectiveSiteId);
    if (result) {
      setArticle(result);
      setBarcodeInput('');
      setSuggestions([]);
      setErrors({});
    } else {
      setErrors({ barcode: 'Article non trouvé pour cette référence ou asset' });
    }
  };

  // ===== Camera code scanner =====
  const handleScannedBarcode = useCallback(async (barcode: string) => {
    if (!effectiveSiteId) {
      console.warn('[MouvementForm] Pas de site actif, recherche impossible');
      return;
    }
    console.log('[MouvementForm] Recherche article pour:', barcode);
    setBarcodeInput(barcode);
    try {
      const result = await articleRepository.findByReferenceOrBarcode(barcode, effectiveSiteId);
      if (result) {
        console.log('[MouvementForm] Article trouvé:', result.nom);
        setArticle(result);
        setBarcodeInput('');
        setSuggestions([]);
        setErrors({});
      } else {
        // Essayer une recherche plus large
        const searchResult = await articleRepository.search(effectiveSiteId, { searchQuery: barcode, stockFaible: false }, 0, 5);
        if (searchResult.data.length === 1) {
          setArticle(searchResult.data[0]);
          setBarcodeInput('');
          setSuggestions([]);
          setErrors({});
        } else if (searchResult.data.length > 1) {
          setSuggestions(searchResult.data);
          setErrors({});
        } else {
          console.log('[MouvementForm] Article non trouvé pour:', barcode);
          setErrors({ barcode: `Article non trouvé : ${barcode}` });
        }
      }
    } catch (err) {
      console.error('[MouvementForm] Erreur recherche:', err);
      setErrors({ barcode: 'Erreur lors de la recherche' });
    }
  }, [siteActif]);

  // Garder les refs à jour pour éviter les closures obsolètes dans le callback VisionCamera
  useEffect(() => {
    showCameraRef.current = showCamera;
  }, [showCamera]);

  useEffect(() => {
    handleScannedBarcodeRef.current = handleScannedBarcode;
  }, [handleScannedBarcode]);

  const onCodeScanned = useCallback(
    (codes: { value?: string }[]) => {
      // Utiliser la ref pour éviter une closure obsolète (VisionCamera peut conserver le callback)
      if (!showCameraRef.current || codes.length === 0 || !codes[0]?.value) return;
      const value = codes[0].value.trim();
      if (!value) return;
      const now = Date.now();
      if (lastScannedRef.current?.value === value && now - lastScannedRef.current.at < 2500) return;
      lastScannedRef.current = { value, at: now };
      console.log('[MouvementForm] Code-barres scanné:', value);
      Vibration.vibrate([0, 30, 60, 30]);
      setShowCamera(false);
      // Recherche de l'article par référence scannée via ref
      handleScannedBarcodeRef.current(value);
    },
    [],
  );

  const codeScanner = useCodeScanner({
    codeTypes: [...BARCODE_TYPES],
    onCodeScanned,
  });

  // ===== Scan =====
  const handleScanPress = async () => {
    Vibration.vibrate(20);
    setErrors({});
    if (!device) {
      Alert.alert(
        'Caméra indisponible',
        'Aucune caméra n\'a été détectée sur cet appareil.',
      );
      return;
    }
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Accès à la caméra',
          'L\'accès à la caméra est nécessaire pour scanner. Activez-la dans les paramètres.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les paramètres', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    setShowCamera(true);
  };

  // ===== Quantity =====
  const handleIncrement = () => {
    const max = type === 'sortie' ? stockActuel : 9999;
    if (quantite < max) {
      setQuantite(q => q + 1);
      Vibration.vibrate(8);
    }
  };
  const handleDecrement = () => {
    if (quantite > 1) {
      setQuantite(q => q - 1);
      Vibration.vibrate(8);
    }
  };
  const handleQtyTextChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0) {
      if (type === 'sortie' && num > stockActuel) {
        setQuantite(stockActuel > 0 ? stockActuel : 1);
      } else {
        setQuantite(Math.max(1, num));
      }
    }
    if (text === '') setQuantite(0);
  };

  // ===== Submit =====
  const handleSubmit = async () => {
    if (!article) return;
    
    if (!targetSiteId) {
      Alert.alert('Site manquant', 'Veuillez sélectionner un stock cible.');
      return;
    }

    // Utiliser le technicien connecté ou un fallback (id=1)
    const technicienId = technicien?.id ?? 1;

    if (!isFormValid) return;
    setIsSubmitting(true);
    Vibration.vibrate(15);

    try {
      const data: MouvementStockForm = {
        articleId: article.id,
        siteId: targetSiteId!,
        type,
        quantite,
        commentaire: commentaire.trim() || undefined,
      };
      
      console.log('[MouvementForm] Création mouvement:', JSON.stringify(data));
      await mouvementRepository.create(data, technicienId);
      console.log('[MouvementForm] Mouvement créé avec succès');

      setIsSubmitting(false);
      setShowSuccess(true);
      Vibration.vibrate([0, 30, 60, 30]);

      setTimeout(() => {
        setShowSuccess(false);
        // Retourner sur la liste des mouvements (entrée, sortie ou ajustement) pour voir le mouvement à jour
        navigation.getParent()?.navigate('Mouvements', { screen: 'MouvementsList' });
      }, 1800);
    } catch (error) {
      console.error('[MouvementForm] Erreur création mouvement:', error);
      setIsSubmitting(false);
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      Alert.alert('Erreur', message);
      Vibration.vibrate(50);
    }
  };

  const resetArticle = () => {
    setArticle(null);
    setBarcodeInput('');
    setSuggestions([]);
    setErrors({});
    dispatch(clearScannedArticle());
    Vibration.vibrate(10);
  };

  // ==================== RENDER ====================
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* ===== HEADER ===== */}
      <LinearGradient
        colors={headerTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative orbs */}
        <View style={styles.headerDeco1} />
        <View style={styles.headerDeco2} />
        <View style={styles.headerDeco3} />
        <View style={styles.headerVisualLayer} pointerEvents="none">
          {headerTheme.glyphIcons.map((iconName, index) => (
            <View
              key={`${iconName}-${index}`}
              style={[
                styles.headerVisualGlyph,
                index === 0 && styles.headerVisualGlyphA,
                index === 1 && styles.headerVisualGlyphB,
                index === 2 && styles.headerVisualGlyphC,
                index === 3 && styles.headerVisualGlyphD,
                { backgroundColor: headerTheme.glyphTint },
              ]}
            >
              <Icon name={iconName} size={14} color="rgba(255,255,255,0.9)" />
            </View>
          ))}
        </View>

        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              Vibration.vibrate(10);
              navigation.goBack();
            }}
          >
            <Icon name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mouvement de stock</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          {['Article', 'Type', 'Détails'].map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <View key={step} style={styles.stepItem}>
                <View style={styles.stepDotRow}>
                  {done ? (
                    <LinearGradient colors={headerTheme.stepDoneGradient} style={styles.stepDot}>
                      <Icon name="check" size={10} color="#FFF" />
                    </LinearGradient>
                  ) : active ? (
                    <LinearGradient colors={headerTheme.stepActiveGradient} style={styles.stepDot}>
                      <View style={styles.stepDotActive} />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.stepDot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                  )}
                  {i < 2 && (
                    <View style={styles.stepLineTrack}>
                      <View style={[styles.stepLineFill, { width: done ? '100%' : '0%', backgroundColor: headerTheme.stepDoneGradient[0] }]} />
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  done && { color: headerTheme.doneTextColor },
                  active && { color: '#FFF', fontWeight: '700' },
                  !done && !active && { color: 'rgba(255,255,255,0.45)' },
                ]}>
                  {step}
                </Text>
              </View>
            );
          })}
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
          {/* ===== 1. SCAN ZONE ===== */}
          {!article && (
            <Animated.View entering={FadeInUp.delay(100).duration(400)}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleScanPress}
                style={styles.scanZone}
              >
                <LinearGradient
                  colors={[typeBgColor, 'rgba(99,102,241,0.02)']}
                  style={styles.scanGradient}
                >
                  <View style={styles.scanIconPill}>
                    <LinearGradient colors={typeGradient} style={styles.scanIconGrad}>
                      <View style={styles.scanIconInner}>
                        <Icon name="barcode-scan" size={32} color={typeColor} />
                      </View>
                    </LinearGradient>
                  </View>
                  <Text style={[styles.scanTitle, { color: typeColor }]}> 
                    {isScanning ? 'Scan en cours...' : 'Appuyez pour scanner'}
                  </Text>
                  <Text style={[styles.scanSubtitle, { color: colors.textSecondary }]}>
                    Ou recherchez manuellement ci-dessous
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* ===== SEPARATOR ===== */}
              <View style={styles.orRow}>
                <View style={[styles.orLine, { backgroundColor: colors.borderSubtle }]} />
                <Text style={[styles.orText, { color: colors.textMuted }]}>OU</Text>
                <View style={[styles.orLine, { backgroundColor: colors.borderSubtle }]} />
              </View>

              {/* ===== 2. SEARCH ===== */}
              <View style={styles.searchSection}>
                <View style={styles.searchLabelRow}>
                  <LinearGradient colors={typeGradient} style={styles.searchLabelAccent} />
                  <Text style={[styles.sectionLabel, { color: typeColor }]}>Code-barres / Référence</Text>
                </View>
                <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <Icon name="magnify" size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    placeholder="Entrez la référence..."
                    placeholderTextColor={colors.textMuted}
                    value={barcodeInput}
                    onChangeText={handleSearchChange}
                    onSubmitEditing={searchByBarcode}
                    returnKeyType="search"
                    autoCapitalize="none"
                  />
                  {barcodeInput.length > 0 && (
                    <TouchableOpacity onPress={() => { setBarcodeInput(''); setSuggestions([]); }}>
                      <Icon name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {searching && <ActivityIndicator size="small" color={typeColor} style={{ marginLeft: 6 }} />}
                </View>
                {errors.barcode ? (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.errorRow}>
                    <Icon name="alert-circle-outline" size={14} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>{errors.barcode}</Text>
                  </Animated.View>
                ) : null}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <Animated.View entering={FadeInDown.duration(250)} style={[styles.suggestionsBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    {suggestions.map((a, idx) => (
                      <TouchableOpacity
                        key={a.id}
                        style={[styles.suggestionItem, idx < suggestions.length - 1 && [styles.suggestionBorder, { borderBottomColor: colors.borderSubtle }]]}
                        onPress={() => handleSelectSuggestion(a)}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.suggestionIcon, { backgroundColor: colors.background }]}> 
                          {a.photoUrl ? (
                            <Image
                              source={{ uri: a.photoUrl }}
                              style={styles.suggestionImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Icon name="package-variant-closed" size={18} color={colors.textSecondary} />
                          )}
                        </View>
                        <View style={styles.suggestionInfo}>
                          <Text style={[styles.suggestionRef, { color: colors.textSecondary }]}>{a.reference}</Text>
                          <Text style={[styles.suggestionName, { color: colors.textPrimary }]} numberOfLines={1}>{a.nom}</Text>
                        </View>
                        <Text style={[styles.suggestionStock, { color: colors.textMuted }]}>
                          {a.quantiteActuelle ?? 0} {a.unite}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ===== 3. ARTICLE CARD ===== */}
          {article && (
            <Animated.View entering={ZoomIn.duration(350)} style={styles.articleSection}>
              <View style={styles.articleLabelRow}>
                <LinearGradient colors={typeGradient} style={styles.articleLabelDot} />
                <Text style={[styles.articleLabelText, { color: typeColor }]}>Article sélectionné</Text>
              </View>
              <View style={[styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <LinearGradient colors={typeGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.articleCardStrip} />
                <View style={styles.articleCardTop}>
                  <View style={styles.articleIconPill}>
                    <LinearGradient colors={typeGradient} style={styles.articleIconGrad}>
                      <View style={styles.articleIconInner}>
                        {article.photoUrl ? (
                          <Image
                            source={{ uri: article.photoUrl }}
                            style={styles.articleImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Icon name="package-variant-closed" size={18} color={typeColor} />
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                  <View style={styles.articleInfo}>
                    <Text style={[styles.articleRef, { color: colors.textSecondary }]}>{article.reference}</Text>
                    <Text style={[styles.articleName, { color: colors.textPrimary }]} numberOfLines={2}>{article.nom}</Text>
                  </View>
                  <TouchableOpacity style={[styles.removeBtn, { backgroundColor: colors.background }]} onPress={resetArticle}>
                    <Icon name="close" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.articleMeta}>
                  <View style={[
                    styles.stockBadge,
                    { backgroundColor: stockActuel < (article.stockMini ?? 0) ? colors.dangerBg : typeBgColor },
                  ]}>
                    <Text style={[
                      styles.stockBadgeText,
                      { color: stockActuel < (article.stockMini ?? 0) ? colors.danger : typeColor },
                    ]}>
                      Stock actuel : {stockActuel} {article.unite}
                    </Text>
                  </View>
                  <View style={styles.siteRow}>
                    <Icon name="map-marker-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.siteText, { color: colors.textMuted }]}>{siteActif?.nom ?? ''}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ===== SECTIONS VISIBLES UNIQUEMENT SI ARTICLE SÉLECTIONNÉ ===== */}
          {article && (
          <>
          {/* ===== 3.5 SITE SELECTOR (sous-sites) ===== */}
          {childSites.length > 0 && !selectedSubSiteId && (
            <Animated.View entering={FadeInUp.delay(50).duration(400)} style={{ marginBottom: 16 }}>
              <View style={styles.sectionLabelRow}>
                <LinearGradient colors={typeGradient} style={styles.sectionLabelAccent} />
                <Text style={[styles.sectionLabel, { color: typeColor }]}>Stock concerné <Text style={{ color: colors.danger }}>*</Text></Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                {childSites.map(site => {
                  const selected = String(site.id) === String(targetSiteId);
                  return (
                    <TouchableOpacity
                      key={String(site.id)}
                      onPress={() => { setLocalTargetSiteId(String(site.id)); Vibration.vibrate(10); }}
                      style={[
                        styles.siteCard,
                        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                        selected && styles.siteCardSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      {selected ? (
                        <LinearGradient colors={typeGradient} style={styles.siteCardIconPill}>
                          <View style={styles.siteCardIconInner}>
                            <Icon name="warehouse" size={16} color={typeColor} />
                          </View>
                        </LinearGradient>
                      ) : (
                        <Icon name="warehouse" size={18} color={colors.textMuted} />
                      )}
                      <Text style={[styles.siteCardText, { color: selected ? typeColor : colors.textSecondary }, selected && { fontWeight: '700' }]} numberOfLines={1}>
                        {site.nom}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ===== 4. TYPE SELECTOR ===== */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <View style={styles.typeSectionHeader}>
              <LinearGradient colors={typeGradient} style={styles.sectionLabelAccent} />
              <Text style={[styles.sectionLabel, { color: typeColor }]}>Type de mouvement</Text>
              <Text style={[styles.required, { color: colors.danger }]}>*</Text>
            </View>
            <View style={styles.typeGrid}>
              {(['entree', 'sortie', 'ajustement'] as MouvementType[]).map((t) => {
                const cfg = TYPE_CONFIG[t];
                const selected = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeCard,
                      { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                      selected && { borderColor: cfg.color, borderWidth: 2 },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setType(t);
                      Vibration.vibrate(12);
                    }}
                  >
                    {selected ? (
                      <LinearGradient colors={cfg.gradient} style={styles.typeIconPill}>
                        <View style={styles.typeIconInner}>
                          <Icon name={cfg.icon} size={22} color={cfg.color} />
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.typeIconPlain, { backgroundColor: colors.background }]}>
                        <Icon name={cfg.icon} size={22} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={[styles.typeLabel, { color: colors.textSecondary }, selected && { color: cfg.color, fontWeight: '700' }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* ===== 5. QUANTITY STEPPER ===== */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <View style={styles.typeSectionHeader}>
              <LinearGradient colors={typeGradient} style={styles.sectionLabelAccent} />
              <Text style={[styles.sectionLabel, { color: typeColor }]}>Quantité</Text>
              <Text style={[styles.required, { color: colors.danger }]}>*</Text>
            </View>
            <View style={[styles.stepperRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={handleDecrement}
                disabled={quantite <= 1}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={quantite <= 1 ? ['#E5E7EB', '#D1D5DB'] : ['#EF4444', '#DC2626']}
                  style={styles.qtyBtnGrad}
                >
                  <Icon name="minus" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TextInput
                style={[styles.qtyInput, { color: colors.textPrimary }]}
                value={quantite > 0 ? quantite.toString() : ''}
                onChangeText={handleQtyTextChange}
                keyboardType="numeric"
                maxLength={5}
                selectTextOnFocus
              />

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={handleIncrement}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.qtyBtnGrad}
                >
                  <Icon name="plus" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Validation erreur quantité */}
            {type === 'sortie' && quantite > stockActuel && article && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.errorRow}>
                <Icon name="alert-circle-outline" size={14} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  Stock insuffisant (disponible : {stockActuel})
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* ===== 6. STOCK PREVIEW ===== */}
          {article && nouveauStock !== null && (
            <Animated.View entering={FadeInUp.delay(250).duration(400)}>
              <View style={styles.sectionLabelRow}>
                <LinearGradient colors={typeGradient} style={styles.sectionLabelAccent} />
                <Text style={[styles.sectionLabel, { color: typeColor }]}>Aperçu du stock</Text>
              </View>
              <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <LinearGradient colors={[typeColor, typeColor + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.previewCardStrip} />
                <View style={styles.previewCol}>
                  <Text style={[styles.previewNumber, { color: colors.textPrimary }]}>{stockActuel}</Text>
                  <Text style={[styles.previewCaption, { color: colors.textMuted }]}>Stock actuel</Text>
                </View>
                <View style={styles.previewArrow}>
                  <LinearGradient colors={[typeColor + '20', typeColor + '08']} style={styles.previewArrowBg}>
                    <Icon name="arrow-right" size={20} color={typeColor} />
                  </LinearGradient>
                </View>
                <View style={styles.previewCol}>
                  <Text style={[styles.previewNumber, { color: typeColor }]}>{nouveauStock}</Text>
                  <Text style={[styles.previewCaption, { color: colors.textMuted }]}>Nouveau stock</Text>
                </View>
              </View>

              {/* Warning seuil mini */}
              {nouveauStock < (article.stockMini ?? 0) && nouveauStock >= 0 && (
                <Animated.View entering={FadeIn.duration(200)} style={[styles.warningBanner, { backgroundColor: colors.warningBg }]}>
                  <Icon name="alert-outline" size={16} color={colors.warning} />
                  <Text style={[styles.warningText, { color: colors.warning }]}>
                    Le stock sera en dessous du minimum ({article.stockMini})
                  </Text>
                </Animated.View>
              )}
              {nouveauStock < 0 && (
                <Animated.View entering={FadeIn.duration(200)} style={[styles.dangerBanner, { backgroundColor: colors.dangerBg }]}>
                  <Icon name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={[styles.dangerText, { color: colors.danger }]}>
                    Stock négatif impossible
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* ===== 7. OPTIONAL FIELDS ===== */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            {/* Commentaire */}
            <View style={[styles.sectionLabelRow, { marginTop: 24 }]}>
              <LinearGradient colors={['#64748B', '#475569']} style={styles.sectionLabelAccent} />
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Commentaire (optionnel)</Text>
            </View>
            <View style={[styles.textareaBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <TextInput
                style={[styles.textarea, { color: colors.textPrimary }]}
                placeholder="Motif, précision..."
                placeholderTextColor={colors.textMuted}
                value={commentaire}
                onChangeText={setCommentaire}
                multiline
                maxLength={200}
              />
              <Text style={[styles.charCount, { color: colors.textMuted }]}>{commentaire.length}/200</Text>
            </View>

          </Animated.View>

          {/* ===== 8. SUBMIT BUTTON ===== */}
          <Animated.View 
            entering={FadeInUp.delay(400).duration(400)}
            style={[animatedButtonStyle, { marginTop: 32 }]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                buttonScale.value = withSequence(
                  withTiming(0.95, { duration: 100 }),
                  withTiming(1, { duration: 100 })
                );
                handleSubmit();
              }}
              disabled={!isFormValid || isSubmitting || showSuccess}
              style={[styles.submitTouchable, (!isFormValid || isSubmitting) && { opacity: 0.5 }, { marginTop: 0, shadowColor: colors.primary }]}
            >
              <LinearGradient
                colors={showSuccess ? gradients.success : (TYPE_CONFIG[type]?.gradient ?? gradients.primary)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <Animated.View entering={FadeIn} layout={LinearTransition}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={styles.submitText}>Validation en cours...</Text>
                    </View>
                  </Animated.View>
                ) : showSuccess ? (
                  <Animated.View 
                    entering={ZoomIn.duration(400).springify()} 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  >
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 20 }}>
                      <Icon name="check" size={24} color="#FFF" />
                    </View>
                    <Text style={[styles.submitText, { fontWeight: '800' }]}>Mouvement validé !</Text>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeIn} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Icon name="check-circle-outline" size={24} color="#FFF" />
                    <Text style={styles.submitText}>Valider le mouvement</Text>
                  </Animated.View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== CAMERA SCAN MODAL ===== */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraContainer}>
          {device && hasPermission ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={showCamera}
              codeScanner={codeScanner}
              photo={false}
              video={false}
              audio={false}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
          )}

          {/* Overlay */}
          <View style={styles.cameraOverlay} pointerEvents="box-none">
            {/* Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseBtn}
                onPress={() => { Vibration.vibrate(10); setShowCamera(false); }}
              >
                <Icon name="close" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scanner le code-barres</Text>
              <View style={{ width: 42 }} />
            </View>

            {/* Scan frame */}
            <View style={styles.cameraFrameWrap}>
              <View style={styles.cameraFrame}>
                <View style={[styles.cameraCorner, styles.camCTL, { borderColor: colors.primary }]} />
                <View style={[styles.cameraCorner, styles.camCTR, { borderColor: colors.primary }]} />
                <View style={[styles.cameraCorner, styles.camCBL, { borderColor: colors.primary }]} />
                <View style={[styles.cameraCorner, styles.camCBR, { borderColor: colors.primary }]} />
              </View>
            </View>

            {/* Hint */}
            <Text style={styles.cameraHint}>
              Positionnez le code-barres dans le cadre
            </Text>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // ===== HEADER =====
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 44) + 8 : 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerDeco1: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerDeco2: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerDeco3: {
    position: 'absolute',
    top: 20,
    left: '40%' as any,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerVisualLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerVisualGlyph: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerVisualGlyphA: {
    top: 20,
    right: 76,
    transform: [{ rotate: '-8deg' }],
  },
  headerVisualGlyphB: {
    top: 86,
    right: 20,
    transform: [{ rotate: '10deg' }],
  },
  headerVisualGlyphC: {
    top: 108,
    left: 34,
    transform: [{ rotate: '-10deg' }],
  },
  headerVisualGlyphD: {
    top: 30,
    left: '42%' as any,
    transform: [{ rotate: '8deg' }],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ===== STEPPER =====
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  stepLineTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    marginLeft: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepLineFill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: '#34D399',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    color: 'rgba(255,255,255,0.5)',
  },

  // ===== SCAN ZONE =====
  scanZone: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,122,57,0.2)',
  },
  scanGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  scanIconPill: {
    marginBottom: 14,
  },
  scanIconGrad: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  scanIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scanSubtitle: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '400',
  },

  // ===== OR =====
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 14,
  },

  // ===== SEARCH =====
  searchSection: {
    marginBottom: 8,
  },
  searchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchLabelAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionLabelAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  searchBoxFocused: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ===== SUGGESTIONS =====
  suggestionsBox: {
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  suggestionImage: {
    width: '100%',
    height: '100%',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionRef: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionStock: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ===== ARTICLE CARD =====
  articleSection: {
    marginTop: 20,
    marginBottom: 8,
  },
  articleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  articleLabelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  articleLabelText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  articleCard: {
    borderRadius: 18,
    padding: 16,
    paddingLeft: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  articleCardStrip: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  articleCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  articleIconPill: {
    marginRight: 12,
  },
  articleIconGrad: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  articleIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  articleInfo: {
    flex: 1,
  },
  articleRef: {
    fontSize: 12,
    fontWeight: '600',
  },
  articleName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleMeta: {
    marginTop: 12,
    gap: 8,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  siteText: {
    fontSize: 12,
  },

  // ===== TYPE SELECTOR =====
  typeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
    gap: 8,
  },
  required: {
    fontSize: 14,
    fontWeight: '700',
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  typeIconPill: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    marginBottom: 8,
  },
  typeIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconPlain: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ===== QUANTITY =====
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    height: 64,
    paddingHorizontal: 8,
    gap: 4,
  },
  qtyBtn: {},
  qtyBtnGrad: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    padding: 0,
    letterSpacing: -0.5,
  },

  // ===== STOCK PREVIEW =====
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    paddingLeft: 24,
    borderWidth: 1,
    gap: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  previewCardStrip: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  previewCol: {
    alignItems: 'center',
    flex: 1,
  },
  previewNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  previewCaption: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  previewArrow: {},
  previewArrowBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  dangerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
    gap: 8,
  },
  dangerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // ===== OPTIONAL FIELDS =====
  textareaBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    minHeight: 88,
  },
  textarea: {
    fontSize: 14,
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 50,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },


  // ===== SUBMIT =====
  submitTouchable: {
    marginTop: 32,
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 18,
    gap: 10,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // ===== SITE SELECTOR CARDS =====
  siteCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  siteCardSelected: {
    borderColor: '#007A39',
    backgroundColor: 'rgba(99,102,241,0.04)',
  },
  siteCardIconPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  siteCardIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteCardText: {
    fontWeight: '500',
    fontSize: 12,
    textAlign: 'center',
  },

  // ===== SUCCESS OVERLAY =====
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successDetail: {
    fontSize: 15,
    fontWeight: '500',
  },
  successStock: {
    fontSize: 14,
    marginTop: 4,
  },

  // ===== CAMERA MODAL =====
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cameraCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  cameraFrameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  cameraFrame: {
    width: SCAN_FRAME,
    height: SCAN_FRAME,
  },
  cameraCorner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderWidth: 4,
  },
  camCTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  camCTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  camCBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  camCBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  cameraHint: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: SCREEN_H * 0.15,
  },
});

export default MouvementFormScreen;
