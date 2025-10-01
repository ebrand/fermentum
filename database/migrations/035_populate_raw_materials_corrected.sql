-- Migration: Populate raw materials from existing ingredients (corrected)
-- Date: 2025-01-27
-- Description: Creates raw materials from existing ingredient data with corrected column mapping

BEGIN;

-- Set tenant context
SET LOCAL app.current_tenant_id = '23f1ad78-d246-4b9f-8d38-d7e91abf4541';

-- Get a user ID for the foreign key requirements
DO $$
DECLARE
    user_id uuid;
    grains_category_id uuid;
    hops_category_id uuid;
    yeast_category_id uuid;
    additives_category_id uuid;
BEGIN
    -- Get user ID
    SELECT "UserId" INTO user_id FROM "User" LIMIT 1;

    IF user_id IS NULL THEN
        RAISE EXCEPTION 'No user found for foreign key requirements';
    END IF;

    -- Get category IDs
    SELECT "CategoryId" INTO grains_category_id FROM "RawMaterialCategory" WHERE "Name" = 'Grains & Malts';
    SELECT "CategoryId" INTO hops_category_id FROM "RawMaterialCategory" WHERE "Name" = 'Hops';
    SELECT "CategoryId" INTO yeast_category_id FROM "RawMaterialCategory" WHERE "Name" = 'Yeast';
    SELECT "CategoryId" INTO additives_category_id FROM "RawMaterialCategory" WHERE "Name" = 'Additives & Finings';

    -- Insert raw materials from grains
    INSERT INTO "RawMaterial" (
        "TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure",
        "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy"
    )
    SELECT
        '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
        grains_category_id,
        g."Name",
        COALESCE(g."Description", 'Grain ingredient for brewing'),
        'lbs',
        5.00,
        g."IsActive",
        user_id,
        user_id
    FROM "Grain" g
    WHERE g."TenantId" IS NULL; -- Only global grains

    -- Insert raw materials from hops (use FlavorProfile as description)
    INSERT INTO "RawMaterial" (
        "TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure",
        "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy"
    )
    SELECT
        '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
        hops_category_id,
        h."Name",
        COALESCE(h."FlavorProfile", 'Hop ingredient for brewing'),
        'oz',
        3.50,
        h."IsActive",
        user_id,
        user_id
    FROM "Hop" h
    WHERE h."TenantId" IS NULL; -- Only global hops

    -- Insert raw materials from yeasts
    INSERT INTO "RawMaterial" (
        "TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure",
        "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy"
    )
    SELECT
        '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
        yeast_category_id,
        y."Name",
        COALESCE(y."Description", 'Yeast ingredient for brewing'),
        'package',
        8.00,
        y."IsActive",
        user_id,
        user_id
    FROM "Yeast" y
    WHERE y."TenantId" IS NULL; -- Only global yeasts

    -- Insert raw materials from additives
    INSERT INTO "RawMaterial" (
        "TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure",
        "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy"
    )
    SELECT
        '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
        additives_category_id,
        a."Name",
        COALESCE(a."Description", 'Additive ingredient for brewing'),
        'g',
        0.25,
        a."IsActive",
        user_id,
        user_id
    FROM "Additive" a
    WHERE a."TenantId" IS NULL; -- Only global additives

    RAISE NOTICE 'Raw materials populated successfully';

END $$;

-- Now create ingredient mappings table to track the relationship between
-- original ingredients and the new RawMaterial entries
CREATE TABLE IF NOT EXISTS "IngredientMapping" (
    "MappingId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "MaterialId" uuid NOT NULL REFERENCES "RawMaterial"("MaterialId") ON DELETE CASCADE,
    "IngredientType" varchar(20) NOT NULL, -- 'grain', 'hop', 'yeast', 'additive'
    "IngredientId" uuid NOT NULL,
    "Created" timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Populate the mapping table
DO $$
DECLARE
    user_id uuid;
BEGIN
    SELECT "UserId" INTO user_id FROM "User" LIMIT 1;

    -- Map grains
    INSERT INTO "IngredientMapping" ("MaterialId", "IngredientType", "IngredientId")
    SELECT rm."MaterialId", 'grain', g."GrainId"
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    JOIN "Grain" g ON rm."Name" = g."Name"
    WHERE rmc."Name" = 'Grains & Malts'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid
    AND g."TenantId" IS NULL;

    -- Map hops
    INSERT INTO "IngredientMapping" ("MaterialId", "IngredientType", "IngredientId")
    SELECT rm."MaterialId", 'hop', h."HopId"
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    JOIN "Hop" h ON rm."Name" = h."Name"
    WHERE rmc."Name" = 'Hops'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid
    AND h."TenantId" IS NULL;

    -- Map yeasts
    INSERT INTO "IngredientMapping" ("MaterialId", "IngredientType", "IngredientId")
    SELECT rm."MaterialId", 'yeast', y."YeastId"
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    JOIN "Yeast" y ON rm."Name" = y."Name"
    WHERE rmc."Name" = 'Yeast'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid
    AND y."TenantId" IS NULL;

    -- Map additives
    INSERT INTO "IngredientMapping" ("MaterialId", "IngredientType", "IngredientId")
    SELECT rm."MaterialId", 'additive', a."AdditiveId"
    FROM "RawMaterial" rm
    JOIN "RawMaterialCategory" rmc ON rm."CategoryId" = rmc."CategoryId"
    JOIN "Additive" a ON rm."Name" = a."Name"
    WHERE rmc."Name" = 'Additives & Finings'
    AND rm."TenantId" = '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid
    AND a."TenantId" IS NULL;

    RAISE NOTICE 'Ingredient mappings created successfully';

END $$;

COMMIT;