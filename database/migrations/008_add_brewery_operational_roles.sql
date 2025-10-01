-- Add comprehensive brewery operational roles to support detailed role-based access control
-- Based on brewery operations and employee roles defined in the comprehensive schema

-- First, let's create a proper roles table for better role management
CREATE TABLE IF NOT EXISTS public.tenant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Role definition
    role_name VARCHAR(50) NOT NULL,
    role_code VARCHAR(20) NOT NULL, -- Short code for system use
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Role hierarchy and permissions
    level INTEGER NOT NULL DEFAULT 0, -- 0=lowest access, 100=highest access
    is_system_role BOOLEAN DEFAULT false, -- System-defined vs custom roles
    permissions JSONB DEFAULT '{}', -- Detailed permissions object

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Constraints
    CONSTRAINT unique_role_per_tenant UNIQUE(tenant_id, role_code),
    CONSTRAINT unique_role_name_per_tenant UNIQUE(tenant_id, role_name)
);

-- Create indexes
CREATE INDEX idx_tenant_roles_tenant ON public.tenant_roles(tenant_id);
CREATE INDEX idx_tenant_roles_code ON public.tenant_roles(role_code);
CREATE INDEX idx_tenant_roles_level ON public.tenant_roles(level);
CREATE INDEX idx_tenant_roles_active ON public.tenant_roles(is_active) WHERE is_active = true;

-- Insert system-defined brewery operational roles
-- These roles will be available to all tenants and match the database schema requirements

INSERT INTO public.tenant_roles (
    tenant_id,
    role_name,
    role_code,
    display_name,
    description,
    level,
    is_system_role,
    permissions
) VALUES
-- Ownership and Management Roles
(NULL, 'owner', 'owner', 'Brewery Owner', 'Full ownership and control of brewery operations, billing, and settings', 100, true,
 '{"dashboard": {"view": true}, "production": {"view": true, "manage": true, "edit": true}, "inventory": {"view": true, "manage": true, "audit": true}, "sales": {"view": true, "manage": true}, "equipment": {"view": true, "manage": true, "maintain": true}, "team": {"view": true, "manage": true, "hire": true}, "reports": {"view": true, "financial": true}, "settings": {"view": true, "manage": true, "billing": true}}'),

(NULL, 'manager', 'mgr', 'Brewery Manager', 'Overall brewery operations management and supervision', 90, true,
 '{"dashboard": {"view": true}, "production": {"view": true, "manage": true, "edit": true}, "inventory": {"view": true, "manage": true, "audit": true}, "sales": {"view": true, "manage": true}, "equipment": {"view": true, "manage": true}, "team": {"view": true, "manage": true}, "reports": {"view": true, "production": true, "sales": true, "inventory": true}, "settings": {"view": true}}'),

-- Department-Specific Management Roles
(NULL, 'brew-manager', 'bmgr', 'Head Brewer / Brew Manager', 'Manages all brewing operations, recipes, and production schedules', 80, true,
 '{"dashboard": {"view": true}, "production": {"view": true, "manage": true, "edit": true, "recipes": true, "batches": true}, "inventory": {"view": true, "manage": true}, "equipment": {"view": true, "manage": true, "maintain": true}, "team": {"view": true}, "reports": {"view": true, "production": true}, "settings": {"view": true}}'),

(NULL, 'sales', 'sales', 'Sales Manager', 'Manages customer relationships, orders, and sales operations', 70, true,
 '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true}, "sales": {"view": true, "manage": true, "customers": true, "orders": true, "pricing": true}, "equipment": {"view": true}, "team": {"view": true}, "reports": {"view": true, "sales": true}, "settings": {"view": true}}'),

(NULL, 'accounting', 'acct', 'Accounting Manager', 'Handles financial reporting, billing, and cost management', 75, true,
 '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true, "costs": true}, "sales": {"view": true, "pricing": true}, "equipment": {"view": true, "costs": true}, "team": {"view": true, "payroll": true}, "reports": {"view": true, "financial": true, "costs": true}, "settings": {"view": true, "billing": true}}'),

(NULL, 'maintenance', 'maint', 'Maintenance Manager', 'Oversees equipment maintenance, repairs, and facility management', 65, true,
 '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true, "supplies": true}, "sales": {"view": false}, "equipment": {"view": true, "manage": true, "maintain": true, "repair": true, "schedule": true}, "team": {"view": true}, "reports": {"view": true, "equipment": true}, "settings": {"view": true}}'),

-- Operational Roles
(NULL, 'brewer', 'brew', 'Brewer', 'Executes brewing operations, batch production, and quality control', 60, true,
 '{"dashboard": {"view": true}, "production": {"view": true, "edit": true, "batches": true, "quality": true}, "inventory": {"view": true, "use": true}, "sales": {"view": false}, "equipment": {"view": true, "operate": true}, "team": {"view": false}, "reports": {"view": true, "production": true}, "settings": {"view": false}}'),

(NULL, 'employee', 'emp', 'General Employee', 'Basic brewery employee with limited operational access', 40, true,
 '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true}, "sales": {"view": false}, "equipment": {"view": true}, "team": {"view": false}, "reports": {"view": false}, "settings": {"view": false}}'),

-- Specialized Roles
(NULL, 'quality', 'qc', 'Quality Control', 'Focuses on quality assurance, testing, and compliance', 55, true,
 '{"dashboard": {"view": true}, "production": {"view": true, "quality": true, "testing": true}, "inventory": {"view": true, "quality": true}, "sales": {"view": false}, "equipment": {"view": true, "calibrate": true}, "team": {"view": false}, "reports": {"view": true, "quality": true}, "settings": {"view": false}}'),

(NULL, 'packaging', 'pkg', 'Packaging Specialist', 'Handles packaging operations and finished goods management', 50, true,
 '{"dashboard": {"view": true}, "production": {"view": true, "packaging": true}, "inventory": {"view": true, "packaging": true, "finished": true}, "sales": {"view": true, "orders": true}, "equipment": {"view": true, "packaging": true}, "team": {"view": false}, "reports": {"view": true, "inventory": true}, "settings": {"view": false}}'),

(NULL, 'viewer', 'view', 'Read-Only Viewer', 'Read-only access for auditing, reporting, or limited oversight', 10, true,
 '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true}, "sales": {"view": true}, "equipment": {"view": true}, "team": {"view": false}, "reports": {"view": true}, "settings": {"view": false}}');

-- Update the tenant_users table to support the new role system
-- Add a foreign key reference to the tenant_roles table
ALTER TABLE public.tenant_users
ADD COLUMN IF NOT EXISTS tenant_role_id UUID REFERENCES public.tenant_roles(id);

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_tenant_users_role_id ON public.tenant_users(tenant_role_id);

-- Create a function to automatically assign roles based on role_code
CREATE OR REPLACE FUNCTION assign_tenant_role_by_code(
    p_tenant_id UUID,
    p_user_id UUID,
    p_role_code VARCHAR(20)
) RETURNS UUID AS $$
DECLARE
    v_role_id UUID;
    v_tenant_user_id UUID;
BEGIN
    -- Find the role by code (prefer tenant-specific, fallback to system roles)
    SELECT id INTO v_role_id
    FROM public.tenant_roles
    WHERE role_code = p_role_code
      AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
    ORDER BY tenant_id NULLS LAST
    LIMIT 1;

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role code % not found for tenant %', p_role_code, p_tenant_id;
    END IF;

    -- Update or insert tenant_user record
    INSERT INTO public.tenant_users (tenant_id, user_id, role, tenant_role_id)
    VALUES (p_tenant_id, p_user_id, p_role_code, v_role_id)
    ON CONFLICT (tenant_id, user_id)
    DO UPDATE SET
        role = p_role_code,
        tenant_role_id = v_role_id,
        updated_at = NOW()
    RETURNING id INTO v_tenant_user_id;

    RETURN v_tenant_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy role queries
CREATE OR REPLACE VIEW public.v_tenant_user_roles AS
SELECT
    tu.id as tenant_user_id,
    tu.tenant_id,
    tu.user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.display_name,
    t.name as tenant_name,
    tu.role as role_code,
    COALESCE(tr.display_name, tu.role) as role_display_name,
    COALESCE(tr.description, 'Legacy role') as role_description,
    COALESCE(tr.level, 0) as role_level,
    COALESCE(tr.permissions, '{}') as role_permissions,
    tu.permissions as user_permissions,
    tu.joined_at,
    tu.is_active as user_active,
    CASE
        WHEN tu.role = 'owner' THEN true
        ELSE false
    END as is_owner
FROM public.tenant_users tu
JOIN public.users u ON tu.user_id = u.id
JOIN public.tenants t ON tu.tenant_id = t.id
LEFT JOIN public.tenant_roles tr ON tu.tenant_role_id = tr.id
WHERE tu.is_active = true
  AND u.is_active = true
  AND t.is_active = true;

-- Add trigger to update tenant_users.updated_at
CREATE OR REPLACE FUNCTION update_tenant_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_users_updated_at
    BEFORE UPDATE ON public.tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_users_updated_at();

-- Add trigger to update tenant_roles.updated_at
CREATE TRIGGER trigger_tenant_roles_updated_at
    BEFORE UPDATE ON public.tenant_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_users_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.tenant_roles IS 'Defines available roles within tenants with hierarchical permissions';
COMMENT ON COLUMN public.tenant_roles.level IS 'Role hierarchy level: 0=lowest access, 100=highest access';
COMMENT ON COLUMN public.tenant_roles.permissions IS 'JSON object defining specific permissions for this role';
COMMENT ON COLUMN public.tenant_roles.is_system_role IS 'True for system-defined roles, false for tenant-custom roles';

COMMENT ON VIEW public.v_tenant_user_roles IS 'Comprehensive view of users, their tenants, and role information';

COMMENT ON FUNCTION assign_tenant_role_by_code IS 'Helper function to assign roles to users by role code';