using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Equipment
{
    [Table("EquipmentType")]
    public class EquipmentType
    {
        [Key]
        [Column("EquipmentTypeId")]
        public Guid EquipmentTypeId { get; set; }

        [Required]
        [Column("TenantId")]
        public Guid TenantId { get; set; }

        [Column("BreweryId")]
        public Guid? BreweryId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("Name")]
        public string Name { get; set; } = string.Empty;

        [Column("Description")]
        public string? Description { get; set; }

        [Column("Created")]
        public DateTime Created { get; set; }

        [Column("CreatedBy")]
        public Guid? CreatedBy { get; set; }

        [Column("Updated")]
        public DateTime Updated { get; set; }

        [Column("UpdatedBy")]
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant? Tenant { get; set; }

        [ForeignKey("BreweryId")]
        public virtual Brewery? Brewery { get; set; }
    }
}
