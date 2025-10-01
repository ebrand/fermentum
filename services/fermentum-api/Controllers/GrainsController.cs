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
    public class GrainsController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<GrainsController> _logger;

        public GrainsController(
            AuthDbContext context,
            ILogger<GrainsController> logger)
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
        /// Get all grains (global + tenant-specific)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<GrainDto>>>> GetGrains(
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] bool includeInactive = false,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 100)
        {
            try
            {
                var currentTenantId = await GetCurrentTenantIdAsync();

                var query = _context.Grains.AsQueryable();

                // Filter by active status
                if (!includeInactive)
                {
                    query = query.Where(g => g.IsActive);
                }

                // Search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(g =>
                        g.Name.Contains(search) ||
                        (g.Origin != null && g.Origin.Contains(search)) ||
                        (g.Supplier != null && g.Supplier.Contains(search)) ||
                        (g.Description != null && g.Description.Contains(search)));
                }

                // Type filter
                if (!string.IsNullOrWhiteSpace(type))
                {
                    query = query.Where(g => g.Type == type);
                }

                // Apply pagination
                var grains = await query
                    .OrderBy(g => g.Name)
                    .Skip(skip)
                    .Take(Math.Min(take, 100)) // Limit max results
                    .Select(g => new GrainDto
                    {
                        GrainId = g.GrainId,
                        TenantId = g.TenantId,
                        Name = g.Name,
                        Type = g.Type,
                        Origin = g.Origin,
                        Supplier = g.Supplier,
                        Color = g.Color,
                        Potential = g.Potential,
                        MaxUsage = g.MaxUsage,
                        RequiresMashing = g.RequiresMashing,
                        Description = g.Description,
                        FlavorProfile = g.FlavorProfile,
                        IsActive = g.IsActive,
                        IsCustom = g.IsCustom,
                        Created = g.Created,
                        Updated = g.Updated
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<GrainDto>>
                {
                    Success = true,
                    Data = grains,
                    Message = $"Retrieved {grains.Count} grains"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grains");
                return StatusCode(500, new ApiResponse<IEnumerable<GrainDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve grains"
                });
            }
        }

        /// <summary>
        /// Get grain by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<GrainDto>>> GetGrain(Guid id)
        {
            try
            {
                var grain = await _context.Grains
                    .Where(g => g.GrainId == id)
                    .Select(g => new GrainDto
                    {
                        GrainId = g.GrainId,
                        TenantId = g.TenantId,
                        Name = g.Name,
                        Type = g.Type,
                        Origin = g.Origin,
                        Supplier = g.Supplier,
                        Color = g.Color,
                        Potential = g.Potential,
                        MaxUsage = g.MaxUsage,
                        RequiresMashing = g.RequiresMashing,
                        Description = g.Description,
                        FlavorProfile = g.FlavorProfile,
                        IsActive = g.IsActive,
                        IsCustom = g.IsCustom,
                        Created = g.Created,
                        Updated = g.Updated
                    })
                    .FirstOrDefaultAsync();

                if (grain == null)
                {
                    return NotFound(new ApiResponse<GrainDto>
                    {
                        Success = false,
                        Message = "Grain not found"
                    });
                }

                return Ok(new ApiResponse<GrainDto>
                {
                    Success = true,
                    Data = grain
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grain {GrainId}", id);
                return StatusCode(500, new ApiResponse<GrainDto>
                {
                    Success = false,
                    Message = "Failed to retrieve grain"
                });
            }
        }

        /// <summary>
        /// Create new grain
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<GrainDto>>> CreateGrain([FromBody] CreateGrainDto createDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentTenantId = await GetCurrentTenantIdAsync();

                var grain = new Grain
                {
                    TenantId = currentTenantId, // Custom grains are tenant-specific
                    Name = createDto.Name,
                    Type = createDto.Type,
                    Origin = createDto.Origin,
                    Supplier = createDto.Supplier,
                    Color = createDto.Color,
                    Potential = createDto.Potential,
                    MaxUsage = createDto.MaxUsage,
                    RequiresMashing = createDto.RequiresMashing,
                    Description = createDto.Description,
                    FlavorProfile = createDto.FlavorProfile,
                    IsActive = createDto.IsActive,
                    IsCustom = true, // User-created grains are always custom
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                _context.Grains.Add(grain);
                await _context.SaveChangesAsync();

                var grainDto = new GrainDto
                {
                    GrainId = grain.GrainId,
                    TenantId = grain.TenantId,
                    Name = grain.Name,
                    Type = grain.Type,
                    Origin = grain.Origin,
                    Supplier = grain.Supplier,
                    Color = grain.Color,
                    Potential = grain.Potential,
                    MaxUsage = grain.MaxUsage,
                    RequiresMashing = grain.RequiresMashing,
                    Description = grain.Description,
                    FlavorProfile = grain.FlavorProfile,
                    IsActive = grain.IsActive,
                    IsCustom = grain.IsCustom,
                    Created = grain.Created,
                    Updated = grain.Updated
                };

                return CreatedAtAction(nameof(GetGrain), new { id = grain.GrainId },
                    new ApiResponse<GrainDto>
                    {
                        Success = true,
                        Data = grainDto,
                        Message = "Grain created successfully"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating grain");
                return StatusCode(500, new ApiResponse<GrainDto>
                {
                    Success = false,
                    Message = "Failed to create grain"
                });
            }
        }

        /// <summary>
        /// Update grain
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<GrainDto>>> UpdateGrain(Guid id, [FromBody] UpdateGrainDto updateDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var grain = await _context.Grains.FirstOrDefaultAsync(g => g.GrainId == id);

                if (grain == null)
                {
                    return NotFound(new ApiResponse<GrainDto>
                    {
                        Success = false,
                        Message = "Grain not found"
                    });
                }

                // Only allow updating custom grains
                if (!grain.IsCustom)
                {
                    return BadRequest(new ApiResponse<GrainDto>
                    {
                        Success = false,
                        Message = "Cannot modify global grain entries"
                    });
                }

                // Update properties
                grain.Name = updateDto.Name;
                grain.Type = updateDto.Type;
                grain.Origin = updateDto.Origin;
                grain.Supplier = updateDto.Supplier;
                grain.Color = updateDto.Color;
                grain.Potential = updateDto.Potential;
                grain.MaxUsage = updateDto.MaxUsage;
                grain.RequiresMashing = updateDto.RequiresMashing;
                grain.Description = updateDto.Description;
                grain.FlavorProfile = updateDto.FlavorProfile;
                grain.IsActive = updateDto.IsActive;
                grain.Updated = DateTime.UtcNow;
                grain.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                var grainDto = new GrainDto
                {
                    GrainId = grain.GrainId,
                    TenantId = grain.TenantId,
                    Name = grain.Name,
                    Type = grain.Type,
                    Origin = grain.Origin,
                    Supplier = grain.Supplier,
                    Color = grain.Color,
                    Potential = grain.Potential,
                    MaxUsage = grain.MaxUsage,
                    RequiresMashing = grain.RequiresMashing,
                    Description = grain.Description,
                    FlavorProfile = grain.FlavorProfile,
                    IsActive = grain.IsActive,
                    IsCustom = grain.IsCustom,
                    Created = grain.Created,
                    Updated = grain.Updated
                };

                return Ok(new ApiResponse<GrainDto>
                {
                    Success = true,
                    Data = grainDto,
                    Message = "Grain updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating grain {GrainId}", id);
                return StatusCode(500, new ApiResponse<GrainDto>
                {
                    Success = false,
                    Message = "Failed to update grain"
                });
            }
        }

        /// <summary>
        /// Delete grain (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteGrain(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var grain = await _context.Grains.FirstOrDefaultAsync(g => g.GrainId == id);

                if (grain == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Grain not found"
                    });
                }

                // Only allow deleting custom grains
                if (!grain.IsCustom)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Cannot delete global grain entries"
                    });
                }

                // Soft delete
                grain.IsActive = false;
                grain.Updated = DateTime.UtcNow;
                grain.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Grain deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting grain {GrainId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete grain"
                });
            }
        }

        /// <summary>
        /// Get distinct grain types
        /// </summary>
        [HttpGet("types")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetGrainTypes()
        {
            try
            {
                var types = await _context.Grains
                    .Where(g => g.IsActive)
                    .Select(g => g.Type)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = types,
                    Message = $"Retrieved {types.Count} grain types"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grain types");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve grain types"
                });
            }
        }
    }
}