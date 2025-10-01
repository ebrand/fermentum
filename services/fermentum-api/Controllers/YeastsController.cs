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
    public class YeastsController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<YeastsController> _logger;

        public YeastsController(
            AuthDbContext context,
            ILogger<YeastsController> logger)
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
        /// Get all yeasts (global + tenant-specific)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<YeastDto>>>> GetYeasts(
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] string? form = null,
            [FromQuery] string? manufacturer = null,
            [FromQuery] bool includeInactive = false,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 100)
        {
            try
            {
                var currentTenantId = await GetCurrentTenantIdAsync();

                var query = _context.Yeasts.AsQueryable();

                // Filter by active status
                if (!includeInactive)
                {
                    query = query.Where(y => y.IsActive);
                }

                // Search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(y =>
                        y.Name.Contains(search) ||
                        (y.Manufacturer != null && y.Manufacturer.Contains(search)) ||
                        (y.ProductId != null && y.ProductId.Contains(search)) ||
                        (y.Description != null && y.Description.Contains(search)));
                }

                // Type filter
                if (!string.IsNullOrWhiteSpace(type))
                {
                    query = query.Where(y => y.Type == type);
                }

                // Form filter
                if (!string.IsNullOrWhiteSpace(form))
                {
                    query = query.Where(y => y.Form == form);
                }

                // Manufacturer filter
                if (!string.IsNullOrWhiteSpace(manufacturer))
                {
                    query = query.Where(y => y.Manufacturer == manufacturer);
                }

                // Apply pagination
                var yeasts = await query
                    .OrderBy(y => y.Name)
                    .Skip(skip)
                    .Take(Math.Min(take, 100))
                    .Select(y => new YeastDto
                    {
                        YeastId = y.YeastId,
                        TenantId = y.TenantId,
                        Name = y.Name,
                        Manufacturer = y.Manufacturer,
                        ProductId = y.ProductId,
                        Type = y.Type,
                        Form = y.Form,
                        AttenuationMin = y.AttenuationMin,
                        AttenuationMax = y.AttenuationMax,
                        TemperatureMin = y.TemperatureMin,
                        TemperatureMax = y.TemperatureMax,
                        AlcoholTolerance = y.AlcoholTolerance,
                        Flocculation = y.Flocculation,
                        FlavorProfile = y.FlavorProfile,
                        Description = y.Description,
                        Usage = y.Usage,
                        PitchRate = y.PitchRate,
                        IsActive = y.IsActive,
                        IsCustom = y.IsCustom,
                        Created = y.Created,
                        Updated = y.Updated
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<YeastDto>>
                {
                    Success = true,
                    Data = yeasts,
                    Message = $"Retrieved {yeasts.Count} yeasts"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving yeasts");
                return StatusCode(500, new ApiResponse<IEnumerable<YeastDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve yeasts"
                });
            }
        }

        /// <summary>
        /// Get yeast by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<YeastDto>>> GetYeast(Guid id)
        {
            try
            {
                var yeast = await _context.Yeasts
                    .Where(y => y.YeastId == id)
                    .Select(y => new YeastDto
                    {
                        YeastId = y.YeastId,
                        TenantId = y.TenantId,
                        Name = y.Name,
                        Manufacturer = y.Manufacturer,
                        ProductId = y.ProductId,
                        Type = y.Type,
                        Form = y.Form,
                        AttenuationMin = y.AttenuationMin,
                        AttenuationMax = y.AttenuationMax,
                        TemperatureMin = y.TemperatureMin,
                        TemperatureMax = y.TemperatureMax,
                        AlcoholTolerance = y.AlcoholTolerance,
                        Flocculation = y.Flocculation,
                        FlavorProfile = y.FlavorProfile,
                        Description = y.Description,
                        Usage = y.Usage,
                        PitchRate = y.PitchRate,
                        IsActive = y.IsActive,
                        IsCustom = y.IsCustom,
                        Created = y.Created,
                        Updated = y.Updated
                    })
                    .FirstOrDefaultAsync();

                if (yeast == null)
                {
                    return NotFound(new ApiResponse<YeastDto>
                    {
                        Success = false,
                        Message = "Yeast not found"
                    });
                }

                return Ok(new ApiResponse<YeastDto>
                {
                    Success = true,
                    Data = yeast
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving yeast {YeastId}", id);
                return StatusCode(500, new ApiResponse<YeastDto>
                {
                    Success = false,
                    Message = "Failed to retrieve yeast"
                });
            }
        }

        /// <summary>
        /// Create new yeast
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<YeastDto>>> CreateYeast([FromBody] CreateYeastDto createDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentTenantId = await GetCurrentTenantIdAsync();

                var yeast = new Yeast
                {
                    TenantId = currentTenantId,
                    Name = createDto.Name,
                    Manufacturer = createDto.Manufacturer,
                    ProductId = createDto.ProductId,
                    Type = createDto.Type,
                    Form = createDto.Form,
                    AttenuationMin = createDto.AttenuationMin,
                    AttenuationMax = createDto.AttenuationMax,
                    TemperatureMin = createDto.TemperatureMin,
                    TemperatureMax = createDto.TemperatureMax,
                    AlcoholTolerance = createDto.AlcoholTolerance,
                    Flocculation = createDto.Flocculation,
                    FlavorProfile = createDto.FlavorProfile,
                    Description = createDto.Description,
                    Usage = createDto.Usage,
                    PitchRate = createDto.PitchRate,
                    IsActive = createDto.IsActive,
                    IsCustom = true,
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                _context.Yeasts.Add(yeast);
                await _context.SaveChangesAsync();

                var yeastDto = new YeastDto
                {
                    YeastId = yeast.YeastId,
                    TenantId = yeast.TenantId,
                    Name = yeast.Name,
                    Manufacturer = yeast.Manufacturer,
                    ProductId = yeast.ProductId,
                    Type = yeast.Type,
                    Form = yeast.Form,
                    AttenuationMin = yeast.AttenuationMin,
                    AttenuationMax = yeast.AttenuationMax,
                    TemperatureMin = yeast.TemperatureMin,
                    TemperatureMax = yeast.TemperatureMax,
                    AlcoholTolerance = yeast.AlcoholTolerance,
                    Flocculation = yeast.Flocculation,
                    FlavorProfile = yeast.FlavorProfile,
                    Description = yeast.Description,
                    Usage = yeast.Usage,
                    PitchRate = yeast.PitchRate,
                    IsActive = yeast.IsActive,
                    IsCustom = yeast.IsCustom,
                    Created = yeast.Created,
                    Updated = yeast.Updated
                };

                return CreatedAtAction(nameof(GetYeast), new { id = yeast.YeastId },
                    new ApiResponse<YeastDto>
                    {
                        Success = true,
                        Data = yeastDto,
                        Message = "Yeast created successfully"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating yeast");
                return StatusCode(500, new ApiResponse<YeastDto>
                {
                    Success = false,
                    Message = "Failed to create yeast"
                });
            }
        }

        /// <summary>
        /// Update yeast
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<YeastDto>>> UpdateYeast(Guid id, [FromBody] UpdateYeastDto updateDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var yeast = await _context.Yeasts.FirstOrDefaultAsync(y => y.YeastId == id);

                if (yeast == null)
                {
                    return NotFound(new ApiResponse<YeastDto>
                    {
                        Success = false,
                        Message = "Yeast not found"
                    });
                }

                if (!yeast.IsCustom)
                {
                    return BadRequest(new ApiResponse<YeastDto>
                    {
                        Success = false,
                        Message = "Cannot modify global yeast entries"
                    });
                }

                // Update properties
                yeast.Name = updateDto.Name;
                yeast.Manufacturer = updateDto.Manufacturer;
                yeast.ProductId = updateDto.ProductId;
                yeast.Type = updateDto.Type;
                yeast.Form = updateDto.Form;
                yeast.AttenuationMin = updateDto.AttenuationMin;
                yeast.AttenuationMax = updateDto.AttenuationMax;
                yeast.TemperatureMin = updateDto.TemperatureMin;
                yeast.TemperatureMax = updateDto.TemperatureMax;
                yeast.AlcoholTolerance = updateDto.AlcoholTolerance;
                yeast.Flocculation = updateDto.Flocculation;
                yeast.FlavorProfile = updateDto.FlavorProfile;
                yeast.Description = updateDto.Description;
                yeast.Usage = updateDto.Usage;
                yeast.PitchRate = updateDto.PitchRate;
                yeast.IsActive = updateDto.IsActive;
                yeast.Updated = DateTime.UtcNow;
                yeast.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                var yeastDto = new YeastDto
                {
                    YeastId = yeast.YeastId,
                    TenantId = yeast.TenantId,
                    Name = yeast.Name,
                    Manufacturer = yeast.Manufacturer,
                    ProductId = yeast.ProductId,
                    Type = yeast.Type,
                    Form = yeast.Form,
                    AttenuationMin = yeast.AttenuationMin,
                    AttenuationMax = yeast.AttenuationMax,
                    TemperatureMin = yeast.TemperatureMin,
                    TemperatureMax = yeast.TemperatureMax,
                    AlcoholTolerance = yeast.AlcoholTolerance,
                    Flocculation = yeast.Flocculation,
                    FlavorProfile = yeast.FlavorProfile,
                    Description = yeast.Description,
                    Usage = yeast.Usage,
                    PitchRate = yeast.PitchRate,
                    IsActive = yeast.IsActive,
                    IsCustom = yeast.IsCustom,
                    Created = yeast.Created,
                    Updated = yeast.Updated
                };

                return Ok(new ApiResponse<YeastDto>
                {
                    Success = true,
                    Data = yeastDto,
                    Message = "Yeast updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating yeast {YeastId}", id);
                return StatusCode(500, new ApiResponse<YeastDto>
                {
                    Success = false,
                    Message = "Failed to update yeast"
                });
            }
        }

        /// <summary>
        /// Delete yeast (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteYeast(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var yeast = await _context.Yeasts.FirstOrDefaultAsync(y => y.YeastId == id);

                if (yeast == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Yeast not found"
                    });
                }

                if (!yeast.IsCustom)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Cannot delete global yeast entries"
                    });
                }

                // Soft delete
                yeast.IsActive = false;
                yeast.Updated = DateTime.UtcNow;
                yeast.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Yeast deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting yeast {YeastId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete yeast"
                });
            }
        }

        /// <summary>
        /// Get distinct yeast types
        /// </summary>
        [HttpGet("types")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetYeastTypes()
        {
            try
            {
                var types = await _context.Yeasts
                    .Where(y => y.IsActive)
                    .Select(y => y.Type)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = types,
                    Message = $"Retrieved {types.Count} yeast types"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving yeast types");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve yeast types"
                });
            }
        }

        /// <summary>
        /// Get distinct yeast manufacturers
        /// </summary>
        [HttpGet("manufacturers")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetYeastManufacturers()
        {
            try
            {
                var manufacturers = await _context.Yeasts
                    .Where(y => y.IsActive && y.Manufacturer != null)
                    .Select(y => y.Manufacturer!)
                    .Distinct()
                    .OrderBy(m => m)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = manufacturers,
                    Message = $"Retrieved {manufacturers.Count} yeast manufacturers"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving yeast manufacturers");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve yeast manufacturers"
                });
            }
        }
    }
}