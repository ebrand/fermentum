-- Migration 024: Create comprehensive inventory management tables
-- Raw Materials and Finished Goods inventory system for brewery operations

-- Create RawMaterialCategory table
CREATE TABLE IF NOT EXISTS "RawMaterialCategory" (
    "CategoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "Created" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create RawMaterial table
CREATE TABLE IF NOT EXISTS "RawMaterial" (
    "MaterialId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    "CategoryId" UUID REFERENCES "RawMaterialCategory"("CategoryId"),
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "SKU" VARCHAR(100),
    "UnitOfMeasure" VARCHAR(50) NOT NULL, -- lbs, oz, gallons, liters, etc.
    "CostPerUnit" DECIMAL(10,4),
    "MinimumStock" DECIMAL(10,2) DEFAULT 0,
    "ReorderPoint" DECIMAL(10,2) DEFAULT 0,
    "IsActive" BOOLEAN DEFAULT true,
    "Created" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL REFERENCES "User"("UserId"),
    "Updated" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID NOT NULL REFERENCES "User"("UserId"),

    UNIQUE("TenantId", "SKU")
);

-- Create RawMaterialInventory table for tracking stock levels
CREATE TABLE IF NOT EXISTS "RawMaterialInventory" (
    "InventoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "MaterialId" UUID NOT NULL REFERENCES "RawMaterial"("MaterialId") ON DELETE CASCADE,
    "BreweryId" UUID NOT NULL REFERENCES "Brewery"("BreweryId") ON DELETE CASCADE,
    "CurrentStock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ReservedStock" DECIMAL(10,2) NOT NULL DEFAULT 0, -- Stock allocated to brewing batches
    "AvailableStock" DECIMAL(10,2) GENERATED ALWAYS AS ("CurrentStock" - "ReservedStock") STORED,
    "LastStockTake" TIMESTAMPTZ,
    "LastStockTakeBy" UUID REFERENCES "User"("UserId"),
    "Created" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE("MaterialId", "BreweryId")
);

-- Create FinishedGoodsCategory table
CREATE TABLE IF NOT EXISTS "FinishedGoodsCategory" (
    "CategoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "Created" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create FinishedGoods table (beer products)
CREATE TABLE IF NOT EXISTS "FinishedGoods" (
    "ProductId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL REFERENCES "Tenant"("TenantId") ON DELETE CASCADE,
    "CategoryId" UUID REFERENCES "FinishedGoodsCategory"("CategoryId"),
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "SKU" VARCHAR(100),
    "BeerStyle" VARCHAR(100), -- IPA, Stout, Lager, etc.
    "ABV" DECIMAL(4,2), -- Alcohol by volume percentage
    "IBU" INTEGER, -- International Bitterness Units
    "SRM" DECIMAL(4,1), -- Standard Reference Method (color)
    "UnitOfMeasure" VARCHAR(50) NOT NULL, -- barrels, gallons, bottles, cans, etc.
    "PackageSize" DECIMAL(8,2), -- 12 oz, 16 oz, 32 oz, etc.
    "PackageType" VARCHAR(50), -- bottle, can, keg, growler, etc.
    "SellPrice" DECIMAL(10,4),
    "CostPerUnit" DECIMAL(10,4),
    "MinimumStock" DECIMAL(10,2) DEFAULT 0,
    "IsActive" BOOLEAN DEFAULT true,
    "Created" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL REFERENCES "User"("UserId"),
    "Updated" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedBy" UUID NOT NULL REFERENCES "User"("UserId"),

    UNIQUE("TenantId", "SKU")
);

-- Create FinishedGoodsInventory table for tracking finished product stock
CREATE TABLE IF NOT EXISTS "FinishedGoodsInventory" (
    "InventoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProductId" UUID NOT NULL REFERENCES "FinishedGoods"("ProductId") ON DELETE CASCADE,
    "BreweryId" UUID NOT NULL REFERENCES "Brewery"("BreweryId") ON DELETE CASCADE,
    "CurrentStock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ReservedStock" DECIMAL(10,2) NOT NULL DEFAULT 0, -- Stock allocated to orders
    "AvailableStock" DECIMAL(10,2) GENERATED ALWAYS AS ("CurrentStock" - "ReservedStock") STORED,
    "LastStockTake" TIMESTAMPTZ,
    "LastStockTakeBy" UUID REFERENCES "User"("UserId"),
    "BatchNumber" VARCHAR(100), -- Brewing batch reference
    "ExpiryDate" DATE,
    "Created" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE("ProductId", "BreweryId")
);

-- Create InventoryTransaction table for tracking all inventory movements
CREATE TABLE IF NOT EXISTS "InventoryTransaction" (
    "TransactionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "BreweryId" UUID NOT NULL REFERENCES "Brewery"("BreweryId") ON DELETE CASCADE,
    "TransactionType" VARCHAR(50) NOT NULL, -- 'RECEIPT', 'USAGE', 'ADJUSTMENT', 'TRANSFER', 'PRODUCTION', 'SALE'
    "MaterialId" UUID REFERENCES "RawMaterial"("MaterialId"),
    "ProductId" UUID REFERENCES "FinishedGoods"("ProductId"),
    "Quantity" DECIMAL(10,2) NOT NULL,
    "UnitOfMeasure" VARCHAR(50) NOT NULL,
    "UnitCost" DECIMAL(10,4),
    "TotalCost" DECIMAL(12,4) GENERATED ALWAYS AS ("Quantity" * "UnitCost") STORED,
    "Reference" VARCHAR(200), -- PO number, batch number, order number, etc.
    "Notes" TEXT,
    "TransactionDate" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL REFERENCES "User"("UserId"),
    "Created" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Ensure either MaterialId OR ProductId is specified, not both
    CHECK (("MaterialId" IS NOT NULL) != ("ProductId" IS NOT NULL))
);

-- Insert default raw material categories
INSERT INTO "RawMaterialCategory" ("CategoryId", "Name", "Description") VALUES
('11111111-1111-1111-1111-111111111111', 'Grains & Malts', 'Base malts, specialty malts, and grain adjuncts'),
('22222222-2222-2222-2222-222222222222', 'Hops', 'Bittering, aroma, and flavoring hops'),
('33333333-3333-3333-3333-333333333333', 'Yeast', 'Brewing yeast strains and cultures'),
('44444444-4444-4444-4444-444444444444', 'Water Treatment', 'Water salts, acids, and treatment chemicals'),
('55555555-5555-5555-5555-555555555555', 'Additives & Finings', 'Clarifying agents, nutrients, and brewing aids'),
('66666666-6666-6666-6666-666666666666', 'Packaging', 'Bottles, caps, labels, boxes, and packaging materials')
ON CONFLICT ("CategoryId") DO NOTHING;

-- Insert default finished goods categories
INSERT INTO "FinishedGoodsCategory" ("CategoryId", "Name", "Description") VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ales', 'Top-fermented beers including IPAs, stouts, porters'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lagers', 'Bottom-fermented beers including pilsners, märzens'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Wheat Beers', 'Wheat-based beers including hefeweizens, witbiers'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sour Beers', 'Wild fermented and kettle sour beers'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Specialty Beers', 'Experimental, seasonal, and unique beer styles'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Non-Alcoholic', 'Low-alcohol and non-alcoholic beer products')
ON CONFLICT ("CategoryId") DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_rawmaterial_tenant_active" ON "RawMaterial"("TenantId", "IsActive");
CREATE INDEX IF NOT EXISTS "idx_rawmaterial_sku" ON "RawMaterial"("SKU") WHERE "SKU" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_rawmaterial_category" ON "RawMaterial"("CategoryId");

CREATE INDEX IF NOT EXISTS "idx_rawmaterialinventory_material" ON "RawMaterialInventory"("MaterialId");
CREATE INDEX IF NOT EXISTS "idx_rawmaterialinventory_brewery" ON "RawMaterialInventory"("BreweryId");

CREATE INDEX IF NOT EXISTS "idx_finishedgoods_tenant_active" ON "FinishedGoods"("TenantId", "IsActive");
CREATE INDEX IF NOT EXISTS "idx_finishedgoods_sku" ON "FinishedGoods"("SKU") WHERE "SKU" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_finishedgoods_category" ON "FinishedGoods"("CategoryId");

CREATE INDEX IF NOT EXISTS "idx_finishedgoodsinventory_product" ON "FinishedGoodsInventory"("ProductId");
CREATE INDEX IF NOT EXISTS "idx_finishedgoodsinventory_brewery" ON "FinishedGoodsInventory"("BreweryId");

CREATE INDEX IF NOT EXISTS "idx_inventorytransaction_brewery_date" ON "InventoryTransaction"("BreweryId", "TransactionDate");
CREATE INDEX IF NOT EXISTS "idx_inventorytransaction_material" ON "InventoryTransaction"("MaterialId") WHERE "MaterialId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_inventorytransaction_product" ON "InventoryTransaction"("ProductId") WHERE "ProductId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_inventorytransaction_type" ON "InventoryTransaction"("TransactionType");

-- Enable Row Level Security (RLS) for multi-tenancy
ALTER TABLE "RawMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RawMaterialInventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinishedGoods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinishedGoodsInventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryTransaction" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for RawMaterial
CREATE POLICY "RawMaterial_tenant_isolation" ON "RawMaterial"
    FOR ALL
    USING ("TenantId"::text = current_setting('app.tenant_id', true))
    WITH CHECK ("TenantId"::text = current_setting('app.tenant_id', true));

-- RLS Policies for RawMaterialInventory (through brewery's tenant)
CREATE POLICY "RawMaterialInventory_tenant_isolation" ON "RawMaterialInventory"
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "Brewery" b
        WHERE b."BreweryId" = "RawMaterialInventory"."BreweryId"
        AND b."TenantId"::text = current_setting('app.tenant_id', true)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "Brewery" b
        WHERE b."BreweryId" = "RawMaterialInventory"."BreweryId"
        AND b."TenantId"::text = current_setting('app.tenant_id', true)
    ));

-- RLS Policies for FinishedGoods
CREATE POLICY "FinishedGoods_tenant_isolation" ON "FinishedGoods"
    FOR ALL
    USING ("TenantId"::text = current_setting('app.tenant_id', true))
    WITH CHECK ("TenantId"::text = current_setting('app.tenant_id', true));

-- RLS Policies for FinishedGoodsInventory (through brewery's tenant)
CREATE POLICY "FinishedGoodsInventory_tenant_isolation" ON "FinishedGoodsInventory"
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "Brewery" b
        WHERE b."BreweryId" = "FinishedGoodsInventory"."BreweryId"
        AND b."TenantId"::text = current_setting('app.tenant_id', true)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "Brewery" b
        WHERE b."BreweryId" = "FinishedGoodsInventory"."BreweryId"
        AND b."TenantId"::text = current_setting('app.tenant_id', true)
    ));

-- RLS Policies for InventoryTransaction (through brewery's tenant)
CREATE POLICY "InventoryTransaction_tenant_isolation" ON "InventoryTransaction"
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "Brewery" b
        WHERE b."BreweryId" = "InventoryTransaction"."BreweryId"
        AND b."TenantId"::text = current_setting('app.tenant_id', true)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "Brewery" b
        WHERE b."BreweryId" = "InventoryTransaction"."BreweryId"
        AND b."TenantId"::text = current_setting('app.tenant_id', true)
    ));

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON "RawMaterialCategory" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RawMaterial" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RawMaterialInventory" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "FinishedGoodsCategory" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "FinishedGoods" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "FinishedGoodsInventory" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "InventoryTransaction" TO fermentum_app;

-- Create updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."Updated" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rawmaterial_timestamp
    BEFORE UPDATE ON "RawMaterial"
    FOR EACH ROW EXECUTE FUNCTION update_updated_timestamp();

CREATE TRIGGER update_rawmaterialinventory_timestamp
    BEFORE UPDATE ON "RawMaterialInventory"
    FOR EACH ROW EXECUTE FUNCTION update_updated_timestamp();

CREATE TRIGGER update_finishedgoods_timestamp
    BEFORE UPDATE ON "FinishedGoods"
    FOR EACH ROW EXECUTE FUNCTION update_updated_timestamp();

CREATE TRIGGER update_finishedgoodsinventory_timestamp
    BEFORE UPDATE ON "FinishedGoodsInventory"
    FOR EACH ROW EXECUTE FUNCTION update_updated_timestamp();