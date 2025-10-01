-- Railway Database Initialization Script
-- Run this script after PostgreSQL service is created in Railway

-- Create database (if not exists)
CREATE DATABASE fermentum;

-- Connect to fermentum database
\c fermentum;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial schema
CREATE SCHEMA IF NOT EXISTS public;

-- Users table (core authentication)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    stytch_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants table (multi-tenancy)
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id SERIAL PRIMARY KEY,
    tenant_name VARCHAR(200) NOT NULL,
    tenant_slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    subscription_status VARCHAR(50) DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(user_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_by INTEGER REFERENCES users(user_id)
);

-- User-Tenant relationships
CREATE TABLE IF NOT EXISTS user_tenants (
    user_tenant_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    is_active BOOLEAN DEFAULT TRUE,
    joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Breweries table
CREATE TABLE IF NOT EXISTS breweries (
    brewery_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    brewery_name VARCHAR(200) NOT NULL,
    business_name VARCHAR(200),
    brewery_code VARCHAR(20),
    description TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    license_number VARCHAR(100),
    tax_id VARCHAR(50),
    founded_date DATE,
    annual_capacity_liters DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(user_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_by INTEGER REFERENCES users(user_id)
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    brewery_id INTEGER NOT NULL REFERENCES breweries(brewery_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id),
    employee_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    job_title VARCHAR(150),
    department VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    employment_status VARCHAR(50) DEFAULT 'active',
    hourly_rate DECIMAL(8,2),
    salary_annual DECIMAL(12,2),
    access_level VARCHAR(50) DEFAULT 'standard',
    certifications TEXT[],
    security_clearance VARCHAR(50),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES employees(employee_id),
    modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_by INTEGER REFERENCES employees(employee_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_stytch_user_id ON users(stytch_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_breweries_tenant_id ON breweries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_brewery_id ON employees(brewery_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- Insert seed data for development/testing
INSERT INTO users (stytch_user_id, email, first_name, last_name, display_name, is_email_verified)
VALUES
    ('stytch-test-user-1', 'admin@fermentum.com', 'Admin', 'User', 'Admin User', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO tenants (tenant_name, tenant_slug, description, created_by)
VALUES
    ('Demo Brewery', 'demo-brewery', 'A demonstration brewery for testing', 1)
ON CONFLICT (tenant_slug) DO NOTHING;

INSERT INTO user_tenants (user_id, tenant_id, role)
VALUES
    (1, 1, 'owner')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO CURRENT_USER;