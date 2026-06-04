-- ============================================
-- ADD PC BREAKDOWN (Pannes) FEATURE
-- ============================================

-- ① Étendre le statut PC pour ajouter 'en_panne'
ALTER TABLE public."PCSentHistory"
  ADD COLUMN IF NOT EXISTS "status" TEXT;

-- Ajouter le nouveau statut 'en_panne' dans la table Article (pour les PC)
-- Note: Vérifier le schéma réel des tables PC existantes
DO $$
BEGIN
  -- Table pc_portables si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'pc_portables'
  ) THEN
    -- Vérifier si colonne status existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pc_portables' AND column_name = 'status'
    ) THEN
      -- Supprimer contrainte CHECK existante si elle existe
      ALTER TABLE public."pc_portables"
        DROP CONSTRAINT IF EXISTS "pc_portables_status_check";
      
      -- Ajouter nouvelle contrainte avec 'en_panne'
      ALTER TABLE public."pc_portables"
        ADD CONSTRAINT "pc_portables_status_check"
        CHECK (status IN ('a_chaud', 'a_reusiner', 'en_usinage', 'disponible', 'envoye', 'en_panne'));
    END IF;
  END IF;
END $$;

-- ② Nouvelle table : historique des pannes
CREATE TABLE IF NOT EXISTS public."PCPannes" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pc_id TEXT NOT NULL,
  
  -- Déclaration
  type_panne TEXT NOT NULL
    CHECK (type_panne IN ('materielle', 'logicielle', 'batterie', 'reseau', 'autre')),
  description TEXT NOT NULL,
  priorite TEXT NOT NULL DEFAULT 'moyenne'
    CHECK (priorite IN ('basse', 'moyenne', 'haute', 'critique')),
  
  -- Suivi
  statut_reparation TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut_reparation IN ('en_attente', 'en_reparation', 'resolu', 'irreparable')),
  ticket_sav TEXT,
  technicien_id TEXT,
  
  -- Résolution
  note_resolution TEXT,
  resolu_par TEXT,
  resolu_at TIMESTAMPTZ,
  
  -- Timestamps
  declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ③ Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_PCPannes_pc_id"
  ON public."PCPannes" (pc_id);

CREATE INDEX IF NOT EXISTS "idx_PCPannes_statut_active"
  ON public."PCPannes" (statut_reparation)
  WHERE statut_reparation NOT IN ('resolu', 'irreparable');

CREATE INDEX IF NOT EXISTS "idx_PCPannes_priorite_critique"
  ON public."PCPannes" (priorite)
  WHERE priorite = 'critique';

-- ④ Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_pc_pannes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "tr_PCPannes_updated_at" ON public."PCPannes";
CREATE TRIGGER "tr_PCPannes_updated_at"
  BEFORE UPDATE ON public."PCPannes"
  FOR EACH ROW EXECUTE FUNCTION public.update_pc_pannes_updated_at();

-- ⑤ Enable RLS
ALTER TABLE public."PCPannes" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "PCPannes_select_authenticated" ON public."PCPannes"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "PCPannes_insert_authenticated" ON public."PCPannes"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "PCPannes_update_authenticated" ON public."PCPannes"
  FOR UPDATE TO authenticated USING (true);
