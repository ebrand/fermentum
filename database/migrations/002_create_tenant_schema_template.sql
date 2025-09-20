-- ============================================================================
-- Tenant Schema Template
-- Template for creating individual tenant schemas with brewery-specific tables
--
-- This script defines the standard schema structure that gets created for each
-- new tenant. It includes core brewery management tables with proper indexing,
-- constraints, and RLS policies.
-- ============================================================================

-- This is a template - actual tenant schemas are created by the schema creation function
-- Schema name will be dynamically generated: tenant_[uuid_without_hyphens]

-- ============================================================================
-- BREWERIES: Individual brewery locations within a tenant
-- ============================================================================

CREATE TABLE {schema_name}.breweries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Reference to public.tenants(id)

    -- Basic information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- URL-safe identifier
    description TEXT,

    -- Location
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US', -- ISO country code
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Business details
    license_number VARCHAR(100),
    license_type VARCHAR(50), -- microbrewery, brewpub, regional, etc.
    capacity_barrels INTEGER, -- Annual production capacity

    -- Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    default_currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, planning

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,

    UNIQUE(tenant_id, slug)
);

-- ============================================================================
-- BEER_STYLES: Beer style definitions (BJCP or custom)
-- ============================================================================

CREATE TABLE {schema_name}.beer_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Style identification
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- IPA, Stout, Lager, etc.
    subcategory VARCHAR(100),

    -- BJCP classification (if applicable)
    bjcp_code VARCHAR(10), -- "21A", "19B", etc.
    bjcp_year INTEGER, -- 2021, 2015, etc.

    -- Style guidelines
    description TEXT,
    aroma TEXT,
    appearance TEXT,
    flavor TEXT,
    mouthfeel TEXT,

    -- Vital statistics ranges
    og_min DECIMAL(4,3), -- Original gravity minimum
    og_max DECIMAL(4,3), -- Original gravity maximum
    fg_min DECIMAL(4,3), -- Final gravity minimum
    fg_max DECIMAL(4,3), -- Final gravity maximum
    abv_min DECIMAL(4,2), -- ABV% minimum
    abv_max DECIMAL(4,2), -- ABV% maximum
    ibu_min INTEGER, -- Bitterness minimum
    ibu_max INTEGER, -- Bitterness maximum
    srm_min DECIMAL(4,1), -- Color minimum
    srm_max DECIMAL(4,1), -- Color maximum

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,

    UNIQUE(tenant_id, name)
);

-- ============================================================================
-- RECIPES: Beer recipes and formulations
-- ============================================================================

CREATE TABLE {schema_name}.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brewery_id UUID NOT NULL REFERENCES {schema_name}.breweries(id),
    beer_style_id UUID REFERENCES {schema_name}.beer_styles(id),

    -- Basic information
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    description TEXT,

    -- Recipe details
    batch_size_liters DECIMAL(8,2) NOT NULL, -- Target batch size
    boil_time_minutes INTEGER DEFAULT 60,
    efficiency_percent DECIMAL(5,2) DEFAULT 75.0, -- Brewhouse efficiency

    -- Target characteristics
    target_og DECIMAL(4,3),
    target_fg DECIMAL(4,3),
    target_abv DECIMAL(4,2),
    target_ibu INTEGER,
    target_srm DECIMAL(4,1),

    -- Recipe data (JSON for flexibility)
    ingredients JSONB DEFAULT '{}', -- Malts, hops, yeast, adjuncts
    mash_profile JSONB DEFAULT '{}', -- Mash steps and temperatures
    hop_schedule JSONB DEFAULT '{}', -- Hop additions timing
    fermentation_profile JSONB DEFAULT '{}', -- Fermentation schedule

    -- Notes and instructions
    brewing_notes TEXT,
    tasting_notes TEXT,
    recipe_notes TEXT,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, archived
    is_public BOOLEAN NOT NULL DEFAULT false, -- Share with other tenants

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,

    UNIQUE(tenant_id, brewery_id, name, version)
);

-- ============================================================================
-- BATCHES: Individual production batches
-- ============================================================================

CREATE TABLE {schema_name}.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brewery_id UUID NOT NULL REFERENCES {schema_name}.breweries(id),
    recipe_id UUID NOT NULL REFERENCES {schema_name}.recipes(id),

    -- Batch identification
    batch_number VARCHAR(100) NOT NULL, -- Customer batch numbering
    internal_code VARCHAR(50), -- Internal tracking code

    -- Production details
    planned_volume_liters DECIMAL(8,2) NOT NULL,
    actual_volume_liters DECIMAL(8,2),

    -- Dates
    brew_date DATE NOT NULL,
    planned_package_date DATE,
    actual_package_date DATE,
    planned_release_date DATE,

    -- Measurements
    original_gravity DECIMAL(4,3),
    final_gravity DECIMAL(4,3),
    actual_abv DECIMAL(4,2),
    actual_ibu INTEGER,
    actual_srm DECIMAL(4,1),
    ph_mash DECIMAL(3,2),
    ph_finished DECIMAL(3,2),

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- planned, brewing, fermenting, conditioning, packaging, released
    current_location VARCHAR(255), -- Tank 1, Conditioning, Bright Tank, etc.

    -- Quality control
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
    quality_notes TEXT,

    -- Production logs (JSON for flexibility)
    brew_log JSONB DEFAULT '{}', -- Brew day measurements and notes
    fermentation_log JSONB DEFAULT '{}', -- Daily fermentation readings
    packaging_log JSONB DEFAULT '{}', -- Packaging details and volumes

    -- Notes
    production_notes TEXT,
    tasting_notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,

    UNIQUE(tenant_id, brewery_id, batch_number)
);

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================

-- Breweries
CREATE INDEX idx_{schema_clean}_breweries_tenant ON {schema_name}.breweries(tenant_id);
CREATE INDEX idx_{schema_clean}_breweries_slug ON {schema_name}.breweries(tenant_id, slug);
CREATE INDEX idx_{schema_clean}_breweries_status ON {schema_name}.breweries(status) WHERE status = 'active';

-- Beer styles
CREATE INDEX idx_{schema_clean}_beer_styles_tenant ON {schema_name}.beer_styles(tenant_id);
CREATE INDEX idx_{schema_clean}_beer_styles_category ON {schema_name}.beer_styles(category);
CREATE INDEX idx_{schema_clean}_beer_styles_bjcp ON {schema_name}.beer_styles(bjcp_code) WHERE bjcp_code IS NOT NULL;

-- Recipes
CREATE INDEX idx_{schema_clean}_recipes_tenant ON {schema_name}.recipes(tenant_id);
CREATE INDEX idx_{schema_clean}_recipes_brewery ON {schema_name}.recipes(brewery_id);
CREATE INDEX idx_{schema_clean}_recipes_style ON {schema_name}.recipes(beer_style_id);
CREATE INDEX idx_{schema_clean}_recipes_status ON {schema_name}.recipes(status);
CREATE INDEX idx_{schema_clean}_recipes_name ON {schema_name}.recipes(tenant_id, name);

-- Batches
CREATE INDEX idx_{schema_clean}_batches_tenant ON {schema_name}.batches(tenant_id);
CREATE INDEX idx_{schema_clean}_batches_brewery ON {schema_name}.batches(brewery_id);
CREATE INDEX idx_{schema_clean}_batches_recipe ON {schema_name}.batches(recipe_id);
CREATE INDEX idx_{schema_clean}_batches_status ON {schema_name}.batches(status);
CREATE INDEX idx_{schema_clean}_batches_brew_date ON {schema_name}.batches(brew_date);
CREATE INDEX idx_{schema_clean}_batches_number ON {schema_name}.batches(tenant_id, batch_number);

-- ============================================================================
-- TRIGGERS: Automatic timestamp updates
-- ============================================================================

CREATE TRIGGER trigger_{schema_clean}_breweries_updated_at
    BEFORE UPDATE ON {schema_name}.breweries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_{schema_clean}_beer_styles_updated_at
    BEFORE UPDATE ON {schema_name}.beer_styles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_{schema_clean}_recipes_updated_at
    BEFORE UPDATE ON {schema_name}.recipes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_{schema_clean}_batches_updated_at
    BEFORE UPDATE ON {schema_name}.batches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY: Tenant isolation
-- ============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE {schema_name}.breweries ENABLE ROW LEVEL SECURITY;
ALTER TABLE {schema_name}.beer_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE {schema_name}.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE {schema_name}.batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (will be activated when app roles are implemented)
-- Policy: Users can only access data for their tenant
CREATE POLICY policy_{schema_clean}_breweries_tenant_isolation ON {schema_name}.breweries
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY policy_{schema_clean}_beer_styles_tenant_isolation ON {schema_name}.beer_styles
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY policy_{schema_clean}_recipes_tenant_isolation ON {schema_name}.recipes
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY policy_{schema_clean}_batches_tenant_isolation ON {schema_name}.batches
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON TABLE {schema_name}.breweries IS 'Individual brewery locations and facilities within a tenant';
COMMENT ON TABLE {schema_name}.beer_styles IS 'Beer style definitions following BJCP guidelines or custom styles';
COMMENT ON TABLE {schema_name}.recipes IS 'Beer recipes with detailed ingredient and process specifications';
COMMENT ON TABLE {schema_name}.batches IS 'Individual production batches with tracking and quality data';

COMMENT ON COLUMN {schema_name}.recipes.ingredients IS 'JSON object containing malts, hops, yeast, and adjuncts with quantities';
COMMENT ON COLUMN {schema_name}.batches.brew_log IS 'JSON log of brew day activities, temperatures, and measurements';
COMMENT ON COLUMN {schema_name}.batches.fermentation_log IS 'JSON log of daily fermentation readings and activities';