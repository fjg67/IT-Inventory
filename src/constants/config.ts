// ============================================
// CONFIGURATION - IT-Inventory Application
// ============================================

import { SupabaseConfig } from '@/types';

// Configuration Supabase
// À remplacer par vos vraies clés via .env
export const SUPABASE_CONFIG: SupabaseConfig = {
  url: process.env.SUPABASE_URL || 'https://lghhzbkbwttvroxodlzd.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU',
};

// Configuration de l'application
export const APP_CONFIG = {
  // Nom de l'application
  appName: 'IT-Inventory',
  version: '1.0.0',
  buildNumber: '20260208',
  
  // Base de données locale
  database: {
    name: 'it-inventory.db',
    version: 1,
  },
  
  // Pagination
  pagination: {
    defaultLimit: 50,
    maxLimit: 100,
  },
  
  // Synchronisation
  sync: {
    // Intervalle de synchronisation automatique (en ms)
    autoSyncInterval: 120000, // 2 minutes
    // Nombre maximum de tentatives avant erreur
    maxRetries: 5,
    // Délai avant nettoyage des éléments synchronisés (en jours)
    cleanupDelay: 7,
    // Taille du batch de synchronisation
    batchSize: 50,
  },
  
  // Cache d'images
  imageCache: {
    // Durée de cache (en jours)
    cacheDuration: 30,
    // Taille maximum du cache (en Mo)
    maxCacheSize: 100,
  },
  
  // Recherche
  search: {
    // Délai du debounce (en ms)
    debounceDelay: 300,
    // Nombre minimum de caractères pour rechercher
    minSearchLength: 2,
  },
  
  // Alertes stock
  stock: {
    // Pourcentage du stock mini pour alerte orange
    warningThreshold: 1.5, // 150% du stock mini
    // Afficher alerte après X mouvements sous stock mini
    alertAfterMouvements: 3,
  },
  
  // DataWedge (Zebra)
  dataWedge: {
    profileName: 'IT-InventoryIT',
    intentAction: 'com.it-inventory.SCAN',
    intentCategory: 'android.intent.category.DEFAULT',
  },
  
  // Archivage
  archive: {
    // Seuil d'archivage (en années)
    archiveThreshold: 2,
  },
} as const;

// Messages d'erreur
export const ERROR_MESSAGES = {
  // Réseau
  NETWORK_OFFLINE: 'Pas de connexion réseau. Les modifications seront synchronisées ultérieurement.',
  NETWORK_ERROR: 'Erreur de connexion au serveur.',
  
  // Base de données
  DB_INIT_ERROR: 'Erreur lors de l\'initialisation de la base de données.',
  DB_QUERY_ERROR: 'Erreur lors de la requête à la base de données.',
  
  // Synchronisation
  SYNC_IN_PROGRESS: 'Synchronisation en cours...',
  SYNC_COMPLETED: 'Synchronisation terminée.',
  SYNC_FAILED: 'Échec de la synchronisation. Réessayez plus tard.',
  SYNC_PARTIAL: 'Synchronisation partielle. Certains éléments n\'ont pas pu être synchronisés.',
  
  // Stock
  STOCK_INSUFFICIENT: 'Stock insuffisant pour cette opération.',
  STOCK_NEGATIVE: 'Le stock ne peut pas être négatif.',
  
  // Articles
  ARTICLE_NOT_FOUND: 'Article non trouvé.',
  ARTICLE_REFERENCE_EXISTS: 'Cette référence existe déjà.',
  
  // Validation
  REQUIRED_FIELD: 'Ce champ est requis.',
  INVALID_QUANTITY: 'La quantité doit être un nombre positif.',
  INVALID_REFERENCE: 'La référence est invalide.',
  
  // Général
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.',
  OPERATION_CANCELLED: 'Opération annulée.',
} as const;

// Messages de succès
export const SUCCESS_MESSAGES = {
  MOUVEMENT_CREATED: 'Mouvement enregistré avec succès.',
  ARTICLE_CREATED: 'Article créé avec succès.',
  ARTICLE_UPDATED: 'Article mis à jour avec succès.',
  TRANSFERT_COMPLETED: 'Transfert effectué avec succès.',
  TRANSFERT_CREATED: 'Transfert effectué avec succès.',
  EXPORT_COMPLETED: 'Export terminé.',
  SYNC_COMPLETED: 'Synchronisation terminée avec succès.',
} as const;

// Unités disponibles
export const AVAILABLE_UNITS = [
  { value: 'unité', label: 'Unité' },
  { value: 'paire', label: 'Paire' },
  { value: 'boîte', label: 'Boîte' },
  { value: 'lot', label: 'Lot' },
  { value: 'carton', label: 'Carton' },
  { value: 'palette', label: 'Palette' },
  { value: 'mètre', label: 'Mètre' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'litre', label: 'Litre' },
] as const;

// Types de mouvements avec labels
export const MOUVEMENT_LABELS = {
  entree: 'Entrée',
  sortie: 'Sortie',
  ajustement: 'Ajustement',
  transfert_depart: 'Transfert (départ)',
  transfert_arrivee: 'Transfert (arrivée)',
} as const;

// Export de configuration
export type AppConfig = typeof APP_CONFIG;
export type ErrorMessages = typeof ERROR_MESSAGES;
export type SuccessMessages = typeof SUCCESS_MESSAGES;
