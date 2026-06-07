-- ============================================
-- FIX PCPannes RLS FOR ANON + AUTHENTICATED
-- ============================================

ALTER TABLE public."PCPannes" ENABLE ROW LEVEL SECURITY;

-- Ensure table privileges are available to API roles.
GRANT SELECT, INSERT, UPDATE ON public."PCPannes" TO anon;
GRANT SELECT, INSERT, UPDATE ON public."PCPannes" TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'PCPannes'
      AND policyname = 'PCPannes_select_anon'
  ) THEN
    CREATE POLICY "PCPannes_select_anon" ON public."PCPannes"
      FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'PCPannes'
      AND policyname = 'PCPannes_insert_anon'
  ) THEN
    CREATE POLICY "PCPannes_insert_anon" ON public."PCPannes"
      FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'PCPannes'
      AND policyname = 'PCPannes_update_anon'
  ) THEN
    CREATE POLICY "PCPannes_update_anon" ON public."PCPannes"
      FOR UPDATE TO anon USING (true);
  END IF;
END
$$;