CREATE TABLE IF NOT EXISTS public."ReportSubscription" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "frequency" TEXT NOT NULL CHECK ("frequency" IN ('weekly', 'monthly')),
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_ReportSubscription_enabled_frequency"
  ON public."ReportSubscription" ("enabled", "frequency");

ALTER TABLE public."ReportSubscription" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ReportSubscription_select_authenticated" ON public."ReportSubscription";
CREATE POLICY "ReportSubscription_select_authenticated" ON public."ReportSubscription"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ReportSubscription_write_authenticated" ON public."ReportSubscription";
CREATE POLICY "ReportSubscription_write_authenticated" ON public."ReportSubscription"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
