using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Inventory
{
    [Table("Stock")]
    public class Stock
    {
        [Key]
        public Guid StockId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [StringLength(100)]
        public string SKU { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty; // 'Grain', 'Hop', 'Yeast', 'Additive'

        [StringLength(100)]
        public string? Subcategory { get; set; }

        [StringLength(200)]
        public string? Supplier { get; set; }

        [StringLength(100)]
        public string? SupplierSKU { get; set; }

        [Required]
        [StringLength(20)]
        public string UnitOfMeasure { get; set; } = string.Empty; // 'lbs', 'oz', 'g', 'kg', 'pkg', 'vial', 'ml', 'L', etc.

        [Range(0, double.MaxValue)]
        public decimal? UnitCost { get; set; }

        [StringLength(3)]
        public string Currency { get; set; } = "USD";

        [Range(0, double.MaxValue)]
        public decimal? ReorderLevel { get; set; } // Minimum quantity before reorder

        [Range(0, double.MaxValue)]
        public decimal? ReorderQuantity { get; set; } // Quantity to reorder

        public int? LeadTimeDays { get; set; } // Days from order to delivery

        [StringLength(100)]
        public string? StorageLocation { get; set; }

        public string? StorageRequirements { get; set; } // e.g., "Refrigerate", "Keep dry"

        public int? ShelfLifeDays { get; set; } // Days before expiration

        public bool IsActive { get; set; } = true;

        public string? Notes { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant? Tenant { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User? Creator { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? Updater { get; set; }

        public virtual ICollection<StockInventory>? Inventory { get; set; }

        // Computed properties (not mapped to database)
        [NotMapped]
        public decimal TotalQuantityOnHand => Inventory?.Sum(i => i.QuantityOnHand) ?? 0;

        [NotMapped]
        public decimal TotalQuantityReserved => Inventory?.Sum(i => i.QuantityReserved) ?? 0;

        [NotMapped]
        public decimal TotalQuantityAvailable => TotalQuantityOnHand - TotalQuantityReserved;
    }

    // DTOs for API responses
    public class StockDto
    {
        public Guid StockId { get; set; }
        public Guid TenantId { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? Subcategory { get; set; }
        public string? Supplier { get; set; }
        public string? SupplierSKU { get; set; }
        public string UnitOfMeasure { get; set; } = string.Empty;
        public decimal? UnitCost { get; set; }
        public string Currency { get; set; } = "USD";
        public decimal? ReorderLevel { get; set; }
        public decimal? ReorderQuantity { get; set; }
        public int? LeadTimeDays { get; set; }
        public string? StorageLocation { get; set; }
        public string? StorageRequirements { get; set; }
        public int? ShelfLifeDays { get; set; }
        public bool IsActive { get; set; }
        public string? Notes { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Computed quantities from inventory
        public decimal TotalQuantityOnHand { get; set; }
        public decimal TotalQuantityReserved { get; set; }
        public decimal TotalQuantityAvailable { get; set; }
    }

    public class CreateStockDto
    {
        [Required]
        [StringLength(100)]
        public string SKU { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Subcategory { get; set; }

        [StringLength(200)]
        public string? Supplier { get; set; }

        [StringLength(100)]
        public string? SupplierSKU { get; set; }

        [Required]
        [StringLength(20)]
        public string UnitOfMeasure { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal? UnitCost { get; set; }

        [StringLength(3)]
        public string Currency { get; set; } = "USD";

        [Range(0, double.MaxValue)]
        public decimal? ReorderLevel { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? ReorderQuantity { get; set; }

        public int? LeadTimeDays { get; set; }

        [StringLength(100)]
        public string? StorageLocation { get; set; }

        public string? StorageRequirements { get; set; }

        public int? ShelfLifeDays { get; set; }

        public bool IsActive { get; set; } = true;

        public string? Notes { get; set; }
    }

    public class UpdateStockDto : CreateStockDto
    {
        // Inherits all properties from CreateStockDto
    }
}