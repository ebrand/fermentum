using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Equipment
{
    [Table("Equipment")]
    public class Equipment
    {
        [Key]
        [Column("EquipmentId")]
        public Guid EquipmentId { get; set; }

        [Required]
        [Column("TenantId")]
        public Guid TenantId { get; set; }

        [Column("BreweryId")]
        public Guid? BreweryId { get; set; }

        [Required]
        [Column("EquipmentTypeId")]
        public Guid EquipmentTypeId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("Name")]
        public string Name { get; set; } = string.Empty;

        [Column("Description")]
        public string? Description { get; set; }

        [MaxLength(50)]
        [Column("Status")]
        public string? Status { get; set; }

        [Column("Capacity")]
        public decimal? Capacity { get; set; }

        [MaxLength(20)]
        [Column("CapacityUnit")]
        public string? CapacityUnit { get; set; }

        [Column("WorkingCapacity")]
        public decimal? WorkingCapacity { get; set; }

        [MaxLength(100)]
        [Column("SerialNumber")]
        public string? SerialNumber { get; set; }

        [MaxLength(100)]
        [Column("Manufacturer")]
        public string? Manufacturer { get; set; }

        [MaxLength(100)]
        [Column("Model")]
        public string? Model { get; set; }

        [Column("PurchaseDate")]
        public DateTime? PurchaseDate { get; set; }

        [Column("WarrantyExpiration")]
        public DateTime? WarrantyExpiration { get; set; }

        [Column("LastMaintenanceDate")]
        public DateTime? LastMaintenanceDate { get; set; }

        [Column("NextMaintenanceDate")]
        public DateTime? NextMaintenanceDate { get; set; }

        [Column("MaintenanceIntervalDays")]
        public int? MaintenanceIntervalDays { get; set; }

        [Column("MaintenanceNotes")]
        public string? MaintenanceNotes { get; set; }

        [MaxLength(200)]
        [Column("Location")]
        public string? Location { get; set; }

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

        [ForeignKey("EquipmentTypeId")]
        public virtual EquipmentType? EquipmentType { get; set; }
    }
}
