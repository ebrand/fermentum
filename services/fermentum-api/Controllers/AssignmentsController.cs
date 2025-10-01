using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using FermentumApi.Models;
using FermentumApi.Services;
using Fermentum.Auth.Models;
using Fermentum.Auth.Services;
using Fermentum.Auth.Hubs;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace FermentumApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for all assignment endpoints
    public class AssignmentsController : ControllerBase
    {
        private readonly IAssignmentService _assignmentService;
        private readonly ITenantContext _tenantContext;
        private readonly ILogger<AssignmentsController> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;

        public AssignmentsController(
            IAssignmentService assignmentService,
            ITenantContext tenantContext,
            ILogger<AssignmentsController> logger,
            IHubContext<NotificationHub> hubContext)
        {
            _assignmentService = assignmentService;
            _tenantContext = tenantContext;
            _logger = logger;
            _hubContext = hubContext;
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

        private Guid? GetCurrentTenantId()
        {
            // Try to get tenant ID from JWT claims first
            var tenantIdClaim = User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out Guid tenantIdFromClaim))
            {
                return tenantIdFromClaim;
            }

            // Fallback to X-Tenant-Id header
            if (Request.Headers.ContainsKey("X-Tenant-Id"))
            {
                var headerValue = Request.Headers["X-Tenant-Id"].ToString();
                if (Guid.TryParse(headerValue, out Guid tenantIdFromHeader))
                {
                    return tenantIdFromHeader;
                }
            }

            // Final fallback to ITenantContext
            return _tenantContext.TenantId;
        }

        private async Task<Guid?> GetCurrentEmployeeIdAsync()
        {
            var userId = GetCurrentUserId();
            var tenantId = GetCurrentTenantId();

            if (userId == null || tenantId == null)
                return null;

            try
            {
                // Get the current brewery ID from session (assuming it's stored in headers or context)
                // For now, we'll look for any employee record for this user in this tenant
                var employee = await _assignmentService.GetEmployeeByUserIdAsync(userId.Value, tenantId.Value);
                return employee?.EmployeeId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding Employee ID for User {UserId} in Tenant {TenantId}", userId, tenantId);
                return null;
            }
        }

        private async Task BroadcastAssignmentUpdate(Guid assignmentId, Guid tenantId, string eventType, object? data = null)
        {
            try
            {
                // Send to tenant group (all users in the brewery)
                await _hubContext.Clients.Group($"tenant_{tenantId}")
                    .SendAsync("AssignmentUpdate", new
                    {
                        EventType = eventType,
                        AssignmentId = assignmentId,
                        TenantId = tenantId,
                        Timestamp = DateTime.UtcNow,
                        Data = data
                    });

                // If there's an assignedToUserId in the data, also send to that specific user
                if (data != null && data.GetType().GetProperty("AssignedToUserId")?.GetValue(data) is Guid assignedToUserId)
                {
                    await _hubContext.Clients.Group($"user_{assignedToUserId}")
                        .SendAsync("AssignmentUpdate", new
                        {
                            EventType = eventType,
                            AssignmentId = assignmentId,
                            TenantId = tenantId,
                            Timestamp = DateTime.UtcNow,
                            Data = data
                        });
                }

                _logger.LogInformation("📡 [SIGNALR] Broadcasted assignment update: {EventType} for assignment {AssignmentId} in tenant {TenantId}",
                    eventType, assignmentId, tenantId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [SIGNALR] Failed to broadcast assignment update: {EventType}", eventType);
            }
        }

        /// <summary>
        /// Get all assignments for the current tenant
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AssignmentDto>>> GetAssignments(
            [FromQuery] string? status = null,
            [FromQuery] string? priority = null,
            [FromQuery] Guid? categoryId = null,
            [FromQuery] Guid? assignedTo = null,
            [FromQuery] DateTime? dueDateFrom = null,
            [FromQuery] DateTime? dueDateTo = null,
            [FromQuery] bool? isOverdue = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int? limit = null,
            [FromQuery] int? offset = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortOrder = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var filters = new AssignmentFilters
                {
                    Status = string.IsNullOrEmpty(status) ? null : Enum.Parse<AssignmentStatus>(status, true),
                    Priority = string.IsNullOrEmpty(priority) ? null : Enum.Parse<AssignmentPriority>(priority, true),
                    CategoryId = categoryId,
                    AssignedTo = assignedTo,
                    DueDateFrom = dueDateFrom,
                    DueDateTo = dueDateTo,
                    IsOverdue = isOverdue,
                    SearchTerm = searchTerm,
                    Limit = limit,
                    Offset = offset,
                    SortBy = sortBy,
                    SortOrder = sortOrder
                };

                var assignments = await _assignmentService.GetAssignmentsAsync(userId.Value, tenantId.Value, filters);
                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignments");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get a specific assignment by ID
        /// </summary>
        [HttpGet("{assignmentId}")]
        public async Task<ActionResult<AssignmentDto>> GetAssignment(Guid assignmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var assignment = await _assignmentService.GetAssignmentByIdAsync(assignmentId, userId.Value, tenantId.Value);
                if (assignment == null)
                {
                    return NotFound();
                }

                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Create a new assignment
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Guid>> CreateAssignment([FromBody] CreateAssignmentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var assignmentId = await _assignmentService.CreateAssignmentAsync(request, userId.Value, tenantId.Value);
                return CreatedAtAction(nameof(GetAssignment), new { assignmentId }, new { AssignmentId = assignmentId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating assignment");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update an existing assignment
        /// </summary>
        [HttpPut("{assignmentId}")]
        public async Task<ActionResult> UpdateAssignment(Guid assignmentId, [FromBody] UpdateAssignmentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var success = await _assignmentService.UpdateAssignmentAsync(assignmentId, request, userId.Value, tenantId.Value);
                if (!success)
                {
                    return NotFound();
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete an assignment
        /// </summary>
        [HttpDelete("{assignmentId}")]
        public async Task<ActionResult> DeleteAssignment(Guid assignmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var success = await _assignmentService.DeleteAssignmentAsync(assignmentId, userId.Value, tenantId.Value);
                if (!success)
                {
                    return NotFound();
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Assign an assignment to an employee
        /// </summary>
        [HttpPost("{assignmentId}/assign")]
        public async Task<ActionResult> AssignToEmployee(Guid assignmentId, [FromBody] AssignToEmployeeRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var success = await _assignmentService.AssignToEmployeeAsync(
                    assignmentId, request.EmployeeId, userId.Value, tenantId.Value, request.Reason);

                if (!success)
                {
                    return NotFound();
                }

                // Broadcast assignment assignment via SignalR
                await BroadcastAssignmentUpdate(assignmentId, tenantId.Value, "AssignmentAssigned", new
                {
                    EmployeeId = request.EmployeeId,
                    Reason = request.Reason
                });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning assignment {AssignmentId} to employee {EmployeeId}",
                    assignmentId, request.EmployeeId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Confirm assignment acceptance (by assignee)
        /// </summary>
        [HttpPost("{assignmentId}/confirm")]
        public async Task<ActionResult> ConfirmAssignment(Guid assignmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                // Get the current employee ID for the user
                var employeeId = await GetCurrentEmployeeIdAsync();
                if (employeeId == null)
                {
                    _logger.LogWarning("No Employee record found for User {UserId} in Tenant {TenantId}", userId, tenantId);
                    return BadRequest("User is not associated with an employee record");
                }

                var success = await _assignmentService.ConfirmAssignmentAsync(assignmentId, employeeId.Value, tenantId.Value);
                if (!success)
                {
                    return NotFound();
                }

                // Broadcast assignment acceptance via SignalR
                await BroadcastAssignmentUpdate(assignmentId, tenantId.Value, "AssignmentAccepted", new
                {
                    AcceptedBy = userId.Value,
                    EmployeeId = employeeId.Value
                });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Start working on an assignment
        /// </summary>
        [HttpPost("{assignmentId}/start")]
        public async Task<ActionResult> StartAssignment(Guid assignmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                // Get the current employee ID for the user
                var employeeId = await GetCurrentEmployeeIdAsync();
                if (employeeId == null)
                {
                    _logger.LogWarning("No Employee record found for User {UserId} in Tenant {TenantId}", userId, tenantId);
                    return BadRequest("User is not associated with an employee record");
                }

                var success = await _assignmentService.StartAssignmentAsync(assignmentId, employeeId.Value, tenantId.Value);
                if (!success)
                {
                    return NotFound();
                }

                // Broadcast assignment start via SignalR
                await BroadcastAssignmentUpdate(assignmentId, tenantId.Value, "AssignmentStarted", new
                {
                    StartedBy = userId.Value,
                    EmployeeId = employeeId.Value
                });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Complete an assignment
        /// </summary>
        [HttpPost("{assignmentId}/complete")]
        public async Task<ActionResult> CompleteAssignment(Guid assignmentId, [FromBody] CompleteAssignmentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                // Get the current employee ID for the user
                var employeeId = await GetCurrentEmployeeIdAsync();
                if (employeeId == null)
                {
                    _logger.LogWarning("No Employee record found for User {UserId} in Tenant {TenantId}", userId, tenantId);
                    return BadRequest("User is not associated with an employee record");
                }

                var success = await _assignmentService.CompleteAssignmentAsync(
                    assignmentId, employeeId.Value, tenantId.Value, request.CompletionNotes, request.PhotoUrls);

                if (!success)
                {
                    return NotFound();
                }

                // Broadcast assignment completion via SignalR
                await BroadcastAssignmentUpdate(assignmentId, tenantId.Value, "AssignmentCompleted", new
                {
                    CompletedBy = userId.Value,
                    EmployeeId = employeeId.Value,
                    CompletionNotes = request.CompletionNotes,
                    PhotoCount = request.PhotoUrls?.Length ?? 0
                });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Pause an assignment
        /// </summary>
        [HttpPost("{assignmentId}/pause")]
        public async Task<ActionResult> PauseAssignment(Guid assignmentId, [FromBody] PauseAssignmentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                // Get the current employee ID for the user
                var employeeId = await GetCurrentEmployeeIdAsync();
                if (employeeId == null)
                {
                    _logger.LogWarning("No Employee record found for User {UserId} in Tenant {TenantId}", userId, tenantId);
                    return BadRequest("User is not associated with an employee record");
                }

                var success = await _assignmentService.PauseAssignmentAsync(assignmentId, employeeId.Value, tenantId.Value, request.Reason);
                if (!success)
                {
                    return NotFound();
                }

                // Broadcast assignment pause via SignalR
                await BroadcastAssignmentUpdate(assignmentId, tenantId.Value, "AssignmentPaused", new
                {
                    PausedBy = userId.Value,
                    EmployeeId = employeeId.Value,
                    Reason = request.Reason
                });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pausing assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Cancel an assignment
        /// </summary>
        [HttpPost("{assignmentId}/cancel")]
        public async Task<ActionResult> CancelAssignment(Guid assignmentId, [FromBody] CancelAssignmentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var success = await _assignmentService.CancelAssignmentAsync(assignmentId, userId.Value, tenantId.Value, request.Reason);
                if (!success)
                {
                    return NotFound();
                }

                // Broadcast assignment cancellation via SignalR
                await BroadcastAssignmentUpdate(assignmentId, tenantId.Value, "AssignmentCancelled", new
                {
                    CancelledBy = userId.Value,
                    Reason = request.Reason
                });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Sign off on a completed assignment (manager approval)
        /// </summary>
        [HttpPost("{assignmentId}/signoff")]
        public async Task<ActionResult> SignOffAssignment(Guid assignmentId, [FromBody] SignOffRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var success = await _assignmentService.SignOffAssignmentAsync(assignmentId, userId.Value, tenantId.Value, request.Notes);
                if (!success)
                {
                    return NotFound();
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error signing off assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get assignment categories
        /// </summary>
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<AssignmentCategoryDto>>> GetCategories()
        {
            try
            {
                var tenantId = GetCurrentTenantId();
                if (tenantId == null)
                {
                    return Unauthorized();
                }

                var categories = await _assignmentService.GetCategoriesAsync(tenantId.Value);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment categories");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get assignments summary/dashboard data
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<AssignmentSummaryDto>> GetAssignmentSummary(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var tenantId = GetCurrentTenantId();
                if (tenantId == null)
                {
                    return Unauthorized();
                }

                var summary = await _assignmentService.GetAssignmentSummaryAsync(tenantId.Value, startDate, endDate);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment summary");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get my assigned tasks
        /// </summary>
        [HttpGet("my-assignments")]
        public async Task<ActionResult<IEnumerable<AssignmentDto>>> GetMyAssignments([FromQuery] string? status = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                AssignmentStatus? assignmentStatus = string.IsNullOrEmpty(status) ? null : Enum.Parse<AssignmentStatus>(status, true);
                var assignments = await _assignmentService.GetMyAssignmentsByUserIdAsync(userId.Value, tenantId.Value, assignmentStatus);
                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting my assignments");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get assignment comments
        /// </summary>
        [HttpGet("{assignmentId}/comments")]
        public async Task<ActionResult<IEnumerable<AssignmentComment>>> GetAssignmentComments(Guid assignmentId)
        {
            try
            {
                var tenantId = GetCurrentTenantId();
                if (tenantId == null)
                {
                    return Unauthorized();
                }

                var comments = await _assignmentService.GetAssignmentCommentsAsync(assignmentId, tenantId.Value);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment comments for {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Add comment to assignment
        /// </summary>
        [HttpPost("{assignmentId}/comments")]
        public async Task<ActionResult<Guid>> AddAssignmentComment(Guid assignmentId, [FromBody] AddCommentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (userId == null || tenantId == null)
                {
                    return Unauthorized();
                }

                var commentId = await _assignmentService.AddCommentAsync(
                    assignmentId, request.CommentText, userId.Value, tenantId.Value, request.IsInternal, request.PhotoUrls);

                return Ok(new { CommentId = commentId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding comment to assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "Internal server error");
            }
        }
    }

    // Request DTOs
    public class AssignToEmployeeRequest
    {
        public Guid EmployeeId { get; set; }
        public string? Reason { get; set; }
    }

    public class CompleteAssignmentRequest
    {
        public string? CompletionNotes { get; set; }
        public string[]? PhotoUrls { get; set; }
    }

    public class SignOffRequest
    {
        public string? Notes { get; set; }
    }

    public class AddCommentRequest
    {
        [Required]
        public string CommentText { get; set; } = string.Empty;
        public bool IsInternal { get; set; } = false;
        public string[]? PhotoUrls { get; set; }
    }

    public class PauseAssignmentRequest
    {
        public string? Reason { get; set; }
    }

    public class CancelAssignmentRequest
    {
        public string? Reason { get; set; }
    }
}