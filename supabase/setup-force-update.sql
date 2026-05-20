-- ============================================
-- FORCE UPDATE CONFIG - IT-Inventory
-- Blocks outdated app versions at startup.
-- ============================================

-- 1) Ensure config table exists (used by src/services/versionService.ts)
create table if not exists public."AppConfig" (
  "key" text primary key,
  "value" text not null,
  "updatedAt" timestamptz not null default now()
);

-- 2) Upsert minimum required app version
-- Any app with APP_CONFIG.version < this value will be blocked by ForceUpdateScreen.
insert into public."AppConfig" ("key", "value")
values ('min_app_version', '2.31')
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

-- 3) Optional: Play Store URL used by the update screen
insert into public."AppConfig" ("key", "value")
values ('update_url', 'https://play.google.com/store/apps/details?id=com.itinventory')
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

-- 4) Optional: release notes shown on ForceUpdateScreen (one item per line)
insert into public."AppConfig" ("key", "value")
values (
  'release_notes',
  'Nouvelle icone et assets Play Store mis a jour pour une identite visuelle plus claire.\nAmelioration du workflow PC et de la modal d envoi avec validations et actions plus fiables.\nOptimisations de performance et stabilite generale de l application.'
)
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

-- 5) Optional check
select "key", "value", "updatedAt"
from public."AppConfig"
where "key" in ('min_app_version', 'update_url', 'release_notes');
