// ============================================
// SUPABASE CLIENT - IT-Inventory Application
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_CONFIG } from '@/constants';

// Custom storage adapter pour React Native
const customStorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

// Client Supabase
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        auth: {
          storage: customStorageAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return supabaseInstance;
}

// Authentification anonyme pour l'appareil
export async function initializeSupabaseAuth(): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Vérifier si une session existe
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Créer une session anonyme
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      // Anonymous sign-in peut être désactivé côté projet: ne pas remonter en erreur bloquante
      console.warn('[Supabase] Auth anonyme indisponible, on continue sans session anonyme');
    } else {
      console.log('[Supabase] Authentification anonyme réussie');
    }
  } else {
    console.log('[Supabase] Session existante restaurée');
  }
}

// Tables Supabase
export const tables = {
  sites: 'Site',
  techniciens: 'User',
  articles: 'Article',
  stocksSites: 'ArticleStock',
  mouvements: 'StockMovement',
  pushDeviceTokens: 'PushDeviceToken',
  journalModifications: 'AuditLog',
  loginHistory: 'LoginHistory',
  inventoryRecount: 'InventoryRecount',
  pcSentHistory: 'PCSentHistory',
} as const;

// Export du client
export const supabase = getSupabaseClient();
export default supabase;
