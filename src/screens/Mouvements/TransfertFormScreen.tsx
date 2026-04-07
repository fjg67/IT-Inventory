// ============================================
// TRANSFERT FORM SCREEN - IT-Inventory Application
// Transfert inter-sites — Premium Design
// ============================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Vibration,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@/store';
import { showAlert } from '@/store/slices/uiSlice';
import { articleRepository, stockRepository, mouvementRepository } from '@/database';
import { Loading } from '@/components';
import { validateTransfertForm } from '@/utils';
import { spacing, typography, borderRadius } from '@/constants/theme';
import { useTheme } from '@/theme';
import { Article, TransfertForm, StockSite } from '@/types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';
import { useResponsive } from '@/utils/responsive';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import debounce from 'lodash/debounce';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { height: SCREEN_H } = Dimensions.get('window');
const SCAN_FRAME = 240;
const BARCODE_TYPES = [
  'ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93',
  'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec',
] as const;

export const TransfertFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, isDark } = useTheme();
  
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const technicien = useAppSelector((state) => state.auth.currentTechnicien);
  const sitesDisponibles = useAppSelector((state) => state.site.sitesDisponibles);
  const childSites = useAppSelector((state) => state.site.childSites);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  
  // Utiliser les sous-sites si disponibles, sinon les sites normaux
  const transferSites = childSites.length > 0 ? childSites : sitesDisponibles;
  
  const initialArticleId = route.params?.articleId;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [stockDepart, setStockDepart] = useState<StockSite | null>(null);
  const [siteDepartId, setSiteDepartId] = useState<number | null>(siteActif?.id ?? null);
  const [siteArriveeId, setSiteArriveeId] = useState<number | null>(null);
  const [quantite, setQuantite] = useState('1');
  const [commentaire, setCommentaire] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);

  // Camera / Scanner
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back') ?? devices[0];
  const [showCamera, setShowCamera] = useState(false);
  const showCameraRef = useRef(false);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);
  const handleScannedBarcodeRef = useRef<(barcode: string) => void>(() => {});

  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const loadArticle = async (articleId: number) => {
    if (!siteDepartId) return;
    setIsLoading(true);
    try {
      const result = await articleRepository.findById(articleId, siteDepartId);
      setArticle(result);
    } catch (error) {
      console.error('Erreur chargement article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialArticleId && siteDepartId) {
      loadArticle(initialArticleId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArticleId, siteDepartId]);

  useEffect(() => {
    if (article && siteDepartId) {
      loadStockDepart(article.id, siteDepartId).catch(() => {});
    }
  }, [article, siteDepartId]);

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
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleSelectArticle = (a: Article) => {
    setArticle(a);
    setSearchQuery('');
    setSuggestions([]);
    setErrors({});
    Vibration.vibrate(10);
  };

  const resetArticle = () => {
    setArticle(null);
    setStockDepart(null);
    setSearchQuery('');
    setSuggestions([]);
  };

  // ===== Camera barcode scanner =====
  const handleScannedBarcode = useCallback(async (barcode: string) => {
    if (!effectiveSiteId) return;
    setSearchQuery(barcode);
    try {
      const result = await articleRepository.findByReference(barcode, effectiveSiteId);
      if (result) {
        setArticle(result);
        setSearchQuery('');
        setSuggestions([]);
        setErrors({});
      } else {
        const searchResult = await articleRepository.search(effectiveSiteId, { searchQuery: barcode, stockFaible: false }, 0, 5);
        if (searchResult.data.length === 1) {
          setArticle(searchResult.data[0]);
          setSearchQuery('');
          setSuggestions([]);
          setErrors({});
        } else if (searchResult.data.length > 1) {
          setSuggestions(searchResult.data);
          setErrors({});
        } else {
          setErrors({ article: `Article non trouvé : ${barcode}` });
        }
      }
    } catch {
      setErrors({ article: 'Erreur lors de la recherche' });
    }
  }, [effectiveSiteId]);

  useEffect(() => {
    showCameraRef.current = showCamera;
  }, [showCamera]);

  useEffect(() => {
    handleScannedBarcodeRef.current = handleScannedBarcode;
  }, [handleScannedBarcode]);

  const onCodeScanned = useCallback(
    (codes: { value?: string }[]) => {
      if (!showCameraRef.current || codes.length === 0 || !codes[0]?.value) return;
      const value = codes[0].value.trim();
      if (!value) return;
      const now = Date.now();
      if (lastScannedRef.current?.value === value && now - lastScannedRef.current.at < 2500) return;
      lastScannedRef.current = { value, at: now };
      Vibration.vibrate([0, 30, 60, 30]);
      setShowCamera(false);
      handleScannedBarcodeRef.current(value);
    },
    [],
  );

  const codeScanner = useCodeScanner({
    codeTypes: [...BARCODE_TYPES],
    onCodeScanned,
  });

  const handleScanPress = async () => {
    Vibration.vibrate(20);
    setErrors({});
    if (!device) {
      Alert.alert('Caméra indisponible', 'Aucune caméra n\'a été détectée sur cet appareil.');
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

  // Reset form when screen gets focus (e.g. navigating back from dashboard)
  useFocusEffect(
    useCallback(() => {
      if (!initialArticleId) {
        setArticle(null);
        setStockDepart(null);
        setSiteDepartId(siteActif?.id ?? null);
        setSiteArriveeId(null);
        setQuantite('1');
        setCommentaire('');
        setErrors({});
        setSearchQuery('');
        setSuggestions([]);
      }
    }, [initialArticleId, siteActif?.id])
  );

  const loadStockDepart = async (articleId: number, siteId: number) => {
    try {
      const stock = await stockRepository.findByArticleAndSite(articleId, siteId);
      setStockDepart(stock);
    } catch (error) {
      console.error('Erreur chargement stock:', error);
    }
  };

  const validate = (): boolean => {
    const result = validateTransfertForm(
      {
        articleId: article?.id,
        siteDepartId: siteDepartId ?? undefined,
        siteArriveeId: siteArriveeId ?? undefined,
        quantite: parseInt(quantite, 10) || 0,
      },
      stockDepart?.quantiteActuelle ?? 0,
    );
    setErrors(result.errors);
    return result.isValid;
  };

  const handleSubmit = async () => {
    if (!validate() || !article || !siteDepartId || !siteArriveeId || !technicien) return;

    setIsSubmitting(true);
    Vibration.vibrate(15);

    try {
      const data: TransfertForm = {
        articleId: article.id,
        siteDepartId,
        siteArriveeId,
        quantite: parseInt(quantite, 10),
        commentaire: commentaire.trim() || undefined,
      };

      await mouvementRepository.createTransfert(data, technicien.id);

      // Reset all fields
      setArticle(null);
      setStockDepart(null);
      setSiteDepartId(siteActif?.id ?? null);
      setSiteArriveeId(null);
      setQuantite('1');
      setCommentaire('');
      setErrors({});
      setSearchQuery('');
      setSuggestions([]);

      dispatch(showAlert({
        type: 'success',
        message: SUCCESS_MESSAGES.TRANSFERT_CREATED,
        title: 'Transfert effectué',
      }));

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      dispatch(showAlert({
        type: 'error',
        message,
        title: 'Erreur',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSiteName = (siteId: number | null): string => {
    if (!siteId) return 'Sélectionnez un site';
    const site = transferSites.find((s) => s.id === siteId) ?? sitesDisponibles.find((s) => s.id === siteId);
    return site?.nom ?? 'Site inconnu';
  };

  const sitesArrivee = transferSites.filter((s) => s.id !== siteDepartId);
  const canSubmit = !!article && !!siteDepartId && !!siteArriveeId && !isSubmitting;
  const stockQty = stockDepart?.quantiteActuelle ?? 0;
  const isLowStock = article ? stockQty < article.stockMini : false;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Loading message="Chargement..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ===== HEADER ===== */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => navigation.navigate('MouvementsList')} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient
            colors={['#3B82F6', '#007A39']}
            style={styles.headerIconBg}
          >
            <Icon name="swap-horizontal" size={18} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transfert inter-sites</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.content, isTablet && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== ARTICLE SEARCH & CARD ===== */}
          {article ? (
            <Animated.View entering={ZoomIn.duration(350)}>
              <View style={[styles.articleCard, {
                backgroundColor: colors.surface,
                borderColor: colors.success,
                shadowColor: colors.success,
              }]}>
                <View style={styles.articleCardTop}>
                  <View style={[styles.articleIconCircle, { backgroundColor: colors.primaryGlow }]}>
                    <Icon name="package-variant-closed" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.articleInfo}>
                    <Text style={[styles.articleRef, { color: colors.textMuted }]}>{article.reference}</Text>
                    <Text style={[styles.articleName, { color: colors.textPrimary }]} numberOfLines={2}>{article.nom}</Text>
                  </View>
                  <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.background }]} onPress={resetArticle} activeOpacity={0.7}>
                    <Icon name="close" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.articleMeta}>
                  <View style={[styles.stockBadge, { backgroundColor: isLowStock ? colors.dangerBg : colors.primaryGlow }]}>
                    <Icon name="cube-outline" size={14} color={isLowStock ? colors.danger : colors.primary} />
                    <Text style={[styles.stockBadgeText, { color: isLowStock ? colors.danger : colors.primary }]}>
                      Stock : {stockQty} {article.unite}
                    </Text>
                  </View>
                  <View style={styles.siteTag}>
                    <Icon name="map-marker-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.siteTagText, { color: colors.textMuted }]}>{getSiteName(siteDepartId)}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400)}>
              {/* Search bar */}
              <View style={styles.searchSection}>
                <View style={styles.siteLabelRow}>
                  <View style={[styles.siteLabelIcon, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#E8F5E9' }]}>
                    <Icon name="magnify" size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.siteLabel, { color: colors.textPrimary }]}>Rechercher un article</Text>
                </View>
                <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <Icon name="magnify" size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    placeholder="Nom, référence ou code-barres..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    autoCapitalize="none"
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); }}>
                      <Icon name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {searching && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
                </View>

                {/* Scan barcode button */}
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={handleScanPress}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#007A39']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.scanButtonGradient}
                  >
                    <Icon name="barcode-scan" size={20} color="#FFF" />
                    <Text style={styles.scanButtonText}>Scanner un code-barres</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {errors.article && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.errorRow}>
                    <Icon name="alert-circle" size={14} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>{errors.article}</Text>
                  </Animated.View>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <Animated.View entering={FadeInDown.duration(250)} style={[styles.suggestionsBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    {suggestions.map((a, idx) => (
                      <TouchableOpacity
                        key={a.id}
                        style={[
                          styles.suggestionItem,
                          idx < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
                        ]}
                        onPress={() => handleSelectArticle(a)}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.suggestionIcon, { backgroundColor: colors.background }]}>
                          <Icon name="package-variant-closed" size={18} color={colors.textSecondary} />
                        </View>
                        <View style={styles.suggestionInfo}>
                          <Text style={[styles.suggestionRef, { color: colors.textMuted }]}>{a.reference}</Text>
                          <Text style={[styles.suggestionName, { color: colors.textPrimary }]} numberOfLines={1}>{a.nom}</Text>
                        </View>
                        <Text style={[styles.suggestionStock, { color: colors.textMuted }]}>
                          {a.quantiteActuelle ?? 0} {a.unite}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                )}

                {/* Empty state hint */}
                {suggestions.length === 0 && !searchQuery && (
                  <View style={styles.searchHint}>
                    <Icon name="information-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.searchHintText, { color: colors.textMuted }]}>
                      Tapez au moins 2 caractères pour rechercher
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ===== TRANSFER DIRECTION ===== */}
          <Animated.View entering={ZoomIn.delay(150).duration(300)} style={styles.arrowSection}>
            <View style={styles.arrowLine}>
              <View style={[styles.arrowDot, { backgroundColor: '#3B82F6' }]} />
              <View style={[styles.arrowDash, { backgroundColor: colors.borderMedium }]} />
              <LinearGradient
                colors={['#3B82F6', '#007A39']}
                style={styles.arrowCircle}
              >
                <Icon name="arrow-down" size={22} color="#FFF" />
              </LinearGradient>
              <View style={[styles.arrowDash, { backgroundColor: colors.borderMedium }]} />
              <View style={[styles.arrowDot, { backgroundColor: '#007A39' }]} />
            </View>
          </Animated.View>

          {/* ===== SITE DÉPART ===== */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <View style={styles.siteSection}>
              <View style={styles.siteLabelRow}>
                <View style={[styles.siteLabelIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                  <Icon name="login" size={16} color="#3B82F6" />
                </View>
                <Text style={[styles.siteLabel, { color: colors.textPrimary }]}>Site de départ</Text>
              </View>
              <View style={styles.siteChipsGrid}>
                {transferSites.map((site) => {
                  const selected = site.id === siteDepartId;
                  return (
                    <TouchableOpacity
                      key={String(site.id)}
                      onPress={() => { setSiteDepartId(site.id as number); Vibration.vibrate(10); }}
                      style={[
                        styles.siteChip,
                        {
                          backgroundColor: selected ? (isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF') : colors.surface,
                          borderColor: selected ? '#3B82F6' : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.siteChipDot, { backgroundColor: selected ? '#3B82F6' : colors.borderMedium }]} />
                      <Text style={[
                        styles.siteChipText,
                        { color: selected ? '#3B82F6' : colors.textSecondary, fontWeight: selected ? '700' : '500' },
                      ]} numberOfLines={1}>
                        {site.nom}
                      </Text>
                      {selected && <Icon name="check-circle" size={16} color="#3B82F6" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.siteDepartId && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorRow}>
                  <Icon name="alert-circle" size={14} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{errors.siteDepartId}</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* ===== SITE DESTINATION ===== */}
          <Animated.View entering={FadeInUp.delay(150).duration(400)}>
            <View style={styles.siteSection}>
              <View style={styles.siteLabelRow}>
                <View style={[styles.siteLabelIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <Icon name="logout" size={16} color="#007A39" />
                </View>
                <Text style={[styles.siteLabel, { color: colors.textPrimary }]}>Site de destination</Text>
              </View>
              <View style={styles.siteChipsGrid}>
                {sitesArrivee.map((site) => {
                  const selected = site.id === siteArriveeId;
                  return (
                    <TouchableOpacity
                      key={String(site.id)}
                      onPress={() => { setSiteArriveeId(site.id as number); Vibration.vibrate(10); }}
                      style={[
                        styles.siteChip,
                        {
                          backgroundColor: selected ? (isDark ? 'rgba(0,122,57,0.15)' : '#E8F5E9') : colors.surface,
                          borderColor: selected ? '#007A39' : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.siteChipDot, { backgroundColor: selected ? '#007A39' : colors.borderMedium }]} />
                      <Text style={[
                        styles.siteChipText,
                        { color: selected ? '#007A39' : colors.textSecondary, fontWeight: selected ? '700' : '500' },
                      ]} numberOfLines={1}>
                        {site.nom}
                      </Text>
                      {selected && <Icon name="check-circle" size={16} color="#007A39" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.siteArriveeId && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorRow}>
                  <Icon name="alert-circle" size={14} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{errors.siteArriveeId}</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* ===== QUANTITÉ ===== */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <View style={styles.siteSection}>
              <View style={styles.siteLabelRow}>
                <View style={[styles.siteLabelIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <Icon name="counter" size={16} color="#10B981" />
                </View>
                <Text style={[styles.siteLabel, { color: colors.textPrimary }]}>Quantité à transférer</Text>
              </View>
              <View style={[styles.quantityRow]}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  onPress={() => {
                    const v = Math.max(1, parseInt(quantite, 10) - 1 || 1);
                    setQuantite(String(v));
                    Vibration.vibrate(8);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="minus" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={[styles.qtyInputWrap, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <TextInput
                    style={[styles.qtyInput, { color: colors.textPrimary }]}
                    value={quantite}
                    onChangeText={(t) => setQuantite(t.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    textAlign="center"
                    maxLength={5}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  onPress={() => {
                    const v = (parseInt(quantite, 10) || 0) + 1;
                    setQuantite(String(v));
                    Vibration.vibrate(8);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="plus" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.quantite && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorRow}>
                  <Icon name="alert-circle" size={14} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{errors.quantite}</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* ===== COMMENTAIRE ===== */}
          <Animated.View entering={FadeInUp.delay(250).duration(400)}>
            <View style={styles.siteSection}>
              <View style={styles.siteLabelRow}>
                <View style={[styles.siteLabelIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                  <Icon name="text-box-outline" size={16} color="#F59E0B" />
                </View>
                <Text style={[styles.siteLabel, { color: colors.textPrimary }]}>Commentaire</Text>
                <Text style={[styles.optionalTag, { color: colors.textMuted }]}>optionnel</Text>
              </View>
              <View style={[styles.commentWrap, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <TextInput
                  style={[styles.commentInput, { color: colors.textPrimary }]}
                  value={commentaire}
                  onChangeText={setCommentaire}
                  placeholder="Motif du transfert..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </Animated.View>

          {/* ===== RÉSUMÉ ===== */}
          {article && siteDepartId && siteArriveeId && (
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(0,122,57,0.08)' : '#E8F5E9', borderColor: isDark ? 'rgba(0,122,57,0.2)' : '#B2DFDB' }]}>
                <View style={styles.summaryHeader}>
                  <Icon name="clipboard-check-outline" size={18} color={colors.primary} />
                  <Text style={[styles.summaryTitle, { color: colors.primary }]}>Résumé du transfert</Text>
                </View>
                <View style={styles.summaryBody}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Article</Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]} numberOfLines={1}>{article.nom}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.borderSubtle }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>De</Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{getSiteName(siteDepartId)}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.borderSubtle }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Vers</Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{getSiteName(siteArriveeId)}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.borderSubtle }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Quantité</Text>
                    <View style={[styles.summaryQtyBadge, { backgroundColor: colors.primaryGlow }]}>
                      <Text style={[styles.summaryQtyText, { color: colors.primary }]}>
                        {quantite} {article.unite}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ===== BOUTON ===== */}
          <Animated.View entering={FadeInUp.delay(350).duration(400)} style={[animatedButtonStyle, { marginTop: 8, marginBottom: 32 }]}>
            <TouchableOpacity
              onPress={() => {
                buttonScale.value = withSpring(0.95, {}, () => {
                  buttonScale.value = withSpring(1);
                });
                handleSubmit();
              }}
              disabled={!canSubmit}
              activeOpacity={0.8}
              style={{ opacity: canSubmit ? 1 : 0.45 }}
            >
              <LinearGradient
                colors={canSubmit ? ['#3B82F6', '#007A39'] : [colors.borderMedium, colors.borderMedium]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name="swap-horizontal" size={20} color="#FFF" />
                    <Text style={styles.submitBtnText}>Confirmer le transfert</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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
                <View style={[styles.cameraCorner, styles.camCTL, { borderColor: '#3B82F6' }]} />
                <View style={[styles.cameraCorner, styles.camCTR, { borderColor: '#3B82F6' }]} />
                <View style={[styles.cameraCorner, styles.camCBL, { borderColor: '#3B82F6' }]} />
                <View style={[styles.cameraCorner, styles.camCBR, { borderColor: '#3B82F6' }]} />
              </View>
            </View>

            {/* Hint */}
            <Text style={styles.cameraHint}>
              Positionnez le code-barres dans le cadre
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Content
  content: {
    padding: 16,
  },
  // Article card
  articleCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  articleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  articleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleInfo: {
    flex: 1,
  },
  articleRef: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  articleName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  siteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  siteTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // No article → Search
  searchSection: {
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  suggestionsBox: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
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
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  suggestionStock: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingLeft: 4,
  },
  searchHintText: {
    fontSize: 12,
  },
  resetBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Scan button
  scanButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Camera modal
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
  // Arrow
  arrowSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  arrowLine: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  arrowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  arrowDash: {
    width: 2,
    height: 14,
  },
  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  // Site sections
  siteSection: {
    marginBottom: 18,
  },
  siteLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  siteLabelIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 'auto',
    fontStyle: 'italic',
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  siteChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  siteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: '45%',
    flex: 1,
  },
  siteChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  siteChipText: {
    fontSize: 13,
    flex: 1,
  },
  // Quantity
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInputWrap: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  qtyInput: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  // Comment
  commentWrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
  },
  commentInput: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Errors
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Summary
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryBody: {},
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
  },
  summaryQtyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryQtyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default TransfertFormScreen;
