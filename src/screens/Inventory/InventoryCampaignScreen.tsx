import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, useCameraDevices, useCameraPermission, useCodeScanner, type CodeType } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearLastBarcode } from '@/store/slices/scanSlice';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { useBarcodeScanner } from '@/modules/DataWedgeModule';
import inventoryCampaignService, {
  InventoryCampaign,
  summarizeCampaign,
} from '@/services/inventoryCampaignService';

const BARCODE_TYPES: CodeType[] = ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'qr', 'data-matrix'];

export const InventoryCampaignScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const site = useAppSelector(state => state.site.siteActif);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const lastBarcode = useAppSelector(state => state.scan.lastBarcode);
  const { startScanning, stopScanning } = useBarcodeScanner();
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find(item => item.position === 'back') ?? devices[0];

  const [campaign, setCampaign] = useState<InventoryCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanMessage, setScanMessage] = useState('Prêt à scanner');
  const [manualCode, setManualCode] = useState('');
  const [signatureVisible, setSignatureVisible] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [validating, setValidating] = useState(false);
  const lastProcessedRef = useRef<{ value: string; at: number } | null>(null);

  const summary = useMemo(() => campaign ? summarizeCampaign(campaign) : null, [campaign]);
  const progress = summary && summary.totalLines > 0 ? summary.scannedLines / summary.totalLines : 0;

  const processScan = useCallback(async (value: string) => {
    const identifier = value.trim();
    if (!identifier || !effectiveSiteId) return;
    const now = Date.now();
    if (lastProcessedRef.current?.value === identifier && now - lastProcessedRef.current.at < 1200) return;
    lastProcessedRef.current = { value: identifier, at: now };

    try {
      const result = await inventoryCampaignService.recordScan(effectiveSiteId, identifier);
      setCampaign(result.campaign);
      setScanMessage(result.unknown
        ? `Code inconnu : ${identifier}`
        : `${result.line?.name ?? 'Article'} compté (${result.line?.countedQuantity ?? 0})`);
      dispatch(clearLastBarcode());
    } catch (error) {
      setScanMessage((error as Error).message || 'Impossible d’enregistrer le scan');
    }
  }, [dispatch, effectiveSiteId]);

  useEffect(() => {
    if (!effectiveSiteId || !site) return;
    let cancelled = false;
    setLoading(true);
    inventoryCampaignService.start(effectiveSiteId, site.nom)
      .then(value => { if (!cancelled) setCampaign(value); })
      .catch(error => { if (!cancelled) setScanMessage(error.message || 'Impossible de charger la campagne'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [effectiveSiteId, site]);

  useEffect(() => {
    if (lastBarcode) processScan(lastBarcode).catch(() => {});
  }, [lastBarcode, processScan]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch(() => {});
    }
    startScanning();
    return () => stopScanning();
  }, [hasPermission, requestPermission, startScanning, stopScanning]);

  const codeScanner = useCodeScanner({
    codeTypes: BARCODE_TYPES,
    onCodeScanned: codes => {
      const value = codes[0]?.value;
      if (value) processScan(value).catch(() => {});
    },
  });

  const handleManualSubmit = () => {
    processScan(manualCode).catch(() => {});
    setManualCode('');
  };

  const validateCampaign = async () => {
    if (!effectiveSiteId) return;
    setValidating(true);
    try {
      const validated = await inventoryCampaignService.validate(effectiveSiteId, signatureName);
      setCampaign(validated);
      setSignatureVisible(false);
      await inventoryCampaignService.generateGapReport(validated);
      Alert.alert('Inventaire validé', 'Le rapport d’écarts a été généré.');
    } catch (error) {
      Alert.alert('Validation impossible', (error as Error).message);
    } finally {
      setValidating(false);
    }
  };

  if (loading || !campaign || !summary) {
    return <SafeAreaView style={styles.center}><Text style={styles.loading}>Préparation de l’inventaire...</Text></SafeAreaView>;
  }

  const isValidated = campaign.status === 'validated';
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Retour">
            <Icon name="arrow-left" size={22} color="#17352A" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>INVENTAIRE GUIDÉ</Text>
            <Text style={styles.title}>{campaign.siteName}</Text>
          </View>
          <View style={[styles.status, isValidated && styles.statusValidated]}><Text style={styles.statusText}>{isValidated ? 'VALIDÉ' : 'EN COURS'}</Text></View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}><Text style={styles.progressValue}>{summary.scannedLines} / {summary.totalLines}</Text><Text style={styles.progressLabel}>lignes contrôlées</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} /></View>
          <Text style={styles.progressHint}>{summary.countedUnits} unité(s) comptée(s) sur {summary.expectedUnits} attendue(s)</Text>
        </View>

        {!isValidated && hasPermission && device ? (
          <View style={styles.cameraCard}>
            <Camera style={styles.camera} device={device} isActive={!isValidated} codeScanner={codeScanner} />
            <View style={styles.cameraOverlay}><Icon name="barcode-scan" size={34} color="#FFFFFF" /><Text style={styles.cameraText}>Scannez une référence ou un code-barres</Text></View>
          </View>
        ) : null}

        {!isValidated ? (
          <View style={styles.manualRow}>
            <TextInput value={manualCode} onChangeText={setManualCode} onSubmitEditing={handleManualSubmit} placeholder="Saisie manuelle" placeholderTextColor="#82948A" style={styles.input} returnKeyType="done" />
            <Pressable onPress={handleManualSubmit} style={styles.manualButton} accessibilityLabel="Ajouter le code">
              <Icon name="plus" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.message}><Icon name={scanMessage.startsWith('Code inconnu') ? 'alert-circle-outline' : 'check-circle-outline'} size={20} color={scanMessage.startsWith('Code inconnu') ? '#B45309' : '#007A55'} /><Text style={styles.messageText}>{scanMessage}</Text></View>

        <View style={styles.metrics}>
          <Metric label="Manquants" value={String(summary.missingLines.length)} color="#C2415A" />
          <Metric label="Surplus" value={String(summary.surplusLines.length)} color="#B45309" />
          <Metric label="Inconnus" value={String(summary.unknownScans.length)} color="#6D4BB3" />
        </View>

        {summary.missingLines.length > 0 ? <DifferenceList title="Articles manquants" lines={summary.missingLines} /> : null}
        {summary.surplusLines.length > 0 ? <DifferenceList title="Articles en surplus" lines={summary.surplusLines} /> : null}
        {summary.unknownScans.length > 0 ? <View style={styles.listCard}><Text style={styles.listTitle}>Codes inconnus</Text>{summary.unknownScans.map(item => <Text key={item.identifier} style={styles.listItem}>{item.identifier} · {item.count} scan(s)</Text>)}</View> : null}

        {isValidated ? (
          <Pressable style={styles.primaryButton} onPress={() => inventoryCampaignService.generateGapReport(campaign).catch(error => Alert.alert('Rapport', error.message))}><Icon name="file-pdf-box" size={22} color="#FFFFFF" /><Text style={styles.primaryText}>Partager le rapport d’écarts</Text></Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={() => setSignatureVisible(true)}><Icon name="draw-pen" size={21} color="#FFFFFF" /><Text style={styles.primaryText}>Valider avec signature</Text></Pressable>
        )}
      </ScrollView>

      <Modal visible={signatureVisible} transparent animationType="slide" onRequestClose={() => setSignatureVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Signature du responsable</Text><Text style={styles.modalHint}>Saisissez le nom du responsable qui valide cet inventaire.</Text><TextInput autoFocus value={signatureName} onChangeText={setSignatureName} placeholder="Nom et prénom" placeholderTextColor="#82948A" style={styles.signatureInput} /><View style={styles.modalActions}><Pressable onPress={() => setSignatureVisible(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Annuler</Text></Pressable><Pressable disabled={validating} onPress={validateCampaign} style={styles.confirmButton}><Text style={styles.primaryText}>{validating ? 'Validation...' : 'Confirmer'}</Text></Pressable></View></View></View>
      </Modal>
    </SafeAreaView>
  );
};

const Metric = ({ label, value, color }: { label: string; value: string; color: string }) => <View style={styles.metric}><Text style={[styles.metricValue, { color }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;

const DifferenceList = ({ title, lines }: { title: string; lines: InventoryCampaign['lines'] }) => <View style={styles.listCard}><Text style={styles.listTitle}>{title}</Text>{lines.slice(0, 8).map(line => <View key={line.articleId} style={styles.listRow}><Text style={styles.listItem} numberOfLines={1}>{line.reference} · {line.name}</Text><Text style={styles.delta}>{line.countedQuantity - line.expectedQuantity > 0 ? '+' : ''}{line.countedQuantity - line.expectedQuantity}</Text></View>)}{lines.length > 8 ? <Text style={styles.more}>+ {lines.length - 8} autre(s)</Text> : null}</View>;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F0' }, content: { padding: 18, paddingBottom: 36, gap: 14 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F0' }, loading: { color: '#17352A', fontSize: 16 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10 }, backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, headerText: { flex: 1 }, kicker: { color: '#007A55', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { color: '#17352A', fontSize: 23, fontWeight: '800', marginTop: 3 }, status: { backgroundColor: '#FFF2D8', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8 }, statusValidated: { backgroundColor: '#DDF5E8' }, statusText: { color: '#76500B', fontSize: 10, fontWeight: '800' }, progressCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 }, progressTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 }, progressValue: { color: '#007A55', fontSize: 28, fontWeight: '800' }, progressLabel: { color: '#617068', fontSize: 13 }, progressTrack: { height: 10, backgroundColor: '#E1EAE4', borderRadius: 5, overflow: 'hidden', marginTop: 12 }, progressFill: { height: '100%', backgroundColor: '#007A55', borderRadius: 5 }, progressHint: { color: '#617068', fontSize: 12, marginTop: 8 }, cameraCard: { height: 265, overflow: 'hidden', borderRadius: 18, backgroundColor: '#122019' }, camera: { flex: 1 }, cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)', margin: 54, borderRadius: 12 }, cameraText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' }, manualRow: { flexDirection: 'row', gap: 8 }, input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, color: '#17352A', height: 48 }, manualButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#007A55', alignItems: 'center', justifyContent: 'center' }, message: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EAF4EE', padding: 12, borderRadius: 12 }, messageText: { flex: 1, color: '#28563F', fontSize: 13 }, metrics: { flexDirection: 'row', gap: 10 }, metric: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 13 }, metricValue: { fontSize: 23, fontWeight: '800' }, metricLabel: { color: '#617068', fontSize: 12, marginTop: 3 }, listCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14 }, listTitle: { color: '#17352A', fontWeight: '800', fontSize: 15, marginBottom: 8 }, listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E1EAE4' }, listItem: { flex: 1, color: '#4B5C53', fontSize: 13 }, delta: { color: '#B45309', fontWeight: '800', marginLeft: 8 }, more: { color: '#007A55', fontSize: 12, marginTop: 8 }, primaryButton: { minHeight: 50, borderRadius: 13, backgroundColor: '#007A55', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 15 }, primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(10,25,18,0.52)', justifyContent: 'flex-end' }, modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, gap: 13 }, modalTitle: { color: '#17352A', fontSize: 20, fontWeight: '800' }, modalHint: { color: '#617068', fontSize: 13, lineHeight: 19 }, signatureInput: { height: 50, borderWidth: 1, borderColor: '#C9D9CF', borderRadius: 11, paddingHorizontal: 13, color: '#17352A' }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 }, cancelButton: { flex: 1, height: 48, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF3EF' }, cancelText: { color: '#345343', fontWeight: '700' }, confirmButton: { flex: 1, height: 48, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#007A55' },
});

export default InventoryCampaignScreen;
