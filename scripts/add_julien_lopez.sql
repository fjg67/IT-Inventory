-- ============================================
-- ADD NEW TECHNICIAN: Julien LOPEZ
-- IT-Inventory Application
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- 1. Vérifier les utilisateurs existants
SELECT id, "name", "technicianId", "siteId", "role", "isActive"
FROM "User"
ORDER BY "name";

-- 2. Voir les sites disponibles
SELECT id, "name" FROM "Site" ORDER BY "name";

-- ============================================
-- 3. AJOUTER LE NOUVEL UTILISATEUR
-- Julien LOPEZ (visible comme: Florian JOVE GARCIA, sans matricule)
-- ============================================
INSERT INTO "User" 
  ("name", "role", "isActive", "siteId")
SELECT 
  'Florian JOVE GARCIA' AS "name",
  'TECHNICIAN' AS "role",
  true AS "isActive",
  u."siteId"  -- Reprendre le siteId de Rémi
FROM "User" u
WHERE LOWER(u."name") = 'remi' 
LIMIT 1;

-- 4. Vérifier que le nouvel utilisateur a été ajouté
SELECT id, "name", "technicianId", "siteId", "role", "isActive", "createdAt"
FROM "User"
WHERE "name" = 'Florian JOVE GARCIA';

-- ============================================
-- NOTES IMPORTANTES:
-- - Le champ "name" = 'Florian JOVE GARCIA' (affiché dans l'interface)
-- - Le nom réel = Julien LOPEZ (documenté ici pour référence)
-- - "technicianId" = NULL (pas de matricule)
-- - "role" = 'TECHNICIAN' (en majuscules)
-- - "siteId" = reprend le site de Rémi (cohérence avec le parc)
-- - "isActive" = true (utilisateur actif par défaut)
-- ============================================
