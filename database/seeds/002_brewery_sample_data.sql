-- ============================================================================
-- Brewery Sample Data
-- Sample brewery data for development and testing
-- ============================================================================

-- ============================================================================
-- CRAFT BEER CO SAMPLE DATA (tenant_11111111111111111111111111111111)
-- ============================================================================

-- Beer Styles for Craft Beer Co
INSERT INTO tenant_11111111111111111111111111111111.beer_styles (
    id,
    tenant_id,
    name,
    category,
    subcategory,
    bjcp_code,
    bjcp_year,
    description,
    og_min, og_max,
    fg_min, fg_max,
    abv_min, abv_max,
    ibu_min, ibu_max,
    srm_min, srm_max,
    created_by
) VALUES
(
    '40000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'American IPA',
    'IPA',
    'American IPA',
    '21A',
    2021,
    'A decidedly hoppy and bitter, moderately strong American pale ale, showcasing modern American or New World hop varieties.',
    1.056, 1.070,
    1.008, 1.014,
    5.5, 7.5,
    40, 70,
    6.0, 14.0,
    '00000000-0000-0000-0000-000000000002'
),
(
    '40000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'American Stout',
    'Stout',
    'American Stout',
    '20B',
    2021,
    'A fairly strong, highly roasted, bitter, hoppy dark stout with a dry finish.',
    1.050, 1.075,
    1.010, 1.022,
    5.0, 7.0,
    35, 75,
    30.0, 40.0,
    '00000000-0000-0000-0000-000000000002'
),
(
    '40000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Wheat Beer',
    'Wheat Beer',
    'American Wheat Beer',
    '1D',
    2021,
    'Refreshing wheat beers that can display more hop character and less yeast character than their German cousins.',
    1.040, 1.055,
    1.008, 1.013,
    4.0, 5.5,
    15, 30,
    3.0, 6.0,
    '00000000-0000-0000-0000-000000000002'
);

-- Main Brewery Location
INSERT INTO tenant_11111111111111111111111111111111.breweries (
    id,
    tenant_id,
    name,
    slug,
    description,
    address_line1,
    address_line2,
    city,
    state_province,
    postal_code,
    country,
    latitude,
    longitude,
    phone,
    email,
    website,
    license_number,
    license_type,
    capacity_barrels,
    timezone,
    status,
    created_by
) VALUES (
    '50000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Craft Beer Co Main Brewery',
    'main-brewery',
    'Our flagship brewery and taproom in downtown, featuring 20 taps and a full kitchen.',
    '123 Brewery Street',
    'Suite 100',
    'Portland',
    'Oregon',
    '97201',
    'US',
    45.5152, -122.6784,
    '+1-503-555-BEER',
    'info@craftbeer.dev',
    'https://craftbeer.dev',
    'OR-MB-2024-001',
    'microbrewery',
    5000,
    'America/Los_Angeles',
    'active',
    '00000000-0000-0000-0000-000000000002'
);

-- Sample Recipes
INSERT INTO tenant_11111111111111111111111111111111.recipes (
    id,
    tenant_id,
    brewery_id,
    beer_style_id,
    name,
    version,
    description,
    batch_size_liters,
    boil_time_minutes,
    efficiency_percent,
    target_og,
    target_fg,
    target_abv,
    target_ibu,
    target_srm,
    ingredients,
    mash_profile,
    hop_schedule,
    brewing_notes,
    status,
    created_by
) VALUES (
    '60000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Flagship IPA',
    '2.1',
    'Our signature American IPA with Cascade, Centennial, and Simcoe hops.',
    1000.0,
    60,
    78.0,
    1.062,
    1.012,
    6.5,
    55,
    8.5,
    '{
        "malts": [
            {"name": "2-Row Pale Malt", "amount_kg": 45.0, "percentage": 82.5},
            {"name": "Crystal 40L", "amount_kg": 4.5, "percentage": 8.2},
            {"name": "Munich Malt", "amount_kg": 3.6, "percentage": 6.6},
            {"name": "Carapils", "amount_kg": 1.4, "percentage": 2.7}
        ],
        "hops": [
            {"name": "Cascade", "alpha_acid": 5.8, "amount_g": 280, "time_min": 60, "type": "bittering"},
            {"name": "Centennial", "alpha_acid": 9.5, "amount_g": 170, "time_min": 20, "type": "flavor"},
            {"name": "Simcoe", "alpha_acid": 12.1, "amount_g": 140, "time_min": 5, "type": "aroma"},
            {"name": "Cascade", "alpha_acid": 5.8, "amount_g": 200, "time_min": 0, "type": "whirlpool"},
            {"name": "Simcoe", "alpha_acid": 12.1, "amount_g": 150, "time_min": "dry_hop_day_3", "type": "dry_hop"}
        ],
        "yeast": {
            "name": "Safale US-05",
            "type": "dry",
            "attenuation": 80,
            "temperature_range": "15-24°C"
        }
    }',
    '{
        "mash_steps": [
            {"name": "Single Infusion", "temperature_c": 65, "time_min": 60, "description": "Single step saccharification rest"}
        ],
        "sparge_temperature_c": 77,
        "grain_to_water_ratio": "1kg:2.6L"
    }',
    '{
        "boil_additions": [
            {"time_min": 60, "description": "Add bittering hops"},
            {"time_min": 20, "description": "Add flavor hops"},
            {"time_min": 15, "description": "Add Irish moss"},
            {"time_min": 5, "description": "Add aroma hops"},
            {"time_min": 0, "description": "Whirlpool additions"}
        ]
    }',
    'Dry hop on day 3 of fermentation for maximum aroma retention. Target fermentation temperature 18-20°C.',
    'active',
    '00000000-0000-0000-0000-000000000002'
);

-- Sample Batches
INSERT INTO tenant_11111111111111111111111111111111.batches (
    id,
    tenant_id,
    brewery_id,
    recipe_id,
    batch_number,
    internal_code,
    planned_volume_liters,
    actual_volume_liters,
    brew_date,
    planned_package_date,
    original_gravity,
    final_gravity,
    actual_abv,
    actual_ibu,
    status,
    current_location,
    quality_score,
    brew_log,
    production_notes,
    created_by
) VALUES (
    '70000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '50000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '2024-IPA-001',
    'FI001',
    1000.0,
    980.0,
    '2024-09-15',
    '2024-09-29',
    1.063,
    1.011,
    6.8,
    57,
    'fermenting',
    'Fermenter Tank 3',
    8,
    '{
        "mash_in_temp": 65.2,
        "mash_out_temp": 77.1,
        "sparge_volume": 1200,
        "pre_boil_gravity": 1.048,
        "boil_off_rate": 12.5,
        "cooling_time_min": 25,
        "knockout_temp": 18.5,
        "yeast_pitch_rate": "0.75M cells/mL/°P"
    }',
    'Excellent mash efficiency at 79%. Slightly higher OG than target due to excellent extraction.',
    '00000000-0000-0000-0000-000000000002'
);

-- ============================================================================
-- MICROBREWERY INC SAMPLE DATA (tenant_22222222222222222222222222222222)
-- ============================================================================

-- Beer Styles for Microbrewery Inc
INSERT INTO tenant_22222222222222222222222222222222.beer_styles (
    id,
    tenant_id,
    name,
    category,
    description,
    og_min, og_max,
    fg_min, fg_max,
    abv_min, abv_max,
    ibu_min, ibu_max,
    srm_min, srm_max,
    created_by
) VALUES (
    '40000000-0000-0000-0000-000000000004',
    '22222222-2222-2222-2222-222222222222',
    'Classic Pilsner',
    'Lager',
    'A light-bodied, highly attenuated, pale, straw to light gold colored lager with a very clean profile.',
    1.044, 1.050,
    1.008, 1.013,
    4.2, 5.8,
    25, 45,
    2.0, 5.0,
    '00000000-0000-0000-0000-000000000002'
);

-- Brewery Location
INSERT INTO tenant_22222222222222222222222222222222.breweries (
    id,
    tenant_id,
    name,
    slug,
    description,
    address_line1,
    city,
    state_province,
    postal_code,
    country,
    phone,
    email,
    license_number,
    license_type,
    capacity_barrels,
    status,
    created_by
) VALUES (
    '50000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Microbrewery Production Facility',
    'production-facility',
    'Small batch production facility specializing in traditional European styles.',
    '456 Industrial Way',
    'San Diego',
    'California',
    '92101',
    'US',
    '+1-619-555-BREW',
    'brewing@microbrewery.dev',
    'CA-MB-2024-002',
    'microbrewery',
    1500,
    'active',
    '00000000-0000-0000-0000-000000000002'
);

-- Sample Recipe
INSERT INTO tenant_22222222222222222222222222222222.recipes (
    id,
    tenant_id,
    brewery_id,
    beer_style_id,
    name,
    version,
    description,
    batch_size_liters,
    target_og,
    target_fg,
    target_abv,
    target_ibu,
    ingredients,
    status,
    created_by
) VALUES (
    '60000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000004',
    'Traditional Pilsner',
    '1.0',
    'Classic Czech-style pilsner with Saaz hops and Pilsner malt.',
    500.0,
    1.048,
    1.010,
    5.0,
    35,
    '{
        "malts": [
            {"name": "Pilsner Malt", "amount_kg": 20.0, "percentage": 100}
        ],
        "hops": [
            {"name": "Saaz", "alpha_acid": 3.2, "amount_g": 180, "time_min": 60, "type": "bittering"},
            {"name": "Saaz", "alpha_acid": 3.2, "amount_g": 120, "time_min": 15, "type": "aroma"}
        ],
        "yeast": {
            "name": "Wyeast 2124 Bohemian Lager",
            "type": "liquid",
            "attenuation": 75
        }
    }',
    'active',
    '00000000-0000-0000-0000-000000000002'
);

-- Log sample data creation
INSERT INTO public.audit_logs (
    action,
    resource_type,
    resource_id,
    new_values,
    metadata,
    created_at
) VALUES (
    'sample_data.created',
    'brewery_data',
    'development_samples',
    '{"breweries": 2, "recipes": 2, "batches": 1, "beer_styles": 4}',
    '{"environment": "development", "script": "002_brewery_sample_data.sql"}',
    NOW()
);