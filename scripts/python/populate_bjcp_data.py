#!/usr/bin/env python3
"""
Populate BJCP database tables with data from bjcp2.json
This script processes the BeerJSON format and populates all related tables.
"""

import json
import sys
import os
import psycopg2
import re
from decimal import Decimal, InvalidOperation
from datetime import datetime
import uuid

def safe_decimal(value, max_digits=6, decimal_places=3):
    """Safely convert a value to decimal with proper formatting."""
    if not value:
        return None
    try:
        return Decimal(str(value)).quantize(Decimal('0.' + '0' * decimal_places))
    except (ValueError, InvalidOperation, TypeError):
        return None

def safe_gravity(value):
    """Safely convert gravity values, handling both decimal and integer formats."""
    if not value:
        return None
    try:
        float_val = float(value)
        # If value is > 2.0, it's likely in integer format (e.g., 1055 = 1.055)
        if float_val > 2.0:
            float_val = float_val / 1000.0
        return Decimal(str(float_val)).quantize(Decimal('0.001'))
    except (ValueError, InvalidOperation, TypeError):
        return None

def safe_int(value):
    """Safely convert a value to integer."""
    if not value:
        return None
    try:
        return int(float(str(value)))
    except (ValueError, TypeError):
        return None

def extract_tags(tags_string):
    """Extract individual tags from comma-separated string."""
    if not tags_string:
        return []
    return [tag.strip() for tag in tags_string.split(',') if tag.strip()]

def categorize_tag(tag_name):
    """Categorize a tag based on its content."""
    tag_lower = tag_name.lower()

    if any(word in tag_lower for word in ['session', 'standard', 'high', 'very-high']):
        return 'strength'
    elif any(word in tag_lower for word in ['pale', 'amber', 'dark', 'black', 'color']):
        return 'color'
    elif any(word in tag_lower for word in ['bottom-fermented', 'top-fermented', 'lagered', 'ale', 'lager']):
        return 'fermentation'
    elif any(word in tag_lower for word in ['north-america', 'europe', 'british', 'german', 'belgian']):
        return 'origin'
    elif any(word in tag_lower for word in ['hoppy', 'malty', 'bitter', 'sweet', 'roasty', 'fruity']):
        return 'flavor-profile'
    elif any(word in tag_lower for word in ['traditional', 'specialty', 'historical']):
        return 'style-type'
    else:
        return 'other'

def extract_commercial_examples(examples_string):
    """Extract individual commercial examples from comma-separated string."""
    if not examples_string:
        return []

    # Split by comma and clean up each example
    examples = []
    for example in examples_string.split(','):
        example = example.strip()
        if example:
            examples.append(example)
    return examples

def parse_style_comparisons(comparison_text, current_style_name):
    """Parse style comparison text to extract referenced styles."""
    if not comparison_text:
        return []

    # Common patterns for style references in BJCP text
    style_patterns = [
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+[A-Z][a-z]+)*)\b',  # Capitalized style names
        r'\b\d+[A-Z]\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',  # BJCP style numbers
    ]

    comparisons = []
    words = comparison_text.split()

    # Look for comparison keywords and extract context
    comparison_keywords = ['than', 'like', 'similar', 'compared', 'versus', 'less', 'more']

    for i, word in enumerate(words):
        if word.lower() in comparison_keywords and i > 0 and i < len(words) - 1:
            # Extract potential style name before or after comparison word
            context = ' '.join(words[max(0, i-3):min(len(words), i+4)])
            comparisons.append({
                'text': context,
                'relationship': word.lower(),
                'type': 'comparison'
            })

    return comparisons

def populate_database(json_file_path, db_config):
    """Main function to populate all BJCP tables."""

    # Read BJCP data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    styles = data['beerjson']['styles']
    print(f"Processing {len(styles)} beer styles...")

    # Connect to database
    conn = psycopg2.connect(**db_config)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # Start transaction
        cur.execute("BEGIN;")

        # Clear existing data (in reverse dependency order)
        print("Clearing existing BJCP data...")
        clear_tables = [
            "BJCP_StyleTagMapping", "BJCP_StyleCharacteristics", "BJCP_CommercialExample",
            "BJCP_StyleComparison", "BJCP_StyleRecommendation", "BJCP_RecipeStyleMatch",
            "BJCP_StyleJudging", "BJCP_RecipeCompetitionEntry", "BJCP_StylePopularity",
            "BJCP_StyleAnalytics", "BJCP_StyleTag", "BJCP_BeerCategory"
        ]

        for table in clear_tables:
            try:
                cur.execute(f'DELETE FROM "{table}";')
                print(f"  Cleared {table}")
            except psycopg2.Error as e:
                print(f"  Warning: Could not clear {table}: {e}")

        # ============================================================================
        # 1. POPULATE BEER CATEGORIES
        # ============================================================================
        print("\n1. Populating BJCP_BeerCategory table...")

        categories = {}
        for style in styles:
            cat_num = style.get('category_id', '')
            cat_name = style.get('category', '')
            cat_desc = style.get('category_description', '')

            if cat_num and cat_name and cat_num not in categories:
                categories[cat_num] = {
                    'name': cat_name,
                    'description': cat_desc,
                    'id': str(uuid.uuid4())
                }

        # Sort categories numerically (handle 'X' category)
        def sort_key(cat_num):
            if cat_num == 'X':
                return 999
            try:
                return int(cat_num)
            except:
                return 998

        sorted_categories = sorted(categories.items(), key=lambda x: sort_key(x[0]))

        for i, (cat_num, cat_data) in enumerate(sorted_categories):
            cur.execute("""
                INSERT INTO "BJCP_BeerCategory"
                ("CategoryId", "CategoryNumber", "CategoryName", "Description", "SortOrder")
                VALUES (%s, %s, %s, %s, %s)
            """, (cat_data['id'], cat_num, cat_data['name'], cat_data['description'], i + 1))

        print(f"  Inserted {len(categories)} categories")

        # ============================================================================
        # 2. POPULATE STYLE TAGS
        # ============================================================================
        print("\n2. Populating BJCP_StyleTag table...")

        all_tags = set()
        for style in styles:
            tags = extract_tags(style.get('tags', ''))
            all_tags.update(tags)

        tag_ids = {}
        for i, tag in enumerate(sorted(all_tags)):
            tag_id = str(uuid.uuid4())
            category = categorize_tag(tag)

            cur.execute("""
                INSERT INTO "BJCP_StyleTag"
                ("TagId", "TagName", "Category", "SortOrder")
                VALUES (%s, %s, %s, %s)
            """, (tag_id, tag, category, i + 1))

            tag_ids[tag] = tag_id

        print(f"  Inserted {len(all_tags)} tags")

        # ============================================================================
        # 3. POPULATE BEER STYLES
        # ============================================================================
        print("\n3. Populating BeerStyle table...")

        style_ids = {}
        for style in styles:
            style_id = str(uuid.uuid4())
            category_id = categories.get(style.get('category_id', ''), {}).get('id')

            # Extract ranges from nested structure
            og_min = safe_gravity(style.get('original_gravity', {}).get('minimum', {}).get('value'))
            og_max = safe_gravity(style.get('original_gravity', {}).get('maximum', {}).get('value'))
            fg_min = safe_gravity(style.get('final_gravity', {}).get('minimum', {}).get('value'))
            fg_max = safe_gravity(style.get('final_gravity', {}).get('maximum', {}).get('value'))
            abv_min = safe_decimal(style.get('alcohol_by_volume', {}).get('minimum', {}).get('value'), 4, 2)
            abv_max = safe_decimal(style.get('alcohol_by_volume', {}).get('maximum', {}).get('value'), 4, 2)
            ibu_min = safe_int(style.get('international_bitterness_units', {}).get('minimum', {}).get('value'))
            ibu_max = safe_int(style.get('international_bitterness_units', {}).get('maximum', {}).get('value'))
            srm_min = safe_int(style.get('color', {}).get('minimum', {}).get('value'))
            srm_max = safe_int(style.get('color', {}).get('maximum', {}).get('value'))

            cur.execute("""
                INSERT INTO "BeerStyle" (
                    "StyleId", "BJCPNumber", "StyleName", "Category", "CategoryId", "Description",
                    "ABVMin", "ABVMax", "IBUMin", "IBUMax", "SRMMin", "SRMMax",
                    "OGMin", "OGMax", "FGMin", "FGMax",
                    "Appearance", "Aroma", "Flavor", "Mouthfeel", "Comments",
                    "History", "CharacteristicIngredients", "StyleComparison",
                    "CommercialExamples", "Created", "Updated"
                ) VALUES (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            """, (
                style_id, style.get('style_id'), style.get('name'), style.get('category'),
                category_id, style.get('overall_impression'),
                abv_min, abv_max, ibu_min, ibu_max, srm_min, srm_max,
                og_min, og_max, fg_min, fg_max,
                style.get('appearance'), style.get('aroma'), style.get('flavor'),
                style.get('mouthfeel'), style.get('comments'),
                style.get('history'), style.get('ingredients'), style.get('style_comparison'),
                style.get('examples')
            ))

            style_ids[style.get('style_id')] = style_id

        print(f"  Inserted {len(styles)} beer styles")

        # ============================================================================
        # 4. POPULATE STYLE-TAG MAPPINGS
        # ============================================================================
        print("\n4. Populating BJCP_StyleTagMapping table...")

        mapping_count = 0
        for style in styles:
            style_id = style_ids.get(style.get('style_id'))
            if not style_id:
                continue

            tags = extract_tags(style.get('tags', ''))
            for tag in tags:
                tag_id = tag_ids.get(tag)
                if tag_id:
                    cur.execute("""
                        INSERT INTO "BJCP_StyleTagMapping" ("StyleId", "TagId")
                        VALUES (%s, %s)
                    """, (style_id, tag_id))
                    mapping_count += 1

        print(f"  Inserted {mapping_count} style-tag mappings")

        # ============================================================================
        # 5. POPULATE STYLE CHARACTERISTICS
        # ============================================================================
        print("\n5. Populating BJCP_StyleCharacteristics table...")

        characteristics_count = 0
        for style in styles:
            style_id = style_ids.get(style.get('style_id'))
            if not style_id:
                continue

            # Break down characteristics by type
            char_types = [
                ('aroma', style.get('aroma')),
                ('appearance', style.get('appearance')),
                ('flavor', style.get('flavor')),
                ('mouthfeel', style.get('mouthfeel'))
            ]

            for char_type, description in char_types:
                if description:
                    # Extract keywords from description (simple approach)
                    keywords = []
                    # Look for descriptive words
                    descriptive_words = re.findall(r'\b[a-z]+(?:ly)?\b', description.lower())
                    keywords = list(set([word for word in descriptive_words if len(word) > 3]))[:10]  # Limit keywords

                    cur.execute("""
                        INSERT INTO "BJCP_StyleCharacteristics"
                        ("StyleId", "CharacteristicType", "Description", "Keywords")
                        VALUES (%s, %s, %s, %s)
                    """, (style_id, char_type, description, keywords))
                    characteristics_count += 1

        print(f"  Inserted {characteristics_count} style characteristics")

        # ============================================================================
        # 6. POPULATE COMMERCIAL EXAMPLES
        # ============================================================================
        print("\n6. Populating BJCP_CommercialExample table...")

        examples_count = 0
        for style in styles:
            style_id = style_ids.get(style.get('style_id'))
            if not style_id:
                continue

            examples = extract_commercial_examples(style.get('examples', ''))
            for example in examples:
                # Try to separate brewery and beer name
                parts = example.split(' ')
                if len(parts) > 1:
                    # Simple heuristic: last word(s) might be beer name
                    brewery_name = ' '.join(parts[:-1])
                    beer_name = parts[-1]
                else:
                    brewery_name = None
                    beer_name = example

                cur.execute("""
                    INSERT INTO "BJCP_CommercialExample"
                    ("StyleId", "BeerName", "BreweryName", "Availability")
                    VALUES (%s, %s, %s, %s)
                """, (style_id, beer_name, brewery_name, 'unknown'))
                examples_count += 1

        print(f"  Inserted {examples_count} commercial examples")

        # ============================================================================
        # 7. POPULATE STYLE JUDGING CRITERIA
        # ============================================================================
        print("\n7. Populating BJCP_StyleJudging table...")

        # Create basic BJCP judging criteria for each style
        scoring_weights = {
            "aroma": 12,
            "appearance": 3,
            "flavor": 20,
            "mouthfeel": 5,
            "overall": 10
        }

        judging_count = 0
        for style in styles:
            style_id = style_ids.get(style.get('style_id'))
            if not style_id:
                continue

            # Basic judging criteria based on BJCP standards
            criteria = {
                "scoring_system": "BJCP",
                "max_score": 50,
                "categories": scoring_weights,
                "description": f"BJCP 2021 judging criteria for {style.get('name')}"
            }

            # Extract common faults from comments if available
            common_faults = []
            comments = style.get('comments', '')
            if 'fault' in comments.lower():
                # Simple extraction of fault-related sentences
                sentences = comments.split('.')
                for sentence in sentences:
                    if 'fault' in sentence.lower():
                        common_faults.append(sentence.strip())

            cur.execute("""
                INSERT INTO "BJCP_StyleJudging"
                ("StyleId", "JudgingCriteria", "CommonFaults", "ScoringWeights")
                VALUES (%s, %s, %s, %s)
            """, (style_id, json.dumps(criteria), common_faults, json.dumps(scoring_weights)))
            judging_count += 1

        print(f"  Inserted {judging_count} style judging criteria")

        # Commit transaction
        cur.execute("COMMIT;")
        print(f"\n✅ Successfully populated all BJCP tables!")
        print(f"📊 Summary:")
        print(f"   - {len(categories)} categories")
        print(f"   - {len(all_tags)} tags")
        print(f"   - {len(styles)} beer styles")
        print(f"   - {mapping_count} tag mappings")
        print(f"   - {characteristics_count} characteristics")
        print(f"   - {examples_count} commercial examples")
        print(f"   - {judging_count} judging criteria")

    except Exception as e:
        cur.execute("ROLLBACK;")
        print(f"❌ Error populating database: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    # Database configuration
    db_config = {
        'host': 'localhost',
        'database': 'fermentum',
        'user': 'fermentum',
        'password': 'dev_password_123',
        'port': 5432
    }

    # File paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, "..", "..")
    json_file = os.path.join(project_root, "database", "bjcp2.json")

    # Verify input file exists
    if not os.path.exists(json_file):
        print(f"❌ Error: BJCP JSON file not found at {json_file}")
        sys.exit(1)

    # Populate database
    try:
        populate_database(json_file, db_config)
        print("🎉 BJCP data population completed successfully!")
    except Exception as e:
        print(f"💥 Error during population: {e}")
        sys.exit(1)