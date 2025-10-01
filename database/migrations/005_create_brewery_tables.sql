-- Create brewery operations tables for multi-brewery data isolation
-- This migration adds support for multiple breweries per tenant with proper data isolation

-- Breweries table - each tenant can have multiple breweries
CREATE TABLE IF NOT EXISTS breweries (
    brewery_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    website VARCHAR(500),
    license_number VARCHAR(100),
    established_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
    CONSTRAINT unique_brewery_name_per_tenant UNIQUE(tenant_id, name)
);

-- Brewery users - many-to-many relationship between users and breweries
CREATE TABLE IF NOT EXISTS brewery_users (
    brewery_user_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    brewery_id VARCHAR(50) NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, brewer, operator, viewer
    is_owner BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    invited_by VARCHAR(50) REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT unique_user_brewery UNIQUE(brewery_id, user_id)
);

-- Recipe categories - for organizing beer recipes
CREATE TABLE IF NOT EXISTS recipe_categories (
    category_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    brewery_id VARCHAR(50) NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
    CONSTRAINT unique_category_name_per_brewery UNIQUE(brewery_id, name)
);

-- Beer recipes - master recipes for each brewery
CREATE TABLE IF NOT EXISTS beer_recipes (
    recipe_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    brewery_id VARCHAR(50) NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    category_id VARCHAR(50) REFERENCES recipe_categories(category_id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    style VARCHAR(100), -- IPA, Stout, Lager, etc.
    abv_target DECIMAL(4,2), -- Alcohol by volume target
    ibu_target INTEGER, -- International Bitterness Units
    srm_target DECIMAL(4,1), -- Standard Reference Method (color)
    og_target DECIMAL(4,3), -- Original gravity
    fg_target DECIMAL(4,3), -- Final gravity
    batch_size_liters DECIMAL(8,2) DEFAULT 1000.00, -- Default 1000L
    boil_time_minutes INTEGER DEFAULT 60,
    fermentation_temp_celsius DECIMAL(4,1),
    fermentation_days INTEGER,
    recipe_notes TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false, -- Can other breweries see this recipe
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
    CONSTRAINT unique_recipe_name_per_brewery UNIQUE(brewery_id, name, version)
);

-- Recipe ingredients - ingredients for each recipe
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_ingredient_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    recipe_id VARCHAR(50) NOT NULL REFERENCES beer_recipes(recipe_id) ON DELETE CASCADE,
    ingredient_type VARCHAR(50) NOT NULL, -- grain, hop, yeast, adjunct, water_treatment
    name VARCHAR(200) NOT NULL,
    amount_kg DECIMAL(8,3), -- Amount in kilograms
    amount_grams DECIMAL(8,1), -- Amount in grams (for smaller quantities)
    percentage DECIMAL(5,2), -- Percentage of total grain bill or hop bill
    timing_minutes INTEGER, -- For hops: boil time, For others: step timing
    notes TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Production batches - actual brewing sessions
CREATE TABLE IF NOT EXISTS production_batches (
    batch_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    brewery_id VARCHAR(50) NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    recipe_id VARCHAR(50) NOT NULL REFERENCES beer_recipes(recipe_id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL, -- Brewery's internal batch number
    status VARCHAR(50) DEFAULT 'planning', -- planning, brewing, fermenting, conditioning, packaging, completed, cancelled
    planned_start_date DATE,
    actual_start_date DATE,
    planned_completion_date DATE,
    actual_completion_date DATE,
    batch_size_liters DECIMAL(8,2),
    brewmaster_id VARCHAR(50) REFERENCES users(user_id),
    og_actual DECIMAL(4,3), -- Actual original gravity
    fg_actual DECIMAL(4,3), -- Actual final gravity
    abv_actual DECIMAL(4,2), -- Actual ABV
    efficiency_percent DECIMAL(5,2), -- Brewing efficiency
    yield_liters DECIMAL(8,2), -- Final yield
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
    tasting_notes TEXT,
    production_notes TEXT,
    cost_total DECIMAL(10,2), -- Total production cost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
    CONSTRAINT unique_batch_number_per_brewery UNIQUE(brewery_id, batch_number)
);

-- Batch ingredients - actual ingredients used in production
CREATE TABLE IF NOT EXISTS batch_ingredients (
    batch_ingredient_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    batch_id VARCHAR(50) NOT NULL REFERENCES production_batches(batch_id) ON DELETE CASCADE,
    recipe_ingredient_id VARCHAR(50) REFERENCES recipe_ingredients(recipe_ingredient_id),
    ingredient_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    planned_amount_kg DECIMAL(8,3),
    actual_amount_kg DECIMAL(8,3),
    cost_per_kg DECIMAL(8,2),
    total_cost DECIMAL(10,2),
    supplier VARCHAR(200),
    lot_number VARCHAR(100),
    notes TEXT
);

-- Quality control checks - QC data for batches
CREATE TABLE IF NOT EXISTS quality_checks (
    check_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    batch_id VARCHAR(50) NOT NULL REFERENCES production_batches(batch_id) ON DELETE CASCADE,
    check_type VARCHAR(50) NOT NULL, -- gravity, ph, temperature, taste, appearance, aroma
    check_date DATE NOT NULL,
    check_time TIME,
    value_numeric DECIMAL(8,3), -- For numeric values like gravity, pH
    value_text TEXT, -- For descriptive values
    target_value DECIMAL(8,3),
    tolerance_plus DECIMAL(8,3),
    tolerance_minus DECIMAL(8,3),
    is_within_spec BOOLEAN,
    notes TEXT,
    checked_by VARCHAR(50) REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory management - raw materials and finished goods
CREATE TABLE IF NOT EXISTS inventory_items (
    item_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    brewery_id VARCHAR(50) NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- raw_material, finished_good, packaging, equipment
    category VARCHAR(50), -- grain, hop, yeast, bottle, keg, can
    name VARCHAR(200) NOT NULL,
    description TEXT,
    unit_of_measure VARCHAR(20) NOT NULL, -- kg, L, pieces, cases
    current_stock DECIMAL(10,3) DEFAULT 0,
    minimum_stock DECIMAL(10,3) DEFAULT 0,
    maximum_stock DECIMAL(10,3),
    cost_per_unit DECIMAL(8,2),
    supplier VARCHAR(200),
    storage_location VARCHAR(100),
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id)
);

-- Inventory transactions - stock movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    item_id VARCHAR(50) NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    batch_id VARCHAR(50) REFERENCES production_batches(batch_id), -- If related to production
    transaction_type VARCHAR(50) NOT NULL, -- purchase, usage, adjustment, transfer, waste
    quantity DECIMAL(10,3) NOT NULL, -- Positive for additions, negative for usage
    unit_cost DECIMAL(8,2),
    total_cost DECIMAL(10,2),
    reference_number VARCHAR(100), -- PO number, invoice number, etc.
    notes TEXT,
    transaction_date DATE NOT NULL,
    recorded_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_breweries_tenant_active ON breweries(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_brewery_users_brewery_active ON brewery_users(brewery_id, is_active);
CREATE INDEX IF NOT EXISTS idx_brewery_users_user_active ON brewery_users(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_beer_recipes_brewery_active ON beer_recipes(brewery_id, is_active);
CREATE INDEX IF NOT EXISTS idx_production_batches_brewery_status ON production_batches(brewery_id, status);
CREATE INDEX IF NOT EXISTS idx_production_batches_dates ON production_batches(planned_start_date, actual_start_date);
CREATE INDEX IF NOT EXISTS idx_quality_checks_batch_date ON quality_checks(batch_id, check_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_brewery_type ON inventory_items(brewery_id, item_type, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_date ON inventory_transactions(item_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_batch ON inventory_transactions(batch_id);

-- Add updated_at trigger for tables that need it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_breweries_updated_at BEFORE UPDATE ON breweries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beer_recipes_updated_at BEFORE UPDATE ON beer_recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_batches_updated_at BEFORE UPDATE ON production_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();