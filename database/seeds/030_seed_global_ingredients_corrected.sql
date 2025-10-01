-- ================================================================================================
-- Fermentum Ingredient Seed Data (Schema-Corrected)
-- ================================================================================================
-- Global ingredient database for brewing ingredients
-- These are industry-standard ingredients available to all tenants
-- TenantId = NULL indicates global/shared ingredients
-- IsCustom = false indicates these are system-provided ingredients
-- ================================================================================================

BEGIN;

-- Clear existing seed data to allow re-running
DELETE FROM "Additive" WHERE "TenantId" IS NULL AND "IsCustom" = false;
DELETE FROM "Yeast" WHERE "TenantId" IS NULL AND "IsCustom" = false;
DELETE FROM "Hop" WHERE "TenantId" IS NULL AND "IsCustom" = false;
DELETE FROM "Grain" WHERE "TenantId" IS NULL AND "IsCustom" = false;

-- ================================================================================================
-- BASE MALTS - Foundation grains for most beer styles
-- ================================================================================================

INSERT INTO "Grain" (
    "TenantId", "Name", "Type", "Color", "Potential", "Description",
    "Origin", "Supplier", "IsActive", "IsCustom"
) VALUES
-- American Base Malts
(NULL, '2-Row Pale Malt', 'Base Malt', 1.8, 1.037, 'Standard American base malt with clean, neutral flavor', 'United States', 'Briess', true, false),
(NULL, '6-Row Pale Malt', 'Base Malt', 1.8, 1.035, 'Higher protein American base malt, good for adjunct brewing', 'United States', 'Briess', true, false),
(NULL, 'Pilsner Malt', 'Base Malt', 1.7, 1.037, 'Light, crisp base malt perfect for lagers and light ales', 'Germany', 'Weyermann', true, false),

-- European Base Malts
(NULL, 'Maris Otter', 'Base Malt', 2.5, 1.037, 'Premium English base malt with rich, biscuity flavor', 'United Kingdom', 'Crisp', true, false),
(NULL, 'Vienna Malt', 'Base Malt', 3.5, 1.036, 'Slightly kilned malt adding golden color and toasty flavor', 'Germany', 'Weyermann', true, false),
(NULL, 'Munich Malt', 'Base Malt', 9.0, 1.037, 'Rich, malty flavor with orange hues, classic for Oktoberfest', 'Germany', 'Weyermann', true, false);

-- Specialty Malts
INSERT INTO "Grain" (
    "TenantId", "Name", "Type", "Color", "Potential", "Description", "IsActive", "IsCustom"
) VALUES
-- Crystal/Caramel Malts
(NULL, 'Crystal 40L', 'Crystal Malt', 40.0, 1.034, 'Light caramel sweetness and golden color', true, false),
(NULL, 'Crystal 60L', 'Crystal Malt', 60.0, 1.034, 'Medium caramel flavor with amber color', true, false),
(NULL, 'Crystal 120L', 'Crystal Malt', 120.0, 1.033, 'Dark caramel with raisin notes and deep amber color', true, false),

-- Dark Malts
(NULL, 'Chocolate Malt', 'Roasted Malt', 350.0, 1.028, 'Chocolate and coffee notes without roasted bitterness', true, false),
(NULL, 'Roasted Barley', 'Roasted Malt', 500.0, 1.025, 'Intense roasted flavor, classic for stouts', true, false),

-- Wheat and Other
(NULL, 'White Wheat Malt', 'Wheat Malt', 2.4, 1.037, 'Smooth, creamy mouthfeel for wheat beers', true, false),
(NULL, 'Flaked Oats', 'Adjunct', 1.0, 1.033, 'Silky mouthfeel and head retention', true, false);

-- ================================================================================================
-- AMERICAN HOPS - Classic and modern American varieties
-- ================================================================================================

INSERT INTO "Hop" (
    "TenantId", "Name", "Origin", "Type", "AlphaAcidMin", "AlphaAcidMax",
    "FlavorProfile", "AromaProfile", "Substitutes", "IsActive", "IsCustom"
) VALUES
-- Classic American C-Hops
(NULL, 'Cascade', 'United States', 'Aroma', 4.5, 7.0, 'Citrus, floral', 'Grapefruit, floral, spicy', 'Centennial, Columbus', true, false),
(NULL, 'Centennial', 'United States', 'Dual Purpose', 9.5, 11.5, 'Citrus, floral', 'Lemon, floral, pine', 'Cascade, Chinook', true, false),
(NULL, 'Chinook', 'United States', 'Bittering', 12.0, 14.0, 'Grapefruit, spicy', 'Grapefruit, pine, spicy', 'Columbus, Centennial', true, false),
(NULL, 'Columbus', 'United States', 'Bittering', 14.0, 18.0, 'Pungent, earthy', 'Pungent, dank, citrus', 'Chinook, Nugget', true, false),

-- Modern American Varieties
(NULL, 'Citra', 'United States', 'Aroma', 11.0, 13.0, 'Tropical fruit, citrus', 'Grapefruit, lime, tropical', 'Simcoe, Mosaic', true, false),
(NULL, 'Mosaic', 'United States', 'Dual Purpose', 11.5, 13.5, 'Complex fruit, floral', 'Mango, stone fruit, floral', 'Citra, Simcoe', true, false),
(NULL, 'Simcoe', 'United States', 'Dual Purpose', 12.0, 14.0, 'Passion fruit, pine', 'Passion fruit, berry, pine', 'Citra, Amarillo', true, false),
(NULL, 'Amarillo', 'United States', 'Aroma', 8.0, 11.0, 'Orange citrus, floral', 'Orange, lemon, floral', 'Simcoe, Centennial', true, false);

-- ================================================================================================
-- EUROPEAN HOPS - Traditional German and English varieties
-- ================================================================================================

INSERT INTO "Hop" (
    "TenantId", "Name", "Origin", "Type", "AlphaAcidMin", "AlphaAcidMax",
    "FlavorProfile", "AromaProfile", "Substitutes", "IsActive", "IsCustom"
) VALUES
-- German Noble Hops
(NULL, 'Hallertau Mittelfrüh', 'Germany', 'Aroma', 3.0, 5.5, 'Mild, pleasant', 'Floral, spicy, herbal', 'Tettnang, Saaz', true, false),
(NULL, 'Tettnang', 'Germany', 'Aroma', 3.5, 5.5, 'Pleasant, mild', 'Floral, spicy, herbal', 'Hallertau, Saaz', true, false),
(NULL, 'Saaz', 'Czech Republic', 'Aroma', 2.5, 4.5, 'Mild, pleasant', 'Spicy, earthy, herbal', 'Hallertau, Tettnang', true, false),

-- English Hops
(NULL, 'East Kent Goldings', 'United Kingdom', 'Aroma', 4.0, 6.5, 'Gentle, pleasant', 'Floral, earthy, honey', 'Fuggle, Willamette', true, false),
(NULL, 'Fuggle', 'United Kingdom', 'Aroma', 3.5, 5.5, 'Mild, pleasant', 'Earthy, woody, fruit', 'East Kent Goldings, Willamette', true, false);

-- ================================================================================================
-- YEAST STRAINS - Ale, Lager, and Specialty Yeasts
-- ================================================================================================

INSERT INTO "Yeast" (
    "TenantId", "Name", "Manufacturer", "ProductId", "Type", "Form",
    "AttenuationMin", "AttenuationMax", "TemperatureMin", "TemperatureMax",
    "AlcoholTolerance", "Flocculation", "FlavorProfile", "Description",
    "IsActive", "IsCustom"
) VALUES
-- American Ale Yeasts
(NULL, 'American Ale', 'Wyeast', '1056', 'Ale', 'Liquid', 73, 77, 60, 72, 11.0, 'Medium', 'Clean, neutral', 'Classic American ale yeast, clean fermentation', true, false),
(NULL, 'California Ale', 'White Labs', 'WLP001', 'Ale', 'Liquid', 73, 80, 68, 73, 14.0, 'Medium', 'Clean, crisp', 'Versatile strain for American ales', true, false),
(NULL, 'Safale US-05', 'Fermentis', 'US-05', 'Ale', 'Dry', 78, 82, 59, 75, 12.0, 'Medium', 'Clean, neutral', 'Dry American ale yeast, easy to use', true, false),

-- English Ale Yeasts
(NULL, 'London ESB Ale', 'Wyeast', '1968', 'Ale', 'Liquid', 67, 71, 64, 72, 9.0, 'Very High', 'Rich, malty', 'Traditional English strain with rich character', true, false),
(NULL, 'Thames Valley Ale', 'Wyeast', '1275', 'Ale', 'Liquid', 72, 76, 62, 72, 10.0, 'Medium', 'Malty, slightly fruity', 'Classic English bitter yeast', true, false),

-- German Lager Yeasts
(NULL, 'German Lager', 'Wyeast', '2124', 'Lager', 'Liquid', 73, 77, 46, 56, 9.0, 'Medium', 'Clean, crisp', 'Classic German lager strain', true, false),
(NULL, 'Saflager W-34/70', 'Fermentis', 'W-34/70', 'Lager', 'Dry', 80, 84, 46, 59, 12.0, 'High', 'Clean, neutral', 'Versatile dry lager yeast', true, false),

-- Belgian Yeasts
(NULL, 'Belgian Abbey Ale II', 'Wyeast', '1762', 'Ale', 'Liquid', 73, 77, 65, 78, 12.0, 'Medium', 'Fruity, spicy', 'Classic abbey ale character', true, false);

-- ================================================================================================
-- BREWING ADDITIVES - Water treatment, clarification, and flavor
-- ================================================================================================

INSERT INTO "Additive" (
    "TenantId", "Name", "Category", "Type", "Purpose", "DosageMin", "DosageMax",
    "DosageUnit", "Usage", "SafetyNotes", "Description", "IsActive", "IsCustom"
) VALUES
-- Water Treatment
(NULL, 'Gypsum (CaSO4)', 'Water Treatment', 'Mineral Salt', 'Increase calcium and sulfate levels', 1.0, 10.0, 'g/gal', 'Add to mash or sparge water', 'Food grade only, measure carefully', 'Enhances hop character and lowers mash pH', true, false),
(NULL, 'Calcium Chloride (CaCl2)', 'Water Treatment', 'Mineral Salt', 'Increase calcium and chloride levels', 1.0, 8.0, 'g/gal', 'Add to mash or sparge water', 'Food grade only, hygroscopic', 'Enhances malt character and body', true, false),
(NULL, 'Lactic Acid (88%)', 'Water Treatment', 'Acid', 'Lower mash and wort pH', 0.1, 2.0, 'ml/gal', 'Add gradually to mash', 'Corrosive, handle with care', 'Safe organic acid for pH adjustment', true, false),

-- Clarification
(NULL, 'Irish Moss', 'Clarification', 'Kettle Finings', 'Protein coagulation and clarification', 0.5, 1.0, 'tsp/5gal', 'Add last 15 minutes of boil', 'Natural seaweed extract', 'Traditional kettle finings for clarity', true, false),
(NULL, 'Whirlfloc Tablets', 'Clarification', 'Kettle Finings', 'Protein coagulation and clarification', 0.5, 1.0, 'tablet/5gal', 'Add last 15 minutes of boil', 'Contains Irish moss and copper sulfate', 'Convenient tablet form of kettle finings', true, false),
(NULL, 'Gelatin', 'Clarification', 'Cold Finings', 'Cold-side clarification', 1.0, 2.0, 'tsp/5gal', 'Add to cold beer before packaging', 'Dissolve in warm water first', 'Effective cold-side clarifying agent', true, false),

-- Yeast Nutrients
(NULL, 'Yeast Nutrient', 'Nutrients', 'Yeast Nutrient', 'Support healthy fermentation', 0.5, 1.0, 'tsp/5gal', 'Add to wort before pitching yeast', 'Contains diammonium phosphate', 'Provides nitrogen and minerals for yeast', true, false),
(NULL, 'Yeast Energizer', 'Nutrients', 'Yeast Nutrient', 'Restart stuck fermentation', 0.5, 1.0, 'tsp/5gal', 'Add during fermentation if needed', 'Contains vitamins and nutrients', 'Complete nutrient blend for problem fermentations', true, false);

COMMIT;

-- ================================================================================================
-- Verification Query - Check that all ingredients were inserted
-- ================================================================================================

SELECT 'Grains' as ingredient_type, COUNT(*) as count FROM "Grain" WHERE "TenantId" IS NULL AND "IsCustom" = false
UNION ALL
SELECT 'Hops', COUNT(*) FROM "Hop" WHERE "TenantId" IS NULL AND "IsCustom" = false
UNION ALL
SELECT 'Yeasts', COUNT(*) FROM "Yeast" WHERE "TenantId" IS NULL AND "IsCustom" = false
UNION ALL
SELECT 'Additives', COUNT(*) FROM "Additive" WHERE "TenantId" IS NULL AND "IsCustom" = false
ORDER BY ingredient_type;