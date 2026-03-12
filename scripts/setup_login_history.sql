-- ============================================
-- TABLE LoginHistory - Historique des connexions techniciens
-- IT-Inventory Application
-- ============================================
-- Exécuter ce script dans le SQL Editor de Supabase

-- 1. Créer la table LoginHistory
CREATE TABLE IF NOT EXISTS "LoginHistory" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "technicianId" TEXT NOT NULL,
  "technicianName" TEXT NOT NULL,
  "siteId" UUID,
  "loginAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "deviceInfo" TEXT
);

-- 2. Index pour recherches rapides par technicien et par date
CREATE INDEX IF NOT EXISTS idx_login_history_user ON "LoginHistory" ("userId");
CREATE INDEX IF NOT EXISTS idx_login_history_date ON "LoginHistory" ("loginAt" DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_technician ON "LoginHistory" ("technicianId");

-- 3. Activer RLS (Row Level Security)
ALTER TABLE "LoginHistory" ENABLE ROW LEVEL SECURITY;

-- 4. Policy : autoriser les insertions et lectures pour les sessions anonymes
CREATE POLICY "Allow anonymous insert on LoginHistory"
  ON "LoginHistory"
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on LoginHistory"
  ON "LoginHistory"
  FOR SELECT
  TO anon
  USING (true);

-- 5. (Optionnel) Vue pour consulter facilement les dernières connexions
-- CREATE VIEW recent_logins AS
-- SELECT
--   lh."technicianId" AS matricule,
--   lh."technicianName" AS nom,
--   s."name" AS site,
--   lh."loginAt" AS date_connexion,
--   lh."deviceInfo" AS appareil
-- FROM "LoginHistory" lh
-- LEFT JOIN "Site" s ON s.id = lh."siteId"
-- ORDER BY lh."loginAt" DESC
-- LIMIT 100;
