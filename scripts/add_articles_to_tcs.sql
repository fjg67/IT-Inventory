-- ============================================================
-- Copier les articles du site "Stock 5..." vers le site "TCS"
-- avec quantity = 0 dans "ArticleStock"
-- ============================================================
-- Compatible avec le schema Supabase du projet IT-Inventory :
--   - "Site" (id, name)
--   - "Article" (id, isArchived)
--   - "ArticleStock" (id, articleId, siteId, quantity)

begin;

-- 0) Supprimer les PC deja presents dans le stock TCS
with target_site as (
  select s."id"
  from "Site" s
  where lower(s."name") like '%tcs%'
  order by s."name"
  limit 1
)
delete from "ArticleStock" ast
using "Article" a, target_site ts
where ast."siteId" = ts."id"
  and a."id" = ast."articleId"
  and (
    upper(coalesce(a."articleType", '')) = 'PC'
    or upper(coalesce(a."category", '')) = 'PC'
  );

-- 1) Mettre a 0 les lignes deja existantes sur TCS pour les articles du Stock 5
with
source_site as (
  select s."id"
  from "Site" s
  where lower(s."name") like '%stock 5%'
  order by s."name"
  limit 1
),
target_site as (
  select s."id"
  from "Site" s
  where lower(s."name") like '%tcs%'
  order by s."name"
  limit 1
),
source_articles as (
  select distinct ast."articleId"
  from "ArticleStock" ast
  join source_site ss on ss."id" = ast."siteId"
  join "Article" a on a."id" = ast."articleId"
  where coalesce(a."isArchived", false) = false
    and upper(coalesce(a."articleType", '')) <> 'PC'
    and upper(coalesce(a."category", '')) <> 'PC'
)
update "ArticleStock" tgt
set "quantity" = 0
where tgt."siteId" = (select "id" from target_site)
  and tgt."articleId" in (select "articleId" from source_articles);

-- 2) Inserer les lignes manquantes sur TCS avec quantity = 0
with
source_site as (
  select s."id"
  from "Site" s
  where lower(s."name") like '%stock 5%'
  order by s."name"
  limit 1
),
target_site as (
  select s."id"
  from "Site" s
  where lower(s."name") like '%tcs%'
  order by s."name"
  limit 1
),
source_articles as (
  select distinct ast."articleId"
  from "ArticleStock" ast
  join source_site ss on ss."id" = ast."siteId"
  join "Article" a on a."id" = ast."articleId"
  where coalesce(a."isArchived", false) = false
    and upper(coalesce(a."articleType", '')) <> 'PC'
    and upper(coalesce(a."category", '')) <> 'PC'
)
insert into "ArticleStock" ("id", "articleId", "siteId", "quantity")
select
  concat(sa."articleId", '_', ts."id", '_', substring(md5(random()::text || clock_timestamp()::text), 1, 10)) as "id",
  sa."articleId",
  ts."id" as "siteId",
  0 as "quantity"
from source_articles sa
cross join target_site ts
where not exists (
  select 1
  from "ArticleStock" t
  where t."articleId" = sa."articleId"
    and t."siteId" = ts."id"
);

commit;

-- Verification rapide
with
source_site as (
  select s."id"
  from "Site" s
  where lower(s."name") like '%stock 5%'
  order by s."name"
  limit 1
),
target_site as (
  select s."id"
  from "Site" s
  where lower(s."name") like '%tcs%'
  order by s."name"
  limit 1
),
source_count as (
  select count(distinct ast."articleId") as nb
  from "ArticleStock" ast
  join source_site ss on ss."id" = ast."siteId"
  join "Article" a on a."id" = ast."articleId"
  where coalesce(a."isArchived", false) = false
    and upper(coalesce(a."articleType", '')) <> 'PC'
    and upper(coalesce(a."category", '')) <> 'PC'
),
target_count as (
  select count(distinct ast."articleId") as nb
  from "ArticleStock" ast
  join target_site ts on ts."id" = ast."siteId"
  join source_site ss on true
  where ast."articleId" in (
    select distinct ast2."articleId"
    from "ArticleStock" ast2
    where ast2."siteId" = ss."id"
  )
),
target_non_zero as (
  select count(*) as nb
  from "ArticleStock" ast
  join target_site ts on ts."id" = ast."siteId"
  join source_site ss on true
  where ast."articleId" in (
    select distinct ast2."articleId"
    from "ArticleStock" ast2
    where ast2."siteId" = ss."id"
  )
    and coalesce(ast."quantity", 0) <> 0
),
target_pc_rows as (
  select count(*) as nb
  from "ArticleStock" ast
  join target_site ts on ts."id" = ast."siteId"
  join "Article" a on a."id" = ast."articleId"
  where upper(coalesce(a."articleType", '')) = 'PC'
     or upper(coalesce(a."category", '')) = 'PC'
)
select
  sc.nb as source_articles_stock5,
  tc.nb as target_articles_tcs,
  tnz.nb as target_rows_non_zero,
  tpc.nb as target_pc_rows
from source_count sc, target_count tc, target_non_zero tnz, target_pc_rows tpc;
  