-- ============================================
-- MIGRATION: Optional update prompt for 2.35
-- ============================================

insert into public."AppConfig" ("key", "value")
values ('latest_app_version', '2.35')
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
  'Correction du flux de selection de profil a la connexion.\nRefonte et ameliorations de l''onboarding avec nouvelles animations.\nAmeliorations de stabilite et optimisations globales de performance.'
)
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();
