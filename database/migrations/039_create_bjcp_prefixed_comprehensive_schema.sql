-- Migration: Create comprehensive BJCP beer style schema with BJCP_ prefix
-- Date: 2025-01-27
-- Description: Creates all tables for BJCP beer style management with relationships, prefixed with BJCP_

BEGIN;

-- ============================================================================
-- CORE BJCP TABLES
-- ============================================================================

-- Beer Categories (BJCP Categories 1-34, X)
CREATE TABLE "BJCP_BeerCategory" (
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
CREATE TABLE "BJCP_StyleTag" (
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
ALTER TABLE "BeerStyle" ADD CONSTRAINT "FK_BeerStyle_BJCP_Category"
    FOREIGN KEY ("CategoryId") REFERENCES "BJCP_BeerCategory"("CategoryId");

-- Style-Tag many-to-many relationship
CREATE TABLE "BJCP_StyleTagMapping" (
    "StyleId" uuid NOT NULL,
    "TagId" uuid NOT NULL,
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("StyleId", "TagId"),
    FOREIGN KEY ("StyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    FOREIGN KEY ("TagId") REFERENCES "BJCP_StyleTag"("TagId") ON DELETE CASCADE
);

-- ============================================================================
-- STYLE CHARACTERISTICS AND DETAILS
-- ============================================================================

-- Detailed style characteristics broken down by type
CREATE TABLE "BJCP_StyleCharacteristics" (
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
CREATE TABLE "BJCP_CommercialExample" (
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
CREATE TABLE "BJCP_StyleComparison" (
    "ComparisonId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "PrimaryStyleId" uuid NOT NULL,
    "ComparedStyleId" uuid NOT NULL,
    "ComparisonText" text NOT NULL,
    "Relationship" varchar(30), -- 'similar', 'stronger', 'darker', 'hoppier', 'maltier'
    "ComparisonType" varchar(20) DEFAULT 'similarity', -- 'similarity', 'difference', 'progression'
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("PrimaryStyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    FOREIGN KEY ("ComparedStyleId") REFERENCES "BeerStyle"("StyleId") ON DELETE CASCADE,
    CONSTRAINT "UK_BJCP_StyleComparison_Pair" UNIQUE ("PrimaryStyleId", "ComparedStyleId")
);

-- ============================================================================
-- BREWING RECOMMENDATIONS
-- ============================================================================

-- Style-specific brewing recommendations
CREATE TABLE "BJCP_StyleRecommendation" (
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
CREATE TABLE "BJCP_RecipeStyleMatch" (
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
    CONSTRAINT "UK_BJCP_RecipeStyleMatch" UNIQUE ("RecipeId", "StyleId")
);

-- ============================================================================
-- COMPETITION AND JUDGING
-- ============================================================================

-- Style judging criteria and scoring
CREATE TABLE "BJCP_StyleJudging" (
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
CREATE TABLE "BJCP_RecipeCompetitionEntry" (
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
CREATE TABLE "BJCP_StylePopularity" (
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
    CONSTRAINT "UK_BJCP_StylePopularity_Period" UNIQUE ("StyleId", "Period", "PeriodDate")
);

-- Aggregated analytics across recipes for each style
CREATE TABLE "BJCP_StyleAnalytics" (
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
    CONSTRAINT "UK_BJCP_StyleAnalytics_Date" UNIQUE ("StyleId", "AnalysisDate")
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Category indexes
CREATE INDEX "IX_BJCP_BeerCategory_CategoryNumber" ON "BJCP_BeerCategory"("CategoryNumber");
CREATE INDEX "IX_BJCP_BeerCategory_SortOrder" ON "BJCP_BeerCategory"("SortOrder");

-- Style indexes (some may already exist)
CREATE INDEX IF NOT EXISTS "IX_BeerStyle_CategoryId" ON "BeerStyle"("CategoryId");
CREATE INDEX IF NOT EXISTS "IX_BeerStyle_BJCPNumber" ON "BeerStyle"("BJCPNumber");
CREATE INDEX IF NOT EXISTS "IX_BeerStyle_StyleName" ON "BeerStyle"("StyleName");
CREATE INDEX IF NOT EXISTS "IX_BeerStyle_Category" ON "BeerStyle"("Category");

-- Tag indexes
CREATE INDEX "IX_BJCP_StyleTag_Category" ON "BJCP_StyleTag"("Category");
CREATE INDEX "IX_BJCP_StyleTag_TagName" ON "BJCP_StyleTag"("TagName");
CREATE INDEX "IX_BJCP_StyleTagMapping_TagId" ON "BJCP_StyleTagMapping"("TagId");

-- Characteristics indexes
CREATE INDEX "IX_BJCP_StyleCharacteristics_StyleId" ON "BJCP_StyleCharacteristics"("StyleId");
CREATE INDEX "IX_BJCP_StyleCharacteristics_Type" ON "BJCP_StyleCharacteristics"("CharacteristicType");
CREATE INDEX "IX_BJCP_StyleCharacteristics_Keywords" ON "BJCP_StyleCharacteristics" USING GIN("Keywords");

-- Commercial examples indexes
CREATE INDEX "IX_BJCP_CommercialExample_StyleId" ON "BJCP_CommercialExample"("StyleId");
CREATE INDEX "IX_BJCP_CommercialExample_Country" ON "BJCP_CommercialExample"("Country");
CREATE INDEX "IX_BJCP_CommercialExample_Active" ON "BJCP_CommercialExample"("IsActive");

-- Comparison indexes
CREATE INDEX "IX_BJCP_StyleComparison_Primary" ON "BJCP_StyleComparison"("PrimaryStyleId");
CREATE INDEX "IX_BJCP_StyleComparison_Compared" ON "BJCP_StyleComparison"("ComparedStyleId");
CREATE INDEX "IX_BJCP_StyleComparison_Relationship" ON "BJCP_StyleComparison"("Relationship");

-- Recipe match indexes
CREATE INDEX "IX_BJCP_RecipeStyleMatch_RecipeId" ON "BJCP_RecipeStyleMatch"("RecipeId");
CREATE INDEX "IX_BJCP_RecipeStyleMatch_StyleId" ON "BJCP_RecipeStyleMatch"("StyleId");
CREATE INDEX "IX_BJCP_RecipeStyleMatch_InGuidelines" ON "BJCP_RecipeStyleMatch"("IsWithinGuidelines");
CREATE INDEX "IX_BJCP_RecipeStyleMatch_Percentage" ON "BJCP_RecipeStyleMatch"("MatchPercentage" DESC);

-- Competition indexes
CREATE INDEX "IX_BJCP_RecipeCompetitionEntry_StyleId" ON "BJCP_RecipeCompetitionEntry"("StyleId");
CREATE INDEX "IX_BJCP_RecipeCompetitionEntry_TenantId" ON "BJCP_RecipeCompetitionEntry"("TenantId");
CREATE INDEX "IX_BJCP_RecipeCompetitionEntry_EntryDate" ON "BJCP_RecipeCompetitionEntry"("EntryDate");
CREATE INDEX "IX_BJCP_RecipeCompetitionEntry_Score" ON "BJCP_RecipeCompetitionEntry"("Score" DESC);

-- Analytics indexes
CREATE INDEX "IX_BJCP_StylePopularity_StyleId" ON "BJCP_StylePopularity"("StyleId");
CREATE INDEX "IX_BJCP_StylePopularity_Period" ON "BJCP_StylePopularity"("Period", "PeriodDate");
CREATE INDEX "IX_BJCP_StylePopularity_Rank" ON "BJCP_StylePopularity"("Rank");

CREATE INDEX "IX_BJCP_StyleAnalytics_StyleId" ON "BJCP_StyleAnalytics"("StyleId");
CREATE INDEX "IX_BJCP_StyleAnalytics_Date" ON "BJCP_StyleAnalytics"("AnalysisDate");

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tenant-specific tables
ALTER TABLE "BJCP_RecipeCompetitionEntry" ENABLE ROW LEVEL SECURITY;

-- RLS policy for competition entries (tenant isolation)
CREATE POLICY "tenant_bjcp_competition_entries" ON "BJCP_RecipeCompetitionEntry"
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
CREATE TRIGGER "update_BJCP_BeerCategory_updated"
    BEFORE UPDATE ON "BJCP_BeerCategory"
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();

CREATE TRIGGER "update_BJCP_CommercialExample_updated"
    BEFORE UPDATE ON "BJCP_CommercialExample"
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_BeerCategory" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_StyleTag" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_StyleTagMapping" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_StyleCharacteristics" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_CommercialExample" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_StyleComparison" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_StyleRecommendation" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_RecipeStyleMatch" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_StyleJudging" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_RecipeCompetitionEntry" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_StylePopularity" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BJCP_StyleAnalytics" TO fermentum_app;

COMMIT;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- This migration creates a comprehensive BJCP beer style management system with BJCP_ prefixed tables:
--
-- 1. Core Tables:
--    - BJCP_BeerCategory: BJCP category organization
--    - BJCP_StyleTag: Flexible tagging system for styles
--    - Enhanced BeerStyle table with category relationships
--
-- 2. Content Tables:
--    - BJCP_StyleCharacteristics: Detailed style descriptions
--    - BJCP_CommercialExample: Reference beers for each style
--    - BJCP_StyleComparison: Style relationships and comparisons
--
-- 3. Brewing Enhancement:
--    - BJCP_StyleRecommendation: Brewing guidance for each style
--    - BJCP_RecipeStyleMatch: AI-powered recipe analysis
--
-- 4. Competition & Quality:
--    - BJCP_StyleJudging: BJCP judging criteria
--    - BJCP_RecipeCompetitionEntry: Competition tracking
--
-- 5. Analytics:
--    - BJCP_StylePopularity: Trend analysis
--    - BJCP_StyleAnalytics: Recipe aggregation and insights
--
-- Next steps:
-- 1. Run the updated data population script to load BJCP2.json data
-- 2. Create C# models for the new BJCP_ prefixed tables
-- 3. Implement API endpoints for style management
-- 4. Build UI components for style browsing and selection