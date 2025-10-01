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
    public class AdditivesController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<AdditivesController> _logger;

        public AdditivesController(
            AuthDbContext context,
            ILogger<AdditivesController> logger)
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
        /// Get all additives (global + tenant-specific)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<AdditiveDto>>>> GetAdditives(
            [FromQuery] string? search = null,
            [FromQuery] string? category = null,
            [FromQuery] string? type = null,
            [FromQuery] bool includeInactive = false,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 100)
        {
            try
            {
                var currentTenantId = await GetCurrentTenantIdAsync();

                // Include both global additives (TenantId = null) and tenant-specific additives
                var query = _context.Additives.Where(a =>
                    a.TenantId == null || a.TenantId == currentTenantId);

                // Filter by active status
                if (!includeInactive)
                {
                    query = query.Where(a => a.IsActive);
                }

                // Search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(a =>
                        a.Name.Contains(search) ||
                        (a.Purpose != null && a.Purpose.Contains(search)) ||
                        (a.Description != null && a.Description.Contains(search)));
                }

                // Category filter
                if (!string.IsNullOrWhiteSpace(category))
                {
                    query = query.Where(a => a.Category == category);
                }

                // Type filter
                if (!string.IsNullOrWhiteSpace(type))
                {
                    query = query.Where(a => a.Type == type);
                }

                // Apply pagination
                var additives = await query
                    .OrderBy(a => a.Category).ThenBy(a => a.Name)
                    .Skip(skip)
                    .Take(Math.Min(take, 100))
                    .Select(a => new AdditiveDto
                    {
                        AdditiveId = a.AdditiveId,
                        TenantId = a.TenantId,
                        Name = a.Name,
                        Category = a.Category,
                        Type = a.Type,
                        Purpose = a.Purpose,
                        DosageMin = a.DosageMin,
                        DosageMax = a.DosageMax,
                        DosageUnit = a.DosageUnit,
                        Usage = a.Usage,
                        SafetyNotes = a.SafetyNotes,
                        Description = a.Description,
                        IsActive = a.IsActive,
                        IsCustom = a.IsCustom,
                        Created = a.Created,
                        Updated = a.Updated
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<AdditiveDto>>
                {
                    Success = true,
                    Data = additives,
                    Message = $"Retrieved {additives.Count} additives"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving additives");
                return StatusCode(500, new ApiResponse<IEnumerable<AdditiveDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve additives"
                });
            }
        }

        /// <summary>
        /// Get additive by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<AdditiveDto>>> GetAdditive(Guid id)
        {
            try
            {
                var additive = await _context.Additives
                    .Where(a => a.AdditiveId == id)
                    .Select(a => new AdditiveDto
                    {
                        AdditiveId = a.AdditiveId,
                        TenantId = a.TenantId,
                        Name = a.Name,
                        Category = a.Category,
                        Type = a.Type,
                        Purpose = a.Purpose,
                        DosageMin = a.DosageMin,
                        DosageMax = a.DosageMax,
                        DosageUnit = a.DosageUnit,
                        Usage = a.Usage,
                        SafetyNotes = a.SafetyNotes,
                        Description = a.Description,
                        IsActive = a.IsActive,
                        IsCustom = a.IsCustom,
                        Created = a.Created,
                        Updated = a.Updated
                    })
                    .FirstOrDefaultAsync();

                if (additive == null)
                {
                    return NotFound(new ApiResponse<AdditiveDto>
                    {
                        Success = false,
                        Message = "Additive not found"
                    });
                }

                return Ok(new ApiResponse<AdditiveDto>
                {
                    Success = true,
                    Data = additive
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving additive {AdditiveId}", id);
                return StatusCode(500, new ApiResponse<AdditiveDto>
                {
                    Success = false,
                    Message = "Failed to retrieve additive"
                });
            }
        }

        /// <summary>
        /// Create new additive
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<AdditiveDto>>> CreateAdditive([FromBody] CreateAdditiveDto createDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentTenantId = await GetCurrentTenantIdAsync();

                var additive = new Additive
                {
                    TenantId = currentTenantId,
                    Name = createDto.Name,
                    Category = createDto.Category,
                    Type = createDto.Type,
                    Purpose = createDto.Purpose,
                    DosageMin = createDto.DosageMin,
                    DosageMax = createDto.DosageMax,
                    DosageUnit = createDto.DosageUnit,
                    Usage = createDto.Usage,
                    SafetyNotes = createDto.SafetyNotes,
                    Description = createDto.Description,
                    IsActive = createDto.IsActive,
                    IsCustom = true,
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                _context.Additives.Add(additive);
                await _context.SaveChangesAsync();

                var additiveDto = new AdditiveDto
                {
                    AdditiveId = additive.AdditiveId,
                    TenantId = additive.TenantId,
                    Name = additive.Name,
                    Category = additive.Category,
                    Type = additive.Type,
                    Purpose = additive.Purpose,
                    DosageMin = additive.DosageMin,
                    DosageMax = additive.DosageMax,
                    DosageUnit = additive.DosageUnit,
                    Usage = additive.Usage,
                    SafetyNotes = additive.SafetyNotes,
                    Description = additive.Description,
                    IsActive = additive.IsActive,
                    IsCustom = additive.IsCustom,
                    Created = additive.Created,
                    Updated = additive.Updated
                };

                return CreatedAtAction(nameof(GetAdditive), new { id = additive.AdditiveId },
                    new ApiResponse<AdditiveDto>
                    {
                        Success = true,
                        Data = additiveDto,
                        Message = "Additive created successfully"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating additive");
                return StatusCode(500, new ApiResponse<AdditiveDto>
                {
                    Success = false,
                    Message = "Failed to create additive"
                });
            }
        }

        /// <summary>
        /// Update additive
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<AdditiveDto>>> UpdateAdditive(Guid id, [FromBody] UpdateAdditiveDto updateDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var additive = await _context.Additives.FirstOrDefaultAsync(a => a.AdditiveId == id);

                if (additive == null)
                {
                    return NotFound(new ApiResponse<AdditiveDto>
                    {
                        Success = false,
                        Message = "Additive not found"
                    });
                }

                if (!additive.IsCustom)
                {
                    return BadRequest(new ApiResponse<AdditiveDto>
                    {
                        Success = false,
                        Message = "Cannot modify global additive entries"
                    });
                }

                // Update properties
                additive.Name = updateDto.Name;
                additive.Category = updateDto.Category;
                additive.Type = updateDto.Type;
                additive.Purpose = updateDto.Purpose;
                additive.DosageMin = updateDto.DosageMin;
                additive.DosageMax = updateDto.DosageMax;
                additive.DosageUnit = updateDto.DosageUnit;
                additive.Usage = updateDto.Usage;
                additive.SafetyNotes = updateDto.SafetyNotes;
                additive.Description = updateDto.Description;
                additive.IsActive = updateDto.IsActive;
                additive.Updated = DateTime.UtcNow;
                additive.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                var additiveDto = new AdditiveDto
                {
                    AdditiveId = additive.AdditiveId,
                    TenantId = additive.TenantId,
                    Name = additive.Name,
                    Category = additive.Category,
                    Type = additive.Type,
                    Purpose = additive.Purpose,
                    DosageMin = additive.DosageMin,
                    DosageMax = additive.DosageMax,
                    DosageUnit = additive.DosageUnit,
                    Usage = additive.Usage,
                    SafetyNotes = additive.SafetyNotes,
                    Description = additive.Description,
                    IsActive = additive.IsActive,
                    IsCustom = additive.IsCustom,
                    Created = additive.Created,
                    Updated = additive.Updated
                };

                return Ok(new ApiResponse<AdditiveDto>
                {
                    Success = true,
                    Data = additiveDto,
                    Message = "Additive updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating additive {AdditiveId}", id);
                return StatusCode(500, new ApiResponse<AdditiveDto>
                {
                    Success = false,
                    Message = "Failed to update additive"
                });
            }
        }

        /// <summary>
        /// Delete additive (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteAdditive(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var additive = await _context.Additives.FirstOrDefaultAsync(a => a.AdditiveId == id);

                if (additive == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Additive not found"
                    });
                }

                if (!additive.IsCustom)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Cannot delete global additive entries"
                    });
                }

                // Soft delete
                additive.IsActive = false;
                additive.Updated = DateTime.UtcNow;
                additive.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Additive deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting additive {AdditiveId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete additive"
                });
            }
        }

        /// <summary>
        /// Get distinct additive categories
        /// </summary>
        [HttpGet("categories")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetAdditiveCategories()
        {
            try
            {
                var categories = await _context.Additives
                    .Where(a => a.IsActive)
                    .Select(a => a.Category)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = categories,
                    Message = $"Retrieved {categories.Count} additive categories"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving additive categories");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve additive categories"
                });
            }
        }

        /// <summary>
        /// Get distinct additive types within a category
        /// </summary>
        [HttpGet("types")]
        public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetAdditiveTypes([FromQuery] string? category = null)
        {
            try
            {
                var query = _context.Additives.Where(a => a.IsActive && a.Type != null);

                if (!string.IsNullOrWhiteSpace(category))
                {
                    query = query.Where(a => a.Category == category);
                }

                var types = await query
                    .Select(a => a.Type!)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<string>>
                {
                    Success = true,
                    Data = types,
                    Message = $"Retrieved {types.Count} additive types"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving additive types");
                return StatusCode(500, new ApiResponse<IEnumerable<string>>
                {
                    Success = false,
                    Message = "Failed to retrieve additive types"
                });
            }
        }
    }
}