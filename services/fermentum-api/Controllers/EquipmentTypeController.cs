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
    public class EquipmentTypeController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<EquipmentTypeController> _logger;

        public EquipmentTypeController(AuthDbContext context, ILogger<EquipmentTypeController> logger)
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

        // GET: api/equipmenttype
        [HttpGet]
        public async Task<ActionResult> GetEquipmentTypes()
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var equipmentTypes = await _context.EquipmentTypes
                    .Where(et => et.TenantId == tenantId.Value)
                    .OrderBy(et => et.Name)
                    .Select(et => new EquipmentTypeResponse
                    {
                        EquipmentTypeId = et.EquipmentTypeId,
                        TenantId = et.TenantId,
                        BreweryId = et.BreweryId,
                        Name = et.Name,
                        Description = et.Description,
                        Created = et.Created,
                        CreatedBy = et.CreatedBy,
                        Updated = et.Updated,
                        UpdatedBy = et.UpdatedBy
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = equipmentTypes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment types");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/equipmenttype/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetEquipmentType(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var equipmentType = await _context.EquipmentTypes
                    .Where(et => et.EquipmentTypeId == id && et.TenantId == tenantId.Value)
                    .Select(et => new EquipmentTypeResponse
                    {
                        EquipmentTypeId = et.EquipmentTypeId,
                        TenantId = et.TenantId,
                        BreweryId = et.BreweryId,
                        Name = et.Name,
                        Description = et.Description,
                        Created = et.Created,
                        CreatedBy = et.CreatedBy,
                        Updated = et.Updated,
                        UpdatedBy = et.UpdatedBy
                    })
                    .FirstOrDefaultAsync();

                if (equipmentType == null)
                {
                    return NotFound(new { success = false, message = "Equipment type not found" });
                }

                return Ok(new { success = true, data = equipmentType });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment type {EquipmentTypeId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/equipmenttype
        [HttpPost]
        public async Task<ActionResult> CreateEquipmentType([FromBody] EquipmentTypeRequest request)
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

                var equipmentType = new EquipmentType
                {
                    EquipmentTypeId = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    BreweryId = request.BreweryId,
                    Name = request.Name,
                    Description = request.Description,
                    Created = DateTime.UtcNow,
                    CreatedBy = currentUserId.Value,
                    Updated = DateTime.UtcNow,
                    UpdatedBy = currentUserId.Value
                };

                _context.EquipmentTypes.Add(equipmentType);
                await _context.SaveChangesAsync();

                var response = new EquipmentTypeResponse
                {
                    EquipmentTypeId = equipmentType.EquipmentTypeId,
                    TenantId = equipmentType.TenantId,
                    BreweryId = equipmentType.BreweryId,
                    Name = equipmentType.Name,
                    Description = equipmentType.Description,
                    Created = equipmentType.Created,
                    CreatedBy = equipmentType.CreatedBy,
                    Updated = equipmentType.Updated,
                    UpdatedBy = equipmentType.UpdatedBy
                };

                return CreatedAtAction(nameof(GetEquipmentType), new { id = equipmentType.EquipmentTypeId },
                    new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating equipment type");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/equipmenttype/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateEquipmentType(Guid id, [FromBody] EquipmentTypeRequest request)
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

                var equipmentType = await _context.EquipmentTypes
                    .FirstOrDefaultAsync(et => et.EquipmentTypeId == id && et.TenantId == tenantId.Value);

                if (equipmentType == null)
                {
                    return NotFound(new { success = false, message = "Equipment type not found" });
                }

                equipmentType.Name = request.Name;
                equipmentType.Description = request.Description;
                equipmentType.BreweryId = request.BreweryId;
                equipmentType.Updated = DateTime.UtcNow;
                equipmentType.UpdatedBy = currentUserId.Value;

                await _context.SaveChangesAsync();

                var response = new EquipmentTypeResponse
                {
                    EquipmentTypeId = equipmentType.EquipmentTypeId,
                    TenantId = equipmentType.TenantId,
                    BreweryId = equipmentType.BreweryId,
                    Name = equipmentType.Name,
                    Description = equipmentType.Description,
                    Created = equipmentType.Created,
                    CreatedBy = equipmentType.CreatedBy,
                    Updated = equipmentType.Updated,
                    UpdatedBy = equipmentType.UpdatedBy
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating equipment type {EquipmentTypeId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // DELETE: api/equipmenttype/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEquipmentType(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var equipmentType = await _context.EquipmentTypes
                    .FirstOrDefaultAsync(et => et.EquipmentTypeId == id && et.TenantId == tenantId.Value);

                if (equipmentType == null)
                {
                    return NotFound(new { success = false, message = "Equipment type not found" });
                }

                // Check if any equipment instances exist for this type
                var hasEquipment = await _context.Equipment
                    .AnyAsync(e => e.EquipmentTypeId == id && e.TenantId == tenantId.Value);

                if (hasEquipment)
                {
                    return BadRequest(new { success = false, message = "Cannot delete equipment type with existing equipment instances" });
                }

                _context.EquipmentTypes.Remove(equipmentType);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Equipment type deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting equipment type {EquipmentTypeId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }

    // DTOs
    public class EquipmentTypeRequest
    {
        [JsonPropertyName("breweryId")]
        public Guid? BreweryId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }

    public class EquipmentTypeResponse
    {
        [JsonPropertyName("equipmentTypeId")]
        public Guid EquipmentTypeId { get; set; }

        [JsonPropertyName("tenantId")]
        public Guid TenantId { get; set; }

        [JsonPropertyName("breweryId")]
        public Guid? BreweryId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }

        [JsonPropertyName("createdBy")]
        public Guid? CreatedBy { get; set; }

        [JsonPropertyName("updated")]
        public DateTime Updated { get; set; }

        [JsonPropertyName("updatedBy")]
        public Guid? UpdatedBy { get; set; }
    }
}
