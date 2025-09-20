-- ============================================================================
-- Tenant Management Functions
-- Functions for creating, managing, and maintaining tenant schemas
-- ============================================================================

-- ============================================================================
-- CREATE TENANT SCHEMA: Creates a new tenant schema with all tables
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_schema(
    p_tenant_id UUID,
    p_created_by UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_schema_name VARCHAR(63);
    v_schema_clean VARCHAR(63);
    v_template_sql TEXT;
    v_sql TEXT;
BEGIN
    -- Generate schema name
    v_schema_name := public.generate_schema_name(p_tenant_id);
    v_schema_clean := REPLACE(v_schema_name, '.', '_');

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

    -- Read the template SQL and replace placeholders
    -- Note: In production, this would read from a file or template table
    -- For now, we'll inline the essential table creation

    -- Create breweries table
    EXECUTE format('
        CREATE TABLE %I.breweries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(100) NOT NULL,
            description TEXT,
            address_line1 VARCHAR(255),
            address_line2 VARCHAR(255),
            city VARCHAR(100),
            state_province VARCHAR(100),
            postal_code VARCHAR(20),
            country VARCHAR(2) DEFAULT ''US'',
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            phone VARCHAR(20),
            email VARCHAR(255),
            website VARCHAR(255),
            license_number VARCHAR(100),
            license_type VARCHAR(50),
            capacity_barrels INTEGER,
            timezone VARCHAR(50) DEFAULT ''UTC'',
            default_currency VARCHAR(3) DEFAULT ''USD'',
            status VARCHAR(50) NOT NULL DEFAULT ''active'',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            UNIQUE(tenant_id, slug)
        )', v_schema_name);

    -- Create beer_styles table
    EXECUTE format('
        CREATE TABLE %I.beer_styles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            subcategory VARCHAR(100),
            bjcp_code VARCHAR(10),
            bjcp_year INTEGER,
            description TEXT,
            aroma TEXT,
            appearance TEXT,
            flavor TEXT,
            mouthfeel TEXT,
            og_min DECIMAL(4,3),
            og_max DECIMAL(4,3),
            fg_min DECIMAL(4,3),
            fg_max DECIMAL(4,3),
            abv_min DECIMAL(4,2),
            abv_max DECIMAL(4,2),
            ibu_min INTEGER,
            ibu_max INTEGER,
            srm_min DECIMAL(4,1),
            srm_max DECIMAL(4,1),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            UNIQUE(tenant_id, name)
        )', v_schema_name);

    -- Create recipes table
    EXECUTE format('
        CREATE TABLE %I.recipes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            brewery_id UUID NOT NULL REFERENCES %I.breweries(id),
            beer_style_id UUID REFERENCES %I.beer_styles(id),
            name VARCHAR(255) NOT NULL,
            version VARCHAR(20) DEFAULT ''1.0'',
            description TEXT,
            batch_size_liters DECIMAL(8,2) NOT NULL,
            boil_time_minutes INTEGER DEFAULT 60,
            efficiency_percent DECIMAL(5,2) DEFAULT 75.0,
            target_og DECIMAL(4,3),
            target_fg DECIMAL(4,3),
            target_abv DECIMAL(4,2),
            target_ibu INTEGER,
            target_srm DECIMAL(4,1),
            ingredients JSONB DEFAULT ''{}''::jsonb,
            mash_profile JSONB DEFAULT ''{}''::jsonb,
            hop_schedule JSONB DEFAULT ''{}''::jsonb,
            fermentation_profile JSONB DEFAULT ''{}''::jsonb,
            brewing_notes TEXT,
            tasting_notes TEXT,
            recipe_notes TEXT,
            status VARCHAR(50) NOT NULL DEFAULT ''draft'',
            is_public BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            UNIQUE(tenant_id, brewery_id, name, version)
        )', v_schema_name, v_schema_name, v_schema_name);

    -- Create batches table
    EXECUTE format('
        CREATE TABLE %I.batches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            brewery_id UUID NOT NULL REFERENCES %I.breweries(id),
            recipe_id UUID NOT NULL REFERENCES %I.recipes(id),
            batch_number VARCHAR(100) NOT NULL,
            internal_code VARCHAR(50),
            planned_volume_liters DECIMAL(8,2) NOT NULL,
            actual_volume_liters DECIMAL(8,2),
            brew_date DATE NOT NULL,
            planned_package_date DATE,
            actual_package_date DATE,
            planned_release_date DATE,
            original_gravity DECIMAL(4,3),
            final_gravity DECIMAL(4,3),
            actual_abv DECIMAL(4,2),
            actual_ibu INTEGER,
            actual_srm DECIMAL(4,1),
            ph_mash DECIMAL(3,2),
            ph_finished DECIMAL(3,2),
            status VARCHAR(50) NOT NULL DEFAULT ''planned'',
            current_location VARCHAR(255),
            quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
            quality_notes TEXT,
            brew_log JSONB DEFAULT ''{}''::jsonb,
            fermentation_log JSONB DEFAULT ''{}''::jsonb,
            packaging_log JSONB DEFAULT ''{}''::jsonb,
            production_notes TEXT,
            tasting_notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            UNIQUE(tenant_id, brewery_id, batch_number)
        )', v_schema_name, v_schema_name, v_schema_name);

    -- Create indexes
    EXECUTE format('CREATE INDEX idx_%s_breweries_tenant ON %I.breweries(tenant_id)',
                   REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_beer_styles_tenant ON %I.beer_styles(tenant_id)',
                   REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_recipes_tenant ON %I.recipes(tenant_id)',
                   REPLACE(v_schema_name, '.', '_'), v_schema_name);
    EXECUTE format('CREATE INDEX idx_%s_batches_tenant ON %I.batches(tenant_id)',
                   REPLACE(v_schema_name, '.', '_'), v_schema_name);

    -- Create update triggers
    EXECUTE format('
        CREATE TRIGGER trigger_%s_breweries_updated_at
            BEFORE UPDATE ON %I.breweries
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at()',
            REPLACE(v_schema_name, '.', '_'), v_schema_name);

    EXECUTE format('
        CREATE TRIGGER trigger_%s_beer_styles_updated_at
            BEFORE UPDATE ON %I.beer_styles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at()',
            REPLACE(v_schema_name, '.', '_'), v_schema_name);

    EXECUTE format('
        CREATE TRIGGER trigger_%s_recipes_updated_at
            BEFORE UPDATE ON %I.recipes
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at()',
            REPLACE(v_schema_name, '.', '_'), v_schema_name);

    EXECUTE format('
        CREATE TRIGGER trigger_%s_batches_updated_at
            BEFORE UPDATE ON %I.batches
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at()',
            REPLACE(v_schema_name, '.', '_'), v_schema_name);

    -- Enable RLS (policies will be added later)
    EXECUTE format('ALTER TABLE %I.breweries ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.beer_styles ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.recipes ENABLE ROW LEVEL SECURITY', v_schema_name);
    EXECUTE format('ALTER TABLE %I.batches ENABLE ROW LEVEL SECURITY', v_schema_name);

    -- Grant table permissions to application user
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO fermentum_app', v_schema_name);
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO fermentum_app', v_schema_name);

    -- Log the schema creation
    INSERT INTO public.audit_logs (
        tenant_id, user_id, action, resource_type, resource_id,
        new_values, created_at
    ) VALUES (
        p_tenant_id, p_created_by, 'schema.created', 'tenant_schema', v_schema_name,
        json_build_object('schema_name', v_schema_name, 'tenant_id', p_tenant_id),
        NOW()
    );

    RETURN v_schema_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DROP TENANT SCHEMA: Safely removes a tenant schema
-- ============================================================================

CREATE OR REPLACE FUNCTION public.drop_tenant_schema(
    p_tenant_id UUID,
    p_dropped_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_schema_name VARCHAR(63);
    v_tenant_exists BOOLEAN;
BEGIN
    -- Generate schema name
    v_schema_name := public.generate_schema_name(p_tenant_id);

    -- Verify tenant exists and get confirmation
    SELECT EXISTS(SELECT 1 FROM public.tenants WHERE id = p_tenant_id AND is_active = true)
    INTO v_tenant_exists;

    IF NOT v_tenant_exists THEN
        RAISE EXCEPTION 'Tenant % does not exist or is not active', p_tenant_id;
    END IF;

    -- Check if schema exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.schemata
        WHERE schema_name = v_schema_name
    ) THEN
        RAISE WARNING 'Schema % does not exist', v_schema_name;
        RETURN false;
    END IF;

    -- Log the schema deletion before dropping
    INSERT INTO public.audit_logs (
        tenant_id, user_id, action, resource_type, resource_id,
        old_values, created_at
    ) VALUES (
        p_tenant_id, p_dropped_by, 'schema.dropped', 'tenant_schema', v_schema_name,
        json_build_object('schema_name', v_schema_name, 'tenant_id', p_tenant_id),
        NOW()
    );

    -- Drop the schema and all objects within it
    EXECUTE format('DROP SCHEMA %I CASCADE', v_schema_name);

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- LIST TENANT SCHEMAS: Get all tenant schemas and their status
-- ============================================================================

CREATE OR REPLACE FUNCTION public.list_tenant_schemas()
RETURNS TABLE (
    tenant_id UUID,
    tenant_name VARCHAR(255),
    schema_name VARCHAR(63),
    schema_exists BOOLEAN,
    table_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as tenant_id,
        t.name as tenant_name,
        t.schema_name,
        CASE
            WHEN s.schema_name IS NOT NULL THEN true
            ELSE false
        END as schema_exists,
        COALESCE(
            (SELECT COUNT(*)::INTEGER
             FROM information_schema.tables
             WHERE table_schema = t.schema_name),
            0
        ) as table_count,
        t.created_at
    FROM public.tenants t
    LEFT JOIN information_schema.schemata s ON s.schema_name = t.schema_name
    WHERE t.is_active = true
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TENANT SCHEMA HEALTH CHECK: Verify schema integrity
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_tenant_schema_health(p_tenant_id UUID)
RETURNS TABLE (
    check_name VARCHAR(100),
    status VARCHAR(20),
    message TEXT
) AS $$
DECLARE
    v_schema_name VARCHAR(63);
    v_table_count INTEGER;
    v_expected_tables TEXT[] := ARRAY['breweries', 'beer_styles', 'recipes', 'batches'];
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
                       format('Schema contains %s tables', v_table_count)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS: Function documentation
-- ============================================================================

COMMENT ON FUNCTION public.create_tenant_schema(UUID, UUID) IS
'Creates a new tenant schema with all required tables, indexes, and permissions';

COMMENT ON FUNCTION public.drop_tenant_schema(UUID, UUID) IS
'Safely removes a tenant schema and all its data (use with extreme caution)';

COMMENT ON FUNCTION public.list_tenant_schemas() IS
'Returns a list of all tenants and their schema status';

COMMENT ON FUNCTION public.check_tenant_schema_health(UUID) IS
'Performs health check on a tenant schema to verify integrity';