using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;
using FermentumApi.Models.BJCP;
using FermentumApi.Models.Ingredients;

namespace FermentumApi.Models
{
    // Beer Style Reference Table (BJCP Categories)
    [Table("BJCP_BeerStyle")]
    public class BJCPBeerStyle
    {
        [Key]
        public Guid StyleId { get; set; }

        [MaxLength(10)]
        public string? BJCPNumber { get; set; } // e.g., "21A", "14C"

        [Required]
        [MaxLength(100)]
        public string StyleName { get; set; } = string.Empty; // e.g., "American IPA", "Irish Stout"

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty; // e.g., "IPA", "Stout", "Lager"

        public Guid? CategoryId { get; set; } // Reference to BJCP_BeerCategory

        public string? Description { get; set; }

        // Style Guidelines
        [Column(TypeName = "decimal(4,2)")]
        public decimal? ABVMin { get; set; } // Minimum alcohol by volume

        [Column(TypeName = "decimal(4,2)")]
        public decimal? ABVMax { get; set; } // Maximum alcohol by volume

        public int? IBUMin { get; set; } // Minimum International Bitterness Units
        public int? IBUMax { get; set; } // Maximum International Bitterness Units

        public int? SRMMin { get; set; } // Minimum Standard Reference Method (color)
        public int? SRMMax { get; set; } // Maximum Standard Reference Method (color)

        [Column(TypeName = "decimal(5,3)")]
        public decimal? OGMin { get; set; } // Minimum Original Gravity (e.g., 1.045)

        [Column(TypeName = "decimal(5,3)")]
        public decimal? OGMax { get; set; } // Maximum Original Gravity

        [Column(TypeName = "decimal(5,3)")]
        public decimal? FGMin { get; set; } // Minimum Final Gravity

        [Column(TypeName = "decimal(5,3)")]
        public decimal? FGMax { get; set; } // Maximum Final Gravity

        // Style Characteristics
        public string? Appearance { get; set; }
        public string? Aroma { get; set; }
        public string? Flavor { get; set; }
        public string? Mouthfeel { get; set; }
        public string? Comments { get; set; }
        public string? History { get; set; }
        public string? CharacteristicIngredients { get; set; }
        public string? StyleComparison { get; set; }
        public string? CommercialExamples { get; set; }

        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();

        // BJCP Navigation properties
        [ForeignKey("CategoryId")]
        public virtual BJCPBeerCategory? BJCPCategory { get; set; }

        public virtual ICollection<BJCPStyleTagMapping> StyleTagMappings { get; set; } = new List<BJCPStyleTagMapping>();
        public virtual ICollection<BJCPStyleCharacteristics> StyleCharacteristics { get; set; } = new List<BJCPStyleCharacteristics>();
        public virtual ICollection<BJCPCommercialExample> BJCPCommercialExamples { get; set; } = new List<BJCPCommercialExample>();
        public virtual ICollection<BJCPStyleRecommendation> StyleRecommendations { get; set; } = new List<BJCPStyleRecommendation>();
        public virtual ICollection<BJCPRecipeStyleMatch> RecipeStyleMatches { get; set; } = new List<BJCPRecipeStyleMatch>();
        public virtual ICollection<BJCPStyleJudging> StyleJudging { get; set; } = new List<BJCPStyleJudging>();
        public virtual ICollection<BJCPRecipeCompetitionEntry> CompetitionEntries { get; set; } = new List<BJCPRecipeCompetitionEntry>();
        public virtual ICollection<BJCPStylePopularity> StylePopularities { get; set; } = new List<BJCPStylePopularity>();
        public virtual ICollection<BJCPStyleAnalytics> StyleAnalytics { get; set; } = new List<BJCPStyleAnalytics>();
    }

    // Master Recipe Table
    [Table("Recipe")]
    public class Recipe
    {
        [Key]
        public Guid RecipeId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        public Guid? StyleId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int Version { get; set; } = 1;

        public bool IsPublished { get; set; } = false;
        public bool IsActive { get; set; } = true;

        // Batch Information
        [Required]
        [Column(TypeName = "decimal(8,3)")]
        public decimal BatchSize { get; set; } // Target batch size

        [Required]
        [MaxLength(20)]
        public string BatchSizeUnit { get; set; } = "gallons"; // gallons, liters, barrels

        [Column(TypeName = "decimal(8,3)")]
        public decimal? BoilSize { get; set; } // Pre-boil volume

        public int BoilTime { get; set; } = 60; // Boil time in minutes

        [Column(TypeName = "decimal(5,2)")]
        public decimal Efficiency { get; set; } = 75.0m; // Mash efficiency percentage

        // Calculated Values (updated when recipe changes)
        [Column(TypeName = "decimal(5,3)")]
        public decimal? EstimatedOG { get; set; } // Estimated Original Gravity

        [Column(TypeName = "decimal(5,3)")]
        public decimal? EstimatedFG { get; set; } // Estimated Final Gravity

        [Column(TypeName = "decimal(4,2)")]
        public decimal? EstimatedABV { get; set; } // Estimated Alcohol by Volume

        [Column(TypeName = "decimal(5,1)")]
        public decimal? EstimatedIBU { get; set; } // Estimated International Bitterness Units

        [Column(TypeName = "decimal(5,1)")]
        public decimal? EstimatedSRM { get; set; } // Estimated Standard Reference Method (color)

        public int? EstimatedCalories { get; set; } // Calories per 12oz serving

        // Cost Information
        [Column(TypeName = "decimal(10,2)")]
        public decimal? EstimatedCostPerBatch { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal? EstimatedCostPerGallon { get; set; }

        [Column(TypeName = "decimal(6,2)")]
        public decimal? EstimatedCostPer12oz { get; set; }

        // Process Parameters
        [Column(TypeName = "decimal(5,2)")]
        public decimal? MashTemperature { get; set; } // Primary mash temperature (°F)

        public int? MashTime { get; set; } // Primary mash time (minutes)

        [Column(TypeName = "decimal(5,2)")]
        public decimal? FermentationTemperature { get; set; } // Primary fermentation temp (°F)

        public int? FermentationDays { get; set; } // Primary fermentation duration

        public int? ConditioningDays { get; set; } // Secondary/conditioning duration

        [Column(TypeName = "decimal(3,1)")]
        public decimal? CarbonationLevel { get; set; } // Target CO2 volumes

        // Water Profile
        public Guid? WaterProfileId { get; set; } // Reference to water chemistry profile

        [Column(TypeName = "decimal(8,3)")]
        public decimal? WaterVolume { get; set; } // Total water needed

        [MaxLength(20)]
        public string WaterVolumeUnit { get; set; } = "gallons";

        // Notes and Instructions
        public string? BrewingNotes { get; set; }
        public string? FermentationNotes { get; set; }
        public string? PackagingNotes { get; set; }
        public string? TastingNotes { get; set; }

        [MaxLength(100)]
        public string? Brewer { get; set; } // Recipe creator/brewer name

        [Column(TypeName = "text[]")]
        public string[]? Tags { get; set; } // Searchable tags array

        // Audit Fields
        public DateTime Created { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime Updated { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;

        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle? Style { get; set; }

        [ForeignKey("WaterProfileId")]
        public virtual WaterProfile? WaterProfile { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? UpdatedByUser { get; set; }

        public virtual ICollection<RecipeGrain> Grains { get; set; } = new List<RecipeGrain>();
        public virtual ICollection<RecipeHop> Hops { get; set; } = new List<RecipeHop>();
        public virtual ICollection<RecipeYeast> Yeasts { get; set; } = new List<RecipeYeast>();
        public virtual ICollection<RecipeAdditive> Additives { get; set; } = new List<RecipeAdditive>();
        public virtual ICollection<RecipeStep> Steps { get; set; } = new List<RecipeStep>();
        // Commented out - RecipeMashStep table doesn't exist in database, use RecipeStep instead
        // public virtual ICollection<RecipeMashStep> MashSteps { get; set; } = new List<RecipeMashStep>();
        public virtual ICollection<RecipeVersion> Versions { get; set; } = new List<RecipeVersion>();
        public virtual ICollection<RecipeBrewSession> BrewSessions { get; set; } = new List<RecipeBrewSession>();
    }

    // Recipe Grain/Malt Bill
    [Table("RecipeGrain")]
    public class RecipeGrain
    {
        [Key]
        public Guid RecipeGrainId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public Guid GrainId { get; set; }

        [Required]
        [Column(TypeName = "decimal(8,3)")]
        public decimal Amount { get; set; } // Quantity of grain

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = "lbs"; // lbs, kg, oz

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Percentage { get; set; } // Percentage of total grain bill

        public int? SortOrder { get; set; } // Order in grain bill

        // Malt Characteristics
        [Column(TypeName = "decimal(4,1)")]
        public decimal? Lovibond { get; set; } // Color rating

        [Column(TypeName = "decimal(5,3)")]
        public decimal? ExtractPotential { get; set; } // Specific gravity potential (e.g., 1.037)

        public bool MustMash { get; set; } = true; // Requires mashing vs steeping

        [Column(TypeName = "decimal(5,2)")]
        public decimal? MaxInBatch { get; set; } // Maximum percentage recommended

        // Process Instructions
        public bool AddAfterBoil { get; set; } = false; // For extracts added post-boil

        public int? SteepTime { get; set; } // Steeping time for specialty grains

        public string? Notes { get; set; }

        public DateTime Created { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime Updated { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;

        [ForeignKey("GrainId")]
        public virtual Grain Grain { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? UpdatedByUser { get; set; }
    }

    // Recipe Hop Schedule
    [Table("RecipeHop")]
    public class RecipeHop
    {
        [Key]
        public Guid RecipeHopId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public Guid HopId { get; set; }

        [Required]
        [Column(TypeName = "decimal(6,3)")]
        public decimal Amount { get; set; } // Quantity of hops

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = "oz"; // oz, grams, lbs

        // Hop Addition Details
        public int? AdditionTime { get; set; } // Time in minutes (60 = 60 min boil, 0 = flameout)

        [Required]
        [MaxLength(50)]
        public string AdditionType { get; set; } = string.Empty; // boil, whirlpool, dry_hop, first_wort, mash_hop

        [MaxLength(50)]
        public string? Purpose { get; set; } // bittering, flavor, aroma, dual_purpose

        [MaxLength(20)]
        public string? Form { get; set; } // pellets, whole, extract, plug

        // Hop Characteristics
        [Column(TypeName = "decimal(4,2)")]
        public decimal? AlphaAcid { get; set; } // Alpha acid percentage

        [Column(TypeName = "decimal(4,2)")]
        public decimal? BetaAcid { get; set; } // Beta acid percentage

        [Column(TypeName = "decimal(4,1)")]
        public decimal? Cohumulone { get; set; } // Cohumulone percentage

        [Column(TypeName = "decimal(4,2)")]
        public decimal? TotalOil { get; set; } // Total oil content

        // Calculated Values
        [Column(TypeName = "decimal(5,1)")]
        public decimal? IBUContribution { get; set; } // Calculated IBU contribution

        [Column(TypeName = "decimal(5,2)")]
        public decimal? UtilizationRate { get; set; } // Alpha acid utilization rate

        // Dry Hop Specific
        public int? DryHopDays { get; set; } // Days for dry hopping

        [Column(TypeName = "decimal(5,2)")]
        public decimal? DryHopTemperature { get; set; } // Temperature for dry hopping

        // Instructions
        public int? SortOrder { get; set; } // Order in hop schedule

        public string? Notes { get; set; }

        public DateTime Created { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime Updated { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;

        [ForeignKey("HopId")]
        public virtual Hop Hop { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? UpdatedByUser { get; set; }
    }

    // Recipe Yeast Information
    [Table("RecipeYeast")]
    public class RecipeYeast
    {
        [Key]
        public Guid RecipeYeastId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public Guid YeastId { get; set; }

        [Required]
        [Column(TypeName = "decimal(6,2)")]
        public decimal Amount { get; set; } // Quantity

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = "packages"; // packages, grams, ml, cells

        // Yeast Characteristics
        [MaxLength(50)]
        public string? YeastType { get; set; } // ale, lager, wild, bacteria

        [MaxLength(20)]
        public string? Form { get; set; } // liquid, dry, slant, starter

        [Column(TypeName = "decimal(4,1)")]
        public decimal? Attenuation { get; set; } // Expected attenuation percentage

        [MaxLength(20)]
        public string? Flocculation { get; set; } // low, medium, high

        [Column(TypeName = "decimal(4,1)")]
        public decimal? ToleranceABV { get; set; } // Alcohol tolerance

        [Column(TypeName = "decimal(5,2)")]
        public decimal? TemperatureMin { get; set; } // Minimum fermentation temperature

        [Column(TypeName = "decimal(5,2)")]
        public decimal? TemperatureMax { get; set; } // Maximum fermentation temperature

        [Column(TypeName = "decimal(5,2)")]
        public decimal? TemperatureOptimal { get; set; } // Optimal fermentation temperature

        // Starter Information
        public bool RequiresStarter { get; set; } = false;

        [Column(TypeName = "decimal(6,1)")]
        public decimal? StarterSize { get; set; } // Starter size in ml

        [Column(TypeName = "decimal(5,3)")]
        public decimal? StarterGravity { get; set; } // Starter wort gravity

        // Process Notes
        [Column(TypeName = "decimal(5,2)")]
        public decimal? PitchingTemperature { get; set; }

        public string? FermentationNotes { get; set; }

        public int? SortOrder { get; set; }

        public DateTime Created { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime Updated { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;

        [ForeignKey("YeastId")]
        public virtual Yeast Yeast { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? UpdatedByUser { get; set; }
    }

    // Recipe Additives (Water Salts, Nutrients, Clarifiers, etc.)
    [Table("RecipeAdditive")]
    public class RecipeAdditive
    {
        [Key]
        public Guid RecipeAdditiveId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public Guid AdditiveId { get; set; }

        [Required]
        [Column(TypeName = "decimal(8,3)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = string.Empty; // grams, tsp, tablets, ml

        public int? AdditionTime { get; set; } // When to add (minutes from start)

        [MaxLength(50)]
        public string? AdditionStage { get; set; } // mash, boil, primary, secondary, packaging

        [MaxLength(100)]
        public string? Purpose { get; set; } // water_adjustment, yeast_nutrient, clarifier, etc.

        [MaxLength(50)]
        public string? TargetParameter { get; set; } // calcium, ph, clarity, etc.

        [Column(TypeName = "decimal(8,3)")]
        public decimal? TargetValue { get; set; } // Target value for parameter

        public int? SortOrder { get; set; }

        public DateTime Created { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime Updated { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;

        [ForeignKey("AdditiveId")]
        public virtual Additive Additive { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? UpdatedByUser { get; set; }
    }

    // Mash Schedule (Step Mashing)
    [Table("RecipeMashStep")]
    public class RecipeMashStep
    {
        [Key]
        public Guid MashStepId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public int StepNumber { get; set; }

        [MaxLength(100)]
        public string? StepName { get; set; } // protein_rest, saccharification, mash_out

        [MaxLength(50)]
        public string? StepType { get; set; } // temperature, decoction, infusion

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal Temperature { get; set; } // Step temperature

        [MaxLength(10)]
        public string TemperatureUnit { get; set; } = "°F";

        [Required]
        public int Duration { get; set; } // Duration in minutes

        [Column(TypeName = "decimal(6,2)")]
        public decimal? InfusionAmount { get; set; } // Amount of water to add (for infusion)

        [Column(TypeName = "decimal(5,2)")]
        public decimal? InfusionTemp { get; set; } // Temperature of infusion water

        public string? Description { get; set; }

        public DateTime Created { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;
    }

    // Water Chemistry Profiles
    [Table("WaterProfile")]
    public class WaterProfile
    {
        [Key]
        public Guid WaterProfileId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // e.g., "Burton-on-Trent", "Pilsen"

        public string? Description { get; set; }

        public bool IsDefault { get; set; } = false;

        // Ion Concentrations (ppm)
        [Column(TypeName = "decimal(6,2)")]
        public decimal? Calcium { get; set; }

        [Column(TypeName = "decimal(6,2)")]
        public decimal? Magnesium { get; set; }

        [Column(TypeName = "decimal(6,2)")]
        public decimal? Sodium { get; set; }

        [Column(TypeName = "decimal(6,2)")]
        public decimal? Sulfate { get; set; }

        [Column(TypeName = "decimal(6,2)")]
        public decimal? Chloride { get; set; }

        [Column(TypeName = "decimal(6,2)")]
        public decimal? Bicarbonate { get; set; }

        // Calculated Values
        [Column(TypeName = "decimal(6,2)")]
        public decimal? TotalHardness { get; set; } // Total hardness as CaCO3

        [Column(TypeName = "decimal(6,2)")]
        public decimal? TotalAlkalinity { get; set; } // Alkalinity as CaCO3

        [Column(TypeName = "decimal(6,2)")]
        public decimal? ResidualAlkalinity { get; set; } // Residual alkalinity

        [Column(TypeName = "decimal(5,2)")]
        public decimal? SulfateToChlorideRatio { get; set; } // SO4:Cl ratio

        // pH Information
        [Column(TypeName = "decimal(3,2)")]
        public decimal? TargetMashPH { get; set; } // Target mash pH

        [Column(TypeName = "decimal(3,2)")]
        public decimal? EstimatedMashPH { get; set; } // Estimated mash pH

        // Source Water Info
        [MaxLength(100)]
        public string? SourceWaterName { get; set; } // Municipal, well, etc.

        public string? SourceWaterNotes { get; set; }

        public DateTime Created { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime Updated { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? UpdatedByUser { get; set; }

        public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
    }

    // Recipe Versions/History
    [Table("RecipeVersion")]
    public class RecipeVersion
    {
        [Key]
        public Guid VersionId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public int VersionNumber { get; set; }

        [MaxLength(100)]
        public string? VersionName { get; set; } // e.g., "Initial", "Hop Adjustment", "Final"

        public string? ChangeDescription { get; set; }

        [MaxLength(200)]
        public string? ChangeReason { get; set; } // taste_adjustment, cost_optimization, etc.

        [Column(TypeName = "jsonb")]
        public string? RecipeData { get; set; } // Complete recipe snapshot

        public DateTime CreatedDate { get; set; }
        public Guid? CreatedBy { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }
    }

    // Recipe Brewing Sessions (Links recipes to actual production batches)
    [Table("RecipeBrewSession")]
    public class RecipeBrewSession
    {
        [Key]
        public Guid BrewSessionId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string BatchNumber { get; set; } = string.Empty; // Unique batch identifier

        [Required]
        public DateOnly BrewDate { get; set; }

        [MaxLength(100)]
        public string? Brewer { get; set; }

        [Column(TypeName = "decimal(8,3)")]
        public decimal? ActualBatchSize { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? ActualEfficiency { get; set; }

        // Actual Measurements
        [Column(TypeName = "decimal(5,3)")]
        public decimal? ActualOG { get; set; }

        [Column(TypeName = "decimal(5,3)")]
        public decimal? ActualFG { get; set; }

        [Column(TypeName = "decimal(4,2)")]
        public decimal? ActualABV { get; set; }

        [Column(TypeName = "decimal(5,1)")]
        public decimal? ActualIBU { get; set; }

        [Column(TypeName = "decimal(5,1)")]
        public decimal? ActualSRM { get; set; }

        [Column(TypeName = "decimal(3,2)")]
        public decimal? ActualPH { get; set; }

        // Process Deviations
        public string? ProcessDeviations { get; set; }
        public string? QualityNotes { get; set; }
        public string? TastingNotes { get; set; }
        public string? BrewingNotes { get; set; }

        // Cost Tracking
        [Column(TypeName = "decimal(10,2)")]
        public decimal? ActualCost { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? CostVariance { get; set; } // Difference from estimated

        // Status
        [MaxLength(50)]
        public string Status { get; set; } = "planning"; // planning, brewing, fermenting, conditioning, packaged, completed

        public DateOnly? CompletedDate { get; set; }

        public DateTime Created { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime Updated { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;

        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? UpdatedByUser { get; set; }
    }

    

    // Static classes for constants
    public static class RecipeConstants
    {
        public static class HopAdditionTypes
        {
            public const string BOIL = "boil";
            public const string WHIRLPOOL = "whirlpool";
            public const string DRY_HOP = "dry_hop";
            public const string FIRST_WORT = "first_wort";
            public const string MASH_HOP = "mash_hop";
        }

        public static class HopPurposes
        {
            public const string BITTERING = "bittering";
            public const string FLAVOR = "flavor";
            public const string AROMA = "aroma";
            public const string DUAL_PURPOSE = "dual_purpose";
        }

        public static class HopForms
        {
            public const string PELLETS = "pellets";
            public const string WHOLE = "whole";
            public const string EXTRACT = "extract";
            public const string PLUG = "plug";
        }

        public static class YeastTypes
        {
            public const string ALE = "ale";
            public const string LAGER = "lager";
            public const string WILD = "wild";
            public const string BACTERIA = "bacteria";
        }

        public static class YeastForms
        {
            public const string LIQUID = "liquid";
            public const string DRY = "dry";
            public const string SLANT = "slant";
            public const string STARTER = "starter";
        }

        public static class MashStepTypes
        {
            public const string TEMPERATURE = "temperature";
            public const string DECOCTION = "decoction";
            public const string INFUSION = "infusion";
        }

        public static class BrewSessionStatuses
        {
            public const string PLANNING = "planning";
            public const string BREWING = "brewing";
            public const string FERMENTING = "fermenting";
            public const string CONDITIONING = "conditioning";
            public const string PACKAGED = "packaged";
            public const string COMPLETED = "completed";
        }

        public static class AdditionStages
        {
            public const string MASH = "mash";
            public const string BOIL = "boil";
            public const string PRIMARY = "primary";
            public const string SECONDARY = "secondary";
            public const string PACKAGING = "packaging";
        }
    }
}