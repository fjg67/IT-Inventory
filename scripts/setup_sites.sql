-- ============================================
-- Script de setup des sites et liaison techniciens
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- 1. Vérifier et insérer les sites Siège Strasbourg et Epinal
-- (ignore si déjà existants)
INSERT INTO "Site" ("id", "name", "address", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Siège Strasbourg', 'Strasbourg, Grand Est', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE "name" = 'Siège Strasbourg');

-- Renommer si l'ancien nom existe encore
UPDATE "Site" SET "name" = 'Siège Strasbourg' WHERE "name" = 'Strasbourg';

INSERT INTO "Site" ("id", "name", "address", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Epinal', 'Epinal, Vosges', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE "name" = 'Epinal');

-- 2. Ajouter la colonne siteId à la table User (si elle n'existe pas)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "siteId" TEXT REFERENCES "Site"("id");

-- 3. Ajouter la colonne parentSiteId à la table Site (si elle n'existe pas)
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "parentSiteId" TEXT REFERENCES "Site"("id");

-- 4. Rattacher les sous-sites à Siège Strasbourg
-- Stock 5ème et Stock 8ème deviennent enfants de Siège Strasbourg
UPDATE "Site"
SET "parentSiteId" = (SELECT "id" FROM "Site" WHERE "name" = 'Siège Strasbourg' LIMIT 1)
WHERE "name" IN ('Stock 5ème', 'Stock 8ème')
  AND "parentSiteId" IS NULL;

-- 5. Rattacher Stock Epinal à Epinal (si existe)
UPDATE "Site"
SET "parentSiteId" = (SELECT "id" FROM "Site" WHERE "name" = 'Epinal' LIMIT 1)
WHERE "name" = 'Stock Epinal'
  AND "parentSiteId" IS NULL;

-- 6. Masquer sites parents uniquement dans le sélecteur (isActive gère l'affichage)
-- Strasbourg et Epinal restent actifs, les sous-sites n'ont pas besoin d'être actifs
-- car ils sont trouvés via parentSiteId

-- 7. Vérifier le résultat
SELECT id, "name", "address", "isActive", "parentSiteId" FROM "Site" ORDER BY "name";

-- 8. Vérifier les techniciens
SELECT id, "name", "technicianId", "siteId" FROM "User" ORDER BY "name";

-- ============================================
-- Pour assigner les techniciens à un site :
-- UPDATE "User" SET "siteId" = '<SITE_ID>' WHERE "name" = '<NOM_TECHNICIEN>';
--
-- Exemple (remplacer les UUIDs par les vrais IDs retournés ci-dessus) :
-- UPDATE "User" SET "siteId" = 'uuid-strasbourg' WHERE "name" IN ('CM', 'FJ', 'GO');
-- UPDATE "User" SET "siteId" = 'uuid-epinal' WHERE "name" IN ('OK', 'RL', 'TH');
-- ============================================
