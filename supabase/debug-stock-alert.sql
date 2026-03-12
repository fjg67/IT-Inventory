-- ============================================
-- DIAGNOSTIC - Alertes Stock Email
-- Exécuter dans le SQL Editor de Supabase pour identifier le problème
-- ============================================

-- 1. Vérifier que le cron job existe toujours
SELECT jobid, jobname, schedule, command, active 
FROM cron.job 
WHERE jobname = 'daily-stock-alert';
-- ⚠️ Si aucun résultat → le cron a été supprimé, relancer setup-daily-cron.sql

-- 2. Vérifier l'historique d'exécution du cron (dernières 10 exécutions)
SELECT jobid, runid, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-stock-alert')
ORDER BY start_time DESC
LIMIT 10;
-- ⚠️ Si status != 'succeeded' → le job échoue

-- 3. Vérifier qu'il y a des articles en alerte dans ArticleStock
SELECT 
  a."name" AS article_nom,
  a."reference",
  a."emplacement",
  a."minStock",
  a."isArchived",
  s."name" AS site_nom,
  ast."quantity" AS stock_actuel
FROM "ArticleStock" ast
JOIN "Article" a ON a."id" = ast."articleId"
JOIN "Site" s ON s."id" = ast."siteId"
WHERE a."isArchived" = false
  AND ast."quantity" < a."minStock"
ORDER BY ast."quantity" ASC, a."name";
-- ⚠️ Si aucun résultat → pas d'articles en alerte = pas d'email envoyé (normal)
-- ⚠️ Si des résultats → le problème est ailleurs (Resend, Edge Function, etc.)

-- 4. Compter les articles en alerte par site
SELECT 
  s."name" AS site_nom,
  COUNT(*) AS nb_alertes,
  SUM(CASE WHEN ast."quantity" = 0 THEN 1 ELSE 0 END) AS nb_ruptures
FROM "ArticleStock" ast
JOIN "Article" a ON a."id" = ast."articleId"
JOIN "Site" s ON s."id" = ast."siteId"
WHERE a."isArchived" = false
  AND ast."quantity" < a."minStock"
GROUP BY s."name"
ORDER BY nb_alertes DESC;

-- 5. Vérifier que la table app_metadata existe (pour comparaison J-1)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'app_metadata'
) AS table_exists;
-- Si false → créer la table ci-dessous

-- 6. Créer la table app_metadata si elle n'existe pas
CREATE TABLE IF NOT EXISTS "app_metadata" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);
-- Autoriser l'accès via service_role
ALTER TABLE "app_metadata" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON "app_metadata" 
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. Test manuel : déclencher la Edge Function
-- (décommenter pour exécuter)
/*
SELECT net.http_post(
  url := 'https://lghhzbkbwttvroxodlzd.supabase.co/functions/v1/daily-stock-alert',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU'
  ),
  body := '{}'::jsonb
);
*/

-- 8. Vérifier les Edge Functions déployées (via le dashboard)
-- Dashboard > Edge Functions > Vérifier que "daily-stock-alert" est déployé et actif
-- Vérifier aussi les logs de la fonction pour voir les erreurs
