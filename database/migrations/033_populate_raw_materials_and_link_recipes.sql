-- Migration: Populate RawMaterial table and link to recipes
-- Date: 2025-01-27
-- Description: Creates raw materials from existing ingredient data and links to recipes

BEGIN;

-- Set tenant context for raw materials
SET LOCAL app.current_tenant_id = '23f1ad78-d246-4b9f-8d38-d7e91abf4541';

-- Get category IDs
WITH category_ids AS (
    SELECT
        "CategoryId",
        "Name" as category_name
    FROM "RawMaterialCategory"
),
-- Get a user ID for created/updated fields
user_context AS (
    SELECT "UserId"
    FROM "User"
    LIMIT 1
)

-- Insert raw materials from existing grains
INSERT INTO "RawMaterial" (
    "TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure",
    "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy"
)
SELECT
    '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
    c."CategoryId",
    g."Name",
    g."Description",
    'lbs',
    5.00, -- Default cost per lb
    g."IsActive",
    u."UserId",
    u."UserId"
FROM "Grain" g
CROSS JOIN category_ids c
CROSS JOIN user_context u
WHERE c.category_name = 'Grains & Malts';

-- Insert raw materials from existing hops
INSERT INTO "RawMaterial" (
    "TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure",
    "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy"
)
SELECT
    '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
    c."CategoryId",
    h."Name",
    h."Description",
    'oz',
    3.50, -- Default cost per oz
    h."IsActive",
    u."UserId",
    u."UserId"
FROM "Hop" h
CROSS JOIN category_ids c
CROSS JOIN user_context u
WHERE c.category_name = 'Hops';

-- Insert raw materials from existing yeasts
INSERT INTO "RawMaterial" (
    "TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure",
    "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy"
)
SELECT
    '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
    c."CategoryId",
    y."Name",
    y."Description",
    'package',
    8.00, -- Default cost per package
    y."IsActive",
    u."UserId",
    u."UserId"
FROM "Yeast" y
CROSS JOIN category_ids c
CROSS JOIN user_context u
WHERE c.category_name = 'Yeast';

-- Insert raw materials from existing additives
INSERT INTO "RawMaterial" (
    "TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure",
    "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy"
)
SELECT
    '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
    c."CategoryId",
    a."Name",
    a."Description",
    'g',
    0.25, -- Default cost per gram
    a."IsActive",
    u."UserId",
    u."UserId"
FROM "Additive" a
CROSS JOIN category_ids c
CROSS JOIN user_context u
WHERE c.category_name = 'Additives & Finings';

-- Now link recipes to raw materials

-- Recipe 1: West Coast IPA - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "Unit", "Percentage", "SortOrder")
SELECT
    '11111111-1111-1111-1111-111111111111'::uuid,
    rm."MaterialId",
    CASE
        WHEN rm."Name" = '2-Row Pale Malt' THEN 10.0
        WHEN rm."Name" = 'Crystal 60L' THEN 1.0
        WHEN rm."Name" = 'Munich Malt' THEN 0.5
    END,
    'lbs',
    CASE
        WHEN rm."Name" = '2-Row Pale Malt' THEN 87.0
        WHEN rm."Name" = 'Crystal 60L' THEN 8.7
        WHEN rm."Name" = 'Munich Malt' THEN 4.3
    END,
    CASE
        WHEN rm."Name" = '2-Row Pale Malt' THEN 1
        WHEN rm."Name" = 'Crystal 60L' THEN 2
        WHEN rm."Name" = 'Munich Malt' THEN 3
    END
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Grains & Malts'
AND rm."Name" IN ('2-Row Pale Malt', 'Crystal 60L', 'Munich Malt');

-- Recipe 1: West Coast IPA - Hops
INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '11111111-1111-1111-1111-111111111111'::uuid,
    rm."MaterialId",
    CASE
        WHEN rm."Name" = 'Columbus' THEN 0.5
        WHEN rm."Name" = 'Centennial' THEN 1.0
        WHEN rm."Name" = 'Cascade' THEN 1.0
        WHEN rm."Name" = 'Citra' THEN 1.5
    END,
    'oz',
    CASE
        WHEN rm."Name" = 'Columbus' THEN 60
        WHEN rm."Name" = 'Centennial' THEN 15
        WHEN rm."Name" = 'Cascade' THEN 5
        WHEN rm."Name" = 'Citra' THEN 0
    END,
    'minutes',
    CASE
        WHEN rm."Name" = 'Columbus' THEN 'Boil'
        WHEN rm."Name" = 'Centennial' THEN 'Boil'
        WHEN rm."Name" = 'Cascade' THEN 'Boil'
        WHEN rm."Name" = 'Citra' THEN 'Dry Hop'
    END,
    CASE
        WHEN rm."Name" = 'Columbus' THEN 14.5
        WHEN rm."Name" = 'Centennial' THEN 10.0
        WHEN rm."Name" = 'Cascade' THEN 5.5
        WHEN rm."Name" = 'Citra' THEN 12.0
    END,
    CASE
        WHEN rm."Name" = 'Columbus' THEN 1
        WHEN rm."Name" = 'Centennial' THEN 2
        WHEN rm."Name" = 'Cascade' THEN 3
        WHEN rm."Name" = 'Citra' THEN 4
    END
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Hops'
AND rm."Name" IN ('Columbus', 'Centennial', 'Cascade', 'Citra');

-- Recipe 1: West Coast IPA - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "Unit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '11111111-1111-1111-1111-111111111111'::uuid,
    rm."MaterialId",
    1,
    'package',
    'Ale',
    78.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Yeast'
AND rm."Name" = 'American Ale';

-- Recipe 2: Midnight Porter - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "Unit", "Percentage", "SortOrder")
SELECT
    '22222222-2222-2222-2222-222222222222'::uuid,
    rm."MaterialId",
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 8.0
        WHEN rm."Name" = 'Crystal 120L' THEN 1.0
        WHEN rm."Name" = 'Chocolate Malt' THEN 0.75
    END,
    'lbs',
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 82.0
        WHEN rm."Name" = 'Crystal 120L' THEN 10.3
        WHEN rm."Name" = 'Chocolate Malt' THEN 7.7
    END,
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 1
        WHEN rm."Name" = 'Crystal 120L' THEN 2
        WHEN rm."Name" = 'Chocolate Malt' THEN 3
    END
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Grains & Malts'
AND rm."Name" IN ('Maris Otter', 'Crystal 120L', 'Chocolate Malt');

-- Recipe 2: Midnight Porter - Hops
INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '22222222-2222-2222-2222-222222222222'::uuid,
    rm."MaterialId",
    CASE
        WHEN rm."Name" = 'East Kent Goldings' THEN 1.0
        WHEN rm."Name" = 'Fuggle' THEN 0.5
    END,
    'oz',
    CASE
        WHEN rm."Name" = 'East Kent Goldings' THEN 60
        WHEN rm."Name" = 'Fuggle' THEN 15
    END,
    'minutes',
    'Boil',
    CASE
        WHEN rm."Name" = 'East Kent Goldings' THEN 5.0
        WHEN rm."Name" = 'Fuggle' THEN 4.5
    END,
    CASE
        WHEN rm."Name" = 'East Kent Goldings' THEN 1
        WHEN rm."Name" = 'Fuggle' THEN 2
    END
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Hops'
AND rm."Name" IN ('East Kent Goldings', 'Fuggle');

-- Recipe 2: Midnight Porter - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "Unit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '22222222-2222-2222-2222-222222222222'::uuid,
    rm."MaterialId",
    1,
    'package',
    'Ale',
    75.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Yeast'
AND rm."Name" = 'London ESB Ale';

-- Recipe 3: Bavarian Pilsner - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "Unit", "Percentage", "SortOrder")
SELECT
    '33333333-3333-3333-3333-333333333333'::uuid,
    rm."MaterialId",
    9.0,
    'lbs',
    100.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Grains & Malts'
AND rm."Name" = 'Pilsner Malt';

-- Recipe 3: Bavarian Pilsner - Hops
INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '33333333-3333-3333-3333-333333333333'::uuid,
    rm."MaterialId",
    1.5,
    'oz',
    60,
    'minutes',
    'Boil',
    4.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Hops'
AND rm."Name" = 'Hallertau Mittelfrüh';

-- Recipe 3: Bavarian Pilsner - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "Unit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '33333333-3333-3333-3333-333333333333'::uuid,
    rm."MaterialId",
    1,
    'package',
    'Lager',
    83.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Yeast'
AND rm."Name" = 'German Lager';

-- Recipe 4: Abbey Golden Ale - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "Unit", "Percentage", "SortOrder")
SELECT
    '44444444-4444-4444-4444-444444444444'::uuid,
    rm."MaterialId",
    CASE
        WHEN rm."Name" = 'Pilsner Malt' THEN 10.0
        WHEN rm."Name" = 'Munich Malt' THEN 1.0
    END,
    'lbs',
    CASE
        WHEN rm."Name" = 'Pilsner Malt' THEN 91.0
        WHEN rm."Name" = 'Munich Malt' THEN 9.0
    END,
    CASE
        WHEN rm."Name" = 'Pilsner Malt' THEN 1
        WHEN rm."Name" = 'Munich Malt' THEN 2
    END
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Grains & Malts'
AND rm."Name" IN ('Pilsner Malt', 'Munich Malt');

-- Recipe 4: Abbey Golden Ale - Hops
INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '44444444-4444-4444-4444-444444444444'::uuid,
    rm."MaterialId",
    1.0,
    'oz',
    60,
    'minutes',
    'Boil',
    5.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Hops'
AND rm."Name" = 'East Kent Goldings';

-- Recipe 4: Abbey Golden Ale - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "Unit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '44444444-4444-4444-4444-444444444444'::uuid,
    rm."MaterialId",
    1,
    'package',
    'Ale',
    85.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Yeast'
AND rm."Name" = 'Belgian Abbey Ale II';

-- Recipe 5: Thames Valley ESB - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "Unit", "Percentage", "SortOrder")
SELECT
    '55555555-5555-5555-5555-555555555555'::uuid,
    rm."MaterialId",
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 9.0
        WHEN rm."Name" = 'Crystal 60L' THEN 1.0
    END,
    'lbs',
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 90.0
        WHEN rm."Name" = 'Crystal 60L' THEN 10.0
    END,
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 1
        WHEN rm."Name" = 'Crystal 60L' THEN 2
    END
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Grains & Malts'
AND rm."Name" IN ('Maris Otter', 'Crystal 60L');

-- Recipe 5: Thames Valley ESB - Hops
INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '55555555-5555-5555-5555-555555555555'::uuid,
    rm."MaterialId",
    CASE
        WHEN rm."Name" = 'East Kent Goldings' THEN 1.5
        WHEN rm."Name" = 'Fuggle' THEN 0.5
    END,
    'oz',
    CASE
        WHEN rm."Name" = 'East Kent Goldings' THEN 60
        WHEN rm."Name" = 'Fuggle' THEN 15
    END,
    'minutes',
    'Boil',
    CASE
        WHEN rm."Name" = 'East Kent Goldings' THEN 5.0
        WHEN rm."Name" = 'Fuggle' THEN 4.5
    END,
    CASE
        WHEN rm."Name" = 'East Kent Goldings' THEN 1
        WHEN rm."Name" = 'Fuggle' THEN 2
    END
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Hops'
AND rm."Name" IN ('East Kent Goldings', 'Fuggle');

-- Recipe 5: Thames Valley ESB - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "Unit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '55555555-5555-5555-5555-555555555555'::uuid,
    rm."MaterialId",
    1,
    'package',
    'Ale',
    78.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Yeast'
AND rm."Name" = 'Thames Valley Ale';

-- Recipe 6: Velvet Oatmeal Stout - Grains
INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "Unit", "Percentage", "SortOrder")
SELECT
    '66666666-6666-6666-6666-666666666666'::uuid,
    rm."MaterialId",
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 7.0
        WHEN rm."Name" = 'Flaked Oats' THEN 1.0
        WHEN rm."Name" = 'Crystal 60L' THEN 0.5
        WHEN rm."Name" = 'Chocolate Malt' THEN 0.5
    END,
    'lbs',
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 78.0
        WHEN rm."Name" = 'Flaked Oats' THEN 11.0
        WHEN rm."Name" = 'Crystal 60L' THEN 5.5
        WHEN rm."Name" = 'Chocolate Malt' THEN 5.5
    END,
    CASE
        WHEN rm."Name" = 'Maris Otter' THEN 1
        WHEN rm."Name" = 'Flaked Oats' THEN 2
        WHEN rm."Name" = 'Crystal 60L' THEN 3
        WHEN rm."Name" = 'Chocolate Malt' THEN 4
    END
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Grains & Malts'
AND rm."Name" IN ('Maris Otter', 'Flaked Oats', 'Crystal 60L', 'Chocolate Malt');

-- Recipe 6: Velvet Oatmeal Stout - Hops
INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "TimeUnit", "Usage", "Alpha", "SortOrder")
SELECT
    '66666666-6666-6666-6666-666666666666'::uuid,
    rm."MaterialId",
    1.0,
    'oz',
    60,
    'minutes',
    'Boil',
    5.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Hops'
AND rm."Name" = 'East Kent Goldings';

-- Recipe 6: Velvet Oatmeal Stout - Yeast
INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "Unit", "YeastType", "Attenuation", "SortOrder")
SELECT
    '66666666-6666-6666-6666-666666666666'::uuid,
    rm."MaterialId",
    1,
    'package',
    'Ale',
    77.0,
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Yeast'
AND rm."Name" = 'London ESB Ale';

-- Add some water treatment additives to appropriate recipes
-- West Coast IPA - Gypsum for hop character
INSERT INTO "RecipeAdditive" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "Purpose", "SortOrder")
SELECT
    '11111111-1111-1111-1111-111111111111'::uuid,
    rm."MaterialId",
    2.0,
    'g',
    'Mash',
    'Enhance hop character and clarity',
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Additives & Finings'
AND rm."Name" = 'Gypsum (Calcium Sulfate)';

-- Porter - Calcium Chloride for mouthfeel
INSERT INTO "RecipeAdditive" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "Purpose", "SortOrder")
SELECT
    '22222222-2222-2222-2222-222222222222'::uuid,
    rm."MaterialId",
    1.5,
    'g',
    'Mash',
    'Enhance mouthfeel and malt character',
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Additives & Finings'
AND rm."Name" = 'Calcium Chloride';

-- Pilsner - Whirlfloc for clarity
INSERT INTO "RecipeAdditive" ("RecipeId", "MaterialId", "Amount", "Unit", "Time", "Purpose", "SortOrder")
SELECT
    '33333333-3333-3333-3333-333333333333'::uuid,
    rm."MaterialId",
    0.5,
    'tablet',
    'Boil',
    'Improve clarity and flocculation',
    1
FROM "RawMaterial" rm
JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
WHERE rmc."Name" = 'Additives & Finings'
AND rm."Name" = 'Whirlfloc Tablets';

COMMIT;