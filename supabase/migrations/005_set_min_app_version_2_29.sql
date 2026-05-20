-- ============================================
-- Set minimum app version to 2.29
-- Ensures force-update is enabled for older builds.
-- ============================================

insert into public."AppConfig" ("key", "value")
values ('min_app_version', '2.29')
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();

select "key", "value", "updatedAt"
from public."AppConfig"
where "key" = 'min_app_version';
