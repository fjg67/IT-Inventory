// ============================================
// LOGIN SCREEN — Light mode premium
// IT-Inventory Application
// Clean, airy, modern — soft depth & micro-interactions
// ============================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Vibration,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeInDown,
  ZoomIn,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '@/services/authService';
import { syncService } from '@/api';
import { APP_CONFIG } from '@/constants/config';
import { useResponsive } from '@/utils/responsive';
import { SuccessOverlay } from '@/components/login/SuccessOverlay';
import { useTheme } from '@/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const DEFAULT_IDENTIFIER = 'technicien';
const MASTER_PASSWORD = '!*A1Z2E3R4T5!';

// ===== DECORATIVE DOTS =====
const DOTS = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  size: 3 + Math.random() * 4,
  x: Math.random() * SCREEN_W,
  y: Math.random() * SCREEN_H,
  opacity: 0.04 + Math.random() * 0.07,
  color: ['#3B82F6', '#6366F1', '#8B5CF6', '#06B6D4'][Math.floor(Math.random() * 4)],
}));

// ===== COMPOSANT PRINCIPAL =====
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isTablet, rv, fs, width } = useResponsive();
  const { colors, isDark } = useTheme();

  const passwordRef = useRef('');
  const inputRef = useRef<any>(null);
  const [formValid, setFormValid] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [loggedUserName, setLoggedUserName] = useState('');

  const sizes = useMemo(() => {
    const logoSize = rv({ phone: 80, tablet: 110 });
    return {
      logo: logoSize,
      logoWrap: logoSize + 36,
      logoRadius: rv({ phone: 24, tablet: 30 }),
      titleSize: fs(30),
      subtitleSize: fs(12),
      cardMaxWidth: rv({ phone: Math.min(420, width - 40), tablet: 480, largeTablet: 500 }),
      cardPadding: rv({ phone: 28, tablet: 36 }),
      cardRadius: rv({ phone: 24, tablet: 28 }),
      inputHeight: rv({ phone: 56, tablet: 60 }),
      inputFontSize: fs(16),
      inputRadius: rv({ phone: 16, tablet: 18 }),
      buttonHeight: rv({ phone: 54, tablet: 58 }),
      buttonFontSize: fs(16),
      labelSize: fs(12),
      scrollPaddingH: rv({ phone: 24, tablet: 40 }),
      sectionMarginBottom: rv({ phone: 28, tablet: 36 }),
      secureIconSize: rv({ phone: 36, tablet: 42 }),
      secureIconRadius: rv({ phone: 12, tablet: 14 }),
      secureTextSize: fs(15),
      eyeIconSize: rv({ phone: 20, tablet: 22 }),
      shieldIconSize: rv({ phone: 18, tablet: 20 }),
    };
  }, [rv, fs, width]);

  // ===== ANIMATIONS =====
  const logoScale = useSharedValue(0);
  const floatY = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 90 });

    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    ring1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    ring2.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { translateY: floatY.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ring1.value, [0, 1], [0.9, 2.2]) }],
    opacity: interpolate(ring1.value, [0, 0.15, 1], [0.3, 0.15, 0]),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ring2.value, [0, 1], [0.9, 2.2]) }],
    opacity: interpolate(ring2.value, [0, 0.15, 1], [0.3, 0.15, 0]),
  }));

  // ===== ERROR ANIMATION =====
  const shakeX = useSharedValue(0);
  const errorFlash = useSharedValue(0);
  const errorIconScale = useSharedValue(0);
  const errorIconRotate = useSharedValue(0);
  const errorGlow = useSharedValue(0);

  const triggerErrorAnimation = useCallback(() => {
    // Shake sequence — fast elastic horizontal shake
    shakeX.value = withSequence(
      withTiming(-14, { duration: 50, easing: Easing.linear }),
      withTiming(14, { duration: 60, easing: Easing.linear }),
      withTiming(-12, { duration: 55, easing: Easing.linear }),
      withTiming(10, { duration: 55, easing: Easing.linear }),
      withTiming(-6, { duration: 50, easing: Easing.linear }),
      withTiming(4, { duration: 45, easing: Easing.linear }),
      withTiming(0, { duration: 40, easing: Easing.linear }),
    );

    // Red border flash
    errorFlash.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0.4, { duration: 150 }),
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }),
    );

    // Error icon — bounce in
    errorIconScale.value = 0;
    errorIconRotate.value = -30;
    errorIconScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 150 }));
    errorIconRotate.value = withDelay(200, withSpring(0, { damping: 10 }));

    // Red glow behind card
    errorGlow.value = withSequence(
      withTiming(0.6, { duration: 150 }),
      withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }),
    );
  }, []);

  const cardShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const errorFlashBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      errorFlash.value,
      [0, 1],
      [isDark ? '#1E293B' : '#E2E8F0', '#EF4444'],
    ),
    backgroundColor: interpolateColor(
      errorFlash.value,
      [0, 1],
      [isDark ? '#0E1520' : '#F8FAFC', isDark ? '#1A0808' : '#FEF2F2'],
    ),
  }));

  const errorIconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: errorIconScale.value },
      { rotate: `${errorIconRotate.value}deg` },
    ],
    opacity: errorIconScale.value,
  }));

  const errorGlowStyle = useAnimatedStyle(() => ({
    opacity: errorGlow.value,
  }));

  const isFormValid = formValid;

  const handlePasswordChange = useCallback((t: string) => {
    passwordRef.current = t;
    const valid = t.length >= 3;
    // Only trigger re-render when crossing the validation threshold
    setFormValid((prev) => (prev !== valid ? valid : prev));
  }, []);

  const handleLogin = useCallback(async () => {
    if (!isFormValid || loading || success || syncing) return;
    Vibration.vibrate(15);
    setPasswordError('');
    setLoading(true);

    // Master password → direct profile selection
    if (passwordRef.current === MASTER_PASSWORD) {
      setLoading(false);
      setSuccess(true);
      setLoggedUserName('Technicien');
      setTimeout(() => setShowSuccessOverlay(true), 600);
      return;
    }

    try {
      const result = await AuthService.login(DEFAULT_IDENTIFIER, passwordRef.current);
      if (!result.success) {
        setPasswordError(result.error);
        Vibration.vibrate([0, 40, 60, 40, 60, 80]);
        triggerErrorAnimation();
        setLoading(false);
        return;
      }

      await AuthService.saveSession(result.technicien, true);
      Vibration.vibrate([0, 30, 60, 30]);
      setLoading(false);
      setSyncing(true);
      try {
        await syncService.forceFullSync();
      } catch (e) {
        console.warn('[Login] Sync après connexion:', e);
      }
      setSyncing(false);
      setSuccess(true);

      const displayName = result.technicien?.nom || result.technicien?.matricule || 'Technicien';
      setLoggedUserName(displayName);
      setTimeout(() => setShowSuccessOverlay(true), 600);
    } catch {
      setPasswordError('Une erreur est survenue.');
      Vibration.vibrate([0, 40, 60, 40]);
      triggerErrorAnimation();
    } finally {
      setLoading(false);
    }
  }, [isFormValid, loading, success, syncing, navigation]);

  const inputDisabled = loading || success || syncing;

  return (
    <View style={[s.container, { backgroundColor: colors.backgroundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundBase} />

      {/* ===== Background decoration ===== */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Soft gradient blobs */}
        <LinearGradient
          colors={isDark ? ['rgba(99,102,241,0.08)', 'rgba(99,102,241,0)'] : ['rgba(59,130,246,0.06)', 'rgba(59,130,246,0)']}
          style={[s.bgBlob, { top: -60, right: -80, width: 320, height: 320, borderRadius: 160 }]}
        />
        <LinearGradient
          colors={isDark ? ['rgba(99,102,241,0.06)', 'rgba(99,102,241,0)'] : ['rgba(99,102,241,0.05)', 'rgba(99,102,241,0)']}
          style={[s.bgBlob, { bottom: '10%', left: -100, width: 300, height: 300, borderRadius: 150 }]}
        />
        <LinearGradient
          colors={isDark ? ['rgba(59,130,246,0.05)', 'rgba(59,130,246,0)'] : ['rgba(6,182,212,0.04)', 'rgba(6,182,212,0)']}
          style={[s.bgBlob, { top: '40%', right: -50, width: 200, height: 200, borderRadius: 100 }]}
        />

        {/* Decorative dots */}
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

      <KeyboardAvoidingView
        style={s.kv}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingHorizontal: sizes.scrollPaddingH, paddingTop: SCREEN_H * 0.08, paddingBottom: 40 },
          ]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ===== LOGO SECTION ===== */}
          <View style={[s.logoSection, { marginBottom: sizes.sectionMarginBottom }]}>
            <Animated.View
              style={[
                {
                  width: sizes.logoWrap,
                  height: sizes.logoWrap,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                },
                logoStyle,
              ]}
            >
              {/* Pulsing rings */}
              <Animated.View
                style={[
                  s.pulseRing,
                  { width: sizes.logo + 20, height: sizes.logo + 20, borderRadius: (sizes.logo + 20) / 2 },
                  ring1Style,
                ]}
              />
              <Animated.View
                style={[
                  s.pulseRing,
                  { width: sizes.logo + 20, height: sizes.logo + 20, borderRadius: (sizes.logo + 20) / 2 },
                  ring2Style,
                ]}
              />

              {/* Logo container */}
              <View
                style={[
                  s.logoBox,
                  {
                    width: sizes.logo,
                    height: sizes.logo,
                    borderRadius: sizes.logoRadius,
                    shadowColor: colors.primaryDark,
                  },
                ]}
              >
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={{ width: '100%', height: '100%', borderRadius: sizes.logoRadius }}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
              <Text style={[s.title, { fontSize: sizes.titleSize, color: colors.textPrimary }]}>IT-Inventory</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(600).delay(350)}>
              <Text style={[s.subtitle, { fontSize: sizes.subtitleSize, color: colors.textMuted }]}>
                Gestion de stock IT
              </Text>
            </Animated.View>
          </View>

          {/* ===== INSTRUCTION ===== */}
          <View style={s.instructionWrap}>
            <View style={[s.instructionDot, { backgroundColor: colors.textMuted }]} />
            <Text style={[s.instructionText, { fontSize: fs(13), color: colors.textMuted }]}>
              Entrez votre mot de passe pour continuer
            </Text>
            <View style={[s.instructionDot, { backgroundColor: colors.textMuted }]} />
          </View>

          {/* ===== LOGIN CARD ===== */}
          <Animated.View
            style={[s.cardOuter, { maxWidth: sizes.cardMaxWidth }, cardShakeStyle]}
          >
            {/* Error glow behind card */}
            <Animated.View
              style={[
                s.errorGlowOverlay,
                { borderRadius: sizes.cardRadius + 4 },
                errorGlowStyle,
              ]}
              pointerEvents="none"
            />
            <Animated.View
              style={[
                s.card,
                {
                  padding: sizes.cardPadding,
                  borderRadius: sizes.cardRadius,
                  shadowColor: isDark ? '#000' : '#64748B',
                },
                errorFlashBorderStyle,
              ]}
            >
              {/* Secure header */}
              <View style={s.secureHeader}>
                <LinearGradient
                  colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']}
                  style={[
                    s.secureIconWrap,
                    {
                      width: sizes.secureIconSize,
                      height: sizes.secureIconSize,
                      borderRadius: sizes.secureIconRadius,
                    },
                  ]}
                >
                  <Icon name="shield-check" size={sizes.shieldIconSize} color={colors.primaryDark} />
                </LinearGradient>
                <View>
                  <Text style={[s.secureText, { fontSize: sizes.secureTextSize, color: colors.textPrimary }]}>
                    Connexion sécurisée
                  </Text>
                  <Text style={[s.secureSubtext, { color: colors.textMuted }]}>Chiffrement de bout en bout</Text>
                </View>
              </View>

              <View style={[s.cardDivider, { backgroundColor: colors.divider }]} />

              {/* Password field */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { fontSize: sizes.labelSize, color: colors.textSecondary }]}>MOT DE PASSE</Text>
                <View
                  style={[
                    s.inputRow,
                    {
                      height: sizes.inputHeight,
                      borderRadius: sizes.inputRadius,
                      backgroundColor: colors.surfaceInput,
                      borderColor: isDark ? colors.borderStrong : '#E2E8F0',
                    },
                    passwordError ? { borderColor: isDark ? colors.danger : '#FCA5A5', backgroundColor: isDark ? colors.dangerBg : '#FFF5F5' } : null,
                  ]}
                >
                  <View style={s.inputIconWrap}>
                    <Icon
                      name="lock-outline"
                      size={18}
                      color={colors.textMuted}
                    />
                  </View>
                  <TextInput
                    style={[
                      s.input,
                      { height: sizes.inputHeight, fontSize: sizes.inputFontSize, color: colors.textPrimary },
                    ]}
                    placeholder="Saisissez votre mot de passe"
                    placeholderTextColor={colors.textMuted}
                    ref={inputRef}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!inputDisabled}
                    underlineColorAndroid="transparent"
                    textAlignVertical="center"
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={[s.eyeBtn, { height: sizes.inputHeight }]}
                    onPress={() => { setPasswordVisible(!passwordVisible); Vibration.vibrate(5); }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={sizes.eyeIconSize}
                      color={passwordVisible ? colors.primaryDark : colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <View style={s.errorRow}>
                    <Animated.View style={errorIconAnimStyle}>
                      <View style={s.errorIconBg}>
                        <Icon name="close-circle" size={18} color="#FFF" />
                      </View>
                    </Animated.View>
                    <Text style={s.errorText}>{passwordError}</Text>
                  </View>
                ) : null}
              </View>

              {/* Submit button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleLogin}
                disabled={!isFormValid || inputDisabled}
                style={[
                  s.submitWrap,
                  { height: sizes.buttonHeight, borderRadius: sizes.inputRadius, shadowColor: colors.primaryDark },
                ]}
              >
                <LinearGradient
                  colors={
                    success
                      ? ['#10B981', '#059669']
                      : isFormValid
                        ? [colors.primaryDark, isDark ? '#3730A3' : '#4338CA']
                        : isDark ? [colors.surfaceElevated, colors.surfaceElevated] : ['#E2E8F0', '#E2E8F0']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    s.submitGrad,
                    { borderRadius: sizes.inputRadius },
                    (!isFormValid || inputDisabled) && s.submitDisabled,
                  ]}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={[s.submitText, { fontSize: sizes.buttonFontSize }]}>
                        Connexion...
                      </Text>
                    </>
                  ) : syncing ? (
                    <>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={[s.submitText, { fontSize: sizes.buttonFontSize }]}>
                        Synchronisation...
                      </Text>
                    </>
                  ) : success ? (
                    <>
                      <Animated.View entering={ZoomIn.springify()}>
                        <Icon name="check-circle" size={22} color="#FFF" />
                      </Animated.View>
                      <Text style={[s.submitText, { fontSize: sizes.buttonFontSize }]}>
                        Connecté !
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={[
                          s.submitText,
                          { fontSize: sizes.buttonFontSize },
                          !isFormValid && s.submitTextDisabled,
                        ]}
                      >
                        Se connecter
                      </Text>
                      {isFormValid && (
                        <Icon name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 4 }} />
                      )}
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ===== FOOTER ===== */}
          <View style={s.footer}>
            <View style={[s.footerBadge, { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' }]}>
              <Icon name="lock-outline" size={12} color={colors.textMuted} />
              <Text style={[s.footerText, { fontSize: fs(11), color: colors.textMuted }]}>
                Données protégées et chiffrées
              </Text>
            </View>
            <Text style={[s.versionText, { fontSize: fs(11), color: isDark ? colors.textMuted : '#CBD5E1' }]}>
              Version {APP_CONFIG.version}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== SUCCESS OVERLAY ===== */}
      <SuccessOverlay
        visible={showSuccessOverlay}
        userName={loggedUserName}
        onAnimationComplete={() => {
          setShowSuccessOverlay(false);
          navigation.replace('Auth', { rememberMe: true });
        }}
      />
    </View>
  );
};

// ==================== STYLES ====================
const s = StyleSheet.create({
  container: { flex: 1 },
  kv: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },

  // Background
  bgBlob: { position: 'absolute' },

  // Logo
  logoSection: { alignItems: 'center' },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(79,70,229,0.12)',
  },
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 16,
  },

  // Title
  title: {
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Instruction
  instructionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
    alignSelf: 'center',
  },
  instructionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  instructionText: {
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Card
  cardOuter: { width: '100%', marginBottom: 28 },
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },

  // Secure header
  secureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  secureIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureText: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  secureSubtext: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    marginBottom: 24,
  },

  // Field
  fieldWrap: { marginBottom: 24 },
  label: {
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingRight: 4,
  },
  inputIconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRowFocused: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputRowError: {},
  input: {
    flex: 1,
    paddingVertical: 0,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  eyeBtn: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorGlowOverlay: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  errorIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '700',
    flex: 1,
  },

  // Submit
  submitWrap: {
    width: '100%',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  submitGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  submitTextDisabled: {
    color: '#94A3B8',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 8,
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
    fontWeight: '500',
  },
  versionText: {
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
