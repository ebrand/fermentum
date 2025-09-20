-- ============================================================================
-- Run Database Migrations
-- This script runs all migrations in order during container initialization
-- ============================================================================

-- Note: This file is executed by PostgreSQL during container startup
-- Migration files should be executed in order

\echo 'Running Fermentum database migrations...'

-- Core system schema (tenants, users, etc.)
\i /docker-entrypoint-initdb.d/../migrations/001_core_system_schema.sql

-- Tenant management functions
\i /docker-entrypoint-initdb.d/../migrations/003_tenant_management_functions.sql

\echo 'Migrations completed successfully.'