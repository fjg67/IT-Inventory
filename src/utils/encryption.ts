// ============================================
// ENCRYPTION UTILITIES - IT-Inventory Application
// Stockage sécurisé des données sensibles
// ============================================

import EncryptedStorage from 'react-native-encrypted-storage';

const STORAGE_KEYS = {
  SESSION: '@it-inventory/session',
  TECHNICIEN: '@it-inventory/technicien',
  SITE_ACTIF: '@it-inventory/siteActif',
  LAST_SYNC: '@it-inventory/lastSync',
  PREFERENCES: '@it-inventory/preferences',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Stocke des données chiffrées
 */
export async function storeSecureData<T>(key: StorageKey, value: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await EncryptedStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('[EncryptedStorage] Erreur stockage:', key, error);
    throw new Error('Erreur lors du stockage sécurisé');
  }
}

/**
 * Récupère des données chiffrées
 */
export async function getSecureData<T>(key: StorageKey): Promise<T | null> {
  try {
    const jsonValue = await EncryptedStorage.getItem(key);
    if (jsonValue === null || jsonValue === undefined) {
      return null;
    }
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    console.error('[EncryptedStorage] Erreur lecture:', key, error);
    return null;
  }
}

/**
 * Supprime des données chiffrées
 */
export async function removeSecureData(key: StorageKey): Promise<void> {
  try {
    await EncryptedStorage.removeItem(key);
  } catch (error) {
    console.error('[EncryptedStorage] Erreur suppression:', key, error);
  }
}

/**
 * Efface toutes les données chiffrées
 */
export async function clearAllSecureData(): Promise<void> {
  try {
    await EncryptedStorage.clear();
  } catch (error) {
    console.error('[EncryptedStorage] Erreur effacement:', error);
  }
}

/**
 * Vérifie si une clé existe
 */
export async function hasSecureData(key: StorageKey): Promise<boolean> {
  try {
    const value = await EncryptedStorage.getItem(key);
    return value !== null && value !== undefined;
  } catch {
    return false;
  }
}

// ==================== HELPERS SPÉCIFIQUES ====================

/**
 * Stocke la session Supabase
 */
export async function storeSession(session: object): Promise<void> {
  await storeSecureData(STORAGE_KEYS.SESSION, session);
}

/**
 * Récupère la session Supabase
 */
export async function getSession(): Promise<object | null> {
  return getSecureData<object>(STORAGE_KEYS.SESSION);
}

/**
 * Supprime la session
 */
export async function clearSession(): Promise<void> {
  await removeSecureData(STORAGE_KEYS.SESSION);
}

/**
 * Stocke le technicien courant
 */
export async function storeTechnicien(technicien: object): Promise<void> {
  await storeSecureData(STORAGE_KEYS.TECHNICIEN, technicien);
}

/**
 * Récupère le technicien courant
 */
export async function getTechnicien(): Promise<object | null> {
  return getSecureData<object>(STORAGE_KEYS.TECHNICIEN);
}

/**
 * Supprime le technicien
 */
export async function clearTechnicien(): Promise<void> {
  await removeSecureData(STORAGE_KEYS.TECHNICIEN);
}

/**
 * Stocke le site actif
 */
export async function storeSiteActif(site: object): Promise<void> {
  await storeSecureData(STORAGE_KEYS.SITE_ACTIF, site);
}

/**
 * Récupère le site actif
 */
export async function getSiteActif(): Promise<object | null> {
  return getSecureData<object>(STORAGE_KEYS.SITE_ACTIF);
}

/**
 * Export des clés pour utilisation externe
 */
export { STORAGE_KEYS };
