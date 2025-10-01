-- Migration: Create Mash Step Reference Table
-- Date: 2025-09-29
-- Description: Create table for managing predefined mash step templates

BEGIN;

-- =============================================
-- MASH STEPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "MashStep" (
    "MashStepId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    "Name" VARCHAR(255) NOT NULL,
    "StepType" VARCHAR(50) NOT NULL, -- Temperature, Infusion, Decoction
    "Temperature" INTEGER NOT NULL, -- Target temperature in Fahrenheit
    "TemperatureUnit" VARCHAR(5) DEFAULT 'F',
    "Duration" INTEGER NOT NULL, -- Duration in minutes
    "Description" TEXT,
    "TypicalOrder" INTEGER, -- Typical order in mash sequence (1, 2, 3, etc.)
    "Category" VARCHAR(100), -- Protein Rest, Saccharification, Mash Out, etc.
    "IsActive" BOOLEAN DEFAULT true,
    "IsCustom" BOOLEAN DEFAULT false, -- true for tenant-specific additions
    "Created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),

    CONSTRAINT mash_step_temperature_check CHECK ("Temperature" >= 32 AND "Temperature" <= 212),
    CONSTRAINT mash_step_duration_check CHECK ("Duration" >= 1 AND "Duration" <= 480),
    CONSTRAINT mash_step_order_check CHECK ("TypicalOrder" IS NULL OR ("TypicalOrder" >= 1 AND "TypicalOrder" <= 20))
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_mash_step_tenant_id ON "MashStep"("TenantId");
CREATE INDEX IF NOT EXISTS idx_mash_step_type ON "MashStep"("StepType");
CREATE INDEX IF NOT EXISTS idx_mash_step_category ON "MashStep"("Category");
CREATE INDEX IF NOT EXISTS idx_mash_step_active ON "MashStep"("IsActive");
CREATE INDEX IF NOT EXISTS idx_mash_step_search ON "MashStep"("Name", "Category", "StepType");

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE "MashStep" ENABLE ROW LEVEL SECURITY;

-- MashStep policies
CREATE POLICY mash_step_tenant_isolation ON "MashStep"
    FOR ALL USING (
        "TenantId" IS NULL OR -- Global mash steps
        "TenantId" = current_setting('app.current_tenant_id')::UUID OR
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id')::UUID
            AND ut."TenantId" = "MashStep"."TenantId"
        )
    );

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "MashStep" TO fermentum_app;

COMMIT;