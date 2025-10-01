using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Batch
{
    [Table("BatchMeasurement")]
    public class BatchMeasurement
    {
        [Key]
        [Column("BatchMeasurementId")]
        public Guid BatchMeasurementId { get; set; }

        [Required]
        [Column("BatchId")]
        public Guid BatchId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("MeasurementType")]
        public string MeasurementType { get; set; } = string.Empty;

        [Required]
        [Column("Value")]
        public decimal Value { get; set; }

        [MaxLength(20)]
        [Column("Unit")]
        public string? Unit { get; set; }

        [Column("TargetMin")]
        public decimal? TargetMin { get; set; }

        [Column("TargetMax")]
        public decimal? TargetMax { get; set; }

        [Column("InRange")]
        public bool? InRange { get; set; }

        [Required]
        [Column("MeasurementDateTime")]
        public DateTime MeasurementDateTime { get; set; }

        [Column("MeasuredBy")]
        public Guid? MeasuredBy { get; set; }

        [Column("Notes")]
        public string? Notes { get; set; }

        [Column("Created")]
        public DateTime Created { get; set; }

        [Column("CreatedBy")]
        public Guid? CreatedBy { get; set; }

        // Navigation properties
        [ForeignKey("BatchId")]
        public virtual Batch? Batch { get; set; }

        [ForeignKey("MeasuredBy")]
        public virtual User? MeasuredByUser { get; set; }
    }
}
