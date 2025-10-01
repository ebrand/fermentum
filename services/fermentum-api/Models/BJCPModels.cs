using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.BJCP
{
    // BJCP Beer Categories (1-34, X)
    [Table("BJCP_BeerCategory")]
    public class BJCPBeerCategory
    {
        [Key]
        public Guid CategoryId { get; set; }

        [Required]
        [MaxLength(10)]
        public string CategoryNumber { get; set; } = string.Empty; // "1", "2", "X"

        [Required]
        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int? SortOrder { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        public virtual ICollection<BJCPBeerStyle> BJCPBeerStyles { get; set; } = new List<BJCPBeerStyle>();
    }

    // Style Tags for categorization and search
    [Table("BJCP_StyleTag")]
    public class BJCPStyleTag
    {
        [Key]
        public Guid TagId { get; set; }

        [Required]
        [MaxLength(50)]
        public string TagName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Category { get; set; } // 'strength', 'color', 'flavor-profile', 'origin', 'fermentation'

        public string? Description { get; set; }

        [MaxLength(7)]
        public string? Color { get; set; } // hex color for UI display

        public int? SortOrder { get; set; }

        public DateTime Created { get; set; }

        // Navigation properties
        public virtual ICollection<BJCPStyleTagMapping> StyleTagMappings { get; set; } = new List<BJCPStyleTagMapping>();
    }

    // Style-Tag many-to-many relationship
    [Table("BJCP_StyleTagMapping")]
    public class BJCPStyleTagMapping
    {
        public Guid StyleId { get; set; }

        public Guid TagId { get; set; }

        public DateTime Created { get; set; }

        // Navigation properties
        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;

        [ForeignKey("TagId")]
        public virtual BJCPStyleTag StyleTag { get; set; } = null!;
    }

    // Detailed style characteristics broken down by type
    [Table("BJCP_StyleCharacteristics")]
    public class BJCPStyleCharacteristics
    {
        [Key]
        public Guid CharacteristicId { get; set; }

        [Required]
        public Guid StyleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string CharacteristicType { get; set; } = string.Empty; // 'aroma', 'appearance', 'flavor', 'mouthfeel'

        [Required]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "text[]")]
        public string[]? Keywords { get; set; } // searchable keywords extracted from descriptions

        public int Priority { get; set; } = 1; // 1=primary, 2=secondary, 3=subtle

        public DateTime Created { get; set; }

        // Navigation properties
        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;
    }

    // Commercial examples of each style
    [Table("BJCP_CommercialExample")]
    public class BJCPCommercialExample
    {
        [Key]
        public Guid ExampleId { get; set; }

        [Required]
        public Guid StyleId { get; set; }

        [Required]
        [MaxLength(100)]
        public string BeerName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? BreweryName { get; set; }

        [MaxLength(50)]
        public string? Country { get; set; }

        public bool IsActive { get; set; } = true;

        [MaxLength(50)]
        public string? Availability { get; set; } // 'year-round', 'seasonal', 'limited', 'discontinued'

        public string? Notes { get; set; }

        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;
    }

    // Style comparison relationships
    [Table("BJCP_StyleComparison")]
    public class BJCPStyleComparison
    {
        [Key]
        public Guid ComparisonId { get; set; }

        [Required]
        public Guid PrimaryStyleId { get; set; }

        [Required]
        public Guid ComparedStyleId { get; set; }

        [Required]
        public string ComparisonText { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Relationship { get; set; } // 'similar', 'stronger', 'darker', 'hoppier', 'maltier'

        [MaxLength(20)]
        public string ComparisonType { get; set; } = "similarity"; // 'similarity', 'difference', 'progression'

        public DateTime Created { get; set; }

        // Navigation properties
        public virtual BJCPBeerStyle PrimaryStyle { get; set; } = null!;
        public virtual BJCPBeerStyle ComparedStyle { get; set; } = null!;
    }

    // Style-specific brewing recommendations
    [Table("BJCP_StyleRecommendation")]
    public class BJCPStyleRecommendation
    {
        [Key]
        public Guid RecommendationId { get; set; }

        [Required]
        public Guid StyleId { get; set; }

        [Required]
        [MaxLength(30)]
        public string RecommendationType { get; set; } = string.Empty; // 'ingredient', 'process', 'fermentation', 'water'

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public int Priority { get; set; } = 1; // 1=essential, 2=recommended, 3=optional

        [MaxLength(30)]
        public string? Phase { get; set; } // 'planning', 'mashing', 'boiling', 'fermentation', 'conditioning'

        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; }

        public Guid? CreatedBy { get; set; }

        // Navigation properties
        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }
    }

    // Recipe-Style matching and analysis
    [Table("BJCP_RecipeStyleMatch")]
    public class BJCPRecipeStyleMatch
    {
        [Key]
        public Guid MatchId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public Guid StyleId { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal MatchPercentage { get; set; } // 0-100

        [Required]
        public bool IsWithinGuidelines { get; set; }

        [Column(TypeName = "jsonb")]
        public string? ParameterMatches { get; set; } // detailed breakdown

        [Column(TypeName = "text[]")]
        public string[]? Recommendations { get; set; } // suggestions to better match the style

        public DateTime CalculatedDate { get; set; }

        [MaxLength(20)]
        public string CalculationVersion { get; set; } = "1.0";

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;

        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;
    }

    // Style judging criteria and scoring
    [Table("BJCP_StyleJudging")]
    public class BJCPStyleJudging
    {
        [Key]
        public Guid JudgingId { get; set; }

        [Required]
        public Guid StyleId { get; set; }

        [Required]
        [Column(TypeName = "jsonb")]
        public string JudgingCriteria { get; set; } = string.Empty; // scoring rubric and weight for each aspect

        [Column(TypeName = "text[]")]
        public string[]? CommonFaults { get; set; }

        public string? JudgingNotes { get; set; }

        [Column(TypeName = "jsonb")]
        public string? ScoringWeights { get; set; } // {"aroma": 12, "appearance": 3, "flavor": 20, "mouthfeel": 5, "overall": 10}

        [MaxLength(20)]
        public string Version { get; set; } = "BJCP2021";

        public DateTime Created { get; set; }

        // Navigation properties
        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;
    }

    // Competition entries and results
    [Table("BJCP_RecipeCompetitionEntry")]
    public class BJCPRecipeCompetitionEntry
    {
        [Key]
        public Guid EntryId { get; set; }

        [Required]
        public Guid RecipeId { get; set; }

        [Required]
        public Guid StyleId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [MaxLength(200)]
        public string? CompetitionName { get; set; }

        [MaxLength(50)]
        public string? CompetitionType { get; set; } // 'BJCP', 'local', 'homebrew-club', 'commercial'

        public DateOnly? EntryDate { get; set; }

        public DateOnly? JudgingDate { get; set; }

        [Column(TypeName = "decimal(4,1)")]
        public decimal? Score { get; set; } // BJCP scoring 0.0-50.0

        public string? Feedback { get; set; }

        [MaxLength(50)]
        public string? Placement { get; set; } // "Gold", "Silver", "Bronze", "Honorable Mention"

        public string? JudgeNotes { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal? EntryFee { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "entered"; // 'entered', 'judged', 'awarded', 'withdrawn'

        public DateTime Created { get; set; }

        public Guid? CreatedBy { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe Recipe { get; set; } = null!;

        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;

        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }
    }

    // Style popularity and trends
    [Table("BJCP_StylePopularity")]
    public class BJCPStylePopularity
    {
        [Key]
        public Guid PopularityId { get; set; }

        [Required]
        public Guid StyleId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Period { get; set; } = string.Empty; // 'monthly', 'quarterly', 'yearly'

        [Required]
        public DateOnly PeriodDate { get; set; }

        public int RecipeCount { get; set; } = 0;

        public int BrewSessionCount { get; set; } = 0;

        public int TenantCount { get; set; } = 0;

        [MaxLength(20)]
        public string? TrendDirection { get; set; } // 'increasing', 'decreasing', 'stable'

        [Column(TypeName = "decimal(5,2)")]
        public decimal? TrendPercentage { get; set; } // percentage change from previous period

        public int? Rank { get; set; } // rank among all styles for this period

        public DateTime Created { get; set; }

        // Navigation properties
        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;
    }

    // Aggregated analytics across recipes for each style
    [Table("BJCP_StyleAnalytics")]
    public class BJCPStyleAnalytics
    {
        [Key]
        public Guid AnalyticsId { get; set; }

        [Required]
        public Guid StyleId { get; set; }

        [Required]
        public DateOnly AnalysisDate { get; set; }

        [Required]
        public int RecipesSampled { get; set; }

        // Average values from actual recipes
        [Column(TypeName = "decimal(5,3)")]
        public decimal? AvgOG { get; set; }

        [Column(TypeName = "decimal(5,3)")]
        public decimal? AvgFG { get; set; }

        [Column(TypeName = "decimal(4,2)")]
        public decimal? AvgABV { get; set; }

        [Column(TypeName = "decimal(5,1)")]
        public decimal? AvgIBU { get; set; }

        [Column(TypeName = "decimal(5,1)")]
        public decimal? AvgSRM { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? AvgEfficiency { get; set; }

        [Column(TypeName = "decimal(8,3)")]
        public decimal? AvgBatchSize { get; set; }

        // Most common ingredients (JSON arrays with usage percentages)
        [Column(TypeName = "jsonb")]
        public string? CommonGrains { get; set; } // [{"name": "Pale 2-Row", "usage_percent": 85.5}]

        [Column(TypeName = "jsonb")]
        public string? CommonHops { get; set; }

        [Column(TypeName = "jsonb")]
        public string? CommonYeasts { get; set; }

        [Column(TypeName = "jsonb")]
        public string? CommonAdditives { get; set; }

        // Cost analysis
        [Column(TypeName = "decimal(10,2)")]
        public decimal? AvgCostPerBatch { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal? AvgCostPerGallon { get; set; }

        [Column(TypeName = "decimal(6,2)")]
        public decimal? AvgCostPer12oz { get; set; }

        public DateTime Created { get; set; }

        // Navigation properties
        [ForeignKey("StyleId")]
        public virtual BJCPBeerStyle BJCPBeerStyle { get; set; } = null!;
    }

    // Static classes for constants
    public static class BJCPConstants
    {
        public static class CharacteristicTypes
        {
            public const string AROMA = "aroma";
            public const string APPEARANCE = "appearance";
            public const string FLAVOR = "flavor";
            public const string MOUTHFEEL = "mouthfeel";
        }

        public static class TagCategories
        {
            public const string STRENGTH = "strength";
            public const string COLOR = "color";
            public const string FLAVOR_PROFILE = "flavor-profile";
            public const string ORIGIN = "origin";
            public const string FERMENTATION = "fermentation";
            public const string OTHER = "other";
        }

        public static class RecommendationTypes
        {
            public const string INGREDIENT = "ingredient";
            public const string PROCESS = "process";
            public const string FERMENTATION = "fermentation";
            public const string WATER = "water";
        }

        public static class BrewingPhases
        {
            public const string PLANNING = "planning";
            public const string MASHING = "mashing";
            public const string BOILING = "boiling";
            public const string FERMENTATION = "fermentation";
            public const string CONDITIONING = "conditioning";
        }

        public static class CompetitionTypes
        {
            public const string BJCP = "BJCP";
            public const string LOCAL = "local";
            public const string HOMEBREW_CLUB = "homebrew-club";
            public const string COMMERCIAL = "commercial";
        }

        public static class CompetitionStatuses
        {
            public const string ENTERED = "entered";
            public const string JUDGED = "judged";
            public const string AWARDED = "awarded";
            public const string WITHDRAWN = "withdrawn";
        }

        public static class TrendDirections
        {
            public const string INCREASING = "increasing";
            public const string DECREASING = "decreasing";
            public const string STABLE = "stable";
        }

        public static class Periods
        {
            public const string MONTHLY = "monthly";
            public const string QUARTERLY = "quarterly";
            public const string YEARLY = "yearly";
        }
    }
}