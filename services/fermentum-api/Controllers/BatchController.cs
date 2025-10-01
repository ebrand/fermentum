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
    public class BatchController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<BatchController> _logger;

        public BatchController(AuthDbContext context, ILogger<BatchController> logger)
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

        // GET: api/batch
        [HttpGet]
        public async Task<ActionResult> GetBatches([FromQuery] string? status = null, [FromQuery] Guid? breweryId = null, [FromQuery] Guid? recipeId = null)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var query = _context.Batches
                    .Include(b => b.Recipe)
                    .Include(b => b.Brewer)
                    .Where(b => b.TenantId == tenantId.Value)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(b => b.Status == status);
                }

                if (breweryId.HasValue)
                {
                    query = query.Where(b => b.BreweryId == breweryId.Value);
                }

                if (recipeId.HasValue)
                {
                    query = query.Where(b => b.RecipeId == recipeId.Value);
                }

                var batches = await query
                    .OrderByDescending(b => b.Created)
                    .Select(b => new BatchResponse
                    {
                        BatchId = b.BatchId,
                        TenantId = b.TenantId,
                        BreweryId = b.BreweryId,
                        RecipeId = b.RecipeId,
                        RecipeName = b.Recipe != null ? b.Recipe.Name : null,
                        Name = b.Name,
                        BatchNumber = b.BatchNumber,
                        Description = b.Description,
                        Status = b.Status,
                        StartDate = b.StartDate,
                        CompletedDate = b.CompletedDate,
                        PlannedVolume = b.PlannedVolume,
                        PlannedVolumeUnit = b.PlannedVolumeUnit,
                        ActualVolume = b.ActualVolume,
                        ActualVolumeUnit = b.ActualVolumeUnit,
                        TargetOG = b.TargetOG,
                        ActualOG = b.ActualOG,
                        TargetFG = b.TargetFG,
                        ActualFG = b.ActualFG,
                        TargetABV = b.TargetABV,
                        ActualABV = b.ActualABV,
                        TargetIBU = b.TargetIBU,
                        ActualIBU = b.ActualIBU,
                        EstimatedCost = b.EstimatedCost,
                        ActualCost = b.ActualCost,
                        BrewerId = b.BrewerId,
                        BrewerName = b.Brewer != null ? $"{b.Brewer.FirstName} {b.Brewer.LastName}" : null,
                        AssignedTeam = b.AssignedTeam,
                        Created = b.Created,
                        CreatedBy = b.CreatedBy
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = batches });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batches");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/batch/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetBatch(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var batch = await _context.Batches
                    .Include(b => b.Recipe)
                    .Include(b => b.Brewer)
                    .Where(b => b.BatchId == id && b.TenantId == tenantId.Value)
                    .Select(b => new BatchDetailResponse
                    {
                        BatchId = b.BatchId,
                        TenantId = b.TenantId,
                        BreweryId = b.BreweryId,
                        RecipeId = b.RecipeId,
                        RecipeName = b.Recipe != null ? b.Recipe.Name : null,
                        Name = b.Name,
                        BatchNumber = b.BatchNumber,
                        Description = b.Description,
                        Status = b.Status,
                        StartDate = b.StartDate,
                        CompletedDate = b.CompletedDate,
                        PlannedVolume = b.PlannedVolume,
                        PlannedVolumeUnit = b.PlannedVolumeUnit,
                        ActualVolume = b.ActualVolume,
                        ActualVolumeUnit = b.ActualVolumeUnit,
                        TargetOG = b.TargetOG,
                        ActualOG = b.ActualOG,
                        TargetFG = b.TargetFG,
                        ActualFG = b.ActualFG,
                        TargetABV = b.TargetABV,
                        ActualABV = b.ActualABV,
                        TargetIBU = b.TargetIBU,
                        ActualIBU = b.ActualIBU,
                        EstimatedCost = b.EstimatedCost,
                        ActualCost = b.ActualCost,
                        BrewerId = b.BrewerId,
                        BrewerName = b.Brewer != null ? $"{b.Brewer.FirstName} {b.Brewer.LastName}" : null,
                        AssignedTeam = b.AssignedTeam,
                        BrewingNotes = b.BrewingNotes,
                        FermentationNotes = b.FermentationNotes,
                        PackagingNotes = b.PackagingNotes,
                        QualityNotes = b.QualityNotes,
                        Created = b.Created,
                        CreatedBy = b.CreatedBy,
                        Updated = b.Updated,
                        UpdatedBy = b.UpdatedBy
                    })
                    .FirstOrDefaultAsync();

                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }

                return Ok(new { success = true, data = batch });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch {BatchId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/batch
        [HttpPost]
        public async Task<ActionResult> CreateBatch([FromBody] BatchRequest request)
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

                // Recipe validation if specified
                if (request.RecipeId.HasValue)
                {
                    var recipeExists = await _context.Recipes
                        .AnyAsync(r => r.RecipeId == request.RecipeId.Value && r.TenantId == tenantId.Value);

                    if (!recipeExists)
                    {
                        return BadRequest(new { success = false, message = "Recipe not found" });
                    }
                }

                var batch = new Batch
                {
                    BatchId = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    BreweryId = request.BreweryId,
                    RecipeId = request.RecipeId,
                    Name = request.Name,
                    BatchNumber = request.BatchNumber,
                    Description = request.Description,
                    Status = request.Status,
                    StartDate = request.StartDate,
                    PlannedVolume = request.PlannedVolume,
                    PlannedVolumeUnit = request.PlannedVolumeUnit,
                    TargetOG = request.TargetOG,
                    TargetFG = request.TargetFG,
                    TargetABV = request.TargetABV,
                    TargetIBU = request.TargetIBU,
                    EstimatedCost = request.EstimatedCost,
                    BrewerId = request.BrewerId,
                    AssignedTeam = request.AssignedTeam,
                    BrewingNotes = request.BrewingNotes,
                    Created = DateTime.UtcNow,
                    CreatedBy = currentUserId.Value,
                    Updated = DateTime.UtcNow,
                    UpdatedBy = currentUserId.Value
                };

                _context.Batches.Add(batch);

                // Auto-generate BatchSteps from RecipeSteps if recipe is specified
                if (request.RecipeId.HasValue)
                {
                    var recipeSteps = await _context.RecipeSteps
                        .Where(rs => rs.RecipeId == request.RecipeId.Value)
                        .OrderBy(rs => rs.StepNumber)
                        .ToListAsync();

                    foreach (var recipeStep in recipeSteps)
                    {
                        var batchStep = new BatchStep
                        {
                            BatchStepId = Guid.NewGuid(),
                            BatchId = batch.BatchId,
                            Name = recipeStep.StepName,
                            Description = recipeStep.Description,
                            StepNumber = recipeStep.StepNumber,
                            StepType = recipeStep.Phase,
                            Status = "Not Started",
                            PlannedDuration = recipeStep.Duration,
                            PlannedTemperature = recipeStep.Temperature,
                            Notes = BuildStepNotes(recipeStep),
                            Created = DateTime.UtcNow,
                            CreatedBy = currentUserId.Value,
                            Updated = DateTime.UtcNow,
                            UpdatedBy = currentUserId.Value
                        };

                        _context.BatchSteps.Add(batchStep);
                    }
                }

                await _context.SaveChangesAsync();

                var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.RecipeId == batch.RecipeId);
                var brewer = await _context.Users.FirstOrDefaultAsync(u => u.UserId == batch.BrewerId);

                var response = new BatchDetailResponse
                {
                    BatchId = batch.BatchId,
                    TenantId = batch.TenantId,
                    BreweryId = batch.BreweryId,
                    RecipeId = batch.RecipeId,
                    RecipeName = recipe?.Name,
                    Name = batch.Name,
                    BatchNumber = batch.BatchNumber,
                    Description = batch.Description,
                    Status = batch.Status,
                    StartDate = batch.StartDate,
                    PlannedVolume = batch.PlannedVolume,
                    PlannedVolumeUnit = batch.PlannedVolumeUnit,
                    TargetOG = batch.TargetOG,
                    TargetFG = batch.TargetFG,
                    TargetABV = batch.TargetABV,
                    TargetIBU = batch.TargetIBU,
                    EstimatedCost = batch.EstimatedCost,
                    BrewerId = batch.BrewerId,
                    BrewerName = brewer != null ? $"{brewer.FirstName} {brewer.LastName}" : null,
                    AssignedTeam = batch.AssignedTeam,
                    BrewingNotes = batch.BrewingNotes,
                    Created = batch.Created,
                    CreatedBy = batch.CreatedBy,
                    Updated = batch.Updated,
                    UpdatedBy = batch.UpdatedBy
                };

                return CreatedAtAction(nameof(GetBatch), new { id = batch.BatchId },
                    new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating batch");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/batch/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateBatch(Guid id, [FromBody] BatchUpdateRequest request)
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

                var batch = await _context.Batches
                    .FirstOrDefaultAsync(b => b.BatchId == id && b.TenantId == tenantId.Value);

                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }

                // Update fields
                batch.Name = request.Name;
                batch.Description = request.Description;
                batch.Status = request.Status;
                batch.CompletedDate = request.CompletedDate;
                batch.ActualVolume = request.ActualVolume;
                batch.ActualVolumeUnit = request.ActualVolumeUnit;
                batch.ActualOG = request.ActualOG;
                batch.ActualFG = request.ActualFG;
                batch.ActualABV = request.ActualABV;
                batch.ActualIBU = request.ActualIBU;
                batch.ActualCost = request.ActualCost;
                batch.BrewerId = request.BrewerId;
                batch.AssignedTeam = request.AssignedTeam;
                batch.BrewingNotes = request.BrewingNotes;
                batch.FermentationNotes = request.FermentationNotes;
                batch.PackagingNotes = request.PackagingNotes;
                batch.QualityNotes = request.QualityNotes;
                batch.Updated = DateTime.UtcNow;
                batch.UpdatedBy = currentUserId.Value;

                await _context.SaveChangesAsync();

                var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.RecipeId == batch.RecipeId);
                var brewer = await _context.Users.FirstOrDefaultAsync(u => u.UserId == batch.BrewerId);

                var response = new BatchDetailResponse
                {
                    BatchId = batch.BatchId,
                    TenantId = batch.TenantId,
                    BreweryId = batch.BreweryId,
                    RecipeId = batch.RecipeId,
                    RecipeName = recipe?.Name,
                    Name = batch.Name,
                    BatchNumber = batch.BatchNumber,
                    Description = batch.Description,
                    Status = batch.Status,
                    StartDate = batch.StartDate,
                    CompletedDate = batch.CompletedDate,
                    PlannedVolume = batch.PlannedVolume,
                    PlannedVolumeUnit = batch.PlannedVolumeUnit,
                    ActualVolume = batch.ActualVolume,
                    ActualVolumeUnit = batch.ActualVolumeUnit,
                    TargetOG = batch.TargetOG,
                    ActualOG = batch.ActualOG,
                    TargetFG = batch.TargetFG,
                    ActualFG = batch.ActualFG,
                    TargetABV = batch.TargetABV,
                    ActualABV = batch.ActualABV,
                    TargetIBU = batch.TargetIBU,
                    ActualIBU = batch.ActualIBU,
                    EstimatedCost = batch.EstimatedCost,
                    ActualCost = batch.ActualCost,
                    BrewerId = batch.BrewerId,
                    BrewerName = brewer != null ? $"{brewer.FirstName} {brewer.LastName}" : null,
                    AssignedTeam = batch.AssignedTeam,
                    BrewingNotes = batch.BrewingNotes,
                    FermentationNotes = batch.FermentationNotes,
                    PackagingNotes = batch.PackagingNotes,
                    QualityNotes = batch.QualityNotes,
                    Created = batch.Created,
                    CreatedBy = batch.CreatedBy,
                    Updated = batch.Updated,
                    UpdatedBy = batch.UpdatedBy
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating batch {BatchId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PATCH: api/batch/{id}/status
        [HttpPatch("{id}/status")]
        public async Task<ActionResult> UpdateBatchStatus(Guid id, [FromBody] BatchStatusUpdateRequest request)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var batch = await _context.Batches
                    .FirstOrDefaultAsync(b => b.BatchId == id && b.TenantId == tenantId.Value);

                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }

                batch.Status = request.Status;

                if (request.Status == "Completed" && !batch.CompletedDate.HasValue)
                {
                    batch.CompletedDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating batch status {BatchId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // DELETE: api/batch/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteBatch(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var batch = await _context.Batches
                    .FirstOrDefaultAsync(b => b.BatchId == id && b.TenantId == tenantId.Value);

                if (batch == null)
                {
                    return NotFound(new { success = false, message = "Batch not found" });
                }

                _context.Batches.Remove(batch);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Batch deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting batch {BatchId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Builds comprehensive notes for a BatchStep from RecipeStep properties
        /// </summary>
        private string BuildStepNotes(RecipeStep recipeStep)
        {
            var notes = new List<string>();

            // Add description if present
            if (!string.IsNullOrEmpty(recipeStep.Description))
                notes.Add(recipeStep.Description);

            // Add instructions if present
            if (!string.IsNullOrEmpty(recipeStep.Instructions))
                notes.Add($"Instructions: {recipeStep.Instructions}");

            // Add temperature info if present
            if (recipeStep.Temperature.HasValue)
                notes.Add($"Temperature: {recipeStep.Temperature}{recipeStep.TemperatureUnit}");

            // Add duration if present
            if (recipeStep.Duration.HasValue)
                notes.Add($"Duration: {recipeStep.Duration} minutes");

            // Add amount info if present (for additions)
            if (recipeStep.Amount.HasValue && !string.IsNullOrEmpty(recipeStep.AmountUnit))
                notes.Add($"Amount: {recipeStep.Amount} {recipeStep.AmountUnit}");

            // Add ingredient info if present
            if (recipeStep.IngredientId.HasValue && !string.IsNullOrEmpty(recipeStep.IngredientType))
                notes.Add($"Ingredient: {recipeStep.IngredientType} (ID: {recipeStep.IngredientId})");

            // Add optional flag if marked
            if (recipeStep.IsOptional)
                notes.Add("(Optional Step)");

            // Add alert timing if specified
            if (recipeStep.AlertBefore.HasValue)
                notes.Add($"Alert {recipeStep.AlertBefore} minutes before step");

            return notes.Count > 0 ? string.Join(" | ", notes) : $"{recipeStep.Phase}: {recipeStep.StepName}";
        }
    }

    // DTOs
    public class BatchRequest
    {
        [JsonPropertyName("breweryId")]
        public Guid? BreweryId { get; set; }

        [JsonPropertyName("recipeId")]
        public Guid? RecipeId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("batchNumber")]
        public string BatchNumber { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Planning";

        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [JsonPropertyName("plannedVolume")]
        public decimal? PlannedVolume { get; set; }

        [JsonPropertyName("plannedVolumeUnit")]
        public string? PlannedVolumeUnit { get; set; }

        [JsonPropertyName("targetOG")]
        public decimal? TargetOG { get; set; }

        [JsonPropertyName("targetFG")]
        public decimal? TargetFG { get; set; }

        [JsonPropertyName("targetABV")]
        public decimal? TargetABV { get; set; }

        [JsonPropertyName("targetIBU")]
        public decimal? TargetIBU { get; set; }

        [JsonPropertyName("estimatedCost")]
        public decimal? EstimatedCost { get; set; }

        [JsonPropertyName("brewerId")]
        public Guid? BrewerId { get; set; }

        [JsonPropertyName("assignedTeam")]
        public Guid[]? AssignedTeam { get; set; }

        [JsonPropertyName("brewingNotes")]
        public string? BrewingNotes { get; set; }
    }

    public class BatchUpdateRequest
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("completedDate")]
        public DateTime? CompletedDate { get; set; }

        [JsonPropertyName("actualVolume")]
        public decimal? ActualVolume { get; set; }

        [JsonPropertyName("actualVolumeUnit")]
        public string? ActualVolumeUnit { get; set; }

        [JsonPropertyName("actualOG")]
        public decimal? ActualOG { get; set; }

        [JsonPropertyName("actualFG")]
        public decimal? ActualFG { get; set; }

        [JsonPropertyName("actualABV")]
        public decimal? ActualABV { get; set; }

        [JsonPropertyName("actualIBU")]
        public decimal? ActualIBU { get; set; }

        [JsonPropertyName("actualCost")]
        public decimal? ActualCost { get; set; }

        [JsonPropertyName("brewerId")]
        public Guid? BrewerId { get; set; }

        [JsonPropertyName("assignedTeam")]
        public Guid[]? AssignedTeam { get; set; }

        [JsonPropertyName("brewingNotes")]
        public string? BrewingNotes { get; set; }

        [JsonPropertyName("fermentationNotes")]
        public string? FermentationNotes { get; set; }

        [JsonPropertyName("packagingNotes")]
        public string? PackagingNotes { get; set; }

        [JsonPropertyName("qualityNotes")]
        public string? QualityNotes { get; set; }
    }

    public class BatchStatusUpdateRequest
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }

    public class BatchResponse
    {
        [JsonPropertyName("batchId")]
        public Guid BatchId { get; set; }

        [JsonPropertyName("tenantId")]
        public Guid TenantId { get; set; }

        [JsonPropertyName("breweryId")]
        public Guid? BreweryId { get; set; }

        [JsonPropertyName("recipeId")]
        public Guid? RecipeId { get; set; }

        [JsonPropertyName("recipeName")]
        public string? RecipeName { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("batchNumber")]
        public string BatchNumber { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [JsonPropertyName("completedDate")]
        public DateTime? CompletedDate { get; set; }

        [JsonPropertyName("plannedVolume")]
        public decimal? PlannedVolume { get; set; }

        [JsonPropertyName("plannedVolumeUnit")]
        public string? PlannedVolumeUnit { get; set; }

        [JsonPropertyName("actualVolume")]
        public decimal? ActualVolume { get; set; }

        [JsonPropertyName("actualVolumeUnit")]
        public string? ActualVolumeUnit { get; set; }

        [JsonPropertyName("targetOG")]
        public decimal? TargetOG { get; set; }

        [JsonPropertyName("actualOG")]
        public decimal? ActualOG { get; set; }

        [JsonPropertyName("targetFG")]
        public decimal? TargetFG { get; set; }

        [JsonPropertyName("actualFG")]
        public decimal? ActualFG { get; set; }

        [JsonPropertyName("targetABV")]
        public decimal? TargetABV { get; set; }

        [JsonPropertyName("actualABV")]
        public decimal? ActualABV { get; set; }

        [JsonPropertyName("targetIBU")]
        public decimal? TargetIBU { get; set; }

        [JsonPropertyName("actualIBU")]
        public decimal? ActualIBU { get; set; }

        [JsonPropertyName("estimatedCost")]
        public decimal? EstimatedCost { get; set; }

        [JsonPropertyName("actualCost")]
        public decimal? ActualCost { get; set; }

        [JsonPropertyName("brewerId")]
        public Guid? BrewerId { get; set; }

        [JsonPropertyName("brewerName")]
        public string? BrewerName { get; set; }

        [JsonPropertyName("assignedTeam")]
        public Guid[]? AssignedTeam { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }

        [JsonPropertyName("createdBy")]
        public Guid? CreatedBy { get; set; }
    }

    public class BatchDetailResponse : BatchResponse
    {
        [JsonPropertyName("brewingNotes")]
        public string? BrewingNotes { get; set; }

        [JsonPropertyName("fermentationNotes")]
        public string? FermentationNotes { get; set; }

        [JsonPropertyName("packagingNotes")]
        public string? PackagingNotes { get; set; }

        [JsonPropertyName("qualityNotes")]
        public string? QualityNotes { get; set; }

        [JsonPropertyName("updated")]
        public DateTime Updated { get; set; }

        [JsonPropertyName("updatedBy")]
        public Guid? UpdatedBy { get; set; }
    }
}
