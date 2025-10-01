using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Ingredients
{
    [Table("Additive")]
    public class Additive
    {
        [Key]
        public Guid AdditiveId { get; set; } = Guid.NewGuid();

        public Guid? TenantId { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty; // Water Treatment, Clarification, Flavoring, Nutrients, Preservatives

        [StringLength(100)]
        public string? Type { get; set; } // Subcategory

        public string? Purpose { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DosageMin { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DosageMax { get; set; }

        [StringLength(20)]
        public string? DosageUnit { get; set; } // g/gal, tsp, oz, etc.

        public string? Usage { get; set; }

        public string? SafetyNotes { get; set; }

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsCustom { get; set; } = false;

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
    public class AdditiveDto
    {
        public Guid AdditiveId { get; set; }
        public Guid? TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Type { get; set; }
        public string? Purpose { get; set; }
        public decimal? DosageMin { get; set; }
        public decimal? DosageMax { get; set; }
        public string? DosageUnit { get; set; }
        public string? Usage { get; set; }
        public string? SafetyNotes { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public bool IsCustom { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
    }

    public class CreateAdditiveDto
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Type { get; set; }

        public string? Purpose { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DosageMin { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DosageMax { get; set; }

        [StringLength(20)]
        public string? DosageUnit { get; set; }

        public string? Usage { get; set; }

        public string? SafetyNotes { get; set; }

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateAdditiveDto : CreateAdditiveDto
    {
        // Inherits all properties from CreateAdditiveDto
    }
}