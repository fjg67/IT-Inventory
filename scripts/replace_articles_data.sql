-- =======================================================
-- REMPLACEMENT COMPLET DES ARTICLES 
-- Remplacement de tous les articles par les données Excel
-- =======================================================

-- 1) Supprimer les données dépendantes (clés étrangères)
DELETE FROM "AuditLog";
DELETE FROM "StockMovement";
DELETE FROM "ArticleStock";

-- 2) Supprimer tous les articles existants
DELETE FROM "Article";

-- Insérer les nouveaux articles avec les données du tableau
INSERT INTO "Article" (id, reference, name, description, "codeFamille", category, "articleType", "sousType", brand, emplacement, "minStock", unit, "updatedAt") VALUES
-- Articles Code Famille 10 - Accessoires
(gen_random_uuid()::text, '1000001', 'Souris filaire DELL', 'Souris filaire', '10', 'Accessoires', 'Souris', 'filaire', 'DELL', 'Stock 5 - R2E3', 15, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000001-2', 'Souris filaire DELL', 'Souris filaire', '10', 'Accessoires', 'Souris', 'filaire', 'DELL', 'Stock 8 - Armoire', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000002', 'Souris SF DELL', 'Souris SF DELL', '10', 'Accessoires', 'Souris', 'Agence', 'DELL', 'Stock 5 - R2E3', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000003', 'Souris SF Cherry', 'Souris SF Cherry', '10', 'Accessoires', 'Souris', 'Siège', 'Cherry', 'Stock 5 - R2E3', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000004', 'Clavier F', 'Clavier F', '10', 'Accessoires', 'Clavier', 'Filaire', 'DELL', 'Stock 5 - R2E3', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000004-2', 'Clavier F', 'Clavier F', '10', 'Accessoires', 'Clavier', 'Filaire', 'DELL', 'Stock 8 - Tiroir', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000005', 'Clavier SF cherry', 'Clavier SF cherry', '10', 'Accessoires', 'Clavier', 'sans fil', 'Cherry', 'Stock 5 - R2E4', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000005-2', 'Clavier SF cherry', 'Clavier SF cherry', '10', 'Accessoires', 'Clavier', 'sans fil', 'Cherry', 'Stock 8 - Tiroir', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000006', 'D6000', 'D6000', '10', 'Accessoires', 'Dock', 'D6000', 'DELL', 'Stock 5 - R2E4', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000006-2', 'D6000', 'D6000', '10', 'Accessoires', 'Dock', 'D6000', 'DELL', 'Stock 8 - Armoire', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000007', 'HUB Fiche USB C', 'HUB Fiche USB C', '10', 'Accessoires', 'HUB USB', '4 ports', 'STARTEC', 'Stock 5 - R6E3', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000007-2', 'HUB Fiche USB C', 'HUB Fiche USB C', '10', 'Accessoires', 'HUB USB', '4 ports', 'STARTEC', 'Stock 8 - Armoire', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000008', 'Filtre de conf 14"', 'Filtre de conf 14"', '10', 'Accessoires', 'Sécurité', 'Filtre de confidentialité 14"', '3M', 'Stock 5 - R4E4', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000009', 'Filtre de conf 15.6"', 'Filtre de conf 15.6"', '10', 'Accessoires', 'Sécurité', 'Filtre de confidentialité 15.6"', '3M', 'Stock 5 - R4E4', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000010', 'Filtre de conf 16"', 'Filtre de conf 16"', '10', 'Accessoires', 'Sécurité', 'Filtre de confidentialité 16"', '3M', 'Stock 5 - R4E4', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000011', 'Filtre de conf VIP', 'Filtre de conf VIP', '10', 'Accessoires', 'Sécurité', 'Filtre de confidentialité VIP', '3M', 'Stock 5 - R4E4', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000012', 'Stylet tablette', 'Stylet tablette', '10', 'Accessoires', 'Stylet', 'tablette', 'Générique', 'Stock 5 - R2E2', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000013', 'POINTEUR LASER Kensington', 'POINTEUR LASER Kensington', '10', 'Accessoires', 'pointeur laser', 'Pour présentation', 'Kingston', 'Stock 5 - R2E3', 2, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000014', 'Dongle Clavier / Souris DELL', 'Dongle Clavier / Souris DELL', '10', 'Accessoires', 'Dongle', 'kit clavier souris', 'Dell', 'Stock 5 - R2E3', 3, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000015', 'Dongle Clavier / Souris CHERRY', 'Dongle Clavier / Souris CHERRY', '10', 'Accessoires', 'Dongle', 'Clavier / Souris', 'Cherry', 'Stock 5 - R2E3', 20, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000016', 'Dongle casque Plantronics BT 600', 'Dongle casque Plantronics BT 600', '10', 'Accessoires', 'Dongle', 'Plantronics', 'Plantronics', 'Stock 5 - R2E3', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000017', 'POINTEUR LASER Aurora', 'POINTEUR LASER Aurora', '10', 'Accessoires', 'pointeur laser', 'Pour présentation', 'Aurora', 'Stock 5 - R2E3', 2, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000017-2', 'POINTEUR LASER Aurora', 'POINTEUR LASER Aurora', '10', 'Accessoires', 'pointeur laser', 'Pour présentation', 'Aurora', 'Stock 8 - Armoire', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000018', 'Coque téléphone', 'Coque téléphone', '10', 'Accessoires', 'Protection', 'Coque', 'Générique', 'Stock 5 - R2E2', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000018-2', 'Coque téléphone', 'Coque téléphone', '10', 'Accessoires', 'Protection', 'Coque', 'Générique', 'Stock 8 - Tiroir', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000020', 'Kit clavier souris agence Urban Factory', 'Kit clavier souris agence Urban Factory', '10', 'Accessoires', 'Clavier / Souris', 'Sans fil', 'Urban factory', 'Stock 5', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000021', 'Dongle casque Plantronics BT 700', 'Dongle casque Plantronics BT 700', '10', 'Accessoires', 'Dongle', 'Plantronics', 'Plantronics', 'Stock 5 - R2E3', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000022', 'Souris SF Urban Factory', 'Souris SF Urban Factory', '10', 'Accessoires', 'Souris', 'Agence', 'Urban factory', 'Stock 5', 3, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000023', 'Sacoche', 'Sacoche', '10', 'Accessoires', 'Transport', 'Sacoche', 'Dell', 'Stock 5 - R1E1', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1000024', 'Sac à dos', 'Sac à dos', '10', 'Accessoires', 'Transport', 'Sac à dos', 'Dell', 'Stock 5 - R1E1', 2, 'Pcs', NOW()),

-- Articles Code Famille 11 - Audio
(gen_random_uuid()::text, '1100001', 'Casque SF Plantronics V1', 'Casque SF Plantronics V1', '11', 'Audio', 'casque', 'Plantronics SF V1', 'Plantronics', 'Stock 5 - R2E2', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100002', 'Casque SF Plantronics V2', 'Casque SF Plantronics V2', '11', 'Audio', 'casque', 'Plantronics SF V2', 'Plantronics', 'Stock 5 - R2E2', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100003', 'Casque filaire', 'Casque filaire', '11', 'Audio', 'casque', 'Plantronics filaire', 'Plantronics', 'Stock 5 - R2E2', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100003-2', 'Casque filaire', 'Casque filaire', '11', 'Audio', 'casque', 'Plantronics filaire', 'Plantronics', 'Stock 8 - Armoire', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100004', 'Dongle casque EPOS', 'Dongle casque EPOS', '11', 'Audio', 'Dongle', 'EPOS', 'EPOS', 'Stock 5 - R2E2', 3, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100005', 'BASE Casque SF V1', 'BASE Casque SF V1', '11', 'Audio', 'Base de charge', 'Plantronics', 'Plantronics', 'Stock 5 - R2E2', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100006', 'BASE Casque SF V2', 'BASE Casque SF V2', '11', 'Audio', 'Base de charge', 'Plantronics', 'Plantronics', 'Stock 5 - R2E2', 3, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100007', 'Casque EPOS', 'Casque EPOS', '11', 'Audio', 'Casque', 'EPOS', 'EPOS', 'Stock 5 - R2E2', 3, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100008', 'Dongle casque Plantronics USB C', 'Dongle casque Plantronics USB C', '11', 'Audio', 'Dongle', 'Poly', 'Poly', 'Stock 5 - R2E3', 3, 'Pcs', NOW()),
(gen_random_uuid()::text, '1100009', 'Base de charge EPOS', 'Base de charge EPOS', '11', 'Audio', 'Base de charge', 'EPOS', 'EPOS', 'Stock 5 - R5E1', 2, 'Pcs', NOW()),

-- Articles Code Famille 12 - Câble - Affichage
(gen_random_uuid()::text, '1200001', 'Câble DP / USB C 1 m', 'Câble DP / USB C 1 m', '12', 'Câble', 'Affichage', 'Displayport / USB C 1 m', 'Générique', 'Stock 5 - R4E3', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200001-2', 'Câble DP / USB C 1 m', 'Câble DP / USB C 1 m', '12', 'Câble', 'Affichage', 'Displayport / USB C 1 m', 'Générique', 'Stock 8 - Tiroir', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200002', 'Câble DP / HDMI 3 mètre', 'Câble DP / HDMI 3 mètre', '12', 'Câble', 'Affichage', 'Displayport / HDMI 3 mètre', 'Générique', 'Stock 5 - R4E3', 2, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200003', 'Câble HDMI/HDMI 3 et 2 mètre', 'Câble HDMI/HDMI 3 et 2 mètre', '12', 'Câble', 'Affichage', 'HDMI 3 et 2 mètre', 'Générique', 'Stock 5 - R4E3', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200003-2', 'Câble HDMI/HDMI 3 et 2 mètre', 'Câble HDMI/HDMI 3 et 2 mètre', '12', 'Câble', 'Affichage', 'HDMI 3 et 2 mètre', 'Générique', 'Stock 8 - Tiroir', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200004', 'Câble HDMI/HDMI 5 et 10 mètre', 'Câble HDMI/HDMI 5 et 10 mètre', '12', 'Câble', 'Affichage', 'HDMI 5 et 10 mètre', 'Générique', 'Stock 5 - R4E3', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200005', 'Câble DP/DP 2 mètre', 'Câble DP/DP 2 mètre', '12', 'Câble', 'Affichage', '2m', 'Générique', 'Stock 5 - R4E3', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200006', 'Câble DP/DP 3 mètre', 'Câble DP/DP 3 mètre', '12', 'Câble', 'Affichage', '3m', 'Générique', 'Stock 5 - R4E3', 3, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200007', 'Câble USB-C / USB-C 2 M', 'Câble USB-C / USB-C 2 M', '12', 'Câble', 'Affichage', '2m', 'Générique', 'Stock 5 - R4E3', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200007-2', 'Câble USB-C / USB-C 2 M', 'Câble USB-C / USB-C 2 M', '12', 'Câble', 'Affichage', '2m', 'Générique', 'Stock 8 - Tiroir', 1, 'Pcs', NOW()),

-- Articles Code Famille 12 - Câble - USB
(gen_random_uuid()::text, '1200008', 'câble de charge tablette USB-A / USB-C', 'câble de charge pour tablette (emballage carton blanc) USB-A / USB-C', '12', 'Câble', 'USB A / USB C', 'Générique', 'Générique', 'Stock 5 - R5E2', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200009', 'Rallonge USB-A', 'Rallonge USB-A', '12', 'Câble', 'Rallonge', 'Générique', 'Générique', 'Stock 5 - R5E3', 2, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200010', 'Câble USB-C / USB-A', 'Câble USB-C / USB-A', '12', 'Câble', 'USB A / USB C', 'Générique', 'Générique', 'Stock 5 - R5E2', 20, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200010-2', 'Câble USB-C / USB-A', 'Câble USB-C / USB-A', '12', 'Câble', 'USB A / USB C', 'Générique', 'Générique', 'Stock 8 - Tiroir', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200011', 'Câble USB-C / Lightning', 'Câble USB-C / Lightning', '12', 'Câble', 'USB C / Lightning', 'Générique', 'Générique', 'Stock 5 - R5E2', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200012', 'Câble USB-A / Micro-USB 1 mètre', 'Câble USB-A / Micro-USB 1 mètre', '12', 'Câble', 'USB A / Micro USB', 'Générique', 'Générique', 'Stock 5 - R5E3', 15, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200012-2', 'Câble USB-A / Micro-USB 1 mètre', 'Câble USB-A / Micro-USB 1 mètre', '12', 'Câble', 'USB A / Micro USB', 'Générique', 'Générique', 'Stock 8 - Tiroir', 1, 'Pcs', NOW()),

-- Articles Code Famille 12 - Câble - Réseau
(gen_random_uuid()::text, '1200013', 'RJ45 30 cm blanc', 'RJ45 30 cm blanc', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200014', 'RJ45 50 cm blanc', 'RJ45 50 cm blanc', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200015', 'RJ45 1 mètre blanc', 'RJ45 1 mètre blanc', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200016', 'RJ45 2 mètre blanc', 'RJ45 2 mètre blanc', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200018', 'RJ45 5 mètre blanc', 'RJ45 5 mètre blanc', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200019', 'Adaptateur (divers)', 'Adaptateur (divers)', '12', 'Câble', 'adaptateur', 'Générique', 'Générique', 'Stock 5 - R3E1', 0, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200023', 'RJ45 30 cm rouge', 'RJ45 30 cm rouge', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200024', 'RJ45 50 cm rouge', 'RJ45 50 cm rouge', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200025', 'RJ45 1 mètre rouge', 'RJ45 1 mètre rouge', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200026', 'RJ45 2 mètre rouge', 'RJ45 2 mètre rouge', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200028', 'RJ45 5 mètre rouge', 'RJ45 5 mètre rouge', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200033', 'RJ45 30 cm vert', 'RJ45 30 cm vert', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200034', 'RJ45 50 cm vert', 'RJ45 50 cm vert', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200035', 'RJ45 1 mètre vert', 'RJ45 1 mètre vert', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200036', 'RJ45 2 mètre vert', 'RJ45 2 mètre vert', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200038', 'RJ45 5 mètre vert', 'RJ45 5 mètre vert', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),

-- Articles Code Famille 12 - Câble - Réseau jaune
(gen_random_uuid()::text, '1200043', 'RJ45 30 cm jaune', 'RJ45 30 cm jaune', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200044', 'RJ45 50 cm jaune', 'RJ45 50 cm jaune', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200045', 'RJ45 1 mètre jaune', 'RJ45 1 mètre jaune', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200046', 'RJ45 2 mètre jaune', 'RJ45 2 mètre jaune', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),
(gen_random_uuid()::text, '1200048', 'RJ45 5 mètre jaune', 'RJ45 5 mètre jaune', '12', 'Câble', 'Réseau', 'TP', 'Générique', 'Stock 5 - R5E5', 5, 'Pcs', NOW()),

-- Articles Code Famille 13 - Chargeur
(gen_random_uuid()::text, '1300001', 'Chargeur USB-C DELL 65W', 'Chargeur USB-C DELL 65W', '13', 'Chargeur', 'USB-C', '65 watt', 'DELL', 'Stock 5 - R1E5', 50, 'Pcs', NOW()),
(gen_random_uuid()::text, '1300002', 'Chargeur Précision DELL', 'Chargeur Précision DELL', '13', 'Chargeur', 'USB-C', '(135 watt)', 'DELL', 'Stock 5 - R1E5', 3, 'Pcs', NOW()),
(gen_random_uuid()::text, '1300003', 'Chargeur HP', 'Chargeur HP', '13', 'Chargeur', 'USB-C', '65 watt', 'HP', 'Stock 5 - R1E5', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1300004', 'Chargeur USB-C DELL 65W', 'Chargeur USB-C DELL 65W', '13', 'Chargeur', 'USB-C', '65 watt', 'DELL', 'Stock 8 - Armoire', 25, 'Pcs', NOW()),

-- Articles Code Famille 14 - Electrique
(gen_random_uuid()::text, '1400001', 'Câble MICKEY (C5 / IEC 320)', 'Câble MICKEY (C5 / IEC 320)', '14', 'Electrique', 'alimentation', 'Générique', 'Générique', 'Stock 5 - R1E5', 50, 'Pcs', NOW()),
(gen_random_uuid()::text, '1400001-2', 'Câble MICKEY (C5 / IEC 320)', 'Câble MICKEY (C5 / IEC 320)', '14', 'Electrique', 'alimentation', 'Générique', 'Générique', 'Stock 8 - Bac gris', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1400002', 'multiprise', 'multiprise', '14', 'Electrique', 'Multiprise', 'Générique', '/', 'Stock 5 - R4E4', 2, 'Pcs', NOW()),
(gen_random_uuid()::text, '1400003', 'Alimentation Ecran 34"', 'Alimentation Ecran 34"', '14', 'Electrique', 'Alimentation', 'Générique', 'Générique', 'Stock 5 - R2E5', 20, 'Pcs', NOW()),
(gen_random_uuid()::text, '1400003-2', 'Alimentation Ecran 34"', 'Alimentation Ecran 34"', '14', 'Electrique', 'Alimentation', 'Générique', 'Générique', 'Stock 8 - Armoire', 1, 'Pcs', NOW()),
(gen_random_uuid()::text, '1400004', 'Alimentation Mini UC OPTIPLEX (90W fiche 4,5x3,0mm)', 'Alimentation Mini UC OPTIPLEX (90W fiche 4,5x3,0mm)', '14', 'Electrique', 'Alimentation', 'Mini UC', 'DELL', 'Stock 5 - R2E5', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1400005', 'Chargeur D6000 130W (fiche 7.4mm X 5.0mm)', 'Chargeur D6000 130W (fiche 7.4mm X 5.0mm (Dell Centre Pin))', '14', 'Electrique', 'Alimentation', 'D6000', 'DELL', 'Stock 5 - R2E4', 10, 'Pcs', NOW()),
(gen_random_uuid()::text, '1400006', 'Chargeur secteur 100W (3xUSB-c + 1xUSB-a)', 'Chargeur secteur 100W (3xUSB-c + 1xUSB-a)', '14', 'Electrique', 'Chargeur', 'tablette', 'Générique', 'Stock 5 - R5E2', 10, 'Pcs', NOW()),

-- Articles Code Famille 15 - Ergonomie
(gen_random_uuid()::text, '1500001', 'Bras Ergotron / Bras Ecran', 'Bras Ergotron / Bras Ecran', '15', 'Ergonomie', 'Bras d''écran', 'Bras Ergotron', 'ERGOTRON', 'Stock5', 5, 'Pcs', NOW()),

-- Articles Code Famille 16 - Périphérique
(gen_random_uuid()::text, '1600001', 'Scanner doc', 'Scanner doc', '16', 'Périphérique', 'Scanner doc', 'avec feuille à feuille', 'FUJITSU', 'Stock 5 - R3E2', 1, 'Pcs', NOW()),

-- Articles Code Famille 17 - ASSETE
(gen_random_uuid()::text, '1700001', 'Vidéo Projecteur', 'Vidéo Projecteur', '17', 'ASSETE', 'Affichage', 'Projecteur', 'Générique', 'Stock 8 - Armoire', 2, 'Pcs', NOW()),

-- Articles Code Famille 50 - KIT
(gen_random_uuid()::text, '5000001', 'Kit audio > Casque V1 + Dongle plantronics', 'Kit audio > Casque V1 + Dongle plantronics', '50', 'KIT', 'Ensemble de matériel', 'KIT audio', 'Plantronics', '/', 0, 'Pcs', NOW()),
(gen_random_uuid()::text, '5000002', 'Kit audio > Casque V2 + Dongle plantronics', 'Kit audio > Casque V2 + Dongle plantronics', '50', 'KIT', 'Ensemble de matériel', 'KIT audio', 'Plantronics', 'Stock 5 - R4E1', 0, 'Pcs', NOW()),
(gen_random_uuid()::text, '5000003', 'Kit audio > Casque EPOS + Dongle EPOS', 'Kit audio > Casque EPOS + Dongle EPOS', '50', 'KIT', 'Ensemble de matériel', 'KIT audio', 'EPOS', 'Stock 5 - R5E1', 0, 'Pcs', NOW()),
(gen_random_uuid()::text, '5000004', 'Kit complet > souris filaire + Mickey + USB-C + Casque V1 + Dongle Plantronics', 'Kit complet > souris filaire + Mickey + USB-C + Casque V1 + Dongle Plantronics', '50', 'KIT', 'Ensemble de matériel', 'KIT complet', 'Générique', '/', 0, 'Pcs', NOW()),
(gen_random_uuid()::text, '5000005', 'Kit clavier souris > Souris SF + clavier SF CHERRY', 'Kit clavier souris > Souris SF + clavier SF CHERRY', '50', 'KIT', 'Ensemble de matériel', 'KIT clavier souris', 'Cherry', 'Stock 5 - R2E4', 0, 'Pcs', NOW()),
(gen_random_uuid()::text, '5000006', 'Kit clavier souris > Souris SF + clavier SF DELL', 'Kit clavier souris > Souris SF + clavier SF DELL', '50', 'KIT', 'Ensemble de matériel', 'KIT clavier souris', 'DELL', 'Stock 5 - R2E3', 0, 'Pcs', NOW()),
(gen_random_uuid()::text, '5000007', 'Kit clavier souris > Souris SF + clavier SF Urban Factory', 'Kit clavier souris > Souris SF + clavier SF Urban Factory', '50', 'KIT', 'Ensemble de matériel', 'KIT clavier souris', 'Urban Factory', '/', 0, 'Pcs', NOW());

-- 3) Créer les entrées ArticleStock en liant chaque article au BON site (quantity=0 par défaut)
-- Stock 5... → site "Stock 5ème", Stock 8... → site "Stock 8ème", "/" → tous les sites
INSERT INTO "ArticleStock" (id, "articleId", "siteId", quantity)
SELECT 
    gen_random_uuid()::text,
    a.id,
    s.id,
    0
FROM "Article" a
JOIN "Site" s ON (
    (a.emplacement LIKE 'Stock 5%' AND s.name LIKE 'Stock 5%')
    OR (a.emplacement = 'Stock5' AND s.name LIKE 'Stock 5%')
    OR (a.emplacement LIKE 'Stock 8%' AND s.name LIKE 'Stock 8%')
    OR (a.emplacement = '/')  -- KIT articles → tous les sites
)
WHERE NOT EXISTS (
    SELECT 1 FROM "ArticleStock" ast 
    WHERE ast."articleId" = a.id AND ast."siteId" = s.id
);

-- 4) Mettre à jour le stock ACTUEL (colonne M de l'Excel)
-- Chaque référence est unique, donc on peut identifier l'article par sa référence
WITH stock_actuel (ref, qty) AS (VALUES
    -- Famille 10 - Accessoires
    ('1000001', 42),
    ('1000001-2', 0),
    ('1000002', 7),
    ('1000003', 22),
    ('1000004', 17),
    ('1000004-2', 2),
    ('1000005', 18),
    ('1000005-2', 4),
    ('1000006', 3),
    ('1000006-2', 1),
    ('1000007', 92),
    ('1000007-2', 4),
    ('1000008', 10),
    ('1000009', 17),
    ('1000010', 35),
    ('1000011', 1),
    ('1000012', 0),
    ('1000013', 4),
    ('1000014', 5),
    ('1000015', 78),
    ('1000016', 1),
    ('1000017', 1),
    ('1000017-2', 1),
    ('1000018', 0),
    ('1000018-2', 3),
    ('1000020', 0),
    ('1000021', 0),
    ('1000022', 0),
    ('1000023', 42),
    ('1000024', 5),
    -- Famille 11 - Audio
    ('1100001', 14),
    ('1100002', 22),
    ('1100003', 17),
    ('1100003-2', 6),
    ('1100004', 14),
    ('1100005', 9),
    ('1100006', 20),
    ('1100007', 22),
    ('1100008', 0),
    ('1100009', 5),
    -- Famille 12 - Câble
    ('1200001', 4),
    -- TODO: stock actuel manquant pour 1200001-2 à 1200035 (envoyez screenshot)
    ('1200036', 10),
    ('1200038', 11),
    ('1200043', 68),
    ('1200044', 45),
    ('1200045', 20),
    ('1200046', 10),
    ('1200048', 11),
    -- Famille 13 - Chargeur
    ('1300001', 105),
    ('1300002', 5),
    ('1300003', 133),
    ('1300004', 0),
    -- Famille 14 - Electrique
    ('1400001', 186),
    ('1400001-2', 6),
    ('1400002', 11),
    ('1400003', 75),
    ('1400003-2', 2),
    ('1400004', 14),
    ('1400005', 33),
    ('1400006', 1),
    -- Famille 15 - Ergonomie
    ('1500001', 0),
    -- Famille 16 - Périphérique
    ('1600001', 1),
    -- Famille 17 - ASSETE
    ('1700001', 3),
    -- Famille 50 - KIT (Stock = "/" dans Excel → 0)
    ('5000001', 0),
    ('5000002', 0),
    ('5000003', 0),
    ('5000004', 0),
    ('5000005', 0),
    ('5000006', 0),
    ('5000007', 0)
)
UPDATE "ArticleStock" AS ast
SET quantity = sv.qty
FROM stock_actuel sv
JOIN "Article" a ON a.reference = sv.ref
WHERE ast."articleId" = a.id;

-- Afficher un résumé
SELECT 'Articles insérés' as info, COUNT(*) as total FROM "Article";
SELECT 'Stocks créés' as info, COUNT(*) as total FROM "ArticleStock";

SELECT 
    "codeFamille",
    category,
    COUNT(*) as nombre_articles,
    SUM("minStock") as total_stock_mini
FROM "Article" 
GROUP BY "codeFamille", category 
ORDER BY "codeFamille", category;