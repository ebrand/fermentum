  Raw Materials Categories

  1. Grains & Malts

  - Base Malts: 2-row, 6-row, Pilsner, Pale
  - Specialty Malts: Crystal, Chocolate, Roasted Barley, Munich
  - Adjuncts: Rice, Corn, Wheat, Oats

  Tracking Requirements:
  - Purchase date, expiration (12-18 months)
  - Moisture content, protein levels
  - Supplier lot numbers
  - Storage conditions (dry, temperature controlled)

  2. Hops

  - Varieties: Cascade, Centennial, Mosaic, Citra, etc.
  - Forms: Pellets, whole leaf, extract
  - Alpha acid content (degrades over time)

  Tracking Requirements:
  - Purchase date, alpha acid analysis date
  - Storage temperature (freezer for pellets)
  - Usage by alpha acid units (AAU)

  3. Yeast

  - Types: Ale, Lager, Wild, Brett
  - Forms: Liquid, dry, slurry
  - Viability tracking (expires quickly)

  4. Water Treatment

  - Gypsum, Calcium Chloride, Phosphoric Acid
  - Water filtration media

  5. Cleaning & Sanitizing

  - Caustic (NaOH), Acid cleaners
  - Sanitizers (Star-San, Iodophor)
  - CIP chemicals

  6. Packaging Materials

  - Bottles, Cans, Kegs
  - Labels, Caps, Can ends
  - Cases, 6-pack carriers

  7. Processing Aids

  - Finings (Irish Moss, Gelatin)
  - Enzymes, Nutrients
  - CO2, Nitrogen

  "In-Motion" Processes to Track

  Active Production

  -- Example batch tracking
  Batches:
  - Batch ID, Recipe ID
  - Start date, expected completion
  - Current stage (mash, boil, ferment, condition)
  - Tank assignments
  - Temperature/gravity readings
  - QC test results

  Inventory Alerts System

  - Low stock warnings (< minimum threshold)
  - Expiration alerts (30/60/90 days out)
  - Quality degradation (hop alpha acids, yeast viability)
  - Automatic reorder triggers

  Quality Control Pipeline

  - Raw material testing (incoming inspection)
  - In-process testing (gravity, pH, IBU)
  - Finished product testing (alcohol, microbiological)
  - Certificate of analysis tracking

  Tank & Equipment Status

  - Fermentation tanks: In use, cleaning, available
  - Bright tanks: Conditioning, ready to package
  - Cleaning cycles: CIP schedules, sanitization status
  - Equipment maintenance: PM schedules, calibration due

  Packaging Operations

  - Active packaging runs: Product, quantity, quality checks
  - Label inventory: Design versions, quantity on hand
  - Finished goods: Cases produced, warehouse location
  - Distribution planning: Orders, shipping schedules

  System Architecture Recommendations

  Inventory Management Tables

  -- Raw Materials
  RawMaterials (ID, Name, Category, StorageRequirements)
  Inventory (MaterialID, LotNumber, PurchaseDate, ExpirationDate,
            Quantity, UnitCost, SupplierID, QualitySpecs)
  InventoryTransactions (ID, MaterialID, LotNumber, TransactionType,
                        Quantity, BatchID, Timestamp)

  -- Usage Tracking
  RecipeIngredients (RecipeID, MaterialID, Quantity, Stage)
  BatchIngredientUsage (BatchID, MaterialID, LotNumber,
                       QuantityUsed, ActualSpecs)

  Process Monitoring

  -- Active Batches
  Batches (ID, RecipeID, BatchNumber, StartDate, CurrentStage,
           TankID, ExpectedCompletionDate, Status)
  BatchStages (BatchID, Stage, StartTime, EndTime, Temperature,
              Gravity, pH, Notes)
  QualityTests (ID, BatchID, TestType, TestDate, Results, PassFail)

  -- Equipment Status
  Tanks (ID, Type, Capacity, CurrentBatch, Status, LastCleaned)
  EquipmentMaintenance (TankID, MaintenanceType, ScheduledDate,
                       CompletedDate, NextDue)

  Automated Monitoring Processes

  1. Daily Inventory Checks
    - Stock level alerts
    - Expiration warnings
    - Quality degradation calculations
  2. Batch Progress Tracking
    - Stage completion monitoring
    - Temperature/time compliance
    - Quality checkpoint enforcement
  3. Procurement Automation
    - Lead time calculations
    - Seasonal demand forecasting
    - Vendor performance tracking
  4. Compliance Monitoring
    - TTB reporting requirements
    - HACCP critical control points
    - Allergen tracking and labeling

  Dashboard Metrics

  - Inventory turnover by material category
  - Cost per barrel trending
  - Batch efficiency (yield, time to completion)
  - Quality metrics (defect rates, rework)
  - Equipment utilization (tank occupancy rates)

  This creates a comprehensive view of brewery operations from raw materials through finished products, with automated monitoring to catch issues before they
  become problems.
