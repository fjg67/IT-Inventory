import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Camera, useCameraDevices, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store';
import { articleRepository, mouvementRepository, stockRepository } from '@/database';
import { showAlert } from '@/store/slices/uiSlice';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { Article, StockSite, TransfertForm } from '@/types';
import { validateTransfertForm } from '@/utils';
import { useArticleSearch } from '@/hooks/useArticleSearch';
import { MOVEMENT_COLORS, MOVEMENT_IDENTITIES } from '@/components/movement';
import { MovementSubmitButton } from '@/components/movement/MovementSubmitButton';
import { TransfertHeader, TransfertPreview, TransfertSiteConnector } from '@/components/transfert';

const BARCODE_TYPES = [
  'ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93',
  'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec',
] as const;

const SCAN_FRAME = 240;

export const TransfertScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const initialArticleId = route.params?.articleId as number | undefined;

  const siteActif = useAppSelector((state) => state.site.siteActif);
  const sitesDisponibles = useAppSelector((state) => state.site.sitesDisponibles);
  const childSites = useAppSelector((state) => state.site.childSites);
  const technicien = useAppSelector((state) => state.auth.currentTechnicien);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);

  const transferSites = childSites.length > 0 ? childSites : sitesDisponibles;
  const identity = MOVEMENT_IDENTITIES.transfert;

  const [article, setArticle] = useState<Article | null>(null);
  const [stockDepart, setStockDepart] = useState<StockSite | null>(null);
  const [siteDepartId, setSiteDepartId] = useState<number | null>(siteActif?.id as number ?? null);
  const [siteArriveeId, setSiteArriveeId] = useState<number | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [commentaire, setCommentaire] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const search = useArticleSearch(effectiveSiteId, 200);

  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];
  const showCameraRef = useRef(false);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);

  const loadStockDepart = useCallback(async (articleId: number, siteId: number) => {
    try {
      const stock = await stockRepository.findByArticleAndSite(articleId, siteId);
      setStockDepart(stock);
    } catch {
      setStockDepart(null);
    }
  }, []);

  useEffect(() => {
    if (article && siteDepartId) {
      loadStockDepart(article.id as number, siteDepartId);
    }
  }, [article, loadStockDepart, siteDepartId]);

  useEffect(() => {
    if (!initialArticleId || !siteDepartId) return;
    articleRepository.findById(initialArticleId, siteDepartId).then((result) => {
      if (result) setArticle(result);
    }).catch(() => {});
  }, [initialArticleId, siteDepartId]);

  const handleScannedBarcode = useCallback(async (barcode: string) => {
    if (!effectiveSiteId) return;
    try {
      const result = await articleRepository.findByReferenceOrBarcode(barcode, effectiveSiteId);
      if (result) {
        setArticle(result);
        search.reset();
        setErrors({});
      } else {
        const broader = await articleRepository.search(effectiveSiteId, { searchQuery: barcode, stockFaible: false }, 0, 8);
        if (broader.data.length === 1) {
          setArticle(broader.data[0]);
          search.reset();
          setErrors({});
        } else if (broader.data.length > 1) {
          search.setQuery(barcode);
          search.setResults(broader.data);
          setErrors({});
        } else {
          setErrors({ article: `Article non trouve : ${barcode}` });
        }
      }
    } catch {
      setErrors({ article: 'Erreur lors de la recherche' });
    }
  }, [effectiveSiteId, search]);

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

    Vibration.vibrate([0, 30, 60, 30]);
    setShowCamera(false);
    handleScannedBarcode(value);
  }, [handleScannedBarcode]);

  const codeScanner = useCodeScanner({
    codeTypes: [...BARCODE_TYPES],
    onCodeScanned,
  });

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

  const sitesArrivee = useMemo(() => transferSites.filter((s) => Number(s.id) !== Number(siteDepartId)), [siteDepartId, transferSites]);

  const getSiteName = useCallback((siteId: number | null) => {
    if (!siteId) return 'Site inconnu';
    const site = transferSites.find((s) => Number(s.id) === Number(siteId));
    return site?.nom ?? 'Site inconnu';
  }, [transferSites]);

  const canSubmit = !!article && !!siteDepartId && !!siteArriveeId && quantite > 0 && !isSubmitting;

  const submit = async () => {
    if (!article || !siteDepartId || !siteArriveeId || !technicien) return;

    const validation = validateTransfertForm({
      articleId: article.id,
      siteDepartId,
      siteArriveeId,
      quantite,
      commentaire,
    }, stockDepart?.quantiteActuelle ?? 0);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: TransfertForm = {
        articleId: article.id,
        siteDepartId,
        siteArriveeId,
        quantite,
        commentaire: commentaire.trim() || undefined,
      };

      await mouvementRepository.createTransfert(payload, technicien.id);

      dispatch(showAlert({
        type: 'success',
        title: 'Transfert effectue',
        message: SUCCESS_MESSAGES.TRANSFERT_CREATED,
      }));

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      dispatch(showAlert({ type: 'error', title: 'Erreur', message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!initialArticleId) {
        setArticle(null);
        setStockDepart(null);
        setSiteDepartId(siteActif?.id as number ?? null);
        setSiteArriveeId(null);
        setQuantite(1);
        setCommentaire('');
        setErrors({});
        search.reset();
      }
    }, [initialArticleId, search, siteActif?.id]),
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MOVEMENT_COLORS.bg_primary} />

      <TransfertHeader onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionTitleRow}>
            <View style={[styles.accent, { backgroundColor: identity.color }]} />
            <Text style={styles.sectionTitle}>Rechercher un article</Text>
          </View>

          <View style={styles.searchBox}>
            <Icon name="magnify" size={20} color={MOVEMENT_COLORS.text_muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nom, reference ou code-barres..."
              placeholderTextColor={MOVEMENT_COLORS.text_dim}
              value={search.query}
              onChangeText={search.onChangeQuery}
            />
            {search.searching ? <ActivityIndicator size="small" color={identity.color} /> : null}
          </View>

          <TouchableOpacity style={styles.scanBtn} onPress={openScanner} activeOpacity={0.88}>
            <Icon name="barcode-scan" size={18} color="#FFF" />
            <Text style={styles.scanBtnText}>Scanner un code-barres</Text>
          </TouchableOpacity>
          <Text style={styles.searchHint}>Tapez au moins 2 caracteres pour rechercher</Text>

          {search.results.length > 0 ? (
            <View style={styles.resultsWrap}>
              {search.results.map((a) => (
                <TouchableOpacity key={String(a.id)} style={styles.resultRow} onPress={() => { setArticle(a); setErrors({}); search.reset(); }}>
                  <View style={styles.resultIcon}><Icon name="package-variant-closed" size={16} color={identity.color} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultRef}>{a.reference}</Text>
                    <Text style={styles.resultName} numberOfLines={1}>{a.nom}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {errors.article ? <Text style={styles.errorText}>{errors.article}</Text> : null}

          {article ? (
            <View style={styles.articleSelectedCard}>
              <Text style={styles.articleTitle}>{article.nom}</Text>
              <Text style={styles.articleSub}>Stock: {stockDepart?.quantiteActuelle ?? 0} {article.unite}</Text>
            </View>
          ) : null}

          <TransfertSiteConnector />

          <View style={styles.sectionTitleRow}>
            <View style={[styles.accent, { backgroundColor: identity.color }]} />
            <Text style={styles.sectionTitle}>Site de depart</Text>
          </View>
          <View style={styles.grid}>
            {transferSites.map((site) => {
              const selected = Number(site.id) === Number(siteDepartId);
              return (
                <TouchableOpacity
                  key={String(site.id)}
                  style={[styles.siteChip, selected && styles.siteChipSelected]}
                  onPress={() => { setSiteDepartId(Number(site.id)); Vibration.vibrate(10); }}
                >
                  <Text style={[styles.siteChipText, selected && styles.siteChipTextSelected]} numberOfLines={1}>{site.nom}</Text>
                  {selected ? <Icon name="check-circle" size={14} color={identity.color} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionTitleRow}>
            <View style={[styles.accent, { backgroundColor: identity.color }]} />
            <Text style={styles.sectionTitle}>Site de destination</Text>
          </View>
          <View style={styles.grid}>
            {transferSites.map((site) => {
              const disabled = Number(site.id) === Number(siteDepartId);
              const selected = Number(site.id) === Number(siteArriveeId);
              return (
                <TouchableOpacity
                  key={String(site.id)}
                  style={[styles.siteChip, selected && styles.siteChipSelected, disabled && styles.siteChipDisabled]}
                  disabled={disabled}
                  onPress={() => { setSiteArriveeId(Number(site.id)); Vibration.vibrate(10); }}
                >
                  <Text style={[styles.siteChipText, selected && styles.siteChipTextSelected]} numberOfLines={1}>{site.nom}</Text>
                  {selected ? <Icon name="check-circle" size={14} color={identity.color} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionTitleRow}>
            <View style={[styles.accent, { backgroundColor: identity.color }]} />
            <Text style={styles.sectionTitle}>Quantite a transferer</Text>
          </View>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantite((q) => Math.max(1, q - 1))}>
              <Icon name="minus" size={20} color={MOVEMENT_COLORS.text_primary} />
            </TouchableOpacity>
            <View style={styles.qtyValueWrap}><Text style={styles.qtyValue}>{quantite}</Text></View>
            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnPlus]} onPress={() => setQuantite((q) => q + 1)}>
              <Icon name="plus" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionTitleRow}>
            <View style={[styles.accent, { backgroundColor: identity.color }]} />
            <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
          </View>
          <View style={styles.commentBox}>
            <TextInput
              style={styles.commentInput}
              multiline
              value={commentaire}
              onChangeText={setCommentaire}
              placeholder="Motif, precision..."
              placeholderTextColor={MOVEMENT_COLORS.text_dim}
            />
          </View>

          {article && siteDepartId && siteArriveeId ? (
            <TransfertPreview
              article={article}
              fromSite={getSiteName(siteDepartId)}
              toSite={getSiteName(siteArriveeId)}
              qty={quantite}
              fromBefore={stockDepart?.quantiteActuelle ?? 0}
              fromAfter={Math.max(0, (stockDepart?.quantiteActuelle ?? 0) - quantite)}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <MovementSubmitButton
        identity={identity}
        disabled={!canSubmit}
        loading={isSubmitting}
        label="Valider le transfert"
        onPress={submit}
        bottomInset={insets.bottom}
      />

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
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.cameraClose} onPress={() => setShowCamera(false)}>
              <Icon name="close" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.cameraFrame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TransfertScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MOVEMENT_COLORS.bg_primary,
  },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitleRow: {
    marginTop: 14,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '700',
  },
  searchBox: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.45)',
    backgroundColor: MOVEMENT_COLORS.bg_card,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 14,
  },
  scanBtn: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  scanBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  searchHint: {
    marginTop: 7,
    color: MOVEMENT_COLORS.text_dim,
    fontSize: 11,
  },
  resultsWrap: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.28)',
  },
  resultRow: {
    minHeight: 50,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: MOVEMENT_COLORS.bg_card_elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRef: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  resultName: {
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 6,
    color: MOVEMENT_COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  articleSelectedCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: 'rgba(139,92,246,0.10)',
    padding: 12,
  },
  articleTitle: {
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '700',
  },
  articleSub: {
    marginTop: 4,
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  siteChip: {
    width: '50%',
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    marginBottom: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  siteChipSelected: {
    borderColor: 'rgba(139,92,246,0.45)',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  siteChipDisabled: {
    opacity: 0.4,
  },
  siteChipText: {
    flex: 1,
    color: MOVEMENT_COLORS.text_muted,
    fontSize: 13,
    fontWeight: '600',
  },
  siteChipTextSelected: {
    color: '#A78BFA',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnPlus: {
    borderColor: 'rgba(139,92,246,0.45)',
    backgroundColor: '#8B5CF6',
  },
  qtyValueWrap: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 28,
    fontWeight: '800',
  },
  commentBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    minHeight: 90,
    padding: 12,
  },
  commentInput: {
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 14,
    minHeight: 58,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 50,
    alignItems: 'center',
  },
  cameraClose: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    marginTop: 120,
    width: SCAN_FRAME,
    height: SCAN_FRAME,
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderWidth: 4,
    borderColor: '#8B5CF6',
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
});
