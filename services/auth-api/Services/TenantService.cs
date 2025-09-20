using Fermentum.Auth.Data;
using Fermentum.Auth.Models;
using Fermentum.Auth.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using Dapper;

namespace Fermentum.Auth.Services;

public class TenantService : ITenantService
{
    private readonly AuthDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly ILogger<TenantService> _logger;

    public TenantService(AuthDbContext context, IDistributedCache cache, ILogger<TenantService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Tenant?> GetTenantBySlugAsync(string slug)
    {
        var cacheKey = $"tenant:slug:{slug}";
        var cached = await _cache.GetStringAsync(cacheKey);

        if (cached != null)
        {
            return JsonSerializer.Deserialize<Tenant>(cached);
        }

        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive);

        if (tenant != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(tenant), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            });
        }

        return tenant;
    }

    public async Task<Tenant?> GetTenantBySubdomainAsync(string subdomain)
    {
        var cacheKey = $"tenant:subdomain:{subdomain}";
        var cached = await _cache.GetStringAsync(cacheKey);

        if (cached != null)
        {
            return JsonSerializer.Deserialize<Tenant>(cached);
        }

        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Subdomain == subdomain && t.IsActive);

        if (tenant != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(tenant), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            });
        }

        return tenant;
    }

    public async Task<Tenant?> GetTenantByIdAsync(Guid tenantId)
    {
        var cacheKey = $"tenant:id:{tenantId}";
        var cached = await _cache.GetStringAsync(cacheKey);

        if (cached != null)
        {
            return JsonSerializer.Deserialize<Tenant>(cached);
        }

        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId && t.IsActive);

        if (tenant != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(tenant), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            });
        }

        return tenant;
    }

    public async Task<Tenant?> ResolveTenantFromRequestAsync(HttpContext context)
    {
        // 1. Try to get tenant from JWT claims first
        var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var tenantId))
        {
            var tenant = await GetTenantByIdAsync(tenantId);
            if (tenant != null) return tenant;
        }

        // 2. Try to resolve from subdomain (most common in SaaS)
        var host = context.Request.Host.Host;

        // Extract subdomain from host (e.g., "craftbeer.fermentum.dev" -> "craftbeer")
        if (host.Contains("fermentum.dev"))
        {
            var parts = host.Split('.');
            if (parts.Length >= 3) // subdomain.fermentum.dev
            {
                var subdomain = parts[0];
                if (subdomain != "www" && subdomain != "api" && subdomain != "admin")
                {
                    return await GetTenantBySubdomainAsync(subdomain);
                }
            }
        }

        // 3. Try to get from X-Tenant-Slug header
        if (context.Request.Headers.TryGetValue("X-Tenant-Slug", out var tenantSlugHeader))
        {
            var tenantSlug = tenantSlugHeader.FirstOrDefault();
            if (!string.IsNullOrEmpty(tenantSlug))
            {
                return await GetTenantBySlugAsync(tenantSlug);
            }
        }

        // 4. Try to get from query parameter (fallback)
        if (context.Request.Query.TryGetValue("tenant", out var tenantSlugQuery))
        {
            var tenantSlug = tenantSlugQuery.FirstOrDefault();
            if (!string.IsNullOrEmpty(tenantSlug))
            {
                return await GetTenantBySlugAsync(tenantSlug);
            }
        }

        _logger.LogWarning("Could not resolve tenant from request. Host: {Host}", host);
        return null;
    }

    public async Task<TenantInfo?> GetTenantInfoForUserAsync(Guid userId, Guid tenantId)
    {
        var query = from t in _context.Tenants
                   join tu in _context.TenantUsers on t.Id equals tu.TenantId
                   where t.Id == tenantId && tu.UserId == userId && t.IsActive && tu.Status == "active"
                   select new
                   {
                       Id = t.Id,
                       Name = t.Name,
                       Slug = t.Slug,
                       Subdomain = t.Subdomain,
                       PlanType = t.PlanType,
                       Role = tu.Role,
                       Features = t.Features,
                       Settings = t.Settings
                   };

        var result = await query.FirstOrDefaultAsync();
        if (result == null) return null;

        return new TenantInfo
        {
            Id = result.Id,
            Name = result.Name,
            Slug = result.Slug,
            Subdomain = result.Subdomain,
            PlanType = result.PlanType,
            Role = result.Role,
            Features = !string.IsNullOrEmpty(result.Features)
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(result.Features) ?? new Dictionary<string, object>()
                : new Dictionary<string, object>(),
            Settings = !string.IsNullOrEmpty(result.Settings)
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(result.Settings) ?? new Dictionary<string, object>()
                : new Dictionary<string, object>()
        };
    }

    public async Task<List<TenantInfo>> GetUserTenantsAsync(Guid userId)
    {
        var query = from t in _context.Tenants
                   join tu in _context.TenantUsers on t.Id equals tu.TenantId
                   where tu.UserId == userId && t.IsActive && tu.Status == "active"
                   select new
                   {
                       Id = t.Id,
                       Name = t.Name,
                       Slug = t.Slug,
                       Subdomain = t.Subdomain,
                       PlanType = t.PlanType,
                       Role = tu.Role,
                       Features = t.Features,
                       Settings = t.Settings
                   };

        var results = await query.ToListAsync();

        return results.Select(r => new TenantInfo
        {
            Id = r.Id,
            Name = r.Name,
            Slug = r.Slug,
            Subdomain = r.Subdomain,
            PlanType = r.PlanType,
            Role = r.Role,
            Features = !string.IsNullOrEmpty(r.Features)
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(r.Features) ?? new Dictionary<string, object>()
                : new Dictionary<string, object>(),
            Settings = !string.IsNullOrEmpty(r.Settings)
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(r.Settings) ?? new Dictionary<string, object>()
                : new Dictionary<string, object>()
        }).ToList();
    }

    public async Task<Tenant> CreateTenantAsync(CreateTenantRequest request, Guid createdBy)
    {
        var tenantId = Guid.NewGuid();

        // Retry logic for slug generation and tenant creation
        var maxRetries = 3;
        var attempt = 0;

        while (attempt < maxRetries)
        {
            try
            {
                var slug = string.IsNullOrEmpty(request.Slug)
                    ? await GenerateUniqueSlugAsync(request.Name)
                    : request.Slug;

                _logger.LogInformation("Creating tenant {TenantName} with slug {Slug} (attempt {Attempt})",
                    request.Name, slug, attempt + 1);

                var tenant = new Tenant
                {
                    Id = tenantId,
                    Name = request.Name,
                    Slug = slug,
                    Subdomain = request.Subdomain,
                    Domain = request.Domain,
                    PlanType = request.PlanType ?? "free",
                    SubscriptionStatus = "active",
                    BillingEmail = request.BillingEmail,
                    Timezone = request.Timezone ?? "UTC",
                    Locale = request.Locale ?? "en-US",
                    SchemaName = GenerateSchemaName(tenantId),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = createdBy,
                    IsActive = true
                };

                _context.Tenants.Add(tenant);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully created tenant {TenantName} with slug {Slug}",
                    request.Name, slug);

                // Create tenant schema
                await CreateTenantSchemaAsync(tenant);

                // Create default tenant roles
                await CreateDefaultTenantRolesAsync(tenant.Id);

                // Associate the creator as the tenant owner with the proper role
                await CreateTenantOwnerAssociationAsync(tenant.Id, createdBy);

                // Clear cache
                await InvalidateTenantCacheAsync(tenant);

                // If we get here, tenant creation succeeded
                return tenant;
            }
            catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23505")
            {
                // Unique constraint violation - slug already exists
                _logger.LogWarning("Slug collision detected for tenant {TenantName} on attempt {Attempt}. Retrying...",
                    request.Name, attempt + 1);

                // Clear the context to remove the failed entity
                _context.ChangeTracker.Clear();

                attempt++;
                if (attempt >= maxRetries)
                {
                    _logger.LogError("Failed to create tenant {TenantName} after {MaxRetries} attempts due to slug collisions",
                        request.Name, maxRetries);
                    throw;
                }

                // Add a small delay to reduce race condition likelihood
                await Task.Delay(100 * attempt);
            }
        }

        // This should never be reached, but add fallback
        throw new InvalidOperationException("Failed to create tenant after all retry attempts");
    }

    private async Task CreateTenantSchemaAsync(Tenant tenant)
    {
        // Create tenant schema in database
        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "SELECT public.create_tenant_schema({0}, {1})",
                tenant.Id, tenant.CreatedBy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create tenant schema for {TenantId}", tenant.Id);
            // Rollback tenant creation
            _context.Tenants.Remove(tenant);
            await _context.SaveChangesAsync();
            throw;
        }
    }

    private async Task CreateTenantOwnerAssociationAsync(Guid tenantId, Guid createdBy)
    {
        try
        {
            // Get the owner role ID for this tenant
            var ownerRole = await _context.Database.GetDbConnection().QuerySingleOrDefaultAsync<dynamic>(@"
                SELECT id FROM tenant_roles
                WHERE tenant_id = @tenantId AND name = 'owner'",
                new { tenantId });

            if (ownerRole == null)
            {
                throw new InvalidOperationException($"Owner role not found for tenant {tenantId}");
            }

            // Associate the creator as the tenant owner with the proper role
            var tenantUser = new TenantUser
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = createdBy,
                Role = "owner", // Keep string for backward compatibility
                TenantRoleId = (Guid)ownerRole.id, // Reference to the actual role record
                Status = "active",
                JoinedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.TenantUsers.Add(tenantUser);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created owner association for user {UserId} in tenant {TenantId}",
                createdBy, tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tenant owner association for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<bool> UserHasAccessToTenantAsync(Guid userId, Guid tenantId)
    {
        return await _context.TenantUsers
            .AnyAsync(tu => tu.UserId == userId && tu.TenantId == tenantId && tu.Status == "active");
    }

    public async Task<string?> GetUserRoleInTenantAsync(Guid userId, Guid tenantId)
    {
        var tenantUser = await _context.TenantUsers
            .FirstOrDefaultAsync(tu => tu.UserId == userId && tu.TenantId == tenantId && tu.Status == "active");

        return tenantUser?.Role;
    }

    private static string GenerateSchemaName(Guid tenantId)
    {
        return $"tenant_{tenantId:N}"; // Remove hyphens from GUID
    }

    private async Task<string> GenerateUniqueSlugAsync(string name)
    {
        // Convert name to slug format
        var baseSlug = name
            .ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("&", "and")
            .Replace("@", "at")
            .Replace("!", "")
            .Replace("?", "")
            .Replace("#", "")
            .Replace("$", "")
            .Replace("%", "")
            .Replace("^", "")
            .Replace("*", "")
            .Replace("(", "")
            .Replace(")", "")
            .Replace("+", "")
            .Replace("=", "")
            .Replace("[", "")
            .Replace("]", "")
            .Replace("{", "")
            .Replace("}", "")
            .Replace("|", "")
            .Replace("\\", "")
            .Replace("/", "")
            .Replace(":", "")
            .Replace(";", "")
            .Replace("\"", "")
            .Replace("<", "")
            .Replace(">", "");

        // Remove any double dashes and trim
        baseSlug = string.Join("-", baseSlug.Split('-', StringSplitOptions.RemoveEmptyEntries));

        // Ensure slug is not too long
        if (baseSlug.Length > 50)
        {
            baseSlug = baseSlug.Substring(0, 50).TrimEnd('-');
        }

        // Check if slug exists, if so add a number
        var slug = baseSlug;
        var counter = 1;

        while (await _context.Tenants.AnyAsync(t => t.Slug == slug))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        return slug;
    }

    public async Task UpdateTenantSubscriptionAsync(Guid tenantId, Guid userId, string stripeCustomerId, string stripeSubscriptionId, string stripePriceId, string planType, string subscriptionStatus, DateTime? currentPeriodStart, DateTime? currentPeriodEnd, DateTime? trialEnd, bool cancelAtPeriodEnd)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Update tenant plan type and subscription status
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant != null)
            {
                tenant.PlanType = planType;
                tenant.SubscriptionStatus = subscriptionStatus;
                tenant.UpdatedAt = DateTime.UtcNow;
            }

            // Insert or update user subscription record
            var existingSubscription = await _context.Database.GetDbConnection().QuerySingleOrDefaultAsync<dynamic>(
                "SELECT id FROM user_subscriptions WHERE tenant_id = @tenantId",
                new { tenantId });

            if (existingSubscription != null)
            {
                // Update existing subscription
                await _context.Database.GetDbConnection().ExecuteAsync(@"
                    UPDATE user_subscriptions
                    SET stripe_subscription_id = @stripeSubscriptionId,
                        stripe_price_id = @stripePriceId,
                        plan_type = @planType,
                        subscription_status = @subscriptionStatus,
                        current_period_start = @currentPeriodStart,
                        current_period_end = @currentPeriodEnd,
                        trial_end = @trialEnd,
                        cancel_at_period_end = @cancelAtPeriodEnd,
                        updated_at = @updatedAt
                    WHERE tenant_id = @tenantId",
                    new
                    {
                        stripeSubscriptionId, stripePriceId, planType, subscriptionStatus,
                        currentPeriodStart, currentPeriodEnd, trialEnd, cancelAtPeriodEnd,
                        tenantId, updatedAt = DateTime.UtcNow
                    });
            }
            else
            {
                // Insert new subscription
                await _context.Database.GetDbConnection().ExecuteAsync(@"
                    INSERT INTO user_subscriptions
                    (user_id, tenant_id, stripe_subscription_id, stripe_price_id, plan_type,
                     subscription_status, current_period_start, current_period_end, trial_end,
                     cancel_at_period_end, created_at, updated_at)
                    VALUES (@userId, @tenantId, @stripeSubscriptionId, @stripePriceId, @planType,
                            @subscriptionStatus, @currentPeriodStart, @currentPeriodEnd, @trialEnd,
                            @cancelAtPeriodEnd, @createdAt, @updatedAt)",
                    new
                    {
                        userId, tenantId, stripeSubscriptionId, stripePriceId, planType,
                        subscriptionStatus, currentPeriodStart, currentPeriodEnd, trialEnd,
                        cancelAtPeriodEnd, createdAt = DateTime.UtcNow, updatedAt = DateTime.UtcNow
                    });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Invalidate cache
            await InvalidateTenantCacheAsync(tenant!);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task CreateDefaultTenantRolesAsync(Guid tenantId)
    {
        try
        {
            _logger.LogInformation("Creating default roles for tenant {TenantId}", tenantId);

            foreach (var roleConfig in DefaultTenantRoles.SystemRoles.Values)
            {
                // Check if role already exists (in case of retry)
                var existingRole = await _context.Database.GetDbConnection().QuerySingleOrDefaultAsync<dynamic>(@"
                    SELECT id FROM tenant_roles
                    WHERE tenant_id = @tenantId AND name = @roleName",
                    new { tenantId, roleName = roleConfig.Name });

                if (existingRole == null)
                {
                    // Create the role
                    await _context.Database.GetDbConnection().ExecuteAsync(@"
                        INSERT INTO tenant_roles
                        (tenant_id, name, display_name, description, permissions, is_system_role, created_at, updated_at)
                        VALUES (@tenantId, @name, @displayName, @description, @permissions::jsonb, @isSystemRole, @createdAt, @updatedAt)",
                        new
                        {
                            tenantId,
                            name = roleConfig.Name,
                            displayName = roleConfig.DisplayName,
                            description = roleConfig.Description,
                            permissions = JsonSerializer.Serialize(roleConfig.Permissions),
                            isSystemRole = roleConfig.IsSystemRole,
                            createdAt = DateTime.UtcNow,
                            updatedAt = DateTime.UtcNow
                        });

                    _logger.LogInformation("Created default role {RoleName} for tenant {TenantId}",
                        roleConfig.Name, tenantId);
                }
                else
                {
                    _logger.LogInformation("Role {RoleName} already exists for tenant {TenantId}",
                        roleConfig.Name, tenantId);
                }
            }

            _logger.LogInformation("Completed creating default roles for tenant {TenantId}", tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating default roles for tenant {TenantId}", tenantId);
            throw;
        }
    }

    private async Task InvalidateTenantCacheAsync(Tenant tenant)
    {
        var cacheKeys = new[]
        {
            $"tenant:id:{tenant.Id}",
            $"tenant:slug:{tenant.Slug}",
            !string.IsNullOrEmpty(tenant.Subdomain) ? $"tenant:subdomain:{tenant.Subdomain}" : null
        }.Where(k => k != null);

        foreach (var key in cacheKeys)
        {
            await _cache.RemoveAsync(key!);
        }
    }
}