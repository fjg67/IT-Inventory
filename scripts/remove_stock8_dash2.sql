-- ============================================
-- Suppression des articles "-2" du Stock 8ème
-- ============================================

-- 1) APERÇU : voir les articles concernés avant suppression
SELECT 
  a.reference,
  a.name,
  a.emplacement,
  ast.quantity,
  s.name AS site_name
FROM "ArticleStock" ast
JOIN "Article" a ON a.id = ast."articleId"
JOIN "Site" s ON s.id = ast."siteId"
WHERE s.name LIKE 'Stock 8%'
  AND a.reference LIKE '%-2'
ORDER BY a.reference;

-- 2) SUPPRESSION des entrées ArticleStock (stock par site)
DELETE FROM "ArticleStock"
WHERE "siteId" IN (SELECT id FROM "Site" WHERE name LIKE 'Stock 8%')
  AND "articleId" IN (
    SELECT id FROM "Article" WHERE reference LIKE '%-2'
  );

-- 3) OPTIONNEL : Archiver aussi les articles "-2" qui n'ont plus de stock nulle part
-- UPDATE "Article"
-- SET "isArchived" = true
-- WHERE reference LIKE '%-2'
--   AND id NOT IN (SELECT "articleId" FROM "ArticleStock");
