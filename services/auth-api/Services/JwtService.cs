using Fermentum.Auth.Configuration;
using Fermentum.Auth.Data;
using Fermentum.Auth.Models;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Fermentum.Auth.Services;

public class JwtService : IJwtService
{
    private readonly JwtOptions _jwtOptions;
    private readonly IDistributedCache _cache;
    private readonly ILogger<JwtService> _logger;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    public JwtService(IOptions<JwtOptions> jwtOptions, IDistributedCache cache, ILogger<JwtService> logger)
    {
        _jwtOptions = jwtOptions.Value;
        _cache = cache;
        _logger = logger;
        _tokenHandler = new JwtSecurityTokenHandler();
    }

    public string GenerateAccessToken(User user, Tenant? tenant = null, string? role = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new("user_id", user.Id.ToString()),
            new("email", user.Email),
            new("email_verified", user.EmailVerified.ToString().ToLower()),
            new("is_system_admin", user.IsSystemAdmin.ToString().ToLower())
        };

        // Add name claims if available
        if (!string.IsNullOrEmpty(user.FirstName))
            claims.Add(new(ClaimTypes.GivenName, user.FirstName));

        if (!string.IsNullOrEmpty(user.LastName))
            claims.Add(new(ClaimTypes.Surname, user.LastName));

        if (!string.IsNullOrEmpty(user.DisplayName))
            claims.Add(new("display_name", user.DisplayName));

        // Add Stytch user ID for external integrations
        if (!string.IsNullOrEmpty(user.StytchUserId))
            claims.Add(new("stytch_user_id", user.StytchUserId));

        // Add tenant information if provided
        if (tenant != null)
        {
            claims.Add(new("tenant_id", tenant.Id.ToString()));
            claims.Add(new("tenant_slug", tenant.Slug));
            claims.Add(new("tenant_name", tenant.Name));
            claims.Add(new("schema_name", tenant.SchemaName));

            if (!string.IsNullOrEmpty(tenant.Subdomain))
                claims.Add(new("subdomain", tenant.Subdomain));

            claims.Add(new("plan_type", tenant.PlanType));

            // Add tenant features as individual claims for easy access
            if (!string.IsNullOrEmpty(tenant.Features))
            {
                try
                {
                    var features = JsonSerializer.Deserialize<Dictionary<string, object>>(tenant.Features);
                    if (features != null)
                    {
                        foreach (var feature in features)
                        {
                            claims.Add(new($"feature:{feature.Key}", feature.Value.ToString() ?? "false"));
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse tenant features for tenant {TenantId}", tenant.Id);
                }
            }
        }

        // Add user role (fermentum-tenant role)
        if (!string.IsNullOrEmpty(user.Role))
        {
            claims.Add(new(ClaimTypes.Role, user.Role));
            claims.Add(new("role", user.Role));
        }

        // Add tenant role if provided (for tenant-specific permissions)
        if (!string.IsNullOrEmpty(role))
        {
            claims.Add(new("tenant_role", role));
        }

        // Add issued at and expiration time
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(_jwtOptions.ExpiryMinutes);

        claims.Add(new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64));
        claims.Add(new(JwtRegisteredClaimNames.Exp, new DateTimeOffset(expires).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            SigningCredentials = credentials
        };

        var token = _tokenHandler.CreateToken(tokenDescriptor);
        return _tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public bool ValidateToken(string token)
    {
        try
        {
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _jwtOptions.Issuer,
                ValidAudience = _jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey)),
                ClockSkew = TimeSpan.Zero
            };

            _tokenHandler.ValidateToken(token, validationParameters, out _);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Token validation failed");
            return false;
        }
    }

    public Dictionary<string, object>? GetClaimsFromToken(string token)
    {
        try
        {
            var jsonToken = _tokenHandler.ReadJwtToken(token);
            var claims = new Dictionary<string, object>();

            foreach (var claim in jsonToken.Claims)
            {
                // Handle multiple claims with the same type (store as array)
                if (claims.ContainsKey(claim.Type))
                {
                    if (claims[claim.Type] is string existingValue)
                    {
                        claims[claim.Type] = new[] { existingValue, claim.Value };
                    }
                    else if (claims[claim.Type] is string[] existingArray)
                    {
                        var newArray = new string[existingArray.Length + 1];
                        existingArray.CopyTo(newArray, 0);
                        newArray[existingArray.Length] = claim.Value;
                        claims[claim.Type] = newArray;
                    }
                }
                else
                {
                    claims[claim.Type] = claim.Value;
                }
            }

            return claims;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to extract claims from token");
            return null;
        }
    }

    public async Task StoreRefreshTokenAsync(Guid userId, string refreshToken, DateTime expiresAt)
    {
        var key = $"refresh_token:{refreshToken}";
        var value = JsonSerializer.Serialize(new
        {
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt
        });

        await _cache.SetStringAsync(key, value, new DistributedCacheEntryOptions
        {
            AbsoluteExpiration = expiresAt
        });

        // Also store reverse lookup (user -> tokens) for logout all scenarios
        var userTokensKey = $"user_tokens:{userId}";
        var existingTokens = await _cache.GetStringAsync(userTokensKey);

        List<string> tokens;
        if (existingTokens != null)
        {
            tokens = JsonSerializer.Deserialize<List<string>>(existingTokens) ?? new List<string>();
        }
        else
        {
            tokens = new List<string>();
        }

        tokens.Add(refreshToken);

        await _cache.SetStringAsync(userTokensKey, JsonSerializer.Serialize(tokens), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30) // Keep user token list for 30 days
        });
    }

    public async Task<bool> ValidateRefreshTokenAsync(Guid userId, string refreshToken)
    {
        var key = $"refresh_token:{refreshToken}";
        var value = await _cache.GetStringAsync(key);

        if (value == null)
            return false;

        try
        {
            var tokenData = JsonSerializer.Deserialize<dynamic>(value);
            if (tokenData == null) return false;
            var userIdString = tokenData.GetProperty("UserId").GetString();
            if (string.IsNullOrEmpty(userIdString)) return false;
            var storedUserId = Guid.Parse(userIdString);
            var expiresAt = DateTime.Parse(tokenData.GetProperty("ExpiresAt").GetString() ?? "");

            return storedUserId == userId && expiresAt > DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to validate refresh token {RefreshToken}", refreshToken);
            return false;
        }
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var key = $"refresh_token:{refreshToken}";
        await _cache.RemoveAsync(key);

        // Note: In a more robust implementation, you might want to:
        // 1. Add the token to a blacklist
        // 2. Remove it from the user's token list
        // 3. Log the revocation for audit purposes
    }

    public async Task RevokeAllUserTokensAsync(Guid userId)
    {
        var userTokensKey = $"user_tokens:{userId}";
        var existingTokens = await _cache.GetStringAsync(userTokensKey);

        if (existingTokens != null)
        {
            var tokens = JsonSerializer.Deserialize<List<string>>(existingTokens);
            if (tokens != null)
            {
                foreach (var token in tokens)
                {
                    await RevokeRefreshTokenAsync(token);
                }
            }
        }

        await _cache.RemoveAsync(userTokensKey);
    }
}