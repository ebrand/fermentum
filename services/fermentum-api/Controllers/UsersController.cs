using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using Fermentum.Auth.Models;
using FermentumApi.Models;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<UsersController> _logger;

        public UsersController(AuthDbContext context, ILogger<UsersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                             User.FindFirst("nameid")?.Value ??
                             User.FindFirst("user_id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            {
                return null;
            }
            return userId;
        }

        /// <summary>
        /// Get all users for a specific tenant
        /// </summary>
        [HttpGet("tenant/{tenantId:guid}")]
        public async Task<ActionResult> GetTenantUsers(Guid tenantId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Authentication required" });
                }

                // Set RLS context for this operation
                await _context.Database.ExecuteSqlRawAsync($"SET app.user_id = '{currentUserId.Value}'");

                // Verify user has access to this tenant
                var userTenantAccess = await _context.UserTenants
                    .FirstOrDefaultAsync(ut => ut.UserId == currentUserId.Value && ut.TenantId == tenantId && ut.IsActive);

                if (userTenantAccess == null)
                {
                    return StatusCode(403, new { success = false, message = "You don't have access to this tenant" });
                }

                // Get all users for this tenant with their user information
                var tenantUsers = await (from ut in _context.UserTenants
                                       join u in _context.Users on ut.UserId equals u.UserId
                                       where ut.TenantId == tenantId && ut.IsActive
                                       select new
                                       {
                                           id = u.UserId.ToString(),
                                           email = u.Email,
                                           firstName = u.FirstName,
                                           lastName = u.LastName,
                                           role = ut.Role,
                                           status = "active", // TODO: Add invitation status when implemented
                                           joinedAt = ut.Created.ToString("yyyy-MM-dd"),
                                           isOwner = ut.Role == UserTenantRoles.Owner
                                       }).ToListAsync();

                return Ok(new { success = true, data = tenantUsers });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users for tenant {TenantId}", tenantId);
                return StatusCode(500, new { success = false, message = "Error retrieving users" });
            }
        }

        /// <summary>
        /// Invite a user to join a tenant
        /// </summary>
        [HttpPost("invite")]
        public async Task<ActionResult> InviteUser([FromBody] InviteUserRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Authentication required" });
                }

                // Set RLS context for this operation
                await _context.Database.ExecuteSqlRawAsync($"SET app.user_id = '{currentUserId.Value}'");

                // Verify current user is owner or admin of the tenant
                var currentUserAccess = await _context.UserTenants
                    .FirstOrDefaultAsync(ut => ut.UserId == currentUserId.Value &&
                                              ut.TenantId == request.TenantId &&
                                              ut.IsActive &&
                                              (ut.Role == UserTenantRoles.Owner || ut.Role == UserTenantRoles.Admin));

                if (currentUserAccess == null)
                {
                    return StatusCode(403, new { success = false, message = "You don't have permission to invite users to this tenant" });
                }

                // Get tenant with plan information to check user limits
                var tenant = await (from t in _context.Tenants
                                  join p in _context.Plans on t.PlanId equals p.PlanId into planGroup
                                  from plan in planGroup.DefaultIfEmpty()
                                  where t.TenantId == request.TenantId
                                  select new { Tenant = t, Plan = plan }).FirstOrDefaultAsync();

                if (tenant == null)
                {
                    return NotFound(new { success = false, message = "Tenant not found" });
                }

                // Check if user limit would be exceeded
                var currentUserCount = await _context.UserTenants
                    .CountAsync(ut => ut.TenantId == request.TenantId && ut.IsActive);

                var userLimit = tenant.Plan?.UserLimit ?? 3; // Default to starter plan limit
                if (userLimit != -1 && currentUserCount >= userLimit)
                {
                    return BadRequest(new {
                        success = false,
                        message = $"User limit reached. Your plan allows {userLimit} users."
                    });
                }

                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                {
                    // Check if user is already a member of this tenant
                    var existingMembership = await _context.UserTenants
                        .FirstOrDefaultAsync(ut => ut.UserId == existingUser.UserId &&
                                                  ut.TenantId == request.TenantId);

                    if (existingMembership != null)
                    {
                        if (existingMembership.IsActive)
                        {
                            return BadRequest(new { success = false, message = "User is already a member of this tenant" });
                        }
                        else
                        {
                            // Reactivate existing membership
                            existingMembership.IsActive = true;
                            existingMembership.Role = request.Role;
                            existingMembership.Updated = DateTime.UtcNow;
                            existingMembership.UpdatedBy = currentUserId.Value;
                        }
                    }
                    else
                    {
                        // Add existing user to tenant
                        var userTenant = new UserTenant
                        {
                            UserId = existingUser.UserId,
                            TenantId = request.TenantId,
                            Role = request.Role,
                            IsActive = true,
                            Created = DateTime.UtcNow,
                            CreatedBy = currentUserId.Value,
                            Updated = DateTime.UtcNow,
                            UpdatedBy = currentUserId.Value
                        };

                        _context.UserTenants.Add(userTenant);
                    }

                    await _context.SaveChangesAsync();

                    return Ok(new {
                        success = true,
                        message = "User added to tenant successfully",
                        data = new
                        {
                            id = existingUser.UserId.ToString(),
                            email = existingUser.Email,
                            firstName = existingUser.FirstName,
                            lastName = existingUser.LastName,
                            role = request.Role,
                            status = "active",
                            joinedAt = DateTime.UtcNow.ToString("yyyy-MM-dd")
                        }
                    });
                }
                else
                {
                    // TODO: For now, we'll create a placeholder user and send an invitation email
                    // In a full implementation, you'd integrate with an email service

                    // Create placeholder user (they'll complete registration when they accept the invitation)
                    var newUser = new User
                    {
                        UserId = Guid.NewGuid(),
                        Email = request.Email,
                        FirstName = "Invited",
                        LastName = "User",
                        StytchUserId = "", // Will be set when they complete registration
                        OauthType = ""
                    };

                    _context.Users.Add(newUser);

                    // Create the user-tenant relationship
                    var userTenant = new UserTenant
                    {
                        UserId = newUser.UserId,
                        TenantId = request.TenantId,
                        Role = request.Role,
                        IsActive = true,
                        Created = DateTime.UtcNow,
                        CreatedBy = currentUserId.Value,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = currentUserId.Value
                    };

                    _context.UserTenants.Add(userTenant);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("User invitation created for {Email} to tenant {TenantId} with role {Role}",
                        request.Email, request.TenantId, request.Role);

                    return Ok(new {
                        success = true,
                        message = "Invitation sent successfully",
                        data = new
                        {
                            id = newUser.UserId.ToString(),
                            email = newUser.Email,
                            firstName = newUser.FirstName,
                            lastName = newUser.LastName,
                            role = request.Role,
                            status = "pending",
                            joinedAt = DateTime.UtcNow.ToString("yyyy-MM-dd")
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inviting user {Email} to tenant {TenantId}",
                    request.Email, request.TenantId);
                return StatusCode(500, new { success = false, message = "Error sending invitation" });
            }
        }

        /// <summary>
        /// Remove a user from a tenant
        /// </summary>
        [HttpDelete("tenant/{tenantId:guid}/user/{userId:guid}")]
        public async Task<ActionResult> RemoveUserFromTenant(Guid tenantId, Guid userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Authentication required" });
                }

                // Set RLS context for this operation
                await _context.Database.ExecuteSqlRawAsync($"SET app.user_id = '{currentUserId.Value}'");

                // Verify current user is owner or admin of the tenant
                var currentUserAccess = await _context.UserTenants
                    .FirstOrDefaultAsync(ut => ut.UserId == currentUserId.Value &&
                                              ut.TenantId == tenantId &&
                                              ut.IsActive &&
                                              (ut.Role == UserTenantRoles.Owner || ut.Role == UserTenantRoles.Admin));

                if (currentUserAccess == null)
                {
                    return StatusCode(403, new { success = false, message = "You don't have permission to remove users from this tenant" });
                }

                // Find the user-tenant relationship
                var userTenant = await _context.UserTenants
                    .FirstOrDefaultAsync(ut => ut.UserId == userId && ut.TenantId == tenantId && ut.IsActive);

                if (userTenant == null)
                {
                    return NotFound(new { success = false, message = "User not found in this tenant" });
                }

                // Prevent removing the owner
                if (userTenant.Role == UserTenantRoles.Owner)
                {
                    return BadRequest(new { success = false, message = "Cannot remove the owner from the tenant" });
                }

                // Deactivate the relationship instead of deleting for audit purposes
                userTenant.IsActive = false;
                userTenant.Updated = DateTime.UtcNow;
                userTenant.UpdatedBy = currentUserId.Value;

                await _context.SaveChangesAsync();

                _logger.LogInformation("User {UserId} removed from tenant {TenantId} by {CurrentUserId}",
                    userId, tenantId, currentUserId.Value);

                return Ok(new { success = true, message = "User removed from tenant successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user {UserId} from tenant {TenantId}", userId, tenantId);
                return StatusCode(500, new { success = false, message = "Error removing user" });
            }
        }
    }

    // DTOs for user operations
    public class InviteUserRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = UserTenantRoles.Member;
    }
}