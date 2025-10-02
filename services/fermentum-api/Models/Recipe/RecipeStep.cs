using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FermentumApi.Models
{
    [Table("RecipeStep")]
    public class RecipeStep
    {
        [Key]
        [Column("RecipeStepId")]
        public Guid RecipeStepId { get; set; }

        [Required]
        [Column("RecipeId")]
        public Guid RecipeId { get; set; }

        [Required]
        [Column("StepNumber")]
        public int StepNumber { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("Phase")]
        public string Phase { get; set; } = string.Empty; // Mash, Boil, Fermentation, Conditioning, Packaging

        [Required]
        [MaxLength(100)]
        [Column("StepName")]
        public string StepName { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("StepType")]
        public string? StepType { get; set; } // Temperature, Infusion, Decoction, Addition, Transfer, etc.

        [Column("Duration")]
        public int? Duration { get; set; } // Duration in minutes

        [Column("Temperature", TypeName = "decimal(5,2)")]
        public decimal? Temperature { get; set; }

        [MaxLength(10)]
        [Column("TemperatureUnit")]
        public string? TemperatureUnit { get; set; } = "°F";

        [Column("Amount", TypeName = "decimal(6,2)")]
        public decimal? Amount { get; set; } // For additions (hops, etc.) or infusions

        [MaxLength(20)]
        [Column("AmountUnit")]
        public string? AmountUnit { get; set; } // oz, g, lbs, gallons, etc.

        [Column("IngredientId")]
        public Guid? IngredientId { get; set; } // Link to Hop, Yeast, Additive, etc. if applicable

        [MaxLength(50)]
        [Column("IngredientType")]
        public string? IngredientType { get; set; } // Hop, Yeast, Additive, etc.

        [Column("Description")]
        public string? Description { get; set; }

        [Column("Instructions")]
        public string? Instructions { get; set; }

        [Column("IsOptional")]
        public bool IsOptional { get; set; } = false;

        [Column("AlertBefore")]
        public int? AlertBefore { get; set; } // Minutes before step to alert brewer

        [Column("RequiresEquipment")]
        public bool RequiresEquipment { get; set; } = false;

        [Column("EquipmentTypeId")]
        public Guid? EquipmentTypeId { get; set; }

        [Column("EquipmentCapacityMin", TypeName = "decimal(10,2)")]
        public decimal? EquipmentCapacityMin { get; set; }

        [MaxLength(20)]
        [Column("EquipmentCapacityUnit")]
        public string? EquipmentCapacityUnit { get; set; }

        [Column("Created")]
        public DateTime Created { get; set; }

        [Column("CreatedBy")]
        public Guid? CreatedBy { get; set; }

        [Column("Updated")]
        public DateTime Updated { get; set; }

        [Column("UpdatedBy")]
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("RecipeId")]
        public virtual Recipe? Recipe { get; set; }

        [ForeignKey("EquipmentTypeId")]
        public virtual Equipment.EquipmentType? EquipmentType { get; set; }
    }
}
