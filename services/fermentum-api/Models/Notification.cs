using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Fermentum.Auth.Models;

namespace FermentumApi.Models;

[Table("Notification", Schema = "public")]
public class Notification
{
    [Key]
    [Column("NotificationId")]
    public Guid NotificationId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("TenantId")]
    public Guid TenantId { get; set; }

    [Required]
    [Column("UserId")]
    public Guid UserId { get; set; }

    [Required]
    [Column("Type")]
    [StringLength(100)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [Column("Title")]
    [StringLength(300)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column("Message")]
    public string Message { get; set; } = string.Empty;

    [Column("Data", TypeName = "jsonb")]
    [JsonPropertyName("data")]
    public string? Data { get; set; }

    [Required]
    [Column("Priority")]
    [StringLength(20)]
    public string Priority { get; set; } = "info";

    [Required]
    [Column("Category")]
    [StringLength(50)]
    public string Category { get; set; } = "general";

    [Column("Source")]
    [StringLength(100)]
    public string? Source { get; set; }

    [Column("ActionRequired")]
    public bool ActionRequired { get; set; } = false;

    [Column("ActionUrl")]
    [StringLength(500)]
    public string? ActionUrl { get; set; }

    [Column("ExpiresAt")]
    public DateTime? ExpiresAt { get; set; }

    [Column("IsRead")]
    public bool IsRead { get; set; } = false;

    [Column("ReadAt")]
    public DateTime? ReadAt { get; set; }

    [Column("IsAcknowledged")]
    public bool IsAcknowledged { get; set; } = false;

    [Column("AcknowledgedAt")]
    public DateTime? AcknowledgedAt { get; set; }

    // Broadcast notification support
    [Column("IsBroadcast")]
    public bool IsBroadcast { get; set; } = true;

    [Column("BroadcastRoles", TypeName = "text[]")]
    public string[]? BroadcastRoles { get; set; }

    [Column("SharedAcknowledgment")]
    public bool SharedAcknowledgment { get; set; } = false;

    [Column("AcknowledgedByUserId")]
    public Guid? AcknowledgedByUserId { get; set; }

    [Column("Created")]
    public DateTime Created { get; set; } = DateTime.UtcNow;

    [Column("Updated")]
    public DateTime Updated { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("TenantId")]
    public virtual Tenant? Tenant { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}

[Table("NotificationEventListener", Schema = "public")]
public class NotificationEventListener
{
    [Key]
    [Column("EventListenerId")]
    public Guid EventListenerId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("TenantId")]
    public Guid TenantId { get; set; }

    [Required]
    [Column("EventType")]
    [StringLength(100)]
    public string EventType { get; set; } = string.Empty;

    [Required]
    [Column("NotificationType")]
    [StringLength(100)]
    public string NotificationType { get; set; } = string.Empty;

    [Column("IsEnabled")]
    public bool IsEnabled { get; set; } = true;

    [Column("Configuration", TypeName = "jsonb")]
    public string? Configuration { get; set; }

    [Column("Created")]
    public DateTime Created { get; set; } = DateTime.UtcNow;

    [Column("Updated")]
    public DateTime Updated { get; set; } = DateTime.UtcNow;

    [Required]
    [Column("CreatedBy")]
    public Guid CreatedBy { get; set; }

    [Required]
    [Column("UpdatedBy")]
    public Guid UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("TenantId")]
    public virtual Tenant? Tenant { get; set; }

    [ForeignKey("CreatedBy")]
    public virtual User? CreatedByUser { get; set; }

    [ForeignKey("UpdatedBy")]
    public virtual User? UpdatedByUser { get; set; }
}

[Table("NotificationDeliveryLog", Schema = "public")]
public class NotificationDeliveryLog
{
    [Key]
    [Column("DeliveryLogId")]
    public Guid DeliveryLogId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("NotificationId")]
    public Guid NotificationId { get; set; }

    [Required]
    [Column("DeliveryMethod")]
    [StringLength(20)]
    public string DeliveryMethod { get; set; } = "in-app";

    [Required]
    [Column("DeliveryStatus")]
    [StringLength(20)]
    public string DeliveryStatus { get; set; } = "pending";

    [Column("RecipientAddress")]
    [StringLength(500)]
    public string? RecipientAddress { get; set; }

    [Column("AttemptCount")]
    public int AttemptCount { get; set; } = 1;

    [Column("LastAttemptAt")]
    public DateTime LastAttemptAt { get; set; } = DateTime.UtcNow;

    [Column("DeliveredAt")]
    public DateTime? DeliveredAt { get; set; }

    [Column("ErrorMessage")]
    public string? ErrorMessage { get; set; }

    [Column("ResponseData", TypeName = "jsonb")]
    public string? ResponseData { get; set; }

    [Column("Created")]
    public DateTime Created { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("NotificationId")]
    public virtual Notification? Notification { get; set; }
}

[Table("User_NotificationStatus", Schema = "public")]
public class UserNotificationStatus
{
    [Key]
    [Column("StatusId")]
    public Guid StatusId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("NotificationId")]
    public Guid NotificationId { get; set; }

    [Required]
    [Column("UserId")]
    public Guid UserId { get; set; }

    [Required]
    [Column("TenantId")]
    public Guid TenantId { get; set; }

    [Column("IsRead")]
    public bool IsRead { get; set; } = false;

    [Column("ReadAt")]
    public DateTime? ReadAt { get; set; }

    [Column("IsDismissed")]
    public bool IsDismissed { get; set; } = false;

    [Column("DismissedAt")]
    public DateTime? DismissedAt { get; set; }

    [Column("Created")]
    public DateTime Created { get; set; } = DateTime.UtcNow;

    [Column("Updated")]
    public DateTime Updated { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("NotificationId")]
    public virtual Notification? Notification { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("TenantId")]
    public virtual Tenant? Tenant { get; set; }
}

// DTO models for API responses
public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Source { get; set; }
    public bool ActionRequired { get; set; }
    public string? ActionUrl { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsAcknowledged { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public bool IsBroadcast { get; set; }
    public string[]? BroadcastRoles { get; set; }
    public bool SharedAcknowledgment { get; set; }
    public Guid? AcknowledgedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNotificationRequest
{
    [Required]
    public string Type { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    public object? Data { get; set; }
    public string? Source { get; set; }
    public string? ActionUrl { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool BypassRoleFilter { get; set; } = false;
}

public class NotificationCountsDto
{
    public int Total { get; set; }
    public int Unread { get; set; }
    public int ActionRequired { get; set; }
    public int Critical { get; set; }
    public int High { get; set; }
}