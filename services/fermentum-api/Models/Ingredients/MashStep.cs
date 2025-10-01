using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Ingredients
{
    [Table("MashStep")]
    public class MashStep
    {
        [Key]
        public Guid MashStepId { get; set; } = Guid.NewGuid();

        public Guid? TenantId { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string StepType { get; set; } = string.Empty; // Temperature, Infusion, Decoction

        [Required]
        [Range(32, 212)]
        public int Temperature { get; set; } // Target temperature in Fahrenheit

        [StringLength(5)]
        public string TemperatureUnit { get; set; } = "F";

        [Required]
        [Range(1, 480)]
        public int Duration { get; set; } // Duration in minutes

        public string? Description { get; set; }

        [Range(1, 20)]
        public int? TypicalOrder { get; set; } // Typical order in mash sequence

        [StringLength(100)]
        public string? Category { get; set; } // Protein Rest, Saccharification, Mash Out, etc.

        public bool IsActive { get; set; } = true;

        public bool IsCustom { get; set; } = false; // true for tenant-specific additions

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant? Tenant { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User? Creator { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? Updater { get; set; }
    }

    // DTOs for API responses
    public class MashStepDto
    {
        public Guid MashStepId { get; set; }
        public Guid? TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string StepType { get; set; } = string.Empty;
        public int Temperature { get; set; }
        public string TemperatureUnit { get; set; } = "F";
        public int Duration { get; set; }
        public string? Description { get; set; }
        public int? TypicalOrder { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; }
        public bool IsCustom { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
    }

    public class CreateMashStepDto
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string StepType { get; set; } = string.Empty;

        [Required]
        [Range(32, 212)]
        public int Temperature { get; set; }

        [StringLength(5)]
        public string TemperatureUnit { get; set; } = "F";

        [Required]
        [Range(1, 480)]
        public int Duration { get; set; }

        public string? Description { get; set; }

        [Range(1, 20)]
        public int? TypicalOrder { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateMashStepDto : CreateMashStepDto
    {
        // Inherits all properties from CreateMashStepDto
    }
}