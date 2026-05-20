-- ============================================
-- Set minimum app version to 2.31
-- Ensures force-update is enabled for older builds.
-- ============================================

insert into public."AppConfig" ("key", "value")
values ('min_app_version', '2.31')
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

insert into public."AppConfig" ("key", "value")
values ('update_url', 'https://play.google.com/store/apps/details?id=com.itinventory')
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

insert into public."AppConfig" ("key", "value")
values (
  'release_notes',
  'Nouvelle icone et assets Play Store mis a jour pour une identite visuelle plus claire.\nAmelioration du workflow PC et de la modal d envoi avec validations et actions plus fiables.\nOptimisations de performance et stabilite generale de l application.'
)
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

select "key", "value", "updatedAt"
from public."AppConfig"
where "key" in ('min_app_version', 'update_url', 'release_notes');
