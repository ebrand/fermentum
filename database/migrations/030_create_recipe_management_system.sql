-- Recipe Management System
-- Migration 030: Comprehensive recipe creation and tracking system

-- Beer Styles Reference Table (BJCP Categories)
CREATE TABLE "BeerStyle" (
    "StyleId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "BJCPNumber" VARCHAR(10), -- e.g., "21A", "14C"
    "StyleName" VARCHAR(100) NOT NULL, -- e.g., "American IPA", "Irish Stout"
    "Category" VARCHAR(50) NOT NULL, -- e.g., "IPA", "Stout", "Lager"
    "Description" TEXT,
    -- Style Guidelines
    "ABVMin" DECIMAL(4,2), -- Minimum alcohol by volume
    "ABVMax" DECIMAL(4,2), -- Maximum alcohol by volume
    "IBUMin" INTEGER, -- Minimum International Bitterness Units
    "IBUMax" INTEGER, -- Maximum International Bitterness Units
    "SRMMin" INTEGER, -- Minimum Standard Reference Method (color)
    "SRMMax" INTEGER, -- Maximum Standard Reference Method (color)
    "OGMin" DECIMAL(5,3), -- Minimum Original Gravity (e.g., 1.045)
    "OGMax" DECIMAL(5,3), -- Maximum Original Gravity
    "FGMin" DECIMAL(5,3), -- Minimum Final Gravity
    "FGMax" DECIMAL(5,3), -- Maximum Final Gravity
    -- Style Characteristics
    "Appearance" TEXT,
    "Aroma" TEXT,
    "Flavor" TEXT,
    "Mouthfeel" TEXT,
    "Comments" TEXT,
    "History" TEXT,
    "CharacteristicIngredients" TEXT,
    "StyleComparison" TEXT,
    "CommercialExamples" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Recipe Table
CREATE TABLE "Recipe" (
    "RecipeId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "StyleId" UUID REFERENCES "BeerStyle"("StyleId"),
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Version" INTEGER NOT NULL DEFAULT 1,
    "IsPublished" BOOLEAN DEFAULT FALSE,
    "IsActive" BOOLEAN DEFAULT TRUE,
    -- Batch Information
    "BatchSize" DECIMAL(8,3) NOT NULL, -- Target batch size
    "BatchSizeUnit" VARCHAR(20) NOT NULL DEFAULT 'gallons', -- gallons, liters, barrels
    "BoilSize" DECIMAL(8,3), -- Pre-boil volume
    "BoilTime" INTEGER DEFAULT 60, -- Boil time in minutes
    "Efficiency" DECIMAL(5,2) DEFAULT 75.0, -- Mash efficiency percentage
    -- Calculated Values (updated when recipe changes)
    "EstimatedOG" DECIMAL(5,3), -- Estimated Original Gravity
    "EstimatedFG" DECIMAL(5,3), -- Estimated Final Gravity
    "EstimatedABV" DECIMAL(4,2), -- Estimated Alcohol by Volume
    "EstimatedIBU" DECIMAL(5,1), -- Estimated International Bitterness Units
    "EstimatedSRM" DECIMAL(5,1), -- Estimated Standard Reference Method (color)
    "EstimatedCalories" INTEGER, -- Calories per 12oz serving
    -- Cost Information
    "EstimatedCostPerBatch" DECIMAL(10,2),
    "EstimatedCostPerGallon" DECIMAL(8,2),
    "EstimatedCostPer12oz" DECIMAL(6,2),
    -- Process Parameters
    "MashTemperature" DECIMAL(5,2), -- Primary mash temperature (°F)
    "MashTime" INTEGER, -- Primary mash time (minutes)
    "FermentationTemperature" DECIMAL(5,2), -- Primary fermentation temp (°F)
    "FermentationDays" INTEGER, -- Primary fermentation duration
    "ConditioningDays" INTEGER, -- Secondary/conditioning duration
    "CarbonationLevel" DECIMAL(3,1), -- Target CO2 volumes
    -- Water Profile
    "WaterProfileId" UUID, -- Reference to water chemistry profile
    "WaterVolume" DECIMAL(8,3), -- Total water needed
    "WaterVolumeUnit" VARCHAR(20) DEFAULT 'gallons',
    -- Notes and Instructions
    "BrewingNotes" TEXT,
    "FermentationNotes" TEXT,
    "PackagingNotes" TEXT,
    "TastingNotes" TEXT,
    "Brewer" VARCHAR(100), -- Recipe creator/brewer name
    "Tags" TEXT[], -- Searchable tags array
    -- Audit Fields
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),
    -- Constraints
    CONSTRAINT "UK_Recipe_TenantNameVersion" UNIQUE ("TenantId", "Name", "Version")
);

-- Recipe Grain/Malt Bill
CREATE TABLE "RecipeGrain" (
    "RecipeGrainId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId"),
    "Amount" DECIMAL(8,3) NOT NULL, -- Quantity of grain
    "Unit" VARCHAR(20) NOT NULL DEFAULT 'lbs', -- lbs, kg, oz
    "Percentage" DECIMAL(5,2), -- Percentage of total grain bill
    "SortOrder" INTEGER, -- Order in grain bill
    -- Malt Characteristics
    "Lovibond" DECIMAL(4,1), -- Color rating
    "ExtractPotential" DECIMAL(5,3), -- Specific gravity potential (e.g., 1.037)
    "MustMash" BOOLEAN DEFAULT TRUE, -- Requires mashing vs steeping
    "MaxInBatch" DECIMAL(5,2), -- Maximum percentage recommended
    -- Process Instructions
    "AddAfterBoil" BOOLEAN DEFAULT FALSE, -- For extracts added post-boil
    "SteepTime" INTEGER, -- Steeping time for specialty grains
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Hop Schedule
CREATE TABLE "RecipeHop" (
    "RecipeHopId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId"),
    "Amount" DECIMAL(6,3) NOT NULL, -- Quantity of hops
    "Unit" VARCHAR(20) NOT NULL DEFAULT 'oz', -- oz, grams, lbs
    -- Hop Addition Details
    "AdditionTime" INTEGER, -- Time in minutes (60 = 60 min boil, 0 = flameout)
    "AdditionType" VARCHAR(50) NOT NULL, -- boil, whirlpool, dry_hop, first_wort, mash_hop
    "Purpose" VARCHAR(50), -- bittering, flavor, aroma, dual_purpose
    "Form" VARCHAR(20), -- pellets, whole, extract, plug
    -- Hop Characteristics
    "AlphaAcid" DECIMAL(4,2), -- Alpha acid percentage
    "BetaAcid" DECIMAL(4,2), -- Beta acid percentage
    "Cohumulone" DECIMAL(4,1), -- Cohumulone percentage
    "TotalOil" DECIMAL(4,2), -- Total oil content
    -- Calculated Values
    "IBUContribution" DECIMAL(5,1), -- Calculated IBU contribution
    "UtilizationRate" DECIMAL(5,2), -- Alpha acid utilization rate
    -- Dry Hop Specific
    "DryHopDays" INTEGER, -- Days for dry hopping
    "DryHopTemperature" DECIMAL(5,2), -- Temperature for dry hopping
    -- Instructions
    "SortOrder" INTEGER, -- Order in hop schedule
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Yeast Information
CREATE TABLE "RecipeYeast" (
    "RecipeYeastId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId"),
    "Amount" DECIMAL(6,2) NOT NULL, -- Quantity
    "Unit" VARCHAR(20) NOT NULL DEFAULT 'packages', -- packages, grams, ml, cells
    -- Yeast Characteristics
    "YeastType" VARCHAR(50), -- ale, lager, wild, bacteria
    "Form" VARCHAR(20), -- liquid, dry, slant, starter
    "Attenuation" DECIMAL(4,1), -- Expected attenuation percentage
    "Flocculation" VARCHAR(20), -- low, medium, high
    "ToleranceABV" DECIMAL(4,1), -- Alcohol tolerance
    "TemperatureMin" DECIMAL(5,2), -- Minimum fermentation temperature
    "TemperatureMax" DECIMAL(5,2), -- Maximum fermentation temperature
    "TemperatureOptimal" DECIMAL(5,2), -- Optimal fermentation temperature
    -- Starter Information
    "RequiresStarter" BOOLEAN DEFAULT FALSE,
    "StarterSize" DECIMAL(6,1), -- Starter size in ml
    "StarterGravity" DECIMAL(5,3), -- Starter wort gravity
    -- Process Notes
    "PitchingTemperature" DECIMAL(5,2),
    "FermentationNotes" TEXT,
    "SortOrder" INTEGER,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Additives (Water Salts, Nutrients, Clarifiers, etc.)
CREATE TABLE "RecipeAdditive" (
    "RecipeAdditiveId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId"),
    "Amount" DECIMAL(8,3) NOT NULL,
    "Unit" VARCHAR(20) NOT NULL, -- grams, tsp, tablets, ml
    "AdditionTime" INTEGER, -- When to add (minutes from start)
    "AdditionStage" VARCHAR(50), -- mash, boil, primary, secondary, packaging
    "Purpose" VARCHAR(100), -- water_adjustment, yeast_nutrient, clarifier, etc.
    "TargetParameter" VARCHAR(50), -- calcium, ph, clarity, etc.
    "TargetValue" DECIMAL(8,3), -- Target value for parameter
    "Instructions" TEXT,
    "SortOrder" INTEGER,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mash Schedule (Step Mashing)
CREATE TABLE "RecipeMashStep" (
    "MashStepId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    "StepNumber" INTEGER NOT NULL,
    "StepName" VARCHAR(100), -- protein_rest, saccharification, mash_out
    "StepType" VARCHAR(50), -- temperature, decoction, infusion
    "Temperature" DECIMAL(5,2) NOT NULL, -- Step temperature
    "TemperatureUnit" VARCHAR(10) DEFAULT '°F',
    "Duration" INTEGER NOT NULL, -- Duration in minutes
    "InfusionAmount" DECIMAL(6,2), -- Amount of water to add (for infusion)
    "InfusionTemp" DECIMAL(5,2), -- Temperature of infusion water
    "Description" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UK_RecipeMashStep_RecipeStep" UNIQUE ("RecipeId", "StepNumber")
);

-- Water Chemistry Profiles
CREATE TABLE "WaterProfile" (
    "WaterProfileId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "Name" VARCHAR(100) NOT NULL, -- e.g., "Burton-on-Trent", "Pilsen"
    "Description" TEXT,
    "IsDefault" BOOLEAN DEFAULT FALSE,
    -- Ion Concentrations (ppm)
    "Calcium" DECIMAL(6,2),
    "Magnesium" DECIMAL(6,2),
    "Sodium" DECIMAL(6,2),
    "Sulfate" DECIMAL(6,2),
    "Chloride" DECIMAL(6,2),
    "Bicarbonate" DECIMAL(6,2),
    -- Calculated Values
    "TotalHardness" DECIMAL(6,2), -- Total hardness as CaCO3
    "TotalAlkalinity" DECIMAL(6,2), -- Alkalinity as CaCO3
    "ResidualAlkalinity" DECIMAL(6,2), -- Residual alkalinity
    "SulfateToChlorideRatio" DECIMAL(5,2), -- SO4:Cl ratio
    -- pH Information
    "TargetMashPH" DECIMAL(3,2), -- Target mash pH
    "EstimatedMashPH" DECIMAL(3,2), -- Estimated mash pH
    -- Source Water Info
    "SourceWaterName" VARCHAR(100), -- Municipal, well, etc.
    "SourceWaterNotes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),
    CONSTRAINT "UK_WaterProfile_TenantName" UNIQUE ("TenantId", "Name")
);

-- Recipe Versions/History
CREATE TABLE "RecipeVersion" (
    "VersionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId"),
    "VersionNumber" INTEGER NOT NULL,
    "VersionName" VARCHAR(100), -- e.g., "Initial", "Hop Adjustment", "Final"
    "ChangeDescription" TEXT,
    "ChangeReason" VARCHAR(200), -- taste_adjustment, cost_optimization, etc.
    "RecipeData" JSONB, -- Complete recipe snapshot
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    CONSTRAINT "UK_RecipeVersion_RecipeVersion" UNIQUE ("RecipeId", "VersionNumber")
);

-- Recipe Brewing Sessions (Links recipes to actual production batches)
CREATE TABLE "RecipeBrewSession" (
    "BrewSessionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId"),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "BatchNumber" VARCHAR(50) NOT NULL, -- Unique batch identifier
    "BrewDate" DATE NOT NULL,
    "Brewer" VARCHAR(100),
    "ActualBatchSize" DECIMAL(8,3),
    "ActualEfficiency" DECIMAL(5,2),
    -- Actual Measurements
    "ActualOG" DECIMAL(5,3),
    "ActualFG" DECIMAL(5,3),
    "ActualABV" DECIMAL(4,2),
    "ActualIBU" DECIMAL(5,1),
    "ActualSRM" DECIMAL(5,1),
    "ActualPH" DECIMAL(3,2),
    -- Process Deviations
    "ProcessDeviations" TEXT,
    "QualityNotes" TEXT,
    "TastingNotes" TEXT,
    "BrewingNotes" TEXT,
    -- Cost Tracking
    "ActualCost" DECIMAL(10,2),
    "CostVariance" DECIMAL(10,2), -- Difference from estimated
    -- Status
    "Status" VARCHAR(50) DEFAULT 'planning', -- planning, brewing, fermenting, conditioning, packaged, completed
    "CompletedDate" DATE,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),
    CONSTRAINT "UK_RecipeBrewSession_TenantBatch" UNIQUE ("TenantId", "BatchNumber")
);

-- Recipe Costing (Links to inventory costs)
CREATE TABLE "RecipeCost" (
    "RecipeCostId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" UUID NOT NULL REFERENCES "Recipe"("RecipeId"),
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId"),
    "MaterialType" VARCHAR(50), -- grain, hop, yeast, additive
    "Quantity" DECIMAL(8,3),
    "Unit" VARCHAR(20),
    "UnitCost" DECIMAL(10,4),
    "TotalCost" DECIMAL(10,2),
    "CostPerBatch" DECIMAL(10,2),
    "CostPerGallon" DECIMAL(8,2),
    "CostPer12oz" DECIMAL(6,2),
    "CalculatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Beer Styles (BJCP 2021 Examples)
INSERT INTO "BeerStyle" ("BJCPNumber", "StyleName", "Category", "ABVMin", "ABVMax", "IBUMin", "IBUMax", "SRMMin", "SRMMax", "OGMin", "OGMax", "FGMin", "FGMax", "Description") VALUES
('21A', 'American IPA', 'IPA', 5.5, 7.5, 40, 70, 6, 14, 1.056, 1.070, 1.008, 1.014, 'A decidedly hoppy and bitter, moderately strong American pale ale'),
('13C', 'English Porter', 'Porter', 4.0, 5.4, 18, 35, 20, 30, 1.040, 1.052, 1.008, 1.014, 'A moderate-strength brown beer with a restrained roasty character and bitterness'),
('15A', 'Irish Stout', 'Stout', 4.0, 4.5, 25, 45, 25, 40, 1.036, 1.044, 1.007, 1.011, 'A black beer with a pronounced roasted flavor, often resembling coffee'),
('18B', 'American Pale Ale', 'Pale Ale', 4.5, 6.2, 30, 50, 5, 10, 1.045, 1.060, 1.010, 1.015, 'A pale, refreshing and hoppy ale, yet with sufficient supporting malt to make the beer balanced'),
('4A', 'Munich Helles', 'Lager', 4.7, 5.4, 16, 22, 3, 5, 1.044, 1.048, 1.006, 1.012, 'A clean, malty German lager with a smooth Pilsner malt sweetness'),
('2A', 'International Pale Lager', 'Lager', 4.6, 6.0, 18, 25, 2, 6, 1.042, 1.050, 1.008, 1.012, 'A highly-attenuated pale lager without strong flavors'),
('11A', 'Ordinary Bitter', 'Bitter', 3.2, 3.8, 25, 35, 8, 14, 1.030, 1.039, 1.007, 1.011, 'Low gravity, alcohol, and carbonation make it an easy-drinking session beer'),
('1D', 'American Wheat Beer', 'Wheat Beer', 4.0, 5.5, 15, 30, 3, 6, 1.040, 1.055, 1.008, 1.013, 'Refreshing wheat beers that can display more hop character and less yeast character'),
('9A', 'Doppelbock', 'Bock', 7.0, 10.0, 16, 26, 6, 25, 1.072, 1.112, 1.016, 1.024, 'A very strong and malty German lager beer'),
('22A', 'Double IPA', 'IPA', 7.5, 10.0, 60, 120, 6, 14, 1.065, 1.085, 1.008, 1.018, 'An intensely hoppy, fairly strong pale ale without the big, rich, complex maltiness');

-- Create indexes for performance
CREATE INDEX "IX_Recipe_TenantId" ON "Recipe"("TenantId");
CREATE INDEX "IX_Recipe_StyleId" ON "Recipe"("StyleId");
CREATE INDEX "IX_Recipe_IsPublished" ON "Recipe"("IsPublished");
CREATE INDEX "IX_Recipe_Created" ON "Recipe"("Created");
CREATE INDEX "IX_RecipeGrain_RecipeId" ON "RecipeGrain"("RecipeId");
CREATE INDEX "IX_RecipeGrain_MaterialId" ON "RecipeGrain"("MaterialId");
CREATE INDEX "IX_RecipeHop_RecipeId" ON "RecipeHop"("RecipeId");
CREATE INDEX "IX_RecipeHop_MaterialId" ON "RecipeHop"("MaterialId");
CREATE INDEX "IX_RecipeHop_AdditionType" ON "RecipeHop"("AdditionType");
CREATE INDEX "IX_RecipeYeast_RecipeId" ON "RecipeYeast"("RecipeId");
CREATE INDEX "IX_RecipeBrewSession_TenantId" ON "RecipeBrewSession"("TenantId");
CREATE INDEX "IX_RecipeBrewSession_BrewDate" ON "RecipeBrewSession"("BrewDate");
CREATE INDEX "IX_RecipeBrewSession_Status" ON "RecipeBrewSession"("Status");
CREATE INDEX "IX_WaterProfile_TenantId" ON "WaterProfile"("TenantId");
CREATE INDEX "IX_BeerStyle_Category" ON "BeerStyle"("Category");
CREATE INDEX "IX_BeerStyle_BJCPNumber" ON "BeerStyle"("BJCPNumber");

-- Row Level Security
ALTER TABLE "Recipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeGrain" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeHop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeYeast" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeAdditive" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeMashStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WaterProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeBrewSession" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY "tenant_isolation_recipe" ON "Recipe"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_recipe_grain" ON "RecipeGrain"
    USING (EXISTS (SELECT 1 FROM "Recipe" r WHERE r."RecipeId" = "RecipeGrain"."RecipeId" AND r."TenantId" = current_setting('app.current_tenant_id')::UUID));

CREATE POLICY "tenant_isolation_recipe_hop" ON "RecipeHop"
    USING (EXISTS (SELECT 1 FROM "Recipe" r WHERE r."RecipeId" = "RecipeHop"."RecipeId" AND r."TenantId" = current_setting('app.current_tenant_id')::UUID));

CREATE POLICY "tenant_isolation_recipe_yeast" ON "RecipeYeast"
    USING (EXISTS (SELECT 1 FROM "Recipe" r WHERE r."RecipeId" = "RecipeYeast"."RecipeId" AND r."TenantId" = current_setting('app.current_tenant_id')::UUID));

CREATE POLICY "tenant_isolation_recipe_additive" ON "RecipeAdditive"
    USING (EXISTS (SELECT 1 FROM "Recipe" r WHERE r."RecipeId" = "RecipeAdditive"."RecipeId" AND r."TenantId" = current_setting('app.current_tenant_id')::UUID));

CREATE POLICY "tenant_isolation_recipe_mash_step" ON "RecipeMashStep"
    USING (EXISTS (SELECT 1 FROM "Recipe" r WHERE r."RecipeId" = "RecipeMashStep"."RecipeId" AND r."TenantId" = current_setting('app.current_tenant_id')::UUID));

CREATE POLICY "tenant_isolation_water_profile" ON "WaterProfile"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_recipe_brew_session" ON "RecipeBrewSession"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON "BeerStyle" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Recipe" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeGrain" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeHop" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeYeast" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeAdditive" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeMashStep" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "WaterProfile" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeVersion" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeBrewSession" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeCost" TO fermentum_app;