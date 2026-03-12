-- ============================================
-- TABLE InventoryRecount - Historique des inventaires complets
-- IT-Inventory Application
-- ============================================
-- Exécuter ce script dans le SQL Editor de Supabase

-- 1. Créer la table InventoryRecount
CREATE TABLE IF NOT EXISTS "InventoryRecount" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "siteId" TEXT NOT NULL,
  "siteName" TEXT NOT NULL,
  "technicianId" TEXT NOT NULL,
  "technicianName" TEXT NOT NULL,
  "recountDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "articleCount" INTEGER,
  "notes" TEXT
);

-- 2. Index pour recherches rapides par site et par date
CREATE INDEX IF NOT EXISTS idx_inventory_recount_site ON "InventoryRecount" ("siteId");
CREATE INDEX IF NOT EXISTS idx_inventory_recount_date ON "InventoryRecount" ("recountDate" DESC);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE "InventoryRecount" ENABLE ROW LEVEL SECURITY;

-- 4. Policy : autoriser les insertions et lectures pour les sessions anonymes
CREATE POLICY "Allow anonymous insert on InventoryRecount"
  ON "InventoryRecount"
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on InventoryRecount"
  ON "InventoryRecount"
  FOR SELECT
  TO anon
  USING (true);
