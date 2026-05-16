-- ============================================
-- ASSIGN REMI TO ALL SITES (Siège Strasbourg parent)
-- IT-Inventory Application
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- 1. Vérifier que Remi existe et voir son siteId actuel
SELECT id, "name", "technicianId", "siteId", "role"
FROM "User"
WHERE LOWER("name") LIKE '%remi%' OR LOWER("name") LIKE '%rémi%';

-- 2. Voir les autres techniciens et leur siteId (pour copier le bon ID parent)
SELECT id, "name", "siteId"
FROM "User"
WHERE "name" IN ('CM', 'FJG', 'OK', 'RL')
ORDER BY "name";

-- 3. Voir le siteId de Siège Strasbourg
SELECT id, "name" FROM "Site" WHERE "name" = 'Siège Strasbourg';

-- ============================================
-- ÉTAPE : Assigner Remi au même site parent que les autres techniciens
-- Remplace le siteId de Remi par celui du Siège Strasbourg (site parent)
-- ============================================
UPDATE "User"
SET "siteId" = (SELECT "id" FROM "Site" WHERE "name" = 'Siège Strasbourg' LIMIT 1)
WHERE LOWER("name") LIKE '%remi%' OR LOWER("name") LIKE '%rémi%';

-- 4. Vérifier le résultat
SELECT id, "name", "technicianId", "siteId", "role"
FROM "User"
WHERE LOWER("name") LIKE '%remi%' OR LOWER("name") LIKE '%rémi%';
