-- ============================================================================
-- Run Development Seed Data
-- This script loads development seed data during container initialization
-- ============================================================================

-- Only run seed data in development environment
-- Production deployments should skip this file

\echo 'Loading development seed data...'

-- System users and tenants
\i /docker-entrypoint-initdb.d/../seeds/001_system_seed_data.sql

-- Sample brewery data
\i /docker-entrypoint-initdb.d/../seeds/002_brewery_sample_data.sql

\echo 'Development seed data loaded successfully.'
\echo 'Available test tenants:'
\echo '  - Craft Beer Co (craftbeer.fermentum.localhost)'
\echo '  - Microbrewery Inc (microbrewery.fermentum.localhost)'
\echo 'Test user: owner@craftbeer.dev'