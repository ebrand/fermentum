-- Migration: Create Lot Notification and Alert System
-- This migration creates tables to track supplier notifications, quality alerts,
-- and recalls for specific lot numbers

BEGIN;

-- Create enum type for alert severity levels
CREATE TYPE "LotAlertSeverity" AS ENUM ('Info', 'Warning', 'Critical', 'Recall');

-- Create enum type for alert status
CREATE TYPE "LotAlertStatus" AS ENUM ('Active', 'Acknowledged', 'Resolved', 'Archived');

-- Create LotAlert table to track supplier notifications and quality issues
CREATE TABLE "LotAlert" (
    "LotAlertId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "StockInventoryId" UUID NOT NULL,
    "LotNumber" VARCHAR(100) NOT NULL,
    "AlertType" VARCHAR(100) NOT NULL, -- e.g., 'Contamination', 'Recall', 'Quality Issue', 'Supplier Notice'
    "Severity" "LotAlertSeverity" NOT NULL DEFAULT 'Warning',
    "Status" "LotAlertStatus" NOT NULL DEFAULT 'Active',
    "Title" VARCHAR(200) NOT NULL,
    "Description" TEXT NOT NULL,
    "SupplierName" VARCHAR(200),
    "SupplierReference" VARCHAR(100), -- Supplier's internal reference number
    "AffectedBatches" TEXT[], -- Array of production batch IDs that used this lot
    "RecommendedAction" TEXT,
    "AlertDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpirationDate" TIMESTAMP, -- When alert expires or is no longer relevant
    "AcknowledgedBy" UUID,
    "AcknowledgedDate" TIMESTAMP,
    "ResolvedBy" UUID,
    "ResolvedDate" TIMESTAMP,
    "ResolutionNotes" TEXT,
    "SourceUrl" VARCHAR(500), -- Link to supplier notification or FDA alert
    "InternalNotes" TEXT,
    "Created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL,
    "Updated" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID NOT NULL,

    -- Foreign keys
    CONSTRAINT "FK_LotAlert_StockInventory"
        FOREIGN KEY ("StockInventoryId")
        REFERENCES "StockInventory"("StockInventoryId")
        ON DELETE CASCADE,

    CONSTRAINT "FK_LotAlert_AcknowledgedBy_User"
        FOREIGN KEY ("AcknowledgedBy")
        REFERENCES "User"("UserId")
        ON DELETE SET NULL,

    CONSTRAINT "FK_LotAlert_ResolvedBy_User"
        FOREIGN KEY ("ResolvedBy")
        REFERENCES "User"("UserId")
        ON DELETE SET NULL,

    CONSTRAINT "FK_LotAlert_CreatedBy_User"
        FOREIGN KEY ("CreatedBy")
        REFERENCES "User"("UserId")
        ON DELETE RESTRICT,

    CONSTRAINT "FK_LotAlert_UpdatedBy_User"
        FOREIGN KEY ("UpdatedBy")
        REFERENCES "User"("UserId")
        ON DELETE RESTRICT
);

-- Create LotAlertDocument table for storing related documents/images
CREATE TABLE "LotAlertDocument" (
    "LotAlertDocumentId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "LotAlertId" UUID NOT NULL,
    "DocumentType" VARCHAR(50) NOT NULL, -- e.g., 'PDF', 'Image', 'Email', 'LabReport'
    "FileName" VARCHAR(255) NOT NULL,
    "FileUrl" VARCHAR(500) NOT NULL, -- URL to stored document
    "FileSize" INTEGER,
    "MimeType" VARCHAR(100),
    "Description" TEXT,
    "UploadedBy" UUID NOT NULL,
    "UploadedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT "FK_LotAlertDocument_LotAlert"
        FOREIGN KEY ("LotAlertId")
        REFERENCES "LotAlert"("LotAlertId")
        ON DELETE CASCADE,

    CONSTRAINT "FK_LotAlertDocument_User"
        FOREIGN KEY ("UploadedBy")
        REFERENCES "User"("UserId")
        ON DELETE RESTRICT
);

-- Create indexes for performance
CREATE INDEX "IDX_LotAlert_StockInventoryId" ON "LotAlert"("StockInventoryId");
CREATE INDEX "IDX_LotAlert_LotNumber" ON "LotAlert"("LotNumber");
CREATE INDEX "IDX_LotAlert_Status" ON "LotAlert"("Status");
CREATE INDEX "IDX_LotAlert_Severity" ON "LotAlert"("Severity");
CREATE INDEX "IDX_LotAlert_AlertDate" ON "LotAlert"("AlertDate");
CREATE INDEX "IDX_LotAlertDocument_LotAlertId" ON "LotAlertDocument"("LotAlertId");

-- Add helpful comments
COMMENT ON TABLE "LotAlert" IS 'Tracks supplier notifications, quality alerts, and recalls for specific inventory lots';
COMMENT ON COLUMN "LotAlert"."AlertType" IS 'Category of alert: Contamination, Recall, Quality Issue, Supplier Notice, etc.';
COMMENT ON COLUMN "LotAlert"."Severity" IS 'Severity level: Info, Warning, Critical, Recall';
COMMENT ON COLUMN "LotAlert"."Status" IS 'Current status: Active, Acknowledged, Resolved, Archived';
COMMENT ON COLUMN "LotAlert"."AffectedBatches" IS 'Array of production batch IDs that used this lot';
COMMENT ON COLUMN "LotAlert"."SupplierReference" IS 'Supplier internal reference or notification number';

COMMENT ON TABLE "LotAlertDocument" IS 'Stores documents related to lot alerts (notifications, lab reports, emails)';

-- Enable Row Level Security
ALTER TABLE "LotAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LotAlertDocument" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "LotAlert_tenant_isolation" ON "LotAlert"
    USING (
        EXISTS (
            SELECT 1 FROM "StockInventory" si
            JOIN "Stock" s ON si."StockId" = s."StockId"
            WHERE si."StockInventoryId" = "LotAlert"."StockInventoryId"
            AND s."TenantId" = current_setting('app.current_tenant_id')::uuid
        )
    );

CREATE POLICY "LotAlertDocument_tenant_isolation" ON "LotAlertDocument"
    USING (
        EXISTS (
            SELECT 1 FROM "LotAlert" la
            JOIN "StockInventory" si ON la."StockInventoryId" = si."StockInventoryId"
            JOIN "Stock" s ON si."StockId" = s."StockId"
            WHERE la."LotAlertId" = "LotAlertDocument"."LotAlertId"
            AND s."TenantId" = current_setting('app.current_tenant_id')::uuid
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON "LotAlert" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "LotAlertDocument" TO fermentum_app;

COMMIT;
