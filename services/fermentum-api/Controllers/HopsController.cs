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
    public class HopsController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<HopsController> _logger;

        public HopsController(
            AuthDbContext context,
            ILogger<HopsController> logger)
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
        /// Get all hops (global + tenant-specific)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<HopDto>>>> GetHops(
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] string? origin = null,
            [FromQuery] bool includeInactive = false,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 100)
        {
            try
            {
                var currentTenantId = await GetCurrentTenantIdAsync();

                var query = _context.Hops.AsQueryable();

                // Filter by active status
                if (!includeInactive)
                {
                    query = query.Where(h => h.IsActive);
                }

                // Search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(h =>
                        h.Name.Contains(search) ||
                        (h.Origin != null && h.Origin.Contains(search)) ||
                        (h.FlavorProfile != null && h.FlavorProfile.Contains(search)) ||
                        (h.AromaProfile != null && h.AromaProfile.Contains(search)));
                }

                // Type filter
                if (!string.IsNullOrWhiteSpace(type))
                {
                    query = query.Where(h => h.Type == type);
                }

                // Origin filter
                if (!string.IsNullOrWhiteSpace(origin))
                {
                    query = query.Where(h => h.Origin == origin);
                }

                // Apply pagination
                var hops = await query
                    .OrderBy(h => h.Name)
                    .Skip(skip)
                    .Take(Math.Min(take, 100))
                    .Select(h => new HopDto
                    {
                        HopId = h.HopId,
                        TenantId = h.TenantId,
                        Name = h.Name,
                        Origin = h.Origin,
                        Type = h.Type,
                        AlphaAcidMin = h.AlphaAcidMin,
                        AlphaAcidMax = h.AlphaAcidMax,
                        BetaAcid = h.BetaAcid,
                        CoHumulone = h.CoHumulone,
                        FlavorProfile = h.FlavorProfile,
                        AromaProfile = h.AromaProfile,
                        Substitutes = h.Substitutes,
                        StorageIndex = h.StorageIndex,
                        HarvestYear = h.HarvestYear,
                        IsActive = h.IsActive,
                        IsCustom = h.IsCustom,
                        Created = h.Created,
                        Updated = h.Updated
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<HopDto>>
                {
                    Success = true,
                    Data = hops,
                    Message = $"Retrieved {hops.Count} hops"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving hops");
                return StatusCode(500, new ApiResponse<IEnumerable<HopDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve hops"
                });
            }
        }

        /// <summary>
        /// Get hop by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<HopDto>>> GetHop(Guid id)
        {
            try
            {
                var hop = await _context.Hops
                    .Where(h => h.HopId == id)
                    .Select(h => new HopDto
                    {
                        HopId = h.HopId,
                        TenantId = h.TenantId,
                        Name = h.Name,
                        Origin = h.Origin,
                        Type = h.Type,
                        AlphaAcidMin = h.AlphaAcidMin,
                        AlphaAcidMax = h.AlphaAcidMax,
                        BetaAcid = h.BetaAcid,
                        CoHumulone = h.CoHumulone,
                        FlavorProfile = h.FlavorProfile,
                        AromaProfile = h.AromaProfile,
                        Substitutes = h.Substitutes,
                        StorageIndex = h.StorageIndex,
                        HarvestYear = h.HarvestYear,
                        IsActive = h.IsActive,
                        IsCustom = h.IsCustom,
                        Created = h.Created,
                        Updated = h.Updated
                    })
                    .FirstOrDefaultAsync();

                if (hop == null)
                {
                    return NotFound(new ApiResponse<HopDto>
                    {
                        Success = false,
                        Message = "Hop not found"
                    });
                }

                return Ok(new ApiResponse<HopDto>
                {
                    Success = true,
                    Data = hop
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving hop {HopId}", id);
                return StatusCode(500, new ApiResponse<HopDto>
                {
                    Success = false,
                    Message = "Failed to retrieve hop"
                });
            }
        }

        /// <summary>
        /// Create new hop
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<HopDto>>> CreateHop([FromBody] CreateHopDto createDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentTenantId = await GetCurrentTenantIdAsync();

                var hop = new Hop
                {
                    TenantId = currentTenantId,
                    Name = createDto.Name,
                    Origin = createDto.Origin,
                    Type = createDto.Type,
                    AlphaAcidMin = createDto.AlphaAcidMin,
                    AlphaAcidMax = createDto.AlphaAcidMax,
                    BetaAcid = createDto.BetaAcid,
                    CoHumulone = createDto.CoHumulone,
                    FlavorProfile = createDto.FlavorProfile,
                    AromaProfile = createDto.AromaProfile,
                    Substitutes = createDto.Substitutes,
                    StorageIndex = createDto.StorageIndex,
                    HarvestYear = createDto.HarvestYear,
                    IsActive = createDto.IsActive,
                    IsCustom = true,
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                _context.Hops.Add(hop);
                await _context.SaveChangesAsync();

                var hopDto = new HopDto
                {
                    HopId = hop.HopId,
                    TenantId = hop.TenantId,
                    Name = hop.Name,
                    Origin = hop.Origin,
                    Type = hop.Type,
                    AlphaAcidMin = hop.AlphaAcidMin,
                    AlphaAcidMax = hop.AlphaAcidMax,
                    BetaAcid = hop.BetaAcid,
                    CoHumulone = hop.CoHumulone,
                    FlavorProfile = hop.FlavorProfile,
                    AromaProfile = hop.AromaProfile,
                    Substitutes = hop.Substitutes,
                    StorageIndex = hop.StorageIndex,
                    HarvestYear = hop.HarvestYear,
                    IsActive = hop.IsActive,
                    IsCustom = hop.IsCustom,
                    Created = hop.Created,
                    Updated = hop.Updated
                };

                return CreatedAtAction(nameof(GetHop), new { id = hop.HopId },
                    new ApiResponse<HopDto>
                    {
                        Success = true,
                        Data = hopDto,
                        Message = "Hop created successfully"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating hop");
                return StatusCode(500, new ApiResponse<HopDto>
                {
                    Success = false,
                    Message = "Failed to create hop"
                });
            }
        }

        /// <summary>
        /// Update hop
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<HopDto>>> UpdateHop(Guid id, [FromBody] UpdateHopDto updateDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var hop = await _context.Hops.FirstOrDefaultAsync(h => h.HopId == id);

                if (hop == null)
                {
                    return NotFound(new ApiResponse<HopDto>
                    {
                        Success = false,
                        Message = "Hop not found"
                    });
                }

                if (!hop.IsCustom)
                {
                    return BadRequest(new ApiResponse<HopDto>
                    {
                        Success = false,
                        Message = "Cannot modify global hop entries"
                    });
                }

                // Update properties
                hop.Name = updateDto.Name;
                hop.Origin = updateDto.Origin;
                hop.Type = updateDto.Type;
                hop.AlphaAcidMin = updateDto.AlphaAcidMin;
                hop.AlphaAcidMax = updateDto.AlphaAcidMax;
                hop.BetaAcid = updateDto.BetaAcid;
                hop.CoHumulone = updateDto.CoHumulone;
                hop.FlavorProfile = updateDto.FlavorProfile;
                hop.AromaProfile = updateDto.AromaProfile;
                hop.Substitutes = updateDto.Substitutes;
                hop.StorageIndex = updateDto.StorageIndex;
                hop.HarvestYear = updateDto.HarvestYear;
                hop.IsActive = updateDto.IsActive;
                hop.Updated = DateTime.UtcNow;
                hop.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                var hopDto = new HopDto
                {
                    HopId = hop.HopId,
                    TenantId = hop.TenantId,
                    Name = hop.Name,
                    Origin = hop.Origin,
                    Type = hop.Type,
                    AlphaAcidMin = hop.AlphaAcidMin,
                    AlphaAcidMax = hop.AlphaAcidMax,
                    BetaAcid = hop.BetaAcid,
                    CoHumulone = hop.CoHumulone,
                    FlavorProfile = hop.FlavorProfile,
                    AromaProfile = hop.AromaProfile,
                    Substitutes = hop.Substitutes,
                    StorageIndex = hop.StorageIndex,
                    HarvestYear = hop.HarvestYear,
                    IsActive = hop.IsActive,
                    IsCustom = hop.IsCustom,
                    Created = hop.Created,
                    Updated = hop.Updated
                };

                return Ok(new ApiResponse<HopDto>
                {
                    Success = true,
                    Data = hopDto,
                    Message = "Hop updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating hop {HopId}", id);
                return StatusCode(500, new ApiResponse<HopDto>
                {
                    Success = false,
                    Message = "Failed to update hop"
                });
            }
        }

        /// <summary>
        /// Delete hop (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteHop(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var hop = await _context.Hops.FirstOrDefaultAsync(h => h.HopId == id);

                if (hop == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Hop not found"
                    });
                }

                if (!hop.IsCustom)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Cannot delete global hop entries"
                    });
                }

                // Soft delete
                hop.IsActive = false;
                hop.Updated = DateTime.UtcNow;
                hop.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Hop deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting hop {HopId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete hop"
                });
            }
        }

        /// <summary>
        /// Get distinct hop types
        /// </summary>
        [HttpGet("types")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetHopTypes()
        {
            try
            {
                var types = await _context.Hops
                    .Where(h => h.IsActive)
                    .Select(h => h.Type)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = types,
                    Message = $"Retrieved {types.Count} hop types"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving hop types");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve hop types"
                });
            }
        }

        /// <summary>
        /// Get distinct hop origins
        /// </summary>
        [HttpGet("origins")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetHopOrigins()
        {
            try
            {
                var origins = await _context.Hops
                    .Where(h => h.IsActive && h.Origin != null)
                    .Select(h => h.Origin!)
                    .Distinct()
                    .OrderBy(o => o)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = origins,
                    Message = $"Retrieved {origins.Count} hop origins"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving hop origins");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve hop origins"
                });
            }
        }
    }
}