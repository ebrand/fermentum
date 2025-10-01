using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using FermentumApi.Models.Batch;
using FermentumApi.Models;
using FermentumApi.Models.Inventory;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace Fermentum.Auth.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BatchIngredientController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<BatchIngredientController> _logger;

        public BatchIngredientController(AuthDbContext context, ILogger<BatchIngredientController> logger)
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

        // GET: api/batchingredient/batch/{batchId}
        [HttpGet("batch/{batchId}")]
        public async Task<ActionResult<IEnumerable<BatchIngredientResponse>>> GetBatchIngredients(Guid batchId)
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

                var ingredients = await _context.BatchIngredients
                    .Where(bi => bi.BatchId == batchId)
                    .Select(bi => new BatchIngredientResponse
                    {
                        BatchIngredientId = bi.BatchIngredientId,
                        BatchId = bi.BatchId,
                        StockId = bi.StockId,
                        IngredientName = bi.IngredientName,
                        PlannedQuantity = bi.PlannedQuantity,
                        ActualQuantity = bi.ActualQuantity,
                        Unit = bi.Unit,
                        StartedFlag = bi.StartedFlag,
                        Notes = bi.Notes,
                        Created = bi.Created,
                        Updated = bi.Updated
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = ingredients });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch ingredients for batch {BatchId}", batchId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving batch ingredients" });
            }
        }

        // GET: api/batchingredient/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<BatchIngredientDetailResponse>> GetBatchIngredient(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var ingredient = await _context.BatchIngredients
                    .Include(bi => bi.Batch)
                    .FirstOrDefaultAsync(bi => bi.BatchIngredientId == id);

                if (ingredient == null)
                {
                    return NotFound(new { success = false, message = "Batch ingredient not found" });
                }

                // Verify batch belongs to tenant
                if (ingredient.Batch?.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                var response = new BatchIngredientDetailResponse
                {
                    BatchIngredientId = ingredient.BatchIngredientId,
                    BatchId = ingredient.BatchId,
                    BatchName = ingredient.Batch?.Name,
                    StockId = ingredient.StockId,
                    IngredientName = ingredient.IngredientName,
                    PlannedQuantity = ingredient.PlannedQuantity,
                    ActualQuantity = ingredient.ActualQuantity,
                    Unit = ingredient.Unit,
                    StartedFlag = ingredient.StartedFlag,
                    Notes = ingredient.Notes,
                    Created = ingredient.Created,
                    Updated = ingredient.Updated
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch ingredient {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving the batch ingredient" });
            }
        }

        // POST: api/batchingredient
        [HttpPost]
        public async Task<ActionResult<BatchIngredientResponse>> CreateBatchIngredient([FromBody] BatchIngredientRequest request)
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

                // If StockId is provided, verify it exists and belongs to tenant
                if (request.StockId.HasValue)
                {
                    var stockExists = await _context.Set<Stock>()
                        .AnyAsync(s => s.StockId == request.StockId.Value && s.TenantId == tenantId.Value);

                    if (!stockExists)
                    {
                        return BadRequest(new { success = false, message = "Stock item not found" });
                    }
                }

                var ingredient = new BatchIngredient
                {
                    BatchIngredientId = Guid.NewGuid(),
                    BatchId = request.BatchId,
                    StockId = request.StockId,
                    IngredientName = request.IngredientName,
                    PlannedQuantity = request.PlannedQuantity,
                    ActualQuantity = request.ActualQuantity,
                    Unit = request.Unit,
                    StartedFlag = request.StartedFlag ?? false,
                    Notes = request.Notes,
                    Created = DateTime.UtcNow,
                    CreatedBy = userId.Value,
                    Updated = DateTime.UtcNow,
                    UpdatedBy = userId.Value
                };

                _context.BatchIngredients.Add(ingredient);
                await _context.SaveChangesAsync();

                var response = new BatchIngredientResponse
                {
                    BatchIngredientId = ingredient.BatchIngredientId,
                    BatchId = ingredient.BatchId,
                    StockId = ingredient.StockId,
                    IngredientName = ingredient.IngredientName,
                    PlannedQuantity = ingredient.PlannedQuantity,
                    ActualQuantity = ingredient.ActualQuantity,
                    Unit = ingredient.Unit,
                    StartedFlag = ingredient.StartedFlag,
                    Notes = ingredient.Notes,
                    Created = ingredient.Created,
                    Updated = ingredient.Updated
                };

                return CreatedAtAction(nameof(GetBatchIngredient), new { id = ingredient.BatchIngredientId },
                    new { success = true, data = response, message = "Batch ingredient created successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating batch ingredient");
                return StatusCode(500, new { success = false, message = "An error occurred while creating the batch ingredient" });
            }
        }

        // PUT: api/batchingredient/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateBatchIngredient(Guid id, [FromBody] BatchIngredientUpdateRequest request)
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

                var ingredient = await _context.BatchIngredients
                    .Include(bi => bi.Batch)
                    .FirstOrDefaultAsync(bi => bi.BatchIngredientId == id);

                if (ingredient == null)
                {
                    return NotFound(new { success = false, message = "Batch ingredient not found" });
                }

                // Verify batch belongs to tenant
                if (ingredient.Batch?.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                // If StockId is being updated, verify it exists and belongs to tenant
                if (request.StockId.HasValue && request.StockId != ingredient.StockId)
                {
                    var stockExists = await _context.Set<Stock>()
                        .AnyAsync(s => s.StockId == request.StockId.Value && s.TenantId == tenantId.Value);

                    if (!stockExists)
                    {
                        return BadRequest(new { success = false, message = "Stock item not found" });
                    }
                }

                // Update fields
                ingredient.StockId = request.StockId;
                ingredient.IngredientName = request.IngredientName;
                ingredient.PlannedQuantity = request.PlannedQuantity;
                ingredient.ActualQuantity = request.ActualQuantity;
                ingredient.Unit = request.Unit;
                ingredient.Notes = request.Notes;
                ingredient.Updated = DateTime.UtcNow;
                ingredient.UpdatedBy = userId.Value;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch ingredient updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating batch ingredient {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while updating the batch ingredient" });
            }
        }

        // PATCH: api/batchingredient/{id}/start
        [HttpPatch("{id}/start")]
        public async Task<ActionResult> StartBatchIngredient(Guid id)
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

                var ingredient = await _context.BatchIngredients
                    .Include(bi => bi.Batch)
                    .FirstOrDefaultAsync(bi => bi.BatchIngredientId == id);

                if (ingredient == null)
                {
                    return NotFound(new { success = false, message = "Batch ingredient not found" });
                }

                // Verify batch belongs to tenant
                if (ingredient.Batch?.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                // Set StartedFlag to reserve stock
                ingredient.StartedFlag = true;
                ingredient.Updated = DateTime.UtcNow;
                ingredient.UpdatedBy = userId.Value;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch ingredient started and stock reserved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting batch ingredient {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while starting the batch ingredient" });
            }
        }

        // PATCH: api/batchingredient/{id}/actual
        [HttpPatch("{id}/actual")]
        public async Task<ActionResult> UpdateActualQuantity(Guid id, [FromBody] ActualQuantityRequest request)
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

                var ingredient = await _context.BatchIngredients
                    .Include(bi => bi.Batch)
                    .FirstOrDefaultAsync(bi => bi.BatchIngredientId == id);

                if (ingredient == null)
                {
                    return NotFound(new { success = false, message = "Batch ingredient not found" });
                }

                // Verify batch belongs to tenant
                if (ingredient.Batch?.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                // Update actual quantity
                ingredient.ActualQuantity = request.ActualQuantity;
                ingredient.Updated = DateTime.UtcNow;
                ingredient.UpdatedBy = userId.Value;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Actual quantity updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating actual quantity for batch ingredient {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while updating the actual quantity" });
            }
        }

        // DELETE: api/batchingredient/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteBatchIngredient(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "User tenant not found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var ingredient = await _context.BatchIngredients
                    .Include(bi => bi.Batch)
                    .FirstOrDefaultAsync(bi => bi.BatchIngredientId == id);

                if (ingredient == null)
                {
                    return NotFound(new { success = false, message = "Batch ingredient not found" });
                }

                // Verify batch belongs to tenant
                if (ingredient.Batch?.TenantId != tenantId.Value)
                {
                    return Unauthorized(new { success = false, message = "Access denied" });
                }

                _context.BatchIngredients.Remove(ingredient);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch ingredient deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting batch ingredient {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while deleting the batch ingredient" });
            }
        }
    }

    // DTOs
    public class BatchIngredientRequest
    {
        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("stockId")]
        public Guid? StockId { get; set; }

        [JsonPropertyName("ingredientName")]
        public string IngredientName { get; set; } = string.Empty;

        [JsonPropertyName("plannedQuantity")]
        public decimal PlannedQuantity { get; set; }

        [JsonPropertyName("actualQuantity")]
        public decimal? ActualQuantity { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = string.Empty;

        [JsonPropertyName("startedFlag")]
        public bool? StartedFlag { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }

    public class BatchIngredientUpdateRequest
    {
        [JsonPropertyName("stockId")]
        public Guid? StockId { get; set; }

        [JsonPropertyName("ingredientName")]
        public string IngredientName { get; set; } = string.Empty;

        [JsonPropertyName("plannedQuantity")]
        public decimal PlannedQuantity { get; set; }

        [JsonPropertyName("actualQuantity")]
        public decimal? ActualQuantity { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }

    public class ActualQuantityRequest
    {
        [JsonPropertyName("actualQuantity")]
        public decimal ActualQuantity { get; set; }
    }

    public class BatchIngredientResponse
    {
        [JsonPropertyName("batchIngredientId")]
        public Guid BatchIngredientId { get; set; }

        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("stockId")]
        public Guid? StockId { get; set; }

        [JsonPropertyName("ingredientName")]
        public string IngredientName { get; set; } = string.Empty;

        [JsonPropertyName("plannedQuantity")]
        public decimal PlannedQuantity { get; set; }

        [JsonPropertyName("actualQuantity")]
        public decimal? ActualQuantity { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = string.Empty;

        [JsonPropertyName("startedFlag")]
        public bool StartedFlag { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }

        [JsonPropertyName("updated")]
        public DateTime Updated { get; set; }
    }

    public class BatchIngredientDetailResponse
    {
        [JsonPropertyName("batchIngredientId")]
        public Guid BatchIngredientId { get; set; }

        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("batchName")]
        public string? BatchName { get; set; }

        [JsonPropertyName("stockId")]
        public Guid? StockId { get; set; }

        [JsonPropertyName("ingredientName")]
        public string IngredientName { get; set; } = string.Empty;

        [JsonPropertyName("plannedQuantity")]
        public decimal PlannedQuantity { get; set; }

        [JsonPropertyName("actualQuantity")]
        public decimal? ActualQuantity { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = string.Empty;

        [JsonPropertyName("startedFlag")]
        public bool StartedFlag { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }

        [JsonPropertyName("updated")]
        public DateTime Updated { get; set; }
    }
}
