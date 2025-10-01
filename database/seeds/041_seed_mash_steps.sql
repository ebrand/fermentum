-- ================================================================================================
-- Fermentum Mash Step Seed Data
-- ================================================================================================
-- Global mash step database for brewing mash steps
-- These are industry-standard mash steps available to all tenants
-- TenantId = NULL indicates global/shared mash steps
-- IsCustom = false indicates these are system-provided mash steps
-- ================================================================================================

BEGIN;

-- Clear existing seed data to allow re-running
DELETE FROM "MashStep" WHERE "TenantId" IS NULL AND "IsCustom" = false;

-- ================================================================================================
-- COMMON MASH STEPS - Standard steps used in various mash profiles
-- ================================================================================================

INSERT INTO "MashStep" (
    "TenantId", "Name", "StepType", "Temperature", "TemperatureUnit", "Duration",
    "Description", "TypicalOrder", "Category", "IsActive", "IsCustom"
) VALUES
-- Protein Rest Steps
(NULL, 'Protein Rest', 'Temperature', 122, 'F', 20, 'Breaks down proteins to improve clarity and head retention', 1, 'Protein Rest', true, false),
(NULL, 'Light Protein Rest', 'Temperature', 122, 'F', 15, 'Short protein rest for beers with high protein content', 1, 'Protein Rest', true, false),
(NULL, 'Extended Protein Rest', 'Temperature', 122, 'F', 30, 'Extended protein rest for wheat beers and high-protein grains', 1, 'Protein Rest', true, false),

-- Beta Saccharification (Fermentability)
(NULL, 'Beta Saccharification', 'Temperature', 145, 'F', 30, 'Produces highly fermentable sugars for dry, attenuated beers', 2, 'Saccharification', true, false),
(NULL, 'Beta Sacch Rest', 'Temperature', 145, 'F', 20, 'Short beta rest for maximum fermentability', 2, 'Saccharification', true, false),

-- Alpha Saccharification (Body)
(NULL, 'Alpha Saccharification', 'Temperature', 158, 'F', 45, 'Creates body and sweetness with less fermentable sugars', 3, 'Saccharification', true, false),
(NULL, 'Alpha Sacch Rest', 'Temperature', 158, 'F', 30, 'Short alpha rest for medium body', 3, 'Saccharification', true, false),

-- Single Infusion (Most Common)
(NULL, 'Single Infusion Mash', 'Infusion', 152, 'F', 60, 'Standard single-step mash for most ale styles', 1, 'Saccharification', true, false),
(NULL, 'Single Saccharification', 'Temperature', 152, 'F', 60, 'Balanced saccharification for most beer styles', 2, 'Saccharification', true, false),
(NULL, 'Short Single Mash', 'Infusion', 152, 'F', 45, 'Shorter single infusion for well-modified malts', 1, 'Saccharification', true, false),

-- Mash Out Steps
(NULL, 'Mash Out', 'Temperature', 168, 'F', 10, 'Stops enzymatic activity and improves lautering', 4, 'Mash Out', true, false),
(NULL, 'Quick Mash Out', 'Temperature', 168, 'F', 5, 'Short mash out for quick brew days', 4, 'Mash Out', true, false),
(NULL, 'Extended Mash Out', 'Temperature', 168, 'F', 15, 'Extended mash out for problematic lauters', 4, 'Mash Out', true, false),

-- Decoction Steps
(NULL, 'Decoction Rest', 'Decoction', 158, 'F', 30, 'Traditional German mash step using decoction method', 2, 'Decoction', true, false),
(NULL, 'Double Decoction Rest 1', 'Decoction', 145, 'F', 20, 'First rest in double decoction mash', 2, 'Decoction', true, false),
(NULL, 'Double Decoction Rest 2', 'Decoction', 158, 'F', 30, 'Second rest in double decoction mash', 3, 'Decoction', true, false),

-- Step Mash Components
(NULL, 'Acid Rest', 'Temperature', 95, 'F', 15, 'Lowers mash pH naturally (rarely used)', 1, 'Specialty', true, false),
(NULL, 'Beta-Glucan Rest', 'Temperature', 104, 'F', 20, 'Breaks down beta-glucans in oats and wheat', 1, 'Specialty', true, false),

-- Lager-Specific Steps
(NULL, 'Lager Saccharification', 'Temperature', 150, 'F', 75, 'Extended saccharification for clean lager profile', 2, 'Saccharification', true, false),
(NULL, 'Pilsner Mash', 'Temperature', 149, 'F', 90, 'Low temperature mash for crisp pilsners', 2, 'Saccharification', true, false),

-- Specialty Steps
(NULL, 'Sour Mash Rest', 'Temperature', 110, 'F', 30, 'Lactobacillus rest for sour mashing', 1, 'Specialty', true, false);

COMMIT;