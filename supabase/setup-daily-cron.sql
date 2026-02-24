-- ============================================
-- SETUP CRON JOB - Rapport stock quotidien à 6h
-- Exécuter ce script dans le SQL Editor Supabase
-- Dashboard > SQL Editor > New Query
-- ============================================

-- 1. Activer les extensions nécessaires
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Supprimer l'ancien job si existant (pour pouvoir re-exécuter ce script)
select cron.unschedule('daily-stock-alert')
where exists (
  select 1 from cron.job where jobname = 'daily-stock-alert'
);

-- 3. Créer le cron job : tous les jours à 5:00 UTC = 6:00 heure de Paris
-- pg_cron utilise l'heure UTC, donc 5:00 UTC = 6:00 CET (hiver) / 7:00 CEST (été)
-- Si tu veux 6h en été aussi, change en '0 4 * * *'
select cron.schedule(
  'daily-stock-alert',           -- nom du job
  '0 5 * * *',                   -- cron expression : chaque jour à 5:00 UTC
  $$
  select net.http_post(
    url := 'https://lghhzbkbwttvroxodlzd.supabase.co/functions/v1/daily-stock-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 4. Vérifier que le job est bien créé
select * from cron.job where jobname = 'daily-stock-alert';
