import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { APP_CONFIG } from '@/constants/config';
import { useResponsive } from '@/utils/responsive';
import { useShakeAnimation } from '@/hooks/useShakeAnimation';
import { useLoginForm } from '@/hooks/useLoginForm';

import LoginBackground from '@/components/login/LoginBackground';
import LoginLogo from '@/components/login/LoginLogo';
import SecurityBadge from '@/components/login/SecurityBadge';
import PasswordInput from '@/components/login/PasswordInput';
import LoginButton from '@/components/login/LoginButton';
import LoginError from '@/components/login/LoginError';
import LoginFooter from '@/components/login/LoginFooter';
import { LOGIN_COLORS } from '@/components/login/loginTheme';
import { BiometricAuthService } from '@/services/biometricAuthService';
import { AuthService } from '@/services/authService';
import { syncService } from '@/api/sync.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { fs, rv } = useResponsive();

  const inputRef = useRef<TextInput>(null);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [biometric, setBiometric] = useState<{ available: boolean; enabled: boolean; label: string }>({ available: false, enabled: false, label: 'Biométrie' });
  const [biometricLoading, setBiometricLoading] = useState(false);

  const { shakeStyle, triggerShake } = useShakeAnimation();
  const screenOpacity = useSharedValue(1);

  const onSuccessReady = useCallback(() => {
    screenOpacity.value = withTiming(0, { duration: 350 });
    setTimeout(() => {
      navigation.replace('BranchSelection', { rememberMe: true });
    }, 380);
  }, [navigation, screenOpacity]);

  const {
    password,
    setPassword,
    isValid,
    isLoading,
    isSyncing,
    error,
    showSuccess,
    errorSignal,
    handleSubmit,
  } = useLoginForm({
    triggerShake,
    onSuccessReady,
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([BiometricAuthService.isBiometricAvailable(), BiometricAuthService.hasBiometricLoginEnabled()])
      .then(([sensor, enabled]) => {
        if (mounted) setBiometric({ available: sensor.available, enabled, label: sensor.label });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleBiometricLogin = useCallback(async () => {
    if (biometricLoading) return;
    setBiometricLoading(true);
    try {
      const result = await BiometricAuthService.authenticateAndGetCredentials();
      if (!result.success) {
        if (!result.cancelled && result.error) Alert.alert('Connexion biométrique', result.error);
        return;
      }
      const login = await AuthService.login(result.credentials!.identifier, result.credentials!.password);
      if (!login.success) throw new Error(login.error);
      await AuthService.saveSession(login.technicien, true);
      try {
        await syncService.forceFullSync();
      } catch (syncError) {
        console.warn('[Login] Biometric post-login sync failed:', syncError);
      }
      screenOpacity.value = withTiming(0, { duration: 350 });
      setTimeout(() => navigation.replace('BranchSelection', { rememberMe: true }), 380);
    } catch (error) {
      Alert.alert('Connexion impossible', error instanceof Error ? error.message : 'Échec de la connexion biométrique.');
    } finally {
      setBiometricLoading(false);
    }
  }, [biometricLoading, navigation, screenOpacity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const screenAnim = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const contentPadding = rv({ phone: 22, tablet: 36 });

  return (
    <LoginBackground>
      <StatusBar barStyle="light-content" backgroundColor={LOGIN_COLORS.bg_primary} />

      <Animated.View style={[styles.flex, screenAnim]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingHorizontal: contentPadding,
                  paddingVertical: 28,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.centerWrap}>
                <LoginLogo />

                <Animated.Text entering={FadeIn.duration(450).delay(360)} style={[styles.helperText, { fontSize: fs(13) }]}>
                  Entrez votre mot de passe pour continuer
                </Animated.Text>

                <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.card}>
                  <SecurityBadge />

                  <View style={styles.fieldWrap}>
                    <PasswordInput
                      inputRef={inputRef}
                      value={password}
                      onChangeText={setPassword}
                      onSubmitEditing={handleSubmit}
                      secureTextEntry={secureTextEntry}
                      onToggleSecure={() => setSecureTextEntry((v) => !v)}
                      disabled={isLoading || isSyncing || showSuccess}
                      errorSignal={errorSignal}
                      shakeStyle={shakeStyle}
                    />

                    <LoginError message={error} />
                  </View>

                  <LoginButton
                    isValid={isValid}
                    isLoading={isLoading}
                    isSyncing={isSyncing}
                    isSuccess={showSuccess}
                    onPress={handleSubmit}
                  />
                  {biometric.available && biometric.enabled ? (
                    <TouchableOpacity
                      onPress={handleBiometricLogin}
                      disabled={biometricLoading || isLoading || isSyncing || showSuccess}
                      activeOpacity={0.82}
                      style={styles.biometricButton}
                    >
                      {biometricLoading ? <Icon name="loading" size={19} color={LOGIN_COLORS.green_primary} /> : <Icon name="face-recognition" size={19} color={LOGIN_COLORS.green_primary} />}
                      <Text style={styles.biometricButtonText}>{biometricLoading ? 'Vérification...' : `Continuer avec ${biometric.label}`}</Text>
                    </TouchableOpacity>
                  ) : null}
                </Animated.View>

                <LoginFooter version={APP_CONFIG.version} />
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Animated.View>
    </LoginBackground>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerWrap: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  helperText: {
    color: LOGIN_COLORS.text_muted,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 125, 112, 0.15)',
    padding: 24,
    shadowColor: '#007D70',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  fieldWrap: {
    marginTop: 16,
  },
  biometricButton: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B5D9C6',
    backgroundColor: '#F2F8F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  biometricButtonText: {
    color: LOGIN_COLORS.green_primary,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default LoginScreen;
