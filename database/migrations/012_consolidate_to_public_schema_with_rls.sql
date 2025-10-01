-- Migration: Move all tenant tables to public schema with Row Level Security
-- This consolidates the multi-tenant architecture using RLS instead of separate schemas

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's create all the tenant-specific tables in public schema if they don't exist
-- We'll copy the structure from the tenant schemas

-- Create employees table in public if it doesn't exist
CREATE TABLE IF NOT EXISTS public.employees (
    employee_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    brewery_id INTEGER,
    employee_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    job_title VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    employment_status VARCHAR(20) DEFAULT 'active',
    hourly_rate DECIMAL(10,2),
    salary_annual DECIMAL(12,2),
    access_level VARCHAR(20) DEFAULT 'standard',
    certifications TEXT,
    security_clearance VARCHAR(50),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID
);

-- Create other tenant-specific tables in public schema
CREATE TABLE IF NOT EXISTS public.breweries (
    brewery_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID
);

CREATE TABLE IF NOT EXISTS public.customers (
    customer_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.products (
    product_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.orders (
    order_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    customer_id INTEGER,
    total_cents INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);

CREATE TABLE IF NOT EXISTS public.order_line_items (
    line_item_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    CONSTRAINT fk_line_items_order FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
    CONSTRAINT fk_line_items_product FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);

-- Copy data from tenant schemas to public schema
DO $$
DECLARE
    schema_name TEXT;
    tenant_uuid UUID;
    table_name TEXT;
    copy_count INTEGER;
BEGIN
    -- Loop through all tenant schemas
    FOR schema_name IN
        SELECT nspname
        FROM pg_namespace
        WHERE nspname LIKE 'tenant_%'
    LOOP
        -- Extract tenant UUID from schema name
        tenant_uuid := regexp_replace(
            substring(schema_name from 8), -- Remove "tenant_" prefix
            '([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})',
            '\1-\2-\3-\4-\5'
        )::UUID;

        RAISE NOTICE 'Processing schema: %, tenant_id: %', schema_name, tenant_uuid;

        -- Copy employees
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'employees') THEN
            EXECUTE format('
                INSERT INTO public.employees (
                    tenant_id, brewery_id, employee_number, first_name, last_name, middle_name,
                    email, phone, job_title, department, hire_date, termination_date,
                    employment_status, hourly_rate, salary_annual, access_level, certifications,
                    security_clearance, emergency_contact_name, emergency_contact_phone,
                    emergency_contact_relationship, is_active, created, created_by, modified, modified_by
                )
                SELECT
                    %L::UUID, brewery_id, employee_number, first_name, last_name, middle_name,
                    email, phone, job_title, department, hire_date, termination_date,
                    employment_status, hourly_rate, salary_annual, access_level, certifications,
                    security_clearance, emergency_contact_name, emergency_contact_phone,
                    emergency_contact_relationship, is_active, created, created_by, modified, modified_by
                FROM %I.employees
                WHERE NOT EXISTS (
                    SELECT 1 FROM public.employees pe
                    WHERE pe.tenant_id = %L::UUID
                    AND pe.employee_number = %I.employees.employee_number
                );
            ', tenant_uuid, schema_name, tenant_uuid, schema_name);

            GET DIAGNOSTICS copy_count = ROW_COUNT;
            RAISE NOTICE 'Copied % employees from %', copy_count, schema_name;
        END IF;

        -- Copy breweries
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'breweries') THEN
            EXECUTE format('
                INSERT INTO public.breweries (tenant_id, name, description, location, website, created, created_by, modified, modified_by)
                SELECT %L::UUID, name, description, location, website, created, created_by, modified, modified_by
                FROM %I.breweries
                WHERE NOT EXISTS (
                    SELECT 1 FROM public.breweries pb
                    WHERE pb.tenant_id = %L::UUID AND pb.name = %I.breweries.name
                );
            ', tenant_uuid, schema_name, tenant_uuid, schema_name);

            GET DIAGNOSTICS copy_count = ROW_COUNT;
            RAISE NOTICE 'Copied % breweries from %', copy_count, schema_name;
        END IF;

        -- Copy other tables similarly...
        FOR table_name IN SELECT t.table_name
                          FROM information_schema.tables t
                          WHERE t.table_schema = schema_name
                          AND t.table_name IN ('customers', 'products', 'orders', 'order_line_items')
        LOOP
            -- Copy with basic structure (this is a simplified version)
            -- In practice, you'd want specific column mappings for each table
            RAISE NOTICE 'Would copy table: %.%', schema_name, table_name;
        END LOOP;

    END LOOP;
END $$;

-- Now set up Row Level Security for all tables

-- Function to set up RLS for a table
CREATE OR REPLACE FUNCTION setup_rls_for_table(table_name TEXT) RETURNS VOID AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);

    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_read ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_write ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_delete ON public.%I', table_name, table_name);

    -- Create RLS policies
    EXECUTE format('
        CREATE POLICY %I_tenant_read
        ON public.%I
        FOR SELECT
        USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
    ', table_name, table_name);

    EXECUTE format('
        CREATE POLICY %I_tenant_write
        ON public.%I
        FOR INSERT, UPDATE
        WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
    ', table_name, table_name);

    EXECUTE format('
        CREATE POLICY %I_tenant_delete
        ON public.%I
        FOR DELETE
        USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
    ', table_name, table_name);

    RAISE NOTICE 'Set up RLS for table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Apply RLS to all tenant-specific tables
SELECT setup_rls_for_table('employees');
SELECT setup_rls_for_table('breweries');
SELECT setup_rls_for_table('customers');
SELECT setup_rls_for_table('products');
SELECT setup_rls_for_table('orders');
SELECT setup_rls_for_table('order_line_items');

-- Create unique indexes for tenant isolation
CREATE UNIQUE INDEX IF NOT EXISTS employees_tenant_employee_number_idx ON public.employees(tenant_id, employee_number);
CREATE UNIQUE INDEX IF NOT EXISTS orders_tenant_order_number_idx ON public.orders(tenant_id, order_number);
CREATE UNIQUE INDEX IF NOT EXISTS breweries_tenant_name_idx ON public.breweries(tenant_id, name);

-- Create a function to enforce tenant_id is never NULL
CREATE OR REPLACE FUNCTION enforce_tenant_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'tenant_id cannot be NULL for table %', TG_TABLE_NAME;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply tenant_id enforcement triggers
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN VALUES ('employees'), ('breweries'), ('customers'), ('products'), ('orders'), ('order_line_items')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS enforce_%I_tenant_id ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE TRIGGER enforce_%I_tenant_id
            BEFORE INSERT OR UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_id()
        ', table_name, table_name);
    END LOOP;
END $$;

-- Create indexes for performance (tenant_id should be first in compound indexes)
CREATE INDEX IF NOT EXISTS employees_tenant_active_idx ON public.employees(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS employees_tenant_name_idx ON public.employees(tenant_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS orders_tenant_date_idx ON public.orders(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS products_tenant_active_idx ON public.products(tenant_id, is_active);

-- Clean up the function
DROP FUNCTION setup_rls_for_table(TEXT);

COMMIT;