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
values ('min_app_version', '2.23')
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

-- 3) Optional check
select "key", "value", "updatedAt"
from public."AppConfig"
where "key" = 'min_app_version';
