using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using FermentumApi.Models.Batch;
using FermentumApi.Models;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace Fermentum.Auth.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BatchMeasurementController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<BatchMeasurementController> _logger;

        public BatchMeasurementController(AuthDbContext context, ILogger<BatchMeasurementController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        private async Task<Guid?> GetUserTenantIdAsync()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return null;

            var userTenant = await _context.UserTenants
                .Where(ut => ut.UserId == userId.Value && ut.IsActive)
                .Select(ut => ut.TenantId)
                .FirstOrDefaultAsync();

            return userTenant;
        }

        // GET: api/batchmeasurement/batch/{batchId}
        [HttpGet("batch/{batchId}")]
        public async Task<ActionResult<IEnumerable<BatchMeasurementResponse>>> GetBatchMeasurements(
            Guid batchId,
            [FromQuery] string? measurementType = null)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                // Verify batch belongs to tenant
                var batch = await _context.Batches.FindAsync(batchId);
                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }
                if (batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                var query = _context.BatchMeasurements
                    .Where(bm => bm.BatchId == batchId);

                // Filter by measurement type if provided
                if (!string.IsNullOrEmpty(measurementType))
                {
                    query = query.Where(bm => bm.MeasurementType == measurementType);
                }

                var measurements = await query
                    .OrderByDescending(bm => bm.MeasurementDateTime)
                    .Select(bm => new BatchMeasurementResponse
                    {
                        BatchMeasurementId = bm.BatchMeasurementId,
                        BatchId = bm.BatchId,
                        MeasurementType = bm.MeasurementType,
                        Value = bm.Value,
                        Unit = bm.Unit,
                        TargetMin = bm.TargetMin,
                        TargetMax = bm.TargetMax,
                        InRange = bm.InRange,
                        MeasurementDateTime = bm.MeasurementDateTime,
                        MeasuredBy = bm.MeasuredBy,
                        Notes = bm.Notes,
                        Created = bm.Created
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = measurements });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch measurements for batch {BatchId}", batchId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving batch measurements" });
            }
        }

        // GET: api/batchmeasurement/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<BatchMeasurementDetailResponse>> GetBatchMeasurement(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var measurement = await _context.BatchMeasurements
                    .Include(bm => bm.Batch)
                    .Include(bm => bm.MeasuredByUser)
                    .FirstOrDefaultAsync(bm => bm.BatchMeasurementId == id);

                if (measurement == null)
                {
                    return NotFound(new { success = false, message = "Batch measurement not found" });
                }

                // Verify batch belongs to tenant
                if (measurement.Batch?.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                var response = new BatchMeasurementDetailResponse
                {
                    BatchMeasurementId = measurement.BatchMeasurementId,
                    BatchId = measurement.BatchId,
                    BatchName = measurement.Batch?.Name,
                    MeasurementType = measurement.MeasurementType,
                    Value = measurement.Value,
                    Unit = measurement.Unit,
                    TargetMin = measurement.TargetMin,
                    TargetMax = measurement.TargetMax,
                    InRange = measurement.InRange,
                    MeasurementDateTime = measurement.MeasurementDateTime,
                    MeasuredBy = measurement.MeasuredBy,
                    MeasuredByName = measurement.MeasuredByUser != null
                        ? $"{measurement.MeasuredByUser.FirstName} {measurement.MeasuredByUser.LastName}"
                        : null,
                    Notes = measurement.Notes,
                    Created = measurement.Created
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch measurement {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving the batch measurement" });
            }
        }

        // POST: api/batchmeasurement
        [HttpPost]
        public async Task<ActionResult<BatchMeasurementResponse>> CreateBatchMeasurement([FromBody] BatchMeasurementRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User ID not found" });
                }

                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                // Verify batch exists and belongs to tenant
                var batch = await _context.Batches.FindAsync(request.BatchId);
                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }
                if (batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                // Calculate if measurement is in range
                bool? inRange = null;
                if (request.TargetMin.HasValue && request.TargetMax.HasValue)
                {
                    inRange = request.Value >= request.TargetMin.Value && request.Value <= request.TargetMax.Value;
                }

                var measurement = new BatchMeasurement
                {
                    BatchMeasurementId = Guid.NewGuid(),
                    BatchId = request.BatchId,
                    MeasurementType = request.MeasurementType,
                    Value = request.Value,
                    Unit = request.Unit,
                    TargetMin = request.TargetMin,
                    TargetMax = request.TargetMax,
                    InRange = inRange,
                    MeasurementDateTime = request.MeasurementDateTime ?? DateTime.UtcNow,
                    MeasuredBy = request.MeasuredBy ?? userId.Value,
                    Notes = request.Notes,
                    Created = DateTime.UtcNow,
                    CreatedBy = userId.Value
                };

                _context.BatchMeasurements.Add(measurement);
                await _context.SaveChangesAsync();

                var response = new BatchMeasurementResponse
                {
                    BatchMeasurementId = measurement.BatchMeasurementId,
                    BatchId = measurement.BatchId,
                    MeasurementType = measurement.MeasurementType,
                    Value = measurement.Value,
                    Unit = measurement.Unit,
                    TargetMin = measurement.TargetMin,
                    TargetMax = measurement.TargetMax,
                    InRange = measurement.InRange,
                    MeasurementDateTime = measurement.MeasurementDateTime,
                    MeasuredBy = measurement.MeasuredBy,
                    Notes = measurement.Notes,
                    Created = measurement.Created
                };

                return CreatedAtAction(nameof(GetBatchMeasurement), new { id = measurement.BatchMeasurementId },
                    new { success = true, data = response, message = "Batch measurement created successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating batch measurement");
                return StatusCode(500, new { success = false, message = "An error occurred while creating the batch measurement" });
            }
        }

        // PUT: api/batchmeasurement/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateBatchMeasurement(Guid id, [FromBody] BatchMeasurementUpdateRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User ID not found" });
                }

                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var measurement = await _context.BatchMeasurements
                    .Include(bm => bm.Batch)
                    .FirstOrDefaultAsync(bm => bm.BatchMeasurementId == id);

                if (measurement == null)
                {
                    return NotFound(new { success = false, message = "Batch measurement not found" });
                }

                // Verify batch belongs to tenant
                if (measurement.Batch?.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                // Recalculate if measurement is in range
                bool? inRange = null;
                if (request.TargetMin.HasValue && request.TargetMax.HasValue)
                {
                    inRange = request.Value >= request.TargetMin.Value && request.Value <= request.TargetMax.Value;
                }

                // Update fields
                measurement.MeasurementType = request.MeasurementType;
                measurement.Value = request.Value;
                measurement.Unit = request.Unit;
                measurement.TargetMin = request.TargetMin;
                measurement.TargetMax = request.TargetMax;
                measurement.InRange = inRange;
                measurement.Notes = request.Notes;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch measurement updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating batch measurement {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while updating the batch measurement" });
            }
        }

        // DELETE: api/batchmeasurement/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteBatchMeasurement(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var measurement = await _context.BatchMeasurements
                    .Include(bm => bm.Batch)
                    .FirstOrDefaultAsync(bm => bm.BatchMeasurementId == id);

                if (measurement == null)
                {
                    return NotFound(new { success = false, message = "Batch measurement not found" });
                }

                // Verify batch belongs to tenant
                if (measurement.Batch?.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                _context.BatchMeasurements.Remove(measurement);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch measurement deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting batch measurement {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while deleting the batch measurement" });
            }
        }

        // GET: api/batchmeasurement/batch/{batchId}/types
        [HttpGet("batch/{batchId}/types")]
        public async Task<ActionResult<IEnumerable<string>>> GetMeasurementTypes(Guid batchId)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                // Verify batch belongs to tenant
                var batch = await _context.Batches.FindAsync(batchId);
                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }
                if (batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                var types = await _context.BatchMeasurements
                    .Where(bm => bm.BatchId == batchId)
                    .Select(bm => bm.MeasurementType)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                return Ok(new { success = true, data = types });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving measurement types for batch {BatchId}", batchId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving measurement types" });
            }
        }

        // GET: api/batchmeasurement/batch/{batchId}/latest
        [HttpGet("batch/{batchId}/latest")]
        public async Task<ActionResult<Dictionary<string, BatchMeasurementResponse>>> GetLatestMeasurements(Guid batchId)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                // Verify batch belongs to tenant
                var batch = await _context.Batches.FindAsync(batchId);
                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }
                if (batch.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                // Get latest measurement for each type
                var latestMeasurements = await _context.BatchMeasurements
                    .Where(bm => bm.BatchId == batchId)
                    .GroupBy(bm => bm.MeasurementType)
                    .Select(g => g.OrderByDescending(bm => bm.MeasurementDateTime).FirstOrDefault())
                    .Where(bm => bm != null)
                    .Select(bm => new BatchMeasurementResponse
                    {
                        BatchMeasurementId = bm!.BatchMeasurementId,
                        BatchId = bm.BatchId,
                        MeasurementType = bm.MeasurementType,
                        Value = bm.Value,
                        Unit = bm.Unit,
                        TargetMin = bm.TargetMin,
                        TargetMax = bm.TargetMax,
                        InRange = bm.InRange,
                        MeasurementDateTime = bm.MeasurementDateTime,
                        MeasuredBy = bm.MeasuredBy,
                        Notes = bm.Notes,
                        Created = bm.Created
                    })
                    .ToListAsync();

                var result = latestMeasurements.ToDictionary(m => m.MeasurementType, m => m);

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving latest measurements for batch {BatchId}", batchId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving latest measurements" });
            }
        }
    }

    // DTOs
    public class BatchMeasurementRequest
    {
        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("measurementType")]
        public string MeasurementType { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public decimal Value { get; set; }

        [JsonPropertyName("unit")]
        public string? Unit { get; set; }

        [JsonPropertyName("targetMin")]
        public decimal? TargetMin { get; set; }

        [JsonPropertyName("targetMax")]
        public decimal? TargetMax { get; set; }

        [JsonPropertyName("measurementDateTime")]
        public DateTime? MeasurementDateTime { get; set; }

        [JsonPropertyName("measuredBy")]
        public Guid? MeasuredBy { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }

    public class BatchMeasurementUpdateRequest
    {
        [JsonPropertyName("measurementType")]
        public string MeasurementType { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public decimal Value { get; set; }

        [JsonPropertyName("unit")]
        public string? Unit { get; set; }

        [JsonPropertyName("targetMin")]
        public decimal? TargetMin { get; set; }

        [JsonPropertyName("targetMax")]
        public decimal? TargetMax { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }

    public class BatchMeasurementResponse
    {
        [JsonPropertyName("batchMeasurementId")]
        public Guid BatchMeasurementId { get; set; }

        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("measurementType")]
        public string MeasurementType { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public decimal Value { get; set; }

        [JsonPropertyName("unit")]
        public string? Unit { get; set; }

        [JsonPropertyName("targetMin")]
        public decimal? TargetMin { get; set; }

        [JsonPropertyName("targetMax")]
        public decimal? TargetMax { get; set; }

        [JsonPropertyName("inRange")]
        public bool? InRange { get; set; }

        [JsonPropertyName("measurementDateTime")]
        public DateTime MeasurementDateTime { get; set; }

        [JsonPropertyName("measuredBy")]
        public Guid? MeasuredBy { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }
    }

    public class BatchMeasurementDetailResponse
    {
        [JsonPropertyName("batchMeasurementId")]
        public Guid BatchMeasurementId { get; set; }

        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("batchName")]
        public string? BatchName { get; set; }

        [JsonPropertyName("measurementType")]
        public string MeasurementType { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public decimal Value { get; set; }

        [JsonPropertyName("unit")]
        public string? Unit { get; set; }

        [JsonPropertyName("targetMin")]
        public decimal? TargetMin { get; set; }

        [JsonPropertyName("targetMax")]
        public decimal? TargetMax { get; set; }

        [JsonPropertyName("inRange")]
        public bool? InRange { get; set; }

        [JsonPropertyName("measurementDateTime")]
        public DateTime MeasurementDateTime { get; set; }

        [JsonPropertyName("measuredBy")]
        public Guid? MeasuredBy { get; set; }

        [JsonPropertyName("measuredByName")]
        public string? MeasuredByName { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }
    }
}
