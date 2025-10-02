-- Migration: Add Equipment support to RecipeStep table
-- Date: 2025-10-01
-- Description: Links RecipeStep to EquipmentType for equipment requirements

-- Add equipment-related columns to RecipeStep
ALTER TABLE "RecipeStep"
ADD COLUMN "RequiresEquipment" BOOLEAN DEFAULT FALSE,
ADD COLUMN "EquipmentTypeId" UUID REFERENCES "EquipmentType"("EquipmentTypeId"),
ADD COLUMN "EquipmentCapacityMin" DECIMAL(10,2),
ADD COLUMN "EquipmentCapacityUnit" VARCHAR(20);

-- Add index for equipment type lookups
CREATE INDEX "IDX_RecipeStep_EquipmentType" ON "RecipeStep"("EquipmentTypeId");

-- Add comment
COMMENT ON COLUMN "RecipeStep"."EquipmentTypeId" IS 'Type of equipment required for this step (e.g., Fermenter, Mash Tun)';
COMMENT ON COLUMN "RecipeStep"."RequiresEquipment" IS 'Whether this step requires specific equipment';
COMMENT ON COLUMN "RecipeStep"."EquipmentCapacityMin" IS 'Minimum equipment capacity needed for this step';
COMMENT ON COLUMN "RecipeStep"."EquipmentCapacityUnit" IS 'Unit of measurement for capacity (gallons, barrels, etc.)';
