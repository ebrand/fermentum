-- Raw Materials Inventory Management System
-- Migration 029: Create comprehensive raw materials tracking

-- Raw Material Categories and Master Data
CREATE TABLE "RawMaterialCategory" (
    "CategoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "StorageRequirements" TEXT,
    "DefaultShelfLifeDays" INTEGER,
    "UnitOfMeasure" VARCHAR(20) NOT NULL, -- lbs, kg, gallons, liters, etc.
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId")
);

-- Master Raw Materials (catalog of all possible ingredients)
CREATE TABLE "RawMaterial" (
    "MaterialId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "CategoryId" UUID NOT NULL REFERENCES "RawMaterialCategory"("CategoryId"),
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "SKU" VARCHAR(100),
    "UnitOfMeasure" VARCHAR(20) NOT NULL,
    "DefaultUnitCost" DECIMAL(10,4),
    "MinimumStockLevel" DECIMAL(10,3),
    "ReorderLevel" DECIMAL(10,3),
    "MaximumStockLevel" DECIMAL(10,3),
    "LeadTimeDays" INTEGER DEFAULT 7,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "QualitySpecs" JSONB, -- Store quality specifications like protein%, alpha acids, etc.
    "StorageInstructions" TEXT,
    "SafetyNotes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),
    CONSTRAINT "UK_RawMaterial_TenantSKU" UNIQUE ("TenantId", "SKU")
);

-- Suppliers
CREATE TABLE "Supplier" (
    "SupplierId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "Name" VARCHAR(200) NOT NULL,
    "ContactName" VARCHAR(100),
    "Email" VARCHAR(255),
    "Phone" VARCHAR(50),
    "Address" TEXT,
    "City" VARCHAR(100),
    "State" VARCHAR(50),
    "PostalCode" VARCHAR(20),
    "Country" VARCHAR(100),
    "Website" VARCHAR(255),
    "Notes" TEXT,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId")
);

-- Purchase Orders
CREATE TABLE "PurchaseOrder" (
    "PurchaseOrderId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "SupplierId" UUID NOT NULL REFERENCES "Supplier"("SupplierId"),
    "PONumber" VARCHAR(100) NOT NULL,
    "OrderDate" DATE NOT NULL,
    "ExpectedDeliveryDate" DATE,
    "ActualDeliveryDate" DATE,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Sent, Confirmed, Delivered, Cancelled
    "SubTotal" DECIMAL(12,2),
    "TaxAmount" DECIMAL(12,2),
    "ShippingAmount" DECIMAL(12,2),
    "TotalAmount" DECIMAL(12,2),
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),
    CONSTRAINT "UK_PurchaseOrder_TenantPONumber" UNIQUE ("TenantId", "PONumber")
);

-- Purchase Order Line Items
CREATE TABLE "PurchaseOrderItem" (
    "PurchaseOrderItemId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "PurchaseOrderId" UUID NOT NULL REFERENCES "PurchaseOrder"("PurchaseOrderId") ON DELETE CASCADE,
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId"),
    "Quantity" DECIMAL(10,3) NOT NULL,
    "UnitCost" DECIMAL(10,4) NOT NULL,
    "LineTotal" DECIMAL(12,2) NOT NULL,
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Lots (actual received inventory with lot tracking)
CREATE TABLE "InventoryLot" (
    "LotId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId"),
    "SupplierId" UUID REFERENCES "Supplier"("SupplierId"),
    "PurchaseOrderItemId" UUID REFERENCES "PurchaseOrderItem"("PurchaseOrderItemId"),
    "LotNumber" VARCHAR(100) NOT NULL,
    "SupplierLotNumber" VARCHAR(100),
    "ReceivedDate" DATE NOT NULL,
    "ExpirationDate" DATE,
    "OriginalQuantity" DECIMAL(10,3) NOT NULL,
    "CurrentQuantity" DECIMAL(10,3) NOT NULL,
    "UnitCost" DECIMAL(10,4) NOT NULL,
    "QualityTestResults" JSONB, -- Store actual test results
    "QualityStatus" VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Quarantined
    "StorageLocation" VARCHAR(100),
    "Notes" TEXT,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId"),
    CONSTRAINT "UK_InventoryLot_TenantLotNumber" UNIQUE ("TenantId", "LotNumber")
);

-- Inventory Transactions (all movements in/out)
CREATE TABLE "InventoryTransaction" (
    "TransactionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "LotId" UUID NOT NULL REFERENCES "InventoryLot"("LotId"),
    "TransactionType" VARCHAR(50) NOT NULL, -- Receipt, Usage, Adjustment, Transfer, Waste, Return
    "Quantity" DECIMAL(10,3) NOT NULL, -- Positive for incoming, negative for outgoing
    "RemainingQuantity" DECIMAL(10,3) NOT NULL, -- Lot quantity after this transaction
    "UnitCost" DECIMAL(10,4),
    "ReferenceType" VARCHAR(50), -- Batch, Recipe, Adjustment, etc.
    "ReferenceId" UUID, -- BatchId, RecipeId, etc.
    "TransactionDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Notes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId")
);

-- Quality Control Tests
CREATE TABLE "QualityTest" (
    "TestId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "LotId" UUID NOT NULL REFERENCES "InventoryLot"("LotId"),
    "TestType" VARCHAR(100) NOT NULL, -- Moisture, Protein, Alpha Acids, Microbiological, etc.
    "TestDate" DATE NOT NULL,
    "TestedBy" UUID REFERENCES "User"("UserId"),
    "TestMethod" VARCHAR(100),
    "ExpectedValue" DECIMAL(10,4),
    "ActualValue" DECIMAL(10,4),
    "Units" VARCHAR(20),
    "PassFail" BOOLEAN,
    "Notes" TEXT,
    "CertificateOfAnalysis" TEXT, -- File path or reference
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId")
);

-- Inventory Alerts Configuration
CREATE TABLE "InventoryAlert" (
    "AlertId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "MaterialId" UUID REFERENCES "RawMaterial"("MaterialId"), -- NULL for global alerts
    "AlertType" VARCHAR(50) NOT NULL, -- LowStock, Expiring, Expired, QualityIssue
    "ThresholdValue" DECIMAL(10,3),
    "ThresholdDays" INTEGER,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "NotificationMethods" VARCHAR(200), -- Email, SMS, Dashboard
    "Recipients" TEXT, -- JSON array of user IDs or email addresses
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID REFERENCES "User"("UserId"),
    "Updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID REFERENCES "User"("UserId")
);

-- Inventory Alert Log
CREATE TABLE "InventoryAlertLog" (
    "AlertLogId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId"),
    "AlertId" UUID NOT NULL REFERENCES "InventoryAlert"("AlertId"),
    "LotId" UUID REFERENCES "InventoryLot"("LotId"),
    "MaterialId" UUID REFERENCES "RawMaterial"("MaterialId"),
    "AlertType" VARCHAR(50) NOT NULL,
    "Message" TEXT NOT NULL,
    "Severity" VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Critical
    "IsResolved" BOOLEAN DEFAULT FALSE,
    "ResolvedDate" TIMESTAMP,
    "ResolvedBy" UUID REFERENCES "User"("UserId"),
    "ResolutionNotes" TEXT,
    "Created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO "RawMaterialCategory" ("Name", "Description", "StorageRequirements", "DefaultShelfLifeDays", "UnitOfMeasure") VALUES
('Base Malts', 'Primary mashing grains providing fermentable sugars', 'Cool, dry storage below 80°F', 540, 'lbs'),
('Specialty Malts', 'Specialty grains for flavor and color', 'Cool, dry storage below 80°F', 540, 'lbs'),
('Hops', 'Bittering and aroma hops in various forms', 'Frozen storage for pellets, cool/dry for whole', 730, 'lbs'),
('Yeast', 'Fermentation cultures in liquid or dry form', 'Refrigerated for liquid, cool/dry for dry', 365, 'packages'),
('Water Treatment', 'Water chemistry adjustment chemicals', 'Cool, dry chemical storage', 1095, 'lbs'),
('Cleaning Chemicals', 'Sanitizing and cleaning compounds', 'Chemical storage area, proper ventilation', 1095, 'lbs'),
('Packaging Materials', 'Bottles, cans, labels, closures', 'Clean, dry storage', 1095, 'units'),
('Processing Aids', 'Clarifying agents, nutrients, enzymes', 'Cool, dry storage', 730, 'lbs'),
('Adjuncts', 'Non-malt fermentable ingredients', 'Cool, dry storage', 365, 'lbs'),
('Gases', 'CO2, Nitrogen for production and packaging', 'Proper gas cylinder storage', 365, 'lbs');

-- Create indexes for performance
CREATE INDEX "IX_RawMaterial_TenantId" ON "RawMaterial"("TenantId");
CREATE INDEX "IX_RawMaterial_CategoryId" ON "RawMaterial"("CategoryId");
CREATE INDEX "IX_InventoryLot_TenantId" ON "InventoryLot"("TenantId");
CREATE INDEX "IX_InventoryLot_MaterialId" ON "InventoryLot"("MaterialId");
CREATE INDEX "IX_InventoryLot_ExpirationDate" ON "InventoryLot"("ExpirationDate");
CREATE INDEX "IX_InventoryLot_QualityStatus" ON "InventoryLot"("QualityStatus");
CREATE INDEX "IX_InventoryTransaction_TenantId" ON "InventoryTransaction"("TenantId");
CREATE INDEX "IX_InventoryTransaction_LotId" ON "InventoryTransaction"("LotId");
CREATE INDEX "IX_InventoryTransaction_TransactionDate" ON "InventoryTransaction"("TransactionDate");
CREATE INDEX "IX_QualityTest_TenantId" ON "QualityTest"("TenantId");
CREATE INDEX "IX_QualityTest_LotId" ON "QualityTest"("LotId");
CREATE INDEX "IX_InventoryAlertLog_TenantId" ON "InventoryAlertLog"("TenantId");
CREATE INDEX "IX_InventoryAlertLog_IsResolved" ON "InventoryAlertLog"("IsResolved");

-- Row Level Security
ALTER TABLE "RawMaterialCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RawMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryLot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QualityTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryAlertLog" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY "tenant_isolation_raw_material" ON "RawMaterial"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_supplier" ON "Supplier"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_purchase_order" ON "PurchaseOrder"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_inventory_lot" ON "InventoryLot"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_inventory_transaction" ON "InventoryTransaction"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_quality_test" ON "QualityTest"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_inventory_alert" ON "InventoryAlert"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "tenant_isolation_inventory_alert_log" ON "InventoryAlertLog"
    USING ("TenantId" = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON "RawMaterialCategory" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RawMaterial" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Supplier" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "PurchaseOrder" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "PurchaseOrderItem" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "InventoryLot" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "InventoryTransaction" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "QualityTest" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "InventoryAlert" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "InventoryAlertLog" TO fermentum_app;