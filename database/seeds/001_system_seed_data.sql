-- ============================================================================
-- System Seed Data
-- Development seed data for core system tables and sample tenants
-- ============================================================================

-- Insert development system admin user
INSERT INTO public.users (
    id,
    stytch_user_id,
    email,
    email_verified,
    first_name,
    last_name,
    display_name,
    is_system_admin,
    created_at,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'stytch_dev_admin_001',
    'admin@fermentum.dev',
    true,
    'System',
    'Administrator',
    'System Admin',
    true,
    NOW(),
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample brewery owner user
INSERT INTO public.users (
    id,
    stytch_user_id,
    email,
    email_verified,
    first_name,
    last_name,
    display_name,
    is_system_admin,
    created_at,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'stytch_dev_user_001',
    'owner@craftbeer.fermentum.dev',
    true,
    'John',
    'Brewer',
    'John Brewer',
    false,
    NOW(),
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample tenant: Craft Beer Co
INSERT INTO public.tenants (
    id,
    name,
    slug,
    subdomain,
    plan_type,
    subscription_status,
    billing_email,
    schema_name,
    timezone,
    locale,
    features,
    settings,
    created_at,
    created_by,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Craft Beer Co',
    'craft-beer-co',
    'craftbeer',
    'premium',
    'active',
    'billing@craftbeer.fermentum.dev',
    'tenant_11111111111111111111111111111111',
    'America/New_York',
    'en-US',
    '{"advanced_analytics": true, "api_access": true, "multi_location": true}',
    '{"allow_public_recipes": true, "default_batch_size": 1000}',
    NOW(),
    '00000000-0000-0000-0000-000000000001',
    true
) ON CONFLICT (slug) DO NOTHING;

-- Insert sample tenant: Microbrewery Inc
INSERT INTO public.tenants (
    id,
    name,
    slug,
    subdomain,
    plan_type,
    subscription_status,
    billing_email,
    schema_name,
    timezone,
    locale,
    features,
    settings,
    created_at,
    created_by,
    is_active
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Microbrewery Inc',
    'microbrewery-inc',
    'microbrewery',
    'basic',
    'active',
    'accounts@microbrewery.fermentum.dev',
    'tenant_22222222222222222222222222222222',
    'America/Los_Angeles',
    'en-US',
    '{"advanced_analytics": false, "api_access": false, "multi_location": false}',
    '{"allow_public_recipes": false, "default_batch_size": 500}',
    NOW(),
    '00000000-0000-0000-0000-000000000001',
    true
) ON CONFLICT (slug) DO NOTHING;

-- Add tenant-user relationships
INSERT INTO public.tenant_users (
    id,
    tenant_id,
    user_id,
    role,
    status,
    joined_at,
    created_at
) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000002',
    'owner',
    'active',
    NOW(),
    NOW()
),
(
    '30000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000002',
    'admin',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Create the tenant schemas
SELECT public.create_tenant_schema(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001'
);

SELECT public.create_tenant_schema(
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001'
);

-- Log seed data creation
INSERT INTO public.audit_logs (
    action,
    resource_type,
    resource_id,
    new_values,
    metadata,
    created_at
) VALUES (
    'seed_data.created',
    'system',
    'development_seed',
    '{"tenants": 2, "users": 2, "schemas": 2}',
    '{"environment": "development", "script": "001_system_seed_data.sql"}',
    NOW()
);