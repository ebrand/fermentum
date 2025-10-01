-- ============================================================================
-- Updated Tenant Schema Creation Function
-- Creates comprehensive brewery management schema with integer PKs and audit fields
-- ============================================================================

-- Helper function to create zero-based sequences for integer PKs
CREATE OR REPLACE FUNCTION public.create_tenant_zero_based_sequence(schema_name TEXT, table_name TEXT, column_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE SEQUENCE %I.%I_%I_seq START 0 MINVALUE 0', schema_name, table_name, column_name);
    EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT nextval(%L)',
                   schema_name, table_name, column_name, schema_name || '.' || table_name || '_' || column_name || '_seq');
END;
$$ LANGUAGE plpgsql;

-- Updated comprehensive tenant schema creation function
CREATE OR REPLACE FUNCTION public.create_tenant_schema(
    p_tenant_id UUID,
    p_created_by UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_schema_name VARCHAR(63);
    v_tenant_id_int INTEGER;
BEGIN
    -- Generate schema name
    v_schema_name := public.generate_schema_name(p_tenant_id);

    -- Check if schema already exists
    IF EXISTS (
        SELECT 1 FROM information_schema.schemata
        WHERE schema_name = v_schema_name
    ) THEN
        RAISE EXCEPTION 'Schema % already exists', v_schema_name;
    END IF;

    -- Create the schema
    EXECUTE format('CREATE SCHEMA %I', v_schema_name);

    -- Grant permissions to application user
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO fermentum_app', v_schema_name);
    EXECUTE format('GRANT CREATE ON SCHEMA %I TO fermentum_app', v_schema_name);

    -- Get the tenant UUID from the main tenants table (for verification)
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
        RAISE EXCEPTION 'Tenant not found in main tenants table: %', p_tenant_id;
    END IF;

    -- Convert UUID to integer for primary keys (hash-based approach)
    v_tenant_id_int := abs(hashtext(p_tenant_id::text)) % 2147483647;

    -- Create breweries table
    EXECUTE format('
        CREATE TABLE %I.breweries (
            brewery_id INTEGER PRIMARY KEY,
            tenant_id INTEGER NOT NULL DEFAULT %L,
            name VARCHAR(200) NOT NULL,
            legal_name VARCHAR(255),
            description TEXT,

            -- Location information
            address_line1 VARCHAR(255),
            address_line2 VARCHAR(255),
            city VARCHAR(100),
            state VARCHAR(50),
            postal_code VARCHAR(20),
            country VARCHAR(50) DEFAULT ''US'',
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
            timezone VARCHAR(50) DEFAULT ''America/New_York'',
            currency VARCHAR(3) DEFAULT ''USD'',

            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER,

            CONSTRAINT unique_brewery_name_per_tenant UNIQUE(tenant_id, name)
        )', v_schema_name, v_tenant_id_int);

    -- Create employees table
    EXECUTE format('
        CREATE TABLE %I.employees (
            employee_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,
            employee_number VARCHAR(50),

            -- Personal information
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            middle_name VARCHAR(100),
            email VARCHAR(255),
            phone VARCHAR(50),

            -- Employment information
            job_title VARCHAR(150),
            department VARCHAR(100),
            hire_date DATE,
            termination_date DATE,
            employment_status VARCHAR(50) DEFAULT ''active'',
            hourly_rate DECIMAL(8,2),
            salary_annual DECIMAL(12,2),

            -- Permissions and certifications
            access_level VARCHAR(50) DEFAULT ''standard'',
            certifications TEXT[],
            security_clearance VARCHAR(50),

            -- Emergency contact
            emergency_contact_name VARCHAR(200),
            emergency_contact_phone VARCHAR(50),
            emergency_contact_relationship VARCHAR(100),

            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create customers table
    EXECUTE format('
        CREATE TABLE %I.customers (
            customer_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,
            customer_number VARCHAR(50),

            -- Customer information
            customer_type VARCHAR(50) NOT NULL,
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
            billing_country VARCHAR(50) DEFAULT ''US'',

            shipping_address_line1 VARCHAR(255),
            shipping_address_line2 VARCHAR(255),
            shipping_city VARCHAR(100),
            shipping_state VARCHAR(50),
            shipping_postal_code VARCHAR(20),
            shipping_country VARCHAR(50) DEFAULT ''US'',

            -- Business information
            tax_id VARCHAR(50),
            resale_license VARCHAR(100),
            credit_limit DECIMAL(12,2) DEFAULT 0.00,
            payment_terms INTEGER DEFAULT 30,
            discount_percentage DECIMAL(5,2) DEFAULT 0.00,

            -- Status and preferences
            customer_status VARCHAR(50) DEFAULT ''active'',
            preferred_contact_method VARCHAR(50) DEFAULT ''email'',
            notes TEXT,

            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create customer_reps table
    EXECUTE format('
        CREATE TABLE %I.customer_reps (
            customer_rep_id INTEGER PRIMARY KEY,
            customer_id INTEGER NOT NULL REFERENCES %I.customers(customer_id) ON DELETE CASCADE,
            employee_id INTEGER NOT NULL REFERENCES %I.employees(employee_id) ON DELETE CASCADE,

            rep_type VARCHAR(50) DEFAULT ''primary'',
            start_date DATE DEFAULT CURRENT_DATE,
            end_date DATE,

            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id),

            CONSTRAINT unique_customer_primary_rep UNIQUE(customer_id, rep_type)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create customer_visits table
    EXECUTE format('
        CREATE TABLE %I.customer_visits (
            visit_id INTEGER PRIMARY KEY,
            customer_id INTEGER NOT NULL REFERENCES %I.customers(customer_id) ON DELETE CASCADE,
            employee_id INTEGER REFERENCES %I.employees(employee_id),

            visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
            visit_time TIME,
            visit_type VARCHAR(50) NOT NULL,

            -- Visit details
            number_of_visitors INTEGER DEFAULT 1,
            duration_minutes INTEGER,
            total_sales DECIMAL(10,2) DEFAULT 0.00,

            purpose TEXT,
            notes TEXT,
            follow_up_required BOOLEAN DEFAULT false,
            follow_up_date DATE,
            satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),

            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create beer_styles table
    EXECUTE format('
        CREATE TABLE %I.beer_styles (
            style_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,

            style_name VARCHAR(150) NOT NULL,
            style_code VARCHAR(20),
            category VARCHAR(100),
            subcategory VARCHAR(100),

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
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id),

            CONSTRAINT unique_style_name_per_brewery UNIQUE(brewery_id, style_name)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create recipes table
    EXECUTE format('
        CREATE TABLE %I.recipes (
            recipe_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,
            style_id INTEGER REFERENCES %I.beer_styles(style_id),

            recipe_name VARCHAR(200) NOT NULL,
            recipe_code VARCHAR(50),
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
            grain_bill TEXT,
            hop_schedule TEXT,
            yeast_strains TEXT,
            water_profile TEXT,
            special_ingredients TEXT,

            mash_schedule TEXT,
            fermentation_notes TEXT,
            packaging_notes TEXT,
            tasting_notes TEXT,

            recipe_status VARCHAR(50) DEFAULT ''development'',
            efficiency_percentage DECIMAL(5,2) DEFAULT 75.00,
            cost_per_liter DECIMAL(8,2),

            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id),

            CONSTRAINT unique_recipe_name_version UNIQUE(brewery_id, recipe_name, version)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create equipment table
    EXECUTE format('
        CREATE TABLE %I.equipment (
            equipment_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,

            equipment_name VARCHAR(200) NOT NULL,
            equipment_code VARCHAR(50),
            equipment_type VARCHAR(100) NOT NULL,
            category VARCHAR(100),

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
            location VARCHAR(150),
            area VARCHAR(100),

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

            equipment_status VARCHAR(50) DEFAULT ''operational'',
            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create equipment_service table
    EXECUTE format('
        CREATE TABLE %I.equipment_service (
            service_id INTEGER PRIMARY KEY,
            equipment_id INTEGER NOT NULL REFERENCES %I.equipment(equipment_id) ON DELETE CASCADE,
            employee_id INTEGER REFERENCES %I.employees(employee_id),

            service_date DATE NOT NULL DEFAULT CURRENT_DATE,
            service_type VARCHAR(50) NOT NULL,

            -- Service details
            description TEXT NOT NULL,
            work_performed TEXT,
            parts_replaced TEXT,
            hours_worked DECIMAL(5,2),

            -- Costs
            labor_cost DECIMAL(8,2) DEFAULT 0.00,
            parts_cost DECIMAL(8,2) DEFAULT 0.00,
            external_service_cost DECIMAL(8,2) DEFAULT 0.00,

            -- Service provider (if external)
            service_provider VARCHAR(200),
            invoice_number VARCHAR(100),

            -- Follow-up
            next_service_date DATE,
            follow_up_required BOOLEAN DEFAULT false,
            notes TEXT,

            service_status VARCHAR(50) DEFAULT ''completed'',
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create products table
    EXECUTE format('
        CREATE TABLE %I.products (
            product_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,
            recipe_id INTEGER REFERENCES %I.recipes(recipe_id),
            style_id INTEGER REFERENCES %I.beer_styles(style_id),

            product_name VARCHAR(200) NOT NULL,
            product_code VARCHAR(50),

            -- Product specifications
            abv DECIMAL(4,2),
            ibu INTEGER,
            srm DECIMAL(4,1),
            calories_per_12oz INTEGER,

            -- Packaging options
            package_types TEXT[],
            package_sizes TEXT[],

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

            product_status VARCHAR(50) DEFAULT ''active'',
            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id),

            CONSTRAINT unique_product_name_per_brewery UNIQUE(brewery_id, product_name)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create batches table
    EXECUTE format('
        CREATE TABLE %I.batches (
            batch_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,
            recipe_id INTEGER NOT NULL REFERENCES %I.recipes(recipe_id),
            product_id INTEGER REFERENCES %I.products(product_id),
            equipment_id INTEGER REFERENCES %I.equipment(equipment_id),

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
            yeast_pitch_rate DECIMAL(10,2),

            -- Quality and tasting
            quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
            tasting_notes TEXT,
            aroma_notes TEXT,
            flavor_notes TEXT,
            off_flavors TEXT,

            -- Production team
            head_brewer_id INTEGER REFERENCES %I.employees(employee_id),
            assistant_brewer_id INTEGER REFERENCES %I.employees(employee_id),

            -- Costs and financials
            ingredient_cost DECIMAL(10,2) DEFAULT 0.00,
            labor_cost DECIMAL(10,2) DEFAULT 0.00,
            overhead_cost DECIMAL(10,2) DEFAULT 0.00,
            cost_per_liter DECIMAL(8,2),

            -- Status and notes
            batch_status VARCHAR(50) DEFAULT ''planning'',
            production_notes TEXT,
            packaging_notes TEXT,

            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id),

            CONSTRAINT unique_batch_number_per_brewery UNIQUE(brewery_id, batch_number)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create batch_steps table
    EXECUTE format('
        CREATE TABLE %I.batch_steps (
            step_id INTEGER PRIMARY KEY,
            batch_id INTEGER NOT NULL REFERENCES %I.batches(batch_id) ON DELETE CASCADE,
            employee_id INTEGER REFERENCES %I.employees(employee_id),

            step_number INTEGER NOT NULL,
            step_name VARCHAR(150) NOT NULL,
            step_type VARCHAR(50) NOT NULL,

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
            addition_time_minutes INTEGER,

            -- Step details
            description TEXT,
            notes TEXT,
            quality_check_passed BOOLEAN,
            quality_notes TEXT,

            step_status VARCHAR(50) DEFAULT ''pending'',
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create inventory table
    EXECUTE format('
        CREATE TABLE %I.inventory (
            inventory_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES %I.products(product_id),

            item_name VARCHAR(200) NOT NULL,
            item_code VARCHAR(50),
            item_type VARCHAR(50) NOT NULL,
            category VARCHAR(100),
            subcategory VARCHAR(100),

            -- Supplier information
            supplier_name VARCHAR(200),
            supplier_part_number VARCHAR(100),
            preferred_supplier BOOLEAN DEFAULT false,

            -- Inventory levels
            current_stock DECIMAL(12,3) DEFAULT 0,
            reserved_stock DECIMAL(12,3) DEFAULT 0,

            -- Reorder parameters
            minimum_stock DECIMAL(12,3) DEFAULT 0,
            maximum_stock DECIMAL(12,3),
            reorder_quantity DECIMAL(12,3),
            lead_time_days INTEGER DEFAULT 7,

            -- Unit information
            unit_of_measure VARCHAR(20) NOT NULL,
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
            item_status VARCHAR(50) DEFAULT ''active'',
            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create inventory_counts table
    EXECUTE format('
        CREATE TABLE %I.inventory_counts (
            count_id INTEGER PRIMARY KEY,
            inventory_id INTEGER NOT NULL REFERENCES %I.inventory(inventory_id) ON DELETE CASCADE,
            employee_id INTEGER REFERENCES %I.employees(employee_id),

            count_date DATE NOT NULL DEFAULT CURRENT_DATE,
            count_type VARCHAR(50) DEFAULT ''periodic'',

            -- Count details
            system_quantity DECIMAL(12,3),
            counted_quantity DECIMAL(12,3),
            variance_percentage DECIMAL(7,4),

            -- Cost impact
            unit_cost DECIMAL(10,4),

            -- Count details
            count_method VARCHAR(50),
            lot_number VARCHAR(100),
            expiry_date DATE,
            location_verified BOOLEAN DEFAULT true,

            -- Variance explanation
            variance_reason VARCHAR(100),
            variance_explanation TEXT,
            adjustment_approved BOOLEAN DEFAULT false,
            approved_by INTEGER REFERENCES %I.employees(employee_id),

            notes TEXT,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create orders table
    EXECUTE format('
        CREATE TABLE %I.orders (
            order_id INTEGER PRIMARY KEY,
            brewery_id INTEGER NOT NULL REFERENCES %I.breweries(brewery_id) ON DELETE CASCADE,
            customer_id INTEGER NOT NULL REFERENCES %I.customers(customer_id),
            employee_id INTEGER REFERENCES %I.employees(employee_id),

            order_number VARCHAR(100) NOT NULL,
            po_number VARCHAR(100),

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
            ship_to_country VARCHAR(50) DEFAULT ''US'',
            ship_to_phone VARCHAR(50),

            -- Billing information
            bill_to_company VARCHAR(255),
            bill_to_contact VARCHAR(200),
            bill_to_address_line1 VARCHAR(255),
            bill_to_address_line2 VARCHAR(255),
            bill_to_city VARCHAR(100),
            bill_to_state VARCHAR(50),
            bill_to_postal_code VARCHAR(20),
            bill_to_country VARCHAR(50) DEFAULT ''US'',

            -- Order totals
            subtotal DECIMAL(10,2) DEFAULT 0.00,
            tax_amount DECIMAL(10,2) DEFAULT 0.00,
            shipping_amount DECIMAL(10,2) DEFAULT 0.00,
            discount_amount DECIMAL(10,2) DEFAULT 0.00,
            total_amount DECIMAL(10,2) DEFAULT 0.00,

            -- Payment and terms
            payment_terms INTEGER DEFAULT 30,
            payment_method VARCHAR(50),
            payment_status VARCHAR(50) DEFAULT ''pending'',

            -- Shipping
            shipping_method VARCHAR(50),
            tracking_number VARCHAR(100),
            freight_carrier VARCHAR(100),
            freight_cost DECIMAL(8,2),

            -- Status and notes
            order_status VARCHAR(50) DEFAULT ''draft'',
            priority VARCHAR(50) DEFAULT ''normal'',
            special_instructions TEXT,
            internal_notes TEXT,

            is_active BOOLEAN DEFAULT true,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id),

            CONSTRAINT unique_order_number_per_brewery UNIQUE(brewery_id, order_number)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create order_line_items table
    EXECUTE format('
        CREATE TABLE %I.order_line_items (
            line_item_id INTEGER PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES %I.orders(order_id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES %I.products(product_id),
            batch_id INTEGER REFERENCES %I.batches(batch_id),

            line_number INTEGER NOT NULL,

            -- Product details
            product_name VARCHAR(200),
            product_code VARCHAR(50),
            package_type VARCHAR(50),
            package_size VARCHAR(50),

            -- Quantities
            ordered_quantity DECIMAL(10,2) NOT NULL,
            shipped_quantity DECIMAL(10,2) DEFAULT 0.00,
            backordered_quantity DECIMAL(10,2) DEFAULT 0.00,
            cancelled_quantity DECIMAL(10,2) DEFAULT 0.00,

            -- Pricing
            unit_price DECIMAL(8,2) NOT NULL,
            discount_percentage DECIMAL(5,2) DEFAULT 0.00,
            discount_amount DECIMAL(8,2) DEFAULT 0.00,

            -- Delivery
            requested_delivery_date DATE,
            promised_delivery_date DATE,
            actual_delivery_date DATE,

            -- Status and notes
            line_status VARCHAR(50) DEFAULT ''pending'',
            special_instructions TEXT,
            notes TEXT,

            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES %I.employees(employee_id),
            modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_by INTEGER REFERENCES %I.employees(employee_id)
        )', v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name, v_schema_name);

    -- Create all zero-based sequences
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'breweries', 'brewery_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'employees', 'employee_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'customers', 'customer_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'customer_reps', 'customer_rep_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'customer_visits', 'visit_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'beer_styles', 'style_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'recipes', 'recipe_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'equipment', 'equipment_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'equipment_service', 'service_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'products', 'product_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'batches', 'batch_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'batch_steps', 'step_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'inventory', 'inventory_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'inventory_counts', 'count_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'orders', 'order_id');
    PERFORM public.create_tenant_zero_based_sequence(v_schema_name, 'order_line_items', 'line_item_id');

    -- Create indexes for performance
    EXECUTE format('CREATE INDEX idx_%s_breweries_tenant ON %I.breweries(tenant_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_employees_brewery ON %I.employees(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_customers_brewery ON %I.customers(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_customer_reps_customer ON %I.customer_reps(customer_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_customer_reps_employee ON %I.customer_reps(employee_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_customer_visits_customer ON %I.customer_visits(customer_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_customer_visits_date ON %I.customer_visits(visit_date)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_beer_styles_brewery ON %I.beer_styles(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_recipes_brewery ON %I.recipes(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_recipes_style ON %I.recipes(style_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_equipment_brewery ON %I.equipment(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_equipment_service_equipment ON %I.equipment_service(equipment_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_equipment_service_date ON %I.equipment_service(service_date)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_products_brewery ON %I.products(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_products_recipe ON %I.products(recipe_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_batches_brewery ON %I.batches(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_batches_recipe ON %I.batches(recipe_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_batches_status ON %I.batches(batch_status)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_batch_steps_batch ON %I.batch_steps(batch_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_inventory_brewery ON %I.inventory(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_inventory_type ON %I.inventory(item_type, category)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_inventory_counts_inventory ON %I.inventory_counts(inventory_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_inventory_counts_date ON %I.inventory_counts(count_date)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_orders_brewery ON %I.orders(brewery_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_orders_customer ON %I.orders(customer_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_orders_date ON %I.orders(order_date)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_orders_status ON %I.orders(order_status)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_order_line_items_order ON %I.order_line_items(order_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_order_line_items_product ON %I.order_line_items(product_id)', REPLACE(v_schema_name, '.', '_'), v_schema_name);

    -- Create audit trigger function for this schema
    EXECUTE format('
        CREATE OR REPLACE FUNCTION %I.update_modified_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.modified = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $trigger$ language ''plpgsql''', v_schema_name);

    -- Add update triggers to all tables with modified column
    EXECUTE format('CREATE TRIGGER update_breweries_modified BEFORE UPDATE ON %I.breweries FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_employees_modified BEFORE UPDATE ON %I.employees FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_customers_modified BEFORE UPDATE ON %I.customers FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_customer_reps_modified BEFORE UPDATE ON %I.customer_reps FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_customer_visits_modified BEFORE UPDATE ON %I.customer_visits FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_beer_styles_modified BEFORE UPDATE ON %I.beer_styles FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_recipes_modified BEFORE UPDATE ON %I.recipes FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_equipment_modified BEFORE UPDATE ON %I.equipment FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_equipment_service_modified BEFORE UPDATE ON %I.equipment_service FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_products_modified BEFORE UPDATE ON %I.products FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_batches_modified BEFORE UPDATE ON %I.batches FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_batch_steps_modified BEFORE UPDATE ON %I.batch_steps FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_inventory_modified BEFORE UPDATE ON %I.inventory FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_inventory_counts_modified BEFORE UPDATE ON %I.inventory_counts FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_orders_modified BEFORE UPDATE ON %I.orders FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);
    EXECUTE format('CREATE TRIGGER update_order_line_items_modified BEFORE UPDATE ON %I.order_line_items FOR EACH ROW EXECUTE FUNCTION %I.update_modified_column()', v_schema_name, v_schema_name);

    -- Enable RLS (policies will be added later)
    EXECUTE format('ALTER TABLE %I.breweries ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.employees ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.customers ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.customer_reps ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.customer_visits ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.beer_styles ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.recipes ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.equipment ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.equipment_service ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.products ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.batches ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.batch_steps ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.inventory ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.inventory_counts ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.orders ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.order_line_items ENABLE ROW LEVEL SECURITY', v_schema_name);

    -- Grant table permissions to application user
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO fermentum_app', v_schema_name);
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO fermentum_app', v_schema_name);

    -- Log the schema creation
    INSERT INTO public.audit_logs (
        tenant_id, user_id, action, resource_type, resource_id,
        new_values, created_at
    ) VALUES (
        p_tenant_id, p_created_by, 'schema.created', 'tenant_schema', v_schema_name,
        json_build_object('schema_name', v_schema_name, 'tenant_id', p_tenant_id, 'table_count', 16),
        NOW()
    );

    RETURN v_schema_name;
END;
$$ LANGUAGE plpgsql;

-- Update health check function to include new tables
CREATE OR REPLACE FUNCTION public.check_tenant_schema_health(p_tenant_id UUID)
RETURNS TABLE (
    check_name VARCHAR(100),
    status VARCHAR(20),
    message TEXT
) AS $$
DECLARE
    v_schema_name VARCHAR(63);
    v_table_count INTEGER;
    v_expected_tables TEXT[] := ARRAY[
        'breweries', 'employees', 'customers', 'customer_reps', 'customer_visits',
        'beer_styles', 'recipes', 'equipment', 'equipment_service', 'products',
        'batches', 'batch_steps', 'inventory', 'inventory_counts', 'orders', 'order_line_items'
    ];
    v_table TEXT;
    v_table_exists BOOLEAN;
BEGIN
    -- Get schema name
    SELECT t.schema_name INTO v_schema_name
    FROM public.tenants t
    WHERE t.id = p_tenant_id AND t.is_active = true;

    IF v_schema_name IS NULL THEN
        RETURN QUERY SELECT 'tenant_exists'::VARCHAR(100), 'FAIL'::VARCHAR(20),
                           'Tenant not found or inactive'::TEXT;
        RETURN;
    END IF;

    -- Check if schema exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.schemata
        WHERE schema_name = v_schema_name
    ) THEN
        RETURN QUERY SELECT 'schema_exists'::VARCHAR(100), 'FAIL'::VARCHAR(20),
                           format('Schema %s does not exist', v_schema_name)::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT 'schema_exists'::VARCHAR(100), 'PASS'::VARCHAR(20),
                       format('Schema %s exists', v_schema_name)::TEXT;

    -- Check expected tables
    FOREACH v_table IN ARRAY v_expected_tables LOOP
        SELECT EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = v_schema_name AND table_name = v_table
        ) INTO v_table_exists;

        IF v_table_exists THEN
            RETURN QUERY SELECT
                format('table_%s', v_table)::VARCHAR(100),
                'PASS'::VARCHAR(20),
                format('Table %s.%s exists', v_schema_name, v_table)::TEXT;
        ELSE
            RETURN QUERY SELECT
                format('table_%s', v_table)::VARCHAR(100),
                'FAIL'::VARCHAR(20),
                format('Table %s.%s is missing', v_schema_name, v_table)::TEXT;
        END IF;
    END LOOP;

    -- Check total table count
    SELECT COUNT(*)::INTEGER INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = v_schema_name;

    RETURN QUERY SELECT 'table_count'::VARCHAR(100), 'INFO'::VARCHAR(20),
                       format('Schema contains %s tables (expected %s)', v_table_count, array_length(v_expected_tables, 1))::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Keep helper function for future use
-- DROP FUNCTION public.create_tenant_zero_based_sequence(TEXT, TEXT, TEXT);

-- Update function comments
COMMENT ON FUNCTION public.create_tenant_schema(UUID, UUID) IS
'Creates a comprehensive tenant schema with 16 brewery management tables using integer PKs and standardized audit fields';

COMMENT ON FUNCTION public.check_tenant_schema_health(UUID) IS
'Performs health check on a tenant schema to verify all 16 expected tables exist';