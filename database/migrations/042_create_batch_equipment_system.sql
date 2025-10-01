-- ============================================================================
-- Migration 042: Batch and Equipment Management System
-- Comprehensive production batch tracking with equipment scheduling
-- ============================================================================
-- This migration creates:
-- 1. Equipment type and instance management with capacity tracking
-- 2. Batch lifecycle management with status tracking
-- 3. Batch step execution with equipment assignments
-- 4. Batch ingredient tracking with stock integration
-- 5. Batch measurements for quality control
-- 6. Equipment scheduling to prevent double-booking
-- ============================================================================

-- ============================================================================
-- EQUIPMENT MANAGEMENT
-- ============================================================================

-- Equipment Type (Fermenter, Mash Tun, Boil Kettle, Bright Tank, etc.)
CREATE TABLE "EquipmentType" (
    "EquipmentTypeId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "BreweryId" UUID REFERENCES "Brewery"("BreweryId"), -- Optional: specific to a brewery location
    "Name" VARCHAR(100) NOT NULL, -- "Fermenter", "Mash Tun", "Boil Kettle"
    "Description" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),
    CONSTRAINT "UK_EquipmentType_TenantName" UNIQUE ("TenantId", "Name")
);

-- Equipment Instances (Tank #1, Tank #2, Mash Tun A, etc.)
CREATE TABLE "Equipment" (
    "EquipmentId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "BreweryId" UUID REFERENCES "Brewery"("BreweryId"),
    "EquipmentTypeId" UUID NOT NULL REFERENCES "EquipmentType"("EquipmentTypeId"),

    -- Equipment Details
    "Name" VARCHAR(100) NOT NULL, -- "Fermenter Tank 1", "7BBL Mash Tun"
    "Description" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Available', -- Available, In Use, Cleaning, Maintenance, Offline

    -- Capacity
    "Capacity" DECIMAL(10,2), -- Maximum capacity
    "CapacityUnit" VARCHAR(20) DEFAULT 'gallons', -- gallons, liters, barrels, hectoliters
    "WorkingCapacity" DECIMAL(10,2), -- Typical working capacity (80% of max)

    -- Physical Details
    "SerialNumber" VARCHAR(100),
    "Manufacturer" VARCHAR(100),
    "Model" VARCHAR(100),
    "PurchaseDate" DATE,
    "WarrantyExpiration" DATE,

    -- Maintenance
    "LastMaintenanceDate" DATE,
    "NextMaintenanceDate" DATE,
    "MaintenanceIntervalDays" INTEGER DEFAULT 90,
    "MaintenanceNotes" TEXT,

    -- Location
    "Location" VARCHAR(200), -- Physical location in brewery

    -- Audit
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),

    CONSTRAINT "UK_Equipment_TenantName" UNIQUE ("TenantId", "Name")
);

-- Equipment Schedule (Tracks equipment usage and availability)
CREATE TABLE "EquipmentSchedule" (
    "EquipmentScheduleId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "EquipmentId" UUID NOT NULL REFERENCES "Equipment"("EquipmentId"),
    "BatchId" UUID REFERENCES "Batch"("BatchId"), -- NULL for non-batch activities (cleaning, maintenance)
    "Status" VARCHAR(50) NOT NULL, -- Reserved, In Use, Cleaning, Maintenance
    "StartDateTime" TIMESTAMP NOT NULL,
    "EndDateTime" TIMESTAMP NOT NULL,
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),

    -- Prevent overlapping schedules for same equipment
    CONSTRAINT "CHK_EquipmentSchedule_DateRange" CHECK ("EndDateTime" > "StartDateTime"),
    -- Add exclusion constraint to prevent double-booking
    EXCLUDE USING GIST (
        "EquipmentId" WITH =,
        tsrange("StartDateTime", "EndDateTime") WITH &&
    )
);

-- ============================================================================
-- BATCH MANAGEMENT
-- ============================================================================

-- Batch Table (Production Batches)
CREATE TABLE "Batch" (
    "BatchId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "BreweryId" UUID REFERENCES "Brewery"("BreweryId"),
    "RecipeId" UUID REFERENCES "Recipe"("RecipeId"), -- Recipe used for this batch

    -- Batch Identification
    "Name" VARCHAR(200) NOT NULL, -- "IPA Batch #42", "Holiday Stout 2025"
    "BatchNumber" VARCHAR(50), -- Internal tracking number
    "Description" TEXT,

    -- Status and Lifecycle
    "Status" VARCHAR(50) DEFAULT 'Planned', -- Planned, In Progress, Fermenting, Conditioning, Completed, Cancelled
    "StartDate" TIMESTAMP,
    "CompletedDate" TIMESTAMP,

    -- Batch Size
    "PlannedVolume" DECIMAL(10,2), -- Expected volume from recipe
    "PlannedVolumeUnit" VARCHAR(20) DEFAULT 'gallons',
    "ActualVolume" DECIMAL(10,2), -- Actual volume produced
    "ActualVolumeUnit" VARCHAR(20) DEFAULT 'gallons',

    -- Quality Metrics
    "TargetOG" DECIMAL(5,3), -- Target Original Gravity from recipe
    "ActualOG" DECIMAL(5,3), -- Measured Original Gravity
    "TargetFG" DECIMAL(5,3), -- Target Final Gravity from recipe
    "ActualFG" DECIMAL(5,3), -- Measured Final Gravity
    "TargetABV" DECIMAL(4,2), -- Target ABV from recipe
    "ActualABV" DECIMAL(4,2), -- Calculated ABV from OG/FG
    "TargetIBU" DECIMAL(5,1), -- Target IBU from recipe
    "ActualIBU" DECIMAL(5,1), -- Calculated or measured IBU

    -- Costing
    "EstimatedCost" DECIMAL(10,2), -- From recipe
    "ActualCost" DECIMAL(10,2), -- Sum of actual ingredient costs

    -- Assignments
    "BrewerId" UUID REFERENCES "User"("UserId"), -- Primary brewer
    "AssignedTeam" UUID[], -- Array of user IDs involved in batch

    -- Notes
    "BrewingNotes" TEXT,
    "FermentationNotes" TEXT,
    "PackagingNotes" TEXT,
    "QualityNotes" TEXT,

    -- Audit
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId")
);

-- Batch Steps (Steps to complete during batch production)
CREATE TABLE "BatchStep" (
    "BatchStepId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "BatchId" UUID NOT NULL REFERENCES "Batch"("BatchId") ON DELETE CASCADE,
    "EquipmentId" UUID REFERENCES "Equipment"("EquipmentId"), -- Equipment assigned to this step

    -- Step Details
    "Name" VARCHAR(100) NOT NULL, -- "Mash In", "Boil - Bittering Hops", "Transfer to Fermenter"
    "Description" TEXT,
    "StepNumber" INTEGER NOT NULL, -- Sequential order
    "StepType" VARCHAR(50), -- mash, boil, transfer, fermentation, package

    -- Status
    "Status" VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Complete, Skipped
    "StartedAt" TIMESTAMP, -- When step actually started
    "CompletedAt" TIMESTAMP, -- When step actually completed

    -- Planned vs Actual
    "PlannedDuration" INTEGER, -- Planned duration in minutes (from recipe)
    "ActualDuration" INTEGER, -- Actual duration in minutes
    "PlannedTemperature" DECIMAL(5,2), -- Planned temperature (from recipe)
    "ActualTemperature" DECIMAL(5,2), -- Actual temperature achieved

    -- Process Notes
    "Notes" TEXT, -- Notes recorded during execution
    "IssuesEncountered" TEXT, -- Any problems during step

    -- Audit
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),

    CONSTRAINT "UK_BatchStep_BatchStepNumber" UNIQUE ("BatchId", "StepNumber")
);

-- Batch Ingredients (Ingredients used in batch with stock tracking)
CREATE TABLE "BatchIngredient" (
    "BatchIngredientId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "BatchId" UUID NOT NULL REFERENCES "Batch"("BatchId") ON DELETE CASCADE,
    "StockId" UUID NOT NULL REFERENCES "Stock"("StockId"), -- Stock item used
    "BatchStepId" UUID REFERENCES "BatchStep"("BatchStepId"), -- Which step uses this ingredient

    -- Quantity
    "PlannedQuantity" DECIMAL(8,3), -- Quantity from recipe
    "ActualQuantity" DECIMAL(8,3) NOT NULL, -- Actual quantity used
    "Unit" VARCHAR(20) NOT NULL, -- lbs, oz, grams, kg, packets

    -- Status
    "StartedFlag" BOOLEAN DEFAULT FALSE, -- Set to TRUE when ingredient is actually used (triggers stock decrement)
    "AddedAt" TIMESTAMP, -- When ingredient was added
    "AddedBy" UUID REFERENCES "User"("UserId"), -- Who added it

    -- Lot Tracking
    "LotNumber" VARCHAR(100), -- Lot number from stock (for traceability)

    -- Notes
    "Notes" TEXT,

    -- Audit
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batch Measurements (Quality control measurements during production)
CREATE TABLE "BatchMeasurement" (
    "BatchMeasurementId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "BatchId" UUID NOT NULL REFERENCES "Batch"("BatchId") ON DELETE CASCADE,
    "BatchStepId" UUID REFERENCES "BatchStep"("BatchStepId"), -- Which step this measurement is for

    -- Measurement Details
    "MeasurementType" VARCHAR(50) NOT NULL, -- gravity, temperature, ph, volume, color, pressure, attenuation
    "MeasurementName" VARCHAR(100), -- "Pre-Boil Gravity", "Pitch Temperature", "Final pH"
    "Value" DECIMAL(10,4) NOT NULL, -- Measured value
    "Unit" VARCHAR(20), -- °F, pH, SG, gallons, psi, SRM, %

    -- Expected vs Actual
    "TargetValue" DECIMAL(10,4), -- Expected value from recipe
    "TargetMin" DECIMAL(10,4), -- Acceptable minimum
    "TargetMax" DECIMAL(10,4), -- Acceptable maximum
    "IsInRange" BOOLEAN, -- Calculated: Value between Min and Max

    -- Context
    "MeasuredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "MeasuredBy" UUID REFERENCES "User"("UserId"),
    "Notes" TEXT, -- Observations or corrective actions

    -- Quality Control
    "IsQualityControl" BOOLEAN DEFAULT FALSE, -- Is this a QC checkpoint
    "RequiresAction" BOOLEAN DEFAULT FALSE, -- Flagged for review/action
    "ActionTaken" TEXT, -- What was done if out of range

    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Equipment indexes
CREATE INDEX "IDX_Equipment_TenantId" ON "Equipment"("TenantId");
CREATE INDEX "IDX_Equipment_TypeId" ON "Equipment"("EquipmentTypeId");
CREATE INDEX "IDX_Equipment_Status" ON "Equipment"("Status");
CREATE INDEX "IDX_Equipment_BreweryId" ON "Equipment"("BreweryId");

CREATE INDEX "IDX_EquipmentSchedule_EquipmentId" ON "EquipmentSchedule"("EquipmentId");
CREATE INDEX "IDX_EquipmentSchedule_BatchId" ON "EquipmentSchedule"("BatchId");
CREATE INDEX "IDX_EquipmentSchedule_DateRange" ON "EquipmentSchedule"("StartDateTime", "EndDateTime");

-- Batch indexes
CREATE INDEX "IDX_Batch_TenantId" ON "Batch"("TenantId");
CREATE INDEX "IDX_Batch_RecipeId" ON "Batch"("RecipeId");
CREATE INDEX "IDX_Batch_Status" ON "Batch"("Status");
CREATE INDEX "IDX_Batch_BreweryId" ON "Batch"("BreweryId");
CREATE INDEX "IDX_Batch_BrewerId" ON "Batch"("BrewerId");

CREATE INDEX "IDX_BatchStep_BatchId" ON "BatchStep"("BatchId");
CREATE INDEX "IDX_BatchStep_EquipmentId" ON "BatchStep"("EquipmentId");
CREATE INDEX "IDX_BatchStep_Status" ON "BatchStep"("Status");
CREATE INDEX "IDX_BatchStep_StepNumber" ON "BatchStep"("BatchId", "StepNumber");

CREATE INDEX "IDX_BatchIngredient_BatchId" ON "BatchIngredient"("BatchId");
CREATE INDEX "IDX_BatchIngredient_StockId" ON "BatchIngredient"("StockId");
CREATE INDEX "IDX_BatchIngredient_BatchStepId" ON "BatchIngredient"("BatchStepId");
CREATE INDEX "IDX_BatchIngredient_StartedFlag" ON "BatchIngredient"("StartedFlag");

CREATE INDEX "IDX_BatchMeasurement_BatchId" ON "BatchMeasurement"("BatchId");
CREATE INDEX "IDX_BatchMeasurement_BatchStepId" ON "BatchMeasurement"("BatchStepId");
CREATE INDEX "IDX_BatchMeasurement_Type" ON "BatchMeasurement"("MeasurementType");
CREATE INDEX "IDX_BatchMeasurement_QC" ON "BatchMeasurement"("IsQualityControl");

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE "EquipmentType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EquipmentSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Batch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BatchStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BatchIngredient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BatchMeasurement" ENABLE ROW LEVEL SECURITY;

-- EquipmentType policies
CREATE POLICY "EquipmentType_tenant_isolation" ON "EquipmentType"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "EquipmentType_insert" ON "EquipmentType"
    FOR INSERT WITH CHECK ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "EquipmentType_update" ON "EquipmentType"
    FOR UPDATE USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "EquipmentType_delete" ON "EquipmentType"
    FOR DELETE USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

-- Equipment policies
CREATE POLICY "Equipment_tenant_isolation" ON "Equipment"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Equipment_insert" ON "Equipment"
    FOR INSERT WITH CHECK ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Equipment_update" ON "Equipment"
    FOR UPDATE USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Equipment_delete" ON "Equipment"
    FOR DELETE USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

-- EquipmentSchedule policies
CREATE POLICY "EquipmentSchedule_tenant_isolation" ON "EquipmentSchedule"
    USING (
        EXISTS (
            SELECT 1 FROM "Equipment" e
            WHERE e."EquipmentId" = "EquipmentSchedule"."EquipmentId"
              AND e."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "EquipmentSchedule_insert" ON "EquipmentSchedule"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Equipment" e
            WHERE e."EquipmentId" = "EquipmentSchedule"."EquipmentId"
              AND e."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

-- Batch policies
CREATE POLICY "Batch_tenant_isolation" ON "Batch"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Batch_insert" ON "Batch"
    FOR INSERT WITH CHECK ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Batch_update" ON "Batch"
    FOR UPDATE USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Batch_delete" ON "Batch"
    FOR DELETE USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

-- BatchStep policies (inherits from Batch)
CREATE POLICY "BatchStep_tenant_isolation" ON "BatchStep"
    USING (
        EXISTS (
            SELECT 1 FROM "Batch" b
            WHERE b."BatchId" = "BatchStep"."BatchId"
              AND b."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "BatchStep_insert" ON "BatchStep"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Batch" b
            WHERE b."BatchId" = "BatchStep"."BatchId"
              AND b."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

-- BatchIngredient policies (inherits from Batch)
CREATE POLICY "BatchIngredient_tenant_isolation" ON "BatchIngredient"
    USING (
        EXISTS (
            SELECT 1 FROM "Batch" b
            WHERE b."BatchId" = "BatchIngredient"."BatchId"
              AND b."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "BatchIngredient_insert" ON "BatchIngredient"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Batch" b
            WHERE b."BatchId" = "BatchIngredient"."BatchId"
              AND b."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

-- BatchMeasurement policies (inherits from Batch)
CREATE POLICY "BatchMeasurement_tenant_isolation" ON "BatchMeasurement"
    USING (
        EXISTS (
            SELECT 1 FROM "Batch" b
            WHERE b."BatchId" = "BatchMeasurement"."BatchId"
              AND b."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "BatchMeasurement_insert" ON "BatchMeasurement"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Batch" b
            WHERE b."BatchId" = "BatchMeasurement"."BatchId"
              AND b."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Reserve stock when BatchIngredient.StartedFlag is set to TRUE
CREATE OR REPLACE FUNCTION reserve_batch_ingredient_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if StartedFlag changed from FALSE to TRUE
    IF (TG_OP = 'UPDATE' AND OLD."StartedFlag" = FALSE AND NEW."StartedFlag" = TRUE) THEN
        -- Update stock inventory: move from AvailableStock to ReservedStock
        UPDATE "StockInventory"
        SET
            "ReservedStock" = "ReservedStock" + NEW."ActualQuantity",
            "AvailableStock" = "AvailableStock" - NEW."ActualQuantity",
            "LastStockTake" = CURRENT_TIMESTAMP
        WHERE "StockId" = NEW."StockId";

        -- Validate that we didn't go negative
        IF NOT FOUND OR
           (SELECT "AvailableStock" FROM "StockInventory" WHERE "StockId" = NEW."StockId") < 0 THEN
            RAISE EXCEPTION 'Insufficient available stock for StockId %. Available: %, Requested: %',
                NEW."StockId",
                (SELECT "AvailableStock" + NEW."ActualQuantity" FROM "StockInventory" WHERE "StockId" = NEW."StockId"),
                NEW."ActualQuantity";
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "TRG_BatchIngredient_ReserveStock"
AFTER UPDATE ON "BatchIngredient"
FOR EACH ROW
EXECUTE FUNCTION reserve_batch_ingredient_stock();

-- Trigger: Update Equipment status when batch step starts/completes
CREATE OR REPLACE FUNCTION update_equipment_status_on_batch_step()
RETURNS TRIGGER AS $$
BEGIN
    -- When step starts
    IF (TG_OP = 'UPDATE' AND OLD."Status" != 'In Progress' AND NEW."Status" = 'In Progress') THEN
        UPDATE "Equipment"
        SET "Status" = 'In Use', "Updated" = CURRENT_TIMESTAMP
        WHERE "EquipmentId" = NEW."EquipmentId";
    END IF;

    -- When step completes
    IF (TG_OP = 'UPDATE' AND OLD."Status" = 'In Progress' AND NEW."Status" = 'Complete') THEN
        -- Check if any other batch steps are using this equipment
        IF NOT EXISTS (
            SELECT 1 FROM "BatchStep"
            WHERE "EquipmentId" = NEW."EquipmentId"
              AND "Status" = 'In Progress'
              AND "BatchStepId" != NEW."BatchStepId"
        ) THEN
            UPDATE "Equipment"
            SET "Status" = 'Available', "Updated" = CURRENT_TIMESTAMP
            WHERE "EquipmentId" = NEW."EquipmentId";
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "TRG_BatchStep_UpdateEquipmentStatus"
AFTER UPDATE ON "BatchStep"
FOR EACH ROW
WHEN (OLD."Status" IS DISTINCT FROM NEW."Status")
EXECUTE FUNCTION update_equipment_status_on_batch_step();

-- Trigger: Calculate ABV when OG and FG are recorded
CREATE OR REPLACE FUNCTION calculate_batch_abv()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."ActualOG" IS NOT NULL AND NEW."ActualFG" IS NOT NULL THEN
        -- ABV = (OG - FG) * 131.25
        NEW."ActualABV" := ROUND(((NEW."ActualOG" - NEW."ActualFG") * 131.25)::numeric, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "TRG_Batch_CalculateABV"
BEFORE INSERT OR UPDATE ON "Batch"
FOR EACH ROW
WHEN (NEW."ActualOG" IS NOT NULL AND NEW."ActualFG" IS NOT NULL)
EXECUTE FUNCTION calculate_batch_abv();

-- Trigger: Auto-calculate IsInRange for measurements
CREATE OR REPLACE FUNCTION calculate_measurement_range()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."TargetMin" IS NOT NULL AND NEW."TargetMax" IS NOT NULL THEN
        NEW."IsInRange" := (NEW."Value" >= NEW."TargetMin" AND NEW."Value" <= NEW."TargetMax");

        -- Flag for review if out of range
        IF NOT NEW."IsInRange" THEN
            NEW."RequiresAction" := TRUE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "TRG_BatchMeasurement_CalculateRange"
BEFORE INSERT OR UPDATE ON "BatchMeasurement"
FOR EACH ROW
EXECUTE FUNCTION calculate_measurement_range();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Check equipment availability for date range
CREATE OR REPLACE FUNCTION is_equipment_available(
    p_equipment_id UUID,
    p_start_datetime TIMESTAMP,
    p_end_datetime TIMESTAMP
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_conflict_count
    FROM "EquipmentSchedule"
    WHERE "EquipmentId" = p_equipment_id
      AND tsrange("StartDateTime", "EndDateTime") && tsrange(p_start_datetime, p_end_datetime);

    RETURN (v_conflict_count = 0);
END;
$$;

-- Function: Get available equipment of a specific type
CREATE OR REPLACE FUNCTION get_available_equipment(
    p_tenant_id UUID,
    p_equipment_type_id UUID,
    p_start_datetime TIMESTAMP,
    p_end_datetime TIMESTAMP,
    p_min_capacity DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    "EquipmentId" UUID,
    "Name" VARCHAR,
    "Capacity" DECIMAL,
    "CapacityUnit" VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e."EquipmentId",
        e."Name",
        e."Capacity",
        e."CapacityUnit"
    FROM "Equipment" e
    WHERE e."TenantId" = p_tenant_id
      AND e."EquipmentTypeId" = p_equipment_type_id
      AND e."Status" = 'Available'
      AND (p_min_capacity IS NULL OR e."Capacity" >= p_min_capacity)
      AND is_equipment_available(e."EquipmentId", p_start_datetime, p_end_datetime)
    ORDER BY e."Capacity" DESC;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "EquipmentType" IS 'Equipment type definitions (Fermenter, Mash Tun, Boil Kettle, etc.)';
COMMENT ON TABLE "Equipment" IS 'Physical equipment instances with capacity, status, and maintenance tracking';
COMMENT ON TABLE "EquipmentSchedule" IS 'Equipment usage schedule with conflict prevention via exclusion constraint';
COMMENT ON TABLE "Batch" IS 'Production batches with lifecycle tracking and quality metrics';
COMMENT ON TABLE "BatchStep" IS 'Individual steps in batch production process';
COMMENT ON TABLE "BatchIngredient" IS 'Ingredients used in batch with stock integration';
COMMENT ON TABLE "BatchMeasurement" IS 'Quality control measurements taken during batch production';

COMMENT ON COLUMN "Equipment"."Status" IS 'Current equipment status: Available, In Use, Cleaning, Maintenance, Offline';
COMMENT ON COLUMN "Batch"."Status" IS 'Batch lifecycle status: Planned, In Progress, Fermenting, Conditioning, Completed, Cancelled';
COMMENT ON COLUMN "BatchStep"."Status" IS 'Step status: Not Started, In Progress, Complete, Skipped';
COMMENT ON COLUMN "BatchIngredient"."StartedFlag" IS 'Set to TRUE when ingredient is used - triggers stock reservation';
COMMENT ON COLUMN "BatchMeasurement"."IsInRange" IS 'Auto-calculated: Is measured value within acceptable range';

COMMENT ON FUNCTION reserve_batch_ingredient_stock IS 'Reserves stock when ingredient is marked as used in batch';
COMMENT ON FUNCTION update_equipment_status_on_batch_step IS 'Updates equipment status when batch steps start/complete';
COMMENT ON FUNCTION calculate_batch_abv IS 'Auto-calculates ABV from OG and FG measurements';
COMMENT ON FUNCTION is_equipment_available IS 'Checks if equipment is available for a given time range';
COMMENT ON FUNCTION get_available_equipment IS 'Returns available equipment of a specific type for a time range';

-- ============================================================================
-- Migration Complete
-- ============================================================================
