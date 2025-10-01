-- Migration: Rebuild Recipe Schema to Match Diagram
-- This migration drops and recreates the recipe-related tables to match the foreign key relationships shown in the diagram
-- Recipe -> RecipeGrain -> Grain (using GrainId)
-- Recipe -> RecipeHops -> Hops (using HopsId)
-- Recipe -> RecipeYeast -> Yeast (using YeastId)
-- Recipe -> RecipeAdditive -> Additive (using AdditiveId)

BEGIN;

-- Drop existing junction tables first (due to foreign key constraints)
DROP TABLE IF EXISTS "RecipeGrain" CASCADE;
DROP TABLE IF EXISTS "RecipeHop" CASCADE;
DROP TABLE IF EXISTS "RecipeYeast" CASCADE;
DROP TABLE IF EXISTS "RecipeAdditive" CASCADE;

-- Keep Recipe table as-is since it has the correct structure
-- Keep individual ingredient tables (Grain, Hop, Yeast, Additive) but ensure they have correct IDs

-- Keep existing table names but ensure foreign keys match
-- Current: Hop.HopId, Grain.GrainId, Yeast.YeastId, Additive.AdditiveId

-- Create RecipeGrain junction table
CREATE TABLE "RecipeGrain" (
    "RecipeGrainId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL,
    "GrainId" UUID NOT NULL,
    "Amount" NUMERIC(8,3) NOT NULL,
    "Unit" VARCHAR(20) NOT NULL DEFAULT 'lbs',
    "Percentage" NUMERIC(5,2),
    "SortOrder" INTEGER,
    "Lovibond" NUMERIC(4,1),
    "ExtractPotential" NUMERIC(5,3),
    "MustMash" BOOLEAN DEFAULT true,
    "MaxInBatch" NUMERIC(5,2),
    "AddAfterBoil" BOOLEAN DEFAULT false,
    "SteepTime" INTEGER,
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID,
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID,

    CONSTRAINT "FK_RecipeGrain_Recipe" FOREIGN KEY ("RecipeId")
        REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    CONSTRAINT "FK_RecipeGrain_Grain" FOREIGN KEY ("GrainId")
        REFERENCES "Grain"("GrainId") ON DELETE CASCADE,
    CONSTRAINT "FK_RecipeGrain_CreatedBy" FOREIGN KEY ("CreatedBy")
        REFERENCES "User"("UserId"),
    CONSTRAINT "FK_RecipeGrain_UpdatedBy" FOREIGN KEY ("UpdatedBy")
        REFERENCES "User"("UserId")
);

-- Create RecipeHop junction table
CREATE TABLE "RecipeHop" (
    "RecipeHopId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL,
    "HopId" UUID NOT NULL,
    "Amount" NUMERIC(8,3) NOT NULL,
    "Unit" VARCHAR(20) NOT NULL DEFAULT 'oz',
    "AdditionTime" INTEGER NOT NULL DEFAULT 60,
    "AdditionType" VARCHAR(50) NOT NULL DEFAULT 'Boil',
    "Form" VARCHAR(20) DEFAULT 'Pellet',
    "AlphaAcid" NUMERIC(4,2),
    "BetaAcid" NUMERIC(4,2),
    "HSI" NUMERIC(4,2),
    "IBUContribution" NUMERIC(5,1),
    "SortOrder" INTEGER,
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID,
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID,

    CONSTRAINT "FK_RecipeHop_Recipe" FOREIGN KEY ("RecipeId")
        REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    CONSTRAINT "FK_RecipeHop_Hop" FOREIGN KEY ("HopId")
        REFERENCES "Hop"("HopId") ON DELETE CASCADE,
    CONSTRAINT "FK_RecipeHop_CreatedBy" FOREIGN KEY ("CreatedBy")
        REFERENCES "User"("UserId"),
    CONSTRAINT "FK_RecipeHop_UpdatedBy" FOREIGN KEY ("UpdatedBy")
        REFERENCES "User"("UserId")
);

-- Create RecipeYeast junction table
CREATE TABLE "RecipeYeast" (
    "RecipeYeastId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL,
    "YeastId" UUID NOT NULL,
    "Amount" NUMERIC(8,3) NOT NULL,
    "Unit" VARCHAR(20) NOT NULL DEFAULT 'packages',
    "Attenuation" NUMERIC(4,2),
    "Temperature" NUMERIC(5,2),
    "Timeline" VARCHAR(50),
    "SortOrder" INTEGER,
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID,
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID,

    CONSTRAINT "FK_RecipeYeast_Recipe" FOREIGN KEY ("RecipeId")
        REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    CONSTRAINT "FK_RecipeYeast_Yeast" FOREIGN KEY ("YeastId")
        REFERENCES "Yeast"("YeastId") ON DELETE CASCADE,
    CONSTRAINT "FK_RecipeYeast_CreatedBy" FOREIGN KEY ("CreatedBy")
        REFERENCES "User"("UserId"),
    CONSTRAINT "FK_RecipeYeast_UpdatedBy" FOREIGN KEY ("UpdatedBy")
        REFERENCES "User"("UserId")
);

-- Create RecipeAdditive junction table
CREATE TABLE "RecipeAdditive" (
    "RecipeAdditiveId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL,
    "AdditiveId" UUID NOT NULL,
    "Amount" NUMERIC(8,3) NOT NULL,
    "Unit" VARCHAR(20) NOT NULL DEFAULT 'oz',
    "AdditionTime" INTEGER,
    "AdditionType" VARCHAR(50) DEFAULT 'Boil',
    "SortOrder" INTEGER,
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID,
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID,

    CONSTRAINT "FK_RecipeAdditive_Recipe" FOREIGN KEY ("RecipeId")
        REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    CONSTRAINT "FK_RecipeAdditive_Additive" FOREIGN KEY ("AdditiveId")
        REFERENCES "Additive"("AdditiveId") ON DELETE CASCADE,
    CONSTRAINT "FK_RecipeAdditive_CreatedBy" FOREIGN KEY ("CreatedBy")
        REFERENCES "User"("UserId"),
    CONSTRAINT "FK_RecipeAdditive_UpdatedBy" FOREIGN KEY ("UpdatedBy")
        REFERENCES "User"("UserId")
);

-- Create indexes for performance
CREATE INDEX "IX_RecipeGrain_RecipeId" ON "RecipeGrain"("RecipeId");
CREATE INDEX "IX_RecipeGrain_GrainId" ON "RecipeGrain"("GrainId");
CREATE INDEX "IX_RecipeGrain_SortOrder" ON "RecipeGrain"("SortOrder");

CREATE INDEX "IX_RecipeHop_RecipeId" ON "RecipeHop"("RecipeId");
CREATE INDEX "IX_RecipeHop_HopId" ON "RecipeHop"("HopId");
CREATE INDEX "IX_RecipeHop_SortOrder" ON "RecipeHop"("SortOrder");

CREATE INDEX "IX_RecipeYeast_RecipeId" ON "RecipeYeast"("RecipeId");
CREATE INDEX "IX_RecipeYeast_YeastId" ON "RecipeYeast"("YeastId");
CREATE INDEX "IX_RecipeYeast_SortOrder" ON "RecipeYeast"("SortOrder");

CREATE INDEX "IX_RecipeAdditive_RecipeId" ON "RecipeAdditive"("RecipeId");
CREATE INDEX "IX_RecipeAdditive_AdditiveId" ON "RecipeAdditive"("AdditiveId");
CREATE INDEX "IX_RecipeAdditive_SortOrder" ON "RecipeAdditive"("SortOrder");

-- Add Row Level Security policies for multi-tenancy
CREATE POLICY "tenant_isolation_recipe_grain" ON "RecipeGrain"
    USING (EXISTS (
        SELECT 1 FROM "Recipe" r
        WHERE r."RecipeId" = "RecipeGrain"."RecipeId"
        AND r."TenantId" = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY "tenant_isolation_recipe_hop" ON "RecipeHop"
    USING (EXISTS (
        SELECT 1 FROM "Recipe" r
        WHERE r."RecipeId" = "RecipeHop"."RecipeId"
        AND r."TenantId" = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY "tenant_isolation_recipe_yeast" ON "RecipeYeast"
    USING (EXISTS (
        SELECT 1 FROM "Recipe" r
        WHERE r."RecipeId" = "RecipeYeast"."RecipeId"
        AND r."TenantId" = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY "tenant_isolation_recipe_additive" ON "RecipeAdditive"
    USING (EXISTS (
        SELECT 1 FROM "Recipe" r
        WHERE r."RecipeId" = "RecipeAdditive"."RecipeId"
        AND r."TenantId" = current_setting('app.current_tenant_id')::uuid
    ));

-- Enable RLS on all junction tables
ALTER TABLE "RecipeGrain" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeHop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeYeast" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeAdditive" ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Log the migration
INSERT INTO "MigrationLog" ("MigrationName", "Applied")
VALUES ('040_rebuild_recipe_schema_to_match_diagram', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;