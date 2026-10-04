-- Rapport hebdomadaire (lundi) et mensuel (1er du mois)
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('scheduled-reports')
where exists (select 1 from cron.job where jobname = 'scheduled-reports');

select cron.schedule(
  'scheduled-reports',
  '15 5 * * *',
  $$
  select net.http_post(
    url := 'https://lghhzbkbwttvroxodlzd.supabase.co/functions/v1/scheduled-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
