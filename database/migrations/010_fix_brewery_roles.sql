-- Fix the brewery roles migration to work with existing schema constraints

-- First, let's create tenant-specific roles instead of system roles to avoid NULL tenant_id constraint
-- We'll create roles for each existing tenant

-- Get the existing tenant IDs and create roles for each
DO $$
DECLARE
    tenant_record RECORD;
BEGIN
    -- Loop through all active tenants
    FOR tenant_record IN SELECT id FROM public.tenants WHERE is_active = true
    LOOP
        -- Insert the missing roles for each tenant
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
        (tenant_record.id, 'maintenance', 'maint', 'Maintenance Manager', 'Oversees equipment maintenance, repairs, and facility management. Has access to equipment management and maintenance scheduling.', 65, false,
         '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true, "supplies": true}, "equipment": {"view": true, "manage": true, "maintain": true, "repair": true, "schedule": true}, "team": {"view": true}, "reports": {"view": true, "equipment": true}, "settings": {"view": true}}', true),

        -- Accounting role
        (tenant_record.id, 'accounting', 'acct', 'Accounting Manager', 'Handles financial reporting, billing, and cost management. Access to financial data and cost analysis.', 75, false,
         '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true, "costs": true}, "sales": {"view": true, "pricing": true}, "equipment": {"view": true, "costs": true}, "team": {"view": true, "payroll": true}, "reports": {"view": true, "financial": true, "costs": true}, "settings": {"view": true, "billing": true}}', true),

        -- Brew Manager role (Head Brewer)
        (tenant_record.id, 'brew-manager', 'bmgr', 'Head Brewer / Brew Manager', 'Manages all brewing operations, recipes, and production schedules. Senior brewing role with management responsibilities.', 80, false,
         '{"dashboard": {"view": true}, "production": {"view": true, "manage": true, "edit": true, "recipes": true, "batches": true}, "inventory": {"view": true, "manage": true}, "equipment": {"view": true, "manage": true, "maintain": true}, "team": {"view": true}, "reports": {"view": true, "production": true}, "settings": {"view": true}}', true)

        -- Handle conflicts if roles already exist
        ON CONFLICT (tenant_id, name) DO UPDATE SET
            role_code = EXCLUDED.role_code,
            level = EXCLUDED.level,
            description = EXCLUDED.description,
            permissions = EXCLUDED.permissions,
            is_active = EXCLUDED.is_active,
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;
END $$;

-- Create the corrected view for tenant user roles (fixing the is_active column reference)
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
    tu.status,
    CASE
        WHEN tu.role = 'owner' THEN true
        ELSE false
    END as is_owner
FROM public.tenant_users tu
JOIN public.users u ON tu.user_id = u.id
JOIN public.tenants t ON tu.tenant_id = t.id
LEFT JOIN public.tenant_roles tr ON tu.tenant_role_id = tr.id
WHERE t.is_active = true;

-- Create a trigger function to automatically create roles for new tenants
CREATE OR REPLACE FUNCTION create_default_roles_for_tenant()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default roles for the new tenant
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
    (NEW.id, 'maintenance', 'maint', 'Maintenance Manager', 'Oversees equipment maintenance, repairs, and facility management.', 65, false,
     '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true, "supplies": true}, "equipment": {"view": true, "manage": true, "maintain": true, "repair": true, "schedule": true}, "team": {"view": true}, "reports": {"view": true, "equipment": true}, "settings": {"view": true}}', true),

    (NEW.id, 'accounting', 'acct', 'Accounting Manager', 'Handles financial reporting, billing, and cost management.', 75, false,
     '{"dashboard": {"view": true}, "production": {"view": true}, "inventory": {"view": true, "costs": true}, "sales": {"view": true, "pricing": true}, "equipment": {"view": true, "costs": true}, "team": {"view": true, "payroll": true}, "reports": {"view": true, "financial": true, "costs": true}, "settings": {"view": true, "billing": true}}', true),

    (NEW.id, 'brew-manager', 'bmgr', 'Head Brewer / Brew Manager', 'Manages all brewing operations, recipes, and production schedules.', 80, false,
     '{"dashboard": {"view": true}, "production": {"view": true, "manage": true, "edit": true, "recipes": true, "batches": true}, "inventory": {"view": true, "manage": true}, "equipment": {"view": true, "manage": true, "maintain": true}, "team": {"view": true}, "reports": {"view": true, "production": true}, "settings": {"view": true}}', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to automatically create roles for new tenants
DROP TRIGGER IF EXISTS trigger_create_tenant_roles ON public.tenants;
CREATE TRIGGER trigger_create_tenant_roles
    AFTER INSERT ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION create_default_roles_for_tenant();

-- Verify all requested roles are now present for each tenant
SELECT 'Role verification for all tenants:' as status;
SELECT t.name as tenant_name, tr.name as role_name, tr.role_code, tr.display_name, tr.level
FROM public.tenant_roles tr
JOIN public.tenants t ON tr.tenant_id = t.id
WHERE tr.name IN ('manager', 'maintenance', 'sales', 'accounting', 'brew-manager', 'brewer', 'employee')
ORDER BY t.name, tr.level DESC, tr.name;