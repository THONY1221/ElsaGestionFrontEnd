-- Données de test pour ElsaGestion - Supabase
-- Basé sur les données du fichier gestioncommerciale.sql original

-- Insertion des entreprises de test
INSERT INTO companies (name, short_name, prefixe_inv, email, phone, website, address, status) VALUES
('ELSA TECHNOLOGIES', 'ELSA TECH', 'EST', 'info@elsa-technologies.com', '64989099', 'www.elsa-technologies.com', 'Burkina Faso, Azim0', 'active'),
('ELSA Money', 'EM', 'ESM', 'info@elsa-money.com', '76596869', '', 'Burkina Faso, Azim0', 'active'),
('Easy Delivery', 'ED', 'ED', 'easyd@elsa-technologies.com', '76596869', '', 'Burkina Faso, Azim0', 'active');

-- Insertion des entrepôts par défaut
INSERT INTO warehouses (company_id, name, short_name, email, phone, address, is_active) VALUES
(1, 'Entrepôt Principal ELSA TECH', 'EP-ET', 'entrepot@elsa-technologies.com', '64989099', 'Burkina Faso, Azim0', true),
(2, 'Entrepôt ELSA Money', 'EP-EM', 'entrepot@elsa-money.com', '76596869', 'Burkina Faso, Azim0', true),
(3, 'Entrepôt Easy Delivery', 'EP-ED', 'entrepot@easyd.com', '76596869', 'Burkina Faso, Azim0', true);

-- Insertion des devises
INSERT INTO currencies (company_id, name, code, symbol, position) VALUES
(1, 'Franc FCFA', 'XOF', 'FCFA', 'after'),
(2, 'Euro', 'EUR', '€', 'before'),
(3, 'Franc FCFA', 'XOF', 'FCFA', 'after');

-- Insertion des marques
INSERT INTO brands (company_id, name, description, slug) VALUES
(1, 'ELSA TECH', 'Marque technologique ELSA', 'elsa-tech'),
(2, 'TOYOTA', 'Marque automobile Toyota', 'toyota'),
(3, 'LEXUS', 'Marque automobile de luxe', 'lexus'),
(1, 'Range Rover', 'Marque automobile premium', 'range-rover');

-- Insertion des catégories
INSERT INTO categories (company_id, name, description, slug, parent_id) VALUES
(1, 'Alimentaires', 'Pour tous les produits alimentaires', 'alimentaires', NULL),
(1, 'Parfums', 'Parfums et cosmétiques', 'parfums', NULL),
(2, 'Cuisine française', 'Spécialités culinaires françaises', 'cuisine-francaise', NULL),
(2, 'Accessoire vêtement', 'Accessoires vestimentaires', 'accessoire-vetement', NULL),
(3, 'Décoration', 'Articles de décoration', 'decoration', NULL);

-- Insertion des modes de paiement
INSERT INTO payment_modes (company_id, name, mode_type) VALUES
(1, 'Espèces', 'cash'),
(1, 'Carte bancaire', 'card'),
(1, 'Virement', 'transfer'),
(1, 'Mobile Money', 'mobile'),
(2, 'Espèces', 'cash'),
(2, 'Carte bancaire', 'card'),
(3, 'Espèces', 'cash'),
(3, 'Mobile Money', 'mobile');

-- Insertion des variations (tailles, couleurs, etc.)
INSERT INTO variations (company_id, name) VALUES
(1, 'Petite'),
(1, 'Moyenne'),
(1, 'Grande'),
(1, 'Rouge'),
(1, 'Bleu'),
(1, 'Vert'),
(2, 'S'),
(2, 'M'),
(2, 'L'),
(2, 'XL');

-- Insertion des catégories de dépenses
INSERT INTO expense_categories (company_id, name, slug, description) VALUES
(1, 'Frais de transport', 'frais-transport', 'Frais de transport et déplacement'),
(1, 'Fournitures bureau', 'fournitures-bureau', 'Fournitures de bureau et consommables'),
(1, 'Marketing', 'marketing', 'Frais de marketing et publicité'),
(2, 'Loyer', 'loyer', 'Frais de location des locaux'),
(2, 'Électricité', 'electricite', 'Factures d\'électricité'),
(3, 'Carburant', 'carburant', 'Frais de carburant pour les livraisons');

-- Insertion d'utilisateurs de test (clients et fournisseurs)
INSERT INTO users (company_id, warehouse_id, name, email, phone, user_type, address, status) VALUES
(1, 1, 'Client Test 1', 'client1@test.com', '70123456', 'customers', 'Ouagadougou, Burkina Faso', 'active'),
(1, 1, 'Fournisseur Test 1', 'fournisseur1@test.com', '70654321', 'suppliers', 'Bobo-Dioulasso, Burkina Faso', 'active'),
(2, 2, 'Client Premium', 'premium@test.com', '76543210', 'customers', 'Paris, France', 'active'),
(3, 3, 'Client Livraison', 'livraison@test.com', '71234567', 'customers', 'Ouagadougou, Burkina Faso', 'active');

-- Insertion de quelques produits de test
INSERT INTO products (company_id, name, slug, item_code, category_id, brand_id, description, mrp, purchase_price, sales_price, status) VALUES
(1, 'Parfum Elsa Classic', 'parfum-elsa-classic', 'PARF001', 2, 1, 'Parfum signature de la marque Elsa', 25000, 15000, 22000, 'active'),
(1, 'Biscuits Premium', 'biscuits-premium', 'BISC001', 1, 1, 'Biscuits de qualité premium', 2500, 1500, 2200, 'active'),
(2, 'Croissant artisanal', 'croissant-artisanal', 'CROI001', 3, 2, 'Croissant fait main', 1500, 800, 1200, 'active'),
(3, 'Vase décoratif', 'vase-decoratif', 'VASE001', 5, 3, 'Vase pour décoration intérieure', 15000, 8000, 12000, 'active');

-- Mise à jour des foreign keys pour les companies (currency_id)
UPDATE companies SET currency_id = 1 WHERE id = 1;
UPDATE companies SET currency_id = 2 WHERE id = 2;
UPDATE companies SET currency_id = 1 WHERE id = 3; 