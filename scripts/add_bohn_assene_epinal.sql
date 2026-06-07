-- ============================================
-- ADD / UPDATE TECHNICIEN: BOHN Assene
-- Matricule: T097902
-- NON assigne a Epinal
-- A executer dans Supabase SQL Editor
-- ============================================

-- 1) Verification prealable (sites cibles)
SELECT id, "name", "parentSiteId"
FROM "Site"
WHERE LOWER("name") LIKE '%epinal%'
   OR LOWER("name") LIKE '%strasbourg%'
ORDER BY "name";

-- 2) Resolution du site d'affectation
-- Choisit un site prioritairement Strasbourg, sinon le 1er site non-Epinal.
WITH target_site AS (
  SELECT id
  FROM "Site"
  WHERE LOWER("name") NOT LIKE '%epinal%'
  ORDER BY
    CASE WHEN LOWER("name") LIKE '%strasbourg%' OR LOWER("name") LIKE '%siege%' THEN 0 ELSE 1 END,
    "name"
  LIMIT 1
)
INSERT INTO "User" ("id", "name", "technicianId", "password", "role", "isActive", "siteId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text AS "id",
  'BOHN Assene' AS "name",
  'T097902' AS "technicianId",
  '$2a$10$XqykXeuyeWlSzIMxr23wsusT53wDvRBb1sTLcFnWr8I3FAni7mf9m' AS "password",
  'TECHNICIAN' AS "role",
  true AS "isActive",
  (SELECT id FROM target_site) AS "siteId",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
WHERE NOT EXISTS (
  SELECT 1
  FROM "User"
  WHERE "technicianId" = 'T097902'
);

-- 3) Si l'utilisateur existe deja, on aligne ses infos
WITH target_site AS (
  SELECT id
  FROM "Site"
  WHERE LOWER("name") NOT LIKE '%epinal%'
  ORDER BY
    CASE WHEN LOWER("name") LIKE '%strasbourg%' OR LOWER("name") LIKE '%siege%' THEN 0 ELSE 1 END,
    "name"
  LIMIT 1
)
UPDATE "User"
SET
  "name" = 'BOHN Assene',
  "password" = COALESCE("password", '$2a$10$XqykXeuyeWlSzIMxr23wsusT53wDvRBb1sTLcFnWr8I3FAni7mf9m'),
  "role" = 'TECHNICIAN',
  "isActive" = true,
  "siteId" = COALESCE((SELECT id FROM target_site), "siteId"),
  "updatedAt" = NOW()
WHERE "technicianId" = 'T097902';

-- 4) Verification finale
SELECT id, "name", "technicianId", "role", "isActive", "siteId"
FROM "User"
WHERE "technicianId" = 'T097902'
   OR LOWER("name") LIKE '%bohn%assene%'
ORDER BY "createdAt" DESC NULLS LAST;
