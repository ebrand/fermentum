using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Inventory
{
    [Table("StockInventory")]
    public class StockInventory
    {
        [Key]
        public Guid StockInventoryId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StockId { get; set; }

        [StringLength(100)]
        public string? LotNumber { get; set; }

        public DateTime? ReceivedDate { get; set; }

        public DateTime? ExpirationDate { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal QuantityReceived { get; set; } = 0;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal QuantityOnHand { get; set; } = 0;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal QuantityReserved { get; set; } = 0;

        [StringLength(100)]
        public string? PurchaseOrderNumber { get; set; }

        [StringLength(100)]
        public string? InvoiceNumber { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? UnitCostActual { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? TotalCost { get; set; }

        public string? Notes { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("StockId")]
        public virtual Stock? Stock { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User? Creator { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? Updater { get; set; }

        // Computed properties
        [NotMapped]
        public decimal QuantityAvailable => QuantityOnHand - QuantityReserved;
    }

    // DTOs for API responses
    public class StockInventoryDto
    {
        public Guid StockInventoryId { get; set; }
        public Guid StockId { get; set; }
        public string? LotNumber { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public decimal QuantityReceived { get; set; }
        public decimal QuantityOnHand { get; set; }
        public decimal QuantityReserved { get; set; }
        public decimal QuantityAvailable { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public string? InvoiceNumber { get; set; }
        public decimal? UnitCostActual { get; set; }
        public decimal? TotalCost { get; set; }
        public string? Notes { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
    }

    public class CreateStockInventoryDto
    {
        [Required]
        public Guid StockId { get; set; }

        [StringLength(100)]
        public string? LotNumber { get; set; }

        public DateTime? ReceivedDate { get; set; }

        public DateTime? ExpirationDate { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal QuantityReceived { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal QuantityOnHand { get; set; }

        [StringLength(100)]
        public string? PurchaseOrderNumber { get; set; }

        [StringLength(100)]
        public string? InvoiceNumber { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? UnitCostActual { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? TotalCost { get; set; }

        public string? Notes { get; set; }
    }

    public class UpdateStockInventoryDto
    {
        [StringLength(100)]
        public string? LotNumber { get; set; }

        public DateTime? ReceivedDate { get; set; }

        public DateTime? ExpirationDate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? QuantityOnHand { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? QuantityReserved { get; set; }

        [StringLength(100)]
        public string? PurchaseOrderNumber { get; set; }

        [StringLength(100)]
        public string? InvoiceNumber { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? UnitCostActual { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? TotalCost { get; set; }

        public string? Notes { get; set; }
    }
}