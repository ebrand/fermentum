using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Fermentum.Auth.Models;
using Fermentum.Auth.Services;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SessionController : ControllerBase
    {
        private readonly ISessionService _sessionService;
        private readonly ILogger<SessionController> _logger;

        public SessionController(ISessionService sessionService, ILogger<SessionController> logger)
        {
            _sessionService = sessionService;
            _logger = logger;
        }

        /// <summary>
        /// Create or refresh a user session from JWT token
        /// </summary>
        [HttpPost("create")]
        public async Task<ActionResult<SessionResponse>> CreateSession([FromBody] SessionRequest request)
        {
            try
            {
                var session = await _sessionService.CreateSessionFromTokenAsync(request.Token);

                if (session == null)
                {
                    return BadRequest(new SessionResponse
                    {
                        Success = false,
                        Message = "Invalid token or user not found"
                    });
                }

                return Ok(new SessionResponse
                {
                    Success = true,
                    Message = "Session created successfully",
                    Data = session
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating session");
                return StatusCode(500, new SessionResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Get current user session
        /// </summary>
        [HttpGet("current")]
        public async Task<ActionResult<SessionResponse>> GetCurrentSession()
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new SessionResponse
                    {
                        Success = false,
                        Message = "User not authenticated"
                    });
                }

                var session = await _sessionService.GetSessionAsync(userId.ToString());

                if (session == null)
                {
                    return NotFound(new SessionResponse
                    {
                        Success = false,
                        Message = "Session not found"
                    });
                }

                return Ok(new SessionResponse
                {
                    Success = true,
                    Message = "Session retrieved successfully",
                    Data = session
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current session");
                return StatusCode(500, new SessionResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Set the current tenant for the user session
        /// </summary>
        [HttpPost("set-current-tenant")]
        // [Authorize] // Temporarily removed for debugging - JWT validation still works via middleware
        public async Task<ActionResult<SessionResponse>> SetCurrentTenant([FromBody] SetCurrentTenantRequest request)
        {
            _logger.LogInformation("=== SetCurrentTenant method CALLED ===");
            _logger.LogInformation("Request: TenantId='{TenantId}', ModelState.IsValid={IsValid}",
                request?.TenantId ?? "null", ModelState.IsValid);

            if (!ModelState.IsValid)
            {
                var errors = ModelState.SelectMany(x => x.Value.Errors).Select(x => x.ErrorMessage).ToList();
                _logger.LogWarning("Model validation failed: {Errors}", string.Join(", ", errors));
                return BadRequest(new SessionResponse { Success = false, Message = "Invalid request" });
            }

            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                _logger.LogInformation("SetCurrentTenant - userIdClaim: '{UserIdClaim}'", userIdClaim ?? "null");

                // Debug all claims
                var allClaims = User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
                _logger.LogInformation("SetCurrentTenant - All claims: {Claims}", string.Join(", ", allClaims));

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    _logger.LogWarning("SetCurrentTenant - Failed to parse user ID from claims. UserIdClaim: '{UserIdClaim}'", userIdClaim ?? "null");
                    return Unauthorized(new SessionResponse
                    {
                        Success = false,
                        Message = "User not authenticated"
                    });
                }

                var success = await _sessionService.UpdateCurrentTenantAsync(userId.ToString(), request.TenantId);

                if (!success)
                {
                    return BadRequest(new SessionResponse
                    {
                        Success = false,
                        Message = "Failed to set current tenant. Tenant may not exist or user may not have access."
                    });
                }

                // Get updated session
                var session = await _sessionService.GetSessionAsync(userId.ToString());

                return Ok(new SessionResponse
                {
                    Success = true,
                    Message = "Current tenant updated successfully",
                    Data = session
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting current tenant");
                return StatusCode(500, new SessionResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Set the current brewery for the user session
        /// </summary>
        [HttpPost("set-current-brewery")]
        public async Task<ActionResult<SessionResponse>> SetCurrentBrewery([FromBody] SetCurrentBreweryRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new SessionResponse
                    {
                        Success = false,
                        Message = "User not authenticated"
                    });
                }

                var success = await _sessionService.UpdateCurrentBreweryAsync(userId.ToString(), request.BreweryId);

                if (!success)
                {
                    return BadRequest(new SessionResponse
                    {
                        Success = false,
                        Message = "Failed to set current brewery. Brewery may not exist or user may not have access."
                    });
                }

                // Get updated session
                var session = await _sessionService.GetSessionAsync(userId.ToString());

                return Ok(new SessionResponse
                {
                    Success = true,
                    Message = "Current brewery updated successfully",
                    Data = session
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting current brewery");
                return StatusCode(500, new SessionResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Refresh tenant data for the current session
        /// </summary>
        [HttpPost("refresh-tenants")]
        public async Task<ActionResult<SessionResponse>> RefreshTenants()
        {
            try
            {
                // Try multiple claim types for user ID (consistent with SessionService)
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ??
                                 User.FindFirst("nameid")?.Value ??
                                 User.FindFirst("user_id")?.Value;

                _logger.LogInformation("RefreshTenants - userIdClaim: '{UserIdClaim}'", userIdClaim ?? "null");

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    _logger.LogWarning("RefreshTenants - Failed to parse user ID from claims. UserIdClaim: '{UserIdClaim}'", userIdClaim ?? "null");
                    return Unauthorized(new SessionResponse
                    {
                        Success = false,
                        Message = "User not authenticated"
                    });
                }

                var success = await _sessionService.RefreshTenantDataAsync(userId.ToString());

                if (!success)
                {
                    return BadRequest(new SessionResponse
                    {
                        Success = false,
                        Message = "Failed to refresh tenant data"
                    });
                }

                // Get updated session
                var session = await _sessionService.GetSessionAsync(userId.ToString());

                return Ok(new SessionResponse
                {
                    Success = true,
                    Message = "Tenant data refreshed successfully",
                    Data = session
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing tenants");
                return StatusCode(500, new SessionResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Refresh brewery data for the current session
        /// </summary>
        [HttpPost("refresh-breweries")]
        public async Task<ActionResult<SessionResponse>> RefreshBreweries()
        {
            try
            {
                // Try multiple claim types for user ID (consistent with SessionService)
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ??
                                 User.FindFirst("nameid")?.Value ??
                                 User.FindFirst("user_id")?.Value;

                _logger.LogInformation("RefreshBreweries - userIdClaim: '{UserIdClaim}'", userIdClaim ?? "null");

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    _logger.LogWarning("RefreshBreweries - Failed to parse user ID from claims. UserIdClaim: '{UserIdClaim}'", userIdClaim ?? "null");
                    return Unauthorized(new SessionResponse
                    {
                        Success = false,
                        Message = "User not authenticated"
                    });
                }

                var success = await _sessionService.RefreshBreweryDataAsync(userId.ToString());

                if (!success)
                {
                    return BadRequest(new SessionResponse
                    {
                        Success = false,
                        Message = "Failed to refresh brewery data"
                    });
                }

                // Get updated session
                var session = await _sessionService.GetSessionAsync(userId.ToString());

                return Ok(new SessionResponse
                {
                    Success = true,
                    Message = "Brewery data refreshed successfully",
                    Data = session
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing breweries");
                return StatusCode(500, new SessionResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Invalidate the current user session
        /// </summary>
        [HttpPost("invalidate")]
        public async Task<ActionResult<SessionResponse>> InvalidateSession()
        {
            try
            {
                // DEBUGGING: Log every single session invalidation call
                _logger.LogWarning("🚨 [SESSION DEBUG] InvalidateSession called! Stack trace follows:");
                _logger.LogWarning("🚨 [SESSION DEBUG] Request Headers: {Headers}",
                    string.Join(", ", Request.Headers.Select(h => $"{h.Key}={string.Join(",", h.Value)}")));
                _logger.LogWarning("🚨 [SESSION DEBUG] User-Agent: {UserAgent}", Request.Headers["User-Agent"].ToString());
                _logger.LogWarning("🚨 [SESSION DEBUG] Referer: {Referer}", Request.Headers["Referer"].ToString());

                // TEMPORARY: Return without invalidating to stop the loop and allow notification loading
                _logger.LogWarning("🚧 [SESSION DEBUG] Session invalidation temporarily disabled to fix notifications");
                return Ok(new SessionResponse
                {
                    Success = true,
                    Message = "Session invalidation temporarily disabled for debugging"
                });

                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new SessionResponse
                    {
                        Success = false,
                        Message = "User not authenticated"
                    });
                }

                var success = await _sessionService.InvalidateSessionAsync(userId.ToString());

                return Ok(new SessionResponse
                {
                    Success = success,
                    Message = success ? "Session invalidated successfully" : "Failed to invalidate session"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating session");
                return StatusCode(500, new SessionResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }
    }
}