-- ============================================
-- Suppression de la contrainte UNIQUE sur reference
-- Permet d'avoir le même code-barre sur différents sites
-- ============================================

-- Lister les contraintes existantes sur la colonne reference
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = '"Article"'::regclass
  AND contype = 'u';

-- Supprimer la contrainte UNIQUE sur reference (adapter le nom si différent)
ALTER TABLE "Article" DROP CONSTRAINT IF EXISTS "Article_reference_key";

-- Garder un index normal (non-unique) pour la performance des recherches
CREATE INDEX IF NOT EXISTS idx_article_reference ON "Article" (reference);
