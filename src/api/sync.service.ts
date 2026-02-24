// ============================================
// SYNC SERVICE - IT-Inventory Application
// Stub : plus de SQLite local, données 100 % Supabase.
// Les appels sont des no-op pour éviter les erreurs.
// ============================================

/**
 * Service de synchronisation désactivé.
 * L'app utilise uniquement Supabase ; il n'y a plus de base SQLite ni de queue de sync.
 */
class SyncService {
  async init(): Promise<void> {
    // No-op
  }

  destroy(): void {
    // No-op
  }

  async syncPendingData(): Promise<void> {
    // No-op
  }

  async forceFullSync(): Promise<void> {
    // No-op : les données sont déjà lues/écrites directement dans Supabase
  }
}

export const syncService = new SyncService();
export default syncService;
