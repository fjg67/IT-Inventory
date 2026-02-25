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

// ==================== MAIN SCREEN ====================
export const MouvementFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, gradients, isDark } = useTheme();

  const siteActif = useAppSelector(state => state.site.siteActif);
  const technicien = useAppSelector(state => state.auth.currentTechnicien);
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

  // ===== Load article =====
  const loadArticle = useCallback(async (articleId: number) => {
    if (!siteActif) return;
    const result = await articleRepository.findById(articleId, siteActif.id);
    if (result) setArticle(result);
  }, [siteActif]);

  useEffect(() => {
    if (initialArticleId && siteActif) {
      loadArticle(initialArticleId).catch(() => {});
    }
  }, [initialArticleId, siteActif, loadArticle]);

  useEffect(() => {
    if (scannedArticle) setArticle(scannedArticle);
  }, [scannedArticle]);

  // ===== Search =====
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!siteActif || query.length < 2) {
          setSuggestions([]);
          setSearching(false);
          return;
        }
        setSearching(true);
        try {
          const result = await articleRepository.search(siteActif.id, { searchQuery: query, stockFaible: false }, 0, 8);
          setSuggestions(result.data);
        } catch {
          setSuggestions([]);
        } finally {
          setSearching(false);
        }
      }, 350),
    [siteActif],
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
    if (!barcodeInput.trim() || !siteActif) return;
    const result = await articleRepository.findByReference(barcodeInput.trim(), siteActif.id);
    if (result) {
      setArticle(result);
      setBarcodeInput('');
      setSuggestions([]);
      setErrors({});
    } else {
      setErrors({ barcode: 'Article non trouvé pour cette référence' });
    }
  };

  // ===== Camera code scanner =====
  const handleScannedBarcode = useCallback(async (barcode: string) => {
    if (!siteActif) {
      console.warn('[MouvementForm] Pas de site actif, recherche impossible');
      return;
    }
    console.log('[MouvementForm] Recherche article pour:', barcode);
    setBarcodeInput(barcode);
    try {
      const result = await articleRepository.findByReference(barcode, siteActif.id);
      if (result) {
        console.log('[MouvementForm] Article trouvé:', result.nom);
        setArticle(result);
        setBarcodeInput('');
        setSuggestions([]);
        setErrors({});
      } else {
        // Essayer une recherche plus large
        const searchResult = await articleRepository.search(siteActif.id, { searchQuery: barcode, stockFaible: false }, 0, 5);
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
    
    if (!siteActif) {
      Alert.alert('Site manquant', 'Aucun site sélectionné. Veuillez sélectionner un site.');
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
        siteId: siteActif.id,
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
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.background }]}
            onPress={() => {
              Vibration.vibrate(10);
              navigation.goBack();
            }}
          >
            <Icon name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mouvement de stock</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          {['Article', 'Type', 'Détails'].map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const dotBg = done ? colors.success : active ? colors.primary : colors.borderSubtle;
            return (
              <View key={step} style={styles.stepItem}>
                <View style={styles.stepDotRow}>
                  <View style={[styles.stepDot, { backgroundColor: dotBg }]}>
                    {done && <Icon name="check" size={10} color="#FFF" />}
                  </View>
                  {i < 2 && (
                    <View style={[styles.stepLineTrack, { backgroundColor: colors.borderSubtle }]}>
                      <View style={[styles.stepLineFill, { backgroundColor: colors.success, width: done ? '100%' : '0%' }]} />
                    </View>
                  )}
                </View>
                <Text style={[styles.stepLabel, { color: done ? colors.success : active ? colors.primary : colors.textMuted }]}>
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

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
                style={[styles.scanZone, { borderColor: colors.primaryGlow }]}
              >
                <LinearGradient
                  colors={[colors.primaryGlow, colors.primaryGlowStrong]}
                  style={styles.scanGradient}
                >
                  <View style={[styles.scanIconCircle, { backgroundColor: colors.primaryGlow }]}>
                    <Icon name="barcode-scan" size={40} color={colors.primary} />
                  </View>
                  <Text style={[styles.scanTitle, { color: colors.primary }]}>
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
                <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Code-barres / Référence</Text>
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
                  {searching && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
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
                          <Icon name="package-variant-closed" size={18} color={colors.textSecondary} />
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
                <Icon name="check-circle" size={18} color={colors.success} />
                <Text style={[styles.articleLabelText, { color: colors.success }]}>Article sélectionné</Text>
              </View>
              <View style={[styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.success, shadowColor: colors.success }]}>
                <View style={styles.articleCardTop}>
                  <View style={[styles.articleIconCircle, { backgroundColor: colors.primaryGlow }]}>
                    <Icon name="package-variant-closed" size={22} color={colors.primary} />
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
                    { backgroundColor: stockActuel < (article.stockMini ?? 0) ? colors.dangerBg : colors.primaryGlow },
                  ]}>
                    <Text style={[
                      styles.stockBadgeText,
                      { color: stockActuel < (article.stockMini ?? 0) ? colors.danger : colors.primary },
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
          {/* ===== 4. TYPE SELECTOR ===== */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <View style={styles.typeSectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Type de mouvement</Text>
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
                      selected && { backgroundColor: cfg.bgColor, borderColor: cfg.color },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setType(t);
                      Vibration.vibrate(12);
                    }}
                  >
                    <Icon
                      name={cfg.icon}
                      size={30}
                      color={selected ? cfg.color : colors.textMuted}
                    />
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
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Quantité</Text>
              <Text style={[styles.required, { color: colors.danger }]}>*</Text>
            </View>
            <View style={[styles.stepperRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: colors.dangerBg }]}
                onPress={handleDecrement}
                disabled={quantite <= 1}
                activeOpacity={0.7}
              >
                <Icon name="minus" size={22} color={quantite <= 1 ? colors.borderSubtle : colors.danger} />
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
                style={[styles.qtyBtn, { backgroundColor: colors.successBg }]}
                onPress={handleIncrement}
                activeOpacity={0.7}
              >
                <Icon name="plus" size={22} color={colors.success} />
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
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Aperçu du stock</Text>
              <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: typeColor + '30' }]}>
                <View style={styles.previewCol}>
                  <Text style={[styles.previewNumber, { color: colors.textPrimary }]}>{stockActuel}</Text>
                  <Text style={[styles.previewCaption, { color: colors.textMuted }]}>Stock actuel</Text>
                </View>
                <Icon name="arrow-right" size={22} color={colors.textMuted} />
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
            <Text style={[styles.sectionLabel, { marginTop: 24, color: colors.textPrimary }]}>Commentaire (optionnel)</Text>
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
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLineTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    marginLeft: 4,
  },
  stepLineFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  // ===== SCAN ZONE =====
  scanZone: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  scanGradient: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  scanIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanSubtitle: {
    fontSize: 13,
    marginTop: 6,
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
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
    gap: 6,
    marginBottom: 10,
  },
  articleLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  articleCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  articleCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  articleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    gap: 4,
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
    height: 92,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },

  // ===== QUANTITY =====
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    height: 60,
    paddingHorizontal: 8,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    padding: 0,
  },

  // ===== STOCK PREVIEW =====
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    gap: 20,
    marginTop: 4,
  },
  previewCol: {
    alignItems: 'center',
  },
  previewNumber: {
    fontSize: 26,
    fontWeight: '700',
  },
  previewCaption: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 88,
  },
  textarea: {
    fontSize: 14,
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 50,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },


  // ===== SUBMIT =====
  submitTouchable: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 16,
    gap: 10,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
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
