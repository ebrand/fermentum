-- ============================================================================
-- Add User Audit and Profile Fields
-- Migration: 047_add_user_audit_and_profile_fields.sql
--
-- Adds ProfilePictureUrl and audit trail fields to the User table
-- These were lost in migration 020 clean recreation
-- ============================================================================

BEGIN;

-- Add profile picture URL field
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ProfilePictureUrl" VARCHAR(500);

-- Add audit trail fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "Created" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "CreatedBy" UUID;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "Updated" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "UpdatedBy" UUID;

-- Add index for audit queries
CREATE INDEX IF NOT EXISTS "IX_User_Created" ON "User"("Created");

-- Add comments for documentation
COMMENT ON COLUMN "User"."ProfilePictureUrl" IS 'URL to user profile picture in uploads directory';
COMMENT ON COLUMN "User"."Created" IS 'Timestamp when user record was created';
COMMENT ON COLUMN "User"."CreatedBy" IS 'UserId of user who created this record';
COMMENT ON COLUMN "User"."Updated" IS 'Timestamp when user record was last updated';
COMMENT ON COLUMN "User"."UpdatedBy" IS 'UserId of user who last updated this record';

COMMIT;
