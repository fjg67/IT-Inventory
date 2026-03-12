-- ============================================
-- SETUP SUPERVISEUR ROLE
-- IT-Inventory Application
-- ============================================
-- ⚠️ EXÉCUTER EN 2 ÉTAPES SÉPARÉES dans Supabase SQL Editor
-- PostgreSQL interdit d'utiliser une nouvelle valeur enum dans la même transaction

-- =============================================
-- ÉTAPE 1 : Exécuter CECI seul, puis cliquer Run
-- =============================================
-- ÉTAPE 1 déjà exécutée
-- ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'superviseur';

-- =============================================
-- ÉTAPE 2 : Exécuter maintenant
-- =============================================
-- Remettre Olivier KLOTZ en technicien
UPDATE "User"
SET role = 'TECHNICIAN'::"Role"
WHERE name ILIKE '%Olivier%KLOTZ%';

SELECT id, name, role FROM "User" ORDER BY name;
