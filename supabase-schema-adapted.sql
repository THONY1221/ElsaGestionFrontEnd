-- Schema adapté de gestioncommerciale.sql pour PostgreSQL/Supabase
-- Conversion MySQL → PostgreSQL avec Row Level Security

-- Activer Row Level Security pour la sécurité multi-tenant
-- Companies table (table principale)
CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  short_name VARCHAR(191),
  prefixe_inv VARCHAR(10),
  email VARCHAR(191),
  phone VARCHAR(191),
  website VARCHAR(191),
  light_logo VARCHAR(191),
  dark_logo VARCHAR(191),
  small_dark_logo VARCHAR(191),
  small_light_logo VARCHAR(191),
  address VARCHAR(1000),
  app_layout VARCHAR(10) DEFAULT 'sidebar',
  rtl BOOLEAN DEFAULT false,
  shortcut_menus VARCHAR(20) DEFAULT 'top_bottom',
  currency_id BIGINT,
  left_sidebar_theme VARCHAR(20) DEFAULT 'dark',
  primary_color VARCHAR(20) DEFAULT '#1890ff',
  date_format VARCHAR(20) DEFAULT 'DD-MM-YYYY',
  time_format VARCHAR(20) DEFAULT 'hh:mm a',
  auto_detect_timezone BOOLEAN DEFAULT true,
  timezone VARCHAR(191) DEFAULT 'UTC',
  session_driver VARCHAR(20) DEFAULT 'file',
  app_debug BOOLEAN DEFAULT false,
  update_app_notification BOOLEAN DEFAULT true,
  login_image VARCHAR(191),
  package_type VARCHAR(10) DEFAULT 'monthly',
  licence_expire_on DATE,
  is_global BOOLEAN DEFAULT false,
  status VARCHAR(191) DEFAULT 'active',
  total_users INTEGER DEFAULT 1,
  verified BOOLEAN DEFAULT false,
  white_label_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des entrepôts/warehouses
CREATE TABLE warehouses (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  short_name VARCHAR(191),
  email VARCHAR(191),
  phone VARCHAR(191),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  show_mrp_on_invoice BOOLEAN DEFAULT false,
  online_store_enabled BOOLEAN DEFAULT false,
  logo VARCHAR(191),
  dark_logo VARCHAR(191),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des devises
CREATE TABLE currencies (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  code VARCHAR(191) NOT NULL,
  symbol VARCHAR(191) NOT NULL,
  position VARCHAR(191) NOT NULL,
  is_deletable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des marques
CREATE TABLE brands (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  description VARCHAR(100),
  slug VARCHAR(191) NOT NULL,
  image VARCHAR(191),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  description VARCHAR(100),
  slug VARCHAR(191) NOT NULL,
  image VARCHAR(191),
  parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des variations (tailles, couleurs, etc.)
CREATE TABLE variations (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des produits
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191),
  item_code VARCHAR(191),
  image VARCHAR(191),
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  brand_id BIGINT REFERENCES brands(id) ON DELETE SET NULL,
  barcode_type VARCHAR(191) DEFAULT 'C128',
  description TEXT,
  product_type VARCHAR(191) DEFAULT 'single',
  unit_id BIGINT,
  status VARCHAR(191) DEFAULT 'active',
  stock_quantite_alert INTEGER DEFAULT 0,
  notes TEXT,
  tax_type VARCHAR(191) DEFAULT 'exclusive',
  mrp DECIMAL(8,2),
  purchase_price DECIMAL(8,2),
  sales_price DECIMAL(8,2),
  purchase_tax_type VARCHAR(191) DEFAULT 'exclusive',
  sales_tax_type VARCHAR(191) DEFAULT 'exclusive',
  multiple_units BOOLEAN DEFAULT false,
  multiple_warehouses BOOLEAN DEFAULT false,
  details_visibility VARCHAR(191) DEFAULT 'hide',
  wholesale_price DECIMAL(8,2),
  wholesale_quantity INTEGER DEFAULT 1,
  can_purchasable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des détails produits (pour les variations)
CREATE TABLE product_details (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  variation_id BIGINT REFERENCES variations(id) ON DELETE SET NULL,
  stock_quantity INTEGER DEFAULT 0,
  mrp DECIMAL(8,2),
  purchase_price DECIMAL(8,2),
  sales_price DECIMAL(8,2),
  wholesale_price DECIMAL(8,2),
  tax_amount DECIMAL(8,2) DEFAULT 0,
  purchase_tax_amount DECIMAL(8,2) DEFAULT 0,
  wholesale_tax_amount DECIMAL(8,2) DEFAULT 0,
  status VARCHAR(191) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des modes de paiement
CREATE TABLE payment_modes (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  mode_type VARCHAR(191) DEFAULT 'cash',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs (clients/fournisseurs)
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191),
  email_verified_at TIMESTAMP,
  password VARCHAR(191),
  phone VARCHAR(191),
  address TEXT,
  shipping_address TEXT,
  status VARCHAR(191) DEFAULT 'active',
  user_type VARCHAR(191) NOT NULL,
  credit_period INTEGER DEFAULT 30,
  credit_limit DECIMAL(8,2),
  image VARCHAR(191),
  tax_number VARCHAR(191),
  opening_balance DECIMAL(8,2) DEFAULT 0,
  opening_balance_type VARCHAR(191) DEFAULT 'receive',
  login_enabled BOOLEAN DEFAULT false,
  is_walkin_customer BOOLEAN DEFAULT false,
  remember_token VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des commandes/ventes
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  order_type VARCHAR(191) NOT NULL,
  invoice_number VARCHAR(191) NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_status VARCHAR(191) DEFAULT 'ordered',
  total_items INTEGER DEFAULT 0,
  total_quantity DECIMAL(8,2) DEFAULT 0,
  subtotal DECIMAL(8,2) DEFAULT 0,
  tax_amount DECIMAL(8,2) DEFAULT 0,
  discount DECIMAL(8,2) DEFAULT 0,
  shipping DECIMAL(8,2) DEFAULT 0,
  round_off DECIMAL(8,2) DEFAULT 0,
  total DECIMAL(8,2) DEFAULT 0,
  due_amount DECIMAL(8,2) DEFAULT 0,
  paid_amount DECIMAL(8,2) DEFAULT 0,
  payment_status VARCHAR(191) DEFAULT 'pending',
  currency_id BIGINT REFERENCES currencies(id) ON DELETE SET NULL,
  currency_rate DECIMAL(8,4) DEFAULT 1,
  terms_condition TEXT,
  notes TEXT,
  staff_user_id BIGINT,
  is_delivery_boy_assigned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des articles de commande
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  quantity DECIMAL(8,2) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  tax_rate DECIMAL(8,2) DEFAULT 0,
  tax_amount DECIMAL(8,2) DEFAULT 0,
  total_amount DECIMAL(8,2) NOT NULL,
  single_unit_price DECIMAL(8,2),
  unit_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paiements
CREATE TABLE order_payments (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  payment_mode_id BIGINT REFERENCES payment_modes(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(8,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des ajustements de stock
CREATE TABLE stock_adjustments (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_number VARCHAR(191),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de l'historique des stocks
CREATE TABLE stock_history (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  variation_id BIGINT REFERENCES variations(id) ON DELETE SET NULL,
  order_type VARCHAR(191),
  stock_type VARCHAR(191),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_id BIGINT,
  quantity DECIMAL(8,2) DEFAULT 0,
  old_quantity DECIMAL(8,2) DEFAULT 0,
  new_quantity DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories de dépenses
CREATE TABLE expense_categories (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des dépenses
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  expense_category_id BIGINT REFERENCES expense_categories(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_number VARCHAR(191),
  amount DECIMAL(8,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes pour optimiser les performances
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_warehouses_company_id ON warehouses(company_id);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_product_details_product_id ON product_details(product_id);
CREATE INDEX idx_product_details_warehouse_id ON product_details(warehouse_id);
CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_orders_warehouse_id ON orders(warehouse_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_user_type ON users(user_type);

-- Triggers pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 