-- ============================================
-- Script de setup des sites et liaison techniciens
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- 1. Vérifier et insérer le site parent Siège Strasbourg
INSERT INTO "Site" ("id", "name", "address", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Siège Strasbourg', 'Strasbourg, Grand Est', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE "name" = 'Siège Strasbourg');

-- Renommer si l'ancien nom existe encore
UPDATE "Site" SET "name" = 'Siège Strasbourg' WHERE "name" = 'Strasbourg';

-- 2. Ajouter la colonne parentSiteId à la table Site (si elle n'existe pas)
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "parentSiteId" TEXT REFERENCES "Site"("id");

-- 2b. Ajouter la colonne edsNumber à la table Site (si elle n'existe pas)
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "edsNumber" TEXT;

-- 3. Ajouter la colonne siteId à la table User (si elle n'existe pas)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "siteId" TEXT REFERENCES "Site"("id");

-- 4. Insérer les sous-sites de Strasbourg Général
INSERT INTO "Site" ("id", "name", "address", "isActive", "parentSiteId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Stock 5ème', '5ème étage, Bâtiment siège', true,
  (SELECT "id" FROM "Site" WHERE "name" = 'Siège Strasbourg' LIMIT 1), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE "name" = 'Stock 5ème');

INSERT INTO "Site" ("id", "name", "address", "isActive", "parentSiteId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Stock 8ème', '8ème étage, Bâtiment siège', true,
  (SELECT "id" FROM "Site" WHERE "name" = 'Siège Strasbourg' LIMIT 1), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE "name" = 'Stock 8ème');

INSERT INTO "Site" ("id", "name", "address", "isActive", "parentSiteId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Epinal', 'Epinal, Vosges', true,
  (SELECT "id" FROM "Site" WHERE "name" = 'Siège Strasbourg' LIMIT 1), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE "name" = 'Epinal');

-- Si Epinal existe déjà sans parent, le rattacher à Siège Strasbourg
UPDATE "Site"
SET "parentSiteId" = (SELECT "id" FROM "Site" WHERE "name" = 'Siège Strasbourg' LIMIT 1)
WHERE "name" = 'Epinal' AND "parentSiteId" IS NULL;

INSERT INTO "Site" ("id", "name", "address", "isActive", "parentSiteId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'TCS', 'Strasbourg', true,
  (SELECT "id" FROM "Site" WHERE "name" = 'Siège Strasbourg' LIMIT 1), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE "name" = 'TCS');

-- 4b. Corriger les adresses existantes
UPDATE "Site" SET "address" = '5ème étage, Bâtiment siège' WHERE "name" = 'Stock 5ème';
UPDATE "Site" SET "address" = '8ème étage, Bâtiment siège' WHERE "name" = 'Stock 8ème';

-- 5. Vérifier le résultat
SELECT id, "name", "address", "isActive", "parentSiteId" FROM "Site" ORDER BY "parentSiteId" NULLS FIRST, "name";

-- 6. Vérifier les techniciens
SELECT id, "name", "technicianId", "siteId" FROM "User" ORDER BY "name";

-- ============================================
-- Pour assigner les techniciens à un site :
-- UPDATE "User" SET "siteId" = '<SITE_ID>' WHERE "name" = '<NOM_TECHNICIEN>';
-- ============================================

-- ============================================
-- 7. Table AppConfig pour le contrôle de version
-- ============================================
CREATE TABLE IF NOT EXISTS "AppConfig" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Version minimum requise (changer cette valeur pour forcer la mise à jour)
INSERT INTO "AppConfig" ("key", "value")
VALUES ('min_app_version', '1.7')
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = now();

-- Pour forcer une mise à jour future, exécuter :
-- UPDATE "AppConfig" SET "value" = '2.0', "updatedAt" = now() WHERE "key" = 'min_app_version';
