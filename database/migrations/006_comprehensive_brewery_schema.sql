-- Comprehensive Brewery Management Schema for Multi-Tenant System
-- Based on ER diagram with standardized audit fields and integer PKs/FKs
-- All primary keys are auto-incrementing integers starting from 0

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS equipment_service CASCADE;
DROP TABLE IF EXISTS batch_steps CASCADE;
DROP TABLE IF EXISTS inventory_counts CASCADE;
DROP TABLE IF EXISTS order_line_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customer_visits CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS beer_styles CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS customer_reps CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS breweries CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Create sequence for zero-based auto-increment
CREATE OR REPLACE FUNCTION create_zero_based_sequence(table_name TEXT, column_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE SEQUENCE %I_%I_seq START 0 MINVALUE 0', table_name, column_name);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT nextval(%L)',
                   table_name, column_name, table_name || '_' || column_name || '_seq');
END;
$$ LANGUAGE plpgsql;

-- Tenants table (top-level multi-tenancy)
CREATE TABLE tenants (
    tenant_id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(50),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(50) DEFAULT 'US',
    subscription_status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    subscription_plan VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    max_breweries INTEGER DEFAULT 1,
    max_employees INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER
);

-- Breweries table (multiple breweries per tenant)
CREATE TABLE breweries (
    brewery_id INTEGER PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(255), -- Official business name
    description TEXT,

    -- Location information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    -- Business information
    license_number VARCHAR(100),
    tax_id VARCHAR(50),
    website VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    established_date DATE,

    -- Operational settings
    default_batch_size_liters DECIMAL(10,2) DEFAULT 1000.00,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(3) DEFAULT 'USD',

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER,

    CONSTRAINT unique_brewery_name_per_tenant UNIQUE(tenant_id, name)
);

-- Employees table (staff members for breweries)
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    employee_number VARCHAR(50), -- Internal employee ID

    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),

    -- Employment information
    job_title VARCHAR(150),
    department VARCHAR(100), -- brewing, sales, admin, quality, maintenance
    hire_date DATE,
    termination_date DATE,
    employment_status VARCHAR(50) DEFAULT 'active', -- active, inactive, terminated
    hourly_rate DECIMAL(8,2),
    salary_annual DECIMAL(12,2),

    -- Permissions and certifications
    access_level VARCHAR(50) DEFAULT 'standard', -- admin, supervisor, standard, read_only
    certifications TEXT[], -- Array of certifications
    security_clearance VARCHAR(50),

    -- Emergency contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Customers table (brewery customers)
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    customer_number VARCHAR(50), -- Internal customer ID

    -- Customer information
    customer_type VARCHAR(50) NOT NULL, -- individual, business, distributor, restaurant, retailer
    company_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Address information
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(50),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(50) DEFAULT 'US',

    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(50),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(50) DEFAULT 'US',

    -- Business information
    tax_id VARCHAR(50),
    resale_license VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    payment_terms INTEGER DEFAULT 30, -- Net days
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,

    -- Status and preferences
    customer_status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
    preferred_contact_method VARCHAR(50) DEFAULT 'email', -- email, phone, mail
    notes TEXT,

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Customer representatives (many-to-many between employees and customers)
CREATE TABLE customer_reps (
    customer_rep_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,

    rep_type VARCHAR(50) DEFAULT 'primary', -- primary, secondary, technical, billing
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id),

    CONSTRAINT unique_customer_primary_rep UNIQUE(customer_id, rep_type)
);

-- Customer visits (tracking customer interactions)
CREATE TABLE customer_visits (
    visit_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(employee_id), -- Who handled the visit

    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME,
    visit_type VARCHAR(50) NOT NULL, -- tour, tasting, meeting, delivery, pickup, event

    -- Visit details
    number_of_visitors INTEGER DEFAULT 1,
    duration_minutes INTEGER,
    total_sales DECIMAL(10,2) DEFAULT 0.00,

    purpose TEXT, -- Reason for visit
    notes TEXT, -- Visit summary
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),

    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Beer styles (standardized beer style references)
CREATE TABLE beer_styles (
    style_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,

    style_name VARCHAR(150) NOT NULL,
    style_code VARCHAR(20), -- BJCP code or internal code
    category VARCHAR(100), -- Ale, Lager, Hybrid, Specialty
    subcategory VARCHAR(100), -- IPA, Stout, Pilsner, etc.

    -- Style guidelines
    abv_min DECIMAL(4,2),
    abv_max DECIMAL(4,2),
    ibu_min INTEGER,
    ibu_max INTEGER,
    srm_min DECIMAL(4,1),
    srm_max DECIMAL(4,1),
    og_min DECIMAL(4,3),
    og_max DECIMAL(4,3),
    fg_min DECIMAL(4,3),
    fg_max DECIMAL(4,3),

    description TEXT,
    flavor_profile TEXT,
    commercial_examples TEXT,

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id),

    CONSTRAINT unique_style_name_per_brewery UNIQUE(brewery_id, style_name)
);

-- Recipes (master beer recipes)
CREATE TABLE recipes (
    recipe_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    style_id INTEGER REFERENCES beer_styles(style_id),

    recipe_name VARCHAR(200) NOT NULL,
    recipe_code VARCHAR(50), -- Internal recipe code
    version INTEGER DEFAULT 1,

    -- Recipe specifications
    batch_size_liters DECIMAL(8,2) NOT NULL,
    boil_time_minutes INTEGER DEFAULT 60,
    mash_time_minutes INTEGER DEFAULT 60,
    fermentation_temp_celsius DECIMAL(4,1),
    fermentation_days INTEGER,
    conditioning_days INTEGER,

    -- Target specifications
    target_og DECIMAL(4,3),
    target_fg DECIMAL(4,3),
    target_abv DECIMAL(4,2),
    target_ibu INTEGER,
    target_srm DECIMAL(4,1),

    -- Recipe details
    grain_bill TEXT, -- JSON or structured grain information
    hop_schedule TEXT, -- JSON or structured hop additions
    yeast_strains TEXT, -- JSON or structured yeast information
    water_profile TEXT, -- JSON or structured water chemistry
    special_ingredients TEXT, -- JSON for adjuncts, spices, etc.

    mash_schedule TEXT, -- Step mashing instructions
    fermentation_notes TEXT,
    packaging_notes TEXT,
    tasting_notes TEXT,

    recipe_status VARCHAR(50) DEFAULT 'development', -- development, approved, archived
    efficiency_percentage DECIMAL(5,2) DEFAULT 75.00,
    cost_per_liter DECIMAL(8,2),

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id),

    CONSTRAINT unique_recipe_name_version UNIQUE(brewery_id, recipe_name, version)
);

-- Equipment (brewery equipment and assets)
CREATE TABLE equipment (
    equipment_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,

    equipment_name VARCHAR(200) NOT NULL,
    equipment_code VARCHAR(50), -- Internal equipment ID
    equipment_type VARCHAR(100) NOT NULL, -- kettle, fermenter, tank, pump, valve, etc.
    category VARCHAR(100), -- brewing, packaging, cleaning, utilities

    -- Equipment specifications
    manufacturer VARCHAR(150),
    model VARCHAR(150),
    serial_number VARCHAR(150),
    capacity_liters DECIMAL(10,2),
    power_requirements VARCHAR(100),
    operating_pressure_psi DECIMAL(6,2),
    operating_temperature_max_celsius DECIMAL(5,1),

    -- Installation and location
    installation_date DATE,
    location VARCHAR(150), -- Physical location in brewery
    area VARCHAR(100), -- brew house, cellar, packaging, etc.

    -- Maintenance and warranty
    warranty_expiry_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_interval_days INTEGER,
    maintenance_notes TEXT,

    -- Financial information
    purchase_cost DECIMAL(12,2),
    current_value DECIMAL(12,2),
    depreciation_rate DECIMAL(5,2),

    equipment_status VARCHAR(50) DEFAULT 'operational', -- operational, maintenance, repair, retired
    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Equipment service (maintenance and repair records)
CREATE TABLE equipment_service (
    service_id INTEGER PRIMARY KEY,
    equipment_id INTEGER NOT NULL REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(employee_id), -- Technician

    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_type VARCHAR(50) NOT NULL, -- maintenance, repair, inspection, calibration, cleaning

    -- Service details
    description TEXT NOT NULL,
    work_performed TEXT,
    parts_replaced TEXT,
    hours_worked DECIMAL(5,2),

    -- Costs
    labor_cost DECIMAL(8,2) DEFAULT 0.00,
    parts_cost DECIMAL(8,2) DEFAULT 0.00,
    external_service_cost DECIMAL(8,2) DEFAULT 0.00,
    total_cost DECIMAL(8,2) GENERATED ALWAYS AS (labor_cost + parts_cost + external_service_cost) STORED,

    -- Service provider (if external)
    service_provider VARCHAR(200),
    invoice_number VARCHAR(100),

    -- Follow-up
    next_service_date DATE,
    follow_up_required BOOLEAN DEFAULT false,
    notes TEXT,

    service_status VARCHAR(50) DEFAULT 'completed', -- scheduled, inprogress, completed, cancelled
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Products (finished beer products)
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    recipe_id INTEGER REFERENCES recipes(recipe_id),
    style_id INTEGER REFERENCES beer_styles(style_id),

    product_name VARCHAR(200) NOT NULL,
    product_code VARCHAR(50), -- SKU or internal product code

    -- Product specifications
    abv DECIMAL(4,2),
    ibu INTEGER,
    srm DECIMAL(4,1),
    calories_per_12oz INTEGER,

    -- Packaging options
    package_types TEXT[], -- bottles, cans, kegs, growlers
    package_sizes TEXT[], -- 12oz, 16oz, 32oz, 5gal, etc.

    -- Pricing
    wholesale_price_per_unit DECIMAL(8,2),
    retail_price_per_unit DECIMAL(8,2),
    cost_per_unit DECIMAL(8,2),

    -- Marketing information
    description TEXT,
    tasting_notes TEXT,
    food_pairings TEXT,
    marketing_copy TEXT,

    -- Availability
    seasonal BOOLEAN DEFAULT false,
    seasonal_start_month INTEGER,
    seasonal_end_month INTEGER,
    limited_edition BOOLEAN DEFAULT false,

    product_status VARCHAR(50) DEFAULT 'active', -- development, active, discontinued, seasonal_off
    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id),

    CONSTRAINT unique_product_name_per_brewery UNIQUE(brewery_id, product_name)
);

-- Batches (actual brewing production runs)
CREATE TABLE batches (
    batch_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes(recipe_id),
    product_id INTEGER REFERENCES products(product_id),
    equipment_id INTEGER REFERENCES equipment(equipment_id), -- Primary fermenter

    batch_number VARCHAR(100) NOT NULL,
    batch_name VARCHAR(200),

    -- Batch dates
    planned_brew_date DATE,
    actual_brew_date DATE,
    planned_package_date DATE,
    actual_package_date DATE,
    planned_release_date DATE,
    actual_release_date DATE,

    -- Batch specifications
    batch_size_liters DECIMAL(8,2) NOT NULL,

    -- Measured values during brewing
    mash_temp_celsius DECIMAL(4,1),
    boil_gravity DECIMAL(4,3),
    original_gravity DECIMAL(4,3),
    final_gravity DECIMAL(4,3),
    actual_abv DECIMAL(4,2),
    actual_ibu INTEGER,
    actual_srm DECIMAL(4,1),

    -- Efficiency and yield
    mash_efficiency_percentage DECIMAL(5,2),
    brewhouse_efficiency_percentage DECIMAL(5,2),
    final_volume_liters DECIMAL(8,2),

    -- Fermentation tracking
    fermentation_start_date DATE,
    fermentation_end_date DATE,
    fermentation_temp_celsius DECIMAL(4,1),
    yeast_pitch_rate DECIMAL(10,2), -- cells/mL/°P

    -- Quality and tasting
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
    tasting_notes TEXT,
    aroma_notes TEXT,
    flavor_notes TEXT,
    off_flavors TEXT,

    -- Production team
    head_brewer_id INTEGER REFERENCES employees(employee_id),
    assistant_brewer_id INTEGER REFERENCES employees(employee_id),

    -- Costs and financials
    ingredient_cost DECIMAL(10,2) DEFAULT 0.00,
    labor_cost DECIMAL(10,2) DEFAULT 0.00,
    overhead_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (ingredient_cost + labor_cost + overhead_cost) STORED,
    cost_per_liter DECIMAL(8,2),

    -- Status and notes
    batch_status VARCHAR(50) DEFAULT 'planning', -- planning, brewing, fermenting, conditioning, packaging, completed, dumped
    production_notes TEXT,
    packaging_notes TEXT,

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id),

    CONSTRAINT unique_batch_number_per_brewery UNIQUE(brewery_id, batch_number)
);

-- Batch steps (detailed brewing process tracking)
CREATE TABLE batch_steps (
    step_id INTEGER PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(employee_id), -- Who performed the step

    step_number INTEGER NOT NULL,
    step_name VARCHAR(150) NOT NULL, -- mash_in, sparge, boil_start, hop_addition, etc.
    step_type VARCHAR(50) NOT NULL, -- mashing, lautering, boiling, fermentation, packaging

    -- Timing
    planned_start_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,

    -- Parameters
    temperature_celsius DECIMAL(4,1),
    pressure_psi DECIMAL(6,2),
    ph DECIMAL(3,1),
    gravity DECIMAL(4,3),
    volume_liters DECIMAL(8,2),

    -- Ingredients or additions
    ingredient_name VARCHAR(200),
    quantity_kg DECIMAL(8,3),
    quantity_grams DECIMAL(8,1),
    addition_time_minutes INTEGER, -- Time into step when added

    -- Step details
    description TEXT,
    notes TEXT,
    quality_check_passed BOOLEAN,
    quality_notes TEXT,

    step_status VARCHAR(50) DEFAULT 'pending', -- pending, inprogress, completed, skipped, failed
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Inventory (raw materials and finished goods)
CREATE TABLE inventory (
    inventory_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id), -- For finished goods

    item_name VARCHAR(200) NOT NULL,
    item_code VARCHAR(50), -- SKU or internal code
    item_type VARCHAR(50) NOT NULL, -- raw_material, packaging, finished_good, maintenance, office
    category VARCHAR(100), -- grain, hops, yeast, bottles, cans, kegs, cleaning, etc.
    subcategory VARCHAR(100),

    -- Supplier information
    supplier_name VARCHAR(200),
    supplier_part_number VARCHAR(100),
    preferred_supplier BOOLEAN DEFAULT false,

    -- Inventory levels
    current_stock DECIMAL(12,3) DEFAULT 0,
    reserved_stock DECIMAL(12,3) DEFAULT 0, -- Allocated but not used
    available_stock DECIMAL(12,3) GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,

    -- Reorder parameters
    minimum_stock DECIMAL(12,3) DEFAULT 0,
    maximum_stock DECIMAL(12,3),
    reorder_quantity DECIMAL(12,3),
    lead_time_days INTEGER DEFAULT 7,

    -- Unit information
    unit_of_measure VARCHAR(20) NOT NULL, -- kg, L, pieces, cases, lbs, oz
    units_per_case INTEGER DEFAULT 1,

    -- Pricing
    last_purchase_price DECIMAL(10,4),
    average_cost DECIMAL(10,4),
    current_market_price DECIMAL(10,4),

    -- Storage information
    storage_location VARCHAR(150),
    storage_temperature_min_celsius DECIMAL(4,1),
    storage_temperature_max_celsius DECIMAL(4,1),
    storage_humidity_max_percentage DECIMAL(5,2),

    -- Quality and expiration
    shelf_life_days INTEGER,
    lot_tracking_required BOOLEAN DEFAULT false,
    expiry_date DATE,
    quality_grade VARCHAR(50),

    -- Status
    item_status VARCHAR(50) DEFAULT 'active', -- active, discontinued, seasonal, backordered
    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Inventory counts (periodic inventory audits)
CREATE TABLE inventory_counts (
    count_id INTEGER PRIMARY KEY,
    inventory_id INTEGER NOT NULL REFERENCES inventory(inventory_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(employee_id), -- Who performed the count

    count_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count_type VARCHAR(50) DEFAULT 'periodic', -- periodic, cycle, spot, full

    -- Count details
    system_quantity DECIMAL(12,3), -- What system thinks we have
    counted_quantity DECIMAL(12,3), -- What was actually counted
    variance_quantity DECIMAL(12,3) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    variance_percentage DECIMAL(7,4),

    -- Cost impact
    unit_cost DECIMAL(10,4),
    variance_cost DECIMAL(10,2) GENERATED ALWAYS AS (variance_quantity * unit_cost) STORED,

    -- Count details
    count_method VARCHAR(50), -- manual, barcode, scale
    lot_number VARCHAR(100),
    expiry_date DATE,
    location_verified BOOLEAN DEFAULT true,

    -- Variance explanation
    variance_reason VARCHAR(100), -- shrinkage, damage, theft, error, found
    variance_explanation TEXT,
    adjustment_approved BOOLEAN DEFAULT false,
    approved_by INTEGER REFERENCES employees(employee_id),

    notes TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Orders (customer orders for products)
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    employee_id INTEGER REFERENCES employees(employee_id), -- Sales rep

    order_number VARCHAR(100) NOT NULL,
    po_number VARCHAR(100), -- Customer purchase order number

    -- Order dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_delivery_date DATE,
    promised_delivery_date DATE,
    actual_delivery_date DATE,

    -- Shipping information
    ship_to_company VARCHAR(255),
    ship_to_contact VARCHAR(200),
    ship_to_address_line1 VARCHAR(255),
    ship_to_address_line2 VARCHAR(255),
    ship_to_city VARCHAR(100),
    ship_to_state VARCHAR(50),
    ship_to_postal_code VARCHAR(20),
    ship_to_country VARCHAR(50) DEFAULT 'US',
    ship_to_phone VARCHAR(50),

    -- Billing information
    bill_to_company VARCHAR(255),
    bill_to_contact VARCHAR(200),
    bill_to_address_line1 VARCHAR(255),
    bill_to_address_line2 VARCHAR(255),
    bill_to_city VARCHAR(100),
    bill_to_state VARCHAR(50),
    bill_to_postal_code VARCHAR(20),
    bill_to_country VARCHAR(50) DEFAULT 'US',

    -- Order totals
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,

    -- Payment and terms
    payment_terms INTEGER DEFAULT 30, -- Net days
    payment_method VARCHAR(50), -- cash, check, credit_card, ach, wire
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, overdue

    -- Shipping
    shipping_method VARCHAR(50), -- pickup, delivery, freight, courier
    tracking_number VARCHAR(100),
    freight_carrier VARCHAR(100),
    freight_cost DECIMAL(8,2),

    -- Status and notes
    order_status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, confirmed, in_production, ready, shipped, delivered, cancelled
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, rush
    special_instructions TEXT,
    internal_notes TEXT,

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id),

    CONSTRAINT unique_order_number_per_brewery UNIQUE(brewery_id, order_number)
);

-- Order line items (individual products on orders)
CREATE TABLE order_line_items (
    line_item_id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    batch_id INTEGER REFERENCES batches(batch_id), -- Specific batch if applicable

    line_number INTEGER NOT NULL,

    -- Product details
    product_name VARCHAR(200), -- Snapshot at time of order
    product_code VARCHAR(50),
    package_type VARCHAR(50), -- bottle, can, keg, growler
    package_size VARCHAR(50), -- 12oz, 16oz, 5gal, etc.

    -- Quantities
    ordered_quantity DECIMAL(10,2) NOT NULL,
    shipped_quantity DECIMAL(10,2) DEFAULT 0.00,
    backordered_quantity DECIMAL(10,2) DEFAULT 0.00,
    cancelled_quantity DECIMAL(10,2) DEFAULT 0.00,

    -- Pricing
    unit_price DECIMAL(8,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(8,2) DEFAULT 0.00,
    line_total DECIMAL(10,2) GENERATED ALWAYS AS ((ordered_quantity * unit_price) - discount_amount) STORED,

    -- Delivery
    requested_delivery_date DATE,
    promised_delivery_date DATE,
    actual_delivery_date DATE,

    -- Status and notes
    line_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, allocated, picked, shipped, delivered, cancelled
    special_instructions TEXT,
    notes TEXT,

    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Create all zero-based sequences
SELECT create_zero_based_sequence('tenants', 'tenant_id');
SELECT create_zero_based_sequence('breweries', 'brewery_id');
SELECT create_zero_based_sequence('employees', 'employee_id');
SELECT create_zero_based_sequence('customers', 'customer_id');
SELECT create_zero_based_sequence('customer_reps', 'customer_rep_id');
SELECT create_zero_based_sequence('customer_visits', 'visit_id');
SELECT create_zero_based_sequence('beer_styles', 'style_id');
SELECT create_zero_based_sequence('recipes', 'recipe_id');
SELECT create_zero_based_sequence('equipment', 'equipment_id');
SELECT create_zero_based_sequence('equipment_service', 'service_id');
SELECT create_zero_based_sequence('products', 'product_id');
SELECT create_zero_based_sequence('batches', 'batch_id');
SELECT create_zero_based_sequence('batch_steps', 'step_id');
SELECT create_zero_based_sequence('inventory', 'inventory_id');
SELECT create_zero_based_sequence('inventory_counts', 'count_id');
SELECT create_zero_based_sequence('orders', 'order_id');
SELECT create_zero_based_sequence('order_line_items', 'line_item_id');

-- Create indexes for performance
CREATE INDEX idx_breweries_tenant ON breweries(tenant_id);
CREATE INDEX idx_employees_brewery ON employees(brewery_id);
CREATE INDEX idx_customers_brewery ON customers(brewery_id);
CREATE INDEX idx_customer_reps_customer ON customer_reps(customer_id);
CREATE INDEX idx_customer_reps_employee ON customer_reps(employee_id);
CREATE INDEX idx_customer_visits_customer ON customer_visits(customer_id);
CREATE INDEX idx_customer_visits_date ON customer_visits(visit_date);
CREATE INDEX idx_beer_styles_brewery ON beer_styles(brewery_id);
CREATE INDEX idx_recipes_brewery ON recipes(brewery_id);
CREATE INDEX idx_recipes_style ON recipes(style_id);
CREATE INDEX idx_equipment_brewery ON equipment(brewery_id);
CREATE INDEX idx_equipment_service_equipment ON equipment_service(equipment_id);
CREATE INDEX idx_equipment_service_date ON equipment_service(service_date);
CREATE INDEX idx_products_brewery ON products(brewery_id);
CREATE INDEX idx_products_recipe ON products(recipe_id);
CREATE INDEX idx_batches_brewery ON batches(brewery_id);
CREATE INDEX idx_batches_recipe ON batches(recipe_id);
CREATE INDEX idx_batches_status ON batches(batch_status);
CREATE INDEX idx_batch_steps_batch ON batch_steps(batch_id);
CREATE INDEX idx_inventory_brewery ON inventory(brewery_id);
CREATE INDEX idx_inventory_type ON inventory(item_type, category);
CREATE INDEX idx_inventory_counts_inventory ON inventory_counts(inventory_id);
CREATE INDEX idx_inventory_counts_date ON inventory_counts(count_date);
CREATE INDEX idx_orders_brewery ON orders(brewery_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_order_line_items_order ON order_line_items(order_id);
CREATE INDEX idx_order_line_items_product ON order_line_items(product_id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables with modified column
CREATE TRIGGER update_tenants_modified BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_breweries_modified BEFORE UPDATE ON breweries FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_employees_modified BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_customers_modified BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_customer_reps_modified BEFORE UPDATE ON customer_reps FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_customer_visits_modified BEFORE UPDATE ON customer_visits FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_beer_styles_modified BEFORE UPDATE ON beer_styles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_recipes_modified BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_equipment_modified BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_equipment_service_modified BEFORE UPDATE ON equipment_service FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_products_modified BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_batches_modified BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_batch_steps_modified BEFORE UPDATE ON batch_steps FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_inventory_modified BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_inventory_counts_modified BEFORE UPDATE ON inventory_counts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modified BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_order_line_items_modified BEFORE UPDATE ON order_line_items FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Drop the helper function as it's no longer needed
DROP FUNCTION create_zero_based_sequence(TEXT, TEXT);