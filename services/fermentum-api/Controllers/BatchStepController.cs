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
using FermentumApi.Models.Batch;
using FermentumApi.Models;
using System.Text.Json.Serialization;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BatchStepController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<BatchStepController> _logger;

        public BatchStepController(AuthDbContext context, ILogger<BatchStepController> logger)
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

        // GET: api/batchstep/batch/{batchId}
        [HttpGet("batch/{batchId}")]
        public async Task<ActionResult> GetBatchSteps(Guid batchId)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                // Verify batch belongs to tenant
                var batchExists = await _context.Batches
                    .AnyAsync(b => b.BatchId == batchId && b.TenantId == tenantId.Value);

                if (!batchExists)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }

                var steps = await _context.BatchSteps
                    .Include(bs => bs.Equipment)
                    .Where(bs => bs.BatchId == batchId)
                    .OrderBy(bs => bs.StepNumber)
                    .Select(bs => new BatchStepResponse
                    {
                        BatchStepId = bs.BatchStepId,
                        BatchId = bs.BatchId,
                        StepNumber = bs.StepNumber,
                        StepType = bs.StepType,
                        Status = bs.Status,
                        EquipmentId = bs.EquipmentId,
                        EquipmentName = bs.Equipment != null ? bs.Equipment.Name : null,
                        StartedAt = bs.StartedAt,
                        CompletedAt = bs.CompletedAt,
                        PlannedDuration = bs.PlannedDuration,
                        ActualDuration = bs.ActualDuration,
                        PlannedTemperature = bs.PlannedTemperature,
                        ActualTemperature = bs.ActualTemperature,
                        Notes = bs.Notes,
                        Created = bs.Created,
                        CreatedBy = bs.CreatedBy
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = steps });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch steps for batch {BatchId}", batchId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/batchstep/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetBatchStep(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var step = await _context.BatchSteps
                    .Include(bs => bs.Equipment)
                    .Include(bs => bs.Batch)
                    .Where(bs => bs.BatchStepId == id)
                    .Select(bs => new BatchStepDetailResponse
                    {
                        BatchStepId = bs.BatchStepId,
                        BatchId = bs.BatchId,
                        StepNumber = bs.StepNumber,
                        StepType = bs.StepType,
                        Status = bs.Status,
                        EquipmentId = bs.EquipmentId,
                        EquipmentName = bs.Equipment != null ? bs.Equipment.Name : null,
                        StartedAt = bs.StartedAt,
                        CompletedAt = bs.CompletedAt,
                        PlannedDuration = bs.PlannedDuration,
                        ActualDuration = bs.ActualDuration,
                        PlannedTemperature = bs.PlannedTemperature,
                        ActualTemperature = bs.ActualTemperature,
                        Notes = bs.Notes,
                        Created = bs.Created,
                        CreatedBy = bs.CreatedBy,
                        Updated = bs.Updated,
                        UpdatedBy = bs.UpdatedBy
                    })
                    .FirstOrDefaultAsync();

                if (step == null)
                {
                    return NotFound(new { success = false, message = "Batch step not found" });
                }

                // Verify batch belongs to tenant
                var batch = await _context.Batches.FindAsync(step.BatchId);
                if (batch == null || batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                return Ok(new { success = true, data = step });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch step {BatchStepId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/batchstep
        [HttpPost]
        public async Task<ActionResult> CreateBatchStep([FromBody] BatchStepRequest request)
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

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                // Verify batch belongs to tenant
                var batch = await _context.Batches
                    .FirstOrDefaultAsync(b => b.BatchId == request.BatchId && b.TenantId == tenantId.Value);

                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }

                var step = new BatchStep
                {
                    BatchStepId = Guid.NewGuid(),
                    BatchId = request.BatchId,
                    Name = request.StepType, // Using StepType as Name for now
                    StepNumber = request.StepNumber,
                    StepType = request.StepType,
                    Status = request.Status,
                    EquipmentId = request.EquipmentId,
                    PlannedDuration = request.PlannedDuration,
                    PlannedTemperature = request.PlannedTemperature,
                    Notes = request.Notes,
                    Created = DateTime.UtcNow,
                    CreatedBy = currentUserId.Value,
                    Updated = DateTime.UtcNow,
                    UpdatedBy = currentUserId.Value
                };

                _context.BatchSteps.Add(step);
                await _context.SaveChangesAsync();

                var equipment = await _context.Equipment.FirstOrDefaultAsync(e => e.EquipmentId == step.EquipmentId);

                var response = new BatchStepDetailResponse
                {
                    BatchStepId = step.BatchStepId,
                    BatchId = step.BatchId,
                    StepNumber = step.StepNumber,
                    StepType = step.StepType,
                    Status = step.Status,
                    EquipmentId = step.EquipmentId,
                    EquipmentName = equipment?.Name,
                    StartedAt = step.StartedAt,
                    CompletedAt = step.CompletedAt,
                    PlannedDuration = step.PlannedDuration,
                    PlannedTemperature = step.PlannedTemperature,
                    Notes = step.Notes,
                    Created = step.Created,
                    CreatedBy = step.CreatedBy,
                    Updated = step.Updated,
                    UpdatedBy = step.UpdatedBy
                };

                return CreatedAtAction(nameof(GetBatchStep), new { id = step.BatchStepId },
                    new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating batch step");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/batchstep/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateBatchStep(Guid id, [FromBody] BatchStepUpdateRequest request)
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

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var step = await _context.BatchSteps
                    .Include(bs => bs.Batch)
                    .FirstOrDefaultAsync(bs => bs.BatchStepId == id);

                if (step == null)
                {
                    return NotFound(new { success = false, message = "Batch step not found" });
                }

                // Verify batch belongs to tenant
                if (step.Batch == null || step.Batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                step.Status = request.Status;
                if (request.CompletedAt.HasValue)
                {
                    step.CompletedAt = request.CompletedAt;
                }
                step.ActualDuration = request.ActualDuration;
                step.ActualTemperature = request.ActualTemperature;
                step.Notes = request.Notes;
                step.Updated = DateTime.UtcNow;
                step.UpdatedBy = currentUserId.Value;

                await _context.SaveChangesAsync();

                var equipment = await _context.Equipment.FirstOrDefaultAsync(e => e.EquipmentId == step.EquipmentId);

                var response = new BatchStepDetailResponse
                {
                    BatchStepId = step.BatchStepId,
                    BatchId = step.BatchId,
                    StepNumber = step.StepNumber,
                    StepType = step.StepType,
                    Status = step.Status,
                    EquipmentId = step.EquipmentId,
                    EquipmentName = equipment?.Name,
                    StartedAt = step.StartedAt,
                    CompletedAt = step.CompletedAt,
                    PlannedDuration = step.PlannedDuration,
                    ActualDuration = step.ActualDuration,
                    PlannedTemperature = step.PlannedTemperature,
                    ActualTemperature = step.ActualTemperature,
                    Notes = step.Notes,
                    Created = step.Created,
                    CreatedBy = step.CreatedBy,
                    Updated = step.Updated,
                    UpdatedBy = step.UpdatedBy
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating batch step {BatchStepId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PATCH: api/batchstep/{id}/start
        [HttpPatch("{id}/start")]
        public async Task<ActionResult> StartBatchStep(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var step = await _context.BatchSteps
                    .Include(bs => bs.Batch)
                    .FirstOrDefaultAsync(bs => bs.BatchStepId == id);

                if (step == null)
                {
                    return NotFound(new { success = false, message = "Batch step not found" });
                }

                if (step.Batch == null || step.Batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                step.StartedAt = DateTime.UtcNow;
                step.Status = "In Progress";

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch step started successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting batch step {BatchStepId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PATCH: api/batchstep/{id}/complete
        [HttpPatch("{id}/complete")]
        public async Task<ActionResult> CompleteBatchStep(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var step = await _context.BatchSteps
                    .Include(bs => bs.Batch)
                    .FirstOrDefaultAsync(bs => bs.BatchStepId == id);

                if (step == null)
                {
                    return NotFound(new { success = false, message = "Batch step not found" });
                }

                if (step.Batch == null || step.Batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                if (step.StartedAt.HasValue)
                {
                    var duration = (int)(DateTime.UtcNow - step.StartedAt.Value).TotalMinutes;
                    step.ActualDuration = duration;
                }

                step.CompletedAt = DateTime.UtcNow;
                step.Status = "Completed";

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch step completed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing batch step {BatchStepId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // DELETE: api/batchstep/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteBatchStep(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var step = await _context.BatchSteps
                    .Include(bs => bs.Batch)
                    .FirstOrDefaultAsync(bs => bs.BatchStepId == id);

                if (step == null)
                {
                    return NotFound(new { success = false, message = "Batch step not found" });
                }

                if (step.Batch == null || step.Batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                _context.BatchSteps.Remove(step);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch step deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting batch step {BatchStepId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }

    // DTOs
    public class BatchStepRequest
    {
        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("stepNumber")]
        public int StepNumber { get; set; }

        [JsonPropertyName("stepType")]
        public string StepType { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Pending";

        [JsonPropertyName("equipmentId")]
        public Guid? EquipmentId { get; set; }

        [JsonPropertyName("plannedDuration")]
        public int? PlannedDuration { get; set; }

        [JsonPropertyName("plannedTemperature")]
        public decimal? PlannedTemperature { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }

    public class BatchStepUpdateRequest
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("completedAt")]
        public DateTime? CompletedAt { get; set; }

        [JsonPropertyName("actualDuration")]
        public int? ActualDuration { get; set; }

        [JsonPropertyName("actualTemperature")]
        public decimal? ActualTemperature { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }

    public class BatchStepResponse
    {
        [JsonPropertyName("batchStepId")]
        public Guid BatchStepId { get; set; }

        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("stepNumber")]
        public int StepNumber { get; set; }

        [JsonPropertyName("stepType")]
        public string StepType { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("equipmentId")]
        public Guid? EquipmentId { get; set; }

        [JsonPropertyName("equipmentName")]
        public string? EquipmentName { get; set; }

        [JsonPropertyName("startedAt")]
        public DateTime? StartedAt { get; set; }

        [JsonPropertyName("completedAt")]
        public DateTime? CompletedAt { get; set; }

        [JsonPropertyName("plannedDuration")]
        public int? PlannedDuration { get; set; }

        [JsonPropertyName("actualDuration")]
        public int? ActualDuration { get; set; }

        [JsonPropertyName("plannedTemperature")]
        public decimal? PlannedTemperature { get; set; }

        [JsonPropertyName("actualTemperature")]
        public decimal? ActualTemperature { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }

        [JsonPropertyName("createdBy")]
        public Guid? CreatedBy { get; set; }
    }

    public class BatchStepDetailResponse : BatchStepResponse
    {
        [JsonPropertyName("updated")]
        public DateTime Updated { get; set; }

        [JsonPropertyName("updatedBy")]
        public Guid? UpdatedBy { get; set; }
    }
}
