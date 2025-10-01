-- Migration: Create comprehensive BJCP beer style schema
-- Date: 2025-01-27
-- Description: Creates all tables for BJCP beer style management with relationships

BEGIN;

-- ============================================================================
-- CORE BJCP TABLES
-- ============================================================================

-- Beer Categories (BJCP Categories 1-34, X)
CREATE TABLE "BeerCategory" (
    "CategoryId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "CategoryNumber" varchar(10) NOT NULL UNIQUE, -- "1", "2", "X"
    "CategoryName" varchar(100) NOT NULL,
    "Description" text,
    "SortOrder" int,
    "IsActive" boolean DEFAULT true,
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "Updated" timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Style Tags for categorization and search
CREATE TABLE "StyleTag" (
    "TagId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TagName" varchar(50) NOT NULL UNIQUE,
    "Category" varchar(30), -- 'strength', 'color', 'flavor-profile', 'origin', 'fermentation'
    "Description" text,
    "Color" varchar(7), -- hex color for UI display
    "SortOrder" int,
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Update existing BeerStyle table to add category relationship
ALTER TABLE "BeerStyle" ADD COLUMN IF NOT EXISTS "CategoryId" uuid;
ALTER TABLE "BeerStyle" ADD CONSTRAINT "FK_BeerStyle_Category"
    FOREIGN KEY ("CategoryId") REFERENCES "BeerCategory"("CategoryId");

-- Style-Tag many-to-many relationship
CREATE TABLE "StyleTagMapping" (
    "StyleId" uuid NOT NULL,
    "TagId" uuid NOT NULL,
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("StyleId", "TagId"),
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    FOREIGN KEY ("TagId") REFERENCES "StyleTag"("TagId") ON DELETE CASCADE
);

-- ============================================================================
-- STYLE CHARACTERISTICS AND DETAILS
-- ============================================================================

-- Detailed style characteristics broken down by type
CREATE TABLE "StyleCharacteristics" (
    "CharacteristicId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "StyleId" uuid NOT NULL,
    "CharacteristicType" varchar(50) NOT NULL, -- 'aroma', 'appearance', 'flavor', 'mouthfeel'
    "Description" text NOT NULL,
    "Keywords" text[], -- searchable keywords extracted from descriptions
    "Priority" int DEFAULT 1, -- 1=primary, 2=secondary, 3=subtle
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE
);

-- Commercial examples of each style
CREATE TABLE "CommercialExample" (
    "ExampleId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "StyleId" uuid NOT NULL,
    "BeerName" varchar(100) NOT NULL,
    "BreweryName" varchar(100),
    "Country" varchar(50),
    "IsActive" boolean DEFAULT true,
    "Availability" varchar(50), -- 'year-round', 'seasonal', 'limited', 'discontinued'
    "Notes" text,
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "Updated" timestamptz DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE
);

-- Style comparison relationships
CREATE TABLE "StyleComparison" (
    "ComparisonId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "PrimaryStyleId" uuid NOT NULL,
    "ComparedStyleId" uuid NOT NULL,
    "ComparisonText" text NOT NULL,
    "Relationship" varchar(30), -- 'similar', 'stronger', 'darker', 'hoppier', 'maltier'
    "ComparisonType" varchar(20) DEFAULT 'similarity', -- 'similarity', 'difference', 'progression'
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("PrimaryStyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    FOREIGN KEY ("ComparedStyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    CONSTRAINT "UK_StyleComparison_Pair" UNIQUE ("PrimaryStyleId", "ComparedStyleId")
);

-- ============================================================================
-- BREWING RECOMMENDATIONS
-- ============================================================================

-- Style-specific brewing recommendations
CREATE TABLE "StyleRecommendation" (
    "RecommendationId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "StyleId" uuid NOT NULL,
    "RecommendationType" varchar(30) NOT NULL, -- 'ingredient', 'process', 'fermentation', 'water'
    "Title" varchar(100) NOT NULL,
    "Description" text NOT NULL,
    "Priority" int DEFAULT 1, -- 1=essential, 2=recommended, 3=optional
    "Phase" varchar(30), -- 'planning', 'mashing', 'boiling', 'fermentation', 'conditioning'
    "IsActive" boolean DEFAULT true,
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId")
);

-- ============================================================================
-- RECIPE ENHANCEMENT TABLES
-- ============================================================================

-- Recipe-Style matching and analysis
CREATE TABLE "RecipeStyleMatch" (
    "MatchId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" uuid NOT NULL,
    "StyleId" uuid NOT NULL,
    "MatchPercentage" decimal(5,2) NOT NULL CHECK ("MatchPercentage" >= 0 AND "MatchPercentage" <= 100),
    "IsWithinGuidelines" boolean NOT NULL,
    "ParameterMatches" jsonb, -- detailed breakdown: {"og": {"value": 1.045, "inRange": true, "target": "1.044-1.052"}}
    "Recommendations" text[], -- suggestions to better match the style
    "CalculatedDate" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "CalculationVersion" varchar(20) DEFAULT '1.0',
    FOREIGN KEY ("RecipeId") REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    CONSTRAINT "UK_RecipeStyleMatch" UNIQUE ("RecipeId", "StyleId")
);

-- ============================================================================
-- COMPETITION AND JUDGING
-- ============================================================================

-- Style judging criteria and scoring
CREATE TABLE "StyleJudging" (
    "JudgingId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "StyleId" uuid NOT NULL,
    "JudgingCriteria" jsonb NOT NULL, -- scoring rubric and weight for each aspect
    "CommonFaults" text[],
    "JudgingNotes" text,
    "ScoringWeights" jsonb, -- {"aroma": 12, "appearance": 3, "flavor": 20, "mouthfeel": 5, "overall": 10}
    "Version" varchar(20) DEFAULT 'BJCP2021',
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE
);

-- Competition entries and results
CREATE TABLE "RecipeCompetitionEntry" (
    "EntryId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "RecipeId" uuid NOT NULL,
    "StyleId" uuid NOT NULL,
    "TenantId" uuid NOT NULL,
    "CompetitionName" varchar(200),
    "CompetitionType" varchar(50), -- 'BJCP', 'local', 'homebrew-club', 'commercial'
    "EntryDate" date,
    "JudgingDate" date,
    "Score" decimal(4,1) CHECK ("Score" >= 0 AND "Score" <= 50), -- BJCP scoring 0.0-50.0
    "Feedback" text,
    "Placement" varchar(50), -- "Gold", "Silver", "Bronze", "Honorable Mention"
    "JudgeNotes" text,
    "EntryFee" decimal(8,2),
    "Status" varchar(30) DEFAULT 'entered', -- 'entered', 'judged', 'awarded', 'withdrawn'
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    FOREIGN KEY ("RecipeId") REFERENCES "Recipe"("RecipeId") ON DELETE CASCADE,
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId"),
    FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId"),
    FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId")
);

-- ============================================================================
-- ANALYTICS AND TRENDS
-- ============================================================================

-- Style popularity and trends
CREATE TABLE "StylePopularity" (
    "PopularityId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "StyleId" uuid NOT NULL,
    "Period" varchar(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    "PeriodDate" date NOT NULL,
    "RecipeCount" int DEFAULT 0,
    "BrewSessionCount" int DEFAULT 0,
    "TenantCount" int DEFAULT 0,
    "TrendDirection" varchar(20), -- 'increasing', 'decreasing', 'stable'
    "TrendPercentage" decimal(5,2), -- percentage change from previous period
    "Rank" int, -- rank among all styles for this period
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    CONSTRAINT "UK_StylePopularity_Period" UNIQUE ("StyleId", "Period", "PeriodDate")
);

-- Aggregated analytics across recipes for each style
CREATE TABLE "StyleAnalytics" (
    "AnalyticsId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "StyleId" uuid NOT NULL,
    "AnalysisDate" date NOT NULL,
    "RecipesSampled" int NOT NULL,
    -- Average values from actual recipes
    "AvgOG" decimal(5,3),
    "AvgFG" decimal(5,3),
    "AvgABV" decimal(4,2),
    "AvgIBU" decimal(5,1),
    "AvgSRM" decimal(5,1),
    "AvgEfficiency" decimal(5,2),
    "AvgBatchSize" decimal(8,3),
    -- Most common ingredients (JSON arrays with usage percentages)
    "CommonGrains" jsonb, -- [{"name": "Pale 2-Row", "usage_percent": 85.5}]
    "CommonHops" jsonb,
    "CommonYeasts" jsonb,
    "CommonAdditives" jsonb,
    -- Cost analysis
    "AvgCostPerBatch" decimal(10,2),
    "AvgCostPerGallon" decimal(8,2),
    "AvgCostPer12oz" decimal(6,2),
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    CONSTRAINT "UK_StyleAnalytics_Date" UNIQUE ("StyleId", "AnalysisDate")
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Category indexes
CREATE INDEX "IX_BeerCategory_CategoryNumber" ON "BeerCategory"("CategoryNumber");
CREATE INDEX "IX_BeerCategory_SortOrder" ON "BeerCategory"("SortOrder");

-- Style indexes (some may already exist)
CREATE INDEX IF NOT EXISTS "IX_BeerStyle_CategoryId" ON "BeerStyle"("CategoryId");
CREATE INDEX IF NOT EXISTS "IX_BeerStyle_BJCPNumber" ON "BeerStyle"("BJCPNumber");
CREATE INDEX IF NOT EXISTS "IX_BeerStyle_StyleName" ON "BeerStyle"("StyleName");
CREATE INDEX IF NOT EXISTS "IX_BeerStyle_Category" ON "BeerStyle"("Category");

-- Tag indexes
CREATE INDEX "IX_StyleTag_Category" ON "StyleTag"("Category");
CREATE INDEX "IX_StyleTag_TagName" ON "StyleTag"("TagName");
CREATE INDEX "IX_StyleTagMapping_TagId" ON "StyleTagMapping"("TagId");

-- Characteristics indexes
CREATE INDEX "IX_StyleCharacteristics_StyleId" ON "StyleCharacteristics"("StyleId");
CREATE INDEX "IX_StyleCharacteristics_Type" ON "StyleCharacteristics"("CharacteristicType");
CREATE INDEX "IX_StyleCharacteristics_Keywords" ON "StyleCharacteristics" USING GIN("Keywords");

-- Commercial examples indexes
CREATE INDEX "IX_CommercialExample_StyleId" ON "CommercialExample"("StyleId");
CREATE INDEX "IX_CommercialExample_Country" ON "CommercialExample"("Country");
CREATE INDEX "IX_CommercialExample_Active" ON "CommercialExample"("IsActive");

-- Comparison indexes
CREATE INDEX "IX_StyleComparison_Primary" ON "StyleComparison"("PrimaryStyleId");
CREATE INDEX "IX_StyleComparison_Compared" ON "StyleComparison"("ComparedStyleId");
CREATE INDEX "IX_StyleComparison_Relationship" ON "StyleComparison"("Relationship");

-- Recipe match indexes
CREATE INDEX "IX_RecipeStyleMatch_RecipeId" ON "RecipeStyleMatch"("RecipeId");
CREATE INDEX "IX_RecipeStyleMatch_StyleId" ON "RecipeStyleMatch"("StyleId");
CREATE INDEX "IX_RecipeStyleMatch_InGuidelines" ON "RecipeStyleMatch"("IsWithinGuidelines");
CREATE INDEX "IX_RecipeStyleMatch_Percentage" ON "RecipeStyleMatch"("MatchPercentage" DESC);

-- Competition indexes
CREATE INDEX "IX_RecipeCompetitionEntry_StyleId" ON "RecipeCompetitionEntry"("StyleId");
CREATE INDEX "IX_RecipeCompetitionEntry_TenantId" ON "RecipeCompetitionEntry"("TenantId");
CREATE INDEX "IX_RecipeCompetitionEntry_EntryDate" ON "RecipeCompetitionEntry"("EntryDate");
CREATE INDEX "IX_RecipeCompetitionEntry_Score" ON "RecipeCompetitionEntry"("Score" DESC);

-- Analytics indexes
CREATE INDEX "IX_StylePopularity_StyleId" ON "StylePopularity"("StyleId");
CREATE INDEX "IX_StylePopularity_Period" ON "StylePopularity"("Period", "PeriodDate");
CREATE INDEX "IX_StylePopularity_Rank" ON "StylePopularity"("Rank");

CREATE INDEX "IX_StyleAnalytics_StyleId" ON "StyleAnalytics"("StyleId");
CREATE INDEX "IX_StyleAnalytics_Date" ON "StyleAnalytics"("AnalysisDate");

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tenant-specific tables
ALTER TABLE "RecipeCompetitionEntry" ENABLE ROW LEVEL SECURITY;

-- RLS policy for competition entries (tenant isolation)
CREATE POLICY "tenant_competition_entries" ON "RecipeCompetitionEntry"
    FOR ALL
    USING ("TenantId"::text = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- TRIGGERS FOR MAINTENANCE
-- ============================================================================

-- Update timestamps trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."Updated" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER "update_BeerCategory_updated"
    BEFORE UPDATE ON "BeerCategory"
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();

CREATE TRIGGER "update_CommercialExample_updated"
    BEFORE UPDATE ON "CommercialExample"
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON "BeerCategory" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StyleTag" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StyleTagMapping" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StyleCharacteristics" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "CommercialExample" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StyleComparison" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StyleRecommendation" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeStyleMatch" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StyleJudging" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecipeCompetitionEntry" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StylePopularity" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StyleAnalytics" TO fermentum_app;

COMMIT;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- This migration creates a comprehensive BJCP beer style management system:
--
-- 1. Core Tables:
--    - BeerCategory: BJCP category organization
--    - StyleTag: Flexible tagging system for styles
--    - Enhanced BeerStyle table with category relationships
--
-- 2. Content Tables:
--    - StyleCharacteristics: Detailed style descriptions
--    - CommercialExample: Reference beers for each style
--    - StyleComparison: Style relationships and comparisons
--
-- 3. Brewing Enhancement:
--    - StyleRecommendation: Brewing guidance for each style
--    - RecipeStyleMatch: AI-powered recipe analysis
--
-- 4. Competition & Quality:
--    - StyleJudging: BJCP judging criteria
--    - RecipeCompetitionEntry: Competition tracking
--
-- 5. Analytics:
--    - StylePopularity: Trend analysis
--    - StyleAnalytics: Recipe aggregation and insights
--
-- Next steps:
-- 1. Run the data population script to load BJCP2.json data
-- 2. Create C# models for the new tables
-- 3. Implement API endpoints for style management
-- 4. Build UI components for style browsing and selection