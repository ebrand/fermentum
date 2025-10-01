-- Migration: Create Invitation table for managing user invitations
-- Date: 2025-09-23
-- Description: Adds proper invitation system to track pending and accepted invitations

BEGIN;

-- Create Invitation table
CREATE TABLE "Invitation" (
    "InvitationId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "BreweryId" UUID NOT NULL,
    "UserId" UUID NULL, -- Set when invitation is accepted
    "InvitationDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpirationDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    "AcceptedDate" TIMESTAMP WITH TIME ZONE NULL,
    "Email" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "AcceptedFlag" BOOLEAN NOT NULL DEFAULT false,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NULL,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID NULL,

    -- Foreign key constraints
    CONSTRAINT "FK_Invitation_Brewery" FOREIGN KEY ("BreweryId") REFERENCES "Brewery"("BreweryId") ON DELETE CASCADE,
    CONSTRAINT "FK_Invitation_User" FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE SET NULL,
    CONSTRAINT "FK_Invitation_CreatedBy" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL,
    CONSTRAINT "FK_Invitation_UpdatedBy" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL,

    -- Email validation constraint
    CONSTRAINT "CHK_Invitation_Email" CHECK ("Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

    -- Role validation constraint
    CONSTRAINT "CHK_Invitation_Role" CHECK ("Role" IN ('owner', 'admin', 'manager', 'brewer', 'member', 'viewer')),

    -- Expiration date must be after invitation date
    CONSTRAINT "CHK_Invitation_Dates" CHECK ("ExpirationDate" > "InvitationDate")
);

-- Create indexes for better performance
CREATE INDEX "IX_Invitation_BreweryId" ON "Invitation"("BreweryId");
CREATE INDEX "IX_Invitation_UserId" ON "Invitation"("UserId") WHERE "UserId" IS NOT NULL;
CREATE INDEX "IX_Invitation_Email" ON "Invitation"("Email");
CREATE INDEX "IX_Invitation_Status" ON "Invitation"("AcceptedFlag", "ExpirationDate");
CREATE INDEX "IX_Invitation_Created" ON "Invitation"("Created");

-- Create unique constraint to prevent duplicate pending invitations for same email/brewery
CREATE UNIQUE INDEX "IX_Invitation_Unique_Pending"
ON "Invitation"("BreweryId", "Email")
WHERE "AcceptedFlag" = false;

-- Add comments for documentation
COMMENT ON TABLE "Invitation" IS 'Stores user invitations to join breweries with expiration and acceptance tracking';
COMMENT ON COLUMN "Invitation"."InvitationId" IS 'Unique identifier for the invitation';
COMMENT ON COLUMN "Invitation"."BreweryId" IS 'The brewery the user is being invited to join';
COMMENT ON COLUMN "Invitation"."UserId" IS 'Set when the invitation is accepted - links to the actual user';
COMMENT ON COLUMN "Invitation"."InvitationDate" IS 'When the invitation was sent';
COMMENT ON COLUMN "Invitation"."ExpirationDate" IS 'When the invitation expires (default 7 days)';
COMMENT ON COLUMN "Invitation"."AcceptedDate" IS 'When the invitation was accepted (null if not accepted)';
COMMENT ON COLUMN "Invitation"."Email" IS 'Email address the invitation was sent to';
COMMENT ON COLUMN "Invitation"."Role" IS 'Role the user will have when they accept the invitation';
COMMENT ON COLUMN "Invitation"."AcceptedFlag" IS 'Whether the invitation has been accepted';

-- Create RLS policies for multi-tenancy
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see invitations for breweries they have access to
CREATE POLICY "invitation_select_policy" ON "Invitation"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            JOIN "Brewery" b ON b."TenantId" = ut."TenantId"
            WHERE ut."UserId" = COALESCE(
                NULLIF(current_setting('app.user_id', true), '')::uuid,
                '00000000-0000-0000-0000-000000000000'::uuid
            )
            AND b."BreweryId" = "Invitation"."BreweryId"
            AND ut."IsActive" = true
        )
    );

-- Policy: Users can insert invitations for breweries they are owners/admins of
CREATE POLICY "invitation_insert_policy" ON "Invitation"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            JOIN "Brewery" b ON b."TenantId" = ut."TenantId"
            WHERE ut."UserId" = COALESCE(
                NULLIF(current_setting('app.user_id', true), '')::uuid,
                '00000000-0000-0000-0000-000000000000'::uuid
            )
            AND b."BreweryId" = "Invitation"."BreweryId"
            AND ut."IsActive" = true
            AND ut."Role" IN ('owner', 'admin')
        )
    );

-- Policy: Users can update invitations for breweries they are owners/admins of
CREATE POLICY "invitation_update_policy" ON "Invitation"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            JOIN "Brewery" b ON b."TenantId" = ut."TenantId"
            WHERE ut."UserId" = COALESCE(
                NULLIF(current_setting('app.user_id', true), '')::uuid,
                '00000000-0000-0000-0000-000000000000'::uuid
            )
            AND b."BreweryId" = "Invitation"."BreweryId"
            AND ut."IsActive" = true
            AND (ut."Role" IN ('owner', 'admin') OR "Invitation"."Email" = (
                SELECT "Email" FROM "User" WHERE "UserId" = ut."UserId"
            ))
        )
    );

-- Policy: Users can delete invitations for breweries they are owners/admins of
CREATE POLICY "invitation_delete_policy" ON "Invitation"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "User_Tenant" ut
            JOIN "Brewery" b ON b."TenantId" = ut."TenantId"
            WHERE ut."UserId" = COALESCE(
                NULLIF(current_setting('app.user_id', true), '')::uuid,
                '00000000-0000-0000-0000-000000000000'::uuid
            )
            AND b."BreweryId" = "Invitation"."BreweryId"
            AND ut."IsActive" = true
            AND ut."Role" IN ('owner', 'admin')
        )
    );

-- Grant permissions to the application user
GRANT SELECT, INSERT, UPDATE, DELETE ON "Invitation" TO fermentum_app;

-- Create a function to automatically cleanup expired invitations (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "Invitation"
    WHERE "AcceptedFlag" = false
    AND "ExpirationDate" < CURRENT_TIMESTAMP - INTERVAL '30 days'; -- Keep expired invitations for 30 days for audit

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_invitations() IS 'Cleans up old expired invitations (older than 30 days past expiration)';

COMMIT;

-- Insert some sample data for testing (optional)
-- This will be commented out in production
/*
INSERT INTO "Invitation" ("BreweryId", "Email", "Role", "CreatedBy")
SELECT
    b."BreweryId",
    'test.user@example.com',
    'brewer',
    (SELECT "UserId" FROM "User" LIMIT 1)
FROM "Brewery" b
LIMIT 1;
*/