-- Migration: Link recipes to raw materials
-- Date: 2025-01-27
-- Description: Creates recipe ingredient linkages using the RawMaterial table

BEGIN;

-- Set tenant context
SET LOCAL app.current_tenant_id = '23f1ad78-d246-4b9f-8d38-d7e91abf4541';

-- Now populate the recipe ingredient tables with MaterialId references
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Get user ID
    SELECT "UserId" INTO user_id FROM "User" LIMIT 1;

    -- West Coast IPA Recipe Grains
    INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '11111111-1111-1111-1111-111111111111'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN '2-Row Pale Malt' THEN 10.0
            WHEN 'Crystal 60L' THEN 1.0
            WHEN 'Vienna Malt' THEN 0.5
        END,
        'lbs',
        CASE rm."Name"
            WHEN '2-Row Pale Malt' THEN 1
            WHEN 'Crystal 60L' THEN 2
            WHEN 'Vienna Malt' THEN 3
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Grains & Malts'
    AND rm."Name" IN ('2-Row Pale Malt', 'Crystal 60L', 'Vienna Malt')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- West Coast IPA Recipe Hops
    INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Time", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '11111111-1111-1111-1111-111111111111'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'Columbus' THEN 1.0
            WHEN 'Centennial' THEN 1.5
            WHEN 'Cascade' THEN 1.0
            ELSE 1.0
        END,
        'oz',
        CASE rm."Name"
            WHEN 'Columbus' THEN 60
            WHEN 'Centennial' THEN 15
            WHEN 'Cascade' THEN 0
            ELSE 0
        END,
        CASE rm."Name"
            WHEN 'Columbus' THEN 1
            WHEN 'Centennial' THEN 2
            WHEN 'Cascade' THEN 3
            ELSE 4
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Hops'
    AND rm."Name" IN ('Columbus', 'Centennial', 'Cascade')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- West Coast IPA Recipe Yeast
    INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '11111111-1111-1111-1111-111111111111'::uuid,
        rm."MaterialId",
        1,
        'package',
        1,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Yeast'
    AND rm."Name" = 'Safale US-05'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Midnight Porter Recipe Grains
    INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '22222222-2222-2222-2222-222222222222'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'Maris Otter' THEN 8.0
            WHEN 'Crystal 120L' THEN 1.5
            WHEN 'Chocolate Malt' THEN 0.75
            WHEN 'Roasted Barley' THEN 0.5
        END,
        'lbs',
        CASE rm."Name"
            WHEN 'Maris Otter' THEN 1
            WHEN 'Crystal 120L' THEN 2
            WHEN 'Chocolate Malt' THEN 3
            WHEN 'Roasted Barley' THEN 4
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Grains & Malts'
    AND rm."Name" IN ('Maris Otter', 'Crystal 120L', 'Chocolate Malt', 'Roasted Barley')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Midnight Porter Recipe Hops
    INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Time", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '22222222-2222-2222-2222-222222222222'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'East Kent Goldings' THEN 1.25
            WHEN 'Fuggle' THEN 0.75
        END,
        'oz',
        CASE rm."Name"
            WHEN 'East Kent Goldings' THEN 60
            WHEN 'Fuggle' THEN 15
        END,
        CASE rm."Name"
            WHEN 'East Kent Goldings' THEN 1
            WHEN 'Fuggle' THEN 2
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Hops'
    AND rm."Name" IN ('East Kent Goldings', 'Fuggle')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Midnight Porter Recipe Yeast
    INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '22222222-2222-2222-2222-222222222222'::uuid,
        rm."MaterialId",
        1,
        'package',
        1,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Yeast'
    AND rm."Name" = 'London ESB Ale'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Bavarian Pilsner Recipe Grains
    INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '33333333-3333-3333-3333-333333333333'::uuid,
        rm."MaterialId",
        9.5,
        'lbs',
        1,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Grains & Malts'
    AND rm."Name" = 'Pilsner Malt'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Bavarian Pilsner Recipe Hops
    INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Time", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '33333333-3333-3333-3333-333333333333'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'Hallertau Mittelfrüh' THEN 1.5
            WHEN 'Saaz' THEN 1.0
        END,
        'oz',
        CASE rm."Name"
            WHEN 'Hallertau Mittelfrüh' THEN 60
            WHEN 'Saaz' THEN 20
        END,
        CASE rm."Name"
            WHEN 'Hallertau Mittelfrüh' THEN 1
            WHEN 'Saaz' THEN 2
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Hops'
    AND rm."Name" IN ('Hallertau Mittelfrüh', 'Saaz')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Bavarian Pilsner Recipe Yeast
    INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '33333333-3333-3333-3333-333333333333'::uuid,
        rm."MaterialId",
        1,
        'package',
        1,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Yeast'
    AND rm."Name" = 'Saflager W-34/70'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Abbey Golden Ale Recipe Grains
    INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '44444444-4444-4444-4444-444444444444'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'Pilsner Malt' THEN 8.5
            WHEN 'Munich Malt' THEN 1.0
            WHEN 'Crystal 40L' THEN 0.5
        END,
        'lbs',
        CASE rm."Name"
            WHEN 'Pilsner Malt' THEN 1
            WHEN 'Munich Malt' THEN 2
            WHEN 'Crystal 40L' THEN 3
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Grains & Malts'
    AND rm."Name" IN ('Pilsner Malt', 'Munich Malt', 'Crystal 40L')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Abbey Golden Ale Recipe Hops
    INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Time", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '44444444-4444-4444-4444-444444444444'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'Saaz' THEN 1.25
            WHEN 'Tettnang' THEN 0.75
        END,
        'oz',
        CASE rm."Name"
            WHEN 'Saaz' THEN 60
            WHEN 'Tettnang' THEN 10
        END,
        CASE rm."Name"
            WHEN 'Saaz' THEN 1
            WHEN 'Tettnang' THEN 2
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Hops'
    AND rm."Name" IN ('Saaz', 'Tettnang')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Abbey Golden Ale Recipe Yeast
    INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '44444444-4444-4444-4444-444444444444'::uuid,
        rm."MaterialId",
        1,
        'package',
        1,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Yeast'
    AND rm."Name" = 'Belgian Abbey Ale II'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Thames Valley ESB Recipe Grains
    INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '55555555-5555-5555-5555-555555555555'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'Maris Otter' THEN 9.0
            WHEN 'Crystal 60L' THEN 1.0
            WHEN 'Crystal 120L' THEN 0.5
        END,
        'lbs',
        CASE rm."Name"
            WHEN 'Maris Otter' THEN 1
            WHEN 'Crystal 60L' THEN 2
            WHEN 'Crystal 120L' THEN 3
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Grains & Malts'
    AND rm."Name" IN ('Maris Otter', 'Crystal 60L', 'Crystal 120L')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Thames Valley ESB Recipe Hops
    INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Time", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '55555555-5555-5555-5555-555555555555'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'East Kent Goldings' THEN 1.5
            WHEN 'Fuggle' THEN 0.75
        END,
        'oz',
        CASE rm."Name"
            WHEN 'East Kent Goldings' THEN 60
            WHEN 'Fuggle' THEN 15
        END,
        CASE rm."Name"
            WHEN 'East Kent Goldings' THEN 1
            WHEN 'Fuggle' THEN 2
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Hops'
    AND rm."Name" IN ('East Kent Goldings', 'Fuggle')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Thames Valley ESB Recipe Yeast
    INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '55555555-5555-5555-5555-555555555555'::uuid,
        rm."MaterialId",
        1,
        'package',
        1,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Yeast'
    AND rm."Name" = 'Thames Valley Ale'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Velvet Oatmeal Stout Recipe Grains
    INSERT INTO "RecipeGrain" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '66666666-6666-6666-6666-666666666666'::uuid,
        rm."MaterialId",
        CASE rm."Name"
            WHEN 'Maris Otter' THEN 7.5
            WHEN 'Flaked Oats' THEN 1.5
            WHEN 'Crystal 120L' THEN 1.0
            WHEN 'Roasted Barley' THEN 0.75
            WHEN 'Chocolate Malt' THEN 0.5
        END,
        'lbs',
        CASE rm."Name"
            WHEN 'Maris Otter' THEN 1
            WHEN 'Flaked Oats' THEN 2
            WHEN 'Crystal 120L' THEN 3
            WHEN 'Roasted Barley' THEN 4
            WHEN 'Chocolate Malt' THEN 5
        END,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Grains & Malts'
    AND rm."Name" IN ('Maris Otter', 'Flaked Oats', 'Crystal 120L', 'Roasted Barley', 'Chocolate Malt')
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Velvet Oatmeal Stout Recipe Hops
    INSERT INTO "RecipeHop" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Time", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '66666666-6666-6666-6666-666666666666'::uuid,
        rm."MaterialId",
        1.25,
        'oz',
        60,
        1,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Hops'
    AND rm."Name" = 'East Kent Goldings'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    -- Velvet Oatmeal Stout Recipe Yeast
    INSERT INTO "RecipeYeast" ("RecipeId", "MaterialId", "Amount", "AmountUnit", "Position", "CreatedBy", "UpdatedBy")
    SELECT
        '66666666-6666-6666-6666-666666666666'::uuid,
        rm."MaterialId",
        1,
        'package',
        1,
        user_id,
        user_id
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    WHERE rmc."Name" = 'Yeast'
    AND rm."Name" = 'London ESB Ale'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid;

    RAISE NOTICE 'Recipe ingredient linkages created successfully';

END $$;

COMMIT;