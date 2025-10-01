using Fermentum.Auth.Models.DTOs;
using System.Text;
using System.Text.Json;

namespace Fermentum.Auth.Services;

public interface IStytchService
{
    Task<StytchAuthResponse> AuthenticateWithPasswordAsync(string email, string password);
    Task<StytchAuthResponse> AuthenticateWithMagicLinkAsync(string token);
    Task<StytchAuthResponse> AuthenticateWithOAuthAsync(string token);
    Task<bool> SendMagicLinkAsync(string email, string redirectUrl);
    Task<StytchUserResponse> CreateUserAsync(string email);
    Task<StytchUserResponse> CreateUserWithPasswordAsync(string email, string password);
    Task<bool> SetPasswordAsync(string userId, string password);
    Task<bool> UpdatePasswordAsync(string stytchUserId, string currentPassword, string newPassword);
    Task<bool> UpdateUserRoleAsync(string stytchUserId, string role);
    string GetGoogleOAuthUrl(string redirectUrl);
    string GetAppleOAuthUrl(string redirectUrl);
}

public class StytchService : IStytchService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<StytchService> _logger;
    private readonly string _projectId;
    private readonly string _projectSecret;
    private readonly string _publicToken;
    private readonly string _baseUrl;

    public StytchService(HttpClient httpClient, ILogger<StytchService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _projectId = configuration["Stytch:ProjectId"] ?? throw new InvalidOperationException("Stytch ProjectId is required");
        _projectSecret = configuration["Stytch:ProjectSecret"] ?? throw new InvalidOperationException("Stytch ProjectSecret is required");
        _publicToken = configuration["Stytch:PublicToken"] ?? throw new InvalidOperationException("Stytch PublicToken is required");

        // Use test environment URL for development
        var environment = configuration["Stytch:Environment"] ?? "test";
        _baseUrl = environment == "live" ? "https://api.stytch.com" : "https://test.stytch.com";

        // Setup basic authentication
        var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_projectId}:{_projectSecret}"));
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authValue);
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Fermentum-Auth/1.0");
    }

    public async Task<StytchAuthResponse> AuthenticateWithPasswordAsync(string email, string password)
    {
        try
        {
            _logger.LogInformation("Authenticating user with email: {Email}", email);

            var requestBody = new
            {
                email = email,
                password = password,
                session_duration_minutes = 60
            };

            var response = await PostAsync("/v1/passwords/authenticate", requestBody);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<StytchPasswordAuthResponse>(content, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

                _logger.LogInformation("Authentication successful for email: {Email}", email);
                return new StytchAuthResponse
                {
                    IsSuccess = true,
                    User = MapToStytchUser(result?.User)
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Authentication failed for email: {Email} - Status: {StatusCode}, Error: {Error}", email, response.StatusCode, errorContent);
                return new StytchAuthResponse
                {
                    IsSuccess = false,
                    Error = "Invalid email or password"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password authentication for email: {Email}", email);
            return new StytchAuthResponse
            {
                IsSuccess = false,
                Error = "Authentication failed"
            };
        }
    }

    public async Task<StytchAuthResponse> AuthenticateWithMagicLinkAsync(string token)
    {
        try
        {
            _logger.LogInformation("Authenticating user with magic link token");

            var requestBody = new
            {
                token = token,
                session_duration_minutes = 60
            };

            var response = await PostAsync("/v1/magic_links/authenticate", requestBody);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<StytchMagicLinkAuthResponse>(content, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

                _logger.LogInformation("Magic link authentication successful for user: {UserId}", result?.User?.UserId);
                return new StytchAuthResponse
                {
                    IsSuccess = true,
                    User = MapToStytchUser(result?.User)
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Magic link authentication failed - Status: {StatusCode}, Error: {Error}", response.StatusCode, errorContent);
                return new StytchAuthResponse
                {
                    IsSuccess = false,
                    Error = "Invalid or expired token"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during magic link authentication");
            return new StytchAuthResponse
            {
                IsSuccess = false,
                Error = "Authentication failed"
            };
        }
    }

    public async Task<bool> SendMagicLinkAsync(string email, string redirectUrl)
    {
        try
        {
            _logger.LogInformation("Sending magic link to email: {Email}", email);

            var requestBody = new
            {
                email = email,
                login_magic_link_url = redirectUrl,
                signup_magic_link_url = redirectUrl
            };

            var response = await PostAsync("/v1/magic_links/email/login_or_create", requestBody);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Magic link sent successfully to {Email}", email);
                return true;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send magic link to {Email} - Status: {StatusCode}, Error: {Error}", email, response.StatusCode, errorContent);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending magic link to email: {Email}", email);
            return false;
        }
    }

    public async Task<StytchUserResponse> CreateUserAsync(string email)
    {
        try
        {
            _logger.LogInformation("Creating user with email: {Email}", email);

            var requestBody = new
            {
                email = email
            };

            var response = await PostAsync("/v1/users", requestBody);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<StytchCreateUserResponse>(content, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

                _logger.LogInformation("User created successfully with email: {Email}", email);
                return new StytchUserResponse
                {
                    IsSuccess = true,
                    User = MapToStytchUser(result?.User)
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("User creation failed for email: {Email} - Status: {StatusCode}, Error: {Error}", email, response.StatusCode, errorContent);
                return new StytchUserResponse
                {
                    IsSuccess = false,
                    Error = "User creation failed"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user with email: {Email}", email);
            return new StytchUserResponse
            {
                IsSuccess = false,
                Error = "User creation failed"
            };
        }
    }

    public async Task<StytchUserResponse> CreateUserWithPasswordAsync(string email, string password)
    {
        try
        {
            _logger.LogInformation("Creating user with password for email: {Email}", email);

            var requestBody = new
            {
                email = email,
                password = password,
                session_duration_minutes = 60
            };

            var response = await PostAsync("/v1/passwords", requestBody);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<StytchCreateUserResponse>(content, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

                _logger.LogInformation("User created with password successfully for email: {Email}", email);
                return new StytchUserResponse
                {
                    IsSuccess = true,
                    User = MapToStytchUser(result?.User)
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("User creation with password failed for email: {Email} - Status: {StatusCode}, Error: {Error}", email, response.StatusCode, errorContent);
                return new StytchUserResponse
                {
                    IsSuccess = false,
                    Error = errorContent // Return the actual error message from Stytch
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user with password for email: {Email}", email);
            return new StytchUserResponse
            {
                IsSuccess = false,
                Error = $"User creation with password failed: {ex.Message}"
            };
        }
    }

    public async Task<bool> SetPasswordAsync(string userId, string password)
    {
        try
        {
            _logger.LogInformation("Setting password for user: {UserId}", userId);

            // Use the create user with password endpoint for new users
            var requestBody = new
            {
                email = "", // This will need to be passed in or looked up
                password = password
            };

            var response = await PostAsync("/v1/passwords", requestBody);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Password set successfully for user: {UserId}", userId);
                return true;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to set password for user: {UserId} - Status: {StatusCode}, Error: {Error}", userId, response.StatusCode, errorContent);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting password for user: {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> UpdatePasswordAsync(string stytchUserId, string currentPassword, string newPassword)
    {
        try
        {
            _logger.LogInformation("Updating password for Stytch user: {StytchUserId}", stytchUserId);

            // Stytch doesn't have a direct "update password" endpoint, but we can use the reset password flow
            // For now, we'll implement a simple password set operation
            // In a production environment, you might want to verify the current password first

            var requestBody = new
            {
                password = newPassword,
                user_id = stytchUserId,
                session_duration_minutes = 60
            };

            var response = await PostAsync("/v1/passwords/existing_password/reset", requestBody);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Password updated successfully for Stytch user: {StytchUserId}", stytchUserId);
                return true;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to update password for Stytch user: {StytchUserId} - Status: {StatusCode}, Error: {Error}",
                    stytchUserId, response.StatusCode, errorContent);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating password for Stytch user: {StytchUserId}", stytchUserId);
            return false;
        }
    }

    public async Task<StytchAuthResponse> AuthenticateWithOAuthAsync(string token)
    {
        try
        {
            _logger.LogInformation("🔐 OAUTH: Authenticating user with OAuth token (length: {TokenLength})", token?.Length ?? 0);
            _logger.LogInformation("🔐 OAUTH: Token preview: {TokenPreview}...", token?.Substring(0, Math.Min(20, token?.Length ?? 0)));

            var requestBody = new
            {
                token = token,
                session_duration_minutes = 60
            };

            _logger.LogInformation("🔐 OAUTH: Calling Stytch /v1/oauth/authenticate endpoint");
            var response = await PostAsync("/v1/oauth/authenticate", requestBody);
            _logger.LogInformation("🔐 OAUTH: Response status code: {StatusCode}", response.StatusCode);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("🔐 OAUTH: Success response content length: {Length}", content?.Length ?? 0);
                var result = JsonSerializer.Deserialize<StytchOAuthAuthResponse>(content, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

                _logger.LogInformation("🔐 OAUTH: Authentication successful for user: {Email}", result?.User?.Emails?.FirstOrDefault()?.Email ?? "Unknown");
                return new StytchAuthResponse
                {
                    IsSuccess = true,
                    User = MapToStytchUser(result?.User)
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("🚨 OAUTH: Authentication failed - Status: {StatusCode}", response.StatusCode);
                _logger.LogError("🚨 OAUTH: Full error response: {Error}", errorContent);
                _logger.LogError("🚨 OAUTH: Request was sent to: {Endpoint}", $"{_baseUrl}/v1/oauth/authenticate");
                return new StytchAuthResponse
                {
                    IsSuccess = false,
                    Error = $"OAuth authentication failed: {errorContent}"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 OAUTH: Exception during OAuth authentication");
            _logger.LogError("💥 OAUTH: Exception type: {ExceptionType}", ex.GetType().Name);
            _logger.LogError("💥 OAUTH: Exception message: {Message}", ex.Message);
            return new StytchAuthResponse
            {
                IsSuccess = false,
                Error = $"OAuth authentication failed: {ex.Message}"
            };
        }
    }

    public string GetGoogleOAuthUrl(string redirectUrl)
    {
        try
        {
            _logger.LogInformation("Generating Google OAuth URL for redirect: {RedirectUrl}", redirectUrl);

            // For Stytch, we need to construct the OAuth start URL
            // Use test environment URL for OAuth start endpoint
            var oauthUrl = $"https://test.stytch.com/v1/public/oauth/google/start?public_token={_publicToken}&login_redirect_url={Uri.EscapeDataString(redirectUrl)}&signup_redirect_url={Uri.EscapeDataString(redirectUrl)}";

            _logger.LogInformation("Generated Google OAuth URL: {OAuthUrl}", oauthUrl);
            return oauthUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating Google OAuth URL");
            throw;
        }
    }

    public string GetAppleOAuthUrl(string redirectUrl)
    {
        try
        {
            _logger.LogInformation("Generating Apple OAuth URL for redirect: {RedirectUrl}", redirectUrl);

            // For Stytch, we need to construct the OAuth start URL
            // Use test environment URL for OAuth start endpoint
            var oauthUrl = $"https://test.stytch.com/v1/public/oauth/apple/start?public_token={_publicToken}&login_redirect_url={Uri.EscapeDataString(redirectUrl)}&signup_redirect_url={Uri.EscapeDataString(redirectUrl)}";

            _logger.LogInformation("Generated Apple OAuth URL: {OAuthUrl}", oauthUrl);
            return oauthUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating Apple OAuth URL");
            throw;
        }
    }

    public async Task<bool> UpdateUserRoleAsync(string stytchUserId, string role)
    {
        try
        {
            _logger.LogInformation("Updating Stytch user role for user {StytchUserId} to role {Role}", stytchUserId, role);

            // Use Stytch's roles array since roles are created in Dashboard
            // Add both user and tenant roles for paid subscribers
            var roles = new List<string> { "user" };
            if (role == "tenant")
            {
                roles.Add("tenant");
            }

            var requestData = new
            {
                roles = roles.ToArray()
            };

            var json = JsonSerializer.Serialize(requestData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync($"{_baseUrl}/v1/users/{stytchUserId}", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully updated Stytch user role for user {StytchUserId}", stytchUserId);
                return true;
            }
            else
            {
                _logger.LogWarning("Failed to update Stytch user role. Status: {StatusCode}, Response: {Response}",
                    response.StatusCode, responseContent);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Stytch user role for user {StytchUserId}", stytchUserId);
            return false;
        }
    }

    private async Task<HttpResponseMessage> PostAsync(string endpoint, object requestBody)
    {
        var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        return await _httpClient.PostAsync($"{_baseUrl}{endpoint}", content);
    }

    private static StytchUser? MapToStytchUser(StytchApiUser? apiUser)
    {
        if (apiUser == null) return null;

        return new StytchUser
        {
            UserId = apiUser.UserId ?? "",
            Email = apiUser.Emails?.FirstOrDefault()?.Email ?? "",
            EmailVerified = apiUser.Emails?.FirstOrDefault()?.Verified ?? false,
            FirstName = apiUser.Name?.FirstName,
            LastName = apiUser.Name?.LastName
        };
    }
}

// Stytch API Response Models
public class StytchPasswordAuthResponse
{
    public StytchApiUser? User { get; set; }
    public StytchSession? Session { get; set; }
}

public class StytchMagicLinkAuthResponse
{
    public StytchApiUser? User { get; set; }
    public StytchSession? Session { get; set; }
}

public class StytchOAuthAuthResponse
{
    public StytchApiUser? User { get; set; }
    public StytchSession? Session { get; set; }
    public string? OauthUserRegistrationId { get; set; }
    public string? ProviderType { get; set; }
}

public class StytchCreateUserResponse
{
    public StytchApiUser? User { get; set; }
}

public class StytchApiUser
{
    public string? UserId { get; set; }
    public List<StytchEmail>? Emails { get; set; }
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
    public StytchUserName? Name { get; set; }
}

public class StytchEmail
{
    public string? Email { get; set; }
    public bool Verified { get; set; }
}

public class StytchUserName
{
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
}

public class StytchSession
{
    public string? SessionId { get; set; }
    public string? SessionToken { get; set; }
    public string? SessionJwt { get; set; }
}

// Response DTOs (keeping the same as before)
public class StytchAuthResponse
{
    public bool IsSuccess { get; set; }
    public string? Error { get; set; }
    public StytchUser? User { get; set; }
}

public class StytchUserResponse
{
    public bool IsSuccess { get; set; }
    public string? Error { get; set; }
    public StytchUser? User { get; set; }
}

public class StytchUser
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}