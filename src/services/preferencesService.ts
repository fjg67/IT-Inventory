// ============================================
// PREFERENCES SERVICE - IT-Inventory
// Gestion des préférences utilisateur persistées
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';

const KEYS = {
  DARK_MODE: '@it-inventory/pref_dark_mode',
  NOTIFICATIONS: '@it-inventory/pref_notifications',
  VIBRATIONS: '@it-inventory/pref_vibrations',
} as const;

export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  vibrations: boolean;
}

const DEFAULTS: UserPreferences = {
  darkMode: false,
  notifications: true,
  vibrations: true,
};

// État en mémoire pour accès rapide (sans await)
let _prefs: UserPreferences = { ...DEFAULTS };

/**
 * Charge les préférences depuis AsyncStorage.
 * À appeler au démarrage de l'app ou du SettingsScreen.
 */
async function load(): Promise<UserPreferences> {
  try {
    const [dm, notif, vib] = await Promise.all([
      AsyncStorage.getItem(KEYS.DARK_MODE),
      AsyncStorage.getItem(KEYS.NOTIFICATIONS),
      AsyncStorage.getItem(KEYS.VIBRATIONS),
    ]);
    _prefs = {
      darkMode: dm === 'true',
      notifications: notif !== null ? notif === 'true' : DEFAULTS.notifications,
      vibrations: vib !== null ? vib === 'true' : DEFAULTS.vibrations,
    };
  } catch (e) {
    console.warn('[Preferences] Erreur chargement:', e);
    _prefs = { ...DEFAULTS };
  }
  return _prefs;
}

/**
 * Sauvegarde une préférence.
 */
async function set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): Promise<void> {
  _prefs[key] = value;
  try {
    const storageKey = key === 'darkMode' ? KEYS.DARK_MODE
      : key === 'notifications' ? KEYS.NOTIFICATIONS
      : KEYS.VIBRATIONS;
    await AsyncStorage.setItem(storageKey, String(value));
  } catch (e) {
    console.warn('[Preferences] Erreur sauvegarde:', e);
  }
}

/**
 * Retourne les préférences courantes (en mémoire, sync).
 */
function get(): UserPreferences {
  return { ..._prefs };
}

/**
 * Vibration conditionnelle : ne vibre que si l'utilisateur a activé les vibrations.
 * Remplace `Vibration.vibrate(...)` dans toute l'app.
 */
function vibrate(pattern?: number | number[]): void {
  if (!_prefs.vibrations) return;
  if (pattern !== undefined) {
    Vibration.vibrate(pattern);
  } else {
    Vibration.vibrate(10);
  }
}

/**
 * Vérifie si les notifications (alertes email) sont activées.
 */
function areNotificationsEnabled(): boolean {
  return _prefs.notifications;
}

/**
 * Vérifie si le thème sombre est activé.
 */
function isDarkMode(): boolean {
  return _prefs.darkMode;
}

export const preferencesService = {
  load,
  set,
  get,
  vibrate,
  areNotificationsEnabled,
  isDarkMode,
};
