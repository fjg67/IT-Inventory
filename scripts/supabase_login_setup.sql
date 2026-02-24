-- ============================================
-- StockPro - Configuration Supabase pour la connexion
-- À exécuter dans l’éditeur SQL du projet Supabase
-- ============================================

-- 1) Si la table techniciens existe déjà (créée par l'app/sync), ajouter la colonne mot de passe.
--    Copier-coller dans Supabase > SQL Editor puis exécuter :
--    ALTER TABLE techniciens ADD COLUMN IF NOT EXISTS password_hash TEXT;
--    Puis mettre à jour le technicien T097097 avec un hash bcrypt du mot de passe !*A1Z2E3R4T5!
--    (générer sur https://bcrypt-generator.com/ avec 10 rounds)

-- 2) Création table techniciens (si vous partez de zéro)
/*
CREATE TABLE IF NOT EXISTS techniciens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule VARCHAR(20) UNIQUE NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'technicien',
  actif BOOLEAN DEFAULT true,
  derniere_connexion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_techniciens_matricule ON techniciens(matricule);
CREATE INDEX idx_techniciens_actif ON techniciens(actif);
*/

-- 3) RLS : autoriser la lecture (matricule + actif) pour la connexion (rôle anon)
-- À adapter si votre table a déjà d’autres policies
/*
ALTER TABLE techniciens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture pour login (anon)"
ON techniciens FOR SELECT
TO anon
USING (actif = true);
*/

-- 4) Insérer un technicien de test (mot de passe: !*A1Z2E3R4T5!)
-- Générer le hash bcrypt avec 10 rounds (ex: https://bcrypt-generator.com/)
-- puis remplacer '$2b$10$...' par le hash généré
/*
INSERT INTO techniciens (matricule, prenom, nom, email, password_hash, role)
VALUES (
  'administrateur',
  'Jove',
  'Garcia',
  'jove.garcia@stockpro.fr',
  '$2b$10$VotreHashBcryptIci',
  'admin'
)
ON CONFLICT (matricule) DO NOTHING;
*/
