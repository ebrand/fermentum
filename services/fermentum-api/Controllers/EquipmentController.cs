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
    public class EquipmentController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<EquipmentController> _logger;

        public EquipmentController(AuthDbContext context, ILogger<EquipmentController> logger)
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

        // GET: api/equipment
        [HttpGet]
        public async Task<ActionResult> GetEquipment([FromQuery] string? status = null, [FromQuery] Guid? equipmentTypeId = null)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.current_tenant_id = '{tenantId.Value}'");

                var query = _context.Equipment
                    .Include(e => e.EquipmentType)
                    .Where(e => e.TenantId == tenantId.Value);

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(e => e.Status == status);
                }

                if (equipmentTypeId.HasValue)
                {
                    query = query.Where(e => e.EquipmentTypeId == equipmentTypeId.Value);
                }

                var equipment = await query
                    .OrderBy(e => e.Name)
                    .Select(e => new EquipmentResponse
                    {
                        EquipmentId = e.EquipmentId,
                        TenantId = e.TenantId,
                        BreweryId = e.BreweryId,
                        EquipmentTypeId = e.EquipmentTypeId,
                        EquipmentTypeName = e.EquipmentType != null ? e.EquipmentType.Name : null,
                        Name = e.Name,
                        Description = e.Description,
                        Status = e.Status,
                        Capacity = e.Capacity,
                        CapacityUnit = e.CapacityUnit,
                        WorkingCapacity = e.WorkingCapacity,
                        SerialNumber = e.SerialNumber,
                        Manufacturer = e.Manufacturer,
                        Model = e.Model,
                        PurchaseDate = e.PurchaseDate,
                        WarrantyExpiration = e.WarrantyExpiration,
                        LastMaintenanceDate = e.LastMaintenanceDate,
                        NextMaintenanceDate = e.NextMaintenanceDate,
                        MaintenanceIntervalDays = e.MaintenanceIntervalDays,
                        MaintenanceNotes = e.MaintenanceNotes,
                        Location = e.Location,
                        Created = e.Created,
                        CreatedBy = e.CreatedBy,
                        Updated = e.Updated,
                        UpdatedBy = e.UpdatedBy
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = equipment });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/equipment/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetEquipmentById(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.current_tenant_id = '{tenantId.Value}'");

                var equipment = await _context.Equipment
                    .Include(e => e.EquipmentType)
                    .Where(e => e.EquipmentId == id && e.TenantId == tenantId.Value)
                    .Select(e => new EquipmentResponse
                    {
                        EquipmentId = e.EquipmentId,
                        TenantId = e.TenantId,
                        BreweryId = e.BreweryId,
                        EquipmentTypeId = e.EquipmentTypeId,
                        EquipmentTypeName = e.EquipmentType != null ? e.EquipmentType.Name : null,
                        Name = e.Name,
                        Description = e.Description,
                        Status = e.Status,
                        Capacity = e.Capacity,
                        CapacityUnit = e.CapacityUnit,
                        WorkingCapacity = e.WorkingCapacity,
                        SerialNumber = e.SerialNumber,
                        Manufacturer = e.Manufacturer,
                        Model = e.Model,
                        PurchaseDate = e.PurchaseDate,
                        WarrantyExpiration = e.WarrantyExpiration,
                        LastMaintenanceDate = e.LastMaintenanceDate,
                        NextMaintenanceDate = e.NextMaintenanceDate,
                        MaintenanceIntervalDays = e.MaintenanceIntervalDays,
                        MaintenanceNotes = e.MaintenanceNotes,
                        Location = e.Location,
                        Created = e.Created,
                        CreatedBy = e.CreatedBy,
                        Updated = e.Updated,
                        UpdatedBy = e.UpdatedBy
                    })
                    .FirstOrDefaultAsync();

                if (equipment == null)
                {
                    return NotFound(new { success = false, message = "Equipment not found" });
                }

                return Ok(new { success = true, data = equipment });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment {EquipmentId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/equipment/available
        [HttpGet("available")]
        public async Task<ActionResult> GetAvailableEquipment([FromQuery] Guid? equipmentTypeId = null, [FromQuery] DateTime? startTime = null, [FromQuery] DateTime? endTime = null)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.current_tenant_id = '{tenantId.Value}'");

                var query = _context.Equipment
                    .Include(e => e.EquipmentType)
                    .Where(e => e.TenantId == tenantId.Value && e.Status == "Available");

                if (equipmentTypeId.HasValue)
                {
                    query = query.Where(e => e.EquipmentTypeId == equipmentTypeId.Value);
                }

                // If time range provided, check for scheduling conflicts
                if (startTime.HasValue && endTime.HasValue)
                {
                    var scheduledEquipmentIds = await _context.EquipmentSchedules
                        .Where(es => ((es.StartDateTime <= endTime.Value && es.EndDateTime >= startTime.Value)))
                        .Select(es => es.EquipmentId)
                        .ToListAsync();

                    query = query.Where(e => !scheduledEquipmentIds.Contains(e.EquipmentId));
                }

                var equipment = await query
                    .OrderBy(e => e.Name)
                    .Select(e => new EquipmentResponse
                    {
                        EquipmentId = e.EquipmentId,
                        TenantId = e.TenantId,
                        BreweryId = e.BreweryId,
                        EquipmentTypeId = e.EquipmentTypeId,
                        EquipmentTypeName = e.EquipmentType != null ? e.EquipmentType.Name : null,
                        Name = e.Name,
                        Description = e.Description,
                        Status = e.Status,
                        Capacity = e.Capacity,
                        CapacityUnit = e.CapacityUnit,
                        WorkingCapacity = e.WorkingCapacity,
                        SerialNumber = e.SerialNumber,
                        Manufacturer = e.Manufacturer,
                        Model = e.Model,
                        Location = e.Location
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = equipment });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available equipment");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/equipment
        [HttpPost]
        public async Task<ActionResult> CreateEquipment([FromBody] EquipmentRequest request)
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

                await _context.Database.ExecuteSqlRawAsync($"SET app.current_tenant_id = '{tenantId.Value}'");

                var equipment = new Equipment
                {
                    EquipmentId = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    BreweryId = request.BreweryId,
                    EquipmentTypeId = request.EquipmentTypeId,
                    Name = request.Name,
                    Description = request.Description,
                    Status = request.Status ?? "Available",
                    Capacity = request.Capacity,
                    CapacityUnit = request.CapacityUnit ?? "gallons",
                    WorkingCapacity = request.WorkingCapacity,
                    SerialNumber = request.SerialNumber,
                    Manufacturer = request.Manufacturer,
                    Model = request.Model,
                    PurchaseDate = request.PurchaseDate,
                    WarrantyExpiration = request.WarrantyExpiration,
                    LastMaintenanceDate = request.LastMaintenanceDate,
                    NextMaintenanceDate = request.NextMaintenanceDate,
                    MaintenanceIntervalDays = request.MaintenanceIntervalDays,
                    MaintenanceNotes = request.MaintenanceNotes,
                    Location = request.Location,
                    Created = DateTime.UtcNow,
                    CreatedBy = currentUserId.Value,
                    Updated = DateTime.UtcNow,
                    UpdatedBy = currentUserId.Value
                };

                _context.Equipment.Add(equipment);
                await _context.SaveChangesAsync();

                var equipmentType = await _context.EquipmentTypes
                    .FirstOrDefaultAsync(et => et.EquipmentTypeId == equipment.EquipmentTypeId);

                var response = new EquipmentResponse
                {
                    EquipmentId = equipment.EquipmentId,
                    TenantId = equipment.TenantId,
                    BreweryId = equipment.BreweryId,
                    EquipmentTypeId = equipment.EquipmentTypeId,
                    EquipmentTypeName = equipmentType?.Name,
                    Name = equipment.Name,
                    Description = equipment.Description,
                    Status = equipment.Status,
                    Capacity = equipment.Capacity,
                    CapacityUnit = equipment.CapacityUnit,
                    WorkingCapacity = equipment.WorkingCapacity,
                    SerialNumber = equipment.SerialNumber,
                    Manufacturer = equipment.Manufacturer,
                    Model = equipment.Model,
                    PurchaseDate = equipment.PurchaseDate,
                    WarrantyExpiration = equipment.WarrantyExpiration,
                    LastMaintenanceDate = equipment.LastMaintenanceDate,
                    NextMaintenanceDate = equipment.NextMaintenanceDate,
                    MaintenanceIntervalDays = equipment.MaintenanceIntervalDays,
                    MaintenanceNotes = equipment.MaintenanceNotes,
                    Location = equipment.Location,
                    Created = equipment.Created,
                    CreatedBy = equipment.CreatedBy,
                    Updated = equipment.Updated,
                    UpdatedBy = equipment.UpdatedBy
                };

                return CreatedAtAction(nameof(GetEquipmentById), new { id = equipment.EquipmentId },
                    new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating equipment");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/equipment/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateEquipment(Guid id, [FromBody] EquipmentRequest request)
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

                await _context.Database.ExecuteSqlRawAsync($"SET app.current_tenant_id = '{tenantId.Value}'");

                var equipment = await _context.Equipment
                    .FirstOrDefaultAsync(e => e.EquipmentId == id && e.TenantId == tenantId.Value);

                if (equipment == null)
                {
                    return NotFound(new { success = false, message = "Equipment not found" });
                }

                equipment.EquipmentTypeId = request.EquipmentTypeId;
                equipment.BreweryId = request.BreweryId;
                equipment.Name = request.Name;
                equipment.Description = request.Description;
                equipment.Status = request.Status ?? equipment.Status;
                equipment.Capacity = request.Capacity;
                equipment.CapacityUnit = request.CapacityUnit ?? equipment.CapacityUnit;
                equipment.WorkingCapacity = request.WorkingCapacity;
                equipment.SerialNumber = request.SerialNumber;
                equipment.Manufacturer = request.Manufacturer;
                equipment.Model = request.Model;
                equipment.PurchaseDate = request.PurchaseDate;
                equipment.WarrantyExpiration = request.WarrantyExpiration;
                equipment.LastMaintenanceDate = request.LastMaintenanceDate;
                equipment.NextMaintenanceDate = request.NextMaintenanceDate;
                equipment.MaintenanceIntervalDays = request.MaintenanceIntervalDays;
                equipment.MaintenanceNotes = request.MaintenanceNotes;
                equipment.Location = request.Location;
                equipment.Updated = DateTime.UtcNow;
                equipment.UpdatedBy = currentUserId.Value;

                await _context.SaveChangesAsync();

                var equipmentType = await _context.EquipmentTypes
                    .FirstOrDefaultAsync(et => et.EquipmentTypeId == equipment.EquipmentTypeId);

                var response = new EquipmentResponse
                {
                    EquipmentId = equipment.EquipmentId,
                    TenantId = equipment.TenantId,
                    BreweryId = equipment.BreweryId,
                    EquipmentTypeId = equipment.EquipmentTypeId,
                    EquipmentTypeName = equipmentType?.Name,
                    Name = equipment.Name,
                    Description = equipment.Description,
                    Status = equipment.Status,
                    Capacity = equipment.Capacity,
                    CapacityUnit = equipment.CapacityUnit,
                    WorkingCapacity = equipment.WorkingCapacity,
                    SerialNumber = equipment.SerialNumber,
                    Manufacturer = equipment.Manufacturer,
                    Model = equipment.Model,
                    PurchaseDate = equipment.PurchaseDate,
                    WarrantyExpiration = equipment.WarrantyExpiration,
                    LastMaintenanceDate = equipment.LastMaintenanceDate,
                    NextMaintenanceDate = equipment.NextMaintenanceDate,
                    MaintenanceIntervalDays = equipment.MaintenanceIntervalDays,
                    MaintenanceNotes = equipment.MaintenanceNotes,
                    Location = equipment.Location,
                    Created = equipment.Created,
                    CreatedBy = equipment.CreatedBy,
                    Updated = equipment.Updated,
                    UpdatedBy = equipment.UpdatedBy
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating equipment {EquipmentId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PATCH: api/equipment/{id}/status
        [HttpPatch("{id}/status")]
        public async Task<ActionResult> UpdateEquipmentStatus(Guid id, [FromBody] EquipmentStatusRequest request)
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

                await _context.Database.ExecuteSqlRawAsync($"SET app.current_tenant_id = '{tenantId.Value}'");

                var equipment = await _context.Equipment
                    .FirstOrDefaultAsync(e => e.EquipmentId == id && e.TenantId == tenantId.Value);

                if (equipment == null)
                {
                    return NotFound(new { success = false, message = "Equipment not found" });
                }

                equipment.Status = request.Status;
                equipment.Updated = DateTime.UtcNow;
                equipment.UpdatedBy = currentUserId.Value;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Equipment status updated successfully", status = equipment.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating equipment status {EquipmentId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // DELETE: api/equipment/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEquipment(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.current_tenant_id = '{tenantId.Value}'");

                var equipment = await _context.Equipment
                    .FirstOrDefaultAsync(e => e.EquipmentId == id && e.TenantId == tenantId.Value);

                if (equipment == null)
                {
                    return NotFound(new { success = false, message = "Equipment not found" });
                }

                _context.Equipment.Remove(equipment);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Equipment deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting equipment {EquipmentId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }

    // DTOs
    public class EquipmentRequest
    {
        [JsonPropertyName("breweryId")]
        public Guid? BreweryId { get; set; }

        [JsonPropertyName("equipmentTypeId")]
        public Guid EquipmentTypeId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("capacity")]
        public decimal? Capacity { get; set; }

        [JsonPropertyName("capacityUnit")]
        public string? CapacityUnit { get; set; }

        [JsonPropertyName("workingCapacity")]
        public decimal? WorkingCapacity { get; set; }

        [JsonPropertyName("serialNumber")]
        public string? SerialNumber { get; set; }

        [JsonPropertyName("manufacturer")]
        public string? Manufacturer { get; set; }

        [JsonPropertyName("model")]
        public string? Model { get; set; }

        [JsonPropertyName("purchaseDate")]
        public DateTime? PurchaseDate { get; set; }

        [JsonPropertyName("warrantyExpiration")]
        public DateTime? WarrantyExpiration { get; set; }

        [JsonPropertyName("lastMaintenanceDate")]
        public DateTime? LastMaintenanceDate { get; set; }

        [JsonPropertyName("nextMaintenanceDate")]
        public DateTime? NextMaintenanceDate { get; set; }

        [JsonPropertyName("maintenanceIntervalDays")]
        public int? MaintenanceIntervalDays { get; set; }

        [JsonPropertyName("maintenanceNotes")]
        public string? MaintenanceNotes { get; set; }

        [JsonPropertyName("location")]
        public string? Location { get; set; }
    }

    public class EquipmentStatusRequest
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }

    public class EquipmentResponse
    {
        [JsonPropertyName("equipmentId")]
        public Guid EquipmentId { get; set; }

        [JsonPropertyName("tenantId")]
        public Guid TenantId { get; set; }

        [JsonPropertyName("breweryId")]
        public Guid? BreweryId { get; set; }

        [JsonPropertyName("equipmentTypeId")]
        public Guid EquipmentTypeId { get; set; }

        [JsonPropertyName("equipmentTypeName")]
        public string? EquipmentTypeName { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("capacity")]
        public decimal? Capacity { get; set; }

        [JsonPropertyName("capacityUnit")]
        public string? CapacityUnit { get; set; }

        [JsonPropertyName("workingCapacity")]
        public decimal? WorkingCapacity { get; set; }

        [JsonPropertyName("serialNumber")]
        public string? SerialNumber { get; set; }

        [JsonPropertyName("manufacturer")]
        public string? Manufacturer { get; set; }

        [JsonPropertyName("model")]
        public string? Model { get; set; }

        [JsonPropertyName("purchaseDate")]
        public DateTime? PurchaseDate { get; set; }

        [JsonPropertyName("warrantyExpiration")]
        public DateTime? WarrantyExpiration { get; set; }

        [JsonPropertyName("lastMaintenanceDate")]
        public DateTime? LastMaintenanceDate { get; set; }

        [JsonPropertyName("nextMaintenanceDate")]
        public DateTime? NextMaintenanceDate { get; set; }

        [JsonPropertyName("maintenanceIntervalDays")]
        public int? MaintenanceIntervalDays { get; set; }

        [JsonPropertyName("maintenanceNotes")]
        public string? MaintenanceNotes { get; set; }

        [JsonPropertyName("location")]
        public string? Location { get; set; }

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
