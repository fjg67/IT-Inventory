// ============================================
// AUTH SCREEN - Premium Profile Selection
// IT-Inventory - Interface Premium
// ============================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TextInput,
  Vibration,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadTechniciens, loginTechnicien, createTechnicien } from '@/store/slices/authSlice';
import { FullScreenLoading } from '@/components';
import { Technicien } from '@/types';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== HELPERS ====================
const AVATAR_GRADIENTS: [string, string][] = [
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#6366F1'],
  ['#EC4899', '#F472B6'],
  ['#10B981', '#34D399'],
  ['#F59E0B', '#FBBF24'],
  ['#06B6D4', '#22D3EE'],
  ['#EF4444', '#F87171'],
  ['#14B8A6', '#2DD4BF'],
];

const getAvatarGradient = (id: string | number | undefined): [string, string] => {
  if (id == null) return AVATAR_GRADIENTS[0];
  const n = typeof id === 'number' ? Math.abs(id) : [...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
};

const getInitials = (technicien: Technicien): string => {
  const p = technicien.prenom?.charAt(0) || '';
  const n = technicien.nom?.charAt(0) || '';
  return `${p}${n}`.toUpperCase();
};

// ==================== BACKGROUND BLOBS ====================
const { height: SCREEN_H } = Dimensions.get('window');
const BLOBS = [
  { size: 320, x: -80, y: -60, colors: ['rgba(59,130,246,0.06)', 'rgba(59,130,246,0)'] as const },
  { size: 280, x: SCREEN_WIDTH - 100, y: SCREEN_H * 0.35, colors: ['rgba(99,102,241,0.05)', 'rgba(99,102,241,0)'] as const },
  { size: 200, x: -50, y: SCREEN_H * 0.65, colors: ['rgba(6,182,212,0.04)', 'rgba(6,182,212,0)'] as const },
];

// Decorative dots
const DOTS = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  size: 3 + Math.random() * 4,
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * SCREEN_H,
  opacity: 0.04 + Math.random() * 0.07,
  color: ['#3B82F6', '#6366F1', '#8B5CF6', '#06B6D4'][Math.floor(Math.random() * 4)],
}));

// ==================== MAIN AUTH SCREEN ====================
export const AuthScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const route = useRoute();
  const { isTablet } = useResponsive();
  const { colors, isDark } = useTheme();
  const params = (route.params ?? {}) as { rememberMe?: boolean };
  const rememberMe = params.rememberMe ?? true;
  const { techniciens, isLoading, error } = useAppSelector(state => state.auth);

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPrenom, setNewPrenom] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newMatricule, setNewMatricule] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Input focus states
  const [prenomFocused, setPrenomFocused] = useState(false);
  const [nomFocused, setNomFocused] = useState(false);
  const [matriculeFocused, setMatriculeFocused] = useState(false);

  // Validation
  const prenomError = useMemo(() => {
    if (newPrenom.length === 0) return '';
    if (newPrenom.trim().length < 2) return 'Au moins 2 caractères';
    return '';
  }, [newPrenom]);

  const nomError = useMemo(() => {
    if (newNom.length === 0) return '';
    if (newNom.trim().length < 2) return 'Au moins 2 caractères';
    return '';
  }, [newNom]);

  const isFormValid = useMemo(
    () =>
      newPrenom.trim().length >= 2 &&
      newNom.trim().length >= 2 &&
      !prenomError &&
      !nomError,
    [newPrenom, newNom, prenomError, nomError],
  );

  useEffect(() => {
    dispatch(loadTechniciens());
  }, [dispatch]);

  const handleSelectTechnicien = useCallback(
    async (technicien: Technicien) => {
      Vibration.vibrate(10);
      try {
        await dispatch(loginTechnicien({ technicienId: technicien.id, persist: rememberMe })).unwrap();
      } catch (err) {
        console.error('Erreur de connexion:', err);
      }
    },
    [dispatch],
  );

  const handleCreateTechnicien = useCallback(async () => {
    if (!isFormValid) return;

    setIsCreating(true);
    try {
      await dispatch(
        createTechnicien({
          nom: newNom.trim(),
          prenom: newPrenom.trim(),
          matricule: newMatricule.trim() || undefined,
        }),
      ).unwrap();

      Vibration.vibrate(20);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setIsModalVisible(false);
        setNewPrenom('');
        setNewNom('');
        setNewMatricule('');
      }, 1500);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer le technicien.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }, [dispatch, isFormValid, newNom, newPrenom, newMatricule]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setNewPrenom('');
    setNewNom('');
    setNewMatricule('');
    setPrenomFocused(false);
    setNomFocused(false);
    setMatriculeFocused(false);
  }, []);

  // ==================== RENDER HELPERS ====================
  const renderTechnicien = useCallback(
    ({ item, index }: { item: Technicien; index: number }) => {
      const gradient = getAvatarGradient(item.id);
      return (
        <Animated.View entering={FadeInUp.delay(1000 + index * 120).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSelectTechnicien(item)}
            style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, shadowColor: isDark ? '#000' : '#64748B' }]}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileAvatar}
            >
              <Text style={styles.profileAvatarText}>
                {getInitials(item)}
              </Text>
            </LinearGradient>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {getInitials(item)}
              </Text>
              <Text style={[styles.profileMatricule, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                Technicien
              </Text>
            </View>

            <View style={styles.profileChevron}>
              <Icon name="chevron-right" size={22} color={colors.primaryLight} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [handleSelectTechnicien],
  );

  const renderEmpty = useCallback(
    () => (
      <Animated.View entering={FadeIn.delay(1000).duration(600)} style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? colors.primaryGlow : '#EEF2FF', borderColor: isDark ? colors.primaryGlowStrong : '#E0E7FF' }]}>
          <Icon name="account-plus-outline" size={48} color={colors.primaryDark} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aucun profil trouvé</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Créez votre premier profil{'\n'}technicien pour commencer
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => {
            Vibration.vibrate(15);
            setIsModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primaryDark, isDark ? '#3730A3' : '#4338CA']}
          >
            <Icon name="plus" size={20} color="#FFF" />
            <Text style={styles.emptyCtaText}>Créer un profil</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    ),
    [],
  );

  const renderFooter = useCallback(
    () =>
      techniciens.length > 0 ? (
        <Animated.View entering={FadeInUp.delay(1200 + techniciens.length * 120).duration(400)}>
          <TouchableOpacity
            style={[styles.addButton, { borderColor: isDark ? colors.primaryGlow : '#E0E7FF', backgroundColor: isDark ? colors.surfaceElevated : '#FAFBFF' }]}
            onPress={() => {
              Vibration.vibrate(10);
              setIsModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.addIconCircle, { backgroundColor: isDark ? colors.primaryGlow : '#EEF2FF' }]}>
              <Icon name="plus" size={22} color={colors.primaryDark} />
            </View>
            <Text style={[styles.addButtonText, { color: colors.primaryDark }]}>Ajouter un profil</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null,
    [techniciens.length],
  );

  // Helper for input border
  const getInputBorder = (focused: boolean, err: string) => {
    if (focused) return colors.secondary;
    if (err) return colors.danger;
    return isDark ? colors.borderStrong : '#E2E8F0';
  };

  if (isLoading && techniciens.length === 0 && !isCreating) {
    return <FullScreenLoading message="Chargement des profils..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundBase} />

      {/* Background decoration */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BLOBS.map((b, i) => (
          <LinearGradient
            key={i}
            colors={b.colors as unknown as string[]}
            style={{
              position: 'absolute',
              width: b.size,
              height: b.size,
              borderRadius: b.size / 2,
              left: b.x,
              top: b.y,
            }}
          />
        ))}
        {DOTS.map((d) => (
          <View
            key={d.id}
            style={{
              position: 'absolute',
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              left: d.x,
              top: d.y,
              opacity: d.opacity,
              backgroundColor: d.color,
            }}
          />
        ))}
      </View>

      {/* Logo */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        style={styles.headerSection}
      >
        <View style={[styles.logoBox, { shadowColor: colors.primaryDark }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>IT-Inventory</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(650).duration(500)}>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>Gestion de stock IT</Text>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(800).duration(400)}>
          <LinearGradient
            colors={['transparent', isDark ? colors.primaryGlow : '#C7D2FE', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separator}
          />
        </Animated.View>
      </Animated.View>

      {/* Instruction */}
      <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.instructionWrap}>
        <View style={[styles.instructionDot, { backgroundColor: isDark ? colors.primaryGlow : '#C7D2FE' }]} />
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          {techniciens.length > 0
            ? 'Sélectionnez votre profil pour continuer'
            : 'Bienvenue sur IT-Inventory'}
        </Text>
        <View style={[styles.instructionDot, { backgroundColor: isDark ? colors.primaryGlow : '#C7D2FE' }]} />
      </Animated.View>

      {/* Erreur */}
      {error ? (
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.errorBanner, { backgroundColor: colors.dangerBg, borderColor: isDark ? colors.dangerBorder : '#FECACA' }]}>
          <Icon name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={[styles.errorBannerText, { color: colors.danger }]}>{error}</Text>
        </Animated.View>
      ) : null}

      {/* Liste profils */}
      <FlatList
        data={techniciens}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTechnicien}
        contentContainerStyle={[styles.list, isTablet && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 640, alignSelf: 'center' }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        {...(isTablet ? { numColumns: 2, columnWrapperStyle: { gap: 16 } } : {})}
      />

      {/* Version */}
      <View style={styles.footer}>
        <View style={[styles.footerBadge, { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' }]}>
          <Icon name="lock-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Données protégées et chiffrées</Text>
        </View>
        <Text style={[styles.versionText, { color: isDark ? colors.textMuted : '#CBD5E1' }]}>Version 1.0.0</Text>
      </View>

      {/* ===== MODAL CRÉATION ===== */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalWrapper}
            >
              <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                {/* Handle */}
                <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />

                {showSuccess ? (
                  /* ===== SUCCESS STATE ===== */
                  <Animated.View entering={ZoomIn.springify()} style={styles.successContainer}>
                    <View style={styles.successCircle}>
                      <Icon name="check" size={44} color="#FFF" />
                    </View>
                    <Text style={[styles.successText, { color: colors.success }]}>Profil créé avec succès !</Text>
                  </Animated.View>
                ) : (
                  /* ===== FORM ===== */
                  <>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nouveau Profil</Text>
                      <TouchableOpacity
                        onPress={() => {
                          Vibration.vibrate(10);
                          closeModal();
                        }}
                        style={[styles.closeBtn, { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' }]}
                        activeOpacity={0.7}
                      >
                        <Icon name="close" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Remplissez les informations ci-dessous pour créer un nouveau profil technicien.
                    </Text>

                    {/* Input Prénom */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Prénom</Text>
                        <Text style={[styles.requiredStar, { color: colors.danger }]}> *</Text>
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            borderColor: getInputBorder(prenomFocused, prenomError),
                            borderWidth: prenomFocused ? 2 : 1.5,
                            backgroundColor: colors.surfaceInput,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Ex: Jean"
                          placeholderTextColor={colors.textMuted}
                          value={newPrenom}
                          onChangeText={setNewPrenom}
                          onFocus={() => setPrenomFocused(true)}
                          onBlur={() => setPrenomFocused(false)}
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                        {newPrenom.trim().length >= 2 && !prenomError && (
                          <Icon name="check-circle" size={20} color={colors.success} />
                        )}
                        {prenomError ? (
                          <Icon name="close-circle" size={20} color={colors.danger} />
                        ) : null}
                      </View>
                      {prenomError ? (
                        <Text style={[styles.errorMsg, { color: colors.danger }]}>{prenomError}</Text>
                      ) : null}
                    </View>

                    {/* Input Nom */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Nom</Text>
                        <Text style={[styles.requiredStar, { color: colors.danger }]}> *</Text>
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            borderColor: getInputBorder(nomFocused, nomError),
                            borderWidth: nomFocused ? 2 : 1.5,
                            backgroundColor: colors.surfaceInput,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Ex: Dupont"
                          placeholderTextColor={colors.textMuted}
                          value={newNom}
                          onChangeText={setNewNom}
                          onFocus={() => setNomFocused(true)}
                          onBlur={() => setNomFocused(false)}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                        {newNom.trim().length >= 2 && !nomError && (
                          <Icon name="check-circle" size={20} color={colors.success} />
                        )}
                        {nomError ? (
                          <Icon name="close-circle" size={20} color={colors.danger} />
                        ) : null}
                      </View>
                      {nomError ? (
                        <Text style={[styles.errorMsg, { color: colors.danger }]}>{nomError}</Text>
                      ) : null}
                    </View>

                    {/* Input Matricule */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Matricule (Optionnel)</Text>
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            borderColor: matriculeFocused ? colors.secondary : (isDark ? colors.borderStrong : '#E2E8F0'),
                            borderWidth: matriculeFocused ? 2 : 1.5,
                            backgroundColor: colors.surfaceInput,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Ex: T-12345"
                          placeholderTextColor={colors.textMuted}
                          value={newMatricule}
                          onChangeText={setNewMatricule}
                          onFocus={() => setMatriculeFocused(true)}
                          onBlur={() => setMatriculeFocused(false)}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    {/* Boutons */}
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.cancelBtn, { borderColor: isDark ? colors.borderStrong : '#E2E8F0' }]}
                        onPress={() => {
                          Vibration.vibrate(10);
                          closeModal();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Annuler</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.submitBtn,
                          (!isFormValid || isCreating) && styles.submitBtnDisabled,
                        ]}
                        onPress={() => {
                          Vibration.vibrate(15);
                          handleCreateTechnicien();
                        }}
                        activeOpacity={0.8}
                        disabled={!isFormValid || isCreating}
                      >
                        <LinearGradient
                          colors={
                            isFormValid && !isCreating
                              ? [colors.secondary, isDark ? '#1E40AF' : '#2563EB']
                              : isDark ? [colors.surfaceElevated, colors.surfaceElevated] : ['#94A3B8', '#64748B']
                          }
                          style={styles.submitBtnGradient}
                        >
                          {isCreating ? (
                            <>
                              <ActivityIndicator color="#FFF" size="small" />
                              <Text style={styles.submitBtnText}>Création...</Text>
                            </>
                          ) : (
                            <Text style={styles.submitBtnText}>Créer</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
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
  },

  // Header / Logo
  headerSection: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 8,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  separator: {
    width: 160,
    height: 1.5,
    borderRadius: 1,
  },

  // Instruction
  instructionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  instructionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexGrow: 1,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    minHeight: 72,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
    minWidth: 0,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileMatricule: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  profileChevron: {
    marginLeft: 4,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCta: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
    borderRadius: 14,
  },
  emptyCtaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 16,
    gap: 10,
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    width: '100%',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  requiredStar: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  errorMsg: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Buttons
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Success
  successContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AuthScreen;
