-- ============================================================================
-- Migration 041: Recipe Step System
-- Replaces narrow RecipeMashStep with comprehensive step-based recipe system
-- ============================================================================
-- This migration creates a flexible recipe step system that:
-- 1. Breaks recipes into sequential steps (mash, boil, ferment, package, etc.)
-- 2. Assigns ingredient portions to specific steps (hop schedules, dry hopping)
-- 3. Defines equipment requirements per step
-- 4. Enables quality control checkpoints
-- 5. Facilitates batch generation from recipes with proper stock management
-- ============================================================================

-- Drop old mash-only step table
DROP TABLE IF EXISTS "RecipeMashStep" CASCADE;

-- ============================================================================
-- Master Recipe Step Table
-- Defines all process steps in a recipe with equipment and timing requirements
-- ============================================================================
CREATE TABLE "RecipeStep" (
    "RecipeStepId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),

    -- Step Identification
    "StepNumber" INTEGER NOT NULL, -- Sequential order (1, 2, 3...)
    "StepName" VARCHAR(100) NOT NULL, -- "Mash In", "Boil - Bittering Hops", "Dry Hop"
    "StepType" VARCHAR(50) NOT NULL, -- mash, boil, whirlpool, transfer, fermentation, dry_hop, cold_crash, package

    -- Equipment Requirements
    "RequiresEquipment" BOOLEAN DEFAULT FALSE,
    "EquipmentTypeId" UUID REFERENCES "EquipmentType"("EquipmentTypeId"), -- Preferred equipment type (e.g., "Fermenter", "Mash Tun")
    "EquipmentCapacityMin" DECIMAL(10,2), -- Minimum capacity required
    "EquipmentCapacityUnit" VARCHAR(20), -- gallons, liters, barrels

    -- Timing
    "Duration" INTEGER, -- Duration in minutes (NULL for instant steps like "add hops")
    "TargetTemperature" DECIMAL(5,2), -- Target temperature for step
    "TemperatureUnit" VARCHAR(10) DEFAULT '°F',
    "StartOffsetMinutes" INTEGER, -- Start X minutes after previous step completes (for parallel operations)

    -- Process Parameters
    "Description" TEXT, -- Detailed instructions for the brewer
    "Notes" TEXT, -- Additional brewer's notes
    "IsCriticalStep" BOOLEAN DEFAULT FALSE, -- Mark quality control points or contamination-sensitive steps
    "AllowsParallel" BOOLEAN DEFAULT FALSE, -- Can run parallel with next step (e.g., hop addition during ongoing boil)

    -- Dependencies
    "PreviousStepId" UUID REFERENCES "RecipeStep"("RecipeStepId"), -- Optional step dependency for branching workflows
    "RequiresPreviousComplete" BOOLEAN DEFAULT TRUE, -- Must previous step be complete before this starts

    -- Mash-Specific Parameters (for backward compatibility with RecipeMashStep)
    "InfusionAmount" DECIMAL(6,2), -- Amount of water to add (for infusion mashes)
    "InfusionTemp" DECIMAL(5,2), -- Temperature of infusion water

    -- Audit
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),

    CONSTRAINT "UK_RecipeStep_RecipeStepNumber" UNIQUE ("RecipeId", "StepNumber")
);

-- ============================================================================
-- Recipe Step Ingredient Additions
-- Links ingredient portions to specific recipe steps
-- This allows hop schedules, grain additions, dry hopping, etc.
-- ============================================================================
CREATE TABLE "RecipeStepIngredient" (
    "RecipeStepIngredientId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeStepId" UUID NOT NULL REFERENCES "RecipeStep"("RecipeStepId") ON DELETE CASCADE,
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId"),

    -- Ingredient Details
    "Amount" DECIMAL(8,3) NOT NULL, -- Portion of ingredient used in this step
    "Unit" VARCHAR(20) NOT NULL, -- oz, lbs, grams, kg, packets, ml
    "PercentageOfTotal" DECIMAL(5,2), -- What % of recipe's total amount of this ingredient (for reference)

    -- Addition Timing (for within-step timing like hop additions during boil)
    "AdditionTimeOffset" INTEGER, -- Minutes from step start (e.g., 60 for bittering hops added at start of 90min boil)
    "AdditionMethod" VARCHAR(50), -- direct_add, whirlpool, hop_back, dry_hop, first_wort, etc.

    -- Purpose & Classification
    "Purpose" VARCHAR(100), -- bittering, flavor, aroma, color, body, fermentation, etc.
    "IsOptional" BOOLEAN DEFAULT FALSE, -- Can be omitted if ingredient unavailable

    -- Instructions
    "Instructions" TEXT, -- Specific instructions for adding this ingredient
    "SortOrder" INTEGER, -- Display order within step

    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Recipe Step Measurements/Checkpoints
-- Defines quality control checkpoints and measurements for each step
-- Used to generate BatchMeasurement records during production
-- ============================================================================
CREATE TABLE "RecipeStepCheckpoint" (
    "CheckpointId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeStepId" UUID NOT NULL REFERENCES "RecipeStep"("RecipeStepId") ON DELETE CASCADE,

    -- Checkpoint Details
    "CheckpointName" VARCHAR(100) NOT NULL, -- "Pre-Boil Gravity", "Mash pH", "Pitch Temperature"
    "MeasurementType" VARCHAR(50) NOT NULL, -- gravity, temperature, ph, volume, color, pressure
    "TargetValue" DECIMAL(10,4), -- Expected/target value
    "TargetMin" DECIMAL(10,4), -- Acceptable minimum (quality control range)
    "TargetMax" DECIMAL(10,4), -- Acceptable maximum (quality control range)
    "Unit" VARCHAR(20), -- °F, pH, SG, gallons, psi, SRM

    -- Process Control
    "IsRequired" BOOLEAN DEFAULT FALSE, -- Must be recorded for batch to proceed
    "IsQualityControl" BOOLEAN DEFAULT FALSE, -- Flags this as a QC checkpoint
    "FailureAction" TEXT, -- What to do if measurement is out of range

    "Instructions" TEXT, -- How to take the measurement
    "SortOrder" INTEGER, -- Display order within step
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
CREATE INDEX "IDX_RecipeStep_RecipeId" ON "RecipeStep"("RecipeId");
CREATE INDEX "IDX_RecipeStep_Type" ON "RecipeStep"("StepType");
CREATE INDEX "IDX_RecipeStep_EquipmentType" ON "RecipeStep"("EquipmentTypeId");
CREATE INDEX "IDX_RecipeStep_StepNumber" ON "RecipeStep"("RecipeId", "StepNumber");

CREATE INDEX "IDX_RecipeStepIngredient_StepId" ON "RecipeStepIngredient"("RecipeStepId");
CREATE INDEX "IDX_RecipeStepIngredient_MaterialId" ON "RecipeStepIngredient"("MaterialId");
CREATE INDEX "IDX_RecipeStepIngredient_Purpose" ON "RecipeStepIngredient"("Purpose");

CREATE INDEX "IDX_RecipeStepCheckpoint_StepId" ON "RecipeStepCheckpoint"("RecipeStepId");
CREATE INDEX "IDX_RecipeStepCheckpoint_Type" ON "RecipeStepCheckpoint"("MeasurementType");

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE "RecipeStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeStepIngredient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeStepCheckpoint" ENABLE ROW LEVEL SECURITY;

-- RecipeStep policies
CREATE POLICY "RecipeStep_tenant_isolation" ON "RecipeStep"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "RecipeStep_insert" ON "RecipeStep"
    FOR INSERT
    WITH CHECK ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "RecipeStep_update" ON "RecipeStep"
    FOR UPDATE
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "RecipeStep_delete" ON "RecipeStep"
    FOR DELETE
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

-- RecipeStepIngredient policies (inherits tenant from RecipeStep)
CREATE POLICY "RecipeStepIngredient_tenant_isolation" ON "RecipeStepIngredient"
    USING (
        EXISTS (
            SELECT 1 FROM "RecipeStep" rs
            WHERE rs."RecipeStepId" = "RecipeStepIngredient"."RecipeStepId"
              AND rs."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "RecipeStepIngredient_insert" ON "RecipeStepIngredient"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "RecipeStep" rs
            WHERE rs."RecipeStepId" = "RecipeStepIngredient"."RecipeStepId"
              AND rs."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "RecipeStepIngredient_update" ON "RecipeStepIngredient"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "RecipeStep" rs
            WHERE rs."RecipeStepId" = "RecipeStepIngredient"."RecipeStepId"
              AND rs."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "RecipeStepIngredient_delete" ON "RecipeStepIngredient"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "RecipeStep" rs
            WHERE rs."RecipeStepId" = "RecipeStepIngredient"."RecipeStepId"
              AND rs."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

-- RecipeStepCheckpoint policies (inherits tenant from RecipeStep)
CREATE POLICY "RecipeStepCheckpoint_tenant_isolation" ON "RecipeStepCheckpoint"
    USING (
        EXISTS (
            SELECT 1 FROM "RecipeStep" rs
            WHERE rs."RecipeStepId" = "RecipeStepCheckpoint"."RecipeStepId"
              AND rs."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "RecipeStepCheckpoint_insert" ON "RecipeStepCheckpoint"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "RecipeStep" rs
            WHERE rs."RecipeStepId" = "RecipeStepCheckpoint"."RecipeStepId"
              AND rs."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "RecipeStepCheckpoint_update" ON "RecipeStepCheckpoint"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "RecipeStep" rs
            WHERE rs."RecipeStepId" = "RecipeStepCheckpoint"."RecipeStepId"
              AND rs."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "RecipeStepCheckpoint_delete" ON "RecipeStepCheckpoint"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "RecipeStep" rs
            WHERE rs."RecipeStepId" = "RecipeStepCheckpoint"."RecipeStepId"
              AND rs."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

-- ============================================================================
-- Helper Function: Copy Recipe Steps to Batch Steps
-- Used when creating a new batch from a recipe
-- ============================================================================
CREATE OR REPLACE FUNCTION copy_recipe_steps_to_batch(
    p_recipe_id UUID,
    p_batch_id UUID,
    p_tenant_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_step_count INTEGER := 0;
    v_recipe_step RECORD;
    v_new_batch_step_id UUID;
    v_equipment_id UUID;
BEGIN
    -- Loop through recipe steps in order
    FOR v_recipe_step IN
        SELECT * FROM "RecipeStep"
        WHERE "RecipeId" = p_recipe_id
        ORDER BY "StepNumber"
    LOOP
        -- Find available equipment of the required type
        v_equipment_id := NULL;
        IF v_recipe_step."RequiresEquipment" AND v_recipe_step."EquipmentTypeId" IS NOT NULL THEN
            SELECT "EquipmentId" INTO v_equipment_id
            FROM "Equipment"
            WHERE "EquipmentTypeId" = v_recipe_step."EquipmentTypeId"
              AND "TenantId" = p_tenant_id
              AND "Status" = 'Available'
            ORDER BY "Capacity" DESC -- Prefer larger equipment
            LIMIT 1;
        END IF;

        -- Create batch step from recipe step
        INSERT INTO "BatchStep" (
            "BatchId",
            "EquipmentId",
            "Name",
            "Description",
            "StepNumber",
            "StepType",
            "Temperature",
            "Duration",
            "Status",
            "Created",
            "Updated"
        ) VALUES (
            p_batch_id,
            v_equipment_id,
            v_recipe_step."StepName",
            v_recipe_step."Description",
            v_recipe_step."StepNumber",
            v_recipe_step."StepType",
            v_recipe_step."TargetTemperature",
            v_recipe_step."Duration",
            'Not Started',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING "BatchStepId" INTO v_new_batch_step_id;

        -- Copy ingredient additions to batch ingredients
        -- Note: This creates records but doesn't reserve stock yet
        -- Stock reservation happens when BatchIngredient.StartedFlag is set to TRUE
        INSERT INTO "BatchIngredient" (
            "BatchId",
            "StockId",
            "Quantity",
            "StartedFlag",
            "Created",
            "Updated"
        )
        SELECT
            p_batch_id,
            (
                SELECT si."StockId"
                FROM "Stock" s
                JOIN "StockInventory" si ON si."StockId" = s."StockId"
                WHERE s."TenantId" = p_tenant_id
                  AND s."Name" = (SELECT rm."Name" FROM "RawMaterial" rm WHERE rm."MaterialId" = rsi."MaterialId")
                  AND si."AvailableStock" >= rsi."Amount"
                ORDER BY s."Created" ASC -- FIFO: First In, First Out
                LIMIT 1
            ),
            rsi."Amount",
            FALSE, -- Not started yet
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM "RecipeStepIngredient" rsi
        WHERE rsi."RecipeStepId" = v_recipe_step."RecipeStepId";

        v_step_count := v_step_count + 1;
    END LOOP;

    RETURN v_step_count;
END;
$$;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================
COMMENT ON TABLE "RecipeStep" IS 'Defines sequential process steps for recipes with equipment and timing requirements';
COMMENT ON TABLE "RecipeStepIngredient" IS 'Links ingredient portions to specific recipe steps (hop schedules, dry hopping, etc.)';
COMMENT ON TABLE "RecipeStepCheckpoint" IS 'Quality control checkpoints and measurements for recipe steps';
COMMENT ON FUNCTION copy_recipe_steps_to_batch IS 'Copies recipe steps to batch steps when creating a new batch from a recipe';

COMMENT ON COLUMN "RecipeStep"."StepType" IS 'Type of step: mash, boil, whirlpool, transfer, fermentation, dry_hop, cold_crash, package';
COMMENT ON COLUMN "RecipeStep"."AllowsParallel" IS 'Can this step run in parallel with the next step (e.g., hop addition during ongoing boil)';
COMMENT ON COLUMN "RecipeStep"."IsCriticalStep" IS 'Marks quality control points or contamination-sensitive steps';

COMMENT ON COLUMN "RecipeStepIngredient"."AdditionTimeOffset" IS 'Minutes from step start (e.g., 60 for bittering hops at start of 90min boil)';
COMMENT ON COLUMN "RecipeStepIngredient"."PercentageOfTotal" IS 'Percentage of recipe total amount of this ingredient (for reference only)';

COMMENT ON COLUMN "RecipeStepCheckpoint"."IsRequired" IS 'Must be recorded for batch to proceed';
COMMENT ON COLUMN "RecipeStepCheckpoint"."IsQualityControl" IS 'Flags this as a QC checkpoint for quality tracking';

-- ============================================================================
-- Migration Complete
-- ============================================================================
