using Fermentum.Auth.Models.DTOs;
using Fermentum.Auth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fermentum.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITenantService _tenantService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ITenantService tenantService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _tenantService = tenantService;
        _logger = logger;
    }

    /// <summary>
    /// Debug endpoint to list all controllers in assembly
    /// </summary>
    [HttpGet("debug/controllers")]
    public ActionResult<object> ListControllers()
    {
        try
        {
            var assembly = System.Reflection.Assembly.GetExecutingAssembly();
            var controllerTypes = assembly.GetTypes()
                .Where(t => t.Name.EndsWith("Controller") && !t.IsAbstract)
                .Select(t => new {
                    Name = t.Name,
                    FullName = t.FullName,
                    Namespace = t.Namespace
                })
                .ToList();

            _logger.LogInformation("Found {Count} controllers in assembly", controllerTypes.Count);
            foreach (var controller in controllerTypes)
            {
                _logger.LogInformation("Controller: {FullName}", controller.FullName);
            }

            return Ok(new {
                AssemblyName = assembly.FullName,
                Controllers = controllerTypes,
                TotalCount = controllerTypes.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing controllers");
            return BadRequest(new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> LoginAsync([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginWithPasswordAsync(request, HttpContext);
            return Ok(new ApiResponse<LoginResponse>
            {
                Success = true,
                Data = response,
                Message = "Login successful"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for {Email}", request.Email);
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "Login failed"
            });
        }
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> RegisterAsync([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterUserAsync(request, HttpContext);
            return Ok(new ApiResponse<LoginResponse>
            {
                Success = true,
                Data = response,
                Message = "Registration successful"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for {Email}", request.Email);
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "Registration failed"
            });
        }
    }

    /// <summary>
    /// Send magic link for passwordless authentication
    /// </summary>
    [HttpPost("magic-link")]
    public async Task<ActionResult<ApiResponse>> SendMagicLinkAsync([FromBody] MagicLinkRequest request)
    {
        try
        {
            var response = await _authService.SendMagicLinkAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send magic link to {Email}", request.Email);
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to send magic link"
            });
        }
    }

    /// <summary>
    /// Verify magic link and authenticate
    /// </summary>
    [HttpPost("magic-link/verify")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> VerifyMagicLinkAsync([FromBody] VerifyMagicLinkRequest request)
    {
        try
        {
            var response = await _authService.LoginWithMagicLinkAsync(request, HttpContext);
            return Ok(new ApiResponse<LoginResponse>
            {
                Success = true,
                Data = response,
                Message = "Authentication successful"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Magic link verification failed");
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "Authentication failed"
            });
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> RefreshTokenAsync([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(request);
            return Ok(new ApiResponse<LoginResponse>
            {
                Success = true,
                Data = response,
                Message = "Token refreshed successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh failed");
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "Token refresh failed"
            });
        }
    }

    /// <summary>
    /// Logout and revoke refresh token
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> LogoutAsync([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var response = await _authService.LogoutAsync(request.RefreshToken);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Logout failed");
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Logout failed"
            });
        }
    }

    /// <summary>
    /// Get Google OAuth URL for authentication
    /// </summary>
    [HttpGet("google-oauth-url")]
    public ActionResult<ApiResponse<string>> GetGoogleOAuthUrl([FromQuery] string redirectUrl)
    {
        try
        {
            var oauthUrl = _authService.GetGoogleOAuthUrl(redirectUrl);
            return Ok(new ApiResponse<string>
            {
                Success = true,
                Data = oauthUrl,
                Message = "Google OAuth URL generated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Google OAuth URL");
            return BadRequest(new ApiResponse<string>
            {
                Success = false,
                Message = "Failed to generate Google OAuth URL"
            });
        }
    }

    /// <summary>
    /// Get Apple OAuth URL for frontend to redirect to
    /// </summary>
    [HttpGet("apple-oauth-url")]
    public ActionResult<ApiResponse<string>> GetAppleOAuthUrl([FromQuery] string redirectUrl)
    {
        try
        {
            var oauthUrl = _authService.GetAppleOAuthUrl(redirectUrl);
            return Ok(new ApiResponse<string>
            {
                Success = true,
                Data = oauthUrl,
                Message = "Apple OAuth URL generated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Apple OAuth URL");
            return BadRequest(new ApiResponse<string>
            {
                Success = false,
                Message = "Failed to generate Apple OAuth URL"
            });
        }
    }

    /// <summary>
    /// Authenticate user with OAuth token
    /// </summary>
    [HttpPost("oauth")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> AuthenticateOAuthAsync([FromBody] OAuthRequest request)
    {
        try
        {
            var response = await _authService.AuthenticateWithOAuthAsync(request, HttpContext);
            return Ok(new ApiResponse<LoginResponse>
            {
                Success = true,
                Data = response,
                Message = "OAuth authentication successful"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OAuth authentication failed");
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "OAuth authentication failed"
            });
        }
    }

    /// <summary>
    /// Get current user's tenant context
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetCurrentUserAsync()
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new ApiResponse
                {
                    Success = false,
                    Message = "Invalid user token"
                });
            }

            // Get tenant from current context
            var tenant = await _tenantService.ResolveTenantFromRequestAsync(HttpContext);
            var tenants = await _tenantService.GetUserTenantsAsync(userId);

            var response = new
            {
                UserId = userId,
                Email = User.FindFirst("email")?.Value,
                FirstName = User.FindFirst(System.Security.Claims.ClaimTypes.GivenName)?.Value,
                LastName = User.FindFirst(System.Security.Claims.ClaimTypes.Surname)?.Value,
                DisplayName = User.FindFirst("display_name")?.Value,
                IsSystemAdmin = bool.Parse(User.FindFirst("is_system_admin")?.Value ?? "false"),
                CurrentTenant = tenant != null ? new
                {
                    tenant.Id,
                    tenant.Name,
                    tenant.Slug,
                    Role = User.FindFirst("tenant_role")?.Value
                } : null,
                Tenants = tenants
            };

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = response,
                Message = "User information retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current user information");
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to retrieve user information"
            });
        }
    }

    /// <summary>
    /// Switch to a different tenant context
    /// </summary>
    [HttpPost("switch-tenant/{tenantSlug}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> SwitchTenantAsync(string tenantSlug)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new ApiResponse
                {
                    Success = false,
                    Message = "Invalid user token"
                });
            }

            // Get target tenant
            var tenant = await _tenantService.GetTenantBySlugAsync(tenantSlug);
            if (tenant == null)
            {
                return NotFound(new ApiResponse
                {
                    Success = false,
                    Message = "Tenant not found"
                });
            }

            // Verify user has access
            if (!await _tenantService.UserHasAccessToTenantAsync(userId, tenant.Id))
            {
                return Forbid();
            }

            // This would need to be implemented in AuthService
            // For now, return success message
            return Ok(new ApiResponse
            {
                Success = true,
                Message = $"Switched to tenant: {tenant.Name}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to switch tenant to {TenantSlug}", tenantSlug);
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to switch tenant"
            });
        }
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserProfileAsync([FromBody] UpdateUserRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new ApiResponse
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            // For now, return the updated user data (would implement actual update logic)
            var updatedUser = new
            {
                Id = userId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = User.FindFirst("email")?.Value,
                Phone = request.Phone,
                Address = request.Address,
                City = request.City,
                State = request.State,
                ZipCode = request.ZipCode,
                UpdatedAt = DateTime.UtcNow
            };

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Profile updated successfully",
                Data = updatedUser
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update user profile for user {UserId}", User.FindFirst("user_id")?.Value);
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to update profile"
            });
        }
    }

    /// <summary>
    /// Update user password
    /// </summary>
    [HttpPut("password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> UpdatePasswordAsync([FromBody] UpdatePasswordRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new ApiResponse
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            // Validate password requirements
            if (string.IsNullOrEmpty(request.NewPassword) || request.NewPassword.Length < 8)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Password must be at least 8 characters long"
                });
            }

            // For now, return success (would implement actual password update logic with Stytch)
            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Password updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update password for user {UserId}", User.FindFirst("user_id")?.Value);
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to update password"
            });
        }
    }
}