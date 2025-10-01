using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using Fermentum.Auth.Models;
using Fermentum.Auth.Models.DTOs;
using FermentumApi.Models.Ingredients;
using System.Security.Claims;

namespace FermentumApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MashStepsController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<MashStepsController> _logger;

        public MashStepsController(
            AuthDbContext context,
            ILogger<MashStepsController> logger)
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

        private async Task<Guid?> GetCurrentTenantIdAsync()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return null;
            }

            var userTenant = await _context.UserTenants
                .Where(ut => ut.UserId == userId.Value && ut.IsActive)
                .FirstOrDefaultAsync();

            return userTenant?.TenantId;
        }

        /// <summary>
        /// Get all mash steps (global + tenant-specific)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<MashStepDto>>>> GetMashSteps(
            [FromQuery] string? search = null,
            [FromQuery] string? stepType = null,
            [FromQuery] string? category = null,
            [FromQuery] bool includeInactive = false,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 100)
        {
            try
            {
                var currentTenantId = await GetCurrentTenantIdAsync();

                var query = _context.MashSteps.AsQueryable();

                // Filter by active status
                if (!includeInactive)
                {
                    query = query.Where(m => m.IsActive);
                }

                // Search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(m =>
                        m.Name.Contains(search) ||
                        (m.Description != null && m.Description.Contains(search)) ||
                        (m.Category != null && m.Category.Contains(search)));
                }

                // Step type filter
                if (!string.IsNullOrWhiteSpace(stepType))
                {
                    query = query.Where(m => m.StepType == stepType);
                }

                // Category filter
                if (!string.IsNullOrWhiteSpace(category))
                {
                    query = query.Where(m => m.Category == category);
                }

                // Apply pagination and ordering
                var mashSteps = await query
                    .OrderBy(m => m.TypicalOrder ?? 999)
                    .ThenBy(m => m.Name)
                    .Skip(skip)
                    .Take(Math.Min(take, 100)) // Limit max results
                    .Select(m => new MashStepDto
                    {
                        MashStepId = m.MashStepId,
                        TenantId = m.TenantId,
                        Name = m.Name,
                        StepType = m.StepType,
                        Temperature = m.Temperature,
                        TemperatureUnit = m.TemperatureUnit,
                        Duration = m.Duration,
                        Description = m.Description,
                        TypicalOrder = m.TypicalOrder,
                        Category = m.Category,
                        IsActive = m.IsActive,
                        IsCustom = m.IsCustom,
                        Created = m.Created,
                        Updated = m.Updated
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<MashStepDto>>
                {
                    Success = true,
                    Data = mashSteps,
                    Message = $"Retrieved {mashSteps.Count} mash steps"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving mash steps");
                return StatusCode(500, new ApiResponse<IEnumerable<MashStepDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve mash steps"
                });
            }
        }

        /// <summary>
        /// Get mash step by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<MashStepDto>>> GetMashStep(Guid id)
        {
            try
            {
                var mashStep = await _context.MashSteps
                    .Where(m => m.MashStepId == id)
                    .Select(m => new MashStepDto
                    {
                        MashStepId = m.MashStepId,
                        TenantId = m.TenantId,
                        Name = m.Name,
                        StepType = m.StepType,
                        Temperature = m.Temperature,
                        TemperatureUnit = m.TemperatureUnit,
                        Duration = m.Duration,
                        Description = m.Description,
                        TypicalOrder = m.TypicalOrder,
                        Category = m.Category,
                        IsActive = m.IsActive,
                        IsCustom = m.IsCustom,
                        Created = m.Created,
                        Updated = m.Updated
                    })
                    .FirstOrDefaultAsync();

                if (mashStep == null)
                {
                    return NotFound(new ApiResponse<MashStepDto>
                    {
                        Success = false,
                        Message = "Mash step not found"
                    });
                }

                return Ok(new ApiResponse<MashStepDto>
                {
                    Success = true,
                    Data = mashStep
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving mash step {MashStepId}", id);
                return StatusCode(500, new ApiResponse<MashStepDto>
                {
                    Success = false,
                    Message = "Failed to retrieve mash step"
                });
            }
        }

        /// <summary>
        /// Create new mash step
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<MashStepDto>>> CreateMashStep([FromBody] CreateMashStepDto createDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentTenantId = await GetCurrentTenantIdAsync();

                var mashStep = new MashStep
                {
                    TenantId = currentTenantId, // Custom mash steps are tenant-specific
                    Name = createDto.Name,
                    StepType = createDto.StepType,
                    Temperature = createDto.Temperature,
                    TemperatureUnit = createDto.TemperatureUnit,
                    Duration = createDto.Duration,
                    Description = createDto.Description,
                    TypicalOrder = createDto.TypicalOrder,
                    Category = createDto.Category,
                    IsActive = createDto.IsActive,
                    IsCustom = true, // User-created mash steps are always custom
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                _context.MashSteps.Add(mashStep);
                await _context.SaveChangesAsync();

                var mashStepDto = new MashStepDto
                {
                    MashStepId = mashStep.MashStepId,
                    TenantId = mashStep.TenantId,
                    Name = mashStep.Name,
                    StepType = mashStep.StepType,
                    Temperature = mashStep.Temperature,
                    TemperatureUnit = mashStep.TemperatureUnit,
                    Duration = mashStep.Duration,
                    Description = mashStep.Description,
                    TypicalOrder = mashStep.TypicalOrder,
                    Category = mashStep.Category,
                    IsActive = mashStep.IsActive,
                    IsCustom = mashStep.IsCustom,
                    Created = mashStep.Created,
                    Updated = mashStep.Updated
                };

                return CreatedAtAction(nameof(GetMashStep), new { id = mashStep.MashStepId },
                    new ApiResponse<MashStepDto>
                    {
                        Success = true,
                        Data = mashStepDto,
                        Message = "Mash step created successfully"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating mash step");
                return StatusCode(500, new ApiResponse<MashStepDto>
                {
                    Success = false,
                    Message = "Failed to create mash step"
                });
            }
        }

        /// <summary>
        /// Update mash step
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<MashStepDto>>> UpdateMashStep(Guid id, [FromBody] UpdateMashStepDto updateDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var mashStep = await _context.MashSteps.FirstOrDefaultAsync(m => m.MashStepId == id);

                if (mashStep == null)
                {
                    return NotFound(new ApiResponse<MashStepDto>
                    {
                        Success = false,
                        Message = "Mash step not found"
                    });
                }

                // Only allow updating custom mash steps
                if (!mashStep.IsCustom)
                {
                    return BadRequest(new ApiResponse<MashStepDto>
                    {
                        Success = false,
                        Message = "Cannot modify global mash step entries"
                    });
                }

                // Update properties
                mashStep.Name = updateDto.Name;
                mashStep.StepType = updateDto.StepType;
                mashStep.Temperature = updateDto.Temperature;
                mashStep.TemperatureUnit = updateDto.TemperatureUnit;
                mashStep.Duration = updateDto.Duration;
                mashStep.Description = updateDto.Description;
                mashStep.TypicalOrder = updateDto.TypicalOrder;
                mashStep.Category = updateDto.Category;
                mashStep.IsActive = updateDto.IsActive;
                mashStep.Updated = DateTime.UtcNow;
                mashStep.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                var mashStepDto = new MashStepDto
                {
                    MashStepId = mashStep.MashStepId,
                    TenantId = mashStep.TenantId,
                    Name = mashStep.Name,
                    StepType = mashStep.StepType,
                    Temperature = mashStep.Temperature,
                    TemperatureUnit = mashStep.TemperatureUnit,
                    Duration = mashStep.Duration,
                    Description = mashStep.Description,
                    TypicalOrder = mashStep.TypicalOrder,
                    Category = mashStep.Category,
                    IsActive = mashStep.IsActive,
                    IsCustom = mashStep.IsCustom,
                    Created = mashStep.Created,
                    Updated = mashStep.Updated
                };

                return Ok(new ApiResponse<MashStepDto>
                {
                    Success = true,
                    Data = mashStepDto,
                    Message = "Mash step updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating mash step {MashStepId}", id);
                return StatusCode(500, new ApiResponse<MashStepDto>
                {
                    Success = false,
                    Message = "Failed to update mash step"
                });
            }
        }

        /// <summary>
        /// Delete mash step (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteMashStep(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var mashStep = await _context.MashSteps.FirstOrDefaultAsync(m => m.MashStepId == id);

                if (mashStep == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Mash step not found"
                    });
                }

                // Only allow deleting custom mash steps
                if (!mashStep.IsCustom)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Cannot delete global mash step entries"
                    });
                }

                // Soft delete
                mashStep.IsActive = false;
                mashStep.Updated = DateTime.UtcNow;
                mashStep.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Mash step deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting mash step {MashStepId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete mash step"
                });
            }
        }

        /// <summary>
        /// Get distinct step types
        /// </summary>
        [HttpGet("types")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetStepTypes()
        {
            try
            {
                var types = await _context.MashSteps
                    .Where(m => m.IsActive)
                    .Select(m => m.StepType)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = types,
                    Message = $"Retrieved {types.Count} step types"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving step types");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve step types"
                });
            }
        }

        /// <summary>
        /// Get distinct categories
        /// </summary>
        [HttpGet("categories")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetCategories()
        {
            try
            {
                var categories = await _context.MashSteps
                    .Where(m => m.IsActive && m.Category != null)
                    .Select(m => m.Category!)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = categories,
                    Message = $"Retrieved {categories.Count} categories"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving categories");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve categories"
                });
            }
        }
    }
}