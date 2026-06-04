-- ============================================
-- MIGRATION: Force update to 2.32
-- ============================================

insert into public."AppConfig" ("key", "value")
values ('min_app_version', '2.32')
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
  'Correction du bug scanner avec ecran noir et meilleure reprise automatique de la camera.\nMessage de mise a jour renforce avec lien direct Google Play pour mise a jour rapide.\nAmeliorations de stabilite, fiabilite et performances globales de l application.'
)
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();
