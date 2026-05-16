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

-- Ajouter l'utilisateur Remi (superviseur, acronyme RT, sans matricule)
-- Mot de passe par defaut : !*A1Z2E3R4T5!
INSERT INTO "User" ("id", "name", "technicianId", "role", "password", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'Remi',
  'RT',
  'superviseur'::"Role",
  '$2a$10$ODjNsrk2HzN6wDUygCMYBe0lHJ.SIMqkb7QA/KwrbfbJeKKH8d5Fa',
  now(),
  now()
)
ON CONFLICT ("technicianId") DO NOTHING;

SELECT id, name, role FROM "User" ORDER BY name;
