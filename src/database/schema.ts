// ============================================
// SCHÉMA SQLite - IT-Inventory Application
// ============================================

// Requêtes de création des tables
export const CREATE_TABLES_SQL = `
-- Table Sites (localisations)
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT,
  actif INTEGER DEFAULT 1,
  date_creation TEXT DEFAULT (datetime('now')),
  sync_status TEXT DEFAULT 'pending'
);

-- Table Techniciens
CREATE TABLE IF NOT EXISTS techniciens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  matricule TEXT UNIQUE,
  site_principal_id INTEGER,
  actif INTEGER DEFAULT 1,
  date_creation TEXT DEFAULT (datetime('now')),
  sync_status TEXT DEFAULT 'pending',
  FOREIGN KEY (site_principal_id) REFERENCES sites(id)
);

-- Table Catégories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  parent_id INTEGER,
  ordre INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'pending',
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Table Articles
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  categorie_id INTEGER,
  code_famille TEXT,
  famille TEXT,
  type_article TEXT,
  sous_type TEXT,
  marque TEXT,
  emplacement TEXT,
  stock_mini INTEGER DEFAULT 0,
  unite TEXT DEFAULT 'unité',
  photo_url TEXT,
  actif INTEGER DEFAULT 1,
  date_creation TEXT DEFAULT (datetime('now')),
  date_modification TEXT DEFAULT (datetime('now')),
  sync_status TEXT DEFAULT 'pending',
  FOREIGN KEY (categorie_id) REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_articles_reference ON articles(reference);
CREATE INDEX IF NOT EXISTS idx_articles_categorie ON articles(categorie_id);
CREATE INDEX IF NOT EXISTS idx_articles_nom ON articles(nom);
CREATE INDEX IF NOT EXISTS idx_articles_emplacement ON articles(emplacement);

-- Table Stocks par Site
CREATE TABLE IF NOT EXISTS stocks_sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  site_id INTEGER NOT NULL,
  quantite_actuelle INTEGER DEFAULT 0,
  date_dernier_mouvement TEXT,
  sync_status TEXT DEFAULT 'pending',
  UNIQUE(article_id, site_id),
  FOREIGN KEY (article_id) REFERENCES articles(id),
  FOREIGN KEY (site_id) REFERENCES sites(id)
);
CREATE INDEX IF NOT EXISTS idx_stocks_article ON stocks_sites(article_id);
CREATE INDEX IF NOT EXISTS idx_stocks_site ON stocks_sites(site_id);

-- Table Mouvements
CREATE TABLE IF NOT EXISTS mouvements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  site_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('entree', 'sortie', 'ajustement', 'transfert_depart', 'transfert_arrivee')),
  quantite INTEGER NOT NULL,
  stock_avant INTEGER NOT NULL,
  stock_apres INTEGER NOT NULL,
  technicien_id INTEGER NOT NULL,
  date_mouvement TEXT DEFAULT (datetime('now')),
  commentaire TEXT,
  transfert_vers_site_id INTEGER,
  reference_externe TEXT,
  sync_status TEXT DEFAULT 'pending',
  FOREIGN KEY (article_id) REFERENCES articles(id),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (technicien_id) REFERENCES techniciens(id),
  FOREIGN KEY (transfert_vers_site_id) REFERENCES sites(id)
);
CREATE INDEX IF NOT EXISTS idx_mouvements_article ON mouvements(article_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_site ON mouvements(site_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements(date_mouvement DESC);
CREATE INDEX IF NOT EXISTS idx_mouvements_technicien ON mouvements(technicien_id);

-- Table Journal des Modifications (RGPD Audit Trail)
CREATE TABLE IF NOT EXISTS journal_modifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  champ_modifie TEXT NOT NULL,
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  technicien_id INTEGER NOT NULL,
  date_modification TEXT DEFAULT (datetime('now')),
  sync_status TEXT DEFAULT 'pending',
  FOREIGN KEY (technicien_id) REFERENCES techniciens(id)
);
CREATE INDEX IF NOT EXISTS idx_journal_table_record ON journal_modifications(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_modifications(date_modification DESC);

-- Table Queue de Synchronisation
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL CHECK(operation IN ('insert', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id INTEGER,
  data TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  retries INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'syncing', 'synced', 'error'))
);
CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_timestamp ON sync_queue(timestamp);

-- Table de configuration locale
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

// Requêtes individuelles de création (pour exécution séparée)
export const SCHEMA_QUERIES = {
  sites: `
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      adresse TEXT,
      actif INTEGER DEFAULT 1,
      date_creation TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending'
    );
  `,
  techniciens: `
    CREATE TABLE IF NOT EXISTS techniciens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      matricule TEXT UNIQUE,
      site_principal_id INTEGER,
      actif INTEGER DEFAULT 1,
      date_creation TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (site_principal_id) REFERENCES sites(id)
    );
  `,
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      parent_id INTEGER,
      ordre INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );
  `,
  articles: `
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      description TEXT,
      categorie_id INTEGER,
      stock_mini INTEGER DEFAULT 0,
      unite TEXT DEFAULT 'unité',
      photo_url TEXT,
      actif INTEGER DEFAULT 1,
      date_creation TEXT DEFAULT (datetime('now')),
      date_modification TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (categorie_id) REFERENCES categories(id)
    );
  `,
  stocks_sites: `
    CREATE TABLE IF NOT EXISTS stocks_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      site_id INTEGER NOT NULL,
      quantite_actuelle INTEGER DEFAULT 0,
      date_dernier_mouvement TEXT,
      sync_status TEXT DEFAULT 'pending',
      UNIQUE(article_id, site_id),
      FOREIGN KEY (article_id) REFERENCES articles(id),
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
  `,
  mouvements: `
    CREATE TABLE IF NOT EXISTS mouvements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      site_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('entree', 'sortie', 'ajustement', 'transfert_depart', 'transfert_arrivee')),
      quantite INTEGER NOT NULL,
      stock_avant INTEGER NOT NULL,
      stock_apres INTEGER NOT NULL,
      technicien_id INTEGER NOT NULL,
      date_mouvement TEXT DEFAULT (datetime('now')),
      commentaire TEXT,
      transfert_vers_site_id INTEGER,
      reference_externe TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (article_id) REFERENCES articles(id),
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (technicien_id) REFERENCES techniciens(id),
      FOREIGN KEY (transfert_vers_site_id) REFERENCES sites(id)
    );
  `,
  journal_modifications: `
    CREATE TABLE IF NOT EXISTS journal_modifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      champ_modifie TEXT NOT NULL,
      ancienne_valeur TEXT,
      nouvelle_valeur TEXT,
      technicien_id INTEGER NOT NULL,
      date_modification TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (technicien_id) REFERENCES techniciens(id)
    );
  `,
  sync_queue: `
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL CHECK(operation IN ('insert', 'update', 'delete')),
      table_name TEXT NOT NULL,
      record_id INTEGER,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      retries INTEGER DEFAULT 0,
      error_message TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'syncing', 'synced', 'error'))
    );
  `,
  app_config: `
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `,
};

// Index à créer
export const INDEX_QUERIES = [
  'CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);',
  'CREATE INDEX IF NOT EXISTS idx_articles_reference ON articles(reference);',
  'CREATE INDEX IF NOT EXISTS idx_articles_categorie ON articles(categorie_id);',
  'CREATE INDEX IF NOT EXISTS idx_articles_nom ON articles(nom);',
  'CREATE INDEX IF NOT EXISTS idx_stocks_article ON stocks_sites(article_id);',
  'CREATE INDEX IF NOT EXISTS idx_stocks_site ON stocks_sites(site_id);',
  'CREATE INDEX IF NOT EXISTS idx_mouvements_article ON mouvements(article_id);',
  'CREATE INDEX IF NOT EXISTS idx_mouvements_site ON mouvements(site_id);',
  'CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements(date_mouvement DESC);',
  'CREATE INDEX IF NOT EXISTS idx_mouvements_technicien ON mouvements(technicien_id);',
  'CREATE INDEX IF NOT EXISTS idx_journal_table_record ON journal_modifications(table_name, record_id);',
  'CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_modifications(date_modification DESC);',
  'CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue(status);',
  'CREATE INDEX IF NOT EXISTS idx_sync_timestamp ON sync_queue(timestamp);',
];

// Données de seed initiales
export const SEED_DATA = {
  // Sites par défaut
  defaultSite: `
    INSERT OR IGNORE INTO sites (id, code, nom, adresse, actif, sync_status)
    VALUES
      (1, 'STOCK5', 'Stock 5ième', '5ème étage', 1, 'synced'),
      (2, 'STOCK8', 'Stock 8ième', '8ème étage', 1, 'synced'),
      (3, 'STOCKEPINAL', 'Stock Epinal', 'Site Epinal', 1, 'synced');
  `,
  // Catégories par défaut
  defaultCategories: `
    INSERT OR IGNORE INTO categories (id, nom, parent_id, ordre, sync_status)
    VALUES 
      (1, 'Informatique', NULL, 1, 'synced'),
      (2, 'Réseau', NULL, 2, 'synced'),
      (3, 'Périphériques', NULL, 3, 'synced'),
      (4, 'Câblage', NULL, 4, 'synced'),
      (5, 'Mobilier IT', NULL, 5, 'synced');
  `,
};

export type TableName = keyof typeof SCHEMA_QUERIES;
