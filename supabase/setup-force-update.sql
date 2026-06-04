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
values ('min_app_version', '2.33')
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
  'Nouveau selecteur de stock actif redesign avec affichage plus clair du site courant.\nAmelioration du flux au demarrage avec selection de site et parcours plus fluide.\nCorrections de stabilite et optimisations globales de performance.'
)
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

-- 5) Optional check
select "key", "value", "updatedAt"
from public."AppConfig"
where "key" in ('min_app_version', 'update_url', 'release_notes');
