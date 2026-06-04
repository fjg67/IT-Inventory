-- Add article condition fields for non-PC inventory quality tracking
ALTER TABLE IF EXISTS "Article"
  ADD COLUMN IF NOT EXISTS "condition" TEXT NOT NULL DEFAULT 'bon_etat',
  ADD COLUMN IF NOT EXISTS "defectiveCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "conditionNote" TEXT,
  ADD COLUMN IF NOT EXISTS "conditionUpdatedAt" TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'article_condition_check'
  ) THEN
    ALTER TABLE "Article"
      ADD CONSTRAINT article_condition_check
      CHECK ("condition" IN ('bon_etat', 'defectueux'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'article_defective_count_non_negative'
  ) THEN
    ALTER TABLE "Article"
      ADD CONSTRAINT article_defective_count_non_negative
      CHECK ("defectiveCount" >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION adjust_article_defective_count()
RETURNS TRIGGER AS $$
DECLARE
  stock_qty INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(st.quantity), 0)
  INTO stock_qty
  FROM "ArticleStock" st
  WHERE st."articleId" = NEW.id;

  IF NEW."condition" = 'bon_etat' THEN
    NEW."defectiveCount" := 0;
    NEW."conditionNote" := NULL;
  ELSIF NEW."defectiveCount" > stock_qty THEN
    NEW."defectiveCount" := stock_qty;
  ELSIF NEW."defectiveCount" < 0 THEN
    NEW."defectiveCount" := 0;
  END IF;

  NEW."conditionUpdatedAt" := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_adjust_article_defective_count ON "Article";
CREATE TRIGGER trg_adjust_article_defective_count
  BEFORE INSERT OR UPDATE ON "Article"
  FOR EACH ROW
  EXECUTE FUNCTION adjust_article_defective_count();

DO $$
BEGIN
  UPDATE "Article" a
  SET
    "defectiveCount" = LEAST(
      GREATEST(a."defectiveCount", 0),
      COALESCE(s.total_qty, 0)
    ),
    "condition" = CASE
      WHEN a."condition" = 'bon_etat' THEN 'bon_etat'
      ELSE 'defectueux'
    END,
    "conditionUpdatedAt" = COALESCE(a."conditionUpdatedAt", now())
  FROM (
    SELECT a2.id AS article_id, COALESCE(SUM(st.quantity), 0) AS total_qty
    FROM "Article" a2
    LEFT JOIN "ArticleStock" st ON st."articleId" = a2.id
    GROUP BY a2.id
  ) s
  WHERE s.article_id = a.id;
END $$;
