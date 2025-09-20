using Fermentum.Auth.Models.DTOs;
using Fermentum.Auth.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fermentum.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvitationsController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<InvitationsController> _logger;

    public InvitationsController(IUserService userService, ILogger<InvitationsController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Accept an invitation to join a tenant
    /// </summary>
    [HttpPost("accept")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> AcceptInvitationAsync([FromBody] AcceptInvitationRequest request)
    {
        try
        {
            var response = await _userService.AcceptInvitationAsync(request, HttpContext);
            return Ok(new ApiResponse<LoginResponse>
            {
                Success = true,
                Data = response,
                Message = "Invitation accepted successfully"
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (NotImplementedException)
        {
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "Invitation acceptance is not fully implemented yet"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to accept invitation");
            return BadRequest(new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "Failed to accept invitation"
            });
        }
    }
}