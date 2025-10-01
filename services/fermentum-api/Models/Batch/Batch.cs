using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Batch
{
    [Table("Batch")]
    public class Batch
    {
        [Key]
        [Column("BatchId")]
        public Guid BatchId { get; set; }

        [Required]
        [Column("TenantId")]
        public Guid TenantId { get; set; }

        [Column("BreweryId")]
        public Guid? BreweryId { get; set; }

        [Column("RecipeId")]
        public Guid? RecipeId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("Name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("BatchNumber")]
        public string BatchNumber { get; set; } = string.Empty;

        [Column("Description")]
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("Status")]
        public string Status { get; set; } = string.Empty;

        [Column("StartDate", TypeName = "timestamp with time zone")]
        public DateTime? StartDate { get; set; }

        [Column("CompletedDate", TypeName = "timestamp with time zone")]
        public DateTime? CompletedDate { get; set; }

        [Column("PlannedVolume")]
        public decimal? PlannedVolume { get; set; }

        [MaxLength(20)]
        [Column("PlannedVolumeUnit")]
        public string? PlannedVolumeUnit { get; set; }

        [Column("ActualVolume")]
        public decimal? ActualVolume { get; set; }

        [MaxLength(20)]
        [Column("ActualVolumeUnit")]
        public string? ActualVolumeUnit { get; set; }

        [Column("TargetOG")]
        public decimal? TargetOG { get; set; }

        [Column("ActualOG")]
        public decimal? ActualOG { get; set; }

        [Column("TargetFG")]
        public decimal? TargetFG { get; set; }

        [Column("ActualFG")]
        public decimal? ActualFG { get; set; }

        [Column("TargetABV")]
        public decimal? TargetABV { get; set; }

        [Column("ActualABV")]
        public decimal? ActualABV { get; set; }

        [Column("TargetIBU")]
        public decimal? TargetIBU { get; set; }

        [Column("ActualIBU")]
        public decimal? ActualIBU { get; set; }

        [Column("EstimatedCost")]
        public decimal? EstimatedCost { get; set; }

        [Column("ActualCost")]
        public decimal? ActualCost { get; set; }

        [Column("BrewerId")]
        public Guid? BrewerId { get; set; }

        [Column("AssignedTeam")]
        public Guid[]? AssignedTeam { get; set; }

        [Column("BrewingNotes")]
        public string? BrewingNotes { get; set; }

        [Column("FermentationNotes")]
        public string? FermentationNotes { get; set; }

        [Column("PackagingNotes")]
        public string? PackagingNotes { get; set; }

        [Column("QualityNotes")]
        public string? QualityNotes { get; set; }

        [Column("Created", TypeName = "timestamp with time zone")]
        public DateTime Created { get; set; }

        [Column("CreatedBy")]
        public Guid? CreatedBy { get; set; }

        [Column("Updated", TypeName = "timestamp with time zone")]
        public DateTime Updated { get; set; }

        [Column("UpdatedBy")]
        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant? Tenant { get; set; }

        [ForeignKey("BreweryId")]
        public virtual Brewery? Brewery { get; set; }

        [ForeignKey("RecipeId")]
        public virtual Recipe? Recipe { get; set; }

        [ForeignKey("BrewerId")]
        public virtual User? Brewer { get; set; }
    }
}
