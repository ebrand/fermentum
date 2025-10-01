using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FermentumApi.Models
{
    [Table("AuditLog")]
    public class AuditLog
    {
        [Key]
        public Guid AuditLogId { get; set; }

        public Guid? TenantId { get; set; }

        public Guid? UserId { get; set; }

        [StringLength(100)]
        [Required]
        public string Action { get; set; } = string.Empty;

        [StringLength(50)]
        public string? ResourceType { get; set; }

        [StringLength(255)]
        public string? ResourceId { get; set; }

        public string? IpAddress { get; set; }

        public string? UserAgent { get; set; }

        [StringLength(100)]
        public string? RequestId { get; set; }

        [Column(TypeName = "jsonb")]
        public string? OldValues { get; set; }

        [Column(TypeName = "jsonb")]
        public string? NewValues { get; set; }

        [Column(TypeName = "jsonb")]
        public string? Metadata { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;
    }
}