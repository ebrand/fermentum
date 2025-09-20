using Fermentum.Auth.Data;
using Fermentum.Auth.Models;
using Fermentum.Auth.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Fermentum.Auth.Services;

public class AuthService : IAuthService
{
    private readonly AuthDbContext _context;
    private readonly IStytchService _stytchService;
    private readonly IJwtService _jwtService;
    private readonly ITenantService _tenantService;
    private readonly IDistributedCache _cache;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AuthDbContext context,
        IStytchService stytchService,
        IJwtService jwtService,
        ITenantService tenantService,
        IDistributedCache cache,
        ILogger<AuthService> logger)
    {
        _context = context;
        _stytchService = stytchService;
        _jwtService = jwtService;
        _tenantService = tenantService;
        _cache = cache;
        _logger = logger;
    }

    public async Task<LoginResponse> LoginWithPasswordAsync(LoginRequest request, HttpContext context)
    {
        try
        {
            // Authenticate with Mock Stytch
            var authResponse = await _stytchService.AuthenticateWithPasswordAsync(
                email: request.Email,
                password: request.Password);

            if (!authResponse.IsSuccess || authResponse.User == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Get or create user in our database
            var user = await CreateOrUpdateUserFromStytchAsync(authResponse.User!);

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Resolve tenant
            Tenant? tenant = null;
            string? role = null;

            if (!string.IsNullOrEmpty(request.TenantSlug))
            {
                tenant = await _tenantService.GetTenantBySlugAsync(request.TenantSlug);
            }
            else
            {
                tenant = await _tenantService.ResolveTenantFromRequestAsync(context);
            }

            if (tenant != null)
            {
                // Verify user has access to the tenant
                if (!await _tenantService.UserHasAccessToTenantAsync(user.Id, tenant.Id))
                {
                    throw new UnauthorizedAccessException("User does not have access to this tenant");
                }

                role = await _tenantService.GetUserRoleInTenantAsync(user.Id, tenant.Id);
            }

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(user, tenant, user.Role);
            var refreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddDays(30);

            await _jwtService.StoreRefreshTokenAsync(user.Id, refreshToken, expiresAt);

            // Audit log
            await LogAuditEventAsync("user.login", user.Id, tenant?.Id, context);

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = MapToUserInfo(user),
                Tenant = tenant != null ? await _tenantService.GetTenantInfoForUserAsync(user.Id, tenant.Id) : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for user {Email}", request.Email);
            throw;
        }
    }

    public async Task<LoginResponse> LoginWithMagicLinkAsync(VerifyMagicLinkRequest request, HttpContext context)
    {
        try
        {
            // Verify magic link with Stytch
            var authResponse = await _stytchService.AuthenticateWithMagicLinkAsync(request.Token);

            if (!authResponse.IsSuccess || authResponse.User == null)
            {
                throw new UnauthorizedAccessException("Invalid or expired magic link");
            }

            // Get or create user in our database
            var user = await CreateOrUpdateUserFromStytchAsync(authResponse.User!);

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Resolve tenant from context
            var tenant = await _tenantService.ResolveTenantFromRequestAsync(context);
            string? role = null;

            if (tenant != null)
            {
                if (!await _tenantService.UserHasAccessToTenantAsync(user.Id, tenant.Id))
                {
                    throw new UnauthorizedAccessException("User does not have access to this tenant");
                }

                role = await _tenantService.GetUserRoleInTenantAsync(user.Id, tenant.Id);
            }

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(user, tenant, user.Role);
            var refreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddDays(30);

            await _jwtService.StoreRefreshTokenAsync(user.Id, refreshToken, expiresAt);

            // Audit log
            await LogAuditEventAsync("user.magic_link_login", user.Id, tenant?.Id, context);

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = MapToUserInfo(user),
                Tenant = tenant != null ? await _tenantService.GetTenantInfoForUserAsync(user.Id, tenant.Id) : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Magic link authentication failed");
            throw;
        }
    }

    public async Task<ApiResponse> SendMagicLinkAsync(MagicLinkRequest request)
    {
        try
        {
            // Build redirect URL with tenant context
            var redirectUrl = request.RedirectUrl;
            if (!string.IsNullOrEmpty(request.TenantSlug))
            {
                var uriBuilder = new UriBuilder(redirectUrl);
                var query = System.Web.HttpUtility.ParseQueryString(uriBuilder.Query);
                query["tenant"] = request.TenantSlug;
                uriBuilder.Query = query.ToString();
                redirectUrl = uriBuilder.ToString();
            }

            // Send magic link via Stytch
            var success = await _stytchService.SendMagicLinkAsync(
                email: request.Email,
                redirectUrl: redirectUrl);

            if (!success)
            {
                throw new InvalidOperationException("Failed to send magic link");
            }

            // Audit log
            await LogAuditEventAsync("magic_link.sent", null, null, null, new { email = request.Email });

            return new ApiResponse
            {
                Success = true,
                Message = "Magic link sent successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send magic link to {Email}", request.Email);
            throw;
        }
    }

    public async Task<LoginResponse> RegisterUserAsync(RegisterRequest request, HttpContext context)
    {
        try
        {
            // Create user with password in Stytch (one step)
            var userResponse = await _stytchService.CreateUserWithPasswordAsync(request.Email, request.Password);
            if (!userResponse.IsSuccess || userResponse.User == null)
            {
                throw new InvalidOperationException("Failed to create user account");
            }

            // Create user in our database
            var user = await CreateOrUpdateUserFromStytchAsync(userResponse.User);
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.DisplayName = $"{request.FirstName} {request.LastName}".Trim();

            await _context.SaveChangesAsync();

            // Handle invitation if token provided
            if (!string.IsNullOrEmpty(request.InvitationToken))
            {
                await ProcessInvitationAsync(user.Id, request.InvitationToken);
            }

            // Resolve tenant
            var tenant = await _tenantService.ResolveTenantFromRequestAsync(context);
            string? role = null;

            if (tenant != null)
            {
                role = await _tenantService.GetUserRoleInTenantAsync(user.Id, tenant.Id);
            }

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(user, tenant, user.Role);
            var refreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddDays(30);

            await _jwtService.StoreRefreshTokenAsync(user.Id, refreshToken, expiresAt);

            // Audit log
            await LogAuditEventAsync("user.registered", user.Id, tenant?.Id, context);

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = MapToUserInfo(user),
                Tenant = tenant != null ? await _tenantService.GetTenantInfoForUserAsync(user.Id, tenant.Id) : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for user {Email}", request.Email);
            throw;
        }
    }

    public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        // Get user ID from token (simplified - in production, store user ID with refresh token)
        var user = await GetUserFromRefreshTokenAsync(request.RefreshToken);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        if (!await _jwtService.ValidateRefreshTokenAsync(user.Id, request.RefreshToken))
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        // Get user's tenants (for now, return without specific tenant context)
        var tenants = await _tenantService.GetUserTenantsAsync(user.Id);
        var primaryTenant = tenants.FirstOrDefault();

        Tenant? tenant = null;
        if (primaryTenant != null)
        {
            tenant = await _tenantService.GetTenantByIdAsync(primaryTenant.Id);
        }

        // Generate new tokens
        var accessToken = _jwtService.GenerateAccessToken(user, tenant, user.Role);
        var newRefreshToken = _jwtService.GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddDays(30);

        // Revoke old refresh token and store new one
        await _jwtService.RevokeRefreshTokenAsync(request.RefreshToken);
        await _jwtService.StoreRefreshTokenAsync(user.Id, newRefreshToken, expiresAt);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt,
            User = MapToUserInfo(user),
            Tenant = primaryTenant
        };
    }

    public async Task<ApiResponse> LogoutAsync(string refreshToken)
    {
        await _jwtService.RevokeRefreshTokenAsync(refreshToken);

        return new ApiResponse
        {
            Success = true,
            Message = "Logged out successfully"
        };
    }

    public async Task<User?> GetUserByStytchIdAsync(string stytchUserId)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.StytchUserId == stytchUserId && u.IsActive);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
    }

    public async Task<User> CreateOrUpdateUserFromStytchAsync(StytchUser stytchUser)
    {
        _logger.LogInformation("CreateOrUpdateUserFromStytchAsync called for StytchUserId: {StytchUserId}, Email: {Email}", stytchUser.UserId, stytchUser.Email);

        // First check by Stytch ID
        var user = await GetUserByStytchIdAsync(stytchUser.UserId);
        _logger.LogInformation("GetUserByStytchIdAsync returned: {UserFound}", user != null ? $"User ID {user.Id}" : "null");

        // If not found by Stytch ID, check by email
        if (user == null)
        {
            user = await GetUserByEmailAsync(stytchUser.Email);
            _logger.LogInformation("GetUserByEmailAsync returned: {UserFound}", user != null ? $"User ID {user.Id}" : "null");

            // If found by email, update the Stytch ID
            if (user != null)
            {
                _logger.LogInformation("Updating existing user {UserId} with new StytchUserId {StytchUserId}", user.Id, stytchUser.UserId);
                user.StytchUserId = stytchUser.UserId;
                user.EmailVerified = stytchUser.EmailVerified;
                user.FirstName = stytchUser.FirstName;
                user.LastName = stytchUser.LastName;
                user.DisplayName = GenerateDisplayName(stytchUser.FirstName, stytchUser.LastName, stytchUser.Email);
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return user;
            }
        }

        if (user == null)
        {
            // Create new user
            var newUserId = Guid.NewGuid();
            _logger.LogInformation("Creating new user with ID: {UserId} for StytchUserId: {StytchUserId}", newUserId, stytchUser.UserId);

            user = new User
            {
                Id = newUserId,
                StytchUserId = stytchUser.UserId,
                Email = stytchUser.Email,
                EmailVerified = stytchUser.EmailVerified,
                FirstName = stytchUser.FirstName,
                LastName = stytchUser.LastName,
                DisplayName = GenerateDisplayName(stytchUser.FirstName, stytchUser.LastName, stytchUser.Email),
                Role = "fermentum-tenant", // Assign tenant role to new users during onboarding
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _logger.LogInformation("Adding user to context: {UserId}, Email: {Email}, FirstName: {FirstName}, LastName: {LastName}",
                user.Id, user.Email, user.FirstName, user.LastName);
            _context.Users.Add(user);
        }
        else
        {
            // Update existing user
            user.Email = stytchUser.Email;
            user.EmailVerified = stytchUser.EmailVerified;

            // Update name fields if they're provided and not already set
            if (!string.IsNullOrEmpty(stytchUser.FirstName) && string.IsNullOrEmpty(user.FirstName))
            {
                user.FirstName = stytchUser.FirstName;
            }
            if (!string.IsNullOrEmpty(stytchUser.LastName) && string.IsNullOrEmpty(user.LastName))
            {
                user.LastName = stytchUser.LastName;
            }

            // Update display name if we got new name info or it's not set
            if ((!string.IsNullOrEmpty(stytchUser.FirstName) || !string.IsNullOrEmpty(stytchUser.LastName)) && string.IsNullOrEmpty(user.DisplayName))
            {
                user.DisplayName = GenerateDisplayName(user.FirstName, user.LastName, user.Email);
            }

            user.UpdatedAt = DateTime.UtcNow;
        }

        _logger.LogInformation("Calling SaveChangesAsync to persist user changes...");
        await _context.SaveChangesAsync();
        _logger.LogInformation("SaveChangesAsync completed successfully. User saved with ID: {UserId}", user.Id);
        return user;
    }

    private static string GenerateDisplayName(string? firstName, string? lastName, string email)
    {
        // If we have both first and last name, use them
        if (!string.IsNullOrEmpty(firstName) && !string.IsNullOrEmpty(lastName))
        {
            return $"{firstName} {lastName}".Trim();
        }

        // If we have just first name, use it
        if (!string.IsNullOrEmpty(firstName))
        {
            return firstName;
        }

        // If we have just last name, use it
        if (!string.IsNullOrEmpty(lastName))
        {
            return lastName;
        }

        // Fallback to email (before @ symbol)
        return email.Split('@')[0];
    }

    public async Task<LoginResponse> AuthenticateWithOAuthAsync(OAuthRequest request, HttpContext context)
    {
        try
        {
            _logger.LogInformation("Authenticating user with OAuth token");

            // Authenticate with Stytch OAuth
            _logger.LogInformation("About to call StytchService.AuthenticateWithOAuthAsync");
            var stytchResult = await _stytchService.AuthenticateWithOAuthAsync(request.Token);
            _logger.LogInformation("StytchService.AuthenticateWithOAuthAsync completed. IsSuccess: {IsSuccess}, HasUser: {HasUser}",
                stytchResult.IsSuccess, stytchResult.User != null);

            if (!stytchResult.IsSuccess || stytchResult.User == null)
            {
                _logger.LogWarning("Stytch authentication failed. IsSuccess: {IsSuccess}, Error: {Error}", stytchResult.IsSuccess, stytchResult.Error);
                await LogAuditEventAsync("oauth_login_failed", null, null, context, new { Token = request.Token[..Math.Min(request.Token.Length, 10)] + "..." });
                throw new UnauthorizedAccessException(stytchResult.Error ?? "OAuth authentication failed");
            }

            // Create or update user from Stytch data
            _logger.LogInformation("About to call CreateOrUpdateUserFromStytchAsync for user: {Email}", stytchResult.User.Email);
            var user = await CreateOrUpdateUserFromStytchAsync(stytchResult.User);
            _logger.LogInformation("CreateOrUpdateUserFromStytchAsync completed. User ID: {UserId}", user.Id);

            // Handle tenant context
            Tenant? tenant = null;
            if (!string.IsNullOrEmpty(request.TenantSlug))
            {
                tenant = await _tenantService.GetTenantBySlugAsync(request.TenantSlug);
                if (tenant == null)
                {
                    await LogAuditEventAsync("oauth_login_failed_invalid_tenant", user.Id, null, context, new { TenantSlug = request.TenantSlug });
                    throw new UnauthorizedAccessException("Invalid tenant");
                }

                // Verify user has access to tenant
                if (!await _tenantService.UserHasAccessToTenantAsync(user.Id, tenant.Id))
                {
                    await LogAuditEventAsync("oauth_login_failed_no_tenant_access", user.Id, tenant.Id, context);
                    throw new UnauthorizedAccessException("No access to tenant");
                }
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Get user's tenants and determine primary tenant
            var tenants = await _tenantService.GetUserTenantsAsync(user.Id);
            var primaryTenant = tenant != null
                ? tenants.FirstOrDefault(t => t.Id == tenant.Id)
                : tenants.FirstOrDefault();

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(user, tenant, user.Role);
            var refreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddDays(30);

            // Store refresh token
            await _jwtService.StoreRefreshTokenAsync(user.Id, refreshToken, expiresAt);

            await LogAuditEventAsync("oauth_login_success", user.Id, tenant?.Id, context, new { Provider = "google" });

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = MapToUserInfo(user),
                Tenant = primaryTenant
            };
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OAuth authentication failed");
            await LogAuditEventAsync("oauth_login_error", null, null, context, new { Error = ex.Message });
            throw new InvalidOperationException("OAuth authentication failed");
        }
    }

    public string GetGoogleOAuthUrl(string redirectUrl)
    {
        return _stytchService.GetGoogleOAuthUrl(redirectUrl);
    }

    public string GetAppleOAuthUrl(string redirectUrl)
    {
        return _stytchService.GetAppleOAuthUrl(redirectUrl);
    }

    private async Task ProcessInvitationAsync(Guid userId, string invitationToken)
    {
        var invitation = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Token == invitationToken && i.Status == "pending" && i.ExpiresAt > DateTime.UtcNow);

        if (invitation == null)
        {
            throw new InvalidOperationException("Invalid or expired invitation");
        }

        // Add user to tenant
        var tenantUser = new TenantUser
        {
            Id = Guid.NewGuid(),
            TenantId = invitation.TenantId,
            UserId = userId,
            Role = invitation.Role,
            Status = "active",
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TenantUsers.Add(tenantUser);

        // Update invitation
        invitation.Status = "accepted";
        invitation.AcceptedAt = DateTime.UtcNow;
        invitation.AcceptedBy = userId;

        await _context.SaveChangesAsync();
    }

    private async Task<User?> GetUserFromRefreshTokenAsync(string refreshToken)
    {
        try
        {
            var key = $"refresh_token:{refreshToken}";
            var value = await _cache.GetStringAsync(key);

            if (value == null)
                return null;

            var tokenData = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(value);
            var userIdStr = tokenData.GetProperty("UserId").GetString();

            if (Guid.TryParse(userIdStr, out var userId))
            {
                return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get user from refresh token");
            return null;
        }
    }

    private static UserInfo MapToUserInfo(User user)
    {
        return new UserInfo
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role,
            EmailVerified = user.EmailVerified,
            IsSystemAdmin = user.IsSystemAdmin,
            LastLoginAt = user.LastLoginAt
        };
    }

    private async Task LogAuditEventAsync(string action, Guid? userId, Guid? tenantId, HttpContext? context, object? metadata = null)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = action,
            UserId = userId,
            TenantId = tenantId,
            IpAddress = context?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = context?.Request.Headers["User-Agent"].FirstOrDefault(),
            RequestId = context?.TraceIdentifier,
            Metadata = metadata != null ? System.Text.Json.JsonSerializer.Serialize(metadata) : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }
}