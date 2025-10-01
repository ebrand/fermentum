-- ============================================================================
-- Seed 043: Equipment Types and Equipment Instances
-- Sample brewery equipment for development and testing
-- ============================================================================

-- Note: This seed assumes you have at least one tenant in the system
-- Replace the tenant_id and brewery_id with actual values from your system

DO $$
DECLARE
    v_tenant_id UUID;
    v_brewery_id UUID;
    v_user_id UUID;

    -- Equipment Type IDs
    v_mash_tun_type_id UUID;
    v_boil_kettle_type_id UUID;
    v_fermenter_type_id UUID;
    v_bright_tank_type_id UUID;
    v_hot_liquor_tank_type_id UUID;
    v_conditioning_tank_type_id UUID;
    v_keg_type_id UUID;
    v_heat_exchanger_type_id UUID;
    v_pump_type_id UUID;
BEGIN
    -- Get first tenant and user for seed data
    SELECT "TenantId" INTO v_tenant_id FROM "Tenant" ORDER BY "Created" LIMIT 1;
    SELECT "UserId" INTO v_user_id FROM "User" ORDER BY "Created" LIMIT 1;
    SELECT "BreweryId" INTO v_brewery_id FROM "Brewery" WHERE "TenantId" = v_tenant_id ORDER BY "Created" LIMIT 1;

    -- Validate we have required data
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant found. Please create a tenant before running this seed.';
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found. Please create a user before running this seed.';
    END IF;

    RAISE NOTICE 'Seeding equipment for TenantId: %, BreweryId: %', v_tenant_id, v_brewery_id;

    -- ========================================================================
    -- EQUIPMENT TYPES
    -- ========================================================================

    -- Mash Tun
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Mash Tun',
        'Insulated vessel for mashing grains with water to convert starches to fermentable sugars',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_mash_tun_type_id;

    -- Boil Kettle
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Boil Kettle',
        'Heated vessel for boiling wort with hops and other additions',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_boil_kettle_type_id;

    -- Fermenter
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Fermenter',
        'Temperature-controlled vessel for primary and secondary fermentation',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_fermenter_type_id;

    -- Bright Tank
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Bright Tank',
        'Serving tank for carbonated, finished beer ready for packaging',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_bright_tank_type_id;

    -- Hot Liquor Tank
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Hot Liquor Tank',
        'Heated water storage for mashing and sparging',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_hot_liquor_tank_type_id;

    -- Conditioning Tank
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Conditioning Tank',
        'Temperature-controlled vessel for beer conditioning and maturation',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_conditioning_tank_type_id;

    -- Keg
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Keg',
        'Stainless steel keg for beer packaging and serving',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_keg_type_id;

    -- Heat Exchanger
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Heat Exchanger',
        'Chilling equipment to rapidly cool wort to pitching temperature',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_heat_exchanger_type_id;

    -- Pump
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Pump',
        'Sanitary pump for transferring liquids between vessels',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    RETURNING "EquipmentTypeId" INTO v_pump_type_id;

    RAISE NOTICE 'Created % equipment types', 9;

    -- ========================================================================
    -- EQUIPMENT INSTANCES
    -- ========================================================================

    -- ========================================================================
    -- MASH TUNS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_mash_tun_type_id,
        'Mash Tun A - 15 BBL',
        '15 barrel stainless steel mash tun with false bottom',
        'Available',
        15.0, 'barrels', 12.0,
        'MT-15BBL-001', 'BrewMatic', 'MT-1500',
        '2023-03-15',
        90, 'Brewhouse Floor - East Side',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_mash_tun_type_id,
        'Mash Tun B - 10 BBL',
        '10 barrel stainless steel mash tun for pilot batches',
        'Available',
        10.0, 'barrels', 8.0,
        'MT-10BBL-002', 'BrewMatic', 'MT-1000',
        '2024-01-10',
        90, 'Pilot Brew Area',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- BOIL KETTLES
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_boil_kettle_type_id,
        'Boil Kettle A - 15 BBL',
        '15 barrel steam-jacketed boil kettle',
        'Available',
        15.0, 'barrels', 13.0,
        'BK-15BBL-001', 'BrewMatic', 'BK-1500',
        '2023-03-15',
        60, 'Brewhouse Floor - East Side',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_boil_kettle_type_id,
        'Boil Kettle B - 10 BBL',
        '10 barrel electric boil kettle for pilot batches',
        'Available',
        10.0, 'barrels', 8.5,
        'BK-10BBL-002', 'BrewMatic', 'BK-1000E',
        '2024-01-10',
        60, 'Pilot Brew Area',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- FERMENTERS (10 Tanks - Mix of sizes)
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    -- Large fermenters (30 BBL)
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Fermenter 1 - 30 BBL',
        'Large format conical fermenter with glycol cooling',
        'Available',
        30.0, 'barrels', 28.0,
        'FV-30BBL-001', 'Unitank Systems', 'UT-3000',
        '2023-06-01',
        120, 'Cellar - Bay 1',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Fermenter 2 - 30 BBL',
        'Large format conical fermenter with glycol cooling',
        'Available',
        30.0, 'barrels', 28.0,
        'FV-30BBL-002', 'Unitank Systems', 'UT-3000',
        '2023-06-01',
        120, 'Cellar - Bay 2',
        CURRENT_TIMESTAMP, v_user_id
    ),
    -- Medium fermenters (15 BBL)
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Fermenter 3 - 15 BBL',
        'Medium format conical fermenter with glycol cooling',
        'Available',
        15.0, 'barrels', 14.0,
        'FV-15BBL-003', 'Unitank Systems', 'UT-1500',
        '2023-08-15',
        120, 'Cellar - Bay 3',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Fermenter 4 - 15 BBL',
        'Medium format conical fermenter with glycol cooling',
        'In Use',
        15.0, 'barrels', 14.0,
        'FV-15BBL-004', 'Unitank Systems', 'UT-1500',
        '2023-08-15',
        120, 'Cellar - Bay 4',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Fermenter 5 - 15 BBL',
        'Medium format conical fermenter with glycol cooling',
        'Available',
        15.0, 'barrels', 14.0,
        'FV-15BBL-005', 'Unitank Systems', 'UT-1500',
        '2024-02-01',
        120, 'Cellar - Bay 5',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Fermenter 6 - 15 BBL',
        'Medium format conical fermenter with glycol cooling',
        'Available',
        15.0, 'barrels', 14.0,
        'FV-15BBL-006', 'Unitank Systems', 'UT-1500',
        '2024-02-01',
        120, 'Cellar - Bay 6',
        CURRENT_TIMESTAMP, v_user_id
    ),
    -- Small fermenters (7 BBL)
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Fermenter 7 - 7 BBL',
        'Small format conical fermenter for specialty batches',
        'Available',
        7.0, 'barrels', 6.5,
        'FV-7BBL-007', 'Unitank Systems', 'UT-700',
        '2024-03-10',
        120, 'Cellar - Bay 7',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Fermenter 8 - 7 BBL',
        'Small format conical fermenter for specialty batches',
        'Cleaning',
        7.0, 'barrels', 6.5,
        'FV-7BBL-008', 'Unitank Systems', 'UT-700',
        '2024-03-10',
        120, 'Cellar - Bay 8',
        CURRENT_TIMESTAMP, v_user_id
    ),
    -- Pilot fermenter
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Pilot Fermenter - 3 BBL',
        'Small pilot fermenter for R&D batches',
        'Available',
        3.0, 'barrels', 2.8,
        'FV-3BBL-009', 'BrewMatic', 'PF-300',
        '2024-05-01',
        90, 'R&D Lab',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_fermenter_type_id,
        'Pilot Fermenter B - 3 BBL',
        'Small pilot fermenter for R&D batches',
        'Available',
        3.0, 'barrels', 2.8,
        'FV-3BBL-010', 'BrewMatic', 'PF-300',
        '2024-05-01',
        90, 'R&D Lab',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- BRIGHT TANKS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_bright_tank_type_id,
        'Bright Tank 1 - 30 BBL',
        'Large serving tank with carbonation stone',
        'Available',
        30.0, 'barrels', 28.0,
        'BT-30BBL-001', 'Unitank Systems', 'BT-3000',
        '2023-09-01',
        90, 'Bright Tank Room - Position 1',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_bright_tank_type_id,
        'Bright Tank 2 - 30 BBL',
        'Large serving tank with carbonation stone',
        'Available',
        30.0, 'barrels', 28.0,
        'BT-30BBL-002', 'Unitank Systems', 'BT-3000',
        '2023-09-01',
        90, 'Bright Tank Room - Position 2',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_bright_tank_type_id,
        'Bright Tank 3 - 15 BBL',
        'Medium serving tank with carbonation stone',
        'In Use',
        15.0, 'barrels', 14.0,
        'BT-15BBL-003', 'Unitank Systems', 'BT-1500',
        '2024-01-15',
        90, 'Bright Tank Room - Position 3',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_bright_tank_type_id,
        'Bright Tank 4 - 15 BBL',
        'Medium serving tank with carbonation stone',
        'Available',
        15.0, 'barrels', 14.0,
        'BT-15BBL-004', 'Unitank Systems', 'BT-1500',
        '2024-01-15',
        90, 'Bright Tank Room - Position 4',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- CONDITIONING TANKS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_conditioning_tank_type_id,
        'Conditioning Tank 1 - 20 BBL',
        'Temperature-controlled conditioning tank',
        'Available',
        20.0, 'barrels', 18.0,
        'CT-20BBL-001', 'Unitank Systems', 'CT-2000',
        '2023-10-01',
        90, 'Conditioning Room - Bay 1',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_conditioning_tank_type_id,
        'Conditioning Tank 2 - 20 BBL',
        'Temperature-controlled conditioning tank',
        'Available',
        20.0, 'barrels', 18.0,
        'CT-20BBL-002', 'Unitank Systems', 'CT-2000',
        '2023-10-01',
        90, 'Conditioning Room - Bay 2',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- HOT LIQUOR TANKS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_hot_liquor_tank_type_id,
        'HLT A - 20 BBL',
        'Heated water storage for main brewhouse',
        'Available',
        20.0, 'barrels', 18.0,
        'HLT-20BBL-001', 'BrewMatic', 'HLT-2000',
        '2023-03-15',
        60, 'Brewhouse Floor - West Side',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_hot_liquor_tank_type_id,
        'HLT B - 10 BBL',
        'Heated water storage for pilot system',
        'Available',
        10.0, 'barrels', 9.0,
        'HLT-10BBL-002', 'BrewMatic', 'HLT-1000',
        '2024-01-10',
        60, 'Pilot Brew Area',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- HEAT EXCHANGERS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_heat_exchanger_type_id,
        'Plate Chiller A - 15 BBL',
        'Plate heat exchanger for main brewhouse',
        'Available',
        15.0, 'barrels', NULL,
        'HX-PLATE-001', 'ChillTech', 'PCT-1500',
        '2023-03-20',
        30, 'Brewhouse Floor - Transfer Line 1',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_heat_exchanger_type_id,
        'Plate Chiller B - 10 BBL',
        'Plate heat exchanger for pilot system',
        'Available',
        10.0, 'barrels', NULL,
        'HX-PLATE-002', 'ChillTech', 'PCT-1000',
        '2024-01-10',
        30, 'Pilot Brew Area - Transfer Line',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- PUMPS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_pump_type_id,
        'Transfer Pump 1',
        'Sanitary centrifugal pump for wort and beer transfers',
        'Available',
        NULL, NULL, NULL,
        'PMP-CENT-001', 'FlowMax', 'FM-200',
        '2023-03-20',
        30, 'Brewhouse Floor - Mobile',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_pump_type_id,
        'Transfer Pump 2',
        'Sanitary centrifugal pump for wort and beer transfers',
        'Available',
        NULL, NULL, NULL,
        'PMP-CENT-002', 'FlowMax', 'FM-200',
        '2023-06-15',
        30, 'Cellar - Mobile',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_pump_type_id,
        'CIP Pump',
        'High-flow pump for clean-in-place operations',
        'Available',
        NULL, NULL, NULL,
        'PMP-CIP-001', 'FlowMax', 'CIP-500',
        '2023-03-20',
        30, 'CIP Station',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- KEGS (Sample - typically you'd have many more)
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_keg_type_id,
        'Half Barrel Keg #001',
        '15.5 gallon stainless steel keg',
        'Available',
        15.5, 'gallons', 15.5,
        'KEG-HB-001', 'Keg Supplier Co', 'Half-Barrel',
        '2023-03-01',
        365, 'Keg Storage - Rack A',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_keg_type_id,
        'Sixth Barrel Keg #001',
        '5.16 gallon stainless steel keg',
        'In Use',
        5.16, 'gallons', 5.16,
        'KEG-SB-001', 'Keg Supplier Co', 'Sixth-Barrel',
        '2023-03-01',
        365, 'Distribution',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_keg_type_id,
        'Cornelius Keg #001',
        '5 gallon cornelius keg for sampling',
        'Available',
        5.0, 'gallons', 5.0,
        'KEG-CORN-001', 'Keg Supplier Co', 'Corny',
        '2023-03-01',
        365, 'Keg Storage - Rack C',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- SUMMARY
    -- ========================================================================

    RAISE NOTICE 'Equipment seeding complete!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Equipment Types: 9';
    RAISE NOTICE 'Mash Tuns: 2';
    RAISE NOTICE 'Boil Kettles: 2';
    RAISE NOTICE 'Fermenters: 10 (2x30BBL, 6x15BBL, 2x7BBL, 2x3BBL)';
    RAISE NOTICE 'Bright Tanks: 4 (2x30BBL, 2x15BBL)';
    RAISE NOTICE 'Conditioning Tanks: 2 (2x20BBL)';
    RAISE NOTICE 'Hot Liquor Tanks: 2 (20BBL, 10BBL)';
    RAISE NOTICE 'Heat Exchangers: 2';
    RAISE NOTICE 'Pumps: 3';
    RAISE NOTICE 'Kegs: 3 (samples)';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total Equipment Instances: 30';

END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- View all equipment types
-- SELECT "Name", "Description" FROM "EquipmentType" ORDER BY "Name";

-- View all equipment by type with status
-- SELECT
--     et."Name" AS "EquipmentType",
--     e."Name" AS "EquipmentName",
--     e."Capacity" || ' ' || e."CapacityUnit" AS "Capacity",
--     e."Status",
--     e."Location"
-- FROM "Equipment" e
-- JOIN "EquipmentType" et ON et."EquipmentTypeId" = e."EquipmentTypeId"
-- ORDER BY et."Name", e."Name";

-- Count equipment by status
-- SELECT
--     "Status",
--     COUNT(*) as "Count"
-- FROM "Equipment"
-- GROUP BY "Status"
-- ORDER BY "Status";

-- List available fermenters by capacity
-- SELECT
--     e."Name",
--     e."Capacity" || ' ' || e."CapacityUnit" AS "Capacity",
--     e."WorkingCapacity" || ' ' || e."CapacityUnit" AS "WorkingCapacity",
--     e."Location"
-- FROM "Equipment" e
-- JOIN "EquipmentType" et ON et."EquipmentTypeId" = e."EquipmentTypeId"
-- WHERE et."Name" = 'Fermenter'
--   AND e."Status" = 'Available'
-- ORDER BY e."Capacity" DESC;
