using Fermentum.Auth.Models;
using Fermentum.Auth.Models.DTOs;

namespace Fermentum.Auth.Services;

public interface ITenantService
{
    Task<Tenant?> GetTenantBySlugAsync(string slug);
    Task<Tenant?> GetTenantBySubdomainAsync(string subdomain);
    Task<Tenant?> GetTenantByIdAsync(Guid tenantId);
    Task<Tenant?> ResolveTenantFromRequestAsync(HttpContext context);
    Task<TenantInfo?> GetTenantInfoForUserAsync(Guid userId, Guid tenantId);
    Task<List<TenantInfo>> GetUserTenantsAsync(Guid userId);
    Task<Tenant> CreateTenantAsync(CreateTenantRequest request, Guid createdBy);
    Task<bool> UserHasAccessToTenantAsync(Guid userId, Guid tenantId);
    Task<string?> GetUserRoleInTenantAsync(Guid userId, Guid tenantId);
    Task UpdateTenantSubscriptionAsync(Guid tenantId, Guid userId, string stripeCustomerId, string stripeSubscriptionId, string stripePriceId, string planType, string subscriptionStatus, DateTime? currentPeriodStart, DateTime? currentPeriodEnd, DateTime? trialEnd, bool cancelAtPeriodEnd);
}

public interface IAuthService
{
    Task<LoginResponse> LoginWithPasswordAsync(LoginRequest request, HttpContext context);
    Task<LoginResponse> LoginWithMagicLinkAsync(VerifyMagicLinkRequest request, HttpContext context);
    Task<LoginResponse> AuthenticateWithOAuthAsync(OAuthRequest request, HttpContext context);
    Task<ApiResponse> SendMagicLinkAsync(MagicLinkRequest request);
    Task<LoginResponse> RegisterUserAsync(RegisterRequest request, HttpContext context);
    Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ApiResponse> LogoutAsync(string refreshToken);
    Task<User?> GetUserByStytchIdAsync(string stytchUserId);
    Task<User?> GetUserByEmailAsync(string email);
    Task<User> CreateOrUpdateUserFromStytchAsync(StytchUser stytchUser);
    string GetGoogleOAuthUrl(string redirectUrl);
    string GetAppleOAuthUrl(string redirectUrl);
}

public interface IJwtService
{
    string GenerateAccessToken(User user, Tenant? tenant = null, string? role = null);
    string GenerateRefreshToken();
    bool ValidateToken(string token);
    Dictionary<string, object>? GetClaimsFromToken(string token);
    Task StoreRefreshTokenAsync(Guid userId, string refreshToken, DateTime expiresAt);
    Task<bool> ValidateRefreshTokenAsync(Guid userId, string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
}

public interface IUserService
{
    Task<UserInfo?> GetUserInfoAsync(Guid userId);
    Task<UserInfo> UpdateUserAsync(Guid userId, UpdateUserRequest request);
    Task<List<TenantUserInfo>> GetTenantUsersAsync(Guid tenantId);
    Task<ApiResponse> InviteUserAsync(Guid tenantId, InviteUserRequest request, Guid invitedBy);
    Task<LoginResponse> AcceptInvitationAsync(AcceptInvitationRequest request, HttpContext context);
    Task<List<InvitationInfo>> GetPendingInvitationsAsync(Guid tenantId);
    Task<ApiResponse> CancelInvitationAsync(Guid invitationId, Guid cancelledBy);
}