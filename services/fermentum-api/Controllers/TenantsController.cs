using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using Fermentum.Auth.Models;
using FermentumApi.Models;
using System.Security.Claims;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TenantsController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<TenantsController> _logger;

        public TenantsController(AuthDbContext context, ILogger<TenantsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            {
                return null;
            }
            return userId;
        }

        [HttpPost]
        public async Task<ActionResult> CreateTenant([FromBody] CreateTenantRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Authentication required" });
                }

                _logger.LogInformation("Creating tenant '{TenantName}' for user {UserId}", request.Name, currentUserId.Value);

                // Use a transaction to ensure RLS context is maintained
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Set user context for RLS policies within the transaction
                    await _context.Database.ExecuteSqlRawAsync($"SET app.user_id = '{currentUserId.Value}'");

                    // User should already exist from authentication flow
                    var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId.Value);
                    if (existingUser == null)
                    {
                        _logger.LogWarning("User {UserId} not found during tenant creation - this should not happen in the new flow", currentUserId.Value);
                        return StatusCode(500, new { success = false, message = "User not found - please re-authenticate" });
                    }

                    // Look up the plan by name
                    var plan = await _context.Plans.FirstOrDefaultAsync(p => p.Name == request.PlanType);
                    if (plan == null)
                    {
                        // Default to Starter plan if requested plan not found
                        plan = await _context.Plans.FirstOrDefaultAsync(p => p.Name == "Starter");
                        _logger.LogWarning("Plan '{PlanType}' not found, defaulting to Starter plan", request.PlanType);
                    }

                    // Create the tenant
                    var tenant = new Tenant
                    {
                        TenantId = Guid.NewGuid(),
                        Name = request.Name,
                        PlanId = plan?.PlanId, // Assign the plan
                        Created = DateTime.UtcNow,
                        CreatedBy = currentUserId.Value,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = currentUserId.Value
                    };

                    _context.Tenants.Add(tenant);

                    // Save tenant first within the transaction
                    await _context.SaveChangesAsync();

                    // Set tenant context for RLS before creating brewery
                    await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenant.TenantId}'");

                    // Create a brewery for the tenant (since this is a brewery management system)
                    var brewery = new Brewery
                    {
                        BreweryId = Guid.NewGuid(),
                        TenantId = tenant.TenantId,
                        Name = request.Name, // Use same name as tenant
                        Created = DateTime.UtcNow,
                        CreatedBy = currentUserId.Value,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = currentUserId.Value
                    };

                    _context.Breweries.Add(brewery);

                    // Save brewery with tenant context set
                    await _context.SaveChangesAsync();

                    // Create User_Tenant relationship to link user to the created tenant as owner
                    var userTenant = new FermentumApi.Models.UserTenant
                    {
                        UserId = currentUserId.Value,
                        TenantId = tenant.TenantId,
                        Role = FermentumApi.Models.UserTenantRoles.Owner,
                        IsActive = true,
                        Created = DateTime.UtcNow,
                        CreatedBy = currentUserId.Value,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = currentUserId.Value
                    };

                    _context.UserTenants.Add(userTenant);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Created User_Tenant relationship for User {UserId} and Tenant {TenantId} with role {Role}",
                        currentUserId.Value, tenant.TenantId, FermentumApi.Models.UserTenantRoles.Owner);

                    // Commit the transaction
                    await transaction.CommitAsync();

                    _logger.LogInformation("Successfully created tenant {TenantId} and brewery {BreweryId}", tenant.TenantId, brewery.BreweryId);

                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            id = tenant.TenantId,
                            tenantId = tenant.TenantId,
                            name = tenant.Name,
                            breweryId = brewery.BreweryId
                        },
                        message = "Tenant and brewery created successfully"
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error creating tenant - transaction rolled back");
                    return StatusCode(500, new { success = false, message = "Internal server error" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tenant");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet]
        public async Task<ActionResult> GetUserTenants()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Authentication required" });
                }

                // For simplicity, return all tenants where this user is the creator
                // In a full implementation, you'd check user-tenant relationships
                var tenants = await _context.Tenants
                    .Where(t => t.CreatedBy == currentUserId.Value)
                    .Select(t => new
                    {
                        tenantId = t.TenantId,
                        tenantName = t.Name,
                        role = "owner" // Simplified - creator is always owner
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = tenants
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user tenants");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

    }

    // DTOs for tenant operations
    public class CreateTenantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Location { get; set; }
        public string? Website { get; set; }
        public string? PlanType { get; set; } = "Starter"; // Plan type: Starter, Professional, Enterprise
    }
}