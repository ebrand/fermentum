-- Migration 020: Clean recreation of schema to match ERD exactly
-- This clears all data and recreates the schema from scratch

BEGIN;

-- Drop all existing tables in correct dependency order
DROP TABLE IF EXISTS "Employee" CASCADE;
DROP TABLE IF EXISTS "Brewery" CASCADE;
DROP TABLE IF EXISTS "Tenant_PaymentMethod" CASCADE;
DROP TABLE IF EXISTS "PaymentMethod" CASCADE;
DROP TABLE IF EXISTS "Role" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;

-- Drop sequences that may have been created
DROP SEQUENCE IF EXISTS breweries_brewery_id_seq CASCADE;
DROP SEQUENCE IF EXISTS employees_employee_id_seq CASCADE;

-- 1. Create Tenant table
CREATE TABLE "Tenant" (
    "TenantId" uuid NOT NULL DEFAULT gen_random_uuid(),
    "Name" character varying(255) NOT NULL,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    CONSTRAINT "PK_Tenant" PRIMARY KEY ("TenantId")
);

-- 2. Create User table
CREATE TABLE "User" (
    "UserId" uuid NOT NULL DEFAULT gen_random_uuid(),
    "TenantId" uuid,
    "StytchUserId" character varying(255),
    "Email" character varying(255) NOT NULL,
    "FirstName" character varying(100),
    "LastName" character varying(100),
    "AvatarUrl" character varying,
    "OauthType" character varying,

    CONSTRAINT "PK_User" PRIMARY KEY ("UserId"),
    CONSTRAINT "FK_User_Tenant" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "IX_User_Email" ON "User" ("Email");
CREATE UNIQUE INDEX "IX_User_StytchUserId" ON "User" ("StytchUserId") WHERE "StytchUserId" IS NOT NULL;

-- 3. Create Role table
CREATE TABLE "Role" (
    "RoleId" uuid NOT NULL DEFAULT gen_random_uuid(),
    "TenantId" uuid NOT NULL,
    "Name" character varying(50) NOT NULL,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    CONSTRAINT "PK_Role" PRIMARY KEY ("RoleId"),
    CONSTRAINT "FK_Role_Tenant" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_Role_TenantId_Name" ON "Role" ("TenantId", "Name");

-- 4. Create Brewery table
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

CREATE INDEX "IX_Brewery_TenantId" ON "Brewery" ("TenantId");
CREATE UNIQUE INDEX "IX_Brewery_TenantId_Name" ON "Brewery" ("TenantId", "Name");

-- 5. Create Employee table
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

CREATE INDEX "IX_Employee_TenantId" ON "Employee" ("TenantId");
CREATE INDEX "IX_Employee_BreweryId" ON "Employee" ("BreweryId");
CREATE INDEX "IX_Employee_UserId" ON "Employee" ("UserId");
CREATE INDEX "IX_Employee_TenantId_IsActive" ON "Employee" ("TenantId", "IsActive");
CREATE INDEX "IX_Employee_TenantId_LastName_FirstName" ON "Employee" ("TenantId", "LastName", "FirstName");

-- 6. Create PaymentMethod table
CREATE TABLE "PaymentMethod" (
    "PaymentMethodId" uuid NOT NULL DEFAULT gen_random_uuid(),
    "StripeCustomerId" character varying(255) NOT NULL,
    "StripePaymentMethodId" character varying(255) NOT NULL,
    "PaymentMethodType" character varying(50) NOT NULL DEFAULT 'card',
    "CardBrand" character varying(50),
    "CardLast4" character varying(4),
    "CardExpMonth" integer,
    "CardExpYear" integer,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    CONSTRAINT "PK_PaymentMethod" PRIMARY KEY ("PaymentMethodId")
);

CREATE INDEX "IX_PaymentMethod_StripeCustomerId" ON "PaymentMethod" ("StripeCustomerId");
CREATE UNIQUE INDEX "IX_PaymentMethod_StripePaymentMethodId" ON "PaymentMethod" ("StripePaymentMethodId");

-- 7. Create Tenant_PaymentMethod junction table
CREATE TABLE "Tenant_PaymentMethod" (
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

-- 8. Create AuditLog table
CREATE TABLE "AuditLog" (
    "AuditLogId" uuid NOT NULL DEFAULT gen_random_uuid(),
    "TenantId" uuid,
    "UserId" uuid,
    "Action" character varying(100) NOT NULL,
    "ResourceType" character varying(50),
    "ResourceId" character varying(255),
    "IpAddress" text,
    "UserAgent" text,
    "RequestId" character varying(100),
    "OldValues" jsonb,
    "NewValues" jsonb,
    "Metadata" jsonb,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_AuditLog" PRIMARY KEY ("AuditLogId")
);

-- Enable Row Level Security on all tenant-related tables
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Brewery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentMethod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant_PaymentMethod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Brewery
CREATE POLICY "brewery_tenant_read" ON "Brewery" FOR SELECT
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "brewery_tenant_insert" ON "Brewery" FOR INSERT
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "brewery_tenant_update" ON "Brewery" FOR UPDATE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid)
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "brewery_tenant_delete" ON "Brewery" FOR DELETE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);

-- Create RLS policies for Employee
CREATE POLICY "employee_tenant_read" ON "Employee" FOR SELECT
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "employee_tenant_insert" ON "Employee" FOR INSERT
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "employee_tenant_update" ON "Employee" FOR UPDATE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid)
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "employee_tenant_delete" ON "Employee" FOR DELETE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);

-- Create RLS policies for Role
CREATE POLICY "role_tenant_read" ON "Role" FOR SELECT
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "role_tenant_insert" ON "Role" FOR INSERT
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "role_tenant_update" ON "Role" FOR UPDATE
    USING ("TenantId" = (current_setting('app.tenant_id', true))::uuid)
    WITH CHECK ("TenantId" = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY "role_tenant_delete" ON "Role" FOR DELETE
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

COMMIT;