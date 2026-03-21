import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const BIOMETRIC_SETTINGS_KEY = '@it-inventory/biometric-settings';
const BIOMETRIC_CREDENTIALS_KEY = '@it-inventory/biometric-credentials';

const rnBiometrics = new ReactNativeBiometrics();

interface BiometricSettings {
  enabled: boolean;
}

interface StoredCredentials {
  identifier: string;
  password: string;
}

interface BiometricAuthResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  credentials?: StoredCredentials;
}

const getBiometricLabel = (biometryType: BiometryTypes | null): string => {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return 'Reconnaissance faciale';
    case BiometryTypes.TouchID:
      return 'Empreinte digitale';
    case BiometryTypes.Biometrics:
      return 'Biométrie';
    default:
      return 'Biométrie';
  }
};

export const BiometricAuthService = {
  async isBiometricAvailable(): Promise<{ available: boolean; label: string }> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      return { available, label: getBiometricLabel(biometryType) };
    } catch {
      return { available: false, label: 'Biométrie' };
    }
  },

  async hasBiometricLoginEnabled(): Promise<boolean> {
    try {
      const [rawSettings, rawCredentials] = await Promise.all([
        AsyncStorage.getItem(BIOMETRIC_SETTINGS_KEY),
        EncryptedStorage.getItem(BIOMETRIC_CREDENTIALS_KEY),
      ]);

      if (!rawSettings || !rawCredentials) {
        return false;
      }

      const settings = JSON.parse(rawSettings) as BiometricSettings;
      return Boolean(settings.enabled);
    } catch {
      return false;
    }
  },

  async enableBiometricLogin(credentials: StoredCredentials): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(BIOMETRIC_SETTINGS_KEY, JSON.stringify({ enabled: true } satisfies BiometricSettings)),
      EncryptedStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(credentials)),
    ]);
  },

  async disableBiometricLogin(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(BIOMETRIC_SETTINGS_KEY),
      EncryptedStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY),
    ]);
  },

  async authenticateAndGetCredentials(): Promise<BiometricAuthResult> {
    const enabled = await this.hasBiometricLoginEnabled();
    if (!enabled) {
      return { success: false, error: 'Biométrie non configurée.' };
    }

    const { available } = await this.isBiometricAvailable();
    if (!available) {
      return { success: false, error: 'Biométrie indisponible sur cet appareil.' };
    }

    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirmez votre identité',
        cancelButtonText: 'Annuler',
      });

      if (!success) {
        return { success: false, cancelled: true };
      }

      const rawCredentials = await EncryptedStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
      if (!rawCredentials) {
        return { success: false, error: 'Identifiants biométriques introuvables.' };
      }

      const credentials = JSON.parse(rawCredentials) as StoredCredentials;
      if (!credentials.identifier || !credentials.password) {
        return { success: false, error: 'Identifiants biométriques invalides.' };
      }

      return { success: true, credentials };
    } catch (error) {
      const errorMessage = String((error as Error)?.message || '');
      const cancelled = /cancel|annul/i.test(errorMessage);
      return {
        success: false,
        cancelled,
        error: cancelled ? undefined : 'Authentification biométrique échouée.',
      };
    }
  },
};

