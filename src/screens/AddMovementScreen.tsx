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
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOut, ZoomIn, ZoomOut, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
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
import { CAMouvementTopBar } from '@/components/create-mouvement/CAMouvementTopBar';
import { CAMouvementStepper, type StepStatus } from '@/components/create-mouvement/CAMouvementStepper';
import { CAMouvementArticleCard } from '@/components/create-mouvement/CAMouvementArticleCard';
import { CAMouvementTypeGrid } from '@/components/create-mouvement/CAMouvementTypeGrid';
import { CAMouvementQtyStepper } from '@/components/create-mouvement/CAMouvementQtyStepper';
import { CAMouvementStockPreview } from '@/components/create-mouvement/CAMouvementStockPreview';
import { CAMouvementStepArticle } from '@/components/create-mouvement/CAMouvementStepArticle';
import { CASwipeToConfirm } from '@/components/create-mouvement/CASwipeToConfirm';
import { MOVEMENT_IDENTITIES, type MovementType } from '@/components/movement/movementTheme';
import { CAScreenWrapper } from '@/components/dashboard/CAScreenWrapper';
import { CA_THEME } from '@/constants/caTheme';
import { TextInput, ActivityIndicator } from 'react-native';

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
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const articleStepYRef = useRef(0);
  const typeStepYRef = useRef(0);
  const detailsStepYRef = useRef(0);
  const targetSiteIdRef = useRef<string | number | null>(null);

  const initialArticleId = route.params?.articleId as number | undefined;
  const initialType = route.params?.type as RouteMovementType;
  const isTypePreset = initialType !== undefined;
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

  const breathingScale = useSharedValue(1);
  const animatedFrameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }],
  }));

  useEffect(() => {
    if (showCamera) {
      breathingScale.value = Animated.withRepeat(
        Animated.withTiming(1.05, { duration: 1200 }),
        -1,
        true
      );
    } else {
      breathingScale.value = 1;
    }
  }, [showCamera, breathingScale]);

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
    if (parent) {
      parent.navigate('Mouvements', { screen: 'MouvementsList' });
      return;
    }
    navigation.navigate('MouvementsList');
  }, [flow, navigation]);

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
      if (!isMounted.current) return;

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
        if (!isMounted.current) return;
        setSubmitSuccess(false);
        const parent = navigation.getParent();
        // After a successful validation, always return to the Mouvements tab.
        if (parent) {
          parent.navigate('Mouvements', { screen: 'MouvementsList' });
        } else {
          navigation.navigate('MouvementsList');
        }
      }, 800);
    } catch (error) {
      if (!isMounted.current) return;
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      
      let displayMessage = message;
      if (message === 'STOCK_CONFLICT') {
        displayMessage = "Un autre mouvement vient d'être effectué en même temps. Veuillez réessayer.";
      }
      
      Alert.alert('Erreur', displayMessage);
      Vibration.vibrate(50);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
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

  const steps = [
    { key: 'article', label: 'Article', status: flow.currentStepIndex > 0 ? 'done' : flow.state.step === 'article' ? 'active' : 'pending' },
    { key: 'type',    label: 'Type',    status: flow.currentStepIndex > 1 ? 'done' : flow.state.step === 'type' ? 'active' : 'pending' },
    { key: 'details', label: 'Détails', status: flow.state.step === 'details' ? 'active' : 'pending' },
  ] as { key: string; label: string; status: StepStatus }[];

  const currentIdentity = flow.state.type ? MOVEMENT_IDENTITIES[flow.state.type as MovementType] : undefined;
  const activeThemeColor = currentIdentity?.color || CA_THEME.green;
  const activeThemeSubtle = currentIdentity?.subtle || CA_THEME.greenBg;

  return (
    <CAScreenWrapper>
      <CAMouvementTopBar
        onBack={handleBack}
        onHistory={() => navigation.navigate('Mouvements')}
        onHelp={() => Alert.alert('Aide', 'Sélectionnez un article, un type de mouvement et la quantité pour valider le mouvement.')}
      />

      <CAMouvementStepper 
        steps={steps} 
        themeColor={activeThemeColor}
        themeSubtle={activeThemeSubtle}
      />

      {flow.state.step === 'article' && (
        <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOut.duration(200)} style={{ flex: 1 }}>
          <CAMouvementStepArticle
            onScan={openScanner}
            onManualSearch={search.onChangeQuery}
            searchQuery={search.query}
            searchResults={search.results.map(r => ({
              id: String(r.id),
              reference: r.reference,
              label: r.nom || r.displayName || r.display_name || r.reference,
              stock_actuel: r.quantiteActuelle,
              imageUrl: r.photoUrl,
            }))}
            onSelectArticle={(art) => {
              const fullArticle = search.results.find(r => String(r.id) === art.id);
              if (fullArticle) {
                flow.selectArticle(fullArticle);
                setErrors({});
                search.reset();
              }
            }}
          />
        </Animated.View>
      )}

      {flow.state.step === 'type' && flow.state.article && (
        <Animated.ScrollView entering={FadeInRight.duration(300)} exiting={FadeOut.duration(200)} contentContainerStyle={{ padding: 12, gap: 12, flexGrow: 1, paddingBottom: Math.max(120, insets.bottom + 100) }}>
          <Text style={styles.sectionLabel}>Article sélectionné</Text>
          <CAMouvementArticleCard
            article={{
              reference: flow.state.article.reference,
              label: flow.state.article.nom || flow.state.article.displayName || flow.state.article.display_name || flow.state.article.reference,
              stockActuel: flow.state.article.quantiteActuelle,
              site: siteActif?.nom ?? 'Site non sélectionné',
              imageUrl: flow.state.article.photoUrl,
            }}
            onDeselect={() => {
              flow.setState(prev => ({ ...prev, article: null, step: 'article' }));
            }}
          />

          <Text style={styles.sectionLabel}>Type de mouvement <Text style={{color:CA_THEME.danger}}>*</Text></Text>
          <CAMouvementTypeGrid
            selected={flow.state.type as MovementType}
            onSelect={(t) => flow.updateField('type', t)}
          />

          <Text style={styles.sectionLabel}>Quantité <Text style={{color:CA_THEME.danger}}>*</Text></Text>
          <CAMouvementQtyStepper
            value={flow.state.quantity}
            onChange={(next) => {
              flow.updateField('quantity', next);
              Vibration.vibrate(8);
            }}
            max={maxQty}
            min={minQty}
            themeColor={CA_THEME.green}
          />

          <Pressable
            onPress={() => flow.nextStep()}
            disabled={!flow.state.type}
            style={({ pressed }) => [
              styles.btnContinue,
              pressed && styles.btnContinuePressed,
              !flow.state.type && styles.btnContinueDisabled,
              { marginTop: 'auto', marginBottom: 20 },
            ]}
            accessibilityRole="button" accessibilityLabel="Continuer vers les détails"
          >
            <View style={styles.continueIcon}>
              <Icon name="check" size={16} color={CA_THEME.green} />
            </View>
            <Text style={styles.btnContinueText}>Continuer</Text>
            <Icon name="arrow-right" size={20} color={CA_THEME.white} />
          </Pressable>
        </Animated.ScrollView>
      )}

      {flow.state.step === 'details' && flow.state.article && flow.state.type && (
        <Animated.ScrollView entering={FadeInRight.duration(300)} exiting={FadeOut.duration(200)} contentContainerStyle={{ padding: 12, gap: 12, flexGrow: 1, paddingBottom: Math.max(120, insets.bottom + 100) }}>
          <Text style={styles.sectionLabel}>Article sélectionné</Text>
          <CAMouvementArticleCard
            article={{
              reference: flow.state.article.reference,
              label: flow.state.article.nom || flow.state.article.displayName || flow.state.article.display_name || flow.state.article.reference,
              stockActuel: flow.state.article.quantiteActuelle,
              site: siteActif?.nom ?? 'Site non sélectionné',
              imageUrl: flow.state.article.photoUrl,
            }}
            onDeselect={() => {
              flow.setState(prev => ({ ...prev, article: null, step: 'article' }));
            }}
          />

          <CAMouvementStockPreview
            stockBefore={stockActuel}
            stockAfter={preview.newStock}
            movementType={flow.state.type as MovementType}
            quantity={flow.state.quantity}
            threshold={stockMin}
          />

          <View>
            <Text style={styles.sectionLabel}>Commentaire (optionnel)</Text>
            <TextInput
              value={flow.state.comment}
              onChangeText={(c) => flow.updateField('comment', c)}
              placeholder="Motif, précision..."
              placeholderTextColor={CA_THEME.textMuted}
              multiline
              maxLength={200}
              textAlignVertical="top"
              style={styles.commentInput}
              accessibilityLabel="Commentaire optionnel"
            />
            <Text style={styles.charCount}>{(flow.state.comment || '').length}/200</Text>
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.btnCancel,
              pressed && { backgroundColor: CA_THEME.lightGray, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Annuler le mouvement"
          >
            <Icon name="close-circle-outline" size={20} color={CA_THEME.danger} />
            <Text style={styles.btnCancelText}>Annuler le mouvement</Text>
          </Pressable>

          <CASwipeToConfirm
            onConfirm={submit}
            isLoading={isSubmitting}
            identity={currentIdentity}
          />
        </Animated.ScrollView>
      )}

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
              {/* Blur mask effect using multiple views or just a simple darker background with transparent center */}
              <View style={styles.scannerMaskTop} />
              <View style={styles.scannerMaskRow}>
                <View style={styles.scannerMaskSide} />
                <Animated.View style={[styles.cameraFrame, animatedFrameStyle]}>
                  <View style={[styles.corner, styles.tl, { borderColor: CA_THEME.green }]} />
                  <View style={[styles.corner, styles.tr, { borderColor: CA_THEME.green }]} />
                  <View style={[styles.corner, styles.bl, { borderColor: CA_THEME.green }]} />
                  <View style={[styles.corner, styles.br, { borderColor: CA_THEME.green }]} />
                </Animated.View>
                <View style={styles.scannerMaskSide} />
              </View>
              <View style={styles.scannerMaskBottom} />
            </View>
          </View>
        </View>
      </Modal>
    </CAScreenWrapper>
  );
};

export default AddMovementScreen;

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: CA_THEME.green,
    textTransform: 'uppercase', letterSpacing: 1.0,
    marginBottom: 0,
  },
  btnContinue: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, minHeight: 56, paddingHorizontal: 18, borderRadius: 14,
    backgroundColor: CA_THEME.green,
    shadowColor: CA_THEME.greenDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContinuePressed: { backgroundColor: CA_THEME.greenDark, transform: [{ scale: 0.98 }] },
  btnContinueDisabled: { opacity: 0.4 },
  continueIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: CA_THEME.white, alignItems: 'center', justifyContent: 'center' },
  btnContinueText: { fontSize: 16, fontWeight: '800', color: CA_THEME.white, letterSpacing: 0.2 },
  commentInput: {
    backgroundColor: CA_THEME.white,
    borderRadius: 14, borderWidth: 1, borderColor: CA_THEME.greenBg2,
    padding: 14, paddingTop: 14, fontSize: 14, color: CA_THEME.textPrimary,
    minHeight: 96,
    shadowColor: CA_THEME.greenDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  charCount: { fontSize: 10, color: CA_THEME.greenText, textAlign: 'right', marginTop: 5, fontWeight: '600' },
  btnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#FFF8FA',
    borderWidth: 1.5,
    borderColor: '#F1C5D0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: CA_THEME.danger,
    letterSpacing: 0.2,
  },
  btnValidate: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12,
    backgroundColor: CA_THEME.green,
  },
  btnValidateText: { fontSize: 15, fontWeight: '700', color: CA_THEME.white },
  container: {
    flex: 1,
    backgroundColor: CA_THEME.bgLight,
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
    gap: 8,
    backgroundColor: CA_THEME.dangerBg,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(211,47,47,0.15)',
  },
  errorText: {
    flex: 1,
    color: CA_THEME.danger,
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
    color: CA_THEME.danger,
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
    marginTop: -40,
  },
  scannerMaskTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scannerMaskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scannerMaskRow: {
    flexDirection: 'row',
  },
  scannerMaskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
