using Fermentum.Auth.Models;

namespace Fermentum.Auth.Services;

public interface IJwtService
{
    string GenerateAccessToken(User user, Tenant? tenant = null, string? role = null);
    string GenerateRefreshToken();
    bool ValidateToken(string token);
    Dictionary<string, object>? GetClaimsFromToken(string token);
    Task StoreRefreshTokenAsync(Guid userId, string refreshToken, DateTime expiresAt);
    Task<bool> ValidateRefreshTokenAsync(Guid userId, string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
    Task RevokeAllUserTokensAsync(Guid userId);
}