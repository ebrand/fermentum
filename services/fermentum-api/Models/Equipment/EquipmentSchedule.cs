using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Equipment
{
    [Table("EquipmentSchedule")]
    public class EquipmentSchedule
    {
        [Key]
        [Column("EquipmentScheduleId")]
        public Guid EquipmentScheduleId { get; set; }

        [Required]
        [Column("EquipmentId")]
        public Guid EquipmentId { get; set; }

        [Column("BatchId")]
        public Guid? BatchId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("Status")]
        public string Status { get; set; } = string.Empty;

        [Required]
        [Column("StartDateTime")]
        public DateTime StartDateTime { get; set; }

        [Required]
        [Column("EndDateTime")]
        public DateTime EndDateTime { get; set; }

        [Column("Notes")]
        public string? Notes { get; set; }

        [Column("Created")]
        public DateTime Created { get; set; }

        [Column("CreatedBy")]
        public Guid? CreatedBy { get; set; }

        // Navigation properties
        [ForeignKey("EquipmentId")]
        public virtual Equipment? Equipment { get; set; }
    }
}
