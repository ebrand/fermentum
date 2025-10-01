using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models.Inventory
{
    // Enums matching PostgreSQL types
    public enum LotAlertSeverity
    {
        Info,
        Warning,
        Critical,
        Recall
    }

    public enum LotAlertStatus
    {
        Active,
        Acknowledged,
        Resolved,
        Archived
    }

    [Table("LotAlert")]
    public class LotAlert
    {
        [Key]
        public Guid LotAlertId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StockInventoryId { get; set; }

        [Required]
        [StringLength(100)]
        public string LotNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string AlertType { get; set; } = string.Empty; // e.g., 'Contamination', 'Recall', 'Quality Issue'

        [Required]
        public LotAlertSeverity Severity { get; set; } = LotAlertSeverity.Warning;

        [Required]
        public LotAlertStatus Status { get; set; } = LotAlertStatus.Active;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [StringLength(200)]
        public string? SupplierName { get; set; }

        [StringLength(100)]
        public string? SupplierReference { get; set; }

        [Column(TypeName = "text[]")]
        public string[]? AffectedBatches { get; set; }

        public string? RecommendedAction { get; set; }

        public DateTime AlertDate { get; set; } = DateTime.UtcNow;

        public DateTime? ExpirationDate { get; set; }

        public Guid? AcknowledgedBy { get; set; }

        public DateTime? AcknowledgedDate { get; set; }

        public Guid? ResolvedBy { get; set; }

        public DateTime? ResolvedDate { get; set; }

        public string? ResolutionNotes { get; set; }

        [StringLength(500)]
        public string? SourceUrl { get; set; }

        public string? InternalNotes { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("StockInventoryId")]
        public virtual StockInventory? StockInventory { get; set; }

        [ForeignKey("AcknowledgedBy")]
        public virtual User? AcknowledgedByUser { get; set; }

        [ForeignKey("ResolvedBy")]
        public virtual User? ResolvedByUser { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User? Creator { get; set; }

        [ForeignKey("UpdatedBy")]
        public virtual User? Updater { get; set; }

        public virtual ICollection<LotAlertDocument>? Documents { get; set; }
    }

    [Table("LotAlertDocument")]
    public class LotAlertDocument
    {
        [Key]
        public Guid LotAlertDocumentId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid LotAlertId { get; set; }

        [Required]
        [StringLength(50)]
        public string DocumentType { get; set; } = string.Empty; // e.g., 'PDF', 'Image', 'Email'

        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string FileUrl { get; set; } = string.Empty;

        public int? FileSize { get; set; }

        [StringLength(100)]
        public string? MimeType { get; set; }

        public string? Description { get; set; }

        [Required]
        public Guid UploadedBy { get; set; }

        public DateTime UploadedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("LotAlertId")]
        public virtual LotAlert? LotAlert { get; set; }

        [ForeignKey("UploadedBy")]
        public virtual User? Uploader { get; set; }
    }

    // DTOs for API responses
    public class LotAlertDto
    {
        public Guid LotAlertId { get; set; }
        public Guid StockInventoryId { get; set; }
        public string LotNumber { get; set; } = string.Empty;
        public string AlertType { get; set; } = string.Empty;
        public LotAlertSeverity Severity { get; set; }
        public LotAlertStatus Status { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? SupplierName { get; set; }
        public string? SupplierReference { get; set; }
        public string[]? AffectedBatches { get; set; }
        public string? RecommendedAction { get; set; }
        public DateTime AlertDate { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public Guid? AcknowledgedBy { get; set; }
        public DateTime? AcknowledgedDate { get; set; }
        public Guid? ResolvedBy { get; set; }
        public DateTime? ResolvedDate { get; set; }
        public string? ResolutionNotes { get; set; }
        public string? SourceUrl { get; set; }
        public string? InternalNotes { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
        public List<LotAlertDocumentDto>? Documents { get; set; }
    }

    public class LotAlertDocumentDto
    {
        public Guid LotAlertDocumentId { get; set; }
        public Guid LotAlertId { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public int? FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? Description { get; set; }
        public Guid UploadedBy { get; set; }
        public DateTime UploadedDate { get; set; }
    }

    public class CreateLotAlertDto
    {
        [Required]
        public Guid StockInventoryId { get; set; }

        [Required]
        [StringLength(100)]
        public string LotNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string AlertType { get; set; } = string.Empty;

        [Required]
        public LotAlertSeverity Severity { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [StringLength(200)]
        public string? SupplierName { get; set; }

        [StringLength(100)]
        public string? SupplierReference { get; set; }

        public string[]? AffectedBatches { get; set; }

        public string? RecommendedAction { get; set; }

        public DateTime? AlertDate { get; set; }

        public DateTime? ExpirationDate { get; set; }

        [StringLength(500)]
        public string? SourceUrl { get; set; }

        public string? InternalNotes { get; set; }
    }

    public class UpdateLotAlertDto
    {
        public LotAlertStatus? Status { get; set; }

        [StringLength(200)]
        public string? Title { get; set; }

        public string? Description { get; set; }

        public string? RecommendedAction { get; set; }

        public DateTime? ExpirationDate { get; set; }

        public string? ResolutionNotes { get; set; }

        public string? InternalNotes { get; set; }
    }

    public class AcknowledgeLotAlertDto
    {
        public string? Notes { get; set; }
    }

    public class ResolveLotAlertDto
    {
        [Required]
        public string ResolutionNotes { get; set; } = string.Empty;
    }

    // Summary DTO for displaying in lot availability checker
    public class LotAlertSummaryDto
    {
        public Guid LotAlertId { get; set; }
        public string LotNumber { get; set; } = string.Empty;
        public string AlertType { get; set; } = string.Empty;
        public LotAlertSeverity Severity { get; set; }
        public LotAlertStatus Status { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime AlertDate { get; set; }
        public bool IsActive => Status == LotAlertStatus.Active;
    }
}
