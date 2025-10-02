using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ??
                             User.FindFirst("nameid")?.Value ??
                             User.FindFirst("user_id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            {
                return Unauthorized(new { success = false, message = "Invalid or missing user token" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            _logger.LogInformation("Retrieved user profile for {Email}", user.Email);

            return Ok(new
            {
                success = true,
                data = new
                {
                    userId = user.UserId.ToString(),
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    phone = user.Phone,
                    address = user.Address,
                    city = user.City,
                    state = user.State,
                    zipCode = user.ZipCode,
                    profilePictureUrl = user.ProfilePictureUrl,
                    emailVerified = !string.IsNullOrEmpty(user.StytchUserId),
                    createdAt = user.Created
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user profile");
            return StatusCode(500, new { success = false, message = "Error retrieving profile" });
        }
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult> UpdateCurrentUser([FromBody] UpdateUserRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ??
                             User.FindFirst("nameid")?.Value ??
                             User.FindFirst("user_id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            {
                return Unauthorized(new { success = false, message = "Invalid or missing user token" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            // Update allowed fields
            if (!string.IsNullOrWhiteSpace(request.FirstName))
                user.FirstName = request.FirstName;

            if (!string.IsNullOrWhiteSpace(request.LastName))
                user.LastName = request.LastName;

            user.Phone = request.Phone;
            user.Address = request.Address;
            user.City = request.City;
            user.State = request.State;
            user.ZipCode = request.ZipCode;
            user.Updated = DateTime.UtcNow;
            user.UpdatedBy = userId;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated user profile for {Email}", user.Email);

            return Ok(new
            {
                success = true,
                data = new
                {
                    userId = user.UserId.ToString(),
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    phone = user.Phone,
                    address = user.Address,
                    city = user.City,
                    state = user.State,
                    zipCode = user.ZipCode,
                    profilePictureUrl = user.ProfilePictureUrl
                },
                message = "Profile updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile");
            return StatusCode(500, new { success = false, message = "Error updating profile" });
        }
    }

    [Authorize]
    [HttpPost("upload-picture")]
    public async Task<ActionResult> UploadProfilePicture([FromForm] IFormFile picture)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ??
                             User.FindFirst("nameid")?.Value ??
                             User.FindFirst("user_id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            {
                return Unauthorized(new { success = false, message = "Invalid or missing user token" });
            }

            if (picture == null || picture.Length == 0)
            {
                return BadRequest(new { success = false, message = "No file uploaded" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(picture.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { success = false, message = "Invalid file type. Only JPG, PNG, and GIF are allowed." });
            }

            // Validate file size (max 5MB)
            if (picture.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { success = false, message = "File size exceeds 5MB limit" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "profile-pictures");
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileName = $"{userId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await picture.CopyToAsync(stream);
            }

            // Update user's profile picture URL - use API endpoint
            var pictureUrl = $"/api/auth/profile-picture/{fileName}";
            user.ProfilePictureUrl = pictureUrl;
            user.Updated = DateTime.UtcNow;
            user.UpdatedBy = userId;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Profile picture uploaded for user {UserId}", userId);

            return Ok(new
            {
                success = true,
                data = new { profilePictureUrl = pictureUrl },
                message = "Profile picture uploaded successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading profile picture");
            return StatusCode(500, new { success = false, message = "Error uploading profile picture" });
        }
    }

    /// <summary>
    /// Get profile picture by filename - streams the image file from storage
    /// </summary>
    [HttpGet("profile-picture/{filename}")]
    [AllowAnonymous] // Allow public access to profile pictures
    public async Task<IActionResult> GetProfilePicture(string filename)
    {
        try
        {
            // Sanitize filename to prevent directory traversal attacks
            var sanitizedFilename = Path.GetFileName(filename);

            // Build file path
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "profile-pictures");
            var filePath = Path.Combine(uploadsPath, sanitizedFilename);

            // Check if file exists
            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogWarning("Profile picture not found: {Filename}", sanitizedFilename);
                return NotFound(new { success = false, message = "Profile picture not found" });
            }

            // Determine content type based on extension
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            var contentType = extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };

            // Read file and return as stream
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

            _logger.LogInformation("Serving profile picture: {Filename}", sanitizedFilename);

            return File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving profile picture: {Filename}", filename);
            return StatusCode(500, new { success = false, message = "Error retrieving profile picture" });
        }
    }

    /// <summary>
    /// Development-only endpoint to generate valid JWT tokens for testing
    /// DO NOT USE IN PRODUCTION
    /// </summary>
    [HttpPost("dev/generate-token")]
    [ApiExplorerSettings(IgnoreApi = true)] // Hide from Swagger in production
    public ActionResult GenerateDevToken([FromBody] DevTokenRequest? request = null)
    {
        try
        {
            _logger.LogWarning("⚠️ DEV TOKEN: Development token generation endpoint called - THIS SHOULD ONLY BE USED IN DEVELOPMENT");

            // Use provided values or defaults for testing
            var userId = request?.UserId ?? Guid.Parse("b16714d2-1dc7-43fa-a972-89f62bd72b61");
            var email = request?.Email ?? "eric.d.brand@gmail.com";
            var firstName = request?.FirstName ?? "Eric";
            var lastName = request?.LastName ?? "Brand";
            var tenantId = request?.TenantId ?? Guid.Parse("23f1ad78-d246-4b9f-8d38-d7e91abf4541");
            var role = request?.Role ?? "tenant";

            // Create a mock user with the specified/default values
            var mockUser = new User
            {
                UserId = userId,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                StytchUserId = $"user-test-{Guid.NewGuid()}",
            };

            // Create a mock tenant with the specified/default tenantId
            var mockTenant = new Tenant
            {
                TenantId = tenantId,
                Name = request?.TenantName ?? "Test Brewery"
            };

            // Generate the JWT token using the real JWT service
            var accessToken = _jwtService.GenerateAccessToken(mockUser, mockTenant, role);

            _logger.LogInformation("🔑 DEV TOKEN: Generated token for UserId: {UserId}, Email: {Email}, TenantId: {TenantId}, Role: {Role}",
                userId, email, tenantId, role);

            return Ok(new
            {
                success = true,
                data = new
                {
                    accessToken = accessToken,
                    user = new
                    {
                        userId = userId.ToString(),
                        email = email,
                        firstName = firstName,
                        lastName = lastName,
                        tenantId = tenantId.ToString(),
                        role = role
                    },
                    usage = "Use this token in the Authorization header: 'Bearer <token>'"
                },
                message = "Development token generated successfully",
                warning = "⚠️ THIS IS A DEVELOPMENT-ONLY ENDPOINT - DO NOT USE IN PRODUCTION"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating development token");
            return StatusCode(500, new { success = false, message = "Error generating token" });
        }
    }
}

public class DevTokenRequest
{
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public Guid? TenantId { get; set; }
    public string? TenantName { get; set; }
    public string? Role { get; set; }
}

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
}

