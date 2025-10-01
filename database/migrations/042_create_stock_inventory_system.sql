-- Migration: Create Stock and StockInventory System
-- This migration creates Stock and StockInventory tables to track raw material inventory
-- and links them to raw materials tables (Grain, Hop, Yeast, Additive) via StockId

BEGIN;

-- Create Stock table
-- Represents a specific stock item/SKU that can be tracked in inventory
CREATE TABLE "Stock" (
    "StockId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "SKU" VARCHAR(100) NOT NULL,
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Category" VARCHAR(50) NOT NULL, -- 'Grain', 'Hop', 'Yeast', 'Additive'
    "Subcategory" VARCHAR(100),
    "Supplier" VARCHAR(200),
    "SupplierSKU" VARCHAR(100),
    "UnitOfMeasure" VARCHAR(20) NOT NULL, -- 'lbs', 'oz', 'g', 'kg', 'pkg', 'vial', 'ml', 'L', etc.
    "UnitCost" NUMERIC(10,4),
    "Currency" VARCHAR(3) DEFAULT 'USD',
    "ReorderLevel" NUMERIC(10,3), -- Minimum quantity before reorder
    "ReorderQuantity" NUMERIC(10,3), -- Quantity to reorder when below reorder level
    "LeadTimeDays" INTEGER, -- Days from order to delivery
    "StorageLocation" VARCHAR(100),
    "StorageRequirements" TEXT, -- e.g., "Refrigerate", "Keep dry", etc.
    "ShelfLifeDays" INTEGER, -- Days before expiration
    "IsActive" BOOLEAN DEFAULT true,
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL,
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID NOT NULL,

    CONSTRAINT "FK_Stock_Tenant" FOREIGN KEY ("TenantId")
        REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "FK_Stock_CreatedBy" FOREIGN KEY ("CreatedBy")
        REFERENCES "User"("UserId"),
    CONSTRAINT "FK_Stock_UpdatedBy" FOREIGN KEY ("UpdatedBy")
        REFERENCES "User"("UserId"),
    CONSTRAINT "UQ_Stock_TenantSKU" UNIQUE ("TenantId", "SKU")
);

-- Create StockInventory table
-- Tracks actual inventory quantities, lots, and transactions
CREATE TABLE "StockInventory" (
    "StockInventoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "StockId" UUID NOT NULL,
    "LotNumber" VARCHAR(100),
    "ReceivedDate" DATE,
    "ExpirationDate" DATE,
    "QuantityOnHand" NUMERIC(10,3) NOT NULL DEFAULT 0,
    "QuantityReserved" NUMERIC(10,3) NOT NULL DEFAULT 0, -- Allocated for recipes/batches
    "QuantityAvailable" NUMERIC(10,3) GENERATED ALWAYS AS ("QuantityOnHand" - "QuantityReserved") STORED,
    "PurchaseOrderNumber" VARCHAR(100),
    "InvoiceNumber" VARCHAR(100),
    "UnitCostActual" NUMERIC(10,4), -- Actual cost paid (may differ from Stock.UnitCost)
    "TotalCost" NUMERIC(12,4),
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL,
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID NOT NULL,

    CONSTRAINT "FK_StockInventory_Stock" FOREIGN KEY ("StockId")
        REFERENCES "Stock"("StockId") ON DELETE CASCADE,
    CONSTRAINT "FK_StockInventory_CreatedBy" FOREIGN KEY ("CreatedBy")
        REFERENCES "User"("UserId"),
    CONSTRAINT "FK_StockInventory_UpdatedBy" FOREIGN KEY ("UpdatedBy")
        REFERENCES "User"("UserId"),
    CONSTRAINT "CHK_StockInventory_QuantityOnHand" CHECK ("QuantityOnHand" >= 0),
    CONSTRAINT "CHK_StockInventory_QuantityReserved" CHECK ("QuantityReserved" >= 0),
    CONSTRAINT "CHK_StockInventory_QuantityReserved_LTE_OnHand" CHECK ("QuantityReserved" <= "QuantityOnHand")
);

-- Add StockId to Grain table
ALTER TABLE "Grain"
ADD COLUMN "StockId" UUID NULL,
ADD CONSTRAINT "FK_Grain_Stock" FOREIGN KEY ("StockId")
    REFERENCES "Stock"("StockId") ON DELETE SET NULL;

-- Add StockId to Hop table
ALTER TABLE "Hop"
ADD COLUMN "StockId" UUID NULL,
ADD CONSTRAINT "FK_Hop_Stock" FOREIGN KEY ("StockId")
    REFERENCES "Stock"("StockId") ON DELETE SET NULL;

-- Add StockId to Yeast table
ALTER TABLE "Yeast"
ADD COLUMN "StockId" UUID NULL,
ADD CONSTRAINT "FK_Yeast_Stock" FOREIGN KEY ("StockId")
    REFERENCES "Stock"("StockId") ON DELETE SET NULL;

-- Add StockId to Additive table
ALTER TABLE "Additive"
ADD COLUMN "StockId" UUID NULL,
ADD CONSTRAINT "FK_Additive_Stock" FOREIGN KEY ("StockId")
    REFERENCES "Stock"("StockId") ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX "IDX_Stock_TenantId" ON "Stock"("TenantId");
CREATE INDEX "IDX_Stock_Category" ON "Stock"("Category");
CREATE INDEX "IDX_Stock_SKU" ON "Stock"("SKU");
CREATE INDEX "IDX_Stock_IsActive" ON "Stock"("IsActive");

CREATE INDEX "IDX_StockInventory_StockId" ON "StockInventory"("StockId");
CREATE INDEX "IDX_StockInventory_LotNumber" ON "StockInventory"("LotNumber");
CREATE INDEX "IDX_StockInventory_ExpirationDate" ON "StockInventory"("ExpirationDate");

CREATE INDEX "IDX_Grain_StockId" ON "Grain"("StockId");
CREATE INDEX "IDX_Hop_StockId" ON "Hop"("StockId");
CREATE INDEX "IDX_Yeast_StockId" ON "Yeast"("StockId");
CREATE INDEX "IDX_Additive_StockId" ON "Additive"("StockId");

-- Enable Row Level Security
ALTER TABLE "Stock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockInventory" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Stock
CREATE POLICY "Stock_tenant_isolation" ON "Stock"
    FOR ALL
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for StockInventory (via Stock.TenantId)
CREATE POLICY "StockInventory_tenant_isolation" ON "StockInventory"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "Stock"
            WHERE "Stock"."StockId" = "StockInventory"."StockId"
            AND "Stock"."TenantId" = current_setting('app.current_tenant_id')::UUID
        )
    );

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON "Stock" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StockInventory" TO fermentum_app;

-- Add helpful comments
COMMENT ON TABLE "Stock" IS 'Stock items/SKUs that can be tracked in inventory';
COMMENT ON TABLE "StockInventory" IS 'Inventory quantities, lots, and transactions for stock items';
COMMENT ON COLUMN "Stock"."Category" IS 'Type of ingredient: Grain, Hop, Yeast, or Additive';
COMMENT ON COLUMN "Stock"."ReorderLevel" IS 'Minimum quantity before triggering reorder alert';
COMMENT ON COLUMN "StockInventory"."QuantityReserved" IS 'Quantity allocated for pending recipes/batches';
COMMENT ON COLUMN "StockInventory"."QuantityAvailable" IS 'Computed: QuantityOnHand - QuantityReserved';

COMMIT;