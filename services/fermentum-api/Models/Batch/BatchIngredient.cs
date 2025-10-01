using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Batch
{
    [Table("BatchIngredient")]
    public class BatchIngredient
    {
        [Key]
        [Column("BatchIngredientId")]
        public Guid BatchIngredientId { get; set; }

        [Required]
        [Column("BatchId")]
        public Guid BatchId { get; set; }

        [Column("StockId")]
        public Guid? StockId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("IngredientName")]
        public string IngredientName { get; set; } = string.Empty;

        [Required]
        [Column("PlannedQuantity")]
        public decimal PlannedQuantity { get; set; }

        [Column("ActualQuantity")]
        public decimal? ActualQuantity { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("Unit")]
        public string Unit { get; set; } = string.Empty;

        [Column("StartedFlag")]
        public bool StartedFlag { get; set; }

        [Column("Notes")]
        public string? Notes { get; set; }

        [Column("Created")]
        public DateTime Created { get; set; }

        [Column("CreatedBy")]
        public Guid? CreatedBy { get; set; }

        [Column("Updated")]
        public DateTime Updated { get; set; }

        [Column("UpdatedBy")]
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("BatchId")]
        public virtual Batch? Batch { get; set; }
    }
}
