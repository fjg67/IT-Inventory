-- Optional unit cost used by advanced stock valuation.
ALTER TABLE public."Article"
  ADD COLUMN IF NOT EXISTS "unitPrice" NUMERIC(12, 2) NOT NULL DEFAULT 0;
