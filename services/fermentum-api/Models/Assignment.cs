using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;
using Fermentum.Auth.Models;

namespace FermentumApi.Models
{
    [Table("Assignment")]
    public class Assignment
    {
        [Key]
        public Guid AssignmentId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        public Guid? BreweryId { get; set; }

        public Guid? CategoryId { get; set; }

        // Basic assignment info
        [StringLength(200)]
        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Instructions { get; set; }

        [StringLength(20)]
        [Required]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public AssignmentPriority Priority { get; set; } = AssignmentPriority.Medium;

        [StringLength(20)]
        [Required]
        public AssignmentStatus Status { get; set; } = AssignmentStatus.Pending;

        // Assignment lifecycle
        [Required]
        public Guid AssignedBy { get; set; }

        public Guid? AssignedTo { get; set; }

        public DateTime? DueDate { get; set; }

        public int? EstimatedDurationMinutes { get; set; }

        public DateTime? ActualStartTime { get; set; }

        public DateTime? ActualCompletionTime { get; set; }

        // Location/context
        [StringLength(200)]
        public string? Location { get; set; }

        public Guid? EquipmentId { get; set; }

        public Guid? BatchId { get; set; }

        // Assignment workflow
        public bool RequiresConfirmation { get; set; } = false;

        public DateTime? ConfirmedAt { get; set; }

        public bool RequiresPhotos { get; set; } = false;

        public bool RequiresSignoff { get; set; } = false;

        public Guid? SignedOffBy { get; set; }

        public DateTime? SignedOffAt { get; set; }

        // Completion data
        public string? CompletionNotes { get; set; }

        [Column(TypeName = "text[]")]
        public string[]? PhotoUrls { get; set; }

        // Recurring assignment support
        public bool IsRecurring { get; set; } = false;

        [Column(TypeName = "jsonb")]
        public string? RecurrencePattern { get; set; }

        public Guid? ParentAssignmentId { get; set; }

        // Metadata
        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        public virtual Tenant? Tenant { get; set; }
        public virtual AssignmentCategory? Category { get; set; }
        public virtual User? AssignedByUser { get; set; }
        public virtual Employee? AssignedToEmployee { get; set; }
        public virtual User? SignedOffByUser { get; set; }
        public virtual Assignment? ParentAssignment { get; set; }
        public virtual ICollection<Assignment> ChildAssignments { get; set; } = new List<Assignment>();
        public virtual ICollection<AssignmentStatusHistory> StatusHistory { get; set; } = new List<AssignmentStatusHistory>();
        public virtual ICollection<AssignmentComment> Comments { get; set; } = new List<AssignmentComment>();

        // Helper methods
        public RecurrencePatternDto? GetRecurrencePattern()
        {
            if (string.IsNullOrEmpty(RecurrencePattern))
                return null;

            try
            {
                return JsonSerializer.Deserialize<RecurrencePatternDto>(RecurrencePattern);
            }
            catch
            {
                return null;
            }
        }

        public void SetRecurrencePattern(RecurrencePatternDto? pattern)
        {
            RecurrencePattern = pattern == null ? null : JsonSerializer.Serialize(pattern);
        }
    }

    [Table("AssignmentCategory")]
    public class AssignmentCategory
    {
        [Key]
        public Guid CategoryId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [StringLength(100)]
        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [StringLength(7)]
        public string Color { get; set; } = "#3B82F6";

        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        public virtual Tenant? Tenant { get; set; }
        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<AssignmentTemplate> Templates { get; set; } = new List<AssignmentTemplate>();
    }

    [Table("AssignmentStatusHistory")]
    public class AssignmentStatusHistory
    {
        [Key]
        public Guid HistoryId { get; set; }

        [Required]
        public Guid AssignmentId { get; set; }

        public AssignmentStatus? FromStatus { get; set; }

        [Required]
        public AssignmentStatus ToStatus { get; set; }

        [Required]
        public Guid ChangedBy { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Reason { get; set; }

        public string? Notes { get; set; }

        // Navigation properties
        public virtual Assignment? Assignment { get; set; }
        public virtual User? ChangedByUser { get; set; }
    }

    [Table("AssignmentComment")]
    public class AssignmentComment
    {
        [Key]
        public Guid CommentId { get; set; }

        [Required]
        public Guid AssignmentId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string CommentText { get; set; } = string.Empty;

        public bool IsInternal { get; set; } = false;

        [Column(TypeName = "text[]")]
        public string[]? PhotoUrls { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Assignment? Assignment { get; set; }
        public virtual User? User { get; set; }
    }

    [Table("AssignmentTemplate")]
    public class AssignmentTemplate
    {
        [Key]
        public Guid TemplateId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        public Guid? CategoryId { get; set; }

        [StringLength(200)]
        [Required]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Instructions { get; set; }

        public int? EstimatedDurationMinutes { get; set; }

        public AssignmentPriority Priority { get; set; } = AssignmentPriority.Medium;

        public bool RequiresConfirmation { get; set; } = false;

        public bool RequiresPhotos { get; set; } = false;

        public bool RequiresSignoff { get; set; } = false;

        [StringLength(50)]
        public string? DefaultAssigneeRole { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        public virtual Tenant? Tenant { get; set; }
        public virtual AssignmentCategory? Category { get; set; }
    }

    // Enums
    public enum AssignmentPriority
    {
        Low,
        Medium,
        High,
        Urgent
    }

    public enum AssignmentStatus
    {
        Pending,
        Assigned,
        Accepted,
        InProgress,
        Paused,
        Completed,
        Cancelled
    }

    // DTOs
    public class RecurrencePatternDto
    {
        public string Frequency { get; set; } = "daily"; // daily, weekly, monthly
        public int Interval { get; set; } = 1;
        public int[]? DaysOfWeek { get; set; } // 0 = Sunday, 1 = Monday, etc.
        public int? DayOfMonth { get; set; } // For monthly recurrence
        public DateTime? EndDate { get; set; }
        public int? MaxOccurrences { get; set; }
    }

    public class CreateAssignmentRequest
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Instructions { get; set; }

        public AssignmentPriority Priority { get; set; } = AssignmentPriority.Medium;

        public Guid? CategoryId { get; set; }

        public Guid? AssignedTo { get; set; }

        public DateTime? DueDate { get; set; }

        public int? EstimatedDurationMinutes { get; set; }

        public string? Location { get; set; }

        public bool RequiresConfirmation { get; set; } = false;

        public bool RequiresPhotos { get; set; } = false;

        public bool RequiresSignoff { get; set; } = false;

        public bool IsRecurring { get; set; } = false;

        public RecurrencePatternDto? RecurrencePattern { get; set; }

        public Guid? TemplateId { get; set; } // Create from template
    }

    public class UpdateAssignmentRequest
    {
        public string? Title { get; set; }

        public string? Description { get; set; }

        public string? Instructions { get; set; }

        public AssignmentPriority? Priority { get; set; }

        public AssignmentStatus? Status { get; set; }

        public Guid? CategoryId { get; set; }

        public Guid? AssignedTo { get; set; }

        public DateTime? DueDate { get; set; }

        public int? EstimatedDurationMinutes { get; set; }

        public string? Location { get; set; }

        public string? StatusChangeReason { get; set; }

        public string? CompletionNotes { get; set; }

        public string[]? PhotoUrls { get; set; }
    }

    public class AssignmentDto
    {
        public Guid AssignmentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Instructions { get; set; }
        public AssignmentPriority Priority { get; set; }
        public AssignmentStatus Status { get; set; }
        public DateTime? DueDate { get; set; }
        public int? EstimatedDurationMinutes { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualCompletionTime { get; set; }
        public string? Location { get; set; }
        public bool RequiresConfirmation { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public bool RequiresPhotos { get; set; }
        public bool RequiresSignoff { get; set; }
        public DateTime? SignedOffAt { get; set; }
        public string? CompletionNotes { get; set; }
        public string[]? PhotoUrls { get; set; }
        public bool IsRecurring { get; set; }
        public RecurrencePatternDto? RecurrencePattern { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Related entities
        public AssignmentCategoryDto? Category { get; set; }
        public EmployeeDto? AssignedToEmployee { get; set; }
        public UserDto? AssignedByUser { get; set; }
        public UserDto? SignedOffByUser { get; set; }
        public int CommentCount { get; set; }
    }

    public class AssignmentCategoryDto
    {
        public Guid CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = "#3B82F6";
        public bool IsActive { get; set; }
    }

    public class AssignmentSummaryDto
    {
        public int TotalAssignments { get; set; }
        public int PendingAssignments { get; set; }
        public int InProgressAssignments { get; set; }
        public int CompletedToday { get; set; }
        public int OverdueAssignments { get; set; }
        public Dictionary<string, int> AssignmentsByCategory { get; set; } = new();
        public Dictionary<string, int> AssignmentsByPriority { get; set; } = new();
    }

    public class EmployeeDto
    {
        public Guid EmployeeId { get; set; }
        public Guid? UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string FullName => $"{FirstName} {LastName}".Trim();
    }

    public class UserDto
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string DisplayName => !string.IsNullOrEmpty(FirstName) || !string.IsNullOrEmpty(LastName)
            ? $"{FirstName} {LastName}".Trim()
            : Email;
    }
}