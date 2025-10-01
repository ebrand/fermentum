-- ============================================================================
-- Seed 044: Expanded Brewery Equipment Types and Instances
-- Adds additional realistic brewery equipment with proper manufacturers
-- Extends 043_seed_equipment_types_and_instances.sql
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_brewery_id UUID;
    v_user_id UUID;

    -- New Equipment Type IDs
    v_glycol_chiller_type_id UUID;
    v_whirlpool_type_id UUID;
    v_lauter_tun_type_id UUID;
    v_keg_washer_type_id UUID;
    v_grain_mill_type_id UUID;
    v_canning_line_type_id UUID;
    v_bottling_line_type_id UUID;
    v_cip_system_type_id UUID;
    v_yeast_prop_type_id UUID;
    v_hopback_type_id UUID;
    v_co2_system_type_id UUID;
    v_nitrogen_system_type_id UUID;
    v_centrifuge_type_id UUID;
    v_glycol_pump_type_id UUID;
BEGIN
    -- Get first tenant and user for seed data
    SELECT "TenantId" INTO v_tenant_id FROM "Tenant" LIMIT 1;
    SELECT "UserId" INTO v_user_id FROM "User" LIMIT 1;
    SELECT "BreweryId" INTO v_brewery_id FROM "Brewery" WHERE "TenantId" = v_tenant_id LIMIT 1;

    -- Validate we have required data
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant found. Please create a tenant before running this seed.';
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found. Please create a user before running this seed.';
    END IF;

    RAISE NOTICE 'Expanding equipment for TenantId: %, BreweryId: %', v_tenant_id, v_brewery_id;

    -- ========================================================================
    -- NEW EQUIPMENT TYPES
    -- ========================================================================

    -- Glycol Chiller
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Glycol Chiller',
        'Refrigeration system for maintaining fermentation temperature control',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_glycol_chiller_type_id;

    -- Whirlpool Tank
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Whirlpool',
        'Vessel for settling trub and hop material after boiling',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_whirlpool_type_id;

    -- Lauter Tun
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Lauter Tun',
        'Vessel with false bottom for separating wort from spent grain',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_lauter_tun_type_id;

    -- Keg Washer
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Keg Washer',
        'Automated system for cleaning and sanitizing kegs',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_keg_washer_type_id;

    -- Grain Mill
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Grain Mill',
        'Malt crushing equipment with adjustable gap rollers',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_grain_mill_type_id;

    -- Canning Line
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Canning Line',
        'Automated system for filling and seaming cans',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_canning_line_type_id;

    -- Bottling Line
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Bottling Line',
        'Automated system for filling and capping bottles',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_bottling_line_type_id;

    -- CIP System
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'CIP System',
        'Clean-in-place automated cleaning and sanitizing system',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_cip_system_type_id;

    -- Yeast Propagation Tank
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Yeast Propagation Tank',
        'Temperature-controlled vessel for growing yeast cultures',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_yeast_prop_type_id;

    -- Hopback
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Hopback',
        'Vessel for hop flavor extraction during wort transfer',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_hopback_type_id;

    -- CO2 System
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'CO2 System',
        'Bulk carbon dioxide storage and distribution system',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_co2_system_type_id;

    -- Nitrogen System
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Nitrogen System',
        'Nitrogen gas storage for nitro beers and beer gas blends',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_nitrogen_system_type_id;

    -- Centrifuge
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Centrifuge',
        'High-speed separator for beer clarification and yeast harvesting',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_centrifuge_type_id;

    -- Glycol Pump
    INSERT INTO "EquipmentType" ("EquipmentTypeId", "TenantId", "BreweryId", "Name", "Description", "Created", "CreatedBy")
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_brewery_id,
        'Glycol Pump',
        'Circulation pump for glycol cooling system',
        CURRENT_TIMESTAMP,
        v_user_id
    )
    ON CONFLICT ("TenantId", "Name") DO NOTHING
    RETURNING "EquipmentTypeId" INTO v_glycol_pump_type_id;

    RAISE NOTICE 'Created 14 new equipment types';

    -- ========================================================================
    -- NEW EQUIPMENT INSTANCES
    -- ========================================================================

    -- ========================================================================
    -- GLYCOL CHILLERS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_glycol_chiller_type_id,
        'Primary Glycol Chiller - 20 Ton',
        'Main glycol refrigeration system for cellar temperature control',
        'Available',
        20.0, 'tons', NULL,
        'GC-20T-001', 'Specific Mechanical Systems', 'SMS-2000',
        '2023-03-01',
        180, 'Mechanical Room',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_glycol_chiller_type_id,
        'Secondary Glycol Chiller - 10 Ton',
        'Backup glycol refrigeration system',
        'Available',
        10.0, 'tons', NULL,
        'GC-10T-002', 'Specific Mechanical Systems', 'SMS-1000',
        '2024-06-15',
        180, 'Mechanical Room',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- WHIRLPOOL TANKS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_whirlpool_type_id,
        'Whirlpool Tank - 15 BBL',
        'Integrated whirlpool with tangential inlet',
        'Available',
        15.0, 'barrels', 13.5,
        'WP-15BBL-001', 'Portland Kettle Works', 'PKW-WP1500',
        '2023-03-15',
        90, 'Brewhouse Floor - Hot Side',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- LAUTER TUNS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_lauter_tun_type_id,
        'Lauter Tun - 15 BBL',
        'Four-vessel brewhouse lauter tun with rake arms',
        'Available',
        15.0, 'barrels', 12.0,
        'LT-15BBL-001', 'JVNW Inc', 'JVNW-LT1500',
        '2023-03-15',
        90, 'Brewhouse Floor - Cold Side',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- KEG WASHERS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_keg_washer_type_id,
        'Automated Keg Washer - 4 Head',
        'Four-head automatic keg washer with integrated sanitizer',
        'Available',
        4.0, 'heads', NULL,
        'KW-4HEAD-001', 'KegCraft', 'KC-KW400',
        '2023-09-01',
        30, 'Packaging Area - Keg Zone',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- GRAIN MILLS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_grain_mill_type_id,
        'Primary Grain Mill - 4 Roller',
        'Four-roller mill with pneumatic grain conveyance',
        'Available',
        2000.0, 'lbs/hr', NULL,
        'GM-4R-001', 'Paul Mueller Company', 'PMC-GM2000',
        '2023-03-10',
        30, 'Grain Room',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_grain_mill_type_id,
        'Pilot Grain Mill - 2 Roller',
        'Small two-roller mill for R&D batches',
        'Available',
        200.0, 'lbs/hr', NULL,
        'GM-2R-002', 'Blichmann Engineering', 'BE-GM200',
        '2024-01-15',
        30, 'Pilot Brew Area',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- CANNING LINE
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_canning_line_type_id,
        'Automated Canning Line - 30 CPM',
        'Counter-pressure filler with seamer, 30 cans per minute',
        'Available',
        30.0, 'cans/min', NULL,
        'CAN-30CPM-001', 'Wild Goose Filling', 'WGF-MC250',
        '2024-03-01',
        7, 'Packaging Area - Can Zone',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- BOTTLING LINE
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_bottling_line_type_id,
        'Semi-Automated Bottling Line - 15 BPM',
        'Counter-pressure bottle filler with capper, 15 bottles per minute',
        'Available',
        15.0, 'bottles/min', NULL,
        'BOT-15BPM-001', 'Meheen Manufacturing', 'MM-XL2-4',
        '2023-11-15',
        7, 'Packaging Area - Bottle Zone',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- CIP SYSTEMS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_cip_system_type_id,
        'CIP System A - 3 Tank',
        'Three-tank CIP system with caustic, acid, and sanitizer',
        'Available',
        100.0, 'gallons', NULL,
        'CIP-3T-001', 'Spraying Systems Co', 'SSC-CIP300',
        '2023-03-20',
        30, 'CIP Station - Cellar',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_cip_system_type_id,
        'CIP System B - Mobile Unit',
        'Mobile single-tank CIP cart for tanks and packaging',
        'Available',
        50.0, 'gallons', NULL,
        'CIP-MOB-002', 'Premier Stainless Systems', 'PSS-CIPM50',
        '2024-05-10',
        30, 'Packaging Area',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- YEAST PROPAGATION TANKS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_yeast_prop_type_id,
        'Yeast Prop Tank - 5 BBL',
        'Temperature-controlled yeast propagation vessel',
        'Available',
        5.0, 'barrels', 4.5,
        'YP-5BBL-001', 'Ss Brewtech', 'SSB-YP500',
        '2023-12-01',
        90, 'Yeast Lab',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- HOPBACKS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_hopback_type_id,
        'Hopback - 15 BBL',
        'Inline hopback for whirlpool hop additions',
        'Available',
        15.0, 'barrels', NULL,
        'HB-15BBL-001', 'Blichmann Engineering', 'BE-HB1500',
        '2024-02-15',
        60, 'Brewhouse Floor - Transfer Line',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- CO2 SYSTEMS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_co2_system_type_id,
        'Bulk CO2 Tank - 1000 lb',
        'Bulk liquid CO2 storage with vaporizer',
        'Available',
        1000.0, 'lbs', NULL,
        'CO2-1000LB-001', 'Airgas', 'AG-BCO2-1000',
        '2023-03-05',
        365, 'Outside - South Wall',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- NITROGEN SYSTEMS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_nitrogen_system_type_id,
        'Nitrogen Generator - 99.5%',
        'On-site nitrogen generation system',
        'Available',
        10.0, 'cfm', NULL,
        'N2-10CFM-001', 'Peak Gas Generation', 'PGG-N2-10',
        '2024-04-01',
        180, 'Mechanical Room',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- CENTRIFUGES
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_centrifuge_type_id,
        'Beer Centrifuge - 50 HL/hr',
        'Disc stack separator for beer clarification',
        'Available',
        50.0, 'HL/hr', NULL,
        'CENT-50HL-001', 'GEA', 'GEA-KDB-6',
        '2024-07-01',
        90, 'Cellar - Bright Beer Area',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- GLYCOL PUMPS
    -- ========================================================================

    INSERT INTO "Equipment" (
        "TenantId", "BreweryId", "EquipmentTypeId", "Name", "Description", "Status",
        "Capacity", "CapacityUnit", "WorkingCapacity",
        "SerialNumber", "Manufacturer", "Model", "PurchaseDate",
        "MaintenanceIntervalDays", "Location",
        "Created", "CreatedBy"
    ) VALUES
    (
        v_tenant_id, v_brewery_id, v_glycol_pump_type_id,
        'Primary Glycol Pump',
        'Main circulation pump for glycol system',
        'Available',
        50.0, 'gpm', NULL,
        'GP-50GPM-001', 'Grundfos', 'GRU-CR64',
        '2023-03-01',
        180, 'Mechanical Room',
        CURRENT_TIMESTAMP, v_user_id
    ),
    (
        v_tenant_id, v_brewery_id, v_glycol_pump_type_id,
        'Secondary Glycol Pump',
        'Backup circulation pump for glycol system',
        'Available',
        50.0, 'gpm', NULL,
        'GP-50GPM-002', 'Grundfos', 'GRU-CR64',
        '2023-03-01',
        180, 'Mechanical Room',
        CURRENT_TIMESTAMP, v_user_id
    );

    -- ========================================================================
    -- SUMMARY
    -- ========================================================================

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Equipment Expansion Complete!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'NEW Equipment Types Added: 14';
    RAISE NOTICE '  - Glycol Chiller';
    RAISE NOTICE '  - Whirlpool';
    RAISE NOTICE '  - Lauter Tun';
    RAISE NOTICE '  - Keg Washer';
    RAISE NOTICE '  - Grain Mill';
    RAISE NOTICE '  - Canning Line';
    RAISE NOTICE '  - Bottling Line';
    RAISE NOTICE '  - CIP System';
    RAISE NOTICE '  - Yeast Propagation Tank';
    RAISE NOTICE '  - Hopback';
    RAISE NOTICE '  - CO2 System';
    RAISE NOTICE '  - Nitrogen System';
    RAISE NOTICE '  - Centrifuge';
    RAISE NOTICE '  - Glycol Pump';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'NEW Equipment Instances Added: 18';
    RAISE NOTICE '  - Glycol Chillers: 2 (20 ton, 10 ton)';
    RAISE NOTICE '  - Whirlpool Tanks: 1 (15 BBL)';
    RAISE NOTICE '  - Lauter Tuns: 1 (15 BBL)';
    RAISE NOTICE '  - Keg Washers: 1 (4-head)';
    RAISE NOTICE '  - Grain Mills: 2 (4-roller, 2-roller)';
    RAISE NOTICE '  - Canning Lines: 1 (30 cpm)';
    RAISE NOTICE '  - Bottling Lines: 1 (15 bpm)';
    RAISE NOTICE '  - CIP Systems: 2 (3-tank, mobile)';
    RAISE NOTICE '  - Yeast Prop Tanks: 1 (5 BBL)';
    RAISE NOTICE '  - Hopbacks: 1 (15 BBL)';
    RAISE NOTICE '  - CO2 Systems: 1 (1000 lb)';
    RAISE NOTICE '  - Nitrogen Systems: 1 (10 cfm generator)';
    RAISE NOTICE '  - Centrifuges: 1 (50 HL/hr)';
    RAISE NOTICE '  - Glycol Pumps: 2 (50 gpm each)';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TOTAL Equipment Types: 23 (9 original + 14 new)';
    RAISE NOTICE 'TOTAL Equipment Instances: 48 (30 original + 18 new)';
    RAISE NOTICE '==========================================';

END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- View all equipment types including new additions
-- SELECT "Name", "Description"
-- FROM "EquipmentType"
-- ORDER BY "Name";

-- View all equipment by type with manufacturers
-- SELECT
--     et."Name" AS "EquipmentType",
--     e."Name" AS "EquipmentName",
--     e."Manufacturer",
--     e."Model",
--     e."Capacity" || ' ' || COALESCE(e."CapacityUnit", '') AS "Capacity",
--     e."Status",
--     e."Location"
-- FROM "Equipment" e
-- JOIN "EquipmentType" et ON et."EquipmentTypeId" = e."EquipmentTypeId"
-- ORDER BY et."Name", e."Name";

-- Count equipment by manufacturer
-- SELECT
--     "Manufacturer",
--     COUNT(*) as "EquipmentCount"
-- FROM "Equipment"
-- GROUP BY "Manufacturer"
-- ORDER BY "EquipmentCount" DESC;

-- List all equipment with purchase dates
-- SELECT
--     et."Name" AS "Type",
--     e."Name",
--     e."Manufacturer",
--     e."PurchaseDate",
--     AGE(CURRENT_DATE, e."PurchaseDate") AS "Age"
-- FROM "Equipment" e
-- JOIN "EquipmentType" et ON et."EquipmentTypeId" = e."EquipmentTypeId"
-- ORDER BY e."PurchaseDate" DESC;
