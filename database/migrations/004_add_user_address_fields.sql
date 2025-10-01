-- ============================================================================
-- Add Address Fields to Users Table
-- Migration: 004_add_user_address_fields.sql
--
-- Adds address fields to the users table for user profile management
-- ============================================================================

-- Add address fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Add indexes for potential location-based queries
CREATE INDEX IF NOT EXISTS idx_users_city ON public.users(city);
CREATE INDEX IF NOT EXISTS idx_users_state ON public.users(state);
CREATE INDEX IF NOT EXISTS idx_users_zip_code ON public.users(zip_code);

-- Add comments for documentation
COMMENT ON COLUMN public.users.address IS 'Street address for user profile';
COMMENT ON COLUMN public.users.city IS 'City for user profile';
COMMENT ON COLUMN public.users.state IS 'State/Province for user profile';
COMMENT ON COLUMN public.users.zip_code IS 'Postal/ZIP code for user profile';