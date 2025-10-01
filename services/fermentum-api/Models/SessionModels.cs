using System.ComponentModel.DataAnnotations;

namespace Fermentum.Auth.Models
{
    public class UserSession
    {
        public string UserId { get; set; } = string.Empty;
        public string StytchUserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public List<UserTenantInfo> Tenants { get; set; } = new();
        public string? CurrentTenantId { get; set; }
        public List<UserBreweryInfo> Breweries { get; set; } = new();
        public string? CurrentBreweryId { get; set; }
        public string? CurrentEmployeeId { get; set; } // Employee ID for the current brewery
        public string? AccessToken { get; set; } // JWT token with current tenant info
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class UserTenantInfo
    {
        public string TenantId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty; // Role in this specific tenant
        public bool IsOwner { get; set; }
        public DateTime JoinedAt { get; set; }

        // Plan information
        public string? PlanId { get; set; }
        public string PlanName { get; set; } = "Starter";
        public int BreweryLimit { get; set; } = 1;
        public int UserLimit { get; set; } = 3;

        // Billing information
        public string? SubscriptionStatus { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? CurrentPeriodEnd { get; set; }
    }

    public class UserBreweryInfo
    {
        public string BreweryId { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty; // Which tenant this brewery belongs to
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty; // Role in this specific brewery
        public bool IsOwner { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class SessionRequest
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }

    public class SetCurrentTenantRequest
    {
        [Required]
        public string TenantId { get; set; } = string.Empty;
    }

    public class SetCurrentBreweryRequest
    {
        [Required]
        public string BreweryId { get; set; } = string.Empty;
    }

    public class SessionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public UserSession? Data { get; set; }
    }
}