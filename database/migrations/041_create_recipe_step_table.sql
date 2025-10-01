-- Migration: Create RecipeStep table for comprehensive recipe workflow
-- Date: 2025-01-30
-- Description: Creates a general RecipeStep table that covers all brewing phases
--              (Mash, Boil, Fermentation, Conditioning, Packaging) to replace
--              the limited RecipeMashStep-only approach

-- Create RecipeStep table
CREATE TABLE IF NOT EXISTS "RecipeStep" (
    "RecipeStepId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL,
    "StepNumber" INTEGER NOT NULL,
    "Phase" VARCHAR(50) NOT NULL, -- Mash, Boil, Fermentation, Conditioning, Packaging
    "StepName" VARCHAR(100) NOT NULL,
    "StepType" VARCHAR(50), -- Temperature, Infusion, Decoction, Addition, Transfer, etc.
    "Duration" INTEGER, -- Duration in minutes
    "Temperature" DECIMAL(5,2),
    "TemperatureUnit" VARCHAR(10) DEFAULT '°F',
    "Amount" DECIMAL(6,2), -- For additions (hops, etc.) or infusions
    "AmountUnit" VARCHAR(20), -- oz, g, lbs, gallons, etc.
    "IngredientId" UUID, -- Link to Hop, Yeast, Additive, etc. if applicable
    "IngredientType" VARCHAR(50), -- Hop, Yeast, Additive, etc.
    "Description" TEXT,
    "Instructions" TEXT,
    "IsOptional" BOOLEAN NOT NULL DEFAULT FALSE,
    "AlertBefore" INTEGER, -- Minutes before step to alert brewer
    "Created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID,
    "Updated" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID,

    -- Foreign keys
    CONSTRAINT "FK_RecipeStep_Recipe" FOREIGN KEY ("RecipeId")
        REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,

    -- Unique constraint to prevent duplicate step numbers in same recipe
    CONSTRAINT "UQ_RecipeStep_RecipeId_StepNumber" UNIQUE ("RecipeId", "StepNumber")
);

-- Create indexes for performance
CREATE INDEX "IX_RecipeStep_RecipeId" ON "RecipeStep"("RecipeId");
CREATE INDEX "IX_RecipeStep_Phase" ON "RecipeStep"("Phase");
CREATE INDEX "IX_RecipeStep_StepNumber" ON "RecipeStep"("RecipeId", "StepNumber");

-- Add comments for documentation
COMMENT ON TABLE "RecipeStep" IS 'Comprehensive recipe steps covering all brewing phases: Mash, Boil, Fermentation, Conditioning, and Packaging';
COMMENT ON COLUMN "RecipeStep"."Phase" IS 'Brewing phase: Mash, Boil, Fermentation, Conditioning, or Packaging';
COMMENT ON COLUMN "RecipeStep"."StepType" IS 'Type of step: Temperature, Infusion, Decoction, Addition, Transfer, etc.';
COMMENT ON COLUMN "RecipeStep"."IngredientId" IS 'Optional link to ingredient (Hop, Yeast, Additive) for addition steps';
COMMENT ON COLUMN "RecipeStep"."AlertBefore" IS 'Minutes before step to alert brewer (for scheduled notifications)';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeStep" TO fermentum_app;
