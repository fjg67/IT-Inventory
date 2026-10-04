CREATE TABLE IF NOT EXISTS public."AppBackup" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "payload" JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_AppBackup_user_created" ON public."AppBackup" ("userId", "createdAt" DESC);
ALTER TABLE public."AppBackup" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AppBackup_user_access" ON public."AppBackup";
CREATE POLICY "AppBackup_user_access" ON public."AppBackup"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
