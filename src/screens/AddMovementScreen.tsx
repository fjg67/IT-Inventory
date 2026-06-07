import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Camera, useCameraDevices, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Article, MouvementStockForm } from '@/types';
import { articleRepository, mouvementRepository } from '@/database';
import { ERROR_MESSAGES } from '@/constants';
import { isPCArticle } from '@/constants/pcStates';
import { clearScannedArticle } from '@/store/slices/scanSlice';
import { showAlert } from '@/store/slices/uiSlice';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { useAppDispatch, useAppSelector } from '@/store';

import { useMovementFlow } from '@/hooks/useMovementFlow';
import { useMovementColor } from '@/hooks/useMovementColor';
import { useStockPreview } from '@/hooks/useStockPreview';
import { useArticleSearch } from '@/hooks/useArticleSearch';
import { useQuantityStepper } from '@/hooks/useQuantityStepper';
import {
  ArticleSearchInput,
  CommentTextarea,
  MovementHeader,
  MovementSubmitButton,
  MovementType,
  MovementTypeSelector,
  MOVEMENT_COLORS,
  QuantityStepper,
  ScanZone,
  SelectedArticleCard,
  StockPreviewCard,
} from '@/components/movement';

const BARCODE_TYPES = [
  'ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93',
  'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec',
] as const;

const SCAN_FRAME = 240;

type RouteMovementType = MovementType | undefined;

type RouteSource = 'Dashboard' | 'Scan' | 'Mouvements' | 'ArticleDetail' | undefined;

export const AddMovementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const articleStepYRef = useRef(0);
  const typeStepYRef = useRef(0);
  const detailsStepYRef = useRef(0);
  const targetSiteIdRef = useRef<string | number | null>(null);

  const initialArticleId = route.params?.articleId as number | undefined;
  const initialType = route.params?.type as RouteMovementType;
  const source = route.params?.source as RouteSource;

  const siteActif = useAppSelector((state) => state.site.siteActif);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const technicien = useAppSelector((state) => state.auth.currentTechnicien);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const flow = useMovementFlow(initialType ?? 'entree');
  const identityPack = useMovementColor(flow.state.type ?? 'entree');
  const search = useArticleSearch(effectiveSiteId, 200, { excludePC: true });
  const resetSearch = search.reset;

  useEffect(() => {
    flow.updateField('type', initialType ?? 'entree');
  }, [flow.updateField, initialType]);

  const targetSiteId = effectiveSiteId;
  targetSiteIdRef.current = targetSiteId;

  useEffect(() => {
    if (targetSiteId != null) {
      flow.updateField('stockSite', targetSiteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSiteId]);

  const resetMovementFlow = useCallback(() => {
    setIsSubmitting(false);
    setSubmitSuccess(false);
    setShowCamera(false);
    setShowCancelModal(false);
    setErrors({});
    resetSearch();
    dispatch(clearScannedArticle());
    flow.setState({
      step: 'article',
      article: null,
      stockSite: targetSiteIdRef.current ?? null,
      type: initialType ?? 'entree',
      quantity: 1,
      comment: '',
    });
  }, [dispatch, flow.setState, initialType, resetSearch]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetMovementFlow();
      };
    }, [resetMovementFlow]),
  );

  const stockActuel = flow.state.article?.quantiteActuelle ?? 0;
  const stockMin = flow.state.article?.stockMini ?? 0;

  const preview = useStockPreview(stockActuel, flow.state.quantity, flow.state.type, stockMin);

  const minQty = flow.state.type === 'ajustement' ? 0 : 1;
  const maxQty = flow.state.type === 'sortie' ? Math.max(stockActuel, minQty) : 9999;

  const quantityStepper = useQuantityStepper({
    min: minQty,
    max: maxQty,
    value: flow.state.quantity,
    onChange: (next) => {
      flow.updateField('quantity', next);
      Vibration.vibrate(8);
    },
  });

  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];
  const showCameraRef = useRef(false);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);
  const barcodeHandlerRef = useRef<(barcode: string) => void>(() => {});

  const searchByBarcode = useCallback(async (barcode: string) => {
    if (!effectiveSiteId) return;
    try {
      const direct = await articleRepository.findByReferenceOrBarcode(barcode, effectiveSiteId);
      if (direct && !isPCArticle(direct)) {
        flow.selectArticle(direct);
        setErrors({});
        search.reset();
        return;
      }

      const broader = await articleRepository.search(effectiveSiteId, { searchQuery: barcode, stockFaible: false }, 0, 6);
      const nonPCResults = broader.data.filter((article) => !isPCArticle(article));
      if (nonPCResults.length === 1) {
        flow.selectArticle(nonPCResults[0]);
        setErrors({});
        search.reset();
      } else if (nonPCResults.length > 1) {
        search.setResults(nonPCResults);
        search.setQuery(barcode);
      } else {
        setErrors({ article: `Article non trouve: ${barcode}` });
      }
    } catch {
      setErrors({ article: 'Erreur lors de la recherche article' });
    }
  }, [effectiveSiteId, flow, search]);

  useEffect(() => {
    barcodeHandlerRef.current = searchByBarcode;
  }, [searchByBarcode]);

  useEffect(() => {
    showCameraRef.current = showCamera;
  }, [showCamera]);

  const onCodeScanned = useCallback((codes: { value?: string }[]) => {
    if (!showCameraRef.current || codes.length === 0 || !codes[0]?.value) return;
    const value = codes[0].value.trim();
    if (!value) return;

    const now = Date.now();
    if (lastScannedRef.current?.value === value && now - lastScannedRef.current.at < 2500) return;
    lastScannedRef.current = { value, at: now };

    Vibration.vibrate([0, 30, 50, 30]);
    setShowCamera(false);
    barcodeHandlerRef.current(value);
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: [...BARCODE_TYPES],
    onCodeScanned,
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [flow.state.step]);

  const openScanner = async () => {
    if (!device) {
      Alert.alert('Camera indisponible', 'Aucune camera detectee sur cet appareil.');
      return;
    }
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Camera requise', 'Activez la camera dans les parametres.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir les parametres', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    setShowCamera(true);
  };

  useEffect(() => {
    if (!initialArticleId || !targetSiteId) return;
    articleRepository.findById(initialArticleId, targetSiteId).then((article) => {
      if (article) {
        flow.selectArticle(article);
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArticleId, targetSiteId]);

  const handleBack = useCallback(() => {
    if (flow.state.step === 'details') {
      flow.goToStep('type');
      return;
    }
    if (flow.state.step === 'type' && flow.state.article) {
      flow.goToStep('article');
      return;
    }

    const parent = navigation.getParent();
    if (source === 'Dashboard') {
      if (parent) parent.navigate('Dashboard');
      else navigation.navigate('Dashboard');
      return;
    }
    if (source === 'Scan') {
      if (parent) parent.navigate('Scan');
      else navigation.navigate('Scan');
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (parent) {
      parent.navigate('Mouvements');
      return;
    }
    navigation.navigate('Mouvements');
  }, [flow, navigation, source]);

  const isTypeStepValid = !!flow.state.type && flow.state.quantity >= minQty;

  const isFormValid = !!flow.state.article
    && !!targetSiteId
    && flow.state.quantity >= minQty
    && (flow.state.type !== 'sortie' || flow.state.quantity <= stockActuel);

  const submit = async () => {
    if (!flow.state.article || !targetSiteId || !flow.state.type) return;
    const technicienId = technicien?.id ?? 1;

    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const payload: MouvementStockForm = {
        articleId: flow.state.article.id,
        siteId: targetSiteId,
        type: flow.state.type,
        quantite: flow.state.quantity,
        commentaire: flow.state.comment.trim() || undefined,
      };

      const projectedStock = payload.type === 'ajustement'
        ? payload.quantite
        : payload.type === 'sortie'
          ? stockActuel - payload.quantite
          : stockActuel + payload.quantite;

      const safeProjectedStock = Math.max(0, projectedStock);
      const initialDefectiveCount = flow.state.article.defectiveCount ?? 0;
      const willAdjustDefectiveCount =
        flow.state.article.condition === 'defectueux' &&
        initialDefectiveCount > safeProjectedStock;

      await mouvementRepository.create(payload, technicienId);

      if (willAdjustDefectiveCount) {
        dispatch(showAlert({
          type: 'info',
          title: 'Ajustement automatique',
          message: `Le nombre de defectueux a ete ajuste a ${safeProjectedStock} suite au nouveau stock.`,
          duration: 3200,
        }));
      }

      dispatch(clearScannedArticle());

      setSubmitSuccess(true);
      Vibration.vibrate([0, 30, 60, 30]);

      setTimeout(() => {
        setSubmitSuccess(false);
        const parent = navigation.getParent();
        if (source === 'Dashboard') {
          if (parent) parent.navigate('Dashboard');
          else navigation.navigate('Dashboard');
          return;
        }
        if (source === 'Scan') {
          if (parent) parent.navigate('Scan');
          else navigation.navigate('Scan');
          return;
        }
        if (parent) {
          parent.navigate('Mouvements', { screen: 'MouvementsList' });
        } else {
          navigation.navigate('MouvementsList');
        }
      }, 800);
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      Alert.alert('Erreur', message);
      Vibration.vibrate(50);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancelMovement = useCallback(() => {
    setShowCancelModal(false);
    resetMovementFlow();

    const parent = navigation.getParent();
    if (source === 'Dashboard') {
      if (parent) parent.navigate('Dashboard');
      else navigation.navigate('Dashboard');
      return;
    }
    if (source === 'Scan') {
      if (parent) parent.navigate('Scan');
      else navigation.navigate('Scan');
      return;
    }
    if (parent) {
      parent.navigate('Mouvements', { screen: 'MouvementsList' });
    } else {
      navigation.navigate('MouvementsList');
    }
  }, [navigation, resetMovementFlow, source]);

  const cancelMovement = useCallback(() => {
    setShowCancelModal(true);
    Vibration.vibrate(10);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MOVEMENT_COLORS.bg_primary} />

      <MovementHeader
        title="Mouvement de stock"
        identity={identityPack.identity}
        currentStep={flow.currentStepIndex}
        onBack={handleBack}
        overlayStyle={identityPack.headerOverlayStyle}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: flow.state.step === 'details' ? 124 : 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {errors.article ? (
            <Animated.View entering={FadeInDown.duration(180)} style={styles.errorBanner}>
              <Icon name="alert-circle-outline" size={14} color={MOVEMENT_COLORS.danger} />
              <Text style={styles.errorText}>{errors.article}</Text>
            </Animated.View>
          ) : null}

          <View onLayout={(event) => { articleStepYRef.current = event.nativeEvent.layout.y; }}>
            {flow.state.step === 'article' ? (
              <Animated.View entering={FadeInRight.duration(250)}>
              {flow.state.article ? (
                <>
                  <SelectedArticleCard
                    article={flow.state.article}
                    stock={stockActuel}
                    siteName={siteActif?.nom}
                    identity={identityPack.identity}
                    onClear={() => {
                      flow.clearArticle();
                      setErrors({});
                      search.reset();
                    }}
                  />

                  <TouchableOpacity
                    style={[styles.continueBtn, { borderColor: identityPack.identity.border, backgroundColor: identityPack.identity.subtle }]}
                    onPress={() => flow.goToStep('type')}
                  >
                    <Text style={[styles.continueText, { color: identityPack.identity.color }]}>Continuer</Text>
                    <Icon name="arrow-right" size={16} color={identityPack.identity.color} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <ScanZone identity={identityPack.identity} onPress={openScanner} />
                  <ArticleSearchInput
                    identity={identityPack.identity}
                    value={search.query}
                    searching={search.searching}
                    results={search.results}
                    onChange={search.onChangeQuery}
                    onSubmit={() => {
                      if (search.query.trim()) {
                        searchByBarcode(search.query.trim());
                      }
                    }}
                    onSelect={(article) => {
                      flow.selectArticle(article);
                      search.reset();
                      setErrors({});
                    }}
                  />
                </>
              )}
              </Animated.View>
            ) : null}
          </View>

          <View onLayout={(event) => { typeStepYRef.current = event.nativeEvent.layout.y; }}>
            {flow.state.article && flow.state.step === 'type' ? (
              <Animated.View entering={FadeInRight.duration(250)}>
              <SelectedArticleCard
                article={flow.state.article}
                stock={stockActuel}
                siteName={siteActif?.nom}
                identity={identityPack.identity}
                onClear={() => {
                  flow.clearArticle();
                  flow.goToStep('article');
                }}
              />

              <MovementTypeSelector
                value={flow.state.type ?? 'entree'}
                identity={identityPack.identity}
                onChange={(value) => {
                  flow.updateField('type', value);
                  Vibration.vibrate(10);
                }}
              />

              <View style={{ marginTop: 2 }}>
                <QuantityStepper
                  identity={identityPack.identity}
                  value={flow.state.quantity}
                  min={minQty}
                  onValueChange={(next) => {
                    const parsed = parseInt(next, 10);
                    if (Number.isNaN(parsed)) {
                      flow.updateField('quantity', minQty);
                      return;
                    }
                    flow.updateField('quantity', Math.max(minQty, Math.min(maxQty, parsed)));
                  }}
                  onIncrement={quantityStepper.increment}
                  onDecrement={quantityStepper.decrement}
                  onIncrementHoldStart={quantityStepper.startIncrementHold}
                  onDecrementHoldStart={quantityStepper.startDecrementHold}
                  onHoldEnd={quantityStepper.stopHold}
                />
              </View>

              {flow.state.type === 'sortie' && flow.state.quantity > stockActuel ? (
                <Text style={styles.warningText}>Stock insuffisant (disponible : {stockActuel})</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.continueBtn, { borderColor: identityPack.identity.border, backgroundColor: identityPack.identity.subtle }]}
                onPress={() => flow.goToStep('details')}
                disabled={!isTypeStepValid}
              >
                <Text style={[styles.continueText, { color: identityPack.identity.color }]}>Continuer</Text>
                <Icon name="arrow-right" size={16} color={identityPack.identity.color} />
              </TouchableOpacity>
              </Animated.View>
            ) : null}
          </View>

          <View onLayout={(event) => { detailsStepYRef.current = event.nativeEvent.layout.y; }}>
            {flow.state.article && flow.state.step === 'details' ? (
              <Animated.View entering={FadeInRight.duration(250)}>
              <SelectedArticleCard
                article={flow.state.article}
                stock={stockActuel}
                siteName={siteActif?.nom}
                identity={identityPack.identity}
                onClear={() => {
                  flow.clearArticle();
                  flow.goToStep('article');
                }}
              />

              <StockPreviewCard
                identity={identityPack.identity}
                currentStock={stockActuel}
                newStock={preview.newStock}
                stockMin={stockMin}
              />

              <CommentTextarea
                identity={identityPack.identity}
                value={flow.state.comment}
                onChange={(next) => flow.updateField('comment', next)}
              />
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {flow.state.step === 'details' ? (
        <>
          <Animated.View
            entering={FadeInDown.duration(220)}
            style={[styles.cancelWrap, { bottom: Math.max(84, insets.bottom + 72) }]}
          >
            <TouchableOpacity activeOpacity={0.92} onPress={cancelMovement} style={styles.cancelTouchable}>
              <LinearGradient
                colors={['rgba(127,29,29,0.96)', 'rgba(153,27,27,0.96)', 'rgba(185,28,28,0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cancelBtn}
              >
                <View style={styles.cancelIconWrap}>
                  <Icon name="close-circle-outline" size={17} color="#FECACA" />
                </View>
                <Text style={styles.cancelText}>Annuler le mouvement</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <MovementSubmitButton
            identity={identityPack.identity}
            disabled={!isFormValid || isSubmitting}
            loading={isSubmitting}
            success={submitSuccess}
            onPress={submit}
            bottomInset={insets.bottom}
          />
        </>
      ) : null}

      <Modal
        visible={showCancelModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.cancelModalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCancelModal(false)} />

          <Animated.View entering={ZoomIn.duration(220)} exiting={ZoomOut.duration(170)} style={styles.cancelModalCardWrap}>
            <LinearGradient
              colors={['rgba(6,18,13,0.98)', 'rgba(7,23,16,0.98)', 'rgba(8,30,20,0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cancelModalCard}
            >
              <View style={styles.cancelModalIconWrap}>
                <Icon name="close-octagon-outline" size={24} color="#FCA5A5" />
              </View>

              <Text style={styles.cancelModalTitle}>Annuler le mouvement</Text>
              <Text style={styles.cancelModalDesc}>
                Voulez-vous vraiment annuler ce mouvement ? Les informations saisies seront perdues.
              </Text>

              <View style={styles.cancelModalActions}>
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => setShowCancelModal(false)}
                  style={styles.cancelSecondaryWrap}
                >
                  <LinearGradient
                    colors={['rgba(17,36,28,0.95)', 'rgba(12,28,21,0.95)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cancelSecondaryBtn}
                  >
                    <Icon name="pencil-outline" size={15} color="#86EFAC" />
                    <Text style={styles.cancelSecondaryText}>Continuer la saisie</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.92} onPress={confirmCancelMovement} style={styles.cancelPrimaryWrap}>
                  <LinearGradient
                    colors={['#7F1D1D', '#991B1B', '#B91C1C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cancelPrimaryBtn}
                  >
                    <Icon name="close-circle-outline" size={16} color="#FEE2E2" />
                    <Text style={styles.cancelPrimaryText}>Oui, annuler</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
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

          <View style={styles.cameraOverlay} pointerEvents="box-none">
            <View style={styles.cameraHeader}>
              <TouchableOpacity style={styles.cameraClose} onPress={() => setShowCamera(false)}>
                <Icon name="close" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scanner le code-barres</Text>
              <View style={{ width: 42 }} />
            </View>

            <View style={styles.cameraFrameWrap}>
              <View style={styles.cameraFrame}>
                <View style={[styles.corner, styles.tl, { borderColor: identityPack.identity.color }]} />
                <View style={[styles.corner, styles.tr, { borderColor: identityPack.identity.color }]} />
                <View style={[styles.corner, styles.bl, { borderColor: identityPack.identity.color }]} />
                <View style={[styles.corner, styles.br, { borderColor: identityPack.identity.color }]} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddMovementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MOVEMENT_COLORS.bg_primary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  errorBanner: {
    marginTop: 6,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MOVEMENT_COLORS.danger_subtle,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  errorText: {
    color: MOVEMENT_COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  continueBtn: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  continueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  warningText: {
    marginTop: 8,
    color: MOVEMENT_COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  cancelWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 12,
  },
  cancelTouchable: {
    borderRadius: 14,
    shadowColor: '#7F1D1D',
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cancelBtn: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cancelModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cancelModalCardWrap: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  cancelModalCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.24)',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
  },
  cancelModalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.38)',
    backgroundColor: 'rgba(127,29,29,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cancelModalTitle: {
    color: '#ECFDF5',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  cancelModalDesc: {
    marginTop: 10,
    color: 'rgba(220,252,231,0.9)',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  cancelModalActions: {
    marginTop: 18,
    gap: 10,
  },
  cancelSecondaryWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.28)',
  },
  cancelSecondaryBtn: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelSecondaryText: {
    color: '#86EFAC',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cancelPrimaryWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cancelPrimaryBtn: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelPrimaryText: {
    color: '#FEE2E2',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
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
  },
  cameraClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
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
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderWidth: 4,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
});
