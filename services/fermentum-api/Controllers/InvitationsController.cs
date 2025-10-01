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
    public class InvitationsController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<InvitationsController> _logger;

        public InvitationsController(AuthDbContext context, ILogger<InvitationsController> logger)
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
        /// Get all invitations for a specific tenant
        /// </summary>
        [HttpGet("tenant/{tenantId:guid}")]
        public async Task<ActionResult> GetTenantInvitations(Guid tenantId)
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

                // Get all invitations for breweries in this tenant
                var invitations = await (from inv in _context.Invitations
                                       join brewery in _context.Breweries on inv.BreweryId equals brewery.BreweryId
                                       where brewery.TenantId == tenantId
                                       orderby inv.Created descending
                                       select new
                                       {
                                           invitationId = inv.InvitationId.ToString(),
                                           breweryId = inv.BreweryId.ToString(),
                                           breweryName = brewery.Name,
                                           email = inv.Email,
                                           role = inv.Role,
                                           status = inv.AcceptedFlag ? "accepted" :
                                                   (DateTime.UtcNow > inv.ExpirationDate ? "expired" : "pending"),
                                           invitationDate = inv.InvitationDate.ToString("yyyy-MM-dd HH:mm"),
                                           expirationDate = inv.ExpirationDate.ToString("yyyy-MM-dd HH:mm"),
                                           acceptedDate = inv.AcceptedDate.HasValue ?
                                                         inv.AcceptedDate.Value.ToString("yyyy-MM-dd HH:mm") : null,
                                           isExpired = DateTime.UtcNow > inv.ExpirationDate,
                                           isPending = !inv.AcceptedFlag && DateTime.UtcNow <= inv.ExpirationDate
                                       }).ToListAsync();

                return Ok(new { success = true, data = invitations });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invitations for tenant {TenantId}", tenantId);
                return StatusCode(500, new { success = false, message = "Error retrieving invitations" });
            }
        }

        /// <summary>
        /// Create a new invitation
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> CreateInvitation([FromBody] CreateInvitationRequest request)
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

                // Get brewery and verify user has admin access to the tenant
                var brewery = await (from b in _context.Breweries
                                   join ut in _context.UserTenants on b.TenantId equals ut.TenantId
                                   where b.BreweryId == request.BreweryId &&
                                         ut.UserId == currentUserId.Value &&
                                         ut.IsActive &&
                                         (ut.Role == UserTenantRoles.Owner || ut.Role == UserTenantRoles.Admin)
                                   select new { Brewery = b, UserAccess = ut }).FirstOrDefaultAsync();

                if (brewery == null)
                {
                    return StatusCode(403, new { success = false, message = "You don't have permission to invite users to this brewery" });
                }

                // Check if user limit would be exceeded
                var tenant = await (from t in _context.Tenants
                                  join p in _context.Plans on t.PlanId equals p.PlanId into planGroup
                                  from plan in planGroup.DefaultIfEmpty()
                                  where t.TenantId == brewery.Brewery.TenantId
                                  select new { Tenant = t, Plan = plan }).FirstOrDefaultAsync();

                if (tenant != null)
                {
                    var currentUserCount = await _context.UserTenants
                        .CountAsync(ut => ut.TenantId == brewery.Brewery.TenantId && ut.IsActive);

                    var userLimit = tenant.Plan?.UserLimit ?? 3;
                    if (userLimit != -1 && currentUserCount >= userLimit)
                    {
                        return BadRequest(new {
                            success = false,
                            message = $"User limit reached. Your plan allows {userLimit} users."
                        });
                    }
                }

                // Check for existing pending invitation
                var existingInvitation = await _context.Invitations
                    .FirstOrDefaultAsync(inv => inv.BreweryId == request.BreweryId &&
                                              inv.Email == request.Email &&
                                              !inv.AcceptedFlag &&
                                              DateTime.UtcNow <= inv.ExpirationDate);

                if (existingInvitation != null)
                {
                    return BadRequest(new { success = false, message = "A pending invitation already exists for this email" });
                }

                // Check if user is already a member
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                {
                    var existingMembership = await _context.UserTenants
                        .FirstOrDefaultAsync(ut => ut.UserId == existingUser.UserId &&
                                                  ut.TenantId == brewery.Brewery.TenantId &&
                                                  ut.IsActive);

                    if (existingMembership != null)
                    {
                        return BadRequest(new { success = false, message = "User is already a member of this brewery" });
                    }
                }

                // Create the invitation
                var invitation = new Invitation
                {
                    InvitationId = Guid.NewGuid(),
                    BreweryId = request.BreweryId,
                    Email = request.Email,
                    Role = request.Role,
                    InvitationDate = DateTime.UtcNow,
                    ExpirationDate = DateTime.UtcNow.AddDays(7), // 7 days to accept
                    AcceptedFlag = false,
                    Created = DateTime.UtcNow,
                    CreatedBy = currentUserId.Value,
                    Updated = DateTime.UtcNow,
                    UpdatedBy = currentUserId.Value
                };

                _context.Invitations.Add(invitation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Invitation created for {Email} to brewery {BreweryId} with role {Role}",
                    request.Email, request.BreweryId, request.Role);

                return Ok(new {
                    success = true,
                    message = "Invitation created successfully. DEMO: Email notification would be sent in production.",
                    data = new
                    {
                        invitationId = invitation.InvitationId.ToString(),
                        breweryId = invitation.BreweryId.ToString(),
                        breweryName = brewery.Brewery.Name,
                        email = invitation.Email,
                        role = invitation.Role,
                        status = "pending",
                        invitationDate = invitation.InvitationDate.ToString("yyyy-MM-dd HH:mm"),
                        expirationDate = invitation.ExpirationDate.ToString("yyyy-MM-dd HH:mm")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invitation for {Email} to brewery {BreweryId}",
                    request.Email, request.BreweryId);
                return StatusCode(500, new { success = false, message = "Error creating invitation" });
            }
        }

        /// <summary>
        /// Cancel an invitation
        /// </summary>
        [HttpDelete("{invitationId:guid}")]
        public async Task<ActionResult> CancelInvitation(Guid invitationId)
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

                // Find the invitation and verify permissions
                var invitation = await (from inv in _context.Invitations
                                      join brewery in _context.Breweries on inv.BreweryId equals brewery.BreweryId
                                      join ut in _context.UserTenants on brewery.TenantId equals ut.TenantId
                                      where inv.InvitationId == invitationId &&
                                            ut.UserId == currentUserId.Value &&
                                            ut.IsActive &&
                                            (ut.Role == UserTenantRoles.Owner || ut.Role == UserTenantRoles.Admin)
                                      select inv).FirstOrDefaultAsync();

                if (invitation == null)
                {
                    return NotFound(new { success = false, message = "Invitation not found or you don't have permission to cancel it" });
                }

                if (invitation.AcceptedFlag)
                {
                    return BadRequest(new { success = false, message = "Cannot cancel an already accepted invitation" });
                }

                // Remove the invitation
                _context.Invitations.Remove(invitation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Invitation {InvitationId} cancelled by user {UserId}",
                    invitationId, currentUserId.Value);

                return Ok(new { success = true, message = "Invitation cancelled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling invitation {InvitationId}", invitationId);
                return StatusCode(500, new { success = false, message = "Error cancelling invitation" });
            }
        }

        /// <summary>
        /// Get all pending invitations for a specific email address
        /// </summary>
        [HttpGet("email/{email}")]
        public async Task<ActionResult> GetInvitationsByEmail(string email)
        {
            try
            {
                // No RLS context needed for checking invitations by email
                var invitations = await (from inv in _context.Invitations
                                       join brewery in _context.Breweries on inv.BreweryId equals brewery.BreweryId
                                       join tenant in _context.Tenants on brewery.TenantId equals tenant.TenantId
                                       where inv.Email == email &&
                                             !inv.AcceptedFlag &&
                                             DateTime.UtcNow <= inv.ExpirationDate
                                       orderby inv.Created descending
                                       select new
                                       {
                                           invitationId = inv.InvitationId.ToString(),
                                           breweryId = inv.BreweryId.ToString(),
                                           breweryName = brewery.Name,
                                           tenantId = tenant.TenantId.ToString(),
                                           tenantName = tenant.Name,
                                           email = inv.Email,
                                           role = inv.Role,
                                           invitationDate = inv.InvitationDate.ToString("yyyy-MM-dd HH:mm"),
                                           expirationDate = inv.ExpirationDate.ToString("yyyy-MM-dd HH:mm")
                                       }).ToListAsync();

                return Ok(new { success = true, data = invitations });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invitations for email {Email}", email);
                return StatusCode(500, new { success = false, message = "Error retrieving invitations" });
            }
        }

        /// <summary>
        /// Accept an invitation (public endpoint for invited users)
        /// </summary>
        [HttpPost("{invitationId:guid}/accept")]
        public async Task<ActionResult> AcceptInvitation(Guid invitationId, [FromBody] AcceptInvitationRequest request)
        {
            try
            {
                // Find the invitation (no RLS context needed for public acceptance)
                var invitation = await _context.Invitations
                    .Include(i => i.Brewery)
                    .FirstOrDefaultAsync(inv => inv.InvitationId == invitationId);

                if (invitation == null)
                {
                    return NotFound(new { success = false, message = "Invitation not found" });
                }

                if (invitation.AcceptedFlag)
                {
                    return BadRequest(new { success = false, message = "Invitation has already been accepted" });
                }

                if (DateTime.UtcNow > invitation.ExpirationDate)
                {
                    return BadRequest(new { success = false, message = "Invitation has expired" });
                }

                // This would typically be called from the authentication flow after user registration/login
                // For now, we'll just mark it as accepted
                invitation.AcceptedFlag = true;
                invitation.AcceptedDate = DateTime.UtcNow;
                invitation.UserId = request.UserId; // Set from authenticated user
                invitation.Updated = DateTime.UtcNow;
                invitation.UpdatedBy = request.UserId;

                // Get the user to access their name information
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "User not found" });
                }

                // Check if user-tenant relationship already exists
                var existingUserTenant = await _context.UserTenants
                    .FirstOrDefaultAsync(ut => ut.UserId == request.UserId && ut.TenantId == invitation.Brewery!.TenantId);

                UserTenant userTenant;
                if (existingUserTenant != null)
                {
                    // Update existing relationship
                    existingUserTenant.Role = invitation.Role;
                    existingUserTenant.IsActive = true;
                    existingUserTenant.Updated = DateTime.UtcNow;
                    existingUserTenant.UpdatedBy = request.UserId;
                    userTenant = existingUserTenant;
                }
                else
                {
                    // Create new user-tenant relationship
                    userTenant = new UserTenant
                    {
                        UserId = request.UserId,
                        TenantId = invitation.Brewery!.TenantId,
                        Role = invitation.Role,
                        IsActive = true,
                        Created = DateTime.UtcNow,
                        CreatedBy = request.UserId,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = request.UserId
                    };
                    _context.UserTenants.Add(userTenant);
                }

                // Check if employee record already exists for this user and brewery
                var existingEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == request.UserId && e.BreweryId == invitation.BreweryId);

                if (existingEmployee == null)
                {
                    // Create the employee record linked to the brewery and tenant
                    var employee = new FermentumApi.Models.Employee
                    {
                        EmployeeId = Guid.NewGuid(),
                        TenantId = invitation.Brewery!.TenantId,
                        BreweryId = invitation.BreweryId,
                        UserId = request.UserId,
                        FirstName = user.FirstName ?? "Unknown",
                        LastName = user.LastName ?? "User",
                        IsActive = true,
                        Created = DateTime.UtcNow,
                        CreatedBy = request.UserId,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = request.UserId
                    };
                    _context.Employees.Add(employee);
                }
                else
                {
                    // Update existing employee record
                    existingEmployee.FirstName = user.FirstName ?? existingEmployee.FirstName;
                    existingEmployee.LastName = user.LastName ?? existingEmployee.LastName;
                    existingEmployee.IsActive = true;
                    existingEmployee.Updated = DateTime.UtcNow;
                    existingEmployee.UpdatedBy = request.UserId;
                }
                await _context.SaveChangesAsync();

                _logger.LogInformation("Invitation {InvitationId} accepted by user {UserId}. Created UserTenant and Employee records.",
                    invitationId, request.UserId);

                return Ok(new { success = true, message = "Invitation accepted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accepting invitation {InvitationId}", invitationId);
                return StatusCode(500, new { success = false, message = "Error accepting invitation" });
            }
        }
    }

    // DTOs for invitation operations
    public class CreateInvitationRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public Guid BreweryId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = UserTenantRoles.Member;
    }

    public class AcceptInvitationRequest
    {
        [Required]
        public Guid UserId { get; set; }
    }
}