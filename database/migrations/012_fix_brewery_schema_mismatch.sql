-- Fix brewery table schema to match Entity Framework Brewery model expectations
-- This migration updates the brewery table structure to align with the C# model

-- First, let's add all the missing columns that the Entity Framework model expects
ALTER TABLE breweries
ADD COLUMN IF NOT EXISTS brewery_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS business_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS brewery_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS state_province VARCHAR(100),
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS founded_date DATE,
ADD COLUMN IF NOT EXISTS annual_capacity_liters DECIMAL(12,2);

-- Copy data from existing columns to new expected column names
UPDATE breweries SET
    brewery_name = name,
    business_name = legal_name,
    brewery_code = UPPER(SUBSTRING(name FROM 1 FOR 3)) || LPAD(brewery_id::TEXT, 3, '0')
WHERE brewery_name IS NULL;

-- Set brewery_name as NOT NULL now that we've populated it
ALTER TABLE breweries ALTER COLUMN brewery_name SET NOT NULL;

-- Update any NULL country values to default
UPDATE breweries SET country = 'US' WHERE country IS NULL;

-- The existing columns that already match the model:
-- - tenant_id (UUID) ✓
-- - description ✓
-- - address_line1 ✓
-- - address_line2 ✓
-- - city ✓
-- - postal_code ✓
-- - country ✓
-- - website ✓
-- - phone ✓
-- - email ✓
-- - is_active ✓
-- - created ✓
-- - created_by ✓
-- - modified ✓
-- - modified_by ✓

-- Drop the old columns that don't match the model
-- (Keep them for now in case we need to roll back)
-- ALTER TABLE breweries DROP COLUMN IF EXISTS name;
-- ALTER TABLE breweries DROP COLUMN IF EXISTS legal_name;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_breweries_brewery_name ON breweries(brewery_name);
CREATE INDEX IF NOT EXISTS idx_breweries_brewery_code ON breweries(brewery_code);
CREATE INDEX IF NOT EXISTS idx_breweries_state_province ON breweries(state_province);

-- Update existing brewery records with some default data for testing
UPDATE breweries SET
    brewery_code = UPPER(SUBSTRING(brewery_name FROM 1 FOR 3)) || LPAD(brewery_id::TEXT, 3, '0'),
    founded_date = '2020-01-01',
    annual_capacity_liters = 10000.00
WHERE brewery_code IS NULL;