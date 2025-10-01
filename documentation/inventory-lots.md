 # What is a Lot?

  A lot (also called a batch in purchasing context) is a specific shipment or production run of an ingredient received at a specific time. Each lot gets a unique
  identifier (like "LOT-2024-0042").

  Example:
  - January 15: You receive 50 lbs of Pilsner Malt → Lot A (LOT-2024-0001)
  - March 3: You receive another 50 lbs of Pilsner Malt → Lot B (LOT-2024-0042)

  Even though both are "Pilsner Malt from the same supplier," they are different lots because they came from different shipments.

  Why Lots Matter: The Critical Reasons

  1. Quality Consistency & Variability

  Natural variation exists between lots:
  - Grain: Different harvest years, storage conditions, moisture content
    - Lot A might be 2023 harvest with 1.037 extract potential
    - Lot B might be 2024 harvest with 1.039 extract potential
    - Using different lots = different final gravity and ABV
  - Hops: Alpha acid content varies significantly
    - Lot A: Cascade hops with 6.2% alpha acid
    - Lot B: Cascade hops with 7.8% alpha acid
    - 26% difference in bittering power! Your IBU calculations will be wrong if you don't track which lot you used
  - Yeast: Viability degrades over time
    - Lot A received 2 months ago: 85% viable cells
    - Lot B received last week: 98% viable cells
    - Different starter sizes needed, different fermentation performance

  Real-world impact:
  "Why does Batch #47 taste different from Batch #42 when we used the same recipe?"

  Answer: Batch #42 used Lot A hops (6.2% AA), Batch #47 used Lot B hops (7.8% AA). The beer is more bitter because you didn't adjust for the different alpha acid
   percentage.

  2. Product Recalls & Food Safety

  This is the most legally critical reason for lot tracking.

  Scenario:
  Your supplier discovers contamination in a specific production run of Munich Malt. They issue a recall for:
  - Lot #: SUPPLIER-2024-Q2-447
  - Shipped between April 15-20, 2024

  Without lot tracking:
  - ❌ You have no idea which of your batches used that contaminated malt
  - ❌ You might need to recall ALL beer produced in that timeframe (expensive!)
  - ❌ You can't prove to regulators which batches were safe

  With lot tracking:
  - ✅ Query database: "Which brew sessions used Lot SUPPLIER-2024-Q2-447?"
  - ✅ Result: Only Batches #38, #39, and #41 used that lot
  - ✅ Surgical recall: Only pull those 3 batches from market
  - ✅ Prove to regulators that Batches #40, #42-50 are safe

  FDA/TTB Requirement:
  For commercial breweries, lot tracking is often legally required for traceability in case of recalls.

  3. Cost Accounting Accuracy

  Ingredient prices change over time, and you want to know the actual cost of each batch.

  Example:
  - January: Buy Pilsner Malt at $1.50/lb → Lot A
  - April: Buy Pilsner Malt at $1.85/lb → Lot B (23% price increase!)

  When you brew Batch #50 in May:
  If you use 8.5 lbs from Lot B:
  - Actual cost: 8.5 × $1.85 = $15.73

  If you use 8.5 lbs from Lot A:
  - Actual cost: 8.5 × $1.50 = $12.75

  $3 difference per batch matters when calculating margins!

  Multi-lot scenario:
  Recipe needs 10 lbs of Pilsner Malt:
  - Use 6 lbs from Lot A (@$1.50) = $9.00
  - Use 4 lbs from Lot B (@$1.85) = $7.40
  - Actual batch cost: $16.40

  Without lot tracking, you'd just use the average or most recent price, giving inaccurate cost data.

  4. Shelf Life & Freshness Management (FIFO)

  Different lots have different expiration dates.

  Scenario:
  You have two lots of dry yeast:
  - Lot A: Received Jan 1, Expires July 1 (6 months away)
  - Lot B: Received April 1, Expires Oct 1 (9 months away)

  Proper lot tracking enables FIFO (First In, First Out):
  - Always use Lot A first (it expires sooner)
  - Track which lot each batch uses
  - Get alerts: "Lot A expires in 30 days - you have 12 packages left"

  Without lot tracking:
  You might accidentally use Lot B first, and Lot A expires unused → $120 waste

  5. Quality Root Cause Analysis

  Problem Scenario:
  Customers report "off-flavors" in your IPA, but only some bottles are affected.

  With lot tracking, you can investigate:

  -- Find all batches with customer complaints
  SELECT bs.BatchNumber, bs.BrewDate,
         rg.LotNumber as grain_lot,
         rh.LotNumber as hop_lot,
         ry.LotNumber as yeast_lot
  FROM RecipeBrewSession bs
  JOIN BrewSessionIngredients rg ON bs.BrewSessionId = rg.BrewSessionId
  WHERE bs.BatchNumber IN ('IPA-2024-088', 'IPA-2024-089', 'IPA-2024-092')

  Discovery:
  - All complained batches used Yeast Lot #2024-0157
  - Batches without complaints used different yeast lots
  - Root cause found: That yeast lot had a wild yeast contamination

  Result:
  - Pull all remaining batches made with Lot #2024-0157
  - Contact supplier for replacement/refund
  - Prevent future issues

  Without lot tracking:
  You'd have no idea which yeast was the problem → blame the recipe, the brewer, the equipment, etc.

  6. Supplier Quality Comparison

  Track performance differences between suppliers or between lots from the same supplier.

  Example:
  -- Compare yeast performance across lots
  SELECT
    y.Manufacturer,
    si.LotNumber,
    AVG(bs.ActualAttenuation) as avg_attenuation,
    AVG(bs.FermentationDays) as avg_ferment_time,
    COUNT(*) as batches_brewed
  FROM RecipeBrewSession bs
  JOIN BrewSessionYeast bsy ON bs.BrewSessionId = bsy.BrewSessionId
  JOIN StockInventory si ON bsy.LotNumber = si.LotNumber
  JOIN Yeast y ON si.YeastId = y.YeastId
  WHERE y.Name = 'US-05'
  GROUP BY y.Manufacturer, si.LotNumber

  Results might show:
  - Supplier A's Lot #123: 78% attenuation, 7 days
  - Supplier A's Lot #456: 82% attenuation, 5 days  ← Better performance!
  - Supplier B's lots: 76% attenuation, 8 days

  Business decision: Prefer Supplier A, and specifically request production runs similar to Lot #456.

  Why Split-Lot Tracking Matters

  When a recipe needs more than one lot can provide, you need to track all lots used.

  Real scenario:
  Recipe needs 12 lbs of Cascade hops:
  - Lot A has 8 lbs available (7.2% alpha acid)
  - Lot B has 10 lbs available (6.8% alpha acid)

  You must use BOTH lots:
  - Take 8 lbs from Lot A
  - Take 4 lbs from Lot B

  Why this matters:

  1. Accurate IBU calculation:
    - 8 lbs @ 7.2% AA + 4 lbs @ 6.8% AA
    - Weighted average: 7.07% AA (not 7.0%!)
    - Affects final bitterness calculation
  2. Cost accounting:
    - Lot A: 8 lbs × $3.20/lb = $25.60
    - Lot B: 4 lbs × $2.95/lb = $11.80
    - Total: $37.40 (not $38.40 if you used average price)
  3. Traceability:
    - If Lot A is recalled, you know this batch used it (partially)
    - If Lot B produces off-flavors, you know this batch might be affected
  4. Quality correlation:
    - Later analysis: "Batches using Lot A hops score higher in taste tests"
    - This batch used 67% Lot A, 33% Lot B

  Database Implementation

  This is why we have StockInventory.LotNumber and need junction tables:

  -- Track which lots were used in each brew session
  CREATE TABLE BrewSessionIngredientLot (
    BrewSessionId UUID,
    StockInventoryId UUID,  -- Links to specific lot
    IngredientType VARCHAR(20), -- 'grain', 'hop', 'yeast', 'additive'
    AmountUsed DECIMAL(8,3),
    CostActual DECIMAL(10,2),
    -- Capture critical lot characteristics at time of use
    AlphaAcid DECIMAL(4,2),  -- For hops
    ExtractPotential DECIMAL(5,3),  -- For grains
    Viability DECIMAL(5,2)  -- For yeast
  );

  The Bottom Line

  Lot tracking transforms inventory from "we have 50 lbs of something" to:
  - "We have 30 lbs from Lot A (harvested 2023, 6.2% AA, expires June) at $3.20/lb"
  - "We have 20 lbs from Lot B (harvested 2024, 7.8% AA, expires December) at $2.95/lb"

  This enables:
  - ✅ Precise recipe calculations
  - ✅ Accurate cost accounting
  - ✅ Quality troubleshooting
  - ✅ Regulatory compliance
  - ✅ Waste reduction (FIFO)
  - ✅ Supplier management

  Without lot tracking:
  - ❌ "Why does this batch taste different?"
  - ❌ "How much did this batch actually cost?"
  - ❌ "Which batches need to be recalled?"
  - ❌ "Why did we throw away $500 of expired yeast?"

  For a production brewery, lot tracking isn't optional—it's essential business intelligence.


# So, whenever possible, it makes sens to run a batch from the raw materials in the same lot, by type. Using hops from two different lots can cause ambiguity in the underlying formulae.

⏺ Exactly right! You've identified a key principle in production management:

  Lot Consistency = Formula Reliability

  The Core Problem with Multi-Lot Usage

  When you split ingredients across lots, you introduce compositional variability that complicates your calculations and creates ambiguity in your formulas.

  Example: Hop Alpha Acid Calculation

  Single Lot (Clean & Simple):
  Recipe calls for: 2 oz Cascade hops
  Lot A specs: 7.2% alpha acid

  IBU Calculation:
  = (2 oz × 7.2% AA × utilization factor) / batch size
  = Clear, unambiguous calculation

  Multi-Lot (Messy & Ambiguous):
  Recipe calls for: 2 oz Cascade hops
  Lot A: 1.3 oz @ 7.2% AA
  Lot B: 0.7 oz @ 6.8% AA

  IBU Calculation requires weighted average:
  = (1.3 oz × 7.2% + 0.7 oz × 6.8%) / 2 oz
  = (9.36 + 4.76) / 2
  = 7.06% weighted average AA

  Then: (2 oz × 7.06% AA × utilization) / batch size

  The ambiguity:
  - Did you calculate the weighted average correctly?
  - Did you document which calculation method you used?
  - Can someone reproduce this batch accurately?
  - What if the brewer mixed them unevenly?

  When Single-Lot Usage Matters Most

  1. High-Impact Ingredients (Hops & Yeast)

  Hops:
  - Alpha acid can vary 15-30% between lots
  - Directly affects bitterness calculations
  - Best practice: Never split hop additions across lots
    - If recipe needs 3 oz for 60-min addition, use 3 oz from ONE lot
    - If you must split, treat each lot as a separate hop addition in your calculation

  Yeast:
  - Viability varies significantly with age
  - Attenuation characteristics can differ between production runs
  - Best practice: Single lot per batch
    - If Lot A has 8 packages but you need 10, order more of Lot A or use entirely Lot B
    - Don't pitch 8 packages from Lot A + 2 from Lot B

  2. Small Quantity, High Impact

  Ingredients where small amounts make big differences:
  - Water treatment salts: Exact mineral content matters for pH
  - Clarifying agents: Dosage precision is critical
  - Specialty grains: Color contributions need accuracy

  Best practice: Complete these additions from single lots whenever possible.

  When Multi-Lot Usage is Acceptable

  1. Base Malts (Lower Impact)

  Base malts like Pilsner or Pale Ale malt have relatively consistent characteristics:
  - Extract potential varies only 2-5% between lots
  - Impact on OG is minimal and calculable
  - Large quantities used (makes blending more homogeneous)

  Example:
  Recipe needs: 12 lbs Pilsner Malt
  Lot A: 8 lbs @ 1.037 extract potential
  Lot B: 4 lbs @ 1.038 extract potential

  Weighted average: (8×1.037 + 4×1.038) / 12 = 1.0373
  Impact on 5-gallon batch OG: ~0.001 difference (negligible)

  2. When You Track Weighted Characteristics

  If your system automatically calculates weighted averages and stores them with the brew session, multi-lot usage becomes safer:

  -- Record exactly what was used
  BrewSessionIngredient:
    Ingredient: Cascade Hops
    Purpose: 60-min Bittering Addition
    Total Amount: 2 oz

    Lot A: 1.3 oz @ 7.2% AA
    Lot B: 0.7 oz @ 6.8% AA
    Calculated Weighted AA: 7.06%
    Calculated IBU Contribution: 42.3 IBU

  This works ONLY if:
  - System calculates and stores weighted averages automatically
  - No manual calculation errors possible
  - Full traceability maintained

  Inventory Management Strategy

  Smart lot management prevents multi-lot scenarios:

  1. Strategic Ordering:
  Upcoming brew schedule needs 6 oz Cascade hops total
  Current inventory:
  - Lot A: 4 oz remaining
  - Lot B: 10 oz

  GOOD: Order more Lot A or use only Lot B
  BAD: Split across both lots

  2. Recipe Scheduling:
  You have:
  - Lot A Cascade: 3 oz (7.2% AA)
  - Lot B Cascade: 8 oz (6.8% AA)

  GOOD scheduling:
  - Brew Recipe X (needs 2.5 oz) using Lot A
  - Brew Recipe Y (needs 3 oz) using Lot B

  BAD scheduling:
  - Brew Recipe Z (needs 5 oz) splitting across lots

  3. Lot Depletion Planning:
  When a lot gets low, schedule recipes that will:
  - Fully deplete the lot
  - Avoid splitting across lots
  - Maintain formula integrity

  System Design Implications

  For Fermentum, this suggests:

  1. Lot Recommendation Engine
  When planning a brew session, the system should:
  ✅ "You can brew this recipe entirely from Lot A (recommended)"
  ⚠️  "Warning: This will require splitting Cascade hops across 2 lots"
      "Suggestion: Use Lot B entirely and save Lot A for smaller batches"

  2. Lot-Aware Recipe Feasibility
  Recipe feasibility check should consider:
  - Can each ingredient come from a single lot? (Green flag)
  - Will any ingredient require multi-lot? (Yellow flag)
  - Critical ingredients requiring multi-lot? (Red flag - don't brew)

  3. Formula Clarity Warnings
  When saving a brew session with multi-lot ingredients:
  ⚠️  "You used 2 lots of Cascade hops"
      "Weighted alpha acid: 7.06% (Auto-calculated)"
      "IBU calculation adjusted automatically"
      "Document reason for multi-lot usage: _______"

  4. Ingredient Addition Tracking
  Structure brew session ingredient records as:
  - RecipeIngredient (what recipe calls for)
    └─ BrewSessionIngredient (what was actually used)
        ├─ Lot A: 1.3 oz @ 7.2% AA
        └─ Lot B: 0.7 oz @ 6.8% AA
        Calculated: 7.06% weighted AA

  The Bottom Line

  Your insight is correct:
  - Prefer single-lot usage for formula clarity and reproducibility
  - High-impact ingredients (hops, yeast) should virtually always be single-lot
  - Multi-lot usage introduces ambiguity that requires careful calculation and documentation
  - Smart inventory management can minimize multi-lot scenarios
  - System design should encourage single-lot usage and clearly flag when multi-lot is necessary

  Business Rule:
  "Every ingredient addition in a recipe should come from a single lot whenever possible. Multi-lot usage requires weighted characteristic calculations, explicit
  documentation, and approval."

  This keeps your formulas clean, your batches reproducible, and your quality consistent.


# Great, what creative ways can we think of to incorporate stock into the recipe system?

Looking at your Recipe system and Stock/StockInventory system, here are some creative ways to integrate them:

  1. Real-Time Inventory Availability During Recipe Creation/Editing

  - When adding ingredients to a recipe, show live stock availability next to each ingredient
  - Visual indicators: Green (in stock), Yellow (low stock), Red (out of stock)
  - Display: "12.5 lbs available" or "Only 3 packages left" next to ingredient selection
  - Prevent recipe publishing if required ingredients are out of stock

  2. Smart Ingredient Substitution Suggestions

  - When an ingredient is out of stock or low, suggest alternatives from available inventory
  - Example: "Cascade hops unavailable - suggest Centennial (8 oz available) or Columbus (5 oz available)"
  - Calculate impact on recipe characteristics (IBU, color, flavor profile)
  - One-click substitution with automatic recipe calculation updates

  3. Batch Size Optimization Based on Inventory

  - Analyze current stock levels and suggest optimal batch size
  - "You can brew 2.5 batches with current inventory" or "Increase to 7 gallon batch to fully utilize available Pilsner Malt"
  - Show cost savings from maximizing ingredient utilization
  - Alert when inventory can't support desired batch size

  4. Automated Shopping Lists from Recipe Planning

  - Generate purchase orders directly from recipes
  - Calculate needed quantities: Current stock vs. recipe requirements
  - Group by supplier, include current pricing from Stock records
  - Track reorder levels and suggest bulk purchasing opportunities

  5. Cost Tracking with Live Inventory Pricing

  - Use actual StockInventory.UnitCostActual (not just Stock.UnitCost) for precise costing
  - Show cost variance: "Recipe estimated $45, actual cost $52.30 due to price changes"
  - Track cost trends over time as ingredient prices fluctuate
  - Calculate margin impact for commercial brewers

  6. Lot Tracking and Traceability

  - Link specific StockInventory lots to RecipeBrewSession
  - Full traceability: "This batch used Lot #2024-0042 of Pilsner Malt"
  - Quality correlation: Track which ingredient lots produced best results
  - Recall capability: Identify all batches using a specific lot

  7. Inventory Reservation System

  - When scheduling a brew session, reserve required ingredients
  - Update StockInventory.QuantityReserved automatically
  - Prevent double-booking ingredients across multiple planned batches
  - Release reservations if brew session is cancelled

  8. Predictive Inventory Management

  - Analyze recipe portfolio and brewing frequency
  - Predict when ingredients will run out based on usage patterns
  - Suggest recipes you can still brew with current inventory
  - Alert: "Based on your brewing schedule, you'll need more hops in 2 weeks"

  9. Recipe Cost Analysis Dashboard

  - Compare estimated vs actual costs across all brew sessions
  - Identify most/least cost-effective recipes
  - Track ingredient price volatility and impact on margins
  - Suggest recipe modifications to reduce costs

  10. Expiration Date Management

  - Alert when recipe uses ingredients nearing expiration (StockInventory.ExpirationDate)
  - Prioritize FIFO (First In, First Out) inventory usage
  - Suggest recipes that use expiring ingredients
  - Prevent waste with "Use Soon" recipe recommendations

  11. Multi-Lot Ingredient Allocation

  - When a recipe needs more than one lot can provide, automatically split across lots
  - Track multiple lot numbers in brew session
  - Blend lots intelligently (e.g., averaging alpha acid percentages for hops)
  - Document lot combinations for quality control

  12. Inventory Impact Visualization

  - Show before/after inventory levels when planning batches
  - Visual timeline: "If you brew these 3 recipes this week, here's your projected inventory"
  - Identify bottleneck ingredients across recipe portfolio
  - Suggest brew order to optimize inventory flow

  13. Recipe Feasibility Scoring

  - Score recipes 0-100 based on current inventory availability
  - Factors: Ingredient availability, lot freshness, cost efficiency
  - Filter recipes by "Can Brew Now" vs "Need to Order"
  - Prioritize recipes with expiring ingredients

  14. Supplier Performance Tracking

  - Link Stock.Supplier to actual brewing outcomes
  - Track quality metrics by supplier and lot
  - Compare supplier pricing trends
  - Identify best suppliers for specific ingredients

  15. Recipe Scaling with Inventory Constraints

  - Automatically adjust batch size based on limiting ingredient
  - "You have enough of everything except yeast - suggest 4.2 gallon batch instead of 5 gallon"
  - Proportional scaling with minimum viable batch size constraints
  - Preserve recipe ratios while optimizing inventory usage

  Most Impactful Quick Wins:

  Priority 1: Inventory Availability in Recipe Editor
  - Add availableQuantity field to ingredient selection dropdowns
  - Real-time stock checks when adding ingredients
  - Visual availability indicators

  Priority 2: Batch Feasibility Check
  - Button: "Check Inventory Availability"
  - Shows what's available, what's needed, what's missing
  - Generates shopping list for missing items

  Priority 3: Lot Tracking in Brew Sessions
  - Add LotNumber references to RecipeBrewSession
  - Create junction table linking brew sessions to specific inventory lots
  - Track full ingredient traceability

  These integrations would transform the recipe system from a planning tool into a complete production management system with real-time inventory awareness.

  # Fermentum Lot Integration

    1. Lot Recommendation Engine
  When planning a brew session, the system should:
  ✅ "You can brew this recipe entirely from Lot A (recommended)"
  ⚠️  "Warning: This will require splitting Cascade hops across 2 lots"
      "Suggestion: Use Lot B entirely and save Lot A for smaller batches"

  2. Lot-Aware Recipe Feasibility
  Recipe feasibility check should consider:
  - Can each ingredient come from a single lot? (Green flag)
  - Will any ingredient require multi-lot? (Yellow flag)
  - Critical ingredients requiring multi-lot? (Red flag - don't brew)

  3. Formula Clarity Warnings
  When saving a brew session with multi-lot ingredients:
  ⚠️  "You used 2 lots of Cascade hops"
      "Weighted alpha acid: 7.06% (Auto-calculated)"
      "IBU calculation adjusted automatically"
      "Document reason for multi-lot usage: _______"

  4. Ingredient Addition Tracking
  Structure brew session ingredient records as:
  - RecipeIngredient (what recipe calls for)
    └─ BrewSessionIngredient (what was actually used)
        ├─ Lot A: 1.3 oz @ 7.2% AA
        └─ Lot B: 0.7 oz @ 6.8% AA
        Calculated: 7.06% weighted AA