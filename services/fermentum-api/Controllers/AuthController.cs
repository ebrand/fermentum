using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Services;
using Fermentum.Auth.Models.DTOs;
using Fermentum.Auth.Models;
using Fermentum.Auth.Data;
using System.ComponentModel.DataAnnotations;

namespace Fermentum.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IStytchService _stytchService;
    private readonly IJwtService _jwtService;
    private readonly AuthDbContext _context;

    public AuthController(ILogger<AuthController> logger, IStytchService stytchService, IJwtService jwtService, AuthDbContext context)
    {
        _logger = logger;
        _stytchService = stytchService;
        _jwtService = jwtService;
        _context = context;
    }

    [HttpGet("debug")]
    public ActionResult<string> Debug()
    {
        return Ok("AuthController is working!");
    }


    [HttpGet("google-oauth-url")]
    public ActionResult GetGoogleOAuthUrl([FromQuery] string redirectUrl)
    {
        try
        {
            _logger.LogInformation("🚀 STYTCH: AuthController Google OAuth endpoint called for redirect: {RedirectUrl}", redirectUrl);
            _logger.LogInformation("🚀 STYTCH: StytchService instance: {ServiceType}", _stytchService?.GetType().Name ?? "NULL");

            if (_stytchService == null)
            {
                _logger.LogError("🚨 STYTCH: StytchService is null!");
                return StatusCode(500, new
                {
                    success = false,
                    message = "StytchService not available"
                });
            }

            var stytchOAuthUrl = _stytchService.GetGoogleOAuthUrl(redirectUrl);
            _logger.LogInformation("🚀 STYTCH: Generated OAuth URL: {OAuthUrl}", stytchOAuthUrl);

            return Ok(new
            {
                success = true,
                data = stytchOAuthUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "🚨 STYTCH: Error generating Google OAuth URL");
            return StatusCode(500, new
            {
                success = false,
                message = "Failed to generate OAuth URL"
            });
        }
    }

    [HttpGet("apple-oauth-url")]
    public ActionResult GetAppleOAuthUrl([FromQuery] string redirectUrl)
    {
        try
        {
            _logger.LogInformation("🚀 STYTCH: Generating Apple OAuth URL for redirect: {RedirectUrl}", redirectUrl);

            var stytchOAuthUrl = _stytchService.GetAppleOAuthUrl(redirectUrl);

            return Ok(new
            {
                success = true,
                data = stytchOAuthUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating Apple OAuth URL");
            return StatusCode(500, new
            {
                success = false,
                message = "Failed to generate OAuth URL"
            });
        }
    }

    [HttpPost("oauth")]
    public async Task<ActionResult> AuthenticateOAuth([FromBody] OAuthRequest request)
    {
        try
        {
            _logger.LogInformation("🚀 AUTH: OAuth authentication endpoint called with token (length: {Length})", request?.Token?.Length ?? 0);

            if (string.IsNullOrEmpty(request?.Token))
            {
                _logger.LogWarning("❌ AUTH: OAuth token is null or empty");
                return BadRequest(new
                {
                    success = false,
                    message = "OAuth token is required"
                });
            }

            // Use StytchService to authenticate the OAuth token
            _logger.LogInformation("🔐 AUTH: Calling StytchService.AuthenticateWithOAuthAsync");
            var stytchResult = await _stytchService.AuthenticateWithOAuthAsync(request.Token);
            _logger.LogInformation("🔐 AUTH: StytchService returned - IsSuccess: {IsSuccess}, Error: {Error}", stytchResult.IsSuccess, stytchResult.Error);

            if (!stytchResult.IsSuccess || stytchResult.User == null)
            {
                _logger.LogWarning("❌ AUTH: Stytch OAuth authentication failed: {Error}", stytchResult.Error);
                return Unauthorized(new
                {
                    success = false,
                    message = stytchResult.Error ?? "OAuth authentication failed"
                });
            }

            var stytchUser = stytchResult.User;
            _logger.LogInformation("OAuth authentication successful for user: {Email}", stytchUser.Email);

            // Find existing user or create new one
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == stytchUser.Email);

            if (user == null)
            {
                // Create new user
                user = new User
                {
                    UserId = Guid.NewGuid(),
                    StytchUserId = stytchUser.UserId,
                    Email = stytchUser.Email,
                    FirstName = stytchUser.FirstName,
                    LastName = stytchUser.LastName,
                    OauthType = "google" // Could be dynamic based on OAuth provider
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🔍 DEBUG: Created new user - UserId: {UserId}, Email: {Email}, FirstName: {FirstName}, LastName: {LastName}",
                    user.UserId, user.Email, user.FirstName, user.LastName);
            }
            else
            {
                // Update existing user with latest OAuth data if fields are missing
                bool shouldUpdate = false;

                if (string.IsNullOrEmpty(user.FirstName) && !string.IsNullOrEmpty(stytchUser.FirstName))
                {
                    user.FirstName = stytchUser.FirstName;
                    shouldUpdate = true;
                }

                if (string.IsNullOrEmpty(user.LastName) && !string.IsNullOrEmpty(stytchUser.LastName))
                {
                    user.LastName = stytchUser.LastName;
                    shouldUpdate = true;
                }

                if (string.IsNullOrEmpty(user.StytchUserId) && !string.IsNullOrEmpty(stytchUser.UserId))
                {
                    user.StytchUserId = stytchUser.UserId;
                    shouldUpdate = true;
                }

                if (shouldUpdate)
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("🔍 DEBUG: Updated existing user with OAuth data - UserId: {UserId}, Email: {Email}",
                        user.UserId, user.Email);
                }
                else
                {
                    _logger.LogInformation("🔍 DEBUG: Found existing user - UserId: {UserId}, Email: {Email}, FirstName: {FirstName}, LastName: {LastName}",
                        user.UserId, user.Email, user.FirstName, user.LastName);
                }
            }

            // Generate proper JWT tokens
            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Store the refresh token with 30 day expiration
            var refreshTokenExpiry = DateTime.UtcNow.AddDays(30);
            await _jwtService.StoreRefreshTokenAsync(user.UserId, refreshToken, refreshTokenExpiry);

            _logger.LogInformation("Generated JWT tokens for user: {Email}", stytchUser.Email);

            return Ok(new
            {
                success = true,
                data = new
                {
                    user = new
                    {
                        id = stytchUser.UserId,
                        email = stytchUser.Email,
                        firstName = stytchUser.FirstName,
                        lastName = stytchUser.LastName,
                        displayName = $"{stytchUser.FirstName} {stytchUser.LastName}".Trim(),
                        verified = stytchUser.EmailVerified
                    },
                    accessToken = accessToken,
                    refreshToken = refreshToken
                },
                message = "OAuth authentication successful"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during OAuth authentication");
            return StatusCode(500, new
            {
                success = false,
                message = "OAuth authentication failed"
            });
        }
    }

    [HttpGet("oauth-callback")]
    public ActionResult HandleOAuthCallback([FromQuery] string code, [FromQuery] string state)
    {
        try
        {
            _logger.LogInformation("🚀 AUTH: Handling OAuth callback with code: {Code}, state: {State}", code, state);

            // For demo purposes, create a mock user from the OAuth response
            var mockUser = new
            {
                id = Guid.NewGuid().ToString(),
                email = "demo.user@fermentum.dev",
                firstName = "Demo",
                lastName = "User",
                displayName = "Demo User",
                verified = true
            };

            // Create a mock JWT token for the session
            var mockToken = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{{\"userId\":\"{mockUser.id}\",\"email\":\"{mockUser.email}\",\"exp\":{DateTimeOffset.UtcNow.AddHours(24).ToUnixTimeSeconds()}}}"));

            return Ok(new
            {
                success = true,
                data = new
                {
                    user = mockUser,
                    accessToken = $"mock_token_{mockToken}",
                    refreshToken = $"refresh_{Guid.NewGuid():N}"
                },
                message = "OAuth authentication successful (demo mode)"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling OAuth callback");
            return StatusCode(500, new
            {
                success = false,
                message = "OAuth callback failed"
            });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            _logger.LogInformation("🔄 AUTH: Token refresh endpoint called");

            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                _logger.LogWarning("Empty refresh token provided");
                return BadRequest(new
                {
                    success = false,
                    message = "Refresh token is required"
                });
            }

            // Extract user ID from the stored refresh token
            var refreshTokenKey = $"refresh_token:{request.RefreshToken}";

            // For now, we need to find the user associated with this refresh token
            // In a more robust implementation, we'd store the mapping differently
            var users = await _context.Users.ToListAsync();
            User? tokenUser = null;

            foreach (var user in users)
            {
                if (await _jwtService.ValidateRefreshTokenAsync(user.UserId, request.RefreshToken))
                {
                    tokenUser = user;
                    break;
                }
            }

            if (tokenUser == null)
            {
                _logger.LogWarning("Invalid or expired refresh token provided");
                return Unauthorized(new
                {
                    success = false,
                    message = "Invalid or expired refresh token"
                });
            }

            _logger.LogInformation("🔄 AUTH: Valid refresh token found for user {UserId}", tokenUser.UserId);

            // Generate new access token
            var newAccessToken = _jwtService.GenerateAccessToken(tokenUser);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            // Store the new refresh token and set expiration
            var refreshTokenExpiry = DateTime.UtcNow.AddDays(30); // 30 day refresh token lifetime
            await _jwtService.StoreRefreshTokenAsync(tokenUser.UserId, newRefreshToken, refreshTokenExpiry);

            // Optionally revoke the old refresh token
            await _jwtService.RevokeRefreshTokenAsync(request.RefreshToken);

            _logger.LogInformation("🔄 AUTH: New tokens generated for user {Email}", tokenUser.Email);

            return Ok(new
            {
                success = true,
                data = new
                {
                    accessToken = newAccessToken,
                    refreshToken = newRefreshToken,
                    user = new
                    {
                        id = tokenUser.UserId.ToString(),
                        email = tokenUser.Email,
                        firstName = tokenUser.FirstName,
                        lastName = tokenUser.LastName,
                        displayName = $"{tokenUser.FirstName} {tokenUser.LastName}".Trim(),
                        verified = true
                    }
                },
                message = "Token refresh successful"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new
            {
                success = false,
                message = "Token refresh failed"
            });
        }
    }
}

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

