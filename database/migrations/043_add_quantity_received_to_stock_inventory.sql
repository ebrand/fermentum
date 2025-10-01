-- Migration: Add QuantityReceived to StockInventory
-- This migration adds a QuantityReceived column to track the original quantity
-- received in a lot, allowing us to show both original and current quantities

BEGIN;

-- Add QuantityReceived column to track original lot quantity
ALTER TABLE "StockInventory"
ADD COLUMN "QuantityReceived" NUMERIC(10,3) NOT NULL DEFAULT 0;

-- Backfill QuantityReceived with current QuantityOnHand for existing records
-- (Assumes existing lots haven't been consumed yet, or we're resetting the baseline)
UPDATE "StockInventory"
SET "QuantityReceived" = "QuantityOnHand"
WHERE "QuantityReceived" = 0;

-- Add check constraint to ensure QuantityOnHand never exceeds QuantityReceived
ALTER TABLE "StockInventory"
ADD CONSTRAINT "CHK_StockInventory_QuantityOnHand_LTE_Received"
CHECK ("QuantityOnHand" <= "QuantityReceived");

-- Add helpful comment
COMMENT ON COLUMN "StockInventory"."QuantityReceived" IS 'Original quantity received in this lot (immutable after creation)';

COMMIT;
