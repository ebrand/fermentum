#!/usr/bin/env python3
"""
Generate a complete SQL migration script to populate the BeerStyle table
with all BJCP 2021 beer style data from the JSON file.
"""

import json
import sys
import os
from decimal import Decimal, InvalidOperation

def safe_decimal(value, max_digits=5, decimal_places=3):
    """Safely convert a string value to decimal with proper formatting."""
    if not value or value == '-':
        return 'NULL'

    try:
        # Remove any extra whitespace and convert to float first
        float_val = float(str(value).strip())
        # Format to the specified decimal places
        decimal_val = Decimal(str(float_val)).quantize(Decimal('0.' + '0' * decimal_places))
        return str(decimal_val)
    except (ValueError, InvalidOperation, TypeError):
        return 'NULL'

def safe_int(value):
    """Safely convert a string value to integer."""
    if not value or value == '-':
        return 'NULL'

    try:
        return str(int(float(str(value).strip())))
    except (ValueError, TypeError):
        return 'NULL'

def escape_sql_string(value):
    """Escape a string value for SQL insertion."""
    if not value:
        return 'NULL'

    # Replace single quotes with double single quotes for SQL escaping
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

def generate_migration_sql(json_file_path, output_file_path):
    """Generate the complete SQL migration script."""

    # Read the BJCP JSON data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        beer_styles = json.load(f)

    print(f"Found {len(beer_styles)} beer styles in the JSON file")

    # Start building the SQL script
    sql_lines = [
        "-- Migration: Populate BeerStyle table with complete BJCP 2021 guidelines data",
        "-- Date: 2025-01-27",
        f"-- Description: Imports all {len(beer_styles)} BJCP beer styles with complete characteristics and ranges",
        "-- Generated from: bjcp-data.json",
        "",
        "BEGIN;",
        "",
        "-- Clear any existing BeerStyle data to avoid conflicts",
        'DELETE FROM "BeerStyle";',
        "",
        "-- Insert all BJCP beer styles",
        ""
    ]

    # Process each beer style
    for i, style in enumerate(beer_styles):
        # Extract and convert values with proper type handling
        bjcp_number = escape_sql_string(style.get('number', ''))
        style_name = escape_sql_string(style.get('name', ''))
        category = escape_sql_string(style.get('category', ''))
        description = escape_sql_string(style.get('overallimpression', ''))

        # Ranges - convert to proper decimal format
        abv_min = safe_decimal(style.get('abvmin'), 4, 2)
        abv_max = safe_decimal(style.get('abvmax'), 4, 2)
        ibu_min = safe_int(style.get('ibumin'))
        ibu_max = safe_int(style.get('ibumax'))
        srm_min = safe_int(style.get('srmmin'))
        srm_max = safe_int(style.get('srmmax'))
        og_min = safe_decimal(style.get('ogmin'), 5, 3)
        og_max = safe_decimal(style.get('ogmax'), 5, 3)
        fg_min = safe_decimal(style.get('fgmin'), 5, 3)
        fg_max = safe_decimal(style.get('fgmax'), 5, 3)

        # Characteristics
        appearance = escape_sql_string(style.get('appearance', ''))
        aroma = escape_sql_string(style.get('aroma', ''))
        flavor = escape_sql_string(style.get('flavor', ''))
        mouthfeel = escape_sql_string(style.get('mouthfeel', ''))
        comments = escape_sql_string(style.get('comments', ''))
        history = escape_sql_string(style.get('history', ''))
        characteristic_ingredients = escape_sql_string(style.get('characteristicingredients', ''))
        style_comparison = escape_sql_string(style.get('stylecomparison', ''))
        commercial_examples = escape_sql_string(style.get('commercialexamples', ''))

        # Build the INSERT statement
        insert_sql = f"""INSERT INTO "BeerStyle" (
    "StyleId", "BJCPNumber", "StyleName", "Category", "Description",
    "ABVMin", "ABVMax", "IBUMin", "IBUMax", "SRMMin", "SRMMax",
    "OGMin", "OGMax", "FGMin", "FGMax",
    "Appearance", "Aroma", "Flavor", "Mouthfeel", "Comments",
    "History", "CharacteristicIngredients", "StyleComparison", "CommercialExamples",
    "Created", "Updated"
) VALUES (
    gen_random_uuid(),
    {bjcp_number},
    {style_name},
    {category},
    {description},
    {abv_min}, {abv_max}, {ibu_min}, {ibu_max}, {srm_min}, {srm_max},
    {og_min}, {og_max}, {fg_min}, {fg_max},
    {appearance},
    {aroma},
    {flavor},
    {mouthfeel},
    {comments},
    {history},
    {characteristic_ingredients},
    {style_comparison},
    {commercial_examples},
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);"""

        sql_lines.append(insert_sql)
        sql_lines.append("")

        # Progress indicator
        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1}/{len(beer_styles)} styles...")

    # Add indexes and completion
    sql_lines.extend([
        "-- Create indexes for optimal query performance",
        'CREATE INDEX IF NOT EXISTS "IX_BeerStyle_BJCPNumber" ON "BeerStyle"("BJCPNumber");',
        'CREATE INDEX IF NOT EXISTS "IX_BeerStyle_Category" ON "BeerStyle"("Category");',
        'CREATE INDEX IF NOT EXISTS "IX_BeerStyle_StyleName" ON "BeerStyle"("StyleName");',
        "",
        "COMMIT;",
        "",
        f"-- Migration completed: {len(beer_styles)} BJCP beer styles imported successfully"
    ])

    # Write the migration file
    with open(output_file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"Migration script generated successfully: {output_file_path}")
    print(f"Total beer styles processed: {len(beer_styles)}")

if __name__ == "__main__":
    # Set up paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, "..", "..")
    json_file = os.path.join(project_root, "database", "bjcp-data.json")
    output_file = os.path.join(project_root, "database", "migrations", "037_populate_complete_bjcp_beer_styles.sql")

    # Verify input file exists
    if not os.path.exists(json_file):
        print(f"Error: BJCP JSON file not found at {json_file}")
        sys.exit(1)

    # Generate the migration
    try:
        generate_migration_sql(json_file, output_file)
        print("Migration generation completed successfully!")
    except Exception as e:
        print(f"Error generating migration: {e}")
        sys.exit(1)