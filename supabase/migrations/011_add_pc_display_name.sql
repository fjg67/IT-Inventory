-- Add optional display name for portable PCs when the table exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'pc_portables'
  ) THEN
    ALTER TABLE pc_portables
      ADD COLUMN IF NOT EXISTS display_name TEXT;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'check_display_name_length'
    ) THEN
      ALTER TABLE pc_portables
        ADD CONSTRAINT check_display_name_length
        CHECK (display_name IS NULL OR (LENGTH(TRIM(display_name)) BETWEEN 2 AND 50));
    END IF;

    CREATE INDEX IF NOT EXISTS idx_pc_display_name
      ON pc_portables (display_name)
      WHERE display_name IS NOT NULL;

    COMMENT ON COLUMN pc_portables.display_name
      IS 'Nom d''affichage personnalise (optionnel). Le hostname reste l''identifiant officiel.';
  END IF;
END $$;

-- App compatibility: current mobile flow reads PCs from the Article table.
-- Keep this block optional so migration stays safe on environments without that table.
DO $$
DECLARE
  article_table regclass;
BEGIN
  article_table := to_regclass('public."Article"');
  IF article_table IS NULL THEN
    article_table := to_regclass('public.article');
  END IF;

  IF article_table IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "displayName" TEXT', article_table);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'check_article_display_name_length'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT check_article_display_name_length CHECK ("displayName" IS NULL OR (LENGTH(TRIM("displayName")) BETWEEN 2 AND 50))',
        article_table
      );
    END IF;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_article_display_name ON %s ("displayName") WHERE "displayName" IS NOT NULL',
      article_table
    );
  END IF;
END $$;
