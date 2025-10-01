using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Fermentum.Auth.Data;
using FermentumApi.Models.Equipment;
using System.Text.Json.Serialization;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EquipmentScheduleController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<EquipmentScheduleController> _logger;

        public EquipmentScheduleController(AuthDbContext context, ILogger<EquipmentScheduleController> logger)
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

        private async Task<Guid?> GetUserTenantIdAsync()
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue) return null;

            var userTenant = await _context.UserTenants
                .Where(ut => ut.UserId == currentUserId.Value && ut.IsActive)
                .FirstOrDefaultAsync();

            return userTenant?.TenantId;
        }

        // GET: api/equipmentschedule
        [HttpGet]
        public async Task<ActionResult> GetSchedules([FromQuery] Guid? equipmentId = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                var query = _context.EquipmentSchedules
                    .Include(es => es.Equipment)
                    .AsQueryable();

                if (equipmentId.HasValue)
                {
                    query = query.Where(es => es.EquipmentId == equipmentId.Value);
                }

                if (startDate.HasValue && endDate.HasValue)
                {
                    query = query.Where(es => es.StartDateTime <= endDate.Value && es.EndDateTime >= startDate.Value);
                }
                else if (startDate.HasValue)
                {
                    query = query.Where(es => es.EndDateTime >= startDate.Value);
                }
                else if (endDate.HasValue)
                {
                    query = query.Where(es => es.StartDateTime <= endDate.Value);
                }

                var schedules = await query
                    .OrderBy(es => es.StartDateTime)
                    .Select(es => new EquipmentScheduleResponse
                    {
                        EquipmentScheduleId = es.EquipmentScheduleId,
                        EquipmentId = es.EquipmentId,
                        EquipmentName = es.Equipment != null ? es.Equipment.Name : null,
                        BatchId = es.BatchId,
                        Status = es.Status,
                        StartDateTime = es.StartDateTime,
                        EndDateTime = es.EndDateTime,
                        Notes = es.Notes,
                        Created = es.Created,
                        CreatedBy = es.CreatedBy
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = schedules });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment schedules");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/equipmentschedule/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetSchedule(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                var schedule = await _context.EquipmentSchedules
                    .Include(es => es.Equipment)
                    .Where(es => es.EquipmentScheduleId == id)
                    .Select(es => new EquipmentScheduleResponse
                    {
                        EquipmentScheduleId = es.EquipmentScheduleId,
                        EquipmentId = es.EquipmentId,
                        EquipmentName = es.Equipment != null ? es.Equipment.Name : null,
                        BatchId = es.BatchId,
                        Status = es.Status,
                        StartDateTime = es.StartDateTime,
                        EndDateTime = es.EndDateTime,
                        Notes = es.Notes,
                        Created = es.Created,
                        CreatedBy = es.CreatedBy
                    })
                    .FirstOrDefaultAsync();

                if (schedule == null)
                {
                    return NotFound(new { success = false, message = "Equipment schedule not found" });
                }

                return Ok(new { success = true, data = schedule });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment schedule {EquipmentScheduleId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/equipmentschedule/conflicts
        [HttpGet("conflicts")]
        public async Task<ActionResult> CheckConflicts([FromQuery] Guid equipmentId, [FromQuery] DateTime startDateTime, [FromQuery] DateTime endDateTime, [FromQuery] Guid? excludeScheduleId = null)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                var query = _context.EquipmentSchedules
                    .Where(es => es.EquipmentId == equipmentId &&
                                es.StartDateTime < endDateTime &&
                                es.EndDateTime > startDateTime);

                if (excludeScheduleId.HasValue)
                {
                    query = query.Where(es => es.EquipmentScheduleId != excludeScheduleId.Value);
                }

                var conflicts = await query
                    .OrderBy(es => es.StartDateTime)
                    .Select(es => new EquipmentScheduleResponse
                    {
                        EquipmentScheduleId = es.EquipmentScheduleId,
                        EquipmentId = es.EquipmentId,
                        BatchId = es.BatchId,
                        Status = es.Status,
                        StartDateTime = es.StartDateTime,
                        EndDateTime = es.EndDateTime,
                        Notes = es.Notes
                    })
                    .ToListAsync();

                return Ok(new { success = true, hasConflicts = conflicts.Any(), conflicts = conflicts });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking equipment schedule conflicts");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/equipmentschedule
        [HttpPost]
        public async Task<ActionResult> CreateSchedule([FromBody] EquipmentScheduleRequest request)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User ID not found" });
                }

                // Validate date range
                if (request.EndDateTime <= request.StartDateTime)
                {
                    return BadRequest(new { success = false, message = "End date/time must be after start date/time" });
                }

                // Check for conflicts
                var hasConflict = await _context.EquipmentSchedules
                    .AnyAsync(es => es.EquipmentId == request.EquipmentId &&
                                   es.StartDateTime < request.EndDateTime &&
                                   es.EndDateTime > request.StartDateTime);

                if (hasConflict)
                {
                    return BadRequest(new { success = false, message = "Equipment is already scheduled for this time period" });
                }

                var schedule = new EquipmentSchedule
                {
                    EquipmentScheduleId = Guid.NewGuid(),
                    EquipmentId = request.EquipmentId,
                    BatchId = request.BatchId,
                    Status = request.Status,
                    StartDateTime = request.StartDateTime,
                    EndDateTime = request.EndDateTime,
                    Notes = request.Notes,
                    Created = DateTime.UtcNow,
                    CreatedBy = currentUserId.Value
                };

                _context.EquipmentSchedules.Add(schedule);
                await _context.SaveChangesAsync();

                var equipment = await _context.Equipment
                    .FirstOrDefaultAsync(e => e.EquipmentId == schedule.EquipmentId);

                var response = new EquipmentScheduleResponse
                {
                    EquipmentScheduleId = schedule.EquipmentScheduleId,
                    EquipmentId = schedule.EquipmentId,
                    EquipmentName = equipment?.Name,
                    BatchId = schedule.BatchId,
                    Status = schedule.Status,
                    StartDateTime = schedule.StartDateTime,
                    EndDateTime = schedule.EndDateTime,
                    Notes = schedule.Notes,
                    Created = schedule.Created,
                    CreatedBy = schedule.CreatedBy
                };

                return CreatedAtAction(nameof(GetSchedule), new { id = schedule.EquipmentScheduleId },
                    new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating equipment schedule");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/equipmentschedule/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateSchedule(Guid id, [FromBody] EquipmentScheduleRequest request)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                var schedule = await _context.EquipmentSchedules
                    .FirstOrDefaultAsync(es => es.EquipmentScheduleId == id);

                if (schedule == null)
                {
                    return NotFound(new { success = false, message = "Equipment schedule not found" });
                }

                // Validate date range
                if (request.EndDateTime <= request.StartDateTime)
                {
                    return BadRequest(new { success = false, message = "End date/time must be after start date/time" });
                }

                // Check for conflicts (excluding this schedule)
                var hasConflict = await _context.EquipmentSchedules
                    .AnyAsync(es => es.EquipmentId == request.EquipmentId &&
                                   es.EquipmentScheduleId != id &&
                                   es.StartDateTime < request.EndDateTime &&
                                   es.EndDateTime > request.StartDateTime);

                if (hasConflict)
                {
                    return BadRequest(new { success = false, message = "Equipment is already scheduled for this time period" });
                }

                schedule.EquipmentId = request.EquipmentId;
                schedule.BatchId = request.BatchId;
                schedule.Status = request.Status;
                schedule.StartDateTime = request.StartDateTime;
                schedule.EndDateTime = request.EndDateTime;
                schedule.Notes = request.Notes;

                await _context.SaveChangesAsync();

                var equipment = await _context.Equipment
                    .FirstOrDefaultAsync(e => e.EquipmentId == schedule.EquipmentId);

                var response = new EquipmentScheduleResponse
                {
                    EquipmentScheduleId = schedule.EquipmentScheduleId,
                    EquipmentId = schedule.EquipmentId,
                    EquipmentName = equipment?.Name,
                    BatchId = schedule.BatchId,
                    Status = schedule.Status,
                    StartDateTime = schedule.StartDateTime,
                    EndDateTime = schedule.EndDateTime,
                    Notes = schedule.Notes,
                    Created = schedule.Created,
                    CreatedBy = schedule.CreatedBy
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating equipment schedule {EquipmentScheduleId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // DELETE: api/equipmentschedule/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteSchedule(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                var schedule = await _context.EquipmentSchedules
                    .FirstOrDefaultAsync(es => es.EquipmentScheduleId == id);

                if (schedule == null)
                {
                    return NotFound(new { success = false, message = "Equipment schedule not found" });
                }

                _context.EquipmentSchedules.Remove(schedule);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Equipment schedule deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting equipment schedule {EquipmentScheduleId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }

    // DTOs
    public class EquipmentScheduleRequest
    {
        [JsonPropertyName("equipmentId")]
        public Guid EquipmentId { get; set; }

        [JsonPropertyName("batchId")]
        public Guid? BatchId { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("startDateTime")]
        public DateTime StartDateTime { get; set; }

        [JsonPropertyName("endDateTime")]
        public DateTime EndDateTime { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }

    public class EquipmentScheduleResponse
    {
        [JsonPropertyName("equipmentScheduleId")]
        public Guid EquipmentScheduleId { get; set; }

        [JsonPropertyName("equipmentId")]
        public Guid EquipmentId { get; set; }

        [JsonPropertyName("equipmentName")]
        public string? EquipmentName { get; set; }

        [JsonPropertyName("batchId")]
        public Guid? BatchId { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("startDateTime")]
        public DateTime StartDateTime { get; set; }

        [JsonPropertyName("endDateTime")]
        public DateTime EndDateTime { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }

        [JsonPropertyName("createdBy")]
        public Guid? CreatedBy { get; set; }
    }
}
