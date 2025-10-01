-- Migration: Implement Row Level Security for Multi-Tenancy
-- This replaces the schema-based approach with PostgreSQL RLS

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add tenant_id column to employees table in all tenant schemas
-- Note: We'll handle this schema by schema since we have existing tenant schemas

DO $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR schema_name IN
        SELECT nspname
        FROM pg_namespace
        WHERE nspname LIKE 'tenant_%'
    LOOP
        -- Add tenant_id column if it doesn't exist
        EXECUTE format('
            ALTER TABLE %I.employees
            ADD COLUMN IF NOT EXISTS tenant_id UUID;
        ', schema_name);

        -- Update existing rows with the tenant_id extracted from schema name
        -- tenant_39aa728d5ea147b7aa3129bcb9f01ed2 -> 39aa728d-5ea1-47b7-aa31-29bcb9f01ed2
        EXECUTE format('
            UPDATE %I.employees
            SET tenant_id = %L::UUID
            WHERE tenant_id IS NULL;
        ', schema_name,
           regexp_replace(
               substring(schema_name from 8), -- Remove "tenant_" prefix
               '([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})',
               '\1-\2-\3-\4-\5'
           )
        );

        -- Make tenant_id NOT NULL
        EXECUTE format('
            ALTER TABLE %I.employees
            ALTER COLUMN tenant_id SET NOT NULL;
        ', schema_name);

        -- Create unique index on tenant_id + employee_number if employee_number exists
        EXECUTE format('
            CREATE UNIQUE INDEX IF NOT EXISTS employees_tenant_employee_number_idx
            ON %I.employees(tenant_id, employee_number);
        ', schema_name);

        -- Enable Row Level Security
        EXECUTE format('
            ALTER TABLE %I.employees ENABLE ROW LEVEL SECURITY;
        ', schema_name);

        -- Force RLS (even for table owners)
        EXECUTE format('
            ALTER TABLE %I.employees FORCE ROW LEVEL SECURITY;
        ', schema_name);

        -- Drop existing policies if they exist
        EXECUTE format('
            DROP POLICY IF EXISTS employees_tenant_read ON %I.employees;
        ', schema_name);

        EXECUTE format('
            DROP POLICY IF EXISTS employees_tenant_write ON %I.employees;
        ', schema_name);

        EXECUTE format('
            DROP POLICY IF EXISTS employees_tenant_delete ON %I.employees;
        ', schema_name);

        -- Create RLS policies
        -- Read policy
        EXECUTE format('
            CREATE POLICY employees_tenant_read
            ON %I.employees
            FOR SELECT
            USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid);
        ', schema_name);

        -- Write policy (INSERT/UPDATE)
        EXECUTE format('
            CREATE POLICY employees_tenant_write
            ON %I.employees
            FOR INSERT, UPDATE
            WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid);
        ', schema_name);

        -- Delete policy
        EXECUTE format('
            CREATE POLICY employees_tenant_delete
            ON %I.employees
            FOR DELETE
            USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid);
        ', schema_name);

        RAISE NOTICE 'Configured RLS for schema: %', schema_name;
    END LOOP;
END $$;

-- Also set up RLS for any future tables that might be created in public schema
-- Add tenant_id to employees table in public schema if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
        -- Add tenant_id column if it doesn't exist
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS tenant_id UUID;

        -- Enable RLS
        ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;

        -- Create policies
        DROP POLICY IF EXISTS employees_tenant_read ON public.employees;
        DROP POLICY IF EXISTS employees_tenant_write ON public.employees;
        DROP POLICY IF EXISTS employees_tenant_delete ON public.employees;

        CREATE POLICY employees_tenant_read
        ON public.employees
        FOR SELECT
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

        CREATE POLICY employees_tenant_write
        ON public.employees
        FOR INSERT, UPDATE
        WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

        CREATE POLICY employees_tenant_delete
        ON public.employees
        FOR DELETE
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

        RAISE NOTICE 'Configured RLS for public.employees';
    END IF;
END $$;

-- Create a function to enforce tenant_id is never NULL (optional guard)
CREATE OR REPLACE FUNCTION enforce_tenant_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'tenant_id cannot be NULL';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tenant schemas
DO $$
DECLARE
    schema_name TEXT;
BEGIN
    FOR schema_name IN
        SELECT nspname
        FROM pg_namespace
        WHERE nspname LIKE 'tenant_%'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS enforce_employees_tenant_id ON %I.employees;
        ', schema_name);

        EXECUTE format('
            CREATE TRIGGER enforce_employees_tenant_id
            BEFORE INSERT OR UPDATE ON %I.employees
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_id();
        ', schema_name);
    END LOOP;
END $$;

COMMIT;