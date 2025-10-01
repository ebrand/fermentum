-- Migration: Create Assignment Management System
-- Separate from notification system - assignments are operational tasks, not just notifications

BEGIN;

-- Assignment Categories (e.g., brewing, maintenance, inventory, quality control, sales)
CREATE TABLE "AssignmentCategory" (
    "CategoryId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" uuid NOT NULL,
    "Name" varchar(100) NOT NULL,
    "Description" text,
    "Color" varchar(7) DEFAULT '#3B82F6', -- Hex color for UI display
    "IsActive" boolean NOT NULL DEFAULT true,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    CONSTRAINT "FK_AssignmentCategory_Tenant" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "UQ_AssignmentCategory_TenantName" UNIQUE ("TenantId", "Name")
);

-- Main Assignment table
CREATE TABLE "Assignment" (
    "AssignmentId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" uuid NOT NULL,
    "BreweryId" uuid,
    "CategoryId" uuid,

    -- Basic assignment info
    "Title" varchar(200) NOT NULL,
    "Description" text,
    "Instructions" text, -- Detailed step-by-step instructions
    "Priority" varchar(20) NOT NULL DEFAULT 'medium' CHECK ("Priority" IN ('low', 'medium', 'high', 'urgent')),
    "Status" varchar(20) NOT NULL DEFAULT 'pending' CHECK ("Status" IN ('pending', 'assigned', 'inprogress', 'paused', 'completed', 'cancelled')),

    -- Assignment lifecycle
    "AssignedBy" uuid NOT NULL, -- Who created/assigned this task
    "AssignedTo" uuid, -- Employee who should complete this (can be null for unassigned tasks)
    "DueDate" timestamp with time zone,
    "EstimatedDurationMinutes" integer,
    "ActualStartTime" timestamp with time zone,
    "ActualCompletionTime" timestamp with time zone,

    -- Location/context
    "Location" varchar(200), -- e.g., "Fermentation Tank #3", "Packaging Area", "Storage Room A"
    "EquipmentId" uuid, -- Future: link to equipment/asset management
    "BatchId" uuid, -- Future: link to brewing batch if applicable

    -- Assignment workflow
    "RequiresConfirmation" boolean NOT NULL DEFAULT false, -- Assignee must confirm acceptance
    "ConfirmedAt" timestamp with time zone,
    "RequiresPhotos" boolean NOT NULL DEFAULT false, -- Task requires photo documentation
    "RequiresSignoff" boolean NOT NULL DEFAULT false, -- Requires manager approval when complete
    "SignedOffBy" uuid,
    "SignedOffAt" timestamp with time zone,

    -- Completion data
    "CompletionNotes" text,
    "PhotoUrls" text[], -- Array of photo URLs for task documentation

    -- Recurring assignment support
    "IsRecurring" boolean NOT NULL DEFAULT false,
    "RecurrencePattern" jsonb, -- e.g., {"frequency": "daily", "interval": 1, "daysOfWeek": [1,2,3,4,5]}
    "ParentAssignmentId" uuid, -- Link to parent recurring assignment template

    -- Metadata
    "IsActive" boolean NOT NULL DEFAULT true,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    -- Foreign key constraints
    CONSTRAINT "FK_Assignment_Tenant" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "FK_Assignment_Category" FOREIGN KEY ("CategoryId") REFERENCES "AssignmentCategory"("CategoryId") ON DELETE SET NULL,
    CONSTRAINT "FK_Assignment_AssignedBy" FOREIGN KEY ("AssignedBy") REFERENCES "User"("UserId"),
    CONSTRAINT "FK_Assignment_AssignedTo" FOREIGN KEY ("AssignedTo") REFERENCES "Employee"("EmployeeId") ON DELETE SET NULL,
    CONSTRAINT "FK_Assignment_SignedOff" FOREIGN KEY ("SignedOffBy") REFERENCES "User"("UserId"),
    CONSTRAINT "FK_Assignment_Parent" FOREIGN KEY ("ParentAssignmentId") REFERENCES "Assignment"("AssignmentId") ON DELETE CASCADE
);

-- Assignment Status History (audit trail)
CREATE TABLE "AssignmentStatusHistory" (
    "HistoryId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "AssignmentId" uuid NOT NULL,
    "FromStatus" varchar(20),
    "ToStatus" varchar(20) NOT NULL,
    "ChangedBy" uuid NOT NULL,
    "ChangedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Reason" varchar(500),
    "Notes" text,

    CONSTRAINT "FK_AssignmentStatusHistory_Assignment" FOREIGN KEY ("AssignmentId") REFERENCES "Assignment"("AssignmentId") ON DELETE CASCADE,
    CONSTRAINT "FK_AssignmentStatusHistory_ChangedBy" FOREIGN KEY ("ChangedBy") REFERENCES "User"("UserId")
);

-- Assignment Comments/Communication
CREATE TABLE "AssignmentComment" (
    "CommentId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "AssignmentId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "CommentText" text NOT NULL,
    "IsInternal" boolean NOT NULL DEFAULT false, -- Internal notes vs. communication with assignee
    "PhotoUrls" text[], -- Support photos in comments
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_AssignmentComment_Assignment" FOREIGN KEY ("AssignmentId") REFERENCES "Assignment"("AssignmentId") ON DELETE CASCADE,
    CONSTRAINT "FK_AssignmentComment_User" FOREIGN KEY ("UserId") REFERENCES "User"("UserId")
);

-- Assignment Templates (for recurring tasks)
CREATE TABLE "AssignmentTemplate" (
    "TemplateId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" uuid NOT NULL,
    "CategoryId" uuid,
    "Name" varchar(200) NOT NULL,
    "Title" varchar(200) NOT NULL,
    "Description" text,
    "Instructions" text,
    "EstimatedDurationMinutes" integer,
    "Priority" varchar(20) NOT NULL DEFAULT 'medium',
    "RequiresConfirmation" boolean NOT NULL DEFAULT false,
    "RequiresPhotos" boolean NOT NULL DEFAULT false,
    "RequiresSignoff" boolean NOT NULL DEFAULT false,
    "DefaultAssigneeRole" varchar(50), -- e.g., 'brewer', 'maintenance', can auto-assign based on role
    "IsActive" boolean NOT NULL DEFAULT true,
    "Created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid,
    "Updated" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" uuid,

    CONSTRAINT "FK_AssignmentTemplate_Tenant" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "FK_AssignmentTemplate_Category" FOREIGN KEY ("CategoryId") REFERENCES "AssignmentCategory"("CategoryId") ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX "IX_Assignment_TenantId" ON "Assignment" ("TenantId");
CREATE INDEX "IX_Assignment_AssignedTo" ON "Assignment" ("AssignedTo");
CREATE INDEX "IX_Assignment_AssignedBy" ON "Assignment" ("AssignedBy");
CREATE INDEX "IX_Assignment_Status" ON "Assignment" ("Status");
CREATE INDEX "IX_Assignment_DueDate" ON "Assignment" ("DueDate");
CREATE INDEX "IX_Assignment_Category" ON "Assignment" ("CategoryId");
CREATE INDEX "IX_Assignment_Priority" ON "Assignment" ("Priority");
CREATE INDEX "IX_Assignment_IsRecurring" ON "Assignment" ("IsRecurring");
CREATE INDEX "IX_AssignmentStatusHistory_AssignmentId" ON "AssignmentStatusHistory" ("AssignmentId");
CREATE INDEX "IX_AssignmentComment_AssignmentId" ON "AssignmentComment" ("AssignmentId");
CREATE INDEX "IX_AssignmentCategory_TenantId" ON "AssignmentCategory" ("TenantId");
CREATE INDEX "IX_AssignmentTemplate_TenantId" ON "AssignmentTemplate" ("TenantId");

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE "AssignmentCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentStatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentTemplate" ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only show assignments for user's tenant(s)
CREATE POLICY "AssignmentCategory_tenant_access" ON "AssignmentCategory"
    USING ("TenantId" IN (
        SELECT ut."TenantId" FROM "User_Tenant" ut
        WHERE ut."UserId" = current_setting('app.current_user_id')::uuid
        AND ut."IsActive" = true
    ));

CREATE POLICY "Assignment_tenant_access" ON "Assignment"
    USING ("TenantId" IN (
        SELECT ut."TenantId" FROM "User_Tenant" ut
        WHERE ut."UserId" = current_setting('app.current_user_id')::uuid
        AND ut."IsActive" = true
    ));

CREATE POLICY "AssignmentStatusHistory_tenant_access" ON "AssignmentStatusHistory"
    USING ("AssignmentId" IN (
        SELECT a."AssignmentId" FROM "Assignment" a
        INNER JOIN "User_Tenant" ut ON a."TenantId" = ut."TenantId"
        WHERE ut."UserId" = current_setting('app.current_user_id')::uuid
        AND ut."IsActive" = true
    ));

CREATE POLICY "AssignmentComment_tenant_access" ON "AssignmentComment"
    USING ("AssignmentId" IN (
        SELECT a."AssignmentId" FROM "Assignment" a
        INNER JOIN "User_Tenant" ut ON a."TenantId" = ut."TenantId"
        WHERE ut."UserId" = current_setting('app.current_user_id')::uuid
        AND ut."IsActive" = true
    ));

CREATE POLICY "AssignmentTemplate_tenant_access" ON "AssignmentTemplate"
    USING ("TenantId" IN (
        SELECT ut."TenantId" FROM "User_Tenant" ut
        WHERE ut."UserId" = current_setting('app.current_user_id')::uuid
        AND ut."IsActive" = true
    ));

-- Insert default assignment categories for existing tenants
INSERT INTO "AssignmentCategory" ("TenantId", "Name", "Description", "Color", "CreatedBy")
SELECT
    t."TenantId",
    category.name,
    category.description,
    category.color,
    NULL -- System created
FROM "Tenant" t
CROSS JOIN (
    VALUES
        ('Brewing', 'Brewing operations and production tasks', '#8B5A2B'),
        ('Maintenance', 'Equipment maintenance and repair tasks', '#EF4444'),
        ('Quality Control', 'Quality assurance and testing tasks', '#10B981'),
        ('Inventory', 'Stock management and inventory tasks', '#F59E0B'),
        ('Cleaning', 'Sanitization and cleaning tasks', '#6366F1'),
        ('Sales & Marketing', 'Customer service and marketing tasks', '#EC4899'),
        ('Administrative', 'Office and administrative tasks', '#6B7280'),
        ('Safety', 'Safety inspections and compliance tasks', '#DC2626')
) AS category(name, description, color);

-- Create update triggers for Updated timestamp
CREATE OR REPLACE FUNCTION update_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."Updated" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assignment_updated BEFORE UPDATE ON "Assignment"
    FOR EACH ROW EXECUTE FUNCTION update_updated_timestamp();

CREATE TRIGGER update_assignmentcategory_updated BEFORE UPDATE ON "AssignmentCategory"
    FOR EACH ROW EXECUTE FUNCTION update_updated_timestamp();

CREATE TRIGGER update_assignmenttemplate_updated BEFORE UPDATE ON "AssignmentTemplate"
    FOR EACH ROW EXECUTE FUNCTION update_updated_timestamp();

COMMIT;