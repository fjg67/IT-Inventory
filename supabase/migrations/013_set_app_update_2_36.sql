-- ============================================
-- MIGRATION: Optional update prompt for 2.36
-- ============================================

insert into public."AppConfig" ("key", "value")
values ('latest_app_version', '2.36')
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
  'Correction du flux de selection de profil au premier clic.\nOnboarding redesign avec animations et navigation plus fluide.\nAmeliorations de stabilite et optimisations globales de performance.'
)
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();
