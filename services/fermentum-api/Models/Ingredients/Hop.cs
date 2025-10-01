using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Ingredients
{
    [Table("Hop")]
    public class Hop
    {
        [Key]
        public Guid HopId { get; set; } = Guid.NewGuid();

        public Guid? TenantId { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Origin { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // Bittering, Aroma, Dual Purpose

        [Range(0, 30)]
        public decimal? AlphaAcidMin { get; set; }

        [Range(0, 30)]
        public decimal? AlphaAcidMax { get; set; }

        [Range(0, 20)]
        public decimal? BetaAcid { get; set; }

        [Range(0, 100)]
        public decimal? CoHumulone { get; set; }

        public string? FlavorProfile { get; set; }

        public string? AromaProfile { get; set; }

        public string? Substitutes { get; set; } // Comma-separated list

        [Range(0, 100)]
        public decimal? StorageIndex { get; set; }

        [Range(2020, 2030)]
        public int? HarvestYear { get; set; }

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
    public class HopDto
    {
        public Guid HopId { get; set; }
        public Guid? TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Origin { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal? AlphaAcidMin { get; set; }
        public decimal? AlphaAcidMax { get; set; }
        public decimal? BetaAcid { get; set; }
        public decimal? CoHumulone { get; set; }
        public string? FlavorProfile { get; set; }
        public string? AromaProfile { get; set; }
        public string? Substitutes { get; set; }
        public decimal? StorageIndex { get; set; }
        public int? HarvestYear { get; set; }
        public bool IsActive { get; set; }
        public bool IsCustom { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
    }

    public class CreateHopDto
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Origin { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty;

        [Range(0, 30)]
        public decimal? AlphaAcidMin { get; set; }

        [Range(0, 30)]
        public decimal? AlphaAcidMax { get; set; }

        [Range(0, 20)]
        public decimal? BetaAcid { get; set; }

        [Range(0, 100)]
        public decimal? CoHumulone { get; set; }

        public string? FlavorProfile { get; set; }

        public string? AromaProfile { get; set; }

        public string? Substitutes { get; set; }

        [Range(0, 100)]
        public decimal? StorageIndex { get; set; }

        [Range(2020, 2030)]
        public int? HarvestYear { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateHopDto : CreateHopDto
    {
        // Inherits all properties from CreateHopDto
    }
}