using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Ingredients
{
    [Table("Grain")]
    public class Grain
    {
        [Key]
        public Guid GrainId { get; set; } = Guid.NewGuid();

        public Guid? TenantId { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Type { get; set; } = string.Empty; // Base Malt, Specialty Malt, Adjunct

        [StringLength(100)]
        public string? Origin { get; set; }

        [StringLength(100)]
        public string? Supplier { get; set; }

        [Range(0, 600)]
        public decimal? Color { get; set; } // Lovibond degrees

        [Range(1.000, 1.050)]
        public decimal? Potential { get; set; } // Specific gravity potential

        [Range(0, 100)]
        public decimal? MaxUsage { get; set; } // Maximum percentage in grain bill

        public bool RequiresMashing { get; set; } = true;

        public string? Description { get; set; }

        public string? FlavorProfile { get; set; }

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
    public class GrainDto
    {
        public Guid GrainId { get; set; }
        public Guid? TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Origin { get; set; }
        public string? Supplier { get; set; }
        public decimal? Color { get; set; }
        public decimal? Potential { get; set; }
        public decimal? MaxUsage { get; set; }
        public bool RequiresMashing { get; set; }
        public string? Description { get; set; }
        public string? FlavorProfile { get; set; }
        public bool IsActive { get; set; }
        public bool IsCustom { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
    }

    public class CreateGrainDto
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Type { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Origin { get; set; }

        [StringLength(100)]
        public string? Supplier { get; set; }

        [Range(0, 600)]
        public decimal? Color { get; set; }

        [Range(1.000, 1.050)]
        public decimal? Potential { get; set; }

        [Range(0, 100)]
        public decimal? MaxUsage { get; set; }

        public bool RequiresMashing { get; set; } = true;

        public string? Description { get; set; }

        public string? FlavorProfile { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateGrainDto : CreateGrainDto
    {
        // Inherits all properties from CreateGrainDto
    }
}