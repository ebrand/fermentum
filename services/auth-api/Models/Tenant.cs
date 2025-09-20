namespace Fermentum.Auth.Models;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Subdomain { get; set; }
    public string? Domain { get; set; }
    public string PlanType { get; set; } = "trial";
    public string SubscriptionStatus { get; set; } = "active";
    public string? BillingEmail { get; set; }
    public string SchemaName { get; set; } = string.Empty;
    public string? DatabaseName { get; set; }
    public string Timezone { get; set; } = "UTC";
    public string Locale { get; set; } = "en-US";
    public string? Features { get; set; } // JSON
    public string? Settings { get; set; } // JSON
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public bool IsActive { get; set; } = true;
}

public class User
{
    public Guid Id { get; set; }
    public string? StytchUserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = "fermentum-tenant"; // Default role for new users
    public bool IsSystemAdmin { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public class TenantUser
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "member";
    public string? Permissions { get; set; } // JSON
    public string Status { get; set; } = "active";
    public Guid? InvitedBy { get; set; }
    public DateTime? InvitedAt { get; set; }
    public DateTime? JoinedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? TenantRoleId { get; set; } // Reference to tenant_roles table
}

public class Invitation
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "member";
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public Guid? AcceptedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
}

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? ResourceType { get; set; }
    public string? ResourceId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? RequestId { get; set; }
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    public string? Metadata { get; set; } // JSON
    public DateTime CreatedAt { get; set; }
}