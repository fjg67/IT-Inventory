-- Remise à zéro des stocks et des PC pour les sites: Stock 1er, Comptoir, Sous sol
-- ===============================================================================

UPDATE "ArticleStock" 
SET "quantity" = 0
WHERE "siteId" IN (
  SELECT "id" 
  FROM "Site" 
  WHERE "name" IN ('Stock 1er', 'Comptoir', 'Sous sol')
);
