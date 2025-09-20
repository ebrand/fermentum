-- ============================================================================
-- Fermentum Core System Schema
-- Multi-tenant SaaS foundation for brewery management
--
-- This migration creates the core system tables that exist in the public schema
-- and support multi-tenant operations across the platform.
-- ============================================================================

-- Enable Row Level Security globally
ALTER DATABASE fermentum SET row_security = on;

-- ============================================================================
-- TENANTS: Core tenant management
-- ============================================================================

CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE, -- URL-safe identifier (abc-brewery)
    domain VARCHAR(255), -- Custom domain (optional)
    subdomain VARCHAR(100) UNIQUE, -- fermentum subdomain (abc.fermentum.app)

    -- Subscription & billing
    plan_type VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, basic, premium, enterprise
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, cancelled
    billing_email VARCHAR(255),

    -- Technical settings
    schema_name VARCHAR(63) NOT NULL UNIQUE, -- PostgreSQL schema name (tenant_123abc)
    database_name VARCHAR(63), -- For future multi-database support
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',

    -- Feature flags
    features JSONB DEFAULT '{}', -- {"advanced_analytics": true, "api_access": false}
    settings JSONB DEFAULT '{}', -- tenant-specific configuration

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX idx_tenants_schema_name ON public.tenants(schema_name);
CREATE INDEX idx_tenants_plan_type ON public.tenants(plan_type);
CREATE INDEX idx_tenants_active ON public.tenants(is_active) WHERE is_active = true;

-- ============================================================================
-- USERS: System-wide user accounts
-- ============================================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity (Stytch integration)
    stytch_user_id VARCHAR(255) UNIQUE, -- Stytch user identifier
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT false,

    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url TEXT,
    phone VARCHAR(20),

    -- System fields
    is_system_admin BOOLEAN NOT NULL DEFAULT false, -- Super admin access
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stytch_id ON public.users(stytch_user_id);
CREATE INDEX idx_users_active ON public.users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_system_admin ON public.users(is_system_admin) WHERE is_system_admin = true;

-- ============================================================================
-- TENANT_USERS: User membership in tenants with roles
-- ============================================================================

CREATE TABLE public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Role & permissions
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, manager, member, viewer
    permissions JSONB DEFAULT '[]', -- Additional granular permissions

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, pending_invitation
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON public.tenant_users(role);
CREATE INDEX idx_tenant_users_status ON public.tenant_users(status);

-- ============================================================================
-- INVITATIONS: Pending user invitations to tenants
-- ============================================================================

CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Invitation details
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    token VARCHAR(255) NOT NULL UNIQUE, -- Secure invitation token

    -- Status & timing
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, expired, cancelled
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES public.users(id),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.users(id),

    UNIQUE(tenant_id, email, status) -- Prevent duplicate pending invitations
);

-- Indexes
CREATE INDEX idx_invitations_tenant ON public.invitations(tenant_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_expires ON public.invitations(expires_at);

-- ============================================================================
-- AUDIT_LOGS: System-wide audit trail
-- ============================================================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    tenant_id UUID REFERENCES public.tenants(id),
    user_id UUID REFERENCES public.users(id),

    -- Action details
    action VARCHAR(100) NOT NULL, -- 'user.login', 'tenant.created', 'schema.migrated'
    resource_type VARCHAR(50), -- 'user', 'tenant', 'brewery', 'batch'
    resource_id VARCHAR(255), -- ID of the affected resource

    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100), -- Correlation ID for distributed tracing

    -- Data
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',

    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);

-- Partition by month for performance (future enhancement)
-- CREATE INDEX idx_audit_created_monthly ON public.audit_logs(created_at)
-- WHERE created_at >= date_trunc('month', NOW());

-- ============================================================================
-- FUNCTIONS: Utility functions for tenant operations
-- ============================================================================

-- Generate tenant schema name from tenant ID
CREATE OR REPLACE FUNCTION public.generate_schema_name(tenant_uuid UUID)
RETURNS VARCHAR(63) AS $$
BEGIN
    RETURN 'tenant_' || REPLACE(tenant_uuid::text, '-', '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Automatic timestamp updates
-- ============================================================================

CREATE TRIGGER trigger_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_tenant_users_updated_at
    BEFORE UPDATE ON public.tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY: Basic RLS policies
-- ============================================================================

-- Enable RLS on tenant-aware tables
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be implemented with application roles
-- when the authentication service is built

-- ============================================================================
-- COMMENTS: Table and column documentation
-- ============================================================================

COMMENT ON TABLE public.tenants IS 'Core tenant/organization management for multi-tenant SaaS';
COMMENT ON COLUMN public.tenants.schema_name IS 'PostgreSQL schema name for tenant data isolation';
COMMENT ON COLUMN public.tenants.features IS 'Feature flags controlling tenant capabilities';

COMMENT ON TABLE public.users IS 'System-wide user accounts integrated with Stytch authentication';
COMMENT ON COLUMN public.users.stytch_user_id IS 'External Stytch user identifier for authentication';

COMMENT ON TABLE public.tenant_users IS 'User membership and roles within specific tenants';
COMMENT ON COLUMN public.tenant_users.permissions IS 'Granular permissions beyond base role';

COMMENT ON TABLE public.invitations IS 'Pending user invitations to join tenants';
COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail for compliance and debugging';