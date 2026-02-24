// ============================================
// DATABASE SERVICE - IT-Inventory Application
// Gestion SQLite avec react-native-sqlite-storage
// ============================================

import SQLite, {
  SQLiteDatabase,
  Transaction,
  ResultSet,
} from 'react-native-sqlite-storage';
import { APP_CONFIG, ERROR_MESSAGES } from '@/constants';
import { SCHEMA_QUERIES, INDEX_QUERIES, SEED_DATA, TableName } from './schema';

// Désactiver les promesses globales pour gérer manuellement et éviter les doubles rejets
SQLite.enablePromise(false);

// Instance de la base de données
let database: SQLiteDatabase | null = null;

// Type pour les résultats de requête
export type QueryResult<T = Record<string, unknown>> = T[];

// Interface pour les transactions
export interface DatabaseTransaction {
  executeSql: (
    sql: string,
    params?: (string | number | boolean | null)[],
  ) => Promise<ResultSet>;
}

/**
 * Ouvre la connexion à la base de données
 */
export async function openDatabase(): Promise<SQLiteDatabase> {
  if (database) {
    return database;
  }

  return new Promise((resolve, reject) => {
    SQLite.openDatabase(
      {
        name: APP_CONFIG.database.name,
        location: 'default',
      },
      (db) => {
        database = db;
        console.log('[Database] Connexion établie');
        resolve(db);
      },
      (error) => {
        console.error('[Database] Erreur de connexion:', error);
        reject(new Error(ERROR_MESSAGES.DB_INIT_ERROR));
      }
    );
  });
}

/**
 * Ferme la connexion à la base de données
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    return new Promise((resolve, reject) => {
      database!.close(
        () => {
          database = null;
          console.log('[Database] Connexion fermée');
          resolve();
        },
        (error) => {
          console.error('[Database] Erreur fermeture:', error);
          reject(error);
        }
      );
    });
  }
}

/**
 * Récupère l'instance de la base de données
 */
export function getDatabase(): SQLiteDatabase {
  if (!database) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return database;
}

/**
 * Helper générique pour exécuter du SQL
 */
function runSql(
  sql: string,
  params: (string | number | boolean | null)[] = [],
): Promise<ResultSet> {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.executeSql(
      sql,
      params,
      (result) => {
        // react-native-sqlite-storage retourne parfois le result directement ou dans un array selon les versions/modes
        // Si callback mode, c'est généralement (results)
        resolve(result as unknown as ResultSet);
      },
      (error) => {
        console.error('[Database] Erreur de requête:', sql, params, error);
        reject(new Error(ERROR_MESSAGES.DB_QUERY_ERROR));
      }
    );
  });
}

/**
 * Exécute une requête SQL et retourne les résultats (rows)
 */
export async function executeSql<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null)[] = [],
): Promise<QueryResult<T>> {
  const result = await runSql(sql, params);
  const rows: T[] = [];
  if (result && result.rows) {
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i) as T);
    }
  }
  return rows;
}

/**
 * Exécute une requête d'insertion et retourne l'ID inséré
 */
export async function executeInsert(
  sql: string,
  params: (string | number | boolean | null)[] = [],
): Promise<number> {
  const result = await runSql(sql, params);
  return result.insertId ?? 0;
}

/**
 * Exécute une requête de mise à jour/suppression et retourne le nombre de lignes affectées
 */
export async function executeUpdate(
  sql: string,
  params: (string | number | boolean | null)[] = [],
): Promise<number> {
  const result = await runSql(sql, params);
  return result.rowsAffected;
}

/**
 * Exécute une transaction
 */
export async function executeTransaction<T>(
  callback: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
  const db = getDatabase();
  
  return new Promise<T>((resolve, reject) => {
    db.transaction(
      async (tx: Transaction) => {
        try {
          // Wrapper pour simplifier l'API
          const wrappedTx: DatabaseTransaction = {
            executeSql: async (sql, params = []) => {
              return new Promise<ResultSet>((sqlResolve, sqlReject) => {
                tx.executeSql(
                  sql,
                  params,
                  (_tx, result) => sqlResolve(result),
                  (_tx, error) => {
                    sqlReject(error);
                    return false; // Stop propagation
                  },
                );
              });
            },
          };
          const result = await callback(wrappedTx);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        console.error('[Database] Erreur de transaction:', error);
        reject(error);
      },
      () => {
        // Transaction success callback
      }
    );
  });
}

/**
 * Initialise les tables de la base de données
 */
export async function initializeTables(): Promise<void> {
  const db = getDatabase();
  
  console.log('[Database] Initialisation des tables...');
  
  try {
    // Créer les tables dans l'ordre (respect des FK)
    const tableOrder: TableName[] = [
      'sites',
      'techniciens',
      'categories',
      'articles',
      'stocks_sites',
      'mouvements',
      'journal_modifications',
      'sync_queue',
      'app_config',
    ];
    
    for (const tableName of tableOrder) {
      await db.executeSql(SCHEMA_QUERIES[tableName]);
      console.log(`[Database] Table ${tableName} créée/vérifiée`);
    }
    
    // Créer les index
    for (const indexQuery of INDEX_QUERIES) {
      await db.executeSql(indexQuery);
    }
    console.log('[Database] Index créés');
    
    // Insérer les données de seed
    await db.executeSql(SEED_DATA.defaultSite);
    await db.executeSql(SEED_DATA.defaultCategories);
    console.log('[Database] Données initiales insérées');

    // Migration : remplacer anciens sites par les vrais sites
    await db.executeSql(
      "UPDATE sites SET code='STOCK5', nom='Stock 5ième', adresse='5ème étage' WHERE id=1 AND code='MAIN'",
    );
    await db.executeSql(
      "INSERT OR IGNORE INTO sites (id, code, nom, adresse, actif, sync_status) VALUES (2, 'STOCK8', 'Stock 8ième', '8ème étage', 1, 'synced')",
    );
    await db.executeSql(
      "INSERT OR IGNORE INTO sites (id, code, nom, adresse, actif, sync_status) VALUES (3, 'STOCKEPINAL', 'Stock Epinal', 'Site Epinal', 1, 'synced')",
    );
    // Migration : remplacer anciennes catégories
    await db.executeSql("DELETE FROM categories");
    await db.executeSql(SEED_DATA.defaultCategories);
    console.log('[Database] Migration sites/catégories appliquée');

    // Migration : ajouter colonne code_famille si absente
    try {
      await db.executeSql("ALTER TABLE articles ADD COLUMN code_famille TEXT");
      console.log('[Database] Colonne code_famille ajoutée');
    } catch {
      // Colonne existe déjà, ignorer
    }

    // Migration : ajouter colonne famille si absente
    try {
      await db.executeSql("ALTER TABLE articles ADD COLUMN famille TEXT");
      console.log('[Database] Colonne famille ajoutée');
    } catch {
      // Colonne existe déjà, ignorer
    }

    // Migration : ajouter colonne type_article si absente
    try {
      await db.executeSql("ALTER TABLE articles ADD COLUMN type_article TEXT");
      console.log('[Database] Colonne type_article ajoutée');
    } catch {
      // Colonne existe déjà, ignorer
    }

    // Migration : ajouter colonne sous_type si absente
    try {
      await db.executeSql("ALTER TABLE articles ADD COLUMN sous_type TEXT");
      console.log('[Database] Colonne sous_type ajoutée');
    } catch {
      // Colonne existe déjà, ignorer
    }

    // Migration : ajouter colonne marque si absente
    try {
      await db.executeSql("ALTER TABLE articles ADD COLUMN marque TEXT");
      console.log('[Database] Colonne marque ajoutée');
    } catch {
      // Colonne existe déjà, ignorer
    }

    // Migration : ajouter colonne emplacement si absente
    try {
      await db.executeSql("ALTER TABLE articles ADD COLUMN emplacement TEXT");
      console.log('[Database] Colonne emplacement ajoutée');
    } catch {
      // Colonne existe déjà, ignorer
    }

    // Migration : ajouter colonne sync_status à techniciens (pour SyncService)
    try {
      await db.executeSql("ALTER TABLE techniciens ADD COLUMN sync_status TEXT DEFAULT 'pending'");
      console.log('[Database] Colonne techniciens.sync_status ajoutée');
    } catch {
      // Colonne existe déjà, ignorer
    }

    // Migration : s'assurer que chaque article a au moins une entrée stocks_sites
    // sur le site où il a été créé (site 1 par défaut pour les anciens articles)
    await db.executeSql(`
      INSERT OR IGNORE INTO stocks_sites (article_id, site_id, quantite_actuelle, sync_status)
      SELECT a.id, 1, 0, 'synced'
      FROM articles a
      WHERE a.actif = 1
        AND NOT EXISTS (
          SELECT 1 FROM stocks_sites ss WHERE ss.article_id = a.id AND ss.site_id = 1
        )
    `);
    // Nettoyer les entrées stocks_sites parasites sur les autres sites
    // (créées par erreur, sans mouvement et à quantité 0)
    await db.executeSql(`
      DELETE FROM stocks_sites
      WHERE site_id != 1
        AND quantite_actuelle = 0
        AND date_dernier_mouvement IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM mouvements m
          WHERE m.article_id = stocks_sites.article_id AND m.site_id = stocks_sites.site_id
        )
    `);
    console.log('[Database] Migration stocks_sites appliquée');

    // Nettoyer les sync_queue en erreur (IDs locaux incompatibles avec Supabase)
    await db.executeSql(
      "DELETE FROM sync_queue WHERE status = 'error'",
    );
    console.log('[Database] Nettoyage sync_queue erreurs');

    // Désactiver les techniciens Jove Garcia (administrateur) et Florian JOVE GARCIA (T555)
    try {
      await db.executeSql(
        "UPDATE techniciens SET actif = 0 WHERE matricule IN ('administrateur', 'T555')",
      );
      console.log('[Database] Techniciens administrateur et T555 désactivés');
    } catch {
      // ignorer si table ou colonne absente
    }
    
    console.log('[Database] Initialisation terminée');
  } catch (error) {
    console.error('[Database] Erreur d\'initialisation:', error);
    throw new Error(ERROR_MESSAGES.DB_INIT_ERROR);
  }
}

/**
 * Vérifie si une table existe
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const result = await executeSql<{ count: number }>(
    'SELECT COUNT(*) as count FROM sqlite_master WHERE type=\'table\' AND name=?',
    [tableName],
  );
  return result.length > 0 && result[0].count > 0;
}

/**
 * Réinitialise la base de données (dangereux - dev only)
 */
export async function resetDatabase(): Promise<void> {
  const db = getDatabase();
  
  console.warn('[Database] RESET - Suppression de toutes les données !');
  
  const tables = [
    'sync_queue',
    'journal_modifications',
    'mouvements',
    'stocks_sites',
    'articles',
    'categories',
    'techniciens',
    'sites',
    'app_config',
  ];
  
  for (const table of tables) {
    try {
      await db.executeSql(`DROP TABLE IF EXISTS ${table}`);
    } catch {
      // Ignorer les erreurs de tables inexistantes
    }
  }
  
  // Recréer les tables
  await initializeTables();
}

/**
 * Export du service database
 */
export const db = {
  open: openDatabase,
  close: closeDatabase,
  get: getDatabase,
  query: executeSql,
  insert: executeInsert,
  update: executeUpdate,
  transaction: executeTransaction,
  init: initializeTables,
  initializeTables,
  tableExists,
  reset: resetDatabase,
  resetDatabase,
};

export default db;
