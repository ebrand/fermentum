-- Migration 027: Add Broadcast Notification Support
-- This migration adds support for role-based broadcast notifications with shared acknowledgment

-- Add broadcast support to the existing Notification table
ALTER TABLE public."Notification"
ADD COLUMN IF NOT EXISTS "IsBroadcast" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "BroadcastRoles" TEXT[], -- Array of roles this notification targets
ADD COLUMN IF NOT EXISTS "SharedAcknowledgment" BOOLEAN NOT NULL DEFAULT false, -- Whether acknowledgment by one person affects all
ADD COLUMN IF NOT EXISTS "AcknowledgedByUserId" UUID, -- Which user acknowledged it (for shared acknowledgments)
ADD COLUMN IF NOT EXISTS "AcknowledgedAt" TIMESTAMP WITH TIME ZONE; -- When it was acknowledged

-- Create index for efficient broadcast queries
CREATE INDEX IF NOT EXISTS "ix_notification_broadcast_tenant_roles"
ON public."Notification" ("TenantId", "BroadcastRoles", "IsBroadcast", "IsAcknowledged")
WHERE "IsBroadcast" = true;

-- Create User_NotificationStatus table for tracking individual user status
CREATE TABLE IF NOT EXISTS public."User_NotificationStatus" (
    "StatusId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "NotificationId" UUID NOT NULL REFERENCES public."Notification"("NotificationId") ON DELETE CASCADE,
    "UserId" UUID NOT NULL,
    "TenantId" UUID NOT NULL,
    "IsRead" BOOLEAN NOT NULL DEFAULT false,
    "ReadAt" TIMESTAMP WITH TIME ZONE,
    "IsDismissed" BOOLEAN NOT NULL DEFAULT false, -- User-specific dismissal
    "DismissedAt" TIMESTAMP WITH TIME ZONE,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one status record per user per notification
    UNIQUE("NotificationId", "UserId")
);

-- Add RLS policy for User_NotificationStatus
ALTER TABLE public."User_NotificationStatus" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own notification status
CREATE POLICY "user_notification_status_isolation" ON public."User_NotificationStatus"
    USING (
        "UserId" = (current_setting('app.user_id', true))::uuid
        AND "TenantId" = (current_setting('app.tenant_id', true))::uuid
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public."User_NotificationStatus" TO fermentum_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fermentum_app;

-- Create function to automatically create user status records when notifications are broadcast
CREATE OR REPLACE FUNCTION create_broadcast_notification_status()
RETURNS TRIGGER AS $$
DECLARE
    target_user_record RECORD;
    user_role TEXT;
BEGIN
    -- Only process broadcast notifications
    IF NEW."IsBroadcast" = true AND NEW."BroadcastRoles" IS NOT NULL THEN
        -- Find all users in the tenant with matching roles
        FOR target_user_record IN
            SELECT DISTINCT ut."UserId"
            FROM public."User_Tenant" ut
            WHERE ut."TenantId" = NEW."TenantId"
            AND ut."IsActive" = true
            AND ut."Role" = ANY(NEW."BroadcastRoles")
        LOOP
            -- Create notification status for each matching user
            INSERT INTO public."User_NotificationStatus" (
                "NotificationId", "UserId", "TenantId"
            ) VALUES (
                NEW."NotificationId", target_user_record."UserId", NEW."TenantId"
            ) ON CONFLICT ("NotificationId", "UserId") DO NOTHING;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create status records
DROP TRIGGER IF EXISTS "broadcast_notification_trigger" ON public."Notification";
CREATE TRIGGER "broadcast_notification_trigger"
    AFTER INSERT ON public."Notification"
    FOR EACH ROW
    EXECUTE FUNCTION create_broadcast_notification_status();

-- Update existing notifications to be broadcast by default
UPDATE public."Notification"
SET "IsBroadcast" = true,
    "BroadcastRoles" = CASE
        WHEN "Type" = 'temperature_alert' THEN ARRAY['brewer', 'brew-manager', 'manager', 'owner']
        WHEN "Type" = 'inventory_low_stock' THEN ARRAY['manager', 'owner', 'inventory']
        WHEN "Type" = 'batch_step_due' THEN ARRAY['brewer', 'brew-manager', 'manager']
        WHEN "Type" = 'qc_check_required' THEN ARRAY['brewer', 'brew-manager', 'manager', 'owner']
        WHEN "Type" = 'equipment_maintenance' THEN ARRAY['maintenance', 'manager', 'owner']
        ELSE ARRAY['user', 'tenant']
    END,
    "SharedAcknowledgment" = CASE
        WHEN "Priority" IN ('critical', 'high') THEN true
        ELSE false
    END
WHERE "IsBroadcast" IS NULL OR "IsBroadcast" = false;

COMMIT;