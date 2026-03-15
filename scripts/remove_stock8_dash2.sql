-- ============================================
-- Gestion des articles Stock 8ème
-- ============================================

-- 1) APERÇU : voir tous les articles avec emplacement Stock 8
SELECT 
  a.id,
  a.reference,
  a.name,
  a.emplacement,
  s.name AS site_name,
  ast.quantity
FROM "Article" a
LEFT JOIN "ArticleStock" ast ON ast."articleId" = a.id
LEFT JOIN "Site" s ON s.id = ast."siteId"
WHERE a.emplacement LIKE 'Stock 8%'
ORDER BY a.reference;

-- 2) S'assurer que chaque article Stock 8 a une entrée ArticleStock liée au site Stock 8ème
INSERT INTO "ArticleStock" (id, "articleId", "siteId", quantity)
SELECT 
  gen_random_uuid()::text,
  a.id,
  s.id,
  a."minStock"
FROM "Article" a
CROSS JOIN "Site" s
WHERE a.emplacement LIKE 'Stock 8%'
  AND s.name LIKE 'Stock 8%'
  AND NOT EXISTS (
    SELECT 1 FROM "ArticleStock" ast 
    WHERE ast."articleId" = a.id AND ast."siteId" = s.id
  );
