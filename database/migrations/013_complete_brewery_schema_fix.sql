-- Complete the brewery table schema fix to match Entity Framework model
-- This migration adds all remaining missing columns and fixes data

-- Add remaining missing columns that the Entity Framework model expects
ALTER TABLE breweries
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS modified_by UUID;

-- Copy data from existing 'name' column to 'brewery_name' column
UPDATE breweries SET brewery_name = name WHERE brewery_name IS NULL;

-- Set default values
UPDATE breweries SET
    country = 'US',
    brewery_code = UPPER(SUBSTRING(name FROM 1 FOR 3)) || LPAD(brewery_id::TEXT, 3, '0'),
    founded_date = '2020-01-01',
    annual_capacity_liters = 10000.00,
    modified = CURRENT_TIMESTAMP
WHERE country IS NULL;

-- Now we can make brewery_name NOT NULL since it's populated
ALTER TABLE breweries ALTER COLUMN brewery_name SET NOT NULL;

-- Add audit trigger for the modified column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_breweries_modified ON breweries;
CREATE TRIGGER update_breweries_modified
    BEFORE UPDATE ON breweries
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_breweries_tenant ON breweries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_breweries_created_by ON breweries(created_by);
CREATE INDEX IF NOT EXISTS idx_breweries_is_active ON breweries(is_active);