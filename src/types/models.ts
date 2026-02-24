// ============================================
// TYPES ET MODÈLES - IT-Inventory Application
// Application de Gestion de Stock pour Zebra TC22
// ============================================

// ==================== ENUMS ====================

export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  ERROR = 'error',
}

export enum MouvementType {
  ENTREE = 'entree',
  SORTIE = 'sortie',
  AJUSTEMENT = 'ajustement',
  TRANSFERT_DEPART = 'transfert_depart',
  TRANSFERT_ARRIVEE = 'transfert_arrivee',
}

export enum SyncOperation {
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
}

// ==================== MODÈLES ====================

export interface Site {
  id: string | number;
  code: string;
  nom: string;
  adresse?: string;
  actif: boolean;
  dateCreation: Date;
  syncStatus: SyncStatus;
}

export interface Technicien {
  id: string | number;
  nom: string;
  prenom: string;
  matricule?: string;
  sitePrincipalId?: string | number;
  sitePrincipal?: Site;
  actif: boolean;
  dateCreation: Date;
}

export interface Categorie {
  id: string | number;
  nom: string;
  parentId?: string | number;
  parent?: Categorie;
  ordre: number;
  syncStatus: SyncStatus;
  children?: Categorie[];
}

export interface Article {
  id: string | number;
  reference: string;
  nom: string;
  description?: string;
  categorieId?: string | number;
  categorie?: Categorie;
  codeFamille?: string;
  famille?: string;
  typeArticle?: string;
  sousType?: string;
  marque?: string;
  emplacement?: string;
  stockMini: number;
  unite: string;
  photoUrl?: string;
  actif: boolean;
  dateCreation: Date;
  dateModification: Date;
  syncStatus: SyncStatus;
  // Champs calculés (via JOIN)
  quantiteActuelle?: number;
  categorieNom?: string;
}

export interface StockSite {
  id: string | number;
  articleId: string | number;
  article?: Article;
  siteId: string | number;
  site?: Site;
  quantiteActuelle: number;
  dateDernierMouvement?: Date;
  syncStatus: SyncStatus;
}

export interface Mouvement {
  id: string | number;
  articleId: string | number;
  article?: Article;
  siteId: string | number;
  site?: Site;
  type: MouvementType;
  quantite: number;
  stockAvant: number;
  stockApres: number;
  technicienId: string | number;
  technicien?: Technicien;
  dateMouvement: Date;
  commentaire?: string;
  transfertVersSiteId?: string | number;
  transfertVersSite?: Site;
  referenceExterne?: string;
  syncStatus: SyncStatus;
}

export interface JournalModification {
  id: string | number;
  tableName: string;
  recordId: string | number;
  champModifie: string;
  ancienneValeur?: string;
  nouvelleValeur?: string;
  technicienId: string | number;
  technicien?: Technicien;
  dateModification: Date;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id: number;
  operation: SyncOperation;
  tableName: string;
  recordId?: number;
  data: string; // JSON stringifié
  timestamp: number;
  retries: number;
  errorMessage?: string;
  status: SyncStatus;
}

// ==================== FORMULAIRES ====================

export interface MouvementStockForm {
  articleId: string | number;
  siteId: string | number;
  type: 'entree' | 'sortie' | 'ajustement';
  quantite: number;
  commentaire?: string;
  referenceExterne?: string;
}

export interface TransfertForm {
  articleId: string | number;
  siteDepartId: string | number;
  siteArriveeId: string | number;
  quantite: number;
  commentaire?: string;
}

export interface ArticleForm {
  reference: string;
  nom: string;
  description?: string;
  categorieId?: string | number;
  codeFamille?: string;
  famille?: string;
  typeArticle?: string;
  sousType?: string;
  marque?: string;
  emplacement?: string;
  stockMini: number;
  unite: string;
  photoUrl?: string;
}

export interface ArticleFilters {
  categorieId?: string | number | null;
  stockFaible: boolean;
  searchQuery: string;
  codeFamille?: string | null;
  famille?: string | null;
  typeArticle?: string | null;
  sousType?: string | null;
  marque?: string | null;
  emplacement?: string | null;
}

export interface ExportOptions {
  siteId?: string | number;
  dateDebut?: Date;
  dateFin?: Date;
  type: 'articles' | 'mouvements' | 'stocks' | 'journal';
}

// ==================== STATISTIQUES ====================

export interface DashboardStats {
  totalArticles: number;
  articlesAlerte: number;
  mouvementsAujourdhui: number;
  derniersMovements: Mouvement[];
}

// ==================== PAGINATION ====================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// ==================== UTILITAIRES ====================

export type DatabaseRow = Record<string, unknown>;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
