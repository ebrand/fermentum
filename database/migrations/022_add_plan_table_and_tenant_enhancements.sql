-- Migration 022: Add Plan table and enhance Tenant table with billing fields
-- Date: 2025-09-23
-- Description: Creates Plan table for data-driven plan management and adds billing fields to Tenant

BEGIN;

-- Create Plan table
CREATE TABLE "Plan" (
    "PlanId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL UNIQUE,
    "BreweryLimit" INTEGER NOT NULL,
    "UserLimit" INTEGER NOT NULL,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NULL,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID NULL
);

-- Add indexes for Plan table
CREATE INDEX "IX_Plan_Name" ON "Plan" ("Name");

-- Insert default plans
INSERT INTO "Plan" ("PlanId", "Name", "BreweryLimit", "UserLimit", "Created", "Updated") VALUES
    ('11111111-1111-1111-1111-111111111111', 'Starter', 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'Professional', 5, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333333', 'Enterprise', -1, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add new columns to Tenant table
ALTER TABLE "Tenant" ADD COLUMN "PlanId" UUID NULL;
ALTER TABLE "Tenant" ADD COLUMN "StripeCustomerId" VARCHAR(255) NULL;
ALTER TABLE "Tenant" ADD COLUMN "StripeSubscriptionId" VARCHAR(255) NULL;
ALTER TABLE "Tenant" ADD COLUMN "SubscriptionStatus" VARCHAR(50) NULL;
ALTER TABLE "Tenant" ADD COLUMN "BillingEmail" VARCHAR(255) NULL;
ALTER TABLE "Tenant" ADD COLUMN "TrialEndsAt" TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE "Tenant" ADD COLUMN "CurrentPeriodStart" TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE "Tenant" ADD COLUMN "CurrentPeriodEnd" TIMESTAMP WITH TIME ZONE NULL;

-- Add foreign key constraint
ALTER TABLE "Tenant" ADD CONSTRAINT "FK_Tenant_Plan"
    FOREIGN KEY ("PlanId") REFERENCES "Plan"("PlanId") ON DELETE SET NULL;

-- Add indexes for Tenant foreign key
CREATE INDEX "IX_Tenant_PlanId" ON "Tenant" ("PlanId");
CREATE INDEX "IX_Tenant_StripeCustomerId" ON "Tenant" ("StripeCustomerId");
CREATE INDEX "IX_Tenant_StripeSubscriptionId" ON "Tenant" ("StripeSubscriptionId");

-- Set default plan for existing tenants (Starter plan)
UPDATE "Tenant" SET "PlanId" = '11111111-1111-1111-1111-111111111111' WHERE "PlanId" IS NULL;

-- Enable RLS for Plan table
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Plan table (readable by all authenticated users)
CREATE POLICY plan_select ON "Plan" FOR SELECT USING (true);

-- Only system admins can modify plans
CREATE POLICY plan_insert ON "Plan" FOR INSERT WITH CHECK (
    current_setting('app.user_id', true) = ''
    OR current_setting('app.user_id', true) IS NULL
);

CREATE POLICY plan_update ON "Plan" FOR UPDATE USING (
    current_setting('app.user_id', true) = ''
    OR current_setting('app.user_id', true) IS NULL
) WITH CHECK (
    current_setting('app.user_id', true) = ''
    OR current_setting('app.user_id', true) IS NULL
);

CREATE POLICY plan_delete ON "Plan" FOR DELETE USING (
    current_setting('app.user_id', true) = ''
    OR current_setting('app.user_id', true) IS NULL
);

-- Grant permissions to application user
GRANT SELECT ON "Plan" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE ON "Tenant" TO fermentum_app;

COMMIT;