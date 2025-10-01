using System.ComponentModel.DataAnnotations.Schema;

namespace Fermentum.Auth.Models;

public class Tenant
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? PlanId { get; set; }

    // Stripe billing fields
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public string? SubscriptionStatus { get; set; }
    public string? BillingEmail { get; set; }
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? CurrentPeriodStart { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }

    public DateTime Created { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime Updated { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public virtual Plan? Plan { get; set; }
}

// User class moved to separate User.cs file