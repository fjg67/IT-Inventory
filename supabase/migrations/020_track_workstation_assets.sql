CREATE TABLE IF NOT EXISTS public."TrackedAsset" (
  "assetCode" TEXT PRIMARY KEY,
  "articleId" TEXT NOT NULL REFERENCES public."Article"(id),
  "siteId" TEXT REFERENCES public."Site"(id),
  "inStock" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ("inStock" = ("siteId" IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS "TrackedAsset_article_site"
  ON public."TrackedAsset" ("articleId", "siteId") WHERE "inStock";

ALTER TABLE public."TrackedAsset" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "TrackedAsset_read" ON public."TrackedAsset";
CREATE POLICY "TrackedAsset_read" ON public."TrackedAsset"
  FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.record_workstation_asset(
  p_article_id TEXT, p_site_id TEXT, p_asset_code TEXT,
  p_direction TEXT, p_user_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code TEXT := upper(btrim(p_asset_code));
  v_asset public."TrackedAsset"%ROWTYPE;
  v_stock_id TEXT;
  v_quantity INTEGER;
  v_movement_id TEXT := gen_random_uuid()::TEXT;
BEGIN
  IF p_direction NOT IN ('entree', 'sortie') OR v_code IS NULL OR length(v_code) < 2
     OR length(v_code) > 128 OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Paramètres du scan invalides';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."Article" WHERE id = p_article_id
      AND reference IN ('1800001', '1800002', '1800003', '1800004') AND "isArchived" = false) THEN
    RAISE EXCEPTION 'Article non éligible au suivi par asset';
  END IF;
  IF EXISTS (SELECT 1 FROM public."Article" WHERE id = p_article_id
      AND (reference = v_code OR barcode = v_code)) THEN
    RAISE EXCEPTION 'Scannez le code asset, pas la référence de l’article';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."Site" WHERE id = p_site_id) THEN
    RAISE EXCEPTION 'Site inconnu';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_code));
  PERFORM pg_advisory_xact_lock(hashtext(p_article_id), hashtext(p_site_id));
  SELECT id, quantity INTO v_stock_id, v_quantity FROM public."ArticleStock"
    WHERE "articleId" = p_article_id AND "siteId" = p_site_id FOR UPDATE;
  IF v_stock_id IS NULL THEN
    IF p_direction = 'sortie' THEN RAISE EXCEPTION 'Aucun stock sur ce site'; END IF;
    v_stock_id := gen_random_uuid()::TEXT;
    v_quantity := 0;
    INSERT INTO public."ArticleStock" (id, "articleId", "siteId", quantity)
      VALUES (v_stock_id, p_article_id, p_site_id, 0);
  END IF;

  SELECT * INTO v_asset FROM public."TrackedAsset" WHERE "assetCode" = v_code FOR UPDATE;
  IF p_direction = 'entree' THEN
    IF FOUND AND v_asset."inStock" THEN RAISE EXCEPTION 'Cet asset est déjà en stock'; END IF;
    IF FOUND AND v_asset."articleId" <> p_article_id THEN
      RAISE EXCEPTION 'Cet asset appartient à un autre article';
    END IF;
    INSERT INTO public."TrackedAsset" ("assetCode", "articleId", "siteId", "inStock")
      VALUES (v_code, p_article_id, p_site_id, true)
      ON CONFLICT ("assetCode") DO UPDATE SET "siteId" = EXCLUDED."siteId",
        "inStock" = true, "updatedAt" = NOW();
    v_quantity := v_quantity + 1;
  ELSE
    IF NOT FOUND OR NOT v_asset."inStock" OR v_asset."siteId" <> p_site_id
       OR v_asset."articleId" <> p_article_id THEN
      RAISE EXCEPTION 'Asset absent du stock de cet article sur ce site';
    END IF;
    IF v_quantity < 1 THEN RAISE EXCEPTION 'Stock insuffisant'; END IF;
    UPDATE public."TrackedAsset" SET "siteId" = NULL, "inStock" = false,
      "updatedAt" = NOW() WHERE "assetCode" = v_code;
    v_quantity := v_quantity - 1;
  END IF;

  INSERT INTO public."StockMovement"
    (id, "articleId", "fromSiteId", type, quantity, "userId", reason)
    VALUES (v_movement_id, p_article_id, p_site_id,
      (CASE WHEN p_direction = 'entree' THEN 'ENTRY' ELSE 'EXIT' END)::public."MovementType",
      CASE WHEN p_direction = 'entree' THEN 1 ELSE -1 END,
      p_user_id, 'Asset ' || v_code);
  UPDATE public."ArticleStock" SET quantity = v_quantity WHERE id = v_stock_id;
  RETURN jsonb_build_object('assetCode', v_code, 'quantity', v_quantity,
    'movementId', v_movement_id);
END;
$$;

REVOKE ALL ON FUNCTION public.record_workstation_asset(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_workstation_asset(TEXT, TEXT, TEXT, TEXT, TEXT)
  TO anon, authenticated;