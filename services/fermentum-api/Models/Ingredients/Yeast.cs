using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Ingredients
{
    [Table("Yeast")]
    public class Yeast
    {
        [Key]
        public Guid YeastId { get; set; } = Guid.NewGuid();

        public Guid? TenantId { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Manufacturer { get; set; }

        [StringLength(50)]
        public string? ProductId { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // Ale, Lager, Wheat, Belgian, Wild, Distilling, Wine

        [Required]
        [StringLength(50)]
        public string Form { get; set; } = string.Empty; // Liquid, Dry, Slant, Culture

        [Range(40, 100)]
        public int? AttenuationMin { get; set; }

        [Range(40, 100)]
        public int? AttenuationMax { get; set; }

        [Range(32, 110)]
        public int? TemperatureMin { get; set; } // Fahrenheit

        [Range(32, 110)]
        public int? TemperatureMax { get; set; } // Fahrenheit

        [Range(0, 25)]
        public decimal? AlcoholTolerance { get; set; }

        [StringLength(20)]
        public string? Flocculation { get; set; } // Low, Medium, High

        public string? FlavorProfile { get; set; }

        public string? Description { get; set; }

        public string? Usage { get; set; }

        public string? PitchRate { get; set; }

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
    public class YeastDto
    {
        public Guid YeastId { get; set; }
        public Guid? TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Manufacturer { get; set; }
        public string? ProductId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Form { get; set; } = string.Empty;
        public int? AttenuationMin { get; set; }
        public int? AttenuationMax { get; set; }
        public int? TemperatureMin { get; set; }
        public int? TemperatureMax { get; set; }
        public decimal? AlcoholTolerance { get; set; }
        public string? Flocculation { get; set; }
        public string? FlavorProfile { get; set; }
        public string? Description { get; set; }
        public string? Usage { get; set; }
        public string? PitchRate { get; set; }
        public bool IsActive { get; set; }
        public bool IsCustom { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
    }

    public class CreateYeastDto
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Manufacturer { get; set; }

        [StringLength(50)]
        public string? ProductId { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Form { get; set; } = string.Empty;

        [Range(40, 100)]
        public int? AttenuationMin { get; set; }

        [Range(40, 100)]
        public int? AttenuationMax { get; set; }

        [Range(32, 110)]
        public int? TemperatureMin { get; set; }

        [Range(32, 110)]
        public int? TemperatureMax { get; set; }

        [Range(0, 25)]
        public decimal? AlcoholTolerance { get; set; }

        [StringLength(20)]
        public string? Flocculation { get; set; }

        public string? FlavorProfile { get; set; }

        public string? Description { get; set; }

        public string? Usage { get; set; }

        public string? PitchRate { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateYeastDto : CreateYeastDto
    {
        // Inherits all properties from CreateYeastDto
    }
}