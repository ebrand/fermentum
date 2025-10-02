using Fermentum.Auth.Models;
using Fermentum.Auth.Data;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Fermentum.Auth.Services
{
    public class SessionService : ISessionService
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<SessionService> _logger;
        private readonly IJwtService _jwtService;
        private readonly AuthDbContext _context;

        public SessionService(IDistributedCache cache, ILogger<SessionService> logger, IJwtService jwtService, AuthDbContext context)
        {
            _cache = cache;
            _logger = logger;
            _jwtService = jwtService;
            _context = context;
        }

        public async Task<UserSession?> GetSessionAsync(string userId)
        {
            try
            {
                var sessionJson = await _cache.GetStringAsync($"session:{userId}");
                if (string.IsNullOrEmpty(sessionJson))
                    return null;

                return JsonSerializer.Deserialize<UserSession>(sessionJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting session for user {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> CreateOrUpdateSessionAsync(string userId, UserSession session)
        {
            try
            {
                var sessionJson = JsonSerializer.Serialize(session);
                await _cache.SetStringAsync($"session:{userId}", sessionJson,
                    new DistributedCacheEntryOptions
                    {
                        SlidingExpiration = TimeSpan.FromHours(24)
                    });
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating/updating session for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> UpdateCurrentTenantAsync(string userId, string tenantId)
        {
            try
            {
                var session = await GetSessionAsync(userId);
                if (session == null)
                    return false;

                session.CurrentTenantId = tenantId;
                session.LastUpdated = DateTime.UtcNow;

                return await CreateOrUpdateSessionAsync(userId, session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating current tenant for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> UpdateCurrentBreweryAsync(string userId, string breweryId)
        {
            try
            {
                var session = await GetSessionAsync(userId);
                if (session == null)
                    return false;

                // Set the current brewery
                session.CurrentBreweryId = breweryId;

                // Find the user's Employee ID for this brewery
                string? employeeId = null;
                if (!string.IsNullOrEmpty(breweryId) && Guid.TryParse(userId, out var userGuid) && Guid.TryParse(breweryId, out var breweryGuid))
                {
                    try
                    {
                        await _context.Database.ExecuteSqlRawAsync($"SET app.current_user_id = '{userGuid}'");

                        var employee = await _context.Employees
                            .Where(e => e.UserId == userGuid && e.BreweryId == breweryGuid && e.IsActive)
                            .FirstOrDefaultAsync();

                        if (employee != null)
                        {
                            employeeId = employee.EmployeeId.ToString();
                            _logger.LogInformation("Found Employee ID {EmployeeId} for User {UserId} in Brewery {BreweryId}",
                                employeeId, userId, breweryId);
                        }
                        else
                        {
                            _logger.LogWarning("No Employee record found for User {UserId} in Brewery {BreweryId}",
                                userId, breweryId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error finding Employee ID for User {UserId} in Brewery {BreweryId}",
                            userId, breweryId);
                    }
                }

                // Set the current employee ID (null if not found)
                session.CurrentEmployeeId = employeeId;
                session.LastUpdated = DateTime.UtcNow;

                return await CreateOrUpdateSessionAsync(userId, session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating current brewery for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> RefreshTenantDataAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Refreshing tenant data for user {UserId}", userId);

                var session = await GetSessionAsync(userId);
                if (session == null)
                {
                    _logger.LogWarning("No session found for user {UserId}, cannot refresh tenant data", userId);
                    return false;
                }

                if (!Guid.TryParse(userId, out var userGuid))
                {
                    _logger.LogError("Invalid UserId format: {UserId}", userId);
                    return false;
                }

                // Set RLS context for tenant access
                _logger.LogInformation("Setting RLS context: app.user_id = {UserGuid}", userGuid);
                try
                {
                    await _context.Database.ExecuteSqlRawAsync($"SET app.user_id = '{userGuid}'");
                    _logger.LogInformation("RLS context set successfully for tenant refresh");
                }
                catch (Exception rlsEx)
                {
                    _logger.LogError(rlsEx, "Error setting RLS context for tenant refresh: {Error}", rlsEx.Message);
                    throw;
                }

                // Load user's tenants from database via User_Tenant junction table with Plan information
                var userTenants = await _context.UserTenants
                    .Where(ut => ut.UserId == userGuid && ut.IsActive)
                    .Join(_context.Tenants, ut => ut.TenantId, t => t.TenantId, (ut, t) => new { ut, t })
                    .GroupJoin(_context.Plans, x => x.t.PlanId, p => p.PlanId, (x, plans) => new { x.ut, x.t, plan = plans.FirstOrDefault() })
                    .Select(x => new UserTenantInfo
                    {
                        TenantId = x.t.TenantId.ToString(),
                        Name = x.t.Name,
                        UserRole = x.ut.Role,
                        IsOwner = x.ut.Role == "owner",
                        JoinedAt = x.ut.Created,

                        // Plan information
                        PlanId = x.plan != null ? x.plan.PlanId.ToString() : null,
                        PlanName = x.plan != null ? x.plan.Name : "Starter",
                        BreweryLimit = x.plan != null ? x.plan.BreweryLimit : 1,
                        UserLimit = x.plan != null ? x.plan.UserLimit : 3,

                        // Billing information
                        SubscriptionStatus = x.t.SubscriptionStatus,
                        TrialEndsAt = x.t.TrialEndsAt,
                        CurrentPeriodEnd = x.t.CurrentPeriodEnd
                    })
                    .ToListAsync();

                _logger.LogInformation("Found {TenantCount} tenants for user {UserId}", userTenants.Count, userId);

                // Also refresh user profile data from database
                var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
                if (userRecord != null)
                {
                    _logger.LogInformation("Refreshing user profile data for user {UserId}", userId);
                    session.Phone = userRecord.Phone;
                    session.Address = userRecord.Address;
                    session.City = userRecord.City;
                    session.State = userRecord.State;
                    session.ZipCode = userRecord.ZipCode;
                    session.ProfilePictureUrl = userRecord.ProfilePictureUrl;
                    session.CreatedAt = userRecord.Created;
                    // Update name fields in case they changed
                    session.FirstName = userRecord.FirstName ?? session.FirstName;
                    session.LastName = userRecord.LastName ?? session.LastName;
                    session.DisplayName = !string.IsNullOrEmpty(userRecord.FirstName) && !string.IsNullOrEmpty(userRecord.LastName)
                        ? $"{userRecord.FirstName} {userRecord.LastName}".Trim()
                        : session.DisplayName;
                }

                // Update session with fresh tenant data
                session.Tenants = userTenants;
                session.LastUpdated = DateTime.UtcNow;

                return await CreateOrUpdateSessionAsync(userId, session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing tenant data for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> RefreshBreweryDataAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Refreshing brewery data for user {UserId}", userId);

                var session = await GetSessionAsync(userId);
                if (session == null)
                {
                    _logger.LogWarning("No session found for user {UserId}, cannot refresh brewery data", userId);
                    return false;
                }

                if (!Guid.TryParse(userId, out var userGuid))
                {
                    _logger.LogError("Invalid UserId format: {UserId}", userId);
                    return false;
                }

                // Set RLS context for tenant access
                _logger.LogInformation("Setting RLS context: app.user_id = {UserGuid}", userGuid);
                try
                {
                    await _context.Database.ExecuteSqlRawAsync($"SET app.user_id = '{userGuid}'");
                    _logger.LogInformation("RLS context set successfully for brewery refresh");
                }
                catch (Exception rlsEx)
                {
                    _logger.LogError(rlsEx, "Error setting RLS context for brewery refresh: {Error}", rlsEx.Message);
                    throw;
                }

                // Load user's breweries through their tenant relationships
                var userBreweries = await _context.UserTenants
                    .Where(ut => ut.UserId == userGuid && ut.IsActive)
                    .Join(_context.Breweries, ut => ut.TenantId, b => b.TenantId, (ut, b) => new { ut, b })
                    .Join(_context.Tenants, x => x.ut.TenantId, t => t.TenantId, (x, t) => new { x.ut, x.b, t })
                    .Select(x => new UserBreweryInfo
                    {
                        BreweryId = x.b.BreweryId.ToString(),
                        Name = x.b.Name,
                        TenantId = x.b.TenantId.ToString(),
                        UserRole = x.ut.Role,
                        IsOwner = x.ut.Role == "owner",
                        CreatedAt = x.b.Created,
                        IsActive = true
                    })
                    .ToListAsync();

                _logger.LogInformation("Found {BreweryCount} breweries for user {UserId}", userBreweries.Count, userId);

                // Update session with fresh brewery data
                session.Breweries = userBreweries;
                session.LastUpdated = DateTime.UtcNow;

                return await CreateOrUpdateSessionAsync(userId, session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing brewery data for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> InvalidateSessionAsync(string userId)
        {
            try
            {
                await _cache.RemoveAsync($"session:{userId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating session for user {UserId}", userId);
                return false;
            }
        }

        public async Task<UserSession?> CreateSessionFromTokenAsync(string token)
        {
            try
            {
                _logger.LogInformation("🚀 [CONTAINER_TEST] *** ULTIMATE SESSIONSERVICE VERSION IDENTIFIER: 2025-09-23-17-00 ***");
                _logger.LogInformation("Creating session from token");

                // Validate the JWT token first
                if (!_jwtService.ValidateToken(token))
                {
                    _logger.LogWarning("Invalid JWT token provided");
                    return null;
                }

                // Extract claims from the JWT token
                _logger.LogInformation("🔍 SESSION DEBUG: About to call GetClaimsFromToken with token: {Token}", token.Substring(0, Math.Min(50, token.Length)));
                var claims = _jwtService.GetClaimsFromToken(token);
                _logger.LogInformation("🔍 SESSION DEBUG: GetClaimsFromToken returned: {IsNull}", claims == null ? "NULL" : "NOT_NULL");
                if (claims == null)
                {
                    _logger.LogWarning("Could not extract claims from JWT token");
                    return null;
                }

                // Extract user information from JWT claims
                // Try multiple claim type variations for robust extraction
                _logger.LogInformation("🔍 EXTRACTION DEBUG: ClaimTypes.NameIdentifier: '{ClaimType}'", ClaimTypes.NameIdentifier);
                _logger.LogInformation("🔍 EXTRACTION DEBUG: Checking claim 'nameid': {HasClaim}", claims.ContainsKey("nameid"));
                _logger.LogInformation("🔍 EXTRACTION DEBUG: Checking claim 'user_id': {HasClaim}", claims.ContainsKey("user_id"));

                var userId1 = claims.GetValueOrDefault(ClaimTypes.NameIdentifier)?.ToString();
                var userId2 = claims.GetValueOrDefault("nameid")?.ToString();
                var userId3 = claims.GetValueOrDefault("user_id")?.ToString();
                _logger.LogInformation("🔍 EXTRACTION DEBUG: userId1 (ClaimTypes.NameIdentifier): '{UserId1}'", userId1 ?? "NULL");
                _logger.LogInformation("🔍 EXTRACTION DEBUG: userId2 (nameid): '{UserId2}'", userId2 ?? "NULL");
                _logger.LogInformation("🔍 EXTRACTION DEBUG: userId3 (user_id): '{UserId3}'", userId3 ?? "NULL");

                var userId = userId1 ?? userId2 ?? userId3 ?? "";
                _logger.LogInformation("🔍 EXTRACTION DEBUG: Final userId: '{UserId}'", userId);

                _logger.LogInformation("🔍 EXTRACTION DEBUG: ClaimTypes.Email: '{ClaimType}'", ClaimTypes.Email);
                _logger.LogInformation("🔍 EXTRACTION DEBUG: Checking claim 'email': {HasClaim}", claims.ContainsKey("email"));

                var emailClaim = claims.GetValueOrDefault(ClaimTypes.Email) ?? claims.GetValueOrDefault("email");
                _logger.LogInformation("🔍 EXTRACTION DEBUG: emailClaim: {EmailClaim} (Type: {EmailClaimType})", emailClaim ?? "NULL", emailClaim?.GetType().Name ?? "NULL");

                var email = "";
                if (emailClaim != null)
                {
                    // Handle email as array, string, or JSON string
                    if (emailClaim is string[] emailArray && emailArray.Length > 0)
                    {
                        email = emailArray[0];
                        _logger.LogInformation("🔍 EXTRACTION DEBUG: Email extracted from string array: '{Email}'", email);
                    }
                    else if (emailClaim is string emailString)
                    {
                        // Check if it's a JSON string array like ["email1", "email2"]
                        if (emailString.StartsWith("[") && emailString.EndsWith("]"))
                        {
                            try
                            {
                                var emailJsonArray = JsonSerializer.Deserialize<string[]>(emailString);
                                if (emailJsonArray != null && emailJsonArray.Length > 0)
                                {
                                    email = emailJsonArray[0];
                                    _logger.LogInformation("🔍 EXTRACTION DEBUG: Email extracted from JSON string array: '{Email}'", email);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to parse email JSON array: {EmailString}", emailString);
                                email = emailString;
                            }
                        }
                        else
                        {
                            email = emailString;
                            _logger.LogInformation("🔍 EXTRACTION DEBUG: Email extracted from string: '{Email}'", email);
                        }
                    }
                    else
                    {
                        // Handle object.ToString() which is what we're seeing in logs - `string[]` becomes "string[], string[]"
                        var emailStr = emailClaim.ToString() ?? "";
                        if (emailStr.StartsWith("System.String[]") || emailStr.Contains(","))
                        {
                            // This is likely a string array that got ToString()'d, try to get the actual value
                            try
                            {
                                // If it's really a string array object, try to cast it
                                if (emailClaim.GetType().IsArray)
                                {
                                    var arrayValues = (object[])emailClaim;
                                    if (arrayValues.Length > 0)
                                    {
                                        email = arrayValues[0]?.ToString() ?? "";
                                        _logger.LogInformation("🔍 EXTRACTION DEBUG: Email extracted from object array: '{Email}'", email);
                                    }
                                }
                                else
                                {
                                    email = emailStr;
                                    _logger.LogInformation("🔍 EXTRACTION DEBUG: Email extracted from ToString(): '{Email}'", email);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to extract email from object: {EmailStr}", emailStr);
                                email = emailStr;
                            }
                        }
                        else
                        {
                            email = emailStr;
                            _logger.LogInformation("🔍 EXTRACTION DEBUG: Email extracted from ToString(): '{Email}'", email);
                        }
                    }
                }
                else
                {
                    _logger.LogInformation("🔍 EXTRACTION DEBUG: No email claim found");
                }

                var firstName = claims.GetValueOrDefault(ClaimTypes.GivenName)?.ToString() ??
                              claims.GetValueOrDefault("given_name")?.ToString() ?? "";
                var lastName = claims.GetValueOrDefault(ClaimTypes.Surname)?.ToString() ??
                             claims.GetValueOrDefault("family_name")?.ToString() ?? "";
                var displayName = claims.GetValueOrDefault("display_name")?.ToString() ?? "";

                var roleClaim = claims.GetValueOrDefault(ClaimTypes.Role) ?? claims.GetValueOrDefault("role");
                var role = "tenant";
                if (roleClaim != null)
                {
                    // Handle role as array, string, or JSON string
                    if (roleClaim is string[] roleArray && roleArray.Length > 0)
                    {
                        role = roleArray[0];
                    }
                    else if (roleClaim is string roleString)
                    {
                        // Check if it's a JSON string array like ["role1", "role2"]
                        if (roleString.StartsWith("[") && roleString.EndsWith("]"))
                        {
                            try
                            {
                                var roleJsonArray = JsonSerializer.Deserialize<string[]>(roleString);
                                if (roleJsonArray != null && roleJsonArray.Length > 0)
                                {
                                    role = roleJsonArray[0];
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to parse role JSON array: {RoleString}", roleString);
                                role = roleString;
                            }
                        }
                        else
                        {
                            role = roleString;
                        }
                    }
                    else
                    {
                        // Handle object array case
                        try
                        {
                            if (roleClaim.GetType().IsArray)
                            {
                                var arrayValues = (object[])roleClaim;
                                if (arrayValues.Length > 0)
                                {
                                    role = arrayValues[0]?.ToString() ?? "tenant";
                                }
                            }
                            else
                            {
                                role = roleClaim.ToString() ?? "tenant";
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to extract role from object: {RoleClaim}", roleClaim);
                            role = roleClaim.ToString() ?? "tenant";
                        }
                    }
                }

                var stytchUserId = claims.GetValueOrDefault("stytch_user_id")?.ToString() ?? "";

                _logger.LogInformation("🔍 DEBUG: Extracted claims - UserId: '{UserId}', Email: '{Email}', FirstName: '{FirstName}', LastName: '{LastName}'",
                    userId, email, firstName, lastName);
                _logger.LogInformation("🔍 DEBUG: All available claims: {ClaimsCount}", claims.Count);
                foreach (var claim in claims)
                {
                    _logger.LogInformation("🔍 DEBUG: Claim - Key: '{Key}', Value: '{Value}'", claim.Key, claim.Value);
                }

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
                {
                    _logger.LogWarning("Required user information missing from JWT token - UserId: '{UserId}', Email: '{Email}'", userId, email);
                    return null;
                }

                // Create or update User record in database
                _logger.LogInformation("🔄 [SESSION_DEBUG] About to call CreateOrUpdateUserAsync for user: {UserId} ({Email})", userId, email);
                var correctedUserId = await CreateOrUpdateUserAsync(userId, email, firstName, lastName, stytchUserId);
                _logger.LogInformation("✅ [SESSION_DEBUG] CreateOrUpdateUserAsync completed. Original: {OriginalUserId}, Corrected: {CorrectedUserId} ({Email})", userId, correctedUserId, email);

                // Fetch full user record to get profile fields
                var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.UserId == Guid.Parse(correctedUserId));
                if (userRecord == null)
                {
                    _logger.LogError("Failed to fetch user record after creation for {UserId}", correctedUserId);
                    return null;
                }

                _logger.LogInformation("🔄 [BREWERY_DEBUG] About to create UserSession object for user: {CorrectedUserId}", correctedUserId);

                // Create a session from JWT claims and database profile fields
                var session = new UserSession
                {
                    UserId = correctedUserId,
                    StytchUserId = stytchUserId,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    DisplayName = !string.IsNullOrEmpty(displayName) ? displayName : $"{firstName} {lastName}".Trim(),
                    Role = role,
                    // Profile fields from database
                    Phone = userRecord.Phone,
                    Address = userRecord.Address,
                    City = userRecord.City,
                    State = userRecord.State,
                    ZipCode = userRecord.ZipCode,
                    ProfilePictureUrl = userRecord.ProfilePictureUrl,
                    EmailVerified = true, // Assume verified if they got a token
                    CreatedAt = userRecord.Created,
                    Tenants = new List<UserTenantInfo>(),
                    Breweries = new List<UserBreweryInfo>(),
                    AccessToken = token,
                    LastUpdated = DateTime.UtcNow
                };

                // Store the initial session
                _logger.LogInformation("🔄 BREWERY_DEBUG: About to store initial session for user: {CorrectedUserId}", correctedUserId);
                await CreateOrUpdateSessionAsync(correctedUserId, session);
                _logger.LogInformation("✅ BREWERY_DEBUG: Initial session stored, now loading tenant/brewery data for user: {CorrectedUserId}", correctedUserId);

                // Load tenant and brewery data immediately
                _logger.LogInformation("🏗️ BREWERY_DEBUG: Loading tenant and brewery data for new session: {CorrectedUserId}", correctedUserId);
                var tenantRefreshSuccess = await RefreshTenantDataAsync(correctedUserId);
                var breweryRefreshSuccess = await RefreshBreweryDataAsync(correctedUserId);

                if (tenantRefreshSuccess && breweryRefreshSuccess)
                {
                    // Get the updated session with loaded data
                    session = await GetSessionAsync(correctedUserId);
                    _logger.LogInformation("Successfully loaded {TenantCount} tenants and {BreweryCount} breweries for user {CorrectedUserId}",
                        session?.Tenants?.Count ?? 0, session?.Breweries?.Count ?? 0, correctedUserId);
                }
                else
                {
                    _logger.LogWarning("Failed to load tenant/brewery data for user {CorrectedUserId}. TenantRefresh: {TenantSuccess}, BreweryRefresh: {BrewerySuccess}",
                        correctedUserId, tenantRefreshSuccess, breweryRefreshSuccess);
                }

                _logger.LogInformation("Successfully created session for user {CorrectedUserId} ({Email}) with role {Role}",
                    correctedUserId, email, role);

                return session;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating session from token");
                return null;
            }
        }

        private async Task<string> CreateOrUpdateUserAsync(string userId, string email, string firstName, string lastName, string stytchUserId)
        {
            try
            {
                _logger.LogInformation("🚀 [USER_DEBUG] Starting CreateOrUpdateUserAsync for UserId: {UserId}, Email: {Email}", userId, email);

                if (!Guid.TryParse(userId, out var userGuid))
                {
                    _logger.LogError("❌ [USER_DEBUG] Invalid UserId format: {UserId}", userId);
                    return userId;
                }

                _logger.LogInformation("✅ [USER_DEBUG] UserId parsed successfully: {UserGuid}", userGuid);

                // Check database connection before proceeding
                _logger.LogInformation("🔗 [USER_DEBUG] Checking database connection and context state");
                try
                {
                    var connectionState = _context.Database.GetConnectionString();
                    _logger.LogInformation("🔗 [USER_DEBUG] Connection string: {ConnectionString}", connectionState?.Substring(0, Math.Min(50, connectionState?.Length ?? 0)) + "...");
                }
                catch (Exception connEx)
                {
                    _logger.LogError(connEx, "❌ [USER_DEBUG] Error checking connection: {Error}", connEx.Message);
                }

                _logger.LogInformation("🔍 [USER_DEBUG] Querying for existing user with Email: {Email} (primary lookup)", email);
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

                if (existingUser != null && existingUser.UserId != userGuid)
                {
                    _logger.LogWarning("⚠️ [USER_DEBUG] Found existing user with same email but different UUID. Existing: {ExistingUserId}, New: {NewUserId}", existingUser.UserId, userGuid);
                    _logger.LogInformation("🔄 [USER_DEBUG] Using existing user UUID {ExistingUserId} instead of JWT UUID {NewUserId}", existingUser.UserId, userGuid);
                    // Update the userGuid to match the existing user
                    userGuid = existingUser.UserId;
                }

                if (existingUser != null)
                {
                    _logger.LogInformation("👤 [USER_DEBUG] Found existing user: {UserId} ({Email})", existingUser.UserId, existingUser.Email);
                }
                else
                {
                    _logger.LogInformation("🆕 [USER_DEBUG] No existing user found, proceeding with creation");
                }

                if (existingUser == null)
                {
                    _logger.LogInformation("🏗️ [USER_DEBUG] Creating new User record for {UserId} ({Email})", userId, email);

                    // Set RLS context for User creation
                    _logger.LogInformation("🔐 [USER_DEBUG] Setting RLS context: app.user_id = {UserGuid}", userGuid);
                    try
                    {
                        await _context.Database.ExecuteSqlRawAsync($"SET app.user_id = '{userGuid}'");
                        _logger.LogInformation("✅ [USER_DEBUG] RLS context set successfully");
                    }
                    catch (Exception rlsEx)
                    {
                        _logger.LogError(rlsEx, "❌ [USER_DEBUG] Error setting RLS context: {Error}", rlsEx.Message);
                        throw;
                    }

                    var newUser = new User
                    {
                        UserId = userGuid,
                        Email = email,
                        FirstName = firstName,
                        LastName = lastName,
                        StytchUserId = stytchUserId,
                        OauthType = "google" // Default - could be enhanced to detect actual OAuth provider
                    };

                    _logger.LogInformation("👤 [USER_DEBUG] Created User object: UserId={UserId}, Email={Email}, FirstName={FirstName}, LastName={LastName}, StytchUserId={StytchUserId}, OauthType={OauthType}",
                        newUser.UserId, newUser.Email, newUser.FirstName, newUser.LastName, newUser.StytchUserId, newUser.OauthType);

                    _logger.LogInformation("💾 [USER_DEBUG] Adding User to EF context");
                    _context.Users.Add(newUser);

                    // Check EF change tracking
                    var trackedEntities = _context.ChangeTracker.Entries().Count();
                    var addedEntities = _context.ChangeTracker.Entries().Where(e => e.State == Microsoft.EntityFrameworkCore.EntityState.Added).Count();
                    _logger.LogInformation("📊 [USER_DEBUG] EF ChangeTracker state: {TrackedEntities} total entities, {AddedEntities} added entities", trackedEntities, addedEntities);

                    _logger.LogInformation("💽 [USER_DEBUG] Calling SaveChangesAsync...");
                    try
                    {
                        var saveResult = await _context.SaveChangesAsync();
                        _logger.LogInformation("✅ [USER_DEBUG] SaveChangesAsync completed. Affected rows: {AffectedRows}", saveResult);

                        // Immediately verify the user was saved
                        _logger.LogInformation("🔍 [USER_DEBUG] Verifying user was saved by querying database");
                        var verifyUser = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
                        if (verifyUser != null)
                        {
                            _logger.LogInformation("✅ [USER_DEBUG] VERIFICATION SUCCESS: User found in database after save: {UserId} ({Email})", verifyUser.UserId, verifyUser.Email);
                        }
                        else
                        {
                            _logger.LogError("❌ [USER_DEBUG] VERIFICATION FAILED: User NOT found in database after save! This indicates a transaction rollback or isolation issue.");
                        }

                    }
                    catch (Exception saveEx)
                    {
                        _logger.LogError(saveEx, "❌ [USER_DEBUG] Error during SaveChangesAsync: {Error}", saveEx.Message);
                        _logger.LogError("❌ [USER_DEBUG] SaveChangesAsync exception details: {ExceptionType}, InnerException: {InnerException}",
                            saveEx.GetType().Name, saveEx.InnerException?.Message ?? "None");
                        throw;
                    }

                    _logger.LogInformation("🎉 [USER_DEBUG] Successfully created User record for {UserId} ({Email})", userId, email);
                }
                else
                {
                    // Update user information if it's changed
                    bool needsUpdate = false;

                    if (existingUser.Email != email)
                    {
                        existingUser.Email = email;
                        needsUpdate = true;
                    }

                    if (string.IsNullOrEmpty(existingUser.FirstName) && !string.IsNullOrEmpty(firstName))
                    {
                        existingUser.FirstName = firstName;
                        needsUpdate = true;
                    }

                    if (string.IsNullOrEmpty(existingUser.LastName) && !string.IsNullOrEmpty(lastName))
                    {
                        existingUser.LastName = lastName;
                        needsUpdate = true;
                    }

                    if (string.IsNullOrEmpty(existingUser.StytchUserId) && !string.IsNullOrEmpty(stytchUserId))
                    {
                        existingUser.StytchUserId = stytchUserId;
                        needsUpdate = true;
                    }

                    if (needsUpdate)
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Updated User record for {UserId} ({Email})", userId, email);
                    }
                    else
                    {
                        _logger.LogDebug("User record for {UserId} ({Email}) is up to date", userId, email);
                    }
                }
                _logger.LogInformation("🏁 [USER_DEBUG] CreateOrUpdateUserAsync method completing successfully for {UserId} ({Email})", userId, email);
                return userGuid.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [USER_DEBUG] CRITICAL ERROR in CreateOrUpdateUserAsync for {UserId} ({Email}): {Error}", userId, email, ex.Message);
                _logger.LogError("❌ [USER_DEBUG] Exception details: Type={ExceptionType}, StackTrace={StackTrace}", ex.GetType().Name, ex.StackTrace);
                if (ex.InnerException != null)
                {
                    _logger.LogError("❌ [USER_DEBUG] Inner exception: {InnerExceptionType}: {InnerExceptionMessage}", ex.InnerException.GetType().Name, ex.InnerException.Message);
                }
                // Don't rethrow - session creation should continue even if user creation fails
                return userId; // Return original userId if there was an error
            }
            finally
            {
                _logger.LogInformation("🔚 [USER_DEBUG] CreateOrUpdateUserAsync method finished (finally block) for {UserId} ({Email})", userId, email);
            }
        }
    }
}