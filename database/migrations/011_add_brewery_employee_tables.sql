-- Add brewery and employee tables to existing tenant system
-- This migration adds brewery management without touching existing tenant structure

-- Breweries table (using existing tenants.id which is UUID)
CREATE TABLE IF NOT EXISTS breweries (
    brewery_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(255),
    description TEXT,

    -- Location information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    -- Business information
    license_number VARCHAR(100),
    tax_id VARCHAR(50),
    website VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    established_date DATE,

    -- Operational settings
    default_batch_size_liters DECIMAL(10,2) DEFAULT 1000.00,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(3) DEFAULT 'USD',

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,

    CONSTRAINT unique_brewery_name_per_tenant UNIQUE(tenant_id, name)
);

-- Employees table (staff members for breweries)
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- Link to system user account if they have one
    employee_number VARCHAR(50),

    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Employment information
    job_title VARCHAR(150),
    department VARCHAR(100), -- brewing, sales, admin, quality, maintenance
    hire_date DATE,
    termination_date DATE,
    employment_status VARCHAR(50) DEFAULT 'active', -- active, inactive, terminated
    hourly_rate DECIMAL(8,2),
    salary_annual DECIMAL(12,2),

    -- Permissions and certifications
    access_level VARCHAR(50) DEFAULT 'standard', -- admin, supervisor, standard, read_only
    certifications TEXT[], -- Array of certifications
    security_clearance VARCHAR(50),

    -- Emergency contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),

    is_active BOOLEAN DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_breweries_tenant ON breweries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_brewery ON employees(brewery_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);

-- Create audit trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
DROP TRIGGER IF EXISTS update_breweries_modified ON breweries;
CREATE TRIGGER update_breweries_modified BEFORE UPDATE ON breweries FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_employees_modified ON employees;
CREATE TRIGGER update_employees_modified BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert a default brewery for existing tenants that don't have one
INSERT INTO breweries (tenant_id, name, legal_name, description, is_active, created_by)
SELECT
    t.id,
    t.name || ' Brewery',
    t.name,
    'Default brewery for ' || t.name,
    true,
    NULL
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM breweries b WHERE b.tenant_id = t.id
);