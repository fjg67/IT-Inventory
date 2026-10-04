// ============================================
// SCAN MOUVEMENT SCREEN - Premium Design
// IT-Inventory Application
// ============================================

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Vibration,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Linking,
  Platform,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
  useCameraPermission,
  type CodeType,
} from 'react-native-vision-camera';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectIsSuperviseur } from '@/store/slices/authSlice';
import { notifyPCStatusChange } from '@/services/pcStatusNotificationService';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { clearScannedArticle, clearLastBarcode, setBarcode, setScanning, addToHistoryAndSave, loadScanHistory, persistScanHistory, ScanHistoryItem } from '@/store/slices/scanSlice';
import { dataWedgeService, useBarcodeScanner } from '@/modules/DataWedgeModule';
import { articleRepository } from '@/database';
import { AssetScanRecord, isTrackedWorkstation, workstationAssetService } from '@/services/workstationAssetService';
import { formatTimeParis } from '@/utils/dateUtils';
import { Article } from '@/types';
import { useResponsive } from '@/utils/responsive';
import { useScanAnimations } from '@/hooks/useScanAnimations';
import { ScanCheckCircle, ScanErrorState, ScanFrame, ScanResultCard, ScanSuccessBadge } from '@/components/scan';
import { CA_THEME } from '@/constants/caTheme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FRAME_SIZE = 260;

// ==================== PREMIUM BACKGROUND ====================
// Orbes de lumière pour le fond
const BG_ORBS = [
  { size: 350, x: SCREEN_W * 0.5 - 175, y: SCREEN_H * 0.25 - 175, colors: ['rgba(37,99,235,0.18)', 'rgba(37,99,235,0)'] },
  { size: 240, x: -60, y: -40, colors: ['rgba(99,102,241,0.14)', 'rgba(99,102,241,0)'] },
  { size: 200, x: SCREEN_W - 80, y: SCREEN_H * 0.55, colors: ['rgba(14,165,233,0.10)', 'rgba(14,165,233,0)'] },
  { size: 160, x: 30, y: SCREEN_H * 0.75, colors: ['rgba(139,92,246,0.08)', 'rgba(139,92,246,0)'] },
];

// Particules statiques (pas d'animation = 0 impact perf)
const STATIC_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * SCREEN_W,
  y: Math.random() * SCREEN_H,
  size: Math.random() * 2.5 + 1,
  opacity: Math.random() * 0.12 + 0.04,
}));

/** Fond premium : dégradé + orbes + spotlight + particules */
function PremiumBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. Dégradé principal sombre et profond */}
      <LinearGradient
        colors={['#060C1A', '#0D1629', '#0F1B33', '#0A0F1E']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Orbes de lumière diffuse */}
      {BG_ORBS.map((o, i) => (
        <LinearGradient
          key={i}
          colors={o.colors}
          style={{
            position: 'absolute',
            width: o.size,
            height: o.size,
            borderRadius: o.size / 2,
            left: o.x,
            top: o.y,
          }}
        />
      ))}

      {/* 3. Spotlight central sur la zone de scan */}
      <LinearGradient
        colors={[
          'rgba(59,130,246,0.08)',
          'rgba(59,130,246,0.04)',
          'transparent',
        ]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 4. Vignette douce (bords assombris) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.5)']}
        locations={[0, 0.2, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* 5. Particules statiques subtiles (étoiles) */}
      {STATIC_PARTICLES.map(p => (
        <View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: '#FFF',
            opacity: p.opacity,
          }}
        />
      ))}
    </View>
  );
}

// ==================== MAIN SCREEN ====================
// Types supportés par la caméra (certains types provoquent une erreur de parsing sur Android)
const BARCODE_TYPES: CodeType[] = [
  'ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39',
  'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec',
];

export const ScanMouvementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scanRequestRef = useRef(route.params);
  scanRequestRef.current = route.params;
  const dispatch = useAppDispatch();
  const { startScanning, stopScanning } = useBarcodeScanner();
  const { isTablet } = useResponsive();

  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back') ?? devices.find(d => d.position === 'front') ?? devices[0];
  const cameraAvailabilityRef = useRef({ hasPermission, device });
  cameraAvailabilityRef.current = { hasPermission, device };

  const siteActif = useAppSelector(state => state.site.siteActif);
  const childSites = useAppSelector(state => state.site.childSites);
  const selectedSubSiteId = useAppSelector(state => state.site.selectedSubSiteId);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const selectedSiteIdRef = useRef(effectiveSiteId);
  selectedSiteIdRef.current = effectiveSiteId;
  const effectiveSiteName = childSites.find(site => site.id === selectedSubSiteId)?.nom ?? siteActif?.nom;
  const isSuperviseur = useAppSelector(selectIsSuperviseur);
  const currentTechnicien = useAppSelector((state) => state.auth.currentTechnicien);
  const { lastBarcode, isScanning, history } = useAppSelector(state => state.scan);

  const [article, setArticle] = useState<Article | null>(null);
  const [scanMode, setScanMode] = useState<'recherche' | 'entree' | 'sortie'>('recherche');
  const scanModeRef = useRef(scanMode);
  scanModeRef.current = scanMode;
  const [assetMode, setAssetMode] = useState<'entree' | 'sortie' | null>(null);
  const [assetResult, setAssetResult] = useState('');
  const [assetCount, setAssetCount] = useState(0);
  const [assetStock, setAssetStock] = useState<number | null>(null);
  const [recentAssets, setRecentAssets] = useState<string[]>([]);
  const [assetHistory, setAssetHistory] = useState<AssetScanRecord[]>([]);
  const [showAssetHistory, setShowAssetHistory] = useState(false);
  const [assetHistoryLoading, setAssetHistoryLoading] = useState(false);
  const [assetHistoryError, setAssetHistoryError] = useState('');
  const [scanTrigger, setScanTrigger] = useState<{barcode: string, ts: number} | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraPreviewReady, setCameraPreviewReady] = useState(false);
  const [cameraInstanceKey, setCameraInstanceKey] = useState(0);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [pcActionTransition, setPcActionTransition] = useState<{
    icon: string;
    label: string;
    gradient: [string, string];
  } | null>(null);
  const overlayScrollRef = useRef<ScrollView | null>(null);
  const quickActionsYRef = useRef<number | null>(null);
  const cameraReadyRef = useRef(false);
  const cameraRestartAttemptsRef = useRef(0);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);
  const isProcessingRef = useRef(false);
  const assetHistoryOpenRef = useRef(false);
  assetHistoryOpenRef.current = showAssetHistory;
  const { checkStyle, ringStyle, frameCornersStyle, scanLineStyle, flashStyle } = useScanAnimations(scanStatus);

  // Charger l'historique des scans depuis AsyncStorage au montage
  useEffect(() => {
    dispatch(loadScanHistory());
  }, [dispatch]);

  // Réinitialiser l'état du scan quand l'écran reçoit le focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const scanRequest = scanRequestRef.current as { articleId?: string | number; assetDirection?: 'entree' | 'sortie' } | undefined;
      // Reset tout l'état local
      setArticle(null);
      setAssetMode(null);
      setAssetResult('');
      setAssetCount(0);
      setAssetStock(null);
      setRecentAssets([]);
      setAssetHistory([]);
      setShowAssetHistory(false);
      setAssetHistoryError('');
      setScanStatus('idle');
      setErrorMsg('');
      setCameraPreviewReady(false);
      setCameraInstanceKey(k => k + 1);
      scanConsensusRef.current = { value: '', count: 0 };
      lastScannedRef.current = null;
      isProcessingRef.current = false;
      cameraRestartAttemptsRef.current = 0;
      // Reset l'état Redux
      dispatch(clearScannedArticle());
      dispatch(clearLastBarcode());
      setScanTrigger(null);

      if (scanRequest?.articleId != null && scanRequest.assetDirection) {
        isProcessingRef.current = true;
        setScanMode(scanRequest.assetDirection);
        scanModeRef.current = scanRequest.assetDirection;
        setScanStatus('scanning');
        navigation.setParams({ articleId: undefined, assetDirection: undefined });
        if (selectedSiteIdRef.current) {
          articleRepository.findById(scanRequest.articleId, selectedSiteIdRef.current)
            .then((selectedArticle) => {
              if (cancelled) return;
              if (!selectedArticle || !isTrackedWorkstation(selectedArticle)) {
                setErrorMsg('Article introuvable sur le site sélectionné.');
                setScanStatus('error');
                return;
              }
              setArticle(selectedArticle);
              setAssetMode(scanRequest.assetDirection!);
              setAssetStock(selectedArticle.quantiteActuelle ?? 0);
              setScanStatus('idle');
            })
            .catch((error) => {
              if (cancelled) return;
              setErrorMsg((error as Error).message);
              setScanStatus('error');
            })
            .finally(() => {
              if (!cancelled) isProcessingRef.current = false;
            });
        } else {
          setErrorMsg('Aucun site sélectionné.');
          setScanStatus('error');
          isProcessingRef.current = false;
        }
      }

      if (cameraAvailabilityRef.current.hasPermission && cameraAvailabilityRef.current.device) {
        setCameraReady(true);
        cameraReadyRef.current = true;
        dispatch(setScanning(true));
        startScanning();
      }

      return () => {
        cancelled = true;
        cameraReadyRef.current = false;
        setCameraPreviewReady(false);
        dispatch(setScanning(false));
        stopScanning();
      };
    }, [dispatch, startScanning, stopScanning, navigation])
  );

  // Persister l'historique à chaque changement
  const historyLenRef = useRef(history.length);
  useEffect(() => {
    // Ne persister que si l'historique a changé (pas au chargement initial)
    if (history.length !== historyLenRef.current) {
      historyLenRef.current = history.length;
      persistScanHistory(history);
    }
  }, [history]);

  // Ouvrir la caméra automatiquement au montage
  useEffect(() => {
    const initCamera = async () => {
      try {
        if (!hasPermission) {
          const granted = await requestPermission();
          if (granted && device) {
            setCameraReady(true);
            setCameraPreviewReady(false);
            cameraReadyRef.current = true;
            startScanning();
          }
        } else if (device) {
          setCameraReady(true);
          setCameraPreviewReady(false);
          cameraReadyRef.current = true;
          startScanning();
        }
      } catch (err) {
        console.warn('[Scan] Erreur init caméra:', err);
      }
    };
    initCamera();
  }, [hasPermission, device, requestPermission, startScanning]);

  const handleRestartCamera = useCallback(() => {
    if (!hasPermission || !device) return;
    setCameraPreviewReady(false);
    setCameraInstanceKey(k => k + 1);
    setCameraReady(true);
    cameraReadyRef.current = true;
    dispatch(setScanning(true));
    startScanning();
  }, [hasPermission, device, dispatch, startScanning]);

  // Si la preview ne démarre pas, forcer un remount de la caméra (cas écran noir sporadique)
  useEffect(() => {
    if (!hasPermission || !device || !cameraReady || (!!article && !assetMode) || cameraPreviewReady) return;

    const timeout = setTimeout(() => {
      if (cameraRestartAttemptsRef.current >= 2) return;
      cameraRestartAttemptsRef.current += 1;
      console.warn('[Scan] Preview non initialisée, relance caméra');
      handleRestartCamera();
    }, 2200);

    return () => clearTimeout(timeout);
  }, [hasPermission, device, cameraReady, article, assetMode, cameraPreviewReady, handleRestartCamera]);

  const actionTransitionOpacity = useSharedValue(0);
  const actionTransitionScale = useSharedValue(0.92);

  const actionTransitionStyle = useAnimatedStyle(() => ({
    opacity: actionTransitionOpacity.value,
    transform: [{ scale: actionTransitionScale.value }],
  }));

  const scrollToQuickActions = useCallback((attempt: number = 0) => {
    const y = quickActionsYRef.current;
    if (y != null && overlayScrollRef.current) {
      overlayScrollRef.current.scrollTo({ y: Math.max(y - 18, 0), animated: true });
      return;
    }

    if (attempt < 8) {
      setTimeout(() => scrollToQuickActions(attempt + 1), 60);
    }
  }, []);

  // ===== Camera code scanner (validation par consensus) =====
  const scanConsensusRef = useRef<{ value: string; count: number }>({ value: '', count: 0 });
  const SCAN_CONSENSUS_THRESHOLD = 3;

  const onCodeScanned = useCallback(
    (codes: { value?: string }[]) => {
      try {
        // Utiliser la ref pour éviter la closure obsolète
        if (!cameraReadyRef.current || isProcessingRef.current || assetHistoryOpenRef.current) return;
        if (codes.length === 0 || !codes[0]?.value) return;
        const value = codes[0].value.trim();
        if (!value) return;

        // Validation par consensus : même code lu N fois de suite
        if (scanConsensusRef.current.value === value) {
          scanConsensusRef.current.count += 1;
        } else {
          scanConsensusRef.current = { value, count: 1 };
        }

        if (scanConsensusRef.current.count < SCAN_CONSENSUS_THRESHOLD) return;

        // Anti-doublon après validation
        const now = Date.now();
        if (lastScannedRef.current?.value === value && now - lastScannedRef.current.at < 2500) return;
        lastScannedRef.current = { value, at: now };
        scanConsensusRef.current = { value: '', count: 0 };

        // Bloquer les callbacks pendant le traitement
        isProcessingRef.current = true;

        console.log('[Scan] Code-barres validé (consensus x3):', value);
        Vibration.vibrate(50);
        dispatch(setBarcode(value));
        setScanTrigger({ barcode: value, ts: Date.now() });
      } catch (err) {
        console.warn('[Scan] Erreur dans onCodeScanned:', err);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    return dataWedgeService.addListener(({ barcode }) => {
      if (!cameraReadyRef.current || isProcessingRef.current || assetHistoryOpenRef.current) return;
      const value = barcode.trim();
      if (!value) return;
      const now = Date.now();
      if (lastScannedRef.current?.value === value && now - lastScannedRef.current.at < 2500) return;
      lastScannedRef.current = { value, at: now };
      isProcessingRef.current = true;
      setScanTrigger({ barcode: value, ts: now });
    });
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: BARCODE_TYPES,
    onCodeScanned,
  });

  // ===== Search article on scan =====
  const searchArticle = useCallback(async (barcode: string) => {
    if (!effectiveSiteId) {
      console.warn('[Scan] Pas de site actif, recherche impossible');
      isProcessingRef.current = false;
      return;
    }
    setScanStatus('scanning');
    setArticle(null);
    setErrorMsg('');

    try {
      console.log('[Scan] Recherche article pour code-barres:', barcode);
      const result = await articleRepository.findByReferenceOrBarcode(barcode, effectiveSiteId);
      if (result) {
        console.log('[Scan] Article trouvé:', result.nom);
        setArticle(result);
        if (isTrackedWorkstation(result) && scanModeRef.current !== 'recherche' && !isSuperviseur) {
          setAssetMode(scanModeRef.current);
          setAssetStock(result.quantiteActuelle ?? 0);
          setAssetCount(0);
          setAssetResult('');
          setRecentAssets([]);
          setScanTrigger(null);
          setScanStatus('idle');
          overlayScrollRef.current?.scrollTo({ y: 0, animated: true });
          return;
        }
        setScanStatus('success');
        ReactNativeHapticFeedback.trigger('notificationSuccess', { enableVibrateFallback: true, ignoreAndroidSystemSettings: true });
        setTimeout(() => {
          scrollToQuickActions();
        }, 80);
        // Ajouter à l'historique (trouvé)
        dispatch(addToHistoryAndSave({
          barcode,
          timestamp: Date.now(),
          articleId: result.id as number,
          articleNom: result.nom,
          found: true,
        }));
      } else {
        console.log('[Scan] Article non trouvé pour:', barcode);
        setScanStatus('error');
        setErrorMsg(`Article non trouvé (référence/asset) : ${barcode}`);
        ReactNativeHapticFeedback.trigger('notificationError', { enableVibrateFallback: true, ignoreAndroidSystemSettings: true });
        // Ajouter à l'historique (non trouvé)
        dispatch(addToHistoryAndSave({
          barcode,
          timestamp: Date.now(),
          found: false,
        }));
      }
    } catch (err) {
      console.error('[Scan] Erreur recherche article:', err);
      setScanStatus('error');
      setErrorMsg(`Erreur : ${(err as Error)?.message || 'Problème de connexion'}`);
      ReactNativeHapticFeedback.trigger('notificationError', { enableVibrateFallback: true, ignoreAndroidSystemSettings: true });
      // Ajouter à l'historique (erreur)
      dispatch(addToHistoryAndSave({
        barcode,
        timestamp: Date.now(),
        found: false,
      }));
    } finally {
      // Toujours débloquer le traitement pour permettre un nouveau scan
      isProcessingRef.current = false;
    }
  }, [effectiveSiteId, dispatch, isSuperviseur, scrollToQuickActions]);

  const recordAsset = useCallback(async (barcode: string) => {
    if (!article || !assetMode || !effectiveSiteId || !currentTechnicien?.id) {
      setAssetResult('Article, site ou technicien indisponible.');
      isProcessingRef.current = false;
      return;
    }
    if (barcode.toUpperCase() === article.reference.toUpperCase() || barcode.toUpperCase() === article.barcode?.toUpperCase()) {
      isProcessingRef.current = false;
      return;
    }
    setScanStatus('scanning');
    try {
      const result = await workstationAssetService.record(
        article.id, effectiveSiteId, barcode, assetMode, currentTechnicien.id,
      );
      setAssetStock(result.quantity);
      setAssetCount(count => count + 1);
      setRecentAssets(previous => [result.assetCode, ...previous].slice(0, 3));
      setAssetHistory(previous => [{
        id: result.movementId,
        code: result.assetCode,
        direction: assetMode,
        createdAt: new Date().toISOString(),
      }, ...previous]);
      setAssetResult(`${result.assetCode} : ${assetMode === 'entree' ? 'entré' : 'sorti'} · stock ${result.quantity}`);
      setScanStatus('success');
    } catch (error) {
      setAssetResult((error as Error).message);
      setScanStatus('error');
    } finally {
      isProcessingRef.current = false;
    }
  }, [article, assetMode, effectiveSiteId, currentTechnicien?.id]);

  const openAssetHistory = useCallback(async () => {
    if (!article || !effectiveSiteId) return;
    assetHistoryOpenRef.current = true;
    setShowAssetHistory(true);
    setAssetHistoryLoading(true);
    setAssetHistoryError('');
    try {
      setAssetHistory(await workstationAssetService.listHistory(article.id, effectiveSiteId));
    } catch (error) {
      setAssetHistoryError((error as Error).message);
    } finally {
      setAssetHistoryLoading(false);
    }
  }, [article, effectiveSiteId]);

  const closeAssetHistory = useCallback(() => {
    assetHistoryOpenRef.current = false;
    setShowAssetHistory(false);
  }, []);

  useEffect(() => {
    if (scanTrigger && siteActif && !assetMode) {
      searchArticle(scanTrigger.barcode).catch(() => {});
    }
  }, [scanTrigger, siteActif, assetMode, searchArticle]);

  useEffect(() => {
    if (scanTrigger && assetMode) {
      recordAsset(scanTrigger.barcode).catch(() => {});
    }
  }, [scanTrigger, assetMode, recordAsset]);

  // ===== Actions =====

  const handleMouvement = (type: 'entree' | 'sortie' | 'ajustement') => {
    if (!article) return;
    if (isTrackedWorkstation(article)) {
      if (type === 'ajustement') return;
      setAssetMode(type);
      setAssetStock(article.quantiteActuelle ?? 0);
      setAssetCount(0);
      setAssetResult('');
      setRecentAssets([]);
      setAssetHistory([]);
      setScanTrigger(null);
      scanConsensusRef.current = { value: '', count: 0 };
      lastScannedRef.current = null;
      setScanStatus('idle');
      overlayScrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    Vibration.vibrate(10);
    navigation.navigate('Mouvements', {
      screen: 'MouvementForm',
      params: { articleId: article.id, type, source: 'Scan' },
    });
  };

  const handleViewDetails = () => {
    if (!article) return;
    Vibration.vibrate(10);
    navigation.navigate('Articles', {
      screen: 'ArticleDetail',
      params: { articleId: article.id, sourceTab: isScannedPC ? 'PC' : 'Articles' },
    });
  };

  const navigateToPCDetails = useCallback(() => {
    if (!article) return;
    navigation.navigate('Articles', {
      screen: 'ArticleDetail',
      params: { articleId: article.id, sourceTab: 'PC' },
    });
  }, [article, navigation]);

  const handleReset = useCallback(() => {
    setArticle(null);
    setAssetMode(null);
    setAssetResult('');
    setAssetCount(0);
    setAssetStock(null);
    setRecentAssets([]);
    setAssetHistory([]);
    closeAssetHistory();
    setScanTrigger(null);
    setScanStatus('idle');
    setErrorMsg('');
    // Réinitialiser le buffer de consensus pour permettre un nouveau scan
    scanConsensusRef.current = { value: '', count: 0 };
    lastScannedRef.current = null;
    isProcessingRef.current = false;
    dispatch(clearScannedArticle());
    dispatch(clearLastBarcode());
    overlayScrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [dispatch, closeAssetHistory]);

  useEffect(() => {
    if (!quickMode || !article || assetMode || isTrackedWorkstation(article) || scanStatus !== 'success') return;
    const timer = setTimeout(() => handleReset(), 700);
    return () => clearTimeout(timer);
  }, [article, assetMode, handleReset, quickMode, scanStatus]);

  // Réessayer la recherche avec le dernier code scanné
  const handleRetry = useCallback(() => {
    if (lastBarcode) {
      searchArticle(lastBarcode).catch(() => {});
    } else {
      handleReset();
    }
  }, [lastBarcode, searchArticle, handleReset]);

  const getPCStatus = useCallback((description?: string) => {
    const normalized = (description ?? '').toLowerCase();
    if (normalized.includes('disponible')) return 'Disponible';
    if (normalized.includes('reusin') || normalized.includes('recondition')) return 'À reusiner';
    if (normalized.includes('a chaud') || normalized.includes('à chaud')) return 'À chaud';
    return null;
  }, []);

  const isScannedPC = useMemo(() => {
    if (!article) return false;
    const values = [article.typeArticle, article.sousType, article.famille]
      .filter((v): v is string => !!v)
      .map((v) => v.toLowerCase());

    return values.some((v) =>
      v === 'pc' ||
      v.includes('pc portable') ||
      v.includes('portable siège') ||
      v.includes('portable agence') ||
      v.includes('pc disponible'),
    );
  }, [article]);

  const scannedPCStatus = useMemo(() => getPCStatus(article?.description), [article?.description, getPCStatus]);

  const handleSetPCStatus = useCallback(async (
    nextStatus: 'À chaud' | 'À reusiner' | 'Disponible',
    options?: { openDetailsAfter?: boolean },
  ) => {
    if (!article) return;

    try {
      setIsStatusUpdating(true);
      const nextFamily = nextStatus === 'Disponible' ? 'PC disponible' : 'PC portable';
      await articleRepository.update(article.id, {
        description: `Statut: ${nextStatus}`,
        famille: nextFamily,
      });

      setArticle((prev) => prev ? {
        ...prev,
        description: `Statut: ${nextStatus}`,
        famille: nextFamily,
        dateModification: new Date(),
      } : prev);

      Vibration.vibrate(16);

      const techName = currentTechnicien
        ? `${currentTechnicien.prenom} ${currentTechnicien.nom}`.trim()
        : 'Technicien inconnu';
      notifyPCStatusChange({
        article: { ...article, description: `Statut: ${nextStatus}`, famille: nextFamily },
        nextStatus,
        technicienName: techName,
      });

      if (options?.openDetailsAfter) {
        const transitionConfig =
          nextStatus === 'Disponible'
            ? { icon: 'check-circle-outline', label: 'Disponible', gradient: ['#3B82F6', '#2563EB'] as [string, string] }
            : nextStatus === 'À chaud'
              ? { icon: 'flash-outline', label: 'À chaud', gradient: ['#10B981', '#059669'] as [string, string] }
              : { icon: 'wrench-outline', label: 'À reusiner', gradient: ['#F59E0B', '#D97706'] as [string, string] };

        setPcActionTransition(transitionConfig);
        actionTransitionOpacity.value = 0;
        actionTransitionScale.value = 0.92;
        actionTransitionOpacity.value = withTiming(1, { duration: 180 });
        actionTransitionScale.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });

        await new Promise((resolve) => setTimeout(resolve, 520));
        navigateToPCDetails();
        actionTransitionOpacity.value = withTiming(0, { duration: 140 });
        setPcActionTransition(null);
      }
    } catch (error) {
      console.warn('[Scan] Erreur MAJ statut PC:', error);
      setErrorMsg(`Impossible de passer le PC en ${nextStatus}`);
      setScanStatus('error');
    } finally {
      setIsStatusUpdating(false);
    }
  }, [actionTransitionOpacity, actionTransitionScale, article, navigateToPCDetails]);

  const quickActionItems = useMemo(() => {
    if (!article) return [];

    if (isTrackedWorkstation(article)) {
      return [
        ...(!isSuperviseur ? [
          { key: 'entree', tone: 'entree' as const, label: 'Entrée', onPress: () => handleMouvement('entree') },
          { key: 'sortie', tone: 'sortie' as const, label: 'Sortie', onPress: () => handleMouvement('sortie') },
        ] : []),
        { key: 'details', tone: 'details' as const, label: 'Détails', onPress: handleViewDetails },
      ];
    }

    if (isScannedPC) {
      const items = [] as Array<{
        key: string;
        tone: 'disponible' | 'chaud' | 'reusiner' | 'sortie' | 'details';
        label: string;
        onPress: () => void;
        disabled?: boolean;
      }>;

      if (!isSuperviseur) {
        items.push(
          {
            key: 'disponible',
            tone: 'disponible',
            label: 'Disponible',
            onPress: () => handleSetPCStatus('Disponible', { openDetailsAfter: true }),
            disabled: isStatusUpdating || scannedPCStatus === 'Disponible',
          },
          {
            key: 'chaud',
            tone: 'chaud',
            label: 'A chaud',
            onPress: () => handleSetPCStatus('À chaud', { openDetailsAfter: true }),
            disabled: isStatusUpdating || scannedPCStatus === 'À chaud',
          },
          {
            key: 'reusiner',
            tone: 'reusiner',
            label: 'A reusiner',
            onPress: () => handleSetPCStatus('À reusiner', { openDetailsAfter: true }),
            disabled: isStatusUpdating || scannedPCStatus === 'À reusiner',
          },
          {
            key: 'sortie',
            tone: 'sortie',
            label: 'Sortie',
            onPress: () => handleMouvement('sortie'),
          },
        );
      } else {
        items.push({
          key: 'details',
          tone: 'details',
          label: 'Details',
          onPress: handleViewDetails,
        });
      }

      return items;
    }

    const items = [] as Array<{
      key: string;
      tone: 'entree' | 'sortie' | 'ajustement' | 'details';
      label: string;
      onPress: () => void;
    }>;

    if (!isSuperviseur) {
      items.push(
        { key: 'entree', tone: 'entree', label: 'Entree', onPress: () => handleMouvement('entree') },
        { key: 'sortie', tone: 'sortie', label: 'Sortie', onPress: () => handleMouvement('sortie') },
      );
      if (!isTrackedWorkstation(article)) {
        items.push({ key: 'ajustement', tone: 'ajustement', label: 'Ajustement', onPress: () => handleMouvement('ajustement') });
      }
    }

    items.push({ key: 'details', tone: 'details', label: 'Details', onPress: handleViewDetails });
    return items;
  }, [article, handleMouvement, handleSetPCStatus, handleViewDetails, isScannedPC, isStatusUpdating, isSuperviseur, scannedPCStatus]);

  // ==================== RENDER ====================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ===== CAMERA LIVE (toujours en fond) ===== */}
      {hasPermission && device && cameraReady ? (
        <Camera
          key={`scan-camera-${cameraInstanceKey}`}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={cameraReady && (!article || !!assetMode) && !showAssetHistory}
          {...(!article || assetMode ? { codeScanner } : {})}
          photo={false}
          video={false}
          audio={false}
          onInitialized={() => {
            setCameraPreviewReady(true);
            cameraRestartAttemptsRef.current = 0;
          }}
          onError={(error) => {
            console.warn('[Scan] Camera error:', error);
            setCameraPreviewReady(false);
            if (cameraRestartAttemptsRef.current < 2) {
              cameraRestartAttemptsRef.current += 1;
              setCameraInstanceKey(k => k + 1);
            }
          }}
        />
      ) : (
        <PremiumBackground />
      )}

      {/* ===== OVERLAY SOMBRE SEMI-TRANSPARENT ===== */}
      <ScrollView
        ref={overlayScrollRef}
        style={styles.darkOverlay}
        contentContainerStyle={styles.darkOverlayContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

      {/* ===== HEADER ===== */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => { ReactNativeHapticFeedback.trigger('impactLight'); navigation.goBack(); }}>
          <View style={styles.headerBtnBg}>
            <Icon name="arrow-left" size={22} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => { ReactNativeHapticFeedback.trigger('impactLight'); setShowHistory(true); }}
        >
          <View style={styles.headerBtnBg}>
            <Icon name="history" size={22} color="#FFF" />
            {history.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{history.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {!article && !isSuperviseur && (
        <View style={styles.scanModeBar} accessibilityRole="radiogroup">
          {([
            { mode: 'recherche', label: 'Recherche', icon: 'magnify' },
            { mode: 'entree', label: 'Entrée', icon: 'plus' },
            { mode: 'sortie', label: 'Sortie', icon: 'minus' },
          ] as const).map(({ mode, label, icon }) => {
            const selected = scanMode === mode;
            const activeColor = mode === 'sortie' ? CA_THEME.danger : CA_THEME.green;
            return (
              <Pressable
                key={mode}
                onPress={() => {
                  setScanMode(mode);
                  setScanTrigger(null);
                  setScanStatus('idle');
                  setErrorMsg('');
                  scanConsensusRef.current = { value: '', count: 0 };
                  lastScannedRef.current = null;
                }}
                style={[styles.scanModeItem, selected && { backgroundColor: activeColor }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={label}
              >
                <Icon name={icon} size={18} color={selected ? CA_THEME.white : CA_THEME.textSecondary} />
                <Text style={[styles.scanModeLabel, selected && styles.scanModeLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ===== SCAN FRAME ===== */}
      <View style={[styles.frameWrapper, isTablet && { alignSelf: 'center' }]}>
        <Animated.View pointerEvents="none" style={[styles.frameFlash, flashStyle]} />
        <ScanFrame
          size={FRAME_SIZE}
          state={scanStatus}
          frameStyle={frameCornersStyle}
          scanLineStyle={scanLineStyle}
        />
        {!assetMode && (scanStatus === 'success' || scanStatus === 'error') && (
          <View style={styles.centerIcon}>
            <ScanCheckCircle
              variant={scanStatus === 'error' ? 'error' : 'success'}
              checkStyle={checkStyle}
              ringStyle={ringStyle}
            />
          </View>
        )}
      </View>

      {/* ===== INSTRUCTION / STATUS ===== */}
      <View style={styles.statusArea}>
        {assetMode ? (
          <View style={[styles.assetPanel, { borderTopColor: assetMode === 'entree' ? CA_THEME.green : CA_THEME.danger }]}>
            <View style={styles.assetPanelHeader}>
              <View style={[styles.assetModeIcon, { backgroundColor: assetMode === 'entree' ? CA_THEME.greenBg : CA_THEME.dangerBg }]}>
                <Icon name={assetMode === 'entree' ? 'arrow-down-bold' : 'arrow-up-bold'} size={20} color={assetMode === 'entree' ? CA_THEME.green : CA_THEME.danger} />
              </View>
              <View style={styles.assetPanelHeading}>
                <Text style={[styles.assetEyebrow, { color: assetMode === 'entree' ? CA_THEME.green : CA_THEME.danger }]}>SCAN D’ASSETS · {assetMode === 'entree' ? 'ENTRÉE' : 'SORTIE'}</Text>
                <Text style={styles.assetPanelTitle} numberOfLines={2}>{article?.nom}</Text>
              </View>
              <TouchableOpacity onPress={handleReset} style={styles.assetDone} accessibilityRole="button">
                <Icon name="close" size={20} color={CA_THEME.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.assetLocation}>
              <Icon name="map-marker-outline" size={14} color={CA_THEME.green} />
              <Text style={styles.assetPanelSite} numberOfLines={1}>{effectiveSiteName}</Text>
              <Text style={styles.assetReference}>{article?.reference}</Text>
            </View>
            <View style={styles.assetCounts}>
              <View>
                <Text style={styles.assetCountLabel}>EN STOCK</Text>
                <Text style={styles.assetCountValue}>{assetStock ?? 0}</Text>
              </View>
              <View style={styles.assetCountDivider} />
              <View>
                <Text style={styles.assetCountLabel}>{assetMode === 'entree' ? 'ENTRÉES' : 'SORTIES'} · SESSION</Text>
                <Text style={[styles.assetCountValue, { color: assetMode === 'entree' ? CA_THEME.green : CA_THEME.danger }]}>{assetCount}</Text>
              </View>
            </View>
            <View style={[styles.assetFeedbackRow, scanStatus === 'error' && styles.assetFeedbackRowError]}>
              <Icon name={scanStatus === 'error' ? 'alert-circle-outline' : scanStatus === 'success' ? 'check-circle-outline' : 'barcode-scan'} size={17} color={scanStatus === 'error' ? CA_THEME.danger : CA_THEME.green} />
              <Text style={[styles.assetFeedback, scanStatus === 'error' && styles.assetFeedbackError]} accessibilityLiveRegion="polite">
                {assetResult || 'En attente du prochain asset'}
              </Text>
            </View>
            {recentAssets.length > 0 && (
              <Text style={styles.assetRecent} numberOfLines={1}>Derniers : {recentAssets.join(' · ')}</Text>
            )}
            <TouchableOpacity style={styles.assetHistoryButton} onPress={openAssetHistory} accessibilityRole="button">
              <Icon name="format-list-bulleted" size={18} color={CA_THEME.green} />
              <Text style={styles.assetHistoryButtonText}>Tous les assets scannés</Text>
              <Icon name="chevron-right" size={18} color={CA_THEME.green} />
            </TouchableOpacity>
          </View>
        ) : (
        <>
        {scanStatus === 'idle' && !isScanning && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statusPanel}>
            <Text style={styles.statusTitle}>Alignez le code-barres</Text>
            <Text style={styles.statusSubtitle}>Le Zebra TC22 ou la camera detecte automatiquement l&apos;article dans le cadre.</Text>
          </Animated.View>
        )}
        {(scanStatus === 'idle' && isScanning && cameraPreviewReady) && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statusPanel}>
            <ScanSuccessBadge text="Lecture en cours" />
            <Text style={styles.statusSubtitle}>Analyse locale du code-barres avant verification de la fiche article.</Text>
          </Animated.View>
        )}
        {(scanStatus === 'idle' && isScanning && !cameraPreviewReady) && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statusPanel}>
            <Text style={styles.statusTitle}>Initialisation de la camera...</Text>
            <Text style={styles.statusSubtitle}>Si l&apos;image reste noire, relancez la camera.</Text>
            <TouchableOpacity style={styles.camRecoverBtn} activeOpacity={0.85} onPress={handleRestartCamera}>
              <Text style={styles.camRecoverBtnText}>Relancer la camera</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {scanStatus === 'scanning' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.statusPanel}>
            <ScanSuccessBadge text="Verification de l'article" />
            <Text style={styles.statusSubtitle}>Connexion a la base et chargement des actions rapides disponibles.</Text>
          </Animated.View>
        )}
        {scanStatus === 'success' && article && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.statusPanel}>
            <ScanSuccessBadge text="Article trouve" />
            <Text style={styles.statusTitle}>{article.nom}</Text>
            <Text style={styles.statusSubtitle}>Glissez la carte vers le bas pour la fermer ou choisissez une action immediate.</Text>
          </Animated.View>
        )}
        {scanStatus === 'error' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.statusPanel}>
            <ScanSuccessBadge text="Scan non reconnu" variant="error" />
            <Text style={styles.statusSubtitle}>{errorMsg}</Text>
          </Animated.View>
        )}
        </>
        )}
      </View>

      {/* ===== Permission hint si pas de caméra ===== */}
      {!hasPermission && !cameraReady && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.scanBtnWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={async () => {
              const granted = await requestPermission();
              if (granted && device) {
                setCameraReady(true);
                setCameraPreviewReady(false);
                startScanning();
              } else {
                Linking.openSettings();
              }
            }}
            style={styles.scanBtn}
          >
            <LinearGradient colors={['#1B8A3E', '#22C55E']} style={styles.scanBtnGrad}>
              <Icon name="camera" size={24} color="#FFF" />
              <Text style={styles.scanBtnText}>Autoriser la caméra</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ===== ARTICLE RESULT CARD - PREMIUM ===== */}
      {article && !assetMode && scanStatus === 'success' && (
        <View
          style={styles.resultCardContainer}
          onLayout={(event) => {
            quickActionsYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <ScanResultCard
            article={article}
            siteName={siteActif?.nom}
            actions={quickActionItems}
            onClose={handleReset}
            onNewScan={handleReset}
          />
        </View>
      )}

      {!assetMode && <Pressable
        onPress={() => setQuickMode((value) => !value)}
        style={[styles.quickModeToggle, quickMode && styles.quickModeToggleActive]}
        accessibilityRole="switch"
        accessibilityState={{ checked: quickMode }}
      >
        <Icon name="barcode-scan" size={16} color={quickMode ? '#FFFFFF' : '#8FA3B4'} />
        <Text style={[styles.quickModeText, quickMode && styles.quickModeTextActive]}>Scan rapide</Text>
        <Text style={[styles.quickModeHint, quickMode && styles.quickModeTextActive]}>{quickMode ? 'ON' : 'OFF'}</Text>
      </Pressable>}

      {/* Error retry */}
      {!assetMode && scanStatus === 'error' && (
        <Animated.View entering={FadeInUp.duration(300)}>
          <ScanErrorState message={errorMsg} onRetry={handleRetry} onReset={handleReset} />
        </Animated.View>
      )}

      </ScrollView>
      {/* fin darkOverlay */}

      {pcActionTransition ? (
        <View pointerEvents="none" style={styles.pcTransitionOverlay}>
          <Animated.View style={[styles.pcTransitionCard, actionTransitionStyle]}>
            <LinearGradient
              colors={pcActionTransition.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pcTransitionGradient}
            >
              <View style={styles.pcTransitionIconShell}>
                <View style={styles.pcTransitionIconInner}>
                  <Icon name={pcActionTransition.icon} size={26} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.pcTransitionEyebrow}>MISE A JOUR DU PC</Text>
              <Text style={styles.pcTransitionTitle}>{pcActionTransition.label}</Text>
              <Text style={styles.pcTransitionSubtitle}>Ouverture de la fiche avec le nouveau statut</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      ) : null}

      {/* ===== HISTORY MODAL ===== */}
      <Modal visible={showAssetHistory} transparent animationType="slide" onRequestClose={closeAssetHistory}>
        <View style={styles.assetSheetOverlay}>
          <View style={styles.assetSheet}>
            <View style={styles.assetSheetHeader}>
              <View style={styles.assetSheetTitleBlock}>
                <Text style={styles.assetSheetTitle}>Assets scannés</Text>
                <Text style={styles.assetSheetSubtitle} numberOfLines={1}>{article?.nom} · {effectiveSiteName}</Text>
              </View>
              <TouchableOpacity onPress={closeAssetHistory} style={styles.assetSheetClose} accessibilityRole="button" accessibilityLabel="Fermer l’historique">
                <Icon name="close" size={20} color={CA_THEME.textSecondary} />
              </TouchableOpacity>
            </View>
            {assetHistoryLoading ? (
              <View style={styles.assetSheetEmpty}><Text style={styles.assetSheetEmptyText}>Chargement des scans...</Text></View>
            ) : assetHistoryError ? (
              <View style={styles.assetSheetEmpty}><Text style={styles.assetFeedbackError}>{assetHistoryError}</Text></View>
            ) : (
              <FlatList
                data={assetHistory}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.assetSheetList}
                ListEmptyComponent={<Text style={styles.assetSheetEmptyText}>Aucun asset scanné pour cet article sur ce site.</Text>}
                renderItem={({ item }) => (
                  <View style={styles.assetSheetRow}>
                    <View style={[styles.assetSheetRowIcon, { backgroundColor: item.direction === 'entree' ? CA_THEME.greenBg : CA_THEME.dangerBg }]}>
                      <Icon name={item.direction === 'entree' ? 'arrow-down-bold' : 'arrow-up-bold'} size={16} color={item.direction === 'entree' ? CA_THEME.green : CA_THEME.danger} />
                    </View>
                    <View style={styles.assetSheetRowBody}>
                      <Text style={styles.assetSheetCode} numberOfLines={1}>{item.code}</Text>
                      <Text style={styles.assetSheetDate}>{new Date(item.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <Text style={[styles.assetSheetDirection, { color: item.direction === 'entree' ? CA_THEME.green : CA_THEME.danger }]}>{item.direction === 'entree' ? 'Entrée' : 'Sortie'}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <TouchableWithoutFeedback onPress={() => setShowHistory(false)}>
          <View style={styles.historyOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.historySheet}>
                <View style={styles.historyHandle} />
                <Text style={styles.historyTitle}>Historique des scans</Text>
                <Text style={styles.historySubtitle}>{history.length} scan{history.length !== 1 ? 's' : ''}</Text>

                <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                  {history.length === 0 ? (
                    <View style={styles.historyEmpty}>
                      <Icon name="barcode-off" size={40} color="#D1D5DB" />
                      <Text style={styles.historyEmptyText}>Aucun scan récent</Text>
                    </View>
                  ) : (
                    history.map((scan: ScanHistoryItem, idx: number) => (
                      <TouchableOpacity
                        key={`${scan.barcode}-${idx}`}
                        style={styles.historyItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          setShowHistory(false);
                          searchArticle(scan.barcode);
                        }}
                      >
                        <View style={[
                          styles.historyDot,
                          { backgroundColor: scan.found ? '#10B981' : '#EF4444' },
                        ]} />
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyBarcode}>{scan.barcode}</Text>
                          {scan.articleNom && (
                            <Text style={styles.historyArticle} numberOfLines={1}>{scan.articleNom}</Text>
                          )}
                        </View>
                        <View style={styles.historyRight}>
                          <Text style={styles.historyTime}>
                            {formatTimeParis(new Date(scan.timestamp))}
                          </Text>
                          <Icon
                            name={scan.found ? 'check-circle' : 'close-circle'}
                            size={16}
                            color={scan.found ? '#10B981' : '#EF4444'}
                          />
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  darkOverlayContent: {
    paddingBottom: 100,
    flexGrow: 1,
    width: '100%',
  },
  scanModeBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 12,
    width: '92%',
    maxWidth: 440,
    padding: 4,
    gap: 4,
    borderRadius: 8,
    backgroundColor: CA_THEME.white,
  },
  scanModeItem: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  scanModeLabel: {
    color: CA_THEME.textSecondary,
    fontFamily: CA_THEME.fontFamilySemiBold,
    fontSize: 11,
  },
  scanModeLabelActive: { color: CA_THEME.white },
  assetPanel: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: CA_THEME.white,
    borderRadius: 8,
    borderTopWidth: 4,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  assetPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assetModeIcon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  assetPanelHeading: { flex: 1, minWidth: 0 },
  assetEyebrow: { fontFamily: CA_THEME.fontFamilyBold, fontSize: 10, marginBottom: 4 },
  assetPanelTitle: { color: CA_THEME.textPrimary, fontFamily: CA_THEME.fontFamilyBold, fontSize: 15 },
  assetLocation: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14 },
  assetPanelSite: { color: CA_THEME.textSecondary, fontFamily: CA_THEME.fontFamilyMedium, fontSize: 12, flex: 1 },
  assetReference: { color: CA_THEME.greenText, fontFamily: CA_THEME.fontFamilyBold, fontSize: 11 },
  assetDone: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  assetCounts: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 16, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: CA_THEME.borderGray },
  assetCountDivider: { width: 1, height: 36, backgroundColor: CA_THEME.borderGray },
  assetCountValue: { color: CA_THEME.textPrimary, fontFamily: CA_THEME.fontFamilyBold, fontSize: 27, marginTop: 2 },
  assetCountLabel: { color: CA_THEME.textMuted, fontFamily: CA_THEME.fontFamilySemiBold, fontSize: 10 },
  assetFeedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 10, borderRadius: 6, backgroundColor: CA_THEME.greenBg },
  assetFeedbackRowError: { backgroundColor: CA_THEME.dangerBg },
  assetFeedback: { flex: 1, color: CA_THEME.greenText, fontFamily: CA_THEME.fontFamilySemiBold, fontSize: 12 },
  assetFeedbackError: { color: CA_THEME.dangerText },
  assetRecent: { color: CA_THEME.textSecondary, fontFamily: CA_THEME.fontFamilyMedium, fontSize: 11, marginTop: 10 },
  assetHistoryButton: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: CA_THEME.borderGray },
  assetHistoryButtonText: { flex: 1, color: CA_THEME.green, fontFamily: CA_THEME.fontFamilyBold, fontSize: 12 },
  assetSheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  assetSheet: { maxHeight: '78%', minHeight: 260, backgroundColor: CA_THEME.white, borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingBottom: 24 },
  assetSheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderColor: CA_THEME.borderGray },
  assetSheetTitleBlock: { flex: 1, minWidth: 0 },
  assetSheetTitle: { color: CA_THEME.textPrimary, fontFamily: CA_THEME.fontFamilyBold, fontSize: 18 },
  assetSheetSubtitle: { color: CA_THEME.textSecondary, fontFamily: CA_THEME.fontFamilyMedium, fontSize: 12, marginTop: 3 },
  assetSheetClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  assetSheetList: { paddingHorizontal: 20, paddingBottom: 20, flexGrow: 1 },
  assetSheetEmpty: { padding: 24 },
  assetSheetEmptyText: { color: CA_THEME.textSecondary, fontFamily: CA_THEME.fontFamilyMedium, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  assetSheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66, borderBottomWidth: 1, borderColor: CA_THEME.borderGray },
  assetSheetRowIcon: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  assetSheetRowBody: { flex: 1, minWidth: 0 },
  assetSheetCode: { color: CA_THEME.textPrimary, fontFamily: CA_THEME.fontFamilyBold, fontSize: 13 },
  assetSheetDate: { color: CA_THEME.textMuted, fontFamily: CA_THEME.fontFamilyMedium, fontSize: 11, marginTop: 3 },
  assetSheetDirection: { fontFamily: CA_THEME.fontFamilyBold, fontSize: 11 },
  resultCardContainer: {
    width: '100%',
  },
  quickModeToggle: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(143,163,180,0.35)',
    backgroundColor: 'rgba(13,22,41,0.75)',
  },
  quickModeToggleActive: {
    borderColor: '#22C55E',
    backgroundColor: '#1B8A3E',
  },
  quickModeText: { color: '#D6E0EA', fontSize: 12, fontWeight: '700' },
  quickModeTextActive: { color: '#FFFFFF' },
  quickModeHint: { color: '#8FA3B4', fontSize: 10, fontWeight: '800' },
  cameraWrapper: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
  },

  // ===== CAMERA OVERLAY =====
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cameraHint: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
  },
  cameraFrame: {
    marginTop: SCREEN_H * 0.08,
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerBtn: {},
  headerBtnBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,125,112,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,125,112,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },

  // ===== FRAME =====
  frameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SCREEN_H * 0.06,
  },
  frameFlash: {
    position: 'absolute',
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  frameGlow: {
    position: 'absolute',
    width: FRAME_SIZE + 60,
    height: FRAME_SIZE + 60,
    borderRadius: (FRAME_SIZE + 60) / 2,
    backgroundColor: 'rgba(59,130,246,0.06)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 0,
  },
  frameOuter: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 3.5,
    borderColor: '#60A5FA',
  },
  cTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  cTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  cBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  cBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },

  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 3,
    top: 5,
  },
  scanLineGrad: {
    flex: 1,
    borderRadius: 2,
  },

  centerIcon: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== STATUS =====
  statusArea: {
    alignItems: 'center',
    marginTop: 28,
    minHeight: 28,
    paddingHorizontal: 32,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  statusPanel: {
    alignItems: 'center',
    maxWidth: 420,
  },
  statusTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  camRecoverBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  camRecoverBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A5A55',
    letterSpacing: 0.2,
  },

  // ===== SCAN BUTTON =====
  scanBtnWrapper: {
    paddingHorizontal: 32,
    marginTop: 32,
  },
  scanBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  scanBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 16,
    gap: 12,
  },
  scanBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  permissionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  permissionHintText: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '500',
  },

  // ===== RESULT =====
  // ===== RESULT AREA - PREMIUM =====
  resultArea: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  resultAura: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: -8,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(14,165,233,0.18)',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 0,
  },
  resultCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,125,112,0.24)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  resultAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
  },
  resultTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultFoundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(34,211,238,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.28)',
  },
  resultFoundPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#67E8F9',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  resultSitePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,125,112,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,125,112,0.12)',
  },
  resultSitePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    maxWidth: 130,
  },
  resultCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultPhotoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  resultPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resultPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  resultIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 14,
  },
  resultIconGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  resultIconInner: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59,130,246,0.20)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.24)',
  },
  resultRefText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },
  resultName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  resultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  resultMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,125,112,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,125,112,0.24)',
  },
  resultMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  resultClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,125,112,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultDivider: {
    height: 1,
    marginVertical: 16,
    backgroundColor: 'rgba(0,125,112,0.28)',
    borderRadius: 1,
  },
  resultStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultStockLeft: {},
  resultStockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  resultStockValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  resultStockValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  resultStockUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
  },
  resultStockRight: {
    alignItems: 'flex-end',
  },
  resultStockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  resultStockIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  resultStockMinText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(239,68,68,0.7)',
    marginTop: 4,
  },

  // ===== QUICK ACTIONS - PREMIUM =====
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  qAction: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  qActionGrad: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 19,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,125,112,0.12)',
  },
  qActionDisabled: {
    opacity: 0.45,
  },
  qActionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qActionIconInner: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pcTransitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pcTransitionCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 18,
  },
  pcTransitionGradient: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pcTransitionIconShell: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: 'rgba(0,125,112,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pcTransitionIconInner: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(0,125,112,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcTransitionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  pcTransitionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  pcTransitionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },

  // ===== NEW SCAN - PREMIUM =====
  newScanBtn: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  newScanBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.15)',
    gap: 10,
  },
  newScanText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.3,
  },

  // ===== ERROR =====
  errorActions: {
    paddingHorizontal: 32,
    marginTop: 24,
  },
  retryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  retryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 10,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },

  // ===== HISTORY MODAL =====
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  historySheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '65%',
  },
  historyHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  historySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    marginBottom: 16,
  },
  historyList: {
    maxHeight: 320,
  },
  historyEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  historyEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyInfo: {
    flex: 1,
  },
  historyBarcode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  historyArticle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

export default ScanMouvementScreen;
