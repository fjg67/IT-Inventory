-- ============================================
-- SETUP CRON JOB - Suppression hebdomadaire des PC envoyes
-- Le job est appelé le vendredi a 16:05 UTC et 17:05 UTC.
-- La fonction ne supprime que pendant la vraie fenetre 18h Europe/Paris.
-- ============================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('weekly-pc-sent-cleanup-16utc')
where exists (
  select 1 from cron.job where jobname = 'weekly-pc-sent-cleanup-16utc'
);

select cron.unschedule('weekly-pc-sent-cleanup-17utc')
where exists (
  select 1 from cron.job where jobname = 'weekly-pc-sent-cleanup-17utc'
);

select cron.schedule(
  'weekly-pc-sent-cleanup-16utc',
  '5 16 * * 5',
  $$
  select net.http_post(
    url := 'https://lghhzbkbwttvroxodlzd.supabase.co/functions/v1/weekly-pc-sent-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU'
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'weekly-pc-sent-cleanup-17utc',
  '5 17 * * 5',
  $$
  select net.http_post(
    url := 'https://lghhzbkbwttvroxodlzd.supabase.co/functions/v1/weekly-pc-sent-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEyODksImV4cCI6MjA4NjIxNzI4OX0.m0AjtwvYc45GHxpSDYC0vPmFnwcY7f7X_u_OFxc3_OU'
    ),
    body := '{}'::jsonb
  );
  $$
);

select * from cron.job where jobname in ('weekly-pc-sent-cleanup-16utc', 'weekly-pc-sent-cleanup-17utc');