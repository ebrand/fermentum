-- Migration: Create Notification System Tables
-- Description: Implements persistent notification system for advanced notification center
-- Date: 2025-09-25

-- Notification Table - Stores all persistent notifications
CREATE TABLE IF NOT EXISTS public."Notification" (
    "NotificationId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Type" VARCHAR(100) NOT NULL, -- From NOTIFICATION_TYPES
    "Title" VARCHAR(300) NOT NULL,
    "Message" TEXT NOT NULL,
    "Data" JSONB, -- Additional notification payload data
    "Priority" VARCHAR(20) NOT NULL, -- critical, high, medium, low, info
    "Category" VARCHAR(50) NOT NULL, -- production, inventory, equipment, etc.
    "Source" VARCHAR(100), -- Component/system that created the notification
    "ActionRequired" BOOLEAN NOT NULL DEFAULT false,
    "ActionUrl" VARCHAR(500), -- Optional URL for action button
    "ExpiresAt" TIMESTAMP WITH TIME ZONE, -- Null = never expires
    "IsRead" BOOLEAN NOT NULL DEFAULT false,
    "ReadAt" TIMESTAMP WITH TIME ZONE,
    "IsAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "AcknowledgedAt" TIMESTAMP WITH TIME ZONE,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_Notification_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "FK_Notification_UserId" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId") ON DELETE CASCADE,
    CONSTRAINT "CHK_Notification_Priority" CHECK ("Priority" IN ('critical', 'high', 'medium', 'low', 'info')),
    CONSTRAINT "CHK_Notification_ReadAt" CHECK (("IsRead" = false AND "ReadAt" IS NULL) OR ("IsRead" = true AND "ReadAt" IS NOT NULL)),
    CONSTRAINT "CHK_Notification_AcknowledgedAt" CHECK (("IsAcknowledged" = false AND "AcknowledgedAt" IS NULL) OR ("IsAcknowledged" = true AND "AcknowledgedAt" IS NOT NULL))
);

-- Notification Event Listeners Table - Tracks registered event handlers
CREATE TABLE IF NOT EXISTS public."NotificationEventListener" (
    "EventListenerId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "EventType" VARCHAR(100) NOT NULL, -- From NOTIFICATION_EVENTS
    "NotificationType" VARCHAR(100) NOT NULL, -- From NOTIFICATION_TYPES
    "IsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "Configuration" JSONB, -- Event-specific configuration
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL,
    "UpdatedBy" UUID NOT NULL,

    CONSTRAINT "FK_NotificationEventListener_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "FK_NotificationEventListener_CreatedBy" FOREIGN KEY ("CreatedBy") REFERENCES public."User"("UserId"),
    CONSTRAINT "FK_NotificationEventListener_UpdatedBy" FOREIGN KEY ("UpdatedBy") REFERENCES public."User"("UserId"),
    CONSTRAINT "UQ_NotificationEventListener_TenantId_EventType_NotificationType" UNIQUE ("TenantId", "EventType", "NotificationType")
);

-- Notification Delivery Log - Tracks delivery attempts and status
CREATE TABLE IF NOT EXISTS public."NotificationDeliveryLog" (
    "DeliveryLogId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "NotificationId" UUID NOT NULL,
    "DeliveryMethod" VARCHAR(20) NOT NULL, -- in-app, email, sms, webhook
    "DeliveryStatus" VARCHAR(20) NOT NULL, -- pending, sent, delivered, failed, bounced
    "RecipientAddress" VARCHAR(500), -- Email address, phone number, webhook URL
    "AttemptCount" INTEGER NOT NULL DEFAULT 1,
    "LastAttemptAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DeliveredAt" TIMESTAMP WITH TIME ZONE,
    "ErrorMessage" TEXT,
    "ResponseData" JSONB, -- Response from delivery service
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_NotificationDeliveryLog_NotificationId" FOREIGN KEY ("NotificationId") REFERENCES public."Notification"("NotificationId") ON DELETE CASCADE,
    CONSTRAINT "CHK_NotificationDeliveryLog_DeliveryMethod" CHECK ("DeliveryMethod" IN ('in-app', 'email', 'sms', 'webhook')),
    CONSTRAINT "CHK_NotificationDeliveryLog_DeliveryStatus" CHECK ("DeliveryStatus" IN ('pending', 'sent', 'delivered', 'failed', 'bounced'))
);

-- Enable Row Level Security
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NotificationEventListener" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NotificationDeliveryLog" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Notifications - Users can only access their own notifications in their tenants
CREATE POLICY "User notification access" ON public."Notification"
    FOR ALL
    USING (
        "UserId" = current_setting('app.current_user_id', true)::uuid
        AND "TenantId" IN (
            SELECT ut."TenantId"
            FROM public."User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

-- Event listeners - Tenant-based access
CREATE POLICY "Notification event listener access" ON public."NotificationEventListener"
    FOR ALL
    USING (
        "TenantId" IN (
            SELECT ut."TenantId"
            FROM public."User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

-- Delivery logs - Access through notification ownership
CREATE POLICY "Notification delivery log access" ON public."NotificationDeliveryLog"
    FOR ALL
    USING (
        "NotificationId" IN (
            SELECT n."NotificationId"
            FROM public."Notification" n
            JOIN public."User_Tenant" ut ON n."TenantId" = ut."TenantId"
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IDX_Notification_TenantId" ON public."Notification"("TenantId");
CREATE INDEX IF NOT EXISTS "IDX_Notification_UserId" ON public."Notification"("UserId");
CREATE INDEX IF NOT EXISTS "IDX_Notification_Type" ON public."Notification"("Type");
CREATE INDEX IF NOT EXISTS "IDX_Notification_Priority" ON public."Notification"("Priority");
CREATE INDEX IF NOT EXISTS "IDX_Notification_Category" ON public."Notification"("Category");
CREATE INDEX IF NOT EXISTS "IDX_Notification_IsRead" ON public."Notification"("IsRead");
CREATE INDEX IF NOT EXISTS "IDX_Notification_ActionRequired" ON public."Notification"("ActionRequired", "IsAcknowledged");
CREATE INDEX IF NOT EXISTS "IDX_Notification_ExpiresAt" ON public."Notification"("ExpiresAt") WHERE "ExpiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IDX_Notification_Created" ON public."Notification"("Created");
CREATE INDEX IF NOT EXISTS "IDX_NotificationEventListener_TenantId_EventType" ON public."NotificationEventListener"("TenantId", "EventType");
CREATE INDEX IF NOT EXISTS "IDX_NotificationDeliveryLog_NotificationId" ON public."NotificationDeliveryLog"("NotificationId");
CREATE INDEX IF NOT EXISTS "IDX_NotificationDeliveryLog_DeliveryStatus" ON public."NotificationDeliveryLog"("DeliveryStatus");

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Notification" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."NotificationEventListener" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."NotificationDeliveryLog" TO fermentum_app;

-- Create function to automatically expire notifications
CREATE OR REPLACE FUNCTION expire_notifications()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    DELETE FROM public."Notification"
    WHERE "ExpiresAt" IS NOT NULL
    AND "ExpiresAt" < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get notification counts for a user
CREATE OR REPLACE FUNCTION get_user_notification_counts(user_id UUID, tenant_id UUID)
RETURNS TABLE(
    total_count INTEGER,
    unread_count INTEGER,
    action_required_count INTEGER,
    critical_count INTEGER,
    high_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_count,
        COUNT(CASE WHEN "IsRead" = false THEN 1 END)::INTEGER as unread_count,
        COUNT(CASE WHEN "ActionRequired" = true AND "IsAcknowledged" = false THEN 1 END)::INTEGER as action_required_count,
        COUNT(CASE WHEN "Priority" = 'critical' THEN 1 END)::INTEGER as critical_count,
        COUNT(CASE WHEN "Priority" = 'high' THEN 1 END)::INTEGER as high_count
    FROM public."Notification"
    WHERE "UserId" = user_id
    AND "TenantId" = tenant_id
    AND ("ExpiresAt" IS NULL OR "ExpiresAt" > CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;