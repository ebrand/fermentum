-- Migration: Refactor User-Tenant relationship to junction table pattern
-- This migration removes TenantId from User table and creates User_Tenant junction table

BEGIN;

-- Step 1: Create User_Tenant junction table
CREATE TABLE "User_Tenant" (
    "UserId" uuid NOT NULL,
    "TenantId" uuid NOT NULL,
    "Role" varchar(50) NOT NULL DEFAULT 'member',
    "IsActive" boolean NOT NULL DEFAULT true,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,
    PRIMARY KEY ("UserId", "TenantId")
);

-- Step 2: Add foreign key constraints
ALTER TABLE "User_Tenant" ADD CONSTRAINT "FK_User_Tenant_User"
    FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE CASCADE;

ALTER TABLE "User_Tenant" ADD CONSTRAINT "FK_User_Tenant_Tenant"
    FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE CASCADE;

-- Step 3: Migrate existing User-Tenant relationships to junction table
-- Any existing Users with TenantId will become 'owner' role in the junction table
INSERT INTO "User_Tenant" ("UserId", "TenantId", "Role", "IsActive", "Created", "CreatedBy", "Updated", "UpdatedBy")
SELECT
    "UserId",
    "TenantId",
    'owner' as "Role",
    true as "IsActive",
    CURRENT_TIMESTAMP as "Created",
    "UserId" as "CreatedBy",
    CURRENT_TIMESTAMP as "Updated",
    "UserId" as "UpdatedBy"
FROM "User"
WHERE "TenantId" IS NOT NULL;

-- Step 4: Remove TenantId column from User table
ALTER TABLE "User" DROP COLUMN "TenantId";

-- Step 5: Add indexes for performance
CREATE INDEX "IX_User_Tenant_UserId" ON "User_Tenant" ("UserId");
CREATE INDEX "IX_User_Tenant_TenantId" ON "User_Tenant" ("TenantId");
CREATE INDEX "IX_User_Tenant_Role" ON "User_Tenant" ("Role");

COMMIT;