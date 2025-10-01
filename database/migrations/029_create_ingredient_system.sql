-- Migration: Create Ingredient Management System
-- Date: 2025-01-27
-- Description: Create tables for managing grains, hops, yeasts, and additives

BEGIN;

-- =============================================
-- GRAINS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "Grain" (
    "GrainId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    "Name" VARCHAR(255) NOT NULL,
    "Type" VARCHAR(100) NOT NULL, -- Base Malt, Specialty Malt, Adjunct
    "Origin" VARCHAR(100), -- Country/Region
    "Supplier" VARCHAR(100),
    "Color" DECIMAL(5,1), -- Lovibond degrees
    "Potential" DECIMAL(4,3), -- Specific gravity potential (1.036 = 36 points)
    "MaxUsage" DECIMAL(5,2), -- Maximum percentage in grain bill
    "RequiresMashing" BOOLEAN DEFAULT true,
    "Description" TEXT,
    "FlavorProfile" TEXT,
    "IsActive" BOOLEAN DEFAULT true,
    "IsCustom" BOOLEAN DEFAULT false, -- true for tenant-specific additions
    "Created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),

    CONSTRAINT grain_color_check CHECK ("Color" >= 0 AND "Color" <= 600),
    CONSTRAINT grain_potential_check CHECK ("Potential" >= 1.000 AND "Potential" <= 1.050),
    CONSTRAINT grain_max_usage_check CHECK ("MaxUsage" >= 0 AND "MaxUsage" <= 100)
);

-- =============================================
-- HOPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "Hop" (
    "HopId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    "Name" VARCHAR(255) NOT NULL,
    "Origin" VARCHAR(100), -- Country/Region
    "Type" VARCHAR(50) NOT NULL, -- Bittering, Aroma, Dual Purpose
    "AlphaAcidMin" DECIMAL(4,2), -- Minimum alpha acid percentage
    "AlphaAcidMax" DECIMAL(4,2), -- Maximum alpha acid percentage
    "BetaAcid" DECIMAL(4,2), -- Beta acid percentage
    "CoHumulone" DECIMAL(4,1), -- Cohumulone percentage
    "FlavorProfile" TEXT,
    "AromaProfile" TEXT,
    "Substitutes" TEXT, -- Comma-separated list of substitute hops
    "StorageIndex" DECIMAL(3,1), -- Storage stability index
    "HarvestYear" INTEGER,
    "IsActive" BOOLEAN DEFAULT true,
    "IsCustom" BOOLEAN DEFAULT false,
    "Created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),

    CONSTRAINT hop_alpha_acid_check CHECK ("AlphaAcidMin" >= 0 AND "AlphaAcidMax" >= "AlphaAcidMin"),
    CONSTRAINT hop_beta_acid_check CHECK ("BetaAcid" >= 0 AND "BetaAcid" <= 20),
    CONSTRAINT hop_cohumulone_check CHECK ("CoHumulone" >= 0 AND "CoHumulone" <= 100),
    CONSTRAINT hop_harvest_year_check CHECK ("HarvestYear" >= 2020 AND "HarvestYear" <= EXTRACT(YEAR FROM CURRENT_DATE) + 1)
);

-- =============================================
-- YEASTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "Yeast" (
    "YeastId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    "Name" VARCHAR(255) NOT NULL,
    "Manufacturer" VARCHAR(100),
    "ProductId" VARCHAR(50), -- Manufacturer's product code
    "Type" VARCHAR(50) NOT NULL, -- Ale, Lager, Wheat, Belgian, Wild, Distilling, Wine
    "Form" VARCHAR(50) NOT NULL, -- Liquid, Dry, Slant, Culture
    "AttenuationMin" INTEGER, -- Minimum attenuation percentage
    "AttenuationMax" INTEGER, -- Maximum attenuation percentage
    "TemperatureMin" INTEGER, -- Minimum fermentation temperature (Fahrenheit)
    "TemperatureMax" INTEGER, -- Maximum fermentation temperature (Fahrenheit)
    "AlcoholTolerance" DECIMAL(4,1), -- Maximum alcohol tolerance percentage
    "Flocculation" VARCHAR(20), -- Low, Medium, High
    "FlavorProfile" TEXT,
    "Description" TEXT,
    "Usage" TEXT, -- Recommended usage instructions
    "PitchRate" TEXT, -- Recommended pitching rate
    "IsActive" BOOLEAN DEFAULT true,
    "IsCustom" BOOLEAN DEFAULT false,
    "Created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),

    CONSTRAINT yeast_attenuation_check CHECK ("AttenuationMin" >= 40 AND "AttenuationMax" >= "AttenuationMin" AND "AttenuationMax" <= 100),
    CONSTRAINT yeast_temperature_check CHECK ("TemperatureMin" >= 32 AND "TemperatureMax" >= "TemperatureMin" AND "TemperatureMax" <= 110),
    CONSTRAINT yeast_alcohol_tolerance_check CHECK ("AlcoholTolerance" >= 0 AND "AlcoholTolerance" <= 25)
);

-- =============================================
-- ADDITIVES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "Additive" (
    "AdditiveId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    "Name" VARCHAR(255) NOT NULL,
    "Category" VARCHAR(100) NOT NULL, -- Water Treatment, Clarification, Flavoring, Nutrients, Preservatives
    "Type" VARCHAR(100), -- Subcategory within the main category
    "Purpose" TEXT, -- What this additive is used for
    "DosageMin" DECIMAL(10,4), -- Minimum recommended dosage
    "DosageMax" DECIMAL(10,4), -- Maximum recommended dosage
    "DosageUnit" VARCHAR(20), -- Unit of measurement (g/gal, tsp, oz, etc.)
    "Usage" TEXT, -- When and how to use
    "SafetyNotes" TEXT, -- Safety considerations
    "Description" TEXT,
    "IsActive" BOOLEAN DEFAULT true,
    "IsCustom" BOOLEAN DEFAULT false,
    "Created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),

    CONSTRAINT additive_dosage_check CHECK ("DosageMax" >= "DosageMin" AND "DosageMin" >= 0)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Grain indexes
CREATE INDEX IF NOT EXISTS idx_grain_tenant_id ON "Grain"("TenantId");
CREATE INDEX IF NOT EXISTS idx_grain_type ON "Grain"("Type");
CREATE INDEX IF NOT EXISTS idx_grain_active ON "Grain"("IsActive");
CREATE INDEX IF NOT EXISTS idx_grain_search ON "Grain"("Name", "Type", "Origin");

-- Hop indexes
CREATE INDEX IF NOT EXISTS idx_hop_tenant_id ON "Hop"("TenantId");
CREATE INDEX IF NOT EXISTS idx_hop_type ON "Hop"("Type");
CREATE INDEX IF NOT EXISTS idx_hop_active ON "Hop"("IsActive");
CREATE INDEX IF NOT EXISTS idx_hop_search ON "Hop"("Name", "Origin", "Type");

-- Yeast indexes
CREATE INDEX IF NOT EXISTS idx_yeast_tenant_id ON "Yeast"("TenantId");
CREATE INDEX IF NOT EXISTS idx_yeast_type ON "Yeast"("Type");
CREATE INDEX IF NOT EXISTS idx_yeast_form ON "Yeast"("Form");
CREATE INDEX IF NOT EXISTS idx_yeast_active ON "Yeast"("IsActive");
CREATE INDEX IF NOT EXISTS idx_yeast_search ON "Yeast"("Name", "Manufacturer", "Type");

-- Additive indexes
CREATE INDEX IF NOT EXISTS idx_additive_tenant_id ON "Additive"("TenantId");
CREATE INDEX IF NOT EXISTS idx_additive_category ON "Additive"("Category");
CREATE INDEX IF NOT EXISTS idx_additive_active ON "Additive"("IsActive");
CREATE INDEX IF NOT EXISTS idx_additive_search ON "Additive"("Name", "Category", "Type");

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE "Grain" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Yeast" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Additive" ENABLE ROW LEVEL SECURITY;

-- Grain policies
CREATE POLICY grain_tenant_isolation ON "Grain"
    FOR ALL USING (
        "TenantId" IS NULL OR -- Global ingredients
        "TenantId" = current_setting('app.current_tenant_id')::UUID OR
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id')::UUID
            AND ut."TenantId" = "Grain"."TenantId"
        )
    );

-- Hop policies
CREATE POLICY hop_tenant_isolation ON "Hop"
    FOR ALL USING (
        "TenantId" IS NULL OR -- Global ingredients
        "TenantId" = current_setting('app.current_tenant_id')::UUID OR
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id')::UUID
            AND ut."TenantId" = "Hop"."TenantId"
        )
    );

-- Yeast policies
CREATE POLICY yeast_tenant_isolation ON "Yeast"
    FOR ALL USING (
        "TenantId" IS NULL OR -- Global ingredients
        "TenantId" = current_setting('app.current_tenant_id')::UUID OR
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id')::UUID
            AND ut."TenantId" = "Yeast"."TenantId"
        )
    );

-- Additive policies
CREATE POLICY additive_tenant_isolation ON "Additive"
    FOR ALL USING (
        "TenantId" IS NULL OR -- Global ingredients
        "TenantId" = current_setting('app.current_tenant_id')::UUID OR
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id')::UUID
            AND ut."TenantId" = "Additive"."TenantId"
        )
    );

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "Grain" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Hop" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Yeast" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Additive" TO fermentum_app;

COMMIT;