using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models
{
    // Raw Material Category
    [Table("RawMaterialCategory")]
    public class RawMaterialCategory
    {
        [Key]
        public Guid CategoryId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? StorageRequirements { get; set; }

        public int? DefaultShelfLifeDays { get; set; }

        [Required]
        [MaxLength(20)]
        public string UnitOfMeasure { get; set; } = string.Empty;

        public DateTime Created { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime Updated { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("CreatedBy")]
        public virtual User? CreatedByUser { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? UpdatedByUser { get; set; }
    }

    // Finished Goods Category
    [Table("FinishedGoodsCategory")]
    public class FinishedGoodsCategory
    {
        [Key]
        public Guid CategoryId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        public virtual ICollection<FinishedGoods> FinishedGoods { get; set; } = new List<FinishedGoods>();
    }

    // Finished Goods
    [Table("FinishedGoods")]
    public class FinishedGoods
    {
        [Key]
        public Guid ProductId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        public Guid? CategoryId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [MaxLength(100)]
        public string? SKU { get; set; }

        [MaxLength(100)]
        public string? BeerStyle { get; set; }

        [Column(TypeName = "decimal(4,2)")]
        public decimal? ABV { get; set; } // Alcohol by volume

        public int? IBU { get; set; } // International Bitterness Units

        [Column(TypeName = "decimal(4,1)")]
        public decimal? SRM { get; set; } // Standard Reference Method (color)

        [Required]
        [MaxLength(50)]
        public string UnitOfMeasure { get; set; } = string.Empty;

        [Column(TypeName = "decimal(8,2)")]
        public decimal? PackageSize { get; set; }

        [MaxLength(50)]
        public string? PackageType { get; set; }

        [Column(TypeName = "decimal(10,4)")]
        public decimal? SellPrice { get; set; }

        [Column(TypeName = "decimal(10,4)")]
        public decimal? CostPerUnit { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal MinimumStock { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; }
        [Required]
        public Guid CreatedBy { get; set; }

        public DateTime Updated { get; set; }
        [Required]
        public Guid UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;

        [ForeignKey("CategoryId")]
        public virtual FinishedGoodsCategory? Category { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User CreatedByUser { get; set; } = null!;

        [ForeignKey("UpdatedBy")]
        public virtual User UpdatedByUser { get; set; } = null!;

        public virtual ICollection<FinishedGoodsInventory> Inventories { get; set; } = new List<FinishedGoodsInventory>();
    }

    // Finished Goods Inventory
    [Table("FinishedGoodsInventory")]
    public class FinishedGoodsInventory
    {
        [Key]
        public Guid InventoryId { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [Required]
        public Guid BreweryId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal CurrentStock { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal ReservedStock { get; set; } = 0;

        // AvailableStock is computed column in database
        [Column(TypeName = "decimal(10,2)")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal AvailableStock { get; set; }

        public DateTime? LastStockTake { get; set; }
        public Guid? LastStockTakeBy { get; set; }

        [MaxLength(100)]
        public string? BatchNumber { get; set; }

        public DateOnly? ExpiryDate { get; set; }

        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        [ForeignKey("ProductId")]
        public virtual FinishedGoods Product { get; set; } = null!;

        [ForeignKey("BreweryId")]
        public virtual Brewery Brewery { get; set; } = null!;

        [ForeignKey("LastStockTakeBy")]
        public virtual User? LastStockTakeByUser { get; set; }
    }

    // === INVENTORY SYSTEM - TO BE REDESIGNED ===
    // The comprehensive raw materials system has been removed due to MaterialId cleanup
    // TODO: Redesign as Stock/StockInventory system

    // Static classes for constants
    public static class TransactionTypes
    {
        public const string RECEIPT = "RECEIPT";
        public const string USAGE = "USAGE";
        public const string ADJUSTMENT = "ADJUSTMENT";
        public const string TRANSFER = "TRANSFER";
        public const string PRODUCTION = "PRODUCTION";
        public const string SALE = "SALE";
    }

    public static class InventoryTransactionTypes
    {
        public const string RECEIPT = "Receipt";
        public const string USAGE = "Usage";
        public const string ADJUSTMENT = "Adjustment";
        public const string TRANSFER = "Transfer";
        public const string WASTE = "Waste";
        public const string RETURN = "Return";
    }

    public static class PurchaseOrderStatuses
    {
        public const string DRAFT = "Draft";
        public const string SENT = "Sent";
        public const string CONFIRMED = "Confirmed";
        public const string DELIVERED = "Delivered";
        public const string CANCELLED = "Cancelled";
    }

    public static class QualityStatuses
    {
        public const string PENDING = "Pending";
        public const string APPROVED = "Approved";
        public const string REJECTED = "Rejected";
        public const string QUARANTINED = "Quarantined";
    }

    public static class InventoryAlertTypes
    {
        public const string LOW_STOCK = "LowStock";
        public const string EXPIRING = "Expiring";
        public const string EXPIRED = "Expired";
        public const string QUALITY_ISSUE = "QualityIssue";
    }

    public static class AlertSeverityLevels
    {
        public const string LOW = "Low";
        public const string MEDIUM = "Medium";
        public const string HIGH = "High";
        public const string CRITICAL = "Critical";
    }
}