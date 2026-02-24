// ============================================
// TYPES API - IT-Inventory Application
// ============================================

// ==================== RÉPONSES API ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncResponse {
  synced: number;
  failed: number;
  errors: string[];
}

// ==================== RÉPONSES SQLite ====================

export interface SQLiteResultSet {
  rows: {
    length: number;
    item: (index: number) => Record<string, unknown>;
    raw: () => Record<string, unknown>[];
  };
  rowsAffected: number;
  insertId?: number;
}

export interface SQLiteTransaction {
  executeSql: (
    sql: string,
    params?: (string | number | boolean | null)[],
  ) => Promise<[SQLiteTransaction, SQLiteResultSet]>;
}

// ==================== DTOs SUPABASE ====================

export interface SiteDTO {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicienDTO {
  id: string;
  technicianId: string | null;
  name: string;
  password: string;
  role: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleDTO {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  barcode: string | null;
  imageUrl: string | null;
  unit: string;
  minStock: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  articleType: string | null;
  codeFamille: string | null;
  emplacement: string | null;
}

export interface StockSiteDTO {
  id: string;
  articleId: string;
  siteId: string;
  quantity: number;
}

export interface MouvementDTO {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  articleId: string;
  fromSiteId: string;
  toSiteId: string | null;
  userId: string;
  createdAt: string;
}

export interface JournalModificationDTO {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  userId: string;
  articleId: string | null;
  createdAt: string;
}

// ==================== MAPPEURS ====================

export type DTOMapper<TModel, TDto> = {
  toModel: (dto: TDto) => TModel;
  toDTO: (model: TModel) => Partial<TDto>;
};

// ==================== SYNC ====================

export interface SyncPayload {
  operation: 'insert' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface SyncConflict {
  local: Record<string, unknown>;
  remote: Record<string, unknown>;
  resolution: 'local' | 'remote' | 'merge';
}

// ==================== RÉSEAU ====================

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}
