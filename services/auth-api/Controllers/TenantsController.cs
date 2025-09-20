using Fermentum.Auth.Models.DTOs;
using Fermentum.Auth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fermentum.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;
    private readonly IUserService _userService;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(ITenantService tenantService, IUserService userService, ILogger<TenantsController> logger)
    {
        _tenantService = tenantService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get all tenants for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TenantInfo>>>> GetUserTenantsAsync()
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var tenants = await _tenantService.GetUserTenantsAsync(userId);
            return Ok(new ApiResponse<List<TenantInfo>>
            {
                Success = true,
                Data = tenants,
                Message = "Tenants retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user tenants");
            return BadRequest(new ApiResponse<List<TenantInfo>>
            {
                Success = false,
                Message = "Failed to retrieve tenants"
            });
        }
    }

    /// <summary>
    /// Create a new tenant (organization)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<TenantInfo>>> CreateTenantAsync([FromBody] CreateTenantRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Validate user has fermentum-tenant role
            var userRole = User.FindFirst("role")?.Value;
            if (userRole != "fermentum-tenant")
            {
                return Forbid("Only users with fermentum-tenant role can create breweries");
            }

            var tenant = await _tenantService.CreateTenantAsync(request, userId);
            var tenantInfo = await _tenantService.GetTenantInfoForUserAsync(userId, tenant.Id);

            return Ok(new ApiResponse<TenantInfo>
            {
                Success = true,
                Data = tenantInfo,
                Message = "Tenant created successfully"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse<TenantInfo>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create tenant {TenantName}", request.Name);
            return BadRequest(new ApiResponse<TenantInfo>
            {
                Success = false,
                Message = "Failed to create tenant"
            });
        }
    }

    /// <summary>
    /// Get tenant details by ID
    /// </summary>
    [HttpGet("{tenantId:guid}")]
    public async Task<ActionResult<ApiResponse<TenantInfo>>> GetTenantAsync(Guid tenantId)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Verify user has access to this tenant
            if (!await _tenantService.UserHasAccessToTenantAsync(userId, tenantId))
            {
                return Forbid();
            }

            var tenantInfo = await _tenantService.GetTenantInfoForUserAsync(userId, tenantId);
            if (tenantInfo == null)
            {
                return NotFound(new ApiResponse<TenantInfo>
                {
                    Success = false,
                    Message = "Tenant not found"
                });
            }

            return Ok(new ApiResponse<TenantInfo>
            {
                Success = true,
                Data = tenantInfo,
                Message = "Tenant retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tenant {TenantId}", tenantId);
            return BadRequest(new ApiResponse<TenantInfo>
            {
                Success = false,
                Message = "Failed to retrieve tenant"
            });
        }
    }

    /// <summary>
    /// Get all users in a tenant
    /// </summary>
    [HttpGet("{tenantId:guid}/users")]
    public async Task<ActionResult<ApiResponse<List<TenantUserInfo>>>> GetTenantUsersAsync(Guid tenantId)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Verify user has access to this tenant
            if (!await _tenantService.UserHasAccessToTenantAsync(userId, tenantId))
            {
                return Forbid();
            }

            // Check if user has permission to view users (admin/owner role)
            var userRole = await _tenantService.GetUserRoleInTenantAsync(userId, tenantId);
            if (userRole != "owner" && userRole != "admin")
            {
                return Forbid();
            }

            var users = await _userService.GetTenantUsersAsync(tenantId);
            return Ok(new ApiResponse<List<TenantUserInfo>>
            {
                Success = true,
                Data = users,
                Message = "Tenant users retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get users for tenant {TenantId}", tenantId);
            return BadRequest(new ApiResponse<List<TenantUserInfo>>
            {
                Success = false,
                Message = "Failed to retrieve tenant users"
            });
        }
    }

    /// <summary>
    /// Invite a user to join the tenant
    /// </summary>
    [HttpPost("{tenantId:guid}/invite")]
    public async Task<ActionResult<ApiResponse>> InviteUserAsync(Guid tenantId, [FromBody] InviteUserRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Verify user has access to this tenant
            if (!await _tenantService.UserHasAccessToTenantAsync(userId, tenantId))
            {
                return Forbid();
            }

            // Check if user has permission to invite users (admin/owner role)
            var userRole = await _tenantService.GetUserRoleInTenantAsync(userId, tenantId);
            if (userRole != "owner" && userRole != "admin")
            {
                return Forbid();
            }

            var result = await _userService.InviteUserAsync(tenantId, request, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to invite user {Email} to tenant {TenantId}", request.Email, tenantId);
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to send invitation"
            });
        }
    }

    /// <summary>
    /// Get pending invitations for a tenant
    /// </summary>
    [HttpGet("{tenantId:guid}/invitations")]
    public async Task<ActionResult<ApiResponse<List<InvitationInfo>>>> GetInvitationsAsync(Guid tenantId)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Verify user has access to this tenant
            if (!await _tenantService.UserHasAccessToTenantAsync(userId, tenantId))
            {
                return Forbid();
            }

            // Check if user has permission to view invitations (admin/owner role)
            var userRole = await _tenantService.GetUserRoleInTenantAsync(userId, tenantId);
            if (userRole != "owner" && userRole != "admin")
            {
                return Forbid();
            }

            var invitations = await _userService.GetPendingInvitationsAsync(tenantId);
            return Ok(new ApiResponse<List<InvitationInfo>>
            {
                Success = true,
                Data = invitations,
                Message = "Invitations retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get invitations for tenant {TenantId}", tenantId);
            return BadRequest(new ApiResponse<List<InvitationInfo>>
            {
                Success = false,
                Message = "Failed to retrieve invitations"
            });
        }
    }

    /// <summary>
    /// Cancel a pending invitation
    /// </summary>
    [HttpDelete("{tenantId:guid}/invitations/{invitationId:guid}")]
    public async Task<ActionResult<ApiResponse>> CancelInvitationAsync(Guid tenantId, Guid invitationId)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Verify user has access to this tenant
            if (!await _tenantService.UserHasAccessToTenantAsync(userId, tenantId))
            {
                return Forbid();
            }

            // Check if user has permission to cancel invitations (admin/owner role)
            var userRole = await _tenantService.GetUserRoleInTenantAsync(userId, tenantId);
            if (userRole != "owner" && userRole != "admin")
            {
                return Forbid();
            }

            var result = await _userService.CancelInvitationAsync(invitationId, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cancel invitation {InvitationId} for tenant {TenantId}", invitationId, tenantId);
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to cancel invitation"
            });
        }
    }
}