-- ============================================
-- PC LIFECYCLE: ownership, loans, warranty and maintenance
-- ============================================

CREATE TABLE IF NOT EXISTS public."PCAssetProfile" (
  "articleId" TEXT PRIMARY KEY,
  "purchaseDate" DATE,
  "warrantyEndDate" DATE,
  "supplier" TEXT,
  "assignedTo" TEXT,
  "assignedAt" TIMESTAMPTZ,
  "loanStatus" TEXT NOT NULL DEFAULT 'available'
    CHECK ("loanStatus" IN ('available', 'assigned', 'loaned')),
  "loanedTo" TEXT,
  "loanedAt" TIMESTAMPTZ,
  "dueBackDate" DATE,
  "returnedAt" TIMESTAMPTZ,
  "nextCheckDate" DATE,
  "notes" TEXT,
  "updatedBy" TEXT,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."PCLifecycleEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "articleId" TEXT NOT NULL,
  "type" TEXT NOT NULL
    CHECK ("type" IN ('assignment', 'loan', 'return', 'maintenance', 'check')),
  "personName" TEXT,
  "description" TEXT,
  "eventDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "nextCheckDate" DATE,
  "performedBy" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_PCAssetProfile_nextCheckDate"
  ON public."PCAssetProfile" ("nextCheckDate");
CREATE INDEX IF NOT EXISTS "idx_PCLifecycleEvent_articleId_date"
  ON public."PCLifecycleEvent" ("articleId", "eventDate" DESC);

ALTER TABLE public."PCAssetProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PCLifecycleEvent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PCAssetProfile_select_authenticated" ON public."PCAssetProfile";
CREATE POLICY "PCAssetProfile_select_authenticated" ON public."PCAssetProfile"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "PCAssetProfile_write_authenticated" ON public."PCAssetProfile";
CREATE POLICY "PCAssetProfile_write_authenticated" ON public."PCAssetProfile"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "PCLifecycleEvent_select_authenticated" ON public."PCLifecycleEvent";
CREATE POLICY "PCLifecycleEvent_select_authenticated" ON public."PCLifecycleEvent"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "PCLifecycleEvent_write_authenticated" ON public."PCLifecycleEvent";
CREATE POLICY "PCLifecycleEvent_write_authenticated" ON public."PCLifecycleEvent"
  FOR INSERT TO authenticated WITH CHECK (true);
