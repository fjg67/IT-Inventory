import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import Animated, { FadeInDown, SharedValue, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppSelector } from '@/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { ArticlesStackParamList } from '@/navigation/types';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { PC_DEFAULT_UI } from '@/constants/pcStatusColors';
import {
  AddPCAssetInput,
  AddPCCategorySelector,
  AddPCErrorModal,
  AddPCFooter,
  AddPCHero,
  AddPCHostnameInput,
  AddPCModelSelector,
  AddPCPannePanel,
  AddPCProgressBar,
  AddPCStatusGrid,
} from '@/components/add-pc';
import { useAddPCColors } from '@/hooks/useAddPCColors';
import { useAddPCForm } from '@/hooks/useAddPCForm';
import { usePCSuccessAnimation } from '@/hooks/usePCSuccessAnimation';
import { PCSuccessOverlay } from '@/components/add-pc/PCSuccessOverlay';

type AddPCNavigationProp = NativeStackNavigationProp<ArticlesStackParamList>;

interface SectionLabelProps {
  title: string;
  required?: boolean;
  fromColor: string;
  toColor: string;
  progress: SharedValue<number>;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ title, required = false, fromColor, toColor, progress }) => {
  const barStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [fromColor, toColor]),
  }));

  return (
    <View style={styles.sectionHeader}>
      <Animated.View style={[styles.sectionAccent, barStyle]} />
      <Text style={styles.sectionTitle}>
        {title}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
    </View>
  );
};

export const AddPCScreen: React.FC = () => {
  const navigation = useNavigation<AddPCNavigationProp>();
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const effectiveSiteName = useAppSelector((state) => state.site.siteActif?.nom ?? null);

  const {
    form,
    updateField,
    handleStatusChange,
    reset,
    isSubmitting,
    availableModels,
    isValid,
    progress,
    validateHostnameByCategory,
    handleSubmit,
  } = useAddPCForm();

  const {
    colorProgress,
    transitionToStatus,
    fromConfig,
    toConfig,
  } = useAddPCColors();

  const { visible: successVisible, triggered: successTriggered, pcData: successData, show: showSuccess, hide: hideSuccess } = usePCSuccessAnimation();

  const [hostnameTouched, setHostnameTouched] = useState(false);
  const [assetTouched, setAssetTouched] = useState(false);
  const [scanTarget, setScanTarget] = useState<'hostname' | 'asset' | null>(null);
  const scanTargetRef = useRef<'hostname' | 'asset' | null>(null);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);
  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    type: 'hostname_duplicate' | 'asset_duplicate' | 'format_invalid';
    message: string;
  }>({
    visible: false,
    type: 'format_invalid',
    message: '',
  });

  useEffect(() => {
    scanTargetRef.current = scanTarget;
  }, [scanTarget]);

  useEffect(() => {
    transitionToStatus(form.status);
  }, [form.status, transitionToStatus]);

  useEffect(() => {
    if (!form.category || availableModels.length === 0) return;
    if (!form.model || !availableModels.includes(form.model)) {
      updateField('model', availableModels[0]);
    }
  }, [availableModels, form.category, form.model, updateField]);

  const statusColor = form.status ? toConfig.color : PC_DEFAULT_UI.color;

  const hostnamePlaceholder = form.category === 'portable_agence' ? 'Ex: KSAOP872XXXX' : 'Ex: KSAOPSTRXXXX';

  const hostnameError = useMemo(() => {
    if (!hostnameTouched) return null;
    if (!form.hostname.trim()) return 'Le hostname est obligatoire.';
    const check = validateHostnameByCategory(form.hostname);
    if (check.valid) return null;
    return `Format attendu: ${check.expected}`;
  }, [form.hostname, hostnameTouched, validateHostnameByCategory]);

  const assetError = useMemo(() => {
    if (!assetTouched) return null;
    if (!form.asset.trim()) return "L'asset est obligatoire.";
    return null;
  }, [assetTouched, form.asset]);

  const { hasPermission: hasCamPermission, requestPermission: requestCamPermission } = useCameraPermission();
  const camDevices = useCameraDevices();
  const camDevice = camDevices.find((device) => device.position === 'back') ?? camDevices[0];

  const onCodeScanned = useCallback((codes: { value?: string }[]) => {
    if (!scanTargetRef.current || codes.length === 0 || !codes[0]?.value) return;
    const scanned = codes[0].value.trim();
    if (!scanned) return;

    const now = Date.now();
    if (lastScannedRef.current?.value === scanned && now - lastScannedRef.current.at < 2500) return;

    lastScannedRef.current = { value: scanned, at: now };
    Vibration.vibrate([0, 30, 50, 30]);

    if (scanTargetRef.current === 'hostname') {
      updateField('hostname', scanned.toUpperCase());
      setHostnameTouched(true);
    } else {
      updateField('asset', scanned.toUpperCase());
      setAssetTouched(true);
    }

    setScanTarget(null);
  }, [updateField]);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93', 'qr', 'data-matrix', 'itf', 'pdf-417', 'aztec'],
    onCodeScanned,
  });

  const openScanner = useCallback(async (target: 'hostname' | 'asset') => {
    if (!camDevice) {
      Alert.alert('Caméra indisponible', "Aucune caméra n'a été détectée.");
      return;
    }

    if (!hasCamPermission) {
      const granted = await requestCamPermission();
      if (!granted) {
        Alert.alert(
          'Accès à la caméra',
          "L'accès à la caméra est nécessaire pour scanner.",
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }

    setScanTarget(target);
  }, [camDevice, hasCamPermission, requestCamPermission]);

  const handleSave = useCallback(async () => {
    setHostnameTouched(true);
    setAssetTouched(true);

    const validation = validateHostnameByCategory(form.hostname);
    if (!validation.valid) {
      setErrorModal({
        visible: true,
        type: 'format_invalid',
        message: `Le format du hostname n'est pas correct. ${validation.expected}`,
      });
      return;
    }

    const result = await handleSubmit({
      effectiveSiteId,
      effectiveSiteName,
      presetTypeArticle: 'PC',
    });

    if (!result.success) {
      // Detect error type from message
      const errorMsg = result.error ?? "Impossible d'ajouter le PC.";
      let errorType: 'hostname_duplicate' | 'asset_duplicate' | 'format_invalid' = 'format_invalid';

      if (errorMsg.toLowerCase().includes('hostname') || errorMsg.toLowerCase().includes('existant')) {
        errorType = 'hostname_duplicate';
      } else if (errorMsg.toLowerCase().includes('asset')) {
        errorType = 'asset_duplicate';
      }

      setErrorModal({
        visible: true,
        type: errorType,
        message: errorMsg,
      });
      return;
    }

    Vibration.vibrate([0, 20, 40, 20]);
    showSuccess({
      hostname: form.hostname.trim().toUpperCase(),
      model: form.model ?? '',
      asset: form.asset.trim().toUpperCase(),
      category: form.category!,
      status: form.status!,
    });
  }, [effectiveSiteId, effectiveSiteName, form.hostname, handleSubmit, navigation, reset, validateHostnameByCategory]);

  const handleAddAnother = useCallback(() => {
    hideSuccess();
    setTimeout(() => reset(), 350);
  }, [hideSuccess, reset]);

  const handleViewParc = useCallback(() => {
    hideSuccess();
    setTimeout(() => {
      navigation.navigate('ArticlesList', {
        presetTypeArticle: 'PC',
        lockPresetTypeArticle: true,
      });
    }, 350);
  }, [hideSuccess, navigation]);

  const contentValid = isValid && !hostnameError && !assetError;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={OBSIDIAN_COLORS.bg_primary} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={19} color="#EAF5EF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Ajout PC</Text>
          <View style={styles.topRightDot} />
        </View>

        <AddPCProgressBar progress={progress} statusColor={statusColor} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <AddPCHero
            selectedStatus={form.status}
            selectedModel={form.model}
            selectedCategory={form.category}
            fromConfig={fromConfig}
            toConfig={toConfig}
            colorProgress={colorProgress}
          />

          <View style={styles.titleWrap}>
            <Text style={styles.title}>Ajouter un PC portable</Text>
            <Text style={styles.subtitle}>Catégorie, modèle, statut, hostname et asset obligatoires</Text>
          </View>

          <View style={styles.formWrap}>
            <Animated.View entering={FadeInDown.duration(220)}>
              <SectionLabel
                title="Catégorie"
                required
                fromColor={fromConfig.color}
                toColor={toConfig.color}
                progress={colorProgress}
              />
              <AddPCCategorySelector
                selected={form.category}
                onSelect={(cat) => updateField('category', cat)}
                activeColor={statusColor}
                disabled={isSubmitting}
              />
            </Animated.View>

            {form.category ? (
              <Animated.View entering={FadeInDown.duration(240)} style={styles.sectionWrap}>
                <SectionLabel
                  title="Modèle"
                  required
                  fromColor={fromConfig.color}
                  toColor={toConfig.color}
                  progress={colorProgress}
                />
                <AddPCModelSelector
                  selected={form.model}
                  models={availableModels}
                  onSelect={(model) => updateField('model', model)}
                  activeColor={statusColor}
                />
              </Animated.View>
            ) : null}

            <View style={styles.sectionWrap}>
              <SectionLabel
                title="Statut"
                required
                fromColor={fromConfig.color}
                toColor={toConfig.color}
                progress={colorProgress}
              />
              <AddPCStatusGrid
                selected={form.status}
                onSelect={(status) => {
                  Vibration.vibrate(10);
                  handleStatusChange(status);
                }}
              />
            </View>

            {form.status === 'en_panne' ? (
              <AddPCPannePanel
                panneType={form.panne_type}
                priorite={form.panne_priorite}
                description={form.panne_description}
                onPanneTypeChange={(type) => updateField('panne_type', type)}
                onPrioriteChange={(priorite) => updateField('panne_priorite', priorite)}
                onDescriptionChange={(description) => updateField('panne_description', description)}
              />
            ) : null}

            <View style={styles.sectionWrap}>
              <SectionLabel
                title="Hostname"
                required
                fromColor={fromConfig.color}
                toColor={toConfig.color}
                progress={colorProgress}
              />
              <AddPCHostnameInput
                value={form.hostname}
                onChangeText={(text) => updateField('hostname', text)}
                onScan={() => openScanner('hostname')}
                placeholder={hostnamePlaceholder}
                accentColor={statusColor}
                error={hostnameError}
                disabled={isSubmitting}
              />
            </View>

            <View style={styles.sectionWrap}>
              <SectionLabel
                title="Asset"
                required
                fromColor={fromConfig.color}
                toColor={toConfig.color}
                progress={colorProgress}
              />
              <AddPCAssetInput
                value={form.asset}
                onChangeText={(text) => updateField('asset', text)}
                onScan={() => openScanner('asset')}
                accentColor={statusColor}
                error={assetError}
                disabled={isSubmitting}
              />

              <View style={styles.noteBox}>
                <Icon name="information-outline" size={12} color="#8FA39C" />
                <Text style={styles.noteText}>Le modèle et le statut seront visibles directement sur la carte PC.</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <AddPCFooter
          isValid={contentValid}
          isLoading={isSubmitting}
          statusColor={statusColor}
          fromButtonColor={fromConfig.buttonColor}
          toButtonColor={toConfig.buttonColor}
          colorProgress={colorProgress}
          onCancel={() => navigation.goBack()}
          onSubmit={handleSave}
        />
      </KeyboardAvoidingView>

      <Modal visible={scanTarget !== null} animationType="slide" onRequestClose={() => setScanTarget(null)}>
        <View style={styles.cameraContainer}>
          {camDevice && hasCamPermission ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={camDevice}
              isActive={scanTarget !== null}
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
              <View style={{ width: 42 }} />
              <Text style={styles.cameraTitle}>{scanTarget === 'hostname' ? 'Scanner le hostname' : "Scanner l'asset"}</Text>
              <View style={{ width: 42 }} />
            </View>

            <View style={styles.cameraFrameWrap}>
              <View style={[styles.cameraFrame, { borderColor: toConfig.border }]}>
                <View style={[styles.cameraCorner, styles.cornerTL, { borderColor: toConfig.color }]} />
                <View style={[styles.cameraCorner, styles.cornerTR, { borderColor: toConfig.color }]} />
                <View style={[styles.cameraCorner, styles.cornerBL, { borderColor: toConfig.color }]} />
                <View style={[styles.cameraCorner, styles.cornerBR, { borderColor: toConfig.color }]} />
              </View>
            </View>

            <Text style={styles.cameraHint}>Positionnez le code-barres dans le cadre</Text>

            <View style={styles.cameraCloseWrap}>
              <TouchableOpacity
                style={styles.cameraCloseBackdrop}
                onPress={() => {
                  Vibration.vibrate(10);
                  setScanTarget(null);
                }}
              >
                <Icon name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddPCErrorModal
        visible={errorModal.visible}
        type={errorModal.type}
        message={errorModal.message}
        onDismiss={() => setErrorModal({ ...errorModal, visible: false })}
      />

      <PCSuccessOverlay
        visible={successVisible}
        triggered={successTriggered}
        pcData={successData}
        onAddAnother={handleAddAnother}
        onViewParc={handleViewParc}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.bg_primary,
  },
  topBar: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    backgroundColor: '#101915',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#EAF5EF',
    fontSize: 17,
    fontWeight: '800',
  },
  topRightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(148,163,184,0.6)',
  },
  content: {
    paddingBottom: 132,
  },
  titleWrap: {
    paddingHorizontal: 16,
    gap: 4,
  },
  title: {
    color: '#ECF8F1',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8EA09A',
    fontSize: 13,
    fontWeight: '500',
  },
  formWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    color: '#DDEBE5',
    fontSize: 13,
    fontWeight: '700',
  },
  required: {
    color: '#EF4444',
  },
  noteBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    backgroundColor: '#101915',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteText: {
    color: '#8FA39C',
    fontSize: 12,
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 24,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 42,
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cameraFrameWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    width: 280,
    height: 170,
    borderRadius: 16,
    borderWidth: 1,
  },
  cameraCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderWidth: 3,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },
  cameraHint: {
    textAlign: 'center',
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
  },
  cameraCloseWrap: {
    alignItems: 'center',
  },
  cameraCloseBackdrop: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
