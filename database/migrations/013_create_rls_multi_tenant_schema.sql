-- Migration: Create clean RLS-based multi-tenant schema
-- This creates all tenant-specific tables in public schema with Row Level Security

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Breweries table in public schema with RLS
CREATE TABLE public.breweries (
    brewery_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    CONSTRAINT breweries_tenant_id_not_null CHECK (tenant_id IS NOT NULL)
);

-- Create Employees table in public schema with RLS
CREATE TABLE public.employees (
    employee_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    brewery_id INTEGER,
    user_id UUID,
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
    modified_by UUID,
    CONSTRAINT employees_tenant_id_not_null CHECK (tenant_id IS NOT NULL),
    CONSTRAINT fk_employees_brewery FOREIGN KEY (brewery_id) REFERENCES public.breweries(brewery_id),
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Note: Starting with just breweries and employees for initial RLS implementation
-- Additional tables (customers, products, orders, etc.) can be added later

-- Function to set up RLS for a table
CREATE OR REPLACE FUNCTION setup_rls_for_table(table_name TEXT) RETURNS VOID AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);

    -- Drop existing policies if they exist
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_read ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_insert ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_update ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_delete ON public.%I', table_name, table_name);

    -- Create RLS policies
    EXECUTE format('
        CREATE POLICY %I_tenant_read
        ON public.%I
        FOR SELECT
        USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
    ', table_name, table_name);

    EXECUTE format('
        CREATE POLICY %I_tenant_insert
        ON public.%I
        FOR INSERT
        WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
    ', table_name, table_name);

    EXECUTE format('
        CREATE POLICY %I_tenant_update
        ON public.%I
        FOR UPDATE
        USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
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

-- Apply RLS to tenant-specific tables (starting with core tables)
SELECT setup_rls_for_table('breweries');
SELECT setup_rls_for_table('employees');

-- Create unique indexes for tenant isolation
CREATE UNIQUE INDEX employees_tenant_employee_number_idx ON public.employees(tenant_id, employee_number);
CREATE UNIQUE INDEX breweries_tenant_name_idx ON public.breweries(tenant_id, name);

-- Create indexes for performance (tenant_id should be first in compound indexes)
CREATE INDEX employees_tenant_active_idx ON public.employees(tenant_id, is_active);
CREATE INDEX employees_tenant_name_idx ON public.employees(tenant_id, last_name, first_name);
CREATE INDEX breweries_tenant_idx ON public.breweries(tenant_id);

-- Create function to enforce tenant_id is never NULL
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
    FOR table_name IN VALUES ('breweries'), ('employees')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS enforce_%I_tenant_id ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE TRIGGER enforce_%I_tenant_id
            BEFORE INSERT OR UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_id()
        ', table_name, table_name);
    END LOOP;
END $$;

-- Clean up the function
DROP FUNCTION setup_rls_for_table(TEXT);

-- Verify RLS is enabled on all tables
SELECT
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('breweries', 'employees')
ORDER BY tablename;

-- List all policies
SELECT
    tablename,
    policyname,
    cmd,
    CASE
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        ELSE cmd::text
    END as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('breweries', 'employees')
ORDER BY tablename, cmd;

COMMIT;