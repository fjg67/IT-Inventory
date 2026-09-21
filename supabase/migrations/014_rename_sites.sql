-- Renommage des sites (Stock 5ième -> Stock 1er, Stock 8ième -> Comptoir, TCS -> Sous sol)
-- ==========================================

-- 1. Mettre à jour les noms et adresses dans la table Site
UPDATE "Site" 
SET "name" = 'Stock 1er', "address" = '1er étage, Bâtiment siège' 
WHERE "name" IN ('Stock 5ème', 'Stock 5ième', 'Stock 5');

UPDATE "Site" 
SET "name" = 'Comptoir', "address" = 'Comptoir, Bâtiment siège' 
WHERE "name" IN ('Stock 8ème', 'Stock 8ième', 'Stock 8');

UPDATE "Site" 
SET "name" = 'Sous sol', "address" = 'Siège de Strasbourg' 
WHERE "name" = 'TCS';

-- 2. Mettre à jour l'emplacement dans la table Article
UPDATE "Article"
SET "emplacement" = REPLACE("emplacement", 'Stock 5', 'Stock 1er')
WHERE "emplacement" LIKE 'Stock 5%';

UPDATE "Article"
SET "emplacement" = REPLACE("emplacement", 'Stock 8', 'Comptoir')
WHERE "emplacement" LIKE 'Stock 8%';
