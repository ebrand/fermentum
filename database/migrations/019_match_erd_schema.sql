-- Migration 019: Update database schema to match ERD exactly
-- WARNING: This migration will destroy existing data in Brewery and Employee tables
-- due to primary key type changes from integer to uuid

BEGIN;

-- Step 1: Drop existing foreign key constraints that reference the old integer keys
ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS fk_employees_brewery;

-- Step 2: Create Tenant_PaymentMethod junction table
CREATE TABLE IF NOT EXISTS "Tenant_PaymentMethod" (
    "TenantId" uuid NOT NULL,
    "PaymentMethodId" uuid NOT NULL,
    "IsDefault" boolean NOT NULL DEFAULT false,
    "IsActive" boolean NOT NULL DEFAULT true,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    CONSTRAINT "PK_Tenant_PaymentMethod" PRIMARY KEY ("TenantId", "PaymentMethodId"),
    CONSTRAINT "FK_Tenant_PaymentMethod_Tenant" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "FK_Tenant_PaymentMethod_PaymentMethod" FOREIGN KEY ("PaymentMethodId") REFERENCES "PaymentMethod"("PaymentMethodId") ON DELETE CASCADE
);

-- Step 3: Fix column name inconsistencies in AuditLog
ALTER TABLE "AuditLog" RENAME COLUMN "OldValue" TO "OldValues";
ALTER TABLE "AuditLog" RENAME COLUMN "NewValue" TO "NewValues";

-- Step 4: Fix column name inconsistencies in Brewery
ALTER TABLE "Brewery" RENAME COLUMN "Modified" TO "Updated";
ALTER TABLE "Brewery" RENAME COLUMN "ModifiedBy" TO "UpdatedBy";

-- Step 5: Fix column name inconsistencies in Employee
ALTER TABLE "Employee" RENAME COLUMN "Modified" TO "Updated";
ALTER TABLE "Employee" RENAME COLUMN "ModifiedBy" TO "UpdatedBy";

-- Step 6: Drop and recreate Brewery table with uuid primary key
-- Save any existing data first
CREATE TEMP TABLE brewery_backup AS
SELECT "TenantId", "Name", "Created", "CreatedBy", "Updated", "UpdatedBy"
FROM "Brewery";

-- Drop the table (this will cascade and drop dependent foreign keys)
DROP TABLE "Brewery" CASCADE;

-- Recreate Brewery table with uuid primary key
CREATE TABLE "Brewery" (
    "BreweryId" uuid NOT NULL DEFAULT gen_random_uuid(),
    "TenantId" uuid NOT NULL,
    "Name" character varying(255) NOT NULL,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    CONSTRAINT "PK_Brewery" PRIMARY KEY ("BreweryId"),
    CONSTRAINT "FK_Brewery_Tenant" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE CASCADE
);

-- Create indexes for Brewery
CREATE INDEX "IX_Brewery_TenantId" ON "Brewery" ("TenantId");
CREATE UNIQUE INDEX "IX_Brewery_TenantId_Name" ON "Brewery" ("TenantId", "Name");

-- Restore data to Brewery table (new UUIDs will be generated)
INSERT INTO "Brewery" ("TenantId", "Name", "Created", "CreatedBy", "Updated", "UpdatedBy")
SELECT "TenantId", "Name", "Created", "CreatedBy", "Updated", "UpdatedBy"
FROM brewery_backup;

-- Step 7: Update Employee table to use uuid primary key
-- Since BreweryId references are now broken, we'll need to clear them and recreate the table
CREATE TEMP TABLE employee_backup AS
SELECT "TenantId", "FirstName", "LastName", "IsActive", "Created", "CreatedBy", "Updated", "UpdatedBy", "UserId"
FROM "Employee";

-- Drop Employee table
DROP TABLE "Employee" CASCADE;

-- Recreate Employee table with uuid primary key
CREATE TABLE "Employee" (
    "EmployeeId" uuid NOT NULL DEFAULT gen_random_uuid(),
    "TenantId" uuid NOT NULL,
    "BreweryId" uuid,
    "UserId" uuid,
    "FirstName" character varying(100) NOT NULL,
    "LastName" character varying(100) NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    CONSTRAINT "PK_Employee" PRIMARY KEY ("EmployeeId"),
    CONSTRAINT "FK_Employee_Tenant" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "FK_Employee_Brewery" FOREIGN KEY ("BreweryId") REFERENCES "Brewery"("BreweryId") ON DELETE SET NULL,
    CONSTRAINT "FK_Employee_User" FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE SET NULL
);

-- Create indexes for Employee
CREATE INDEX "IX_Employee_TenantId" ON "Employee" ("TenantId");
CREATE INDEX "IX_Employee_BreweryId" ON "Employee" ("BreweryId");
CREATE INDEX "IX_Employee_UserId" ON "Employee" ("UserId");
CREATE INDEX "IX_Employee_TenantId_IsActive" ON "Employee" ("TenantId", "IsActive");
CREATE INDEX "IX_Employee_TenantId_LastName_FirstName" ON "Employee" ("TenantId", "LastName", "FirstName");

-- Restore employee data (without BreweryId references for now)
INSERT INTO "Employee" ("TenantId", "FirstName", "LastName", "IsActive", "Created", "CreatedBy", "Updated", "UpdatedBy", "UserId")
SELECT "TenantId", "FirstName", "LastName", "IsActive", "Created", "CreatedBy", "Updated", "UpdatedBy", "UserId"
FROM employee_backup;

-- Step 8: Re-enable RLS policies for new tables
ALTER TABLE "Brewery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant_PaymentMethod" ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for Brewery
CREATE POLICY "brewery_tenant_read" ON "Brewery" FOR SELECT
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "brewery_tenant_insert" ON "Brewery" FOR INSERT
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "brewery_tenant_update" ON "Brewery" FOR UPDATE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid)
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "brewery_tenant_delete" ON "Brewery" FOR DELETE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);

-- Recreate RLS policies for Employee
CREATE POLICY "employee_tenant_read" ON "Employee" FOR SELECT
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "employee_tenant_insert" ON "Employee" FOR INSERT
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "employee_tenant_update" ON "Employee" FOR UPDATE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid)
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "employee_tenant_delete" ON "Employee" FOR DELETE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);

-- Create RLS policies for Tenant_PaymentMethod
CREATE POLICY "tenant_payment_method_read" ON "Tenant_PaymentMethod" FOR SELECT
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "tenant_payment_method_insert" ON "Tenant_PaymentMethod" FOR INSERT
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "tenant_payment_method_update" ON "Tenant_PaymentMethod" FOR UPDATE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid)
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "tenant_payment_method_delete" ON "Tenant_PaymentMethod" FOR DELETE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);

-- Clean up temp tables
DROP TABLE brewery_backup;
DROP TABLE employee_backup;

COMMIT;