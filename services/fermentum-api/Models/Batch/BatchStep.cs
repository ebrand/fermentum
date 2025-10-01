using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Batch
{
    [Table("BatchStep")]
    public class BatchStep
    {
        [Key]
        [Column("BatchStepId")]
        public Guid BatchStepId { get; set; }

        [Required]
        [Column("BatchId")]
        public Guid BatchId { get; set; }

        [Column("EquipmentId")]
        public Guid? EquipmentId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("Name")]
        public string Name { get; set; } = string.Empty;

        [Column("Description")]
        public string? Description { get; set; }

        [Required]
        [Column("StepNumber")]
        public int StepNumber { get; set; }

        [MaxLength(50)]
        [Column("StepType")]
        public string? StepType { get; set; }

        [MaxLength(50)]
        [Column("Status")]
        public string Status { get; set; } = "Not Started";

        [Column("StartedAt", TypeName = "timestamp with time zone")]
        public DateTime? StartedAt { get; set; }

        [Column("CompletedAt", TypeName = "timestamp with time zone")]
        public DateTime? CompletedAt { get; set; }

        [Column("PlannedDuration")]
        public int? PlannedDuration { get; set; }

        [Column("ActualDuration")]
        public int? ActualDuration { get; set; }

        [Column("PlannedTemperature")]
        public decimal? PlannedTemperature { get; set; }

        [Column("ActualTemperature")]
        public decimal? ActualTemperature { get; set; }

        [Column("Notes")]
        public string? Notes { get; set; }

        [Column("IssuesEncountered")]
        public string? IssuesEncountered { get; set; }

        [Column("Created", TypeName = "timestamp with time zone")]
        public DateTime Created { get; set; } = DateTime.UtcNow;

        [Column("CreatedBy")]
        public Guid? CreatedBy { get; set; }

        [Column("Updated", TypeName = "timestamp with time zone")]
        public DateTime Updated { get; set; } = DateTime.UtcNow;

        [Column("UpdatedBy")]
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("BatchId")]
        public virtual Batch? Batch { get; set; }

        [ForeignKey("EquipmentId")]
        public virtual Equipment.Equipment? Equipment { get; set; }
    }
}
