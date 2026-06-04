-- ============================================
-- MIGRATION: Force update to 2.33
-- ============================================

insert into public."AppConfig" ("key", "value")
values ('min_app_version', '2.33')
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
  'Nouveau selecteur de stock actif redesign avec affichage plus clair du site courant.\nAmelioration du flux au demarrage avec selection de site et parcours plus fluide.\nCorrections de stabilite et optimisations globales de performance.'
)
on conflict ("key")
do update set
  "value" = excluded."value",
  "updatedAt" = now();
