-- ============================================
-- SETUP CRON JOB - Recapitulatif PC envoyes a 17h
-- Exécuter ce script dans le SQL Editor Supabase
-- ============================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('daily-pc-sent-summary')
where exists (
  select 1 from cron.job where jobname = 'daily-pc-sent-summary'
);

-- 15:00 UTC = 17:00 heure de Paris en été (CEST)
-- En hiver (CET), cela partira à 16:00 heure de Paris.
select cron.schedule(
  'daily-pc-sent-summary',
  '0 15 * * *',
  $$
  select net.http_post(
    url := 'https://lghhzbkbwttvroxodlzd.supabase.co/functions/v1/daily-pc-sent-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU'
    ),
    body := '{}'::jsonb
  );
  $$
);

select * from cron.job where jobname = 'daily-pc-sent-summary';