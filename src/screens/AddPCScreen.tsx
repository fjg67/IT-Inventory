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
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppSelector } from '@/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { ArticlesStackParamList } from '@/navigation/types';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import {
  AddPCBadges,
  AddPCHero,
  AddPCSubmitButton,
  CategorySelector,
  HostnameHelper,
  ModelSelector,
  PCFormSection,
  PCInputField,
  StatusSelector,
} from '@/components/add-pc';
import { useAddPCForm } from '@/hooks/useAddPCForm';

type AddPCNavigationProp = NativeStackNavigationProp<ArticlesStackParamList>;

export const AddPCScreen: React.FC = () => {
  const navigation = useNavigation<AddPCNavigationProp>();
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const effectiveSiteName = useAppSelector((state) => state.site.siteActif?.nom ?? null);

  const {
    form,
    updateField,
    reset,
    isSubmitting,
    availableModels,
    isValid,
    hostnameFormat,
    validateHostnameByCategory,
    handleSubmit,
  } = useAddPCForm();

  const [isHostnameFocused, setHostnameFocused] = useState(false);
  const [isAssetFocused, setAssetFocused] = useState(false);
  const [hostnameTouched, setHostnameTouched] = useState(false);
  const [assetTouched, setAssetTouched] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [scanTarget, setScanTarget] = useState<'hostname' | 'asset' | null>(null);
  const scanTargetRef = useRef<'hostname' | 'asset' | null>(null);
  const lastScannedRef = useRef<{ value: string; at: number } | null>(null);

  const { hasPermission: hasCamPermission, requestPermission: requestCamPermission } = useCameraPermission();
  const camDevices = useCameraDevices();
  const camDevice = camDevices.find((device) => device.position === 'back') ?? camDevices[0];

  useEffect(() => {
    scanTargetRef.current = scanTarget;
  }, [scanTarget]);

  useEffect(() => {
    if (!form.category) return;
    if (availableModels.length === 0) return;
    if (!form.model || !availableModels.includes(form.model)) {
      updateField('model', availableModels[0]);
    }
  }, [availableModels, form.category, form.model, updateField]);

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
    Vibration.vibrate(15);
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

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSave = useCallback(async () => {
    setHostnameTouched(true);
    setAssetTouched(true);

    const validation = validateHostnameByCategory(form.hostname);
    if (!validation.valid) {
      Alert.alert('Format hostname invalide', `Format attendu: ${validation.expected}`);
      return;
    }

    const result = await handleSubmit({
      effectiveSiteId,
      effectiveSiteName,
      presetTypeArticle: 'PC',
    });

    if (!result.success) {
      Alert.alert('Échec de synchronisation', result.error ?? "Impossible d'ajouter le PC.");
      return;
    }

    setSubmitSuccess(true);
    Vibration.vibrate([0, 20, 40, 20]);
    setTimeout(() => {
      reset();
      navigation.goBack();
    }, 700);
  }, [effectiveSiteId, effectiveSiteName, form.hostname, handleSubmit, navigation, reset, validateHostnameByCategory]);

  const hostnamePlaceholder = form.category === 'portable_agence' ? 'Ex: KSAOP8725XXX' : 'Ex: KSAOPTRXXXX';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={OBSIDIAN_COLORS.bg_primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <AddPCHero model={form.model} onBack={handleCancel} />
          <AddPCBadges category={form.category} />

          <View style={styles.titleWrap}>
            <Text style={styles.title}>Ajouter un PC portable</Text>
            <Text style={styles.subtitle}>Catégorie, modèle, statut, hostname et asset obligatoires</Text>
          </View>

          <View style={styles.formWrap}>
            <Animated.View entering={FadeInDown.delay(0).duration(280)}>
              <PCFormSection title="Catégorie" required>
                <CategorySelector
                  value={form.category}
                  onChange={(category) => updateField('category', category)}
                  disabled={isSubmitting}
                />
              </PCFormSection>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(280)}>
              <PCFormSection title="Modèle" required>
                <ModelSelector
                  value={form.model}
                  options={availableModels}
                  onChange={(model) => updateField('model', model)}
                  disabled={!form.category || isSubmitting}
                />
              </PCFormSection>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(160).duration(280)}>
              <PCFormSection title="Statut" required>
                <StatusSelector
                  value={form.status}
                  onChange={(status) => updateField('status', status)}
                  disabled={isSubmitting}
                />
              </PCFormSection>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(280)}>
              <PCFormSection title="Hostname" required>
                <HostnameHelper category={form.category} format={hostnameFormat} />
                <PCInputField
                  label=""
                  value={form.hostname}
                  icon="laptop"
                  error={hostnameError}
                  isFocused={isHostnameFocused}
                  placeholder={hostnamePlaceholder}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onFocus={() => setHostnameFocused(true)}
                  onBlur={() => {
                    setHostnameFocused(false);
                    setHostnameTouched(true);
                  }}
                  onChangeText={(value) => updateField('hostname', value)}
                  onScan={() => openScanner('hostname')}
                />
              </PCFormSection>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(320).duration(280)}>
              <PCFormSection title="Asset" required>
                <PCInputField
                  label=""
                  value={form.asset}
                  icon="tag-outline"
                  error={assetError}
                  isFocused={isAssetFocused}
                  placeholder="Ex: AO44XXXX"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onFocus={() => setAssetFocused(true)}
                  onBlur={() => {
                    setAssetFocused(false);
                    setAssetTouched(true);
                  }}
                  onChangeText={(value) => updateField('asset', value)}
                  onScan={() => openScanner('asset')}
                />

                <View style={styles.noteBox}>
                  <Icon name="information-outline" size={12} color={OBSIDIAN_COLORS.text_muted} />
                  <Text style={styles.noteText}>
                    Le modèle et le statut seront visibles directement sur la carte PC.
                  </Text>
                </View>
              </PCFormSection>
            </Animated.View>
          </View>
        </ScrollView>

        <AddPCSubmitButton
          isValid={isValid && !hostnameError && !assetError}
          isLoading={isSubmitting}
          isSuccess={submitSuccess}
          onCancel={handleCancel}
          onSubmit={handleSave}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={scanTarget !== null}
        animationType="slide"
        onRequestClose={() => setScanTarget(null)}
      >
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
              <View style={styles.cameraFrame}>
                <View style={[styles.cameraCorner, styles.cornerTL]} />
                <View style={[styles.cameraCorner, styles.cornerTR]} />
                <View style={[styles.cameraCorner, styles.cornerBL]} />
                <View style={[styles.cameraCorner, styles.cornerBR]} />
              </View>
            </View>

            <Text style={styles.cameraHint}>Positionnez le code-barres dans le cadre</Text>

            <View style={styles.cameraFooter}>
              <Text style={styles.cameraFooterText}>Lecture automatique</Text>
              <View style={styles.cameraDot} />
              <Text style={styles.cameraFooterText}>Vision Camera</Text>
            </View>

            <View style={styles.cameraCloseWrap}>
              <View style={styles.cameraCloseBackdrop}>
                <Icon
                  name="close"
                  size={22}
                  color="#FFFFFF"
                  onPress={() => {
                    Vibration.vibrate(10);
                    setScanTarget(null);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.bg_primary,
  },
  content: {
    paddingBottom: 140,
  },
  titleWrap: {
    paddingHorizontal: 16,
    gap: 6,
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 13,
    fontWeight: '500',
  },
  formWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  noteBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.06)',
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontStyle: 'italic',
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
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cameraCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#22C55E',
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
  cameraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraFooterText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  cameraDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#22C55E',
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
