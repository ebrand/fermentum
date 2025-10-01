Recipe Example: American IPA Recipe

  Basic Recipe Information

  {
    "recipeId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Cascade Single Hop IPA",
    "style": "American IPA",
    "description": "A showcase IPA featuring Cascade hops with citrusy, floral notes",
    "batchSize": 5.0,
    "batchSizeUnit": "gallons",
    "efficiency": 75,
    "targetABV": 6.2,
    "targetIBU": 65,
    "targetSRM": 8,
    "boilTime": 60,
    "fermentationTemp": 66,
    "fermentationTempUnit": "°F",
    "fermentationDays": 14
  }

  Grain Bill (Malts)

  "grains": [
    {
      "materialId": "grain-001",
      "name": "Pale 2-Row Malt",
      "amount": 10.0,
      "unit": "lbs",
      "percentage": 83.3,
      "lovibond": 2.0,
      "extractPotential": 1.037
    },
    {
      "materialId": "grain-002",
      "name": "Crystal 60L",
      "amount": 1.5,
      "unit": "lbs",
      "percentage": 12.5,
      "lovibond": 60.0,
      "extractPotential": 1.035
    },
    {
      "materialId": "grain-003",
      "name": "Munich Malt",
      "amount": 0.5,
      "unit": "lbs",
      "percentage": 4.2,
      "lovibond": 9.0,
      "extractPotential": 1.037
    }
  ]

  Hop Schedule

  "hops": [
    {
      "materialId": "hop-001",
      "name": "Cascade",
      "amount": 1.0,
      "unit": "oz",
      "alphaAcid": 5.5,
      "additionTime": 60,
      "additionType": "boil",
      "purpose": "bittering",
      "ibuContribution": 28.5
    },
    {
      "materialId": "hop-001",
      "name": "Cascade",
      "amount": 1.0,
      "unit": "oz",
      "alphaAcid": 5.5,
      "additionTime": 15,
      "additionType": "boil",
      "purpose": "flavor",
      "ibuContribution": 18.2
    },
    {
      "materialId": "hop-001",
      "name": "Cascade",
      "amount": 1.0,
      "unit": "oz",
      "alphaAcid": 5.5,
      "additionTime": 0,
      "additionType": "boil",
      "purpose": "aroma",
      "ibuContribution": 4.1
    },
    {
      "materialId": "hop-001",
      "name": "Cascade",
      "amount": 1.5,
      "unit": "oz",
      "alphaAcid": 5.5,
      "additionTime": 3,
      "additionType": "dry_hop",
      "purpose": "aroma",
      "ibuContribution": 0
    }
  ]

  Yeast & Fermentation

  "yeast": {
    "materialId": "yeast-001",
    "name": "Safale US-05",
    "type": "dry",
    "amount": 1,
    "unit": "package",
    "attenuation": 81,
    "temperature": {
      "min": 59,
      "max": 75,
      "optimal": 66,
      "unit": "°F"
    }
  }

  Water Profile

  "waterProfile": {
    "targetProfile": "Burton-on-Trent",
    "volume": 7.5,
    "unit": "gallons",
    "minerals": {
      "calcium": 295,
      "magnesium": 45,
      "sodium": 55,
      "sulfate": 725,
      "chloride": 25,
      "bicarbonate": 300
    }
  }

  Mash Schedule

  "mashSchedule": [
    {
      "step": 1,
      "name": "Protein Rest",
      "temperature": 122,
      "temperatureUnit": "°F",
      "duration": 15,
      "durationUnit": "minutes"
    },
    {
      "step": 2,
      "name": "Saccharification",
      "temperature": 152,
      "temperatureUnit": "°F",
      "duration": 60,
      "durationUnit": "minutes"
    },
    {
      "step": 3,
      "name": "Mash Out",
      "temperature": 168,
      "temperatureUnit": "°F",
      "duration": 10,
      "durationUnit": "minutes"
    }
  ]

  Process Notes

  "processNotes": {
    "brewingNotes": "Strike water at 165°F for 152°F mash temp. Sparge with 170°F water.",
    "fermentationNotes": "Ferment at 66°F for 10-14 days. Dry hop on day 10 for 3 days.",
    "packagingNotes": "Target 2.4 volumes CO2. Bottle condition or keg at 38°F.",
    "tastingNotes": "Bright citrus aroma, balanced malt backbone, clean finish"
  }

  This recipe structure would integrate with the raw materials system we just built, where each materialId references items in the RawMaterial table. The recipe
  system would:

  1. Link to inventory - Check available quantities of each ingredient
  2. Calculate costs - Use costPerUnit from raw materials for batch costing
  3. Scale recipes - Adjust quantities for different batch sizes
  4. Track usage - Create inventory transactions when brewing
  5. Version control - Maintain recipe history and iterations
