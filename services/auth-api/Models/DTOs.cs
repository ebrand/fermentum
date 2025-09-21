namespace Fermentum.Auth.Models.DTOs;

// Authentication DTOs
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? TenantSlug { get; set; }
}

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserInfo User { get; set; } = new();
    public TenantInfo? Tenant { get; set; }
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? InvitationToken { get; set; }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class MagicLinkRequest
{
    public string Email { get; set; } = string.Empty;
    public string? TenantSlug { get; set; }
    public string RedirectUrl { get; set; } = string.Empty;
}

public class VerifyMagicLinkRequest
{
    public string Token { get; set; } = string.Empty;
}

public class OAuthRequest
{
    public string Token { get; set; } = string.Empty;
    public string? TenantSlug { get; set; }
}

// User DTOs
public class UserInfo
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "fermentum-tenant";
    public bool EmailVerified { get; set; }
    public bool IsSystemAdmin { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class UpdateUserRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
}

// Tenant DTOs
public class TenantInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Subdomain { get; set; }
    public string PlanType { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Dictionary<string, object>? Features { get; set; }
    public Dictionary<string, object>? Settings { get; set; }
}

public class CreateTenantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Subdomain { get; set; }
    public string? Domain { get; set; }
    public string PlanType { get; set; } = "trial";
    public string? BillingEmail { get; set; }
    public string Timezone { get; set; } = "UTC";
    public string Locale { get; set; } = "en-US";
}

public class TenantUserInfo
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}

// Invitation DTOs
public class InviteUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "member";
    public string? Message { get; set; }
}

public class AcceptInvitationRequest
{
    public string Token { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}

public class InvitationInfo
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
}

// Payment and Subscription DTOs
public class CreateSubscriptionRequest
{
    public string PaymentMethodId { get; set; } = string.Empty;
    public string PlanType { get; set; } = string.Empty;
    public string BillingEmail { get; set; } = string.Empty;
    public BillingDetails BillingDetails { get; set; } = new();
    public Guid TenantId { get; set; }
}

public class CreateSubscriptionResponse
{
    public bool Success { get; set; }
    public string? SubscriptionId { get; set; }
    public string? CustomerId { get; set; }
    public string? ClientSecret { get; set; }
    public string? Error { get; set; }
    public SubscriptionInfo? Subscription { get; set; }
}

public class BillingDetails
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string Country { get; set; } = "US";
}

public class PaymentMethodInfo
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public CardInfo? Card { get; set; }
}

public class CardInfo
{
    public string Brand { get; set; } = string.Empty;
    public string Last4 { get; set; } = string.Empty;
    public int ExpMonth { get; set; }
    public int ExpYear { get; set; }
}

public class CustomerInfo
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public PaymentMethodInfo? DefaultPaymentMethod { get; set; }
}

public class SubscriptionInfo
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public string PriceId { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Interval { get; set; } = string.Empty;
    public DateTime CurrentPeriodStart { get; set; }
    public DateTime CurrentPeriodEnd { get; set; }
    public DateTime? TrialEnd { get; set; }
    public bool CancelAtPeriodEnd { get; set; }
    public PaymentMethodInfo? DefaultPaymentMethod { get; set; }
}

public class UpdateSubscriptionRequest
{
    public string PriceId { get; set; } = string.Empty;
    public bool ProrateBilling { get; set; } = true;
}

public class CreateCustomerRequest
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public PaymentMethodInfo PaymentMethod { get; set; } = new();
}


public class UpdatePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

// API Response wrappers
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
}

public class ApiResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
}