-- Migration: Add 6 realistic beer recipes with complete ingredient profiles
-- Date: 2025-01-27
-- Description: Creates 6 diverse beer recipes using existing ingredients in the database

-- Set tenant context (will be overridden by actual tenant in production)
SET LOCAL app.current_tenant_id = '23f1ad78-d246-4b9f-8d38-d7e91abf4541';

-- Insert 6 realistic beer recipes
INSERT INTO "Recipe" (
    "RecipeId", "TenantId", "Name", "Description", "BatchSize", "BatchSizeUnit",
    "BoilSize", "BoilTime", "Efficiency", "EstimatedOG", "EstimatedFG", "EstimatedABV",
    "EstimatedIBU", "EstimatedSRM", "MashTemperature", "MashTime",
    "FermentationTemperature", "FermentationDays", "ConditioningDays",
    "CarbonationLevel", "WaterVolume", "WaterVolumeUnit",
    "BrewingNotes", "FermentationNotes", "TastingNotes", "Brewer", "Tags"
) VALUES

-- 1. Classic American IPA
('11111111-1111-1111-1111-111111111111', '23f1ad78-d246-4b9f-8d38-d7e91abf4541',
'West Coast IPA',
'A hop-forward American IPA with citrus and pine notes. Balanced with a solid malt backbone and crisp finish.',
5.5, 'gallons', 7.0, 60, 75.0, 1.062, 1.012, 6.6, 65.0, 8.5, 152.0, 60,
66.0, 14, 14, 2.4, 7.5, 'gallons',
'Single infusion mash. Hop stand at 170°F for 20 minutes before chilling.',
'Ferment at 66°F for primary. Cold crash before packaging.',
'Bold citrus and pine hop aroma. Balanced bitterness with clean malt backbone. Dry finish.',
'Head Brewer', ARRAY['IPA', 'American', 'Hoppy', 'Citrus']),

-- 2. Robust Porter
('22222222-2222-2222-2222-222222222222', '23f1ad78-d246-4b9f-8d38-d7e91abf4541',
'Midnight Porter',
'Rich and robust porter with chocolate and coffee notes. Smooth and full-bodied with a roasted finish.',
5.5, 'gallons', 7.0, 60, 75.0, 1.058, 1.014, 5.8, 28.0, 35.0, 154.0, 60,
68.0, 14, 21, 2.2, 7.5, 'gallons',
'Single infusion mash. Higher mash temp for body and sweetness.',
'Ferment at 68°F. Allow extended conditioning for flavor development.',
'Rich chocolate and coffee aromas. Full body with roasted malt character. Smooth finish.',
'Head Brewer', ARRAY['Porter', 'Dark', 'Roasted', 'Chocolate']),

-- 3. German Pilsner
('33333333-3333-3333-3333-333333333333', '23f1ad78-d246-4b9f-8d38-d7e91abf4541',
'Bavarian Pilsner',
'Crisp and clean German-style pilsner with noble hop character and brilliant clarity.',
5.5, 'gallons', 7.0, 90, 75.0, 1.048, 1.008, 5.3, 35.0, 3.5, 148.0, 60,
50.0, 21, 28, 2.6, 7.5, 'gallons',
'Step mash: 148°F for 60 min, 158°F for 20 min, 168°F mash out. 90-minute boil.',
'Lager at 50°F for 3 weeks. Cold condition for 4 weeks before packaging.',
'Floral and spicy hop aroma. Crisp, clean finish with subtle malt sweetness.',
'Head Brewer', ARRAY['Pilsner', 'German', 'Lager', 'Clean']),

-- 4. Belgian Abbey Ale
('44444444-4444-4444-4444-444444444444', '23f1ad78-d246-4b9f-8d38-d7e91abf4541',
'Abbey Golden Ale',
'Traditional Belgian abbey style with complex fruity esters and spicy phenols.',
5.5, 'gallons', 7.0, 60, 75.0, 1.065, 1.010, 7.2, 22.0, 4.0, 149.0, 60,
75.0, 14, 21, 3.0, 7.5, 'gallons',
'Single infusion mash. Belgian candi sugar added in last 10 minutes of boil.',
'Ferment at 75°F for strong ester production. Secondary fermentation recommended.',
'Complex fruity and spicy character. Banana and clove notes with warming alcohol.',
'Head Brewer', ARRAY['Belgian', 'Abbey', 'Fruity', 'Strong']),

-- 5. English ESB
('55555555-5555-5555-5555-555555555555', '23f1ad78-d246-4b9f-8d38-d7e91abf4541',
'Thames Valley ESB',
'Traditional English Extra Special Bitter with earthy hop character and rich malt backbone.',
5.5, 'gallons', 7.0, 60, 75.0, 1.055, 1.012, 5.6, 40.0, 12.0, 151.0, 60,
65.0, 14, 14, 2.0, 7.5, 'gallons',
'Single infusion mash. Traditional English brewing methods.',
'Ferment at 65°F. Condition at cellar temperature for authentic character.',
'Earthy, floral hop aroma balanced with rich malt character. Traditional bitter finish.',
'Head Brewer', ARRAY['ESB', 'English', 'Traditional', 'Balanced']),

-- 6. Oatmeal Stout
('66666666-6666-6666-6666-666666666666', '23f1ad78-d246-4b9f-8d38-d7e91abf4541',
'Velvet Oatmeal Stout',
'Smooth and creamy oatmeal stout with rich chocolate and coffee flavors. Silky mouthfeel.',
5.5, 'gallons', 7.0, 60, 75.0, 1.052, 1.012, 5.3, 30.0, 40.0, 152.0, 60,
67.0, 14, 21, 2.1, 7.5, 'gallons',
'Single infusion mash with flaked oats for creamy texture.',
'Ferment at 67°F. Extended conditioning develops smooth character.',
'Rich coffee and chocolate aroma. Creamy, smooth mouthfeel with roasted finish.',
'Head Brewer', ARRAY['Stout', 'Oatmeal', 'Creamy', 'Roasted']);

-- Get ingredient IDs for recipe components
WITH ingredients AS (
    SELECT 'Grain' as type, "GrainId" as id, "Name" as name FROM "Grain"
    UNION ALL
    SELECT 'Hop' as type, "HopId" as id, "Name" as name FROM "Hop"
    UNION ALL
    SELECT 'Yeast' as type, "YeastId" as id, "Name" as name FROM "Yeast"
    UNION ALL
    SELECT 'Additive' as type, "AdditiveId" as id, "Name" as name FROM "Additive"
)

-- Recipe 1: West Coast IPA - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "GrainId", "Amount", "AmountUnit", "Percentage", "SortOrder")
SELECT
    '11111111-1111-1111-1111-111111111111',
    i.id::uuid,
    CASE
        WHEN i.name = '2-Row Pale Malt' THEN 10.0
        WHEN i.name = 'Crystal 60L' THEN 1.0
        WHEN i.name = 'Munich Malt' THEN 0.5
    END,
    'lbs',
    CASE
        WHEN i.name = '2-Row Pale Malt' THEN 87.0
        WHEN i.name = 'Crystal 60L' THEN 8.7
        WHEN i.name = 'Munich Malt' THEN 4.3
    END,
    CASE
        WHEN i.name = '2-Row Pale Malt' THEN 1
        WHEN i.name = 'Crystal 60L' THEN 2
        WHEN i.name = 'Munich Malt' THEN 3
    END
FROM ingredients i
WHERE i.type = 'Grain' AND i.name IN ('2-Row Pale Malt', 'Crystal 60L', 'Munich Malt');

-- Recipe 1: West Coast IPA - Hops
INSERT INTO "RecipeHop" ("RecipeId", "HopId", "Amount", "AmountUnit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '11111111-1111-1111-1111-111111111111',
    i.id::uuid,
    CASE
        WHEN i.name = 'Columbus' THEN 0.5
        WHEN i.name = 'Centennial' THEN 1.0
        WHEN i.name = 'Cascade' THEN 1.0
        WHEN i.name = 'Citra' THEN 1.5
    END,
    'oz',
    CASE
        WHEN i.name = 'Columbus' THEN 60
        WHEN i.name = 'Centennial' THEN 15
        WHEN i.name = 'Cascade' THEN 5
        WHEN i.name = 'Citra' THEN 0
    END,
    'minutes',
    CASE
        WHEN i.name = 'Columbus' THEN 'Boil'
        WHEN i.name = 'Centennial' THEN 'Boil'
        WHEN i.name = 'Cascade' THEN 'Boil'
        WHEN i.name = 'Citra' THEN 'Dry Hop'
    END,
    CASE
        WHEN i.name = 'Columbus' THEN 14.5
        WHEN i.name = 'Centennial' THEN 10.0
        WHEN i.name = 'Cascade' THEN 5.5
        WHEN i.name = 'Citra' THEN 12.0
    END,
    CASE
        WHEN i.name = 'Columbus' THEN 1
        WHEN i.name = 'Centennial' THEN 2
        WHEN i.name = 'Cascade' THEN 3
        WHEN i.name = 'Citra' THEN 4
    END
FROM ingredients i
WHERE i.type = 'Hop' AND i.name IN ('Columbus', 'Centennial', 'Cascade', 'Citra');

-- Recipe 1: West Coast IPA - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "YeastId", "Amount", "AmountUnit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '11111111-1111-1111-1111-111111111111',
    i.id::uuid,
    1,
    'package',
    'Ale',
    78.0,
    1
FROM ingredients i
WHERE i.type = 'Yeast' AND i.name = 'American Ale';

-- Recipe 2: Midnight Porter - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "GrainId", "Amount", "AmountUnit", "Percentage", "SortOrder")
SELECT
    '22222222-2222-2222-2222-222222222222',
    i.id::uuid,
    CASE
        WHEN i.name = 'Maris Otter' THEN 8.0
        WHEN i.name = 'Crystal 120L' THEN 1.0
        WHEN i.name = 'Chocolate Malt' THEN 0.75
    END,
    'lbs',
    CASE
        WHEN i.name = 'Maris Otter' THEN 82.0
        WHEN i.name = 'Crystal 120L' THEN 10.3
        WHEN i.name = 'Chocolate Malt' THEN 7.7
    END,
    CASE
        WHEN i.name = 'Maris Otter' THEN 1
        WHEN i.name = 'Crystal 120L' THEN 2
        WHEN i.name = 'Chocolate Malt' THEN 3
    END
FROM ingredients i
WHERE i.type = 'Grain' AND i.name IN ('Maris Otter', 'Crystal 120L', 'Chocolate Malt');

-- Recipe 2: Midnight Porter - Hops
INSERT INTO "RecipeHop" ("RecipeId", "HopId", "Amount", "AmountUnit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '22222222-2222-2222-2222-222222222222',
    i.id::uuid,
    CASE
        WHEN i.name = 'East Kent Goldings' THEN 1.0
        WHEN i.name = 'Fuggle' THEN 0.5
    END,
    'oz',
    CASE
        WHEN i.name = 'East Kent Goldings' THEN 60
        WHEN i.name = 'Fuggle' THEN 15
    END,
    'minutes',
    'Boil',
    CASE
        WHEN i.name = 'East Kent Goldings' THEN 5.0
        WHEN i.name = 'Fuggle' THEN 4.5
    END,
    CASE
        WHEN i.name = 'East Kent Goldings' THEN 1
        WHEN i.name = 'Fuggle' THEN 2
    END
FROM ingredients i
WHERE i.type = 'Hop' AND i.name IN ('East Kent Goldings', 'Fuggle');

-- Recipe 2: Midnight Porter - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "YeastId", "Amount", "AmountUnit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '22222222-2222-2222-2222-222222222222',
    i.id::uuid,
    1,
    'package',
    'Ale',
    75.0,
    1
FROM ingredients i
WHERE i.type = 'Yeast' AND i.name = 'London ESB Ale';

-- Recipe 3: Bavarian Pilsner - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "GrainId", "Amount", "AmountUnit", "Percentage", "SortOrder")
SELECT
    '33333333-3333-3333-3333-333333333333',
    i.id::uuid,
    9.0,
    'lbs',
    100.0,
    1
FROM ingredients i
WHERE i.type = 'Grain' AND i.name = 'Pilsner Malt';

-- Recipe 3: Bavarian Pilsner - Hops
INSERT INTO "RecipeHop" ("RecipeId", "HopId", "Amount", "AmountUnit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '33333333-3333-3333-3333-333333333333',
    i.id::uuid,
    CASE
        WHEN i.name = 'Hallertau Mittelfrüh' THEN 1.5
    END,
    'oz',
    CASE
        WHEN i.name = 'Hallertau Mittelfrüh' THEN 60
    END,
    'minutes',
    'Boil',
    4.0,
    1
FROM ingredients i
WHERE i.type = 'Hop' AND i.name = 'Hallertau Mittelfrüh';

-- Recipe 3: Bavarian Pilsner - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "YeastId", "Amount", "AmountUnit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '33333333-3333-3333-3333-333333333333',
    i.id::uuid,
    1,
    'package',
    'Lager',
    83.0,
    1
FROM ingredients i
WHERE i.type = 'Yeast' AND i.name = 'German Lager';

-- Recipe 4: Abbey Golden Ale - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "GrainId", "Amount", "AmountUnit", "Percentage", "SortOrder")
SELECT
    '44444444-4444-4444-4444-444444444444',
    i.id::uuid,
    CASE
        WHEN i.name = 'Pilsner Malt' THEN 10.0
        WHEN i.name = 'Munich Malt' THEN 1.0
    END,
    'lbs',
    CASE
        WHEN i.name = 'Pilsner Malt' THEN 91.0
        WHEN i.name = 'Munich Malt' THEN 9.0
    END,
    CASE
        WHEN i.name = 'Pilsner Malt' THEN 1
        WHEN i.name = 'Munich Malt' THEN 2
    END
FROM ingredients i
WHERE i.type = 'Grain' AND i.name IN ('Pilsner Malt', 'Munich Malt');

-- Recipe 4: Abbey Golden Ale - Hops
INSERT INTO "RecipeHop" ("RecipeId", "HopId", "Amount", "AmountUnit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '44444444-4444-4444-4444-444444444444',
    i.id::uuid,
    1.0,
    'oz',
    60,
    'minutes',
    'Boil',
    5.0,
    1
FROM ingredients i
WHERE i.type = 'Hop' AND i.name = 'East Kent Goldings';

-- Recipe 4: Abbey Golden Ale - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "YeastId", "Amount", "AmountUnit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '44444444-4444-4444-4444-444444444444',
    i.id::uuid,
    1,
    'package',
    'Ale',
    85.0,
    1
FROM ingredients i
WHERE i.type = 'Yeast' AND i.name = 'Belgian Abbey Ale II';

-- Recipe 5: Thames Valley ESB - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "GrainId", "Amount", "AmountUnit", "Percentage", "SortOrder")
SELECT
    '55555555-5555-5555-5555-555555555555',
    i.id::uuid,
    CASE
        WHEN i.name = 'Maris Otter' THEN 9.0
        WHEN i.name = 'Crystal 60L' THEN 1.0
    END,
    'lbs',
    CASE
        WHEN i.name = 'Maris Otter' THEN 90.0
        WHEN i.name = 'Crystal 60L' THEN 10.0
    END,
    CASE
        WHEN i.name = 'Maris Otter' THEN 1
        WHEN i.name = 'Crystal 60L' THEN 2
    END
FROM ingredients i
WHERE i.type = 'Grain' AND i.name IN ('Maris Otter', 'Crystal 60L');

-- Recipe 5: Thames Valley ESB - Hops
INSERT INTO "RecipeHop" ("RecipeId", "HopId", "Amount", "AmountUnit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '55555555-5555-5555-5555-555555555555',
    i.id::uuid,
    CASE
        WHEN i.name = 'East Kent Goldings' THEN 1.5
        WHEN i.name = 'Fuggle' THEN 0.5
    END,
    'oz',
    CASE
        WHEN i.name = 'East Kent Goldings' THEN 60
        WHEN i.name = 'Fuggle' THEN 15
    END,
    'minutes',
    'Boil',
    CASE
        WHEN i.name = 'East Kent Goldings' THEN 5.0
        WHEN i.name = 'Fuggle' THEN 4.5
    END,
    CASE
        WHEN i.name = 'East Kent Goldings' THEN 1
        WHEN i.name = 'Fuggle' THEN 2
    END
FROM ingredients i
WHERE i.type = 'Hop' AND i.name IN ('East Kent Goldings', 'Fuggle');

-- Recipe 5: Thames Valley ESB - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "YeastId", "Amount", "AmountUnit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '55555555-5555-5555-5555-555555555555',
    i.id::uuid,
    1,
    'package',
    'Ale',
    78.0,
    1
FROM ingredients i
WHERE i.type = 'Yeast' AND i.name = 'Thames Valley Ale';

-- Recipe 6: Velvet Oatmeal Stout - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "GrainId", "Amount", "AmountUnit", "Percentage", "SortOrder")
SELECT
    '66666666-6666-6666-6666-666666666666',
    i.id::uuid,
    CASE
        WHEN i.name = 'Maris Otter' THEN 7.0
        WHEN i.name = 'Flaked Oats' THEN 1.0
        WHEN i.name = 'Crystal 60L' THEN 0.5
        WHEN i.name = 'Chocolate Malt' THEN 0.5
    END,
    'lbs',
    CASE
        WHEN i.name = 'Maris Otter' THEN 78.0
        WHEN i.name = 'Flaked Oats' THEN 11.0
        WHEN i.name = 'Crystal 60L' THEN 5.5
        WHEN i.name = 'Chocolate Malt' THEN 5.5
    END,
    CASE
        WHEN i.name = 'Maris Otter' THEN 1
        WHEN i.name = 'Flaked Oats' THEN 2
        WHEN i.name = 'Crystal 60L' THEN 3
        WHEN i.name = 'Chocolate Malt' THEN 4
    END
FROM ingredients i
WHERE i.type = 'Grain' AND i.name IN ('Maris Otter', 'Flaked Oats', 'Crystal 60L', 'Chocolate Malt');

-- Recipe 6: Velvet Oatmeal Stout - Hops
INSERT INTO "RecipeHop" ("RecipeId", "HopId", "Amount", "AmountUnit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '66666666-6666-6666-6666-666666666666',
    i.id::uuid,
    1.0,
    'oz',
    60,
    'minutes',
    'Boil',
    5.0,
    1
FROM ingredients i
WHERE i.type = 'Hop' AND i.name = 'East Kent Goldings';

-- Recipe 6: Velvet Oatmeal Stout - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "YeastId", "Amount", "AmountUnit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '66666666-6666-6666-6666-666666666666',
    i.id::uuid,
    1,
    'package',
    'Ale',
    77.0,
    1
FROM ingredients i
WHERE i.type = 'Yeast' AND i.name = 'London ESB Ale';

-- Add some water treatment additives to appropriate recipes
-- West Coast IPA - Gypsum for hop character
INSERT INTO "RecipeAdditive" ("RecipeId", "AdditiveId", "Amount", "AmountUnit", "Time", "Purpose", "SortOrder")
SELECT
    '11111111-1111-1111-1111-111111111111',
    i.id::uuid,
    2.0,
    'g',
    'Mash',
    'Enhance hop character and clarity',
    1
FROM ingredients i
WHERE i.type = 'Additive' AND i.name = 'Gypsum (Calcium Sulfate)';

-- Porter - Calcium Chloride for mouthfeel
INSERT INTO "RecipeAdditive" ("RecipeId", "AdditiveId", "Amount", "AmountUnit", "Time", "Purpose", "SortOrder")
SELECT
    '22222222-2222-2222-2222-222222222222',
    i.id::uuid,
    1.5,
    'g',
    'Mash',
    'Enhance mouthfeel and malt character',
    1
FROM ingredients i
WHERE i.type = 'Additive' AND i.name = 'Calcium Chloride';

-- Pilsner - Whirlfloc for clarity
INSERT INTO "RecipeAdditive" ("RecipeId", "AdditiveId", "Amount", "AmountUnit", "Time", "Purpose", "SortOrder")
SELECT
    '33333333-3333-3333-3333-333333333333',
    i.id::uuid,
    0.5,
    'tablet',
    'Boil',
    'Improve clarity and flocculation',
    1
FROM ingredients i
WHERE i.type = 'Additive' AND i.name = 'Whirlfloc Tablets';

COMMIT;