-- Migration: Simple population of raw materials from existing ingredients
-- Date: 2025-01-27
-- Description: Creates raw materials from existing ingredient data with simple approach

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

    -- Get category IDs
    SELECT "CategoryId" INTO grains_category_id FROM "RawMaterialCategory" WHERE "Name" = 'Grains & Malts';
    SELECT "CategoryId" INTO hops_category_id FROM "RawMaterialCategory" WHERE "Name" = 'Hops';
    SELECT "CategoryId" INTO yeast_category_id FROM "RawMaterialCategory" WHERE "Name" = 'Yeast';
    SELECT "CategoryId" INTO additives_category_id FROM "RawMaterialCategory" WHERE "Name" = 'Additives & Finings';

    -- Insert raw materials from grains
    INSERT INTO "RawMaterial" ("TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure", "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy")
    SELECT
        '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
        grains_category_id,
        "Name",
        "Description",
        'lbs',
        5.00,
        "IsActive",
        user_id,
        user_id
    FROM "Grain";

    -- Insert raw materials from hops
    INSERT INTO "RawMaterial" ("TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure", "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy")
    SELECT
        '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
        hops_category_id,
        "Name",
        "Description",
        'oz',
        3.50,
        "IsActive",
        user_id,
        user_id
    FROM "Hop";

    -- Insert raw materials from yeasts
    INSERT INTO "RawMaterial" ("TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure", "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy")
    SELECT
        '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
        yeast_category_id,
        "Name",
        "Description",
        'package',
        8.00,
        "IsActive",
        user_id,
        user_id
    FROM "Yeast";

    -- Insert raw materials from additives
    INSERT INTO "RawMaterial" ("TenantId", "CategoryId", "Name", "Description", "UnitOfMeasure", "CostPerUnit", "IsActive", "CreatedBy", "UpdatedBy")
    SELECT
        '23f1ad78-d246-4b9f-8d38-d7e91abf4541'::uuid,
        additives_category_id,
        "Name",
        "Description",
        'g',
        0.25,
        "IsActive",
        user_id,
        user_id
    FROM "Additive";

END $$;

COMMIT;