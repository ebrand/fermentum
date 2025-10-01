-- Add missing brewery operational roles to the existing tenant_roles table
-- Based on your request to ensure these roles are available: manager, maintenance, sales, accounting, brew-manager, brewer, employee

-- First, let's add the missing columns to support role hierarchy and codes
ALTER TABLE public.tenant_roles
ADD COLUMN IF NOT EXISTS role_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_tenant_roles_code ON public.tenant_roles(role_code);
CREATE INDEX IF NOT EXISTS idx_tenant_roles_level ON public.tenant_roles(level);
CREATE INDEX IF NOT EXISTS idx_tenant_roles_active ON public.tenant_roles(is_active) WHERE is_active = true;

-- Update existing roles with role codes and levels
UPDATE public.tenant_roles SET
    role_code = 'owner',
    level = 100
WHERE name = 'owner' AND role_code IS NULL;

UPDATE public.tenant_roles SET
    role_code = 'mgr',
    level = 90
WHERE name = 'manager' AND role_code IS NULL;

UPDATE public.tenant_roles SET
    role_code = 'brew',
    level = 60
WHERE name = 'brewer' AND role_code IS NULL;

UPDATE public.tenant_roles SET
    role_code = 'sales',
    level = 70
WHERE name = 'sales' AND role_code IS NULL;

UPDATE public.tenant_roles SET
    role_code = 'emp',
    level = 40
WHERE name = 'employee' AND role_code IS NULL;

-- Add the missing roles that were requested
INSERT INTO public.tenant_roles (
    tenant_id,
    name,
    role_code,
    display_name,
    description,
    level,
    is_system_role,
    permissions,
    is_active
) VALUES
-- Maintenance role
(NULL, 'maintenance', 'maint', 'Maintenance Manager', 'Oversees equipment maintenance, repairs, and facility management. Has access to equipment management and maintenance scheduling.', 65, true,
 '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true, "supplies": true}, "equipment": {"view": true, "manage": true, "maintain": true, "repair": true, "schedule": true}, "team": {"view": true}, "reports": {"view": true, "equipment": true}, "settings": {"view": true}}', true),

-- Accounting role
(NULL, 'accounting', 'acct', 'Accounting Manager', 'Handles financial reporting, billing, and cost management. Access to financial data and cost analysis.', 75, true,
 '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true, "costs": true}, "sales": {"view": true, "pricing": true}, "equipment": {"view": true, "costs": true}, "team": {"view": true, "payroll": true}, "reports": {"view": true, "financial": true, "costs": true}, "settings": {"view": true, "billing": true}}', true),

-- Brew Manager role (Head Brewer)
(NULL, 'brew-manager', 'bmgr', 'Head Brewer / Brew Manager', 'Manages all brewing operations, recipes, and production schedules. Senior brewing role with management responsibilities.', 80, true,
 '{"dashboard": {"view": true}, "production": {"view": true, "manage": true, "edit": true, "recipes": true, "batches": true}, "inventory": {"view": true, "manage": true}, "equipment": {"view": true, "manage": true, "maintain": true}, "team": {"view": true}, "reports": {"view": true, "production": true}, "settings": {"view": true}}', true)

-- Handle conflicts if roles already exist
ON CONFLICT (tenant_id, name) DO UPDATE SET
    role_code = EXCLUDED.role_code,
    level = EXCLUDED.level,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Create or update the view for easy role queries
DROP VIEW IF EXISTS public.v_tenant_user_roles;
CREATE VIEW public.v_tenant_user_roles AS
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

-- Create or replace the role assignment function
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
      AND is_active = true
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

-- Verify all requested roles are now present
SELECT 'Role verification:' as status;
SELECT name, role_code, display_name, level
FROM public.tenant_roles
WHERE name IN ('manager', 'maintenance', 'sales', 'accounting', 'brew-manager', 'brewer', 'employee')
ORDER BY level DESC, name;