// ============================================
// SCAN MOUVEMENT SCREEN - Premium Design
// IT-Inventory Application
// ============================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,
  Dimensions,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
  useCameraPermission,
  type CodeType,
} from 'react-native-vision-camera';
import { useAppSelector, useAppDispatch } from '@/store';
import { clearScannedArticle, clearLastBarcode, setBarcode, addToHistoryAndSave, loadScanHistory, persistScanHistory, ScanHistoryItem } from '@/store/slices/scanSlice';
import { useBarcodeScanner } from '@/modules/DataWedgeModule';
import { articleRepository } from '@/database';
import { formatTimeParis } from '@/utils/dateUtils';
import { Article } from '@/types';
import { useResponsive } from '@/utils/responsive';

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
  const dispatch = useAppDispatch();
  const { startScanning } = useBarcodeScanner();
  const { isTablet } = useResponsive();

  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back') ?? devices.find(d => d.position === 'front') ?? devices[0];

  const siteActif = useAppSelector(state => state.site.siteActif);
  const { lastBarcode, isScanning, history } = useAppSelector(state => state.scan);

  const [article, setArticle] = useState<Article | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraReadyRef = useRef(false);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);
  const isProcessingRef = useRef(false);

  // Charger l'historique des scans depuis AsyncStorage au montage
  useEffect(() => {
    dispatch(loadScanHistory());
  }, [dispatch]);

  // Réinitialiser l'état du scan quand l'écran reçoit le focus
  useFocusEffect(
    useCallback(() => {
      // Reset tout l'état local
      setArticle(null);
      setScanStatus('idle');
      setErrorMsg('');
      scanConsensusRef.current = { value: '', count: 0 };
      lastScannedRef.current = null;
      isProcessingRef.current = false;
      // Reset l'état Redux
      dispatch(clearScannedArticle());
      dispatch(clearLastBarcode());
    }, [dispatch])
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
            cameraReadyRef.current = true;
            startScanning();
          }
        } else if (device) {
          setCameraReady(true);
          cameraReadyRef.current = true;
          startScanning();
        }
      } catch (err) {
        console.warn('[Scan] Erreur init caméra:', err);
      }
    };
    initCamera();
  }, [hasPermission, device, requestPermission, startScanning]);

  // Scan line animation
  const scanLineY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Scan line loops
    scanLineY.value = withRepeat(
      withTiming(FRAME_SIZE - 10, { duration: 2200, easing: Easing.linear }),
      -1,
      false,
    );
    // Pulse corners
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, [scanLineY, pulseScale]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const frameAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // ===== Camera code scanner (validation par consensus) =====
  const scanConsensusRef = useRef<{ value: string; count: number }>({ value: '', count: 0 });
  const SCAN_CONSENSUS_THRESHOLD = 3;

  const onCodeScanned = useCallback(
    (codes: { value?: string }[]) => {
      try {
        // Utiliser la ref pour éviter la closure obsolète
        if (!cameraReadyRef.current || isProcessingRef.current) return;
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
      } catch (err) {
        console.warn('[Scan] Erreur dans onCodeScanned:', err);
      }
    },
    [dispatch],
  );

  const codeScanner = useCodeScanner({
    codeTypes: BARCODE_TYPES,
    onCodeScanned,
  });

  // ===== Search article on scan =====
  const searchArticle = useCallback(async (barcode: string) => {
    if (!siteActif) {
      console.warn('[Scan] Pas de site actif, recherche impossible');
      isProcessingRef.current = false;
      return;
    }
    setScanStatus('scanning');
    setArticle(null);
    setErrorMsg('');

    try {
      console.log('[Scan] Recherche article pour code-barres:', barcode);
      const result = await articleRepository.findByReference(barcode, siteActif.id);
      if (result) {
        console.log('[Scan] Article trouvé:', result.nom);
        setArticle(result);
        setScanStatus('success');
        Vibration.vibrate(50);
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
        setErrorMsg(`Article non trouvé : ${barcode}`);
        Vibration.vibrate(50);
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
      Vibration.vibrate(50);
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
  }, [siteActif, dispatch]);

  useEffect(() => {
    if (lastBarcode && siteActif) {
      searchArticle(lastBarcode).catch(() => {});
    }
  }, [lastBarcode, siteActif, searchArticle]);

  // ===== Actions =====

  const handleMouvement = (type: 'entree' | 'sortie') => {
    if (!article) return;
    Vibration.vibrate(10);
    navigation.navigate('Mouvements', {
      screen: 'MouvementForm',
      params: { articleId: article.id, type },
    });
  };

  const handleViewDetails = () => {
    if (!article) return;
    Vibration.vibrate(10);
    navigation.navigate('Articles', {
      screen: 'ArticleDetail',
      params: { articleId: article.id },
    });
  };

  const handleReset = useCallback(() => {
    setArticle(null);
    setScanStatus('idle');
    setErrorMsg('');
    // Réinitialiser le buffer de consensus pour permettre un nouveau scan
    scanConsensusRef.current = { value: '', count: 0 };
    lastScannedRef.current = null;
    isProcessingRef.current = false;
    dispatch(clearScannedArticle());
    dispatch(clearLastBarcode());
  }, [dispatch]);

  // Réessayer la recherche avec le dernier code scanné
  const handleRetry = useCallback(() => {
    if (lastBarcode) {
      searchArticle(lastBarcode).catch(() => {});
    } else {
      handleReset();
    }
  }, [lastBarcode, searchArticle, handleReset]);

  const isLowStock = article && (article.quantiteActuelle ?? 0) < article.stockMini;

  // Corner color
  const cornerColor =
    scanStatus === 'success' ? '#10B981' :
    scanStatus === 'error' ? '#EF4444' : '#60A5FA';

  // ==================== RENDER ====================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ===== CAMERA LIVE (toujours en fond) ===== */}
      {hasPermission && device && cameraReady ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={cameraReady && !article}
          {...(!article ? { codeScanner } : {})}
          photo={false}
          video={false}
          audio={false}
          onError={(error) => {
            console.warn('[Scan] Camera error:', error);
          }}
        />
      ) : (
        <PremiumBackground />
      )}

      {/* ===== OVERLAY SOMBRE SEMI-TRANSPARENT ===== */}
      <ScrollView
        style={styles.darkOverlay}
        contentContainerStyle={styles.darkOverlayContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

      {/* ===== HEADER ===== */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => { Vibration.vibrate(10); navigation.goBack(); }}>
          <View style={styles.headerBtnBg}>
            <Icon name="arrow-left" size={22} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => { Vibration.vibrate(10); setShowHistory(true); }}
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

      {/* ===== SCAN FRAME ===== */}
      <View style={[styles.frameWrapper, isTablet && { alignSelf: 'center' }]}>
        <Animated.View style={[styles.frameOuter, frameAnimStyle]}>
          {/* 4 corners */}
          <View style={[styles.corner, styles.cTL, { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.cTR, { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.cBL, { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.cBR, { borderColor: cornerColor }]} />

          {/* Scan line */}
          {scanStatus !== 'success' && scanStatus !== 'error' && (
            <Animated.View style={[styles.scanLine, scanLineStyle]}>
              <LinearGradient
                colors={['transparent', '#3B82F6', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanLineGrad}
              />
            </Animated.View>
          )}

          {/* Center icon */}
          {scanStatus === 'success' && (
            <Animated.View entering={ZoomIn.duration(300)} style={styles.centerIcon}>
              <Icon name="check-circle" size={64} color="#10B981" />
            </Animated.View>
          )}
          {scanStatus === 'error' && (
            <Animated.View entering={ZoomIn.duration(300)} style={styles.centerIcon}>
              <Icon name="close-circle" size={64} color="#EF4444" />
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* ===== INSTRUCTION / STATUS ===== */}
      <View style={styles.statusArea}>
        {scanStatus === 'idle' && !isScanning && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statusRow}>
            <Icon name="barcode-scan" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.statusText}>Positionnez le code-barres dans le cadre</Text>
          </Animated.View>
        )}
        {(scanStatus === 'idle' && isScanning) && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statusRow}>
            <Icon name="loading" size={18} color="#60A5FA" />
            <Text style={[styles.statusText, { color: '#60A5FA' }]}>Lecture en cours...</Text>
          </Animated.View>
        )}
        {scanStatus === 'scanning' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.statusRow}>
            <Icon name="loading" size={18} color="#60A5FA" />
            <Text style={[styles.statusText, { color: '#60A5FA' }]}>Recherche de l'article...</Text>
          </Animated.View>
        )}
        {scanStatus === 'success' && article && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.statusRow}>
            <Icon name="check-circle" size={18} color="#10B981" />
            <Text style={[styles.statusText, { color: '#10B981' }]}>Article trouvé !</Text>
          </Animated.View>
        )}
        {scanStatus === 'error' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.statusRow}>
            <Icon name="alert-circle" size={18} color="#EF4444" />
            <Text style={[styles.statusText, { color: '#EF4444' }]}>{errorMsg}</Text>
          </Animated.View>
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
                startScanning();
              } else {
                Linking.openSettings();
              }
            }}
            style={styles.scanBtn}
          >
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.scanBtnGrad}>
              <Icon name="camera" size={24} color="#FFF" />
              <Text style={styles.scanBtnText}>Autoriser la caméra</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ===== ARTICLE RESULT CARD - PREMIUM ===== */}
      {article && scanStatus === 'success' && (
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.resultArea}>
          {/* Carte principale glassmorphism */}
          <View style={styles.resultCard}>
            {/* Glow background */}
            <LinearGradient
              colors={['rgba(59,130,246,0.12)', 'rgba(139,92,246,0.06)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Header avec photo ou icône */}
            <View style={styles.resultCardTop}>
              {article.photoUrl ? (
                <Animated.View entering={ZoomIn.delay(200).duration(400)} style={styles.resultPhotoWrapper}>
                  <Image source={{ uri: article.photoUrl }} style={styles.resultPhoto} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.resultPhotoOverlay}
                  />
                </Animated.View>
              ) : (
                <Animated.View entering={ZoomIn.delay(200).duration(400)} style={styles.resultIconCircle}>
                  <LinearGradient
                    colors={['rgba(59,130,246,0.2)', 'rgba(139,92,246,0.15)']}
                    style={styles.resultIconGrad}
                  >
                    <Icon name="package-variant-closed" size={26} color="#60A5FA" />
                  </LinearGradient>
                </Animated.View>
              )}

              <View style={styles.resultInfo}>
                <View style={styles.resultRefRow}>
                  <View style={styles.resultRefBadge}>
                    <Icon name="barcode" size={12} color="#60A5FA" />
                    <Text style={styles.resultRefText}>{article.reference}</Text>
                  </View>
                  <TouchableOpacity style={styles.resultClose} onPress={handleReset}>
                    <Icon name="close" size={14} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.resultName} numberOfLines={2}>{article.nom}</Text>

                {/* Infos compactes : marque / catégorie */}
                <View style={styles.resultMeta}>
                  {article.marque ? (
                    <View style={styles.resultMetaChip}>
                      <Icon name="tag-outline" size={11} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.resultMetaText}>{article.marque}</Text>
                    </View>
                  ) : null}
                  {article.categorieNom ? (
                    <View style={styles.resultMetaChip}>
                      <Icon name="shape-outline" size={11} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.resultMetaText}>{article.categorieNom}</Text>
                    </View>
                  ) : null}
                  {article.emplacement ? (
                    <View style={styles.resultMetaChip}>
                      <Icon name="map-marker-outline" size={11} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.resultMetaText}>{article.emplacement}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Séparateur lumineux */}
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.resultDivider}
            />

            {/* Stock display premium */}
            <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.resultStockRow}>
              <View style={styles.resultStockLeft}>
                <Text style={styles.resultStockLabel}>Stock actuel</Text>
                <View style={styles.resultStockValueRow}>
                  <Text style={[
                    styles.resultStockValue,
                    { color: isLowStock ? '#EF4444' : '#10B981' },
                  ]}>
                    {article.quantiteActuelle ?? 0}
                  </Text>
                  <Text style={styles.resultStockUnit}>{article.unite}</Text>
                </View>
              </View>
              <View style={styles.resultStockRight}>
                <View style={[
                  styles.resultStockIndicator,
                  { backgroundColor: isLowStock ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)' },
                ]}>
                  <Icon
                    name={isLowStock ? 'trending-down' : 'trending-up'}
                    size={16}
                    color={isLowStock ? '#EF4444' : '#10B981'}
                  />
                  <Text style={[
                    styles.resultStockIndicatorText,
                    { color: isLowStock ? '#EF4444' : '#10B981' },
                  ]}>
                    {isLowStock ? 'Stock bas' : 'En stock'}
                  </Text>
                </View>
                {isLowStock && (
                  <Text style={styles.resultStockMinText}>
                    Min. {article.stockMini} {article.unite}
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Quick Actions - design premium */}
          <Animated.View entering={FadeInUp.delay(250).duration(400)} style={styles.quickActions}>
            <TouchableOpacity
              style={styles.qAction}
              activeOpacity={0.8}
              onPress={() => handleMouvement('entree')}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.qActionGrad}
              >
                <View style={styles.qActionIconWrap}>
                  <Icon name="arrow-up-bold" size={24} color="#FFF" />
                </View>
                <Text style={styles.qActionLabel}>Entrée</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qAction}
              activeOpacity={0.8}
              onPress={() => handleMouvement('sortie')}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.qActionGrad}
              >
                <View style={styles.qActionIconWrap}>
                  <Icon name="arrow-down-bold" size={24} color="#FFF" />
                </View>
                <Text style={styles.qActionLabel}>Sortie</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qAction}
              activeOpacity={0.8}
              onPress={handleViewDetails}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.qActionGrad}
              >
                <View style={styles.qActionIconWrap}>
                  <Icon name="eye-outline" size={24} color="#FFF" />
                </View>
                <Text style={styles.qActionLabel}>Détails</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* New scan button premium */}
          <Animated.View entering={FadeInUp.delay(350).duration(400)}>
            <TouchableOpacity style={styles.newScanBtn} activeOpacity={0.8} onPress={handleReset}>
              <LinearGradient
                colors={['#1E293B', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newScanBtnGrad}
              >
                <Icon name="barcode-scan" size={20} color="#60A5FA" />
                <Text style={styles.newScanText}>Nouveau scan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      {/* Error retry */}
      {scanStatus === 'error' && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.errorActions}>
          <TouchableOpacity style={styles.retryBtn} activeOpacity={0.7} onPress={handleRetry}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.retryBtnGrad}>
              <Icon name="refresh" size={20} color="#FFF" />
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.retryBtn, { marginTop: 10 }]} activeOpacity={0.7} onPress={handleReset}>
            <View style={[styles.retryBtnGrad, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Icon name="barcode-scan" size={20} color="#FFF" />
              <Text style={styles.retryBtnText}>Scanner à nouveau</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      </ScrollView>
      {/* fin darkOverlay */}

      {/* ===== HISTORY MODAL ===== */}
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
  },
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  resultCard: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  resultCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultPhotoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
  },
  resultIconGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: 16,
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
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultRefText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },
  resultName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    letterSpacing: 0.2,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  resultMetaText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  resultClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultDivider: {
    height: 1,
    marginVertical: 16,
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
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resultStockIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginTop: 14,
    gap: 10,
  },
  qAction: {
    flex: 1,
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
    paddingVertical: 18,
    borderRadius: 18,
  },
  qActionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ===== NEW SCAN - PREMIUM =====
  newScanBtn: {
    marginTop: 14,
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
    borderColor: 'rgba(96,165,250,0.2)',
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
