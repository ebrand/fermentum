-- ============================================================================
-- Add User Profile Fields
-- Migration: 046_add_user_profile_fields.sql
--
-- Adds address and contact fields to the User table for profile management
-- These were lost in migration 020 clean recreation
-- ============================================================================

BEGIN;

-- Add profile fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "Phone" VARCHAR(20);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "Address" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "City" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "State" VARCHAR(50);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ZipCode" VARCHAR(20);

-- Add indexes for potential location-based queries
CREATE INDEX IF NOT EXISTS "IX_User_City" ON "User"("City");
CREATE INDEX IF NOT EXISTS "IX_User_State" ON "User"("State");
CREATE INDEX IF NOT EXISTS "IX_User_ZipCode" ON "User"("ZipCode");

-- Add comments for documentation
COMMENT ON COLUMN "User"."Phone" IS 'Phone number for user profile';
COMMENT ON COLUMN "User"."Address" IS 'Street address for user profile';
COMMENT ON COLUMN "User"."City" IS 'City for user profile';
COMMENT ON COLUMN "User"."State" IS 'State/Province for user profile';
COMMENT ON COLUMN "User"."ZipCode" IS 'Postal/ZIP code for user profile';

COMMIT;
