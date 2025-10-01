using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using FermentumApi.Models.Inventory;
using System.Security.Claims;

namespace FermentumApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LotAlertController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<LotAlertController> _logger;

        public LotAlertController(AuthDbContext context, ILogger<LotAlertController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }

        private async Task<Guid?> GetCurrentTenantIdAsync()
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty) return null;

            var userTenant = await _context.UserTenants
                .Where(ut => ut.UserId == userId && ut.IsActive)
                .OrderByDescending(ut => ut.Created)
                .FirstOrDefaultAsync();

            return userTenant?.TenantId;
        }

        /// <summary>
        /// Get all lot alerts for the current tenant
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<LotAlertDto>>>> GetLotAlerts(
            [FromQuery] int? skip = null,
            [FromQuery] int? take = null,
            [FromQuery] LotAlertStatus? status = null,
            [FromQuery] LotAlertSeverity? severity = null,
            [FromQuery] string? lotNumber = null)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<List<LotAlertDto>>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var query = _context.LotAlerts
                    .Include(la => la.StockInventory)
                        .ThenInclude(si => si!.Stock)
                    .Include(la => la.Documents)
                    .Where(la => la.StockInventory!.Stock!.TenantId == tenantId.Value);

                // Apply filters
                if (status.HasValue)
                {
                    query = query.Where(la => la.Status == status.Value);
                }

                if (severity.HasValue)
                {
                    query = query.Where(la => la.Severity == severity.Value);
                }

                if (!string.IsNullOrEmpty(lotNumber))
                {
                    query = query.Where(la => la.LotNumber.Contains(lotNumber));
                }

                // Order by most recent first
                query = query.OrderByDescending(la => la.AlertDate);

                // Apply pagination
                if (skip.HasValue)
                {
                    query = query.Skip(skip.Value);
                }

                if (take.HasValue)
                {
                    query = query.Take(take.Value);
                }

                var alerts = await query.ToListAsync();

                var alertDtos = alerts.Select(la => new LotAlertDto
                {
                    LotAlertId = la.LotAlertId,
                    StockInventoryId = la.StockInventoryId,
                    LotNumber = la.LotNumber,
                    AlertType = la.AlertType,
                    Severity = la.Severity,
                    Status = la.Status,
                    Title = la.Title,
                    Description = la.Description,
                    SupplierName = la.SupplierName,
                    SupplierReference = la.SupplierReference,
                    AffectedBatches = la.AffectedBatches,
                    RecommendedAction = la.RecommendedAction,
                    AlertDate = la.AlertDate,
                    ExpirationDate = la.ExpirationDate,
                    AcknowledgedBy = la.AcknowledgedBy,
                    AcknowledgedDate = la.AcknowledgedDate,
                    ResolvedBy = la.ResolvedBy,
                    ResolvedDate = la.ResolvedDate,
                    ResolutionNotes = la.ResolutionNotes,
                    SourceUrl = la.SourceUrl,
                    InternalNotes = la.InternalNotes,
                    Created = la.Created,
                    Updated = la.Updated,
                    Documents = la.Documents?.Select(d => new LotAlertDocumentDto
                    {
                        LotAlertDocumentId = d.LotAlertDocumentId,
                        LotAlertId = d.LotAlertId,
                        DocumentType = d.DocumentType,
                        FileName = d.FileName,
                        FileUrl = d.FileUrl,
                        FileSize = d.FileSize,
                        MimeType = d.MimeType,
                        Description = d.Description,
                        UploadedBy = d.UploadedBy,
                        UploadedDate = d.UploadedDate
                    }).ToList()
                }).ToList();

                return Ok(new ApiResponse<List<LotAlertDto>>
                {
                    Success = true,
                    Message = $"Retrieved {alertDtos.Count} lot alerts",
                    Data = alertDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving lot alerts");
                return StatusCode(500, new ApiResponse<List<LotAlertDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving lot alerts",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Get lot alerts for a specific stock inventory ID or lot number
        /// </summary>
        [HttpGet("by-lot/{lotNumber}")]
        public async Task<ActionResult<ApiResponse<List<LotAlertSummaryDto>>>> GetLotAlertsByLotNumber(string lotNumber)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<List<LotAlertSummaryDto>>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var alerts = await _context.LotAlerts
                    .Include(la => la.StockInventory)
                        .ThenInclude(si => si!.Stock)
                    .Where(la => la.LotNumber == lotNumber &&
                                 la.StockInventory!.Stock!.TenantId == tenantId.Value &&
                                 la.Status == LotAlertStatus.Active)
                    .OrderByDescending(la => la.AlertDate)
                    .ToListAsync();

                var summaries = alerts.Select(la => new LotAlertSummaryDto
                {
                    LotAlertId = la.LotAlertId,
                    LotNumber = la.LotNumber,
                    AlertType = la.AlertType,
                    Severity = la.Severity,
                    Status = la.Status,
                    Title = la.Title,
                    AlertDate = la.AlertDate
                }).ToList();

                return Ok(new ApiResponse<List<LotAlertSummaryDto>>
                {
                    Success = true,
                    Message = $"Found {summaries.Count} active alert(s) for lot {lotNumber}",
                    Data = summaries
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving lot alerts for lot number {LotNumber}", lotNumber);
                return StatusCode(500, new ApiResponse<List<LotAlertSummaryDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving lot alerts",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Get a specific lot alert by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<LotAlertDto>>> GetLotAlert(Guid id)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var alert = await _context.LotAlerts
                    .Include(la => la.StockInventory)
                        .ThenInclude(si => si!.Stock)
                    .Include(la => la.Documents)
                    .FirstOrDefaultAsync(la => la.LotAlertId == id &&
                                              la.StockInventory!.Stock!.TenantId == tenantId.Value);

                if (alert == null)
                {
                    return NotFound(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "Lot alert not found",
                        Data = null
                    });
                }

                var alertDto = new LotAlertDto
                {
                    LotAlertId = alert.LotAlertId,
                    StockInventoryId = alert.StockInventoryId,
                    LotNumber = alert.LotNumber,
                    AlertType = alert.AlertType,
                    Severity = alert.Severity,
                    Status = alert.Status,
                    Title = alert.Title,
                    Description = alert.Description,
                    SupplierName = alert.SupplierName,
                    SupplierReference = alert.SupplierReference,
                    AffectedBatches = alert.AffectedBatches,
                    RecommendedAction = alert.RecommendedAction,
                    AlertDate = alert.AlertDate,
                    ExpirationDate = alert.ExpirationDate,
                    AcknowledgedBy = alert.AcknowledgedBy,
                    AcknowledgedDate = alert.AcknowledgedDate,
                    ResolvedBy = alert.ResolvedBy,
                    ResolvedDate = alert.ResolvedDate,
                    ResolutionNotes = alert.ResolutionNotes,
                    SourceUrl = alert.SourceUrl,
                    InternalNotes = alert.InternalNotes,
                    Created = alert.Created,
                    Updated = alert.Updated,
                    Documents = alert.Documents?.Select(d => new LotAlertDocumentDto
                    {
                        LotAlertDocumentId = d.LotAlertDocumentId,
                        LotAlertId = d.LotAlertId,
                        DocumentType = d.DocumentType,
                        FileName = d.FileName,
                        FileUrl = d.FileUrl,
                        FileSize = d.FileSize,
                        MimeType = d.MimeType,
                        Description = d.Description,
                        UploadedBy = d.UploadedBy,
                        UploadedDate = d.UploadedDate
                    }).ToList()
                };

                return Ok(new ApiResponse<LotAlertDto>
                {
                    Success = true,
                    Message = "Lot alert retrieved successfully",
                    Data = alertDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving lot alert {AlertId}", id);
                return StatusCode(500, new ApiResponse<LotAlertDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving the lot alert",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Create a new lot alert
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<LotAlertDto>>> CreateLotAlert([FromBody] CreateLotAlertDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "User not authenticated",
                        Data = null
                    });
                }

                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                // Verify stock inventory belongs to tenant
                var stockInventory = await _context.StockInventories
                    .Include(si => si.Stock)
                    .FirstOrDefaultAsync(si => si.StockInventoryId == dto.StockInventoryId &&
                                              si.Stock!.TenantId == tenantId.Value);

                if (stockInventory == null)
                {
                    return BadRequest(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "Stock inventory not found or access denied",
                        Data = null
                    });
                }

                var alert = new LotAlert
                {
                    StockInventoryId = dto.StockInventoryId,
                    LotNumber = dto.LotNumber,
                    AlertType = dto.AlertType,
                    Severity = dto.Severity,
                    Status = LotAlertStatus.Active,
                    Title = dto.Title,
                    Description = dto.Description,
                    SupplierName = dto.SupplierName,
                    SupplierReference = dto.SupplierReference,
                    AffectedBatches = dto.AffectedBatches,
                    RecommendedAction = dto.RecommendedAction,
                    AlertDate = dto.AlertDate ?? DateTime.UtcNow,
                    ExpirationDate = dto.ExpirationDate,
                    SourceUrl = dto.SourceUrl,
                    InternalNotes = dto.InternalNotes,
                    CreatedBy = userId,
                    UpdatedBy = userId
                };

                _context.LotAlerts.Add(alert);
                await _context.SaveChangesAsync();

                var alertDto = new LotAlertDto
                {
                    LotAlertId = alert.LotAlertId,
                    StockInventoryId = alert.StockInventoryId,
                    LotNumber = alert.LotNumber,
                    AlertType = alert.AlertType,
                    Severity = alert.Severity,
                    Status = alert.Status,
                    Title = alert.Title,
                    Description = alert.Description,
                    SupplierName = alert.SupplierName,
                    SupplierReference = alert.SupplierReference,
                    AffectedBatches = alert.AffectedBatches,
                    RecommendedAction = alert.RecommendedAction,
                    AlertDate = alert.AlertDate,
                    ExpirationDate = alert.ExpirationDate,
                    SourceUrl = alert.SourceUrl,
                    InternalNotes = alert.InternalNotes,
                    Created = alert.Created,
                    Updated = alert.Updated
                };

                return CreatedAtAction(nameof(GetLotAlert), new { id = alert.LotAlertId }, new ApiResponse<LotAlertDto>
                {
                    Success = true,
                    Message = "Lot alert created successfully",
                    Data = alertDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating lot alert");
                return StatusCode(500, new ApiResponse<LotAlertDto>
                {
                    Success = false,
                    Message = "An error occurred while creating the lot alert",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Update an existing lot alert
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<LotAlertDto>>> UpdateLotAlert(Guid id, [FromBody] UpdateLotAlertDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "User not authenticated",
                        Data = null
                    });
                }

                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var alert = await _context.LotAlerts
                    .Include(la => la.StockInventory)
                        .ThenInclude(si => si!.Stock)
                    .FirstOrDefaultAsync(la => la.LotAlertId == id &&
                                              la.StockInventory!.Stock!.TenantId == tenantId.Value);

                if (alert == null)
                {
                    return NotFound(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "Lot alert not found",
                        Data = null
                    });
                }

                // Update properties
                if (dto.Status.HasValue) alert.Status = dto.Status.Value;
                if (!string.IsNullOrEmpty(dto.Title)) alert.Title = dto.Title;
                if (!string.IsNullOrEmpty(dto.Description)) alert.Description = dto.Description;
                if (dto.RecommendedAction != null) alert.RecommendedAction = dto.RecommendedAction;
                if (dto.ExpirationDate.HasValue) alert.ExpirationDate = dto.ExpirationDate.Value;
                if (dto.ResolutionNotes != null) alert.ResolutionNotes = dto.ResolutionNotes;
                if (dto.InternalNotes != null) alert.InternalNotes = dto.InternalNotes;

                alert.UpdatedBy = userId;
                alert.Updated = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var alertDto = new LotAlertDto
                {
                    LotAlertId = alert.LotAlertId,
                    StockInventoryId = alert.StockInventoryId,
                    LotNumber = alert.LotNumber,
                    AlertType = alert.AlertType,
                    Severity = alert.Severity,
                    Status = alert.Status,
                    Title = alert.Title,
                    Description = alert.Description,
                    SupplierName = alert.SupplierName,
                    SupplierReference = alert.SupplierReference,
                    RecommendedAction = alert.RecommendedAction,
                    AlertDate = alert.AlertDate,
                    ExpirationDate = alert.ExpirationDate,
                    ResolutionNotes = alert.ResolutionNotes,
                    SourceUrl = alert.SourceUrl,
                    InternalNotes = alert.InternalNotes,
                    Created = alert.Created,
                    Updated = alert.Updated
                };

                return Ok(new ApiResponse<LotAlertDto>
                {
                    Success = true,
                    Message = "Lot alert updated successfully",
                    Data = alertDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating lot alert {AlertId}", id);
                return StatusCode(500, new ApiResponse<LotAlertDto>
                {
                    Success = false,
                    Message = "An error occurred while updating the lot alert",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Acknowledge a lot alert
        /// </summary>
        [HttpPost("{id}/acknowledge")]
        public async Task<ActionResult<ApiResponse<LotAlertDto>>> AcknowledgeLotAlert(Guid id, [FromBody] AcknowledgeLotAlertDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "User not authenticated",
                        Data = null
                    });
                }

                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var alert = await _context.LotAlerts
                    .Include(la => la.StockInventory)
                        .ThenInclude(si => si!.Stock)
                    .FirstOrDefaultAsync(la => la.LotAlertId == id &&
                                              la.StockInventory!.Stock!.TenantId == tenantId.Value);

                if (alert == null)
                {
                    return NotFound(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "Lot alert not found",
                        Data = null
                    });
                }

                alert.Status = LotAlertStatus.Acknowledged;
                alert.AcknowledgedBy = userId;
                alert.AcknowledgedDate = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(dto.Notes))
                {
                    alert.InternalNotes = (alert.InternalNotes ?? "") + $"\n[Acknowledged] {dto.Notes}";
                }
                alert.UpdatedBy = userId;
                alert.Updated = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var alertDto = new LotAlertDto
                {
                    LotAlertId = alert.LotAlertId,
                    StockInventoryId = alert.StockInventoryId,
                    LotNumber = alert.LotNumber,
                    AlertType = alert.AlertType,
                    Severity = alert.Severity,
                    Status = alert.Status,
                    Title = alert.Title,
                    Description = alert.Description,
                    AcknowledgedBy = alert.AcknowledgedBy,
                    AcknowledgedDate = alert.AcknowledgedDate,
                    Created = alert.Created,
                    Updated = alert.Updated
                };

                return Ok(new ApiResponse<LotAlertDto>
                {
                    Success = true,
                    Message = "Lot alert acknowledged successfully",
                    Data = alertDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging lot alert {AlertId}", id);
                return StatusCode(500, new ApiResponse<LotAlertDto>
                {
                    Success = false,
                    Message = "An error occurred while acknowledging the lot alert",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Resolve a lot alert
        /// </summary>
        [HttpPost("{id}/resolve")]
        public async Task<ActionResult<ApiResponse<LotAlertDto>>> ResolveLotAlert(Guid id, [FromBody] ResolveLotAlertDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "User not authenticated",
                        Data = null
                    });
                }

                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var alert = await _context.LotAlerts
                    .Include(la => la.StockInventory)
                        .ThenInclude(si => si!.Stock)
                    .FirstOrDefaultAsync(la => la.LotAlertId == id &&
                                              la.StockInventory!.Stock!.TenantId == tenantId.Value);

                if (alert == null)
                {
                    return NotFound(new ApiResponse<LotAlertDto>
                    {
                        Success = false,
                        Message = "Lot alert not found",
                        Data = null
                    });
                }

                alert.Status = LotAlertStatus.Resolved;
                alert.ResolvedBy = userId;
                alert.ResolvedDate = DateTime.UtcNow;
                alert.ResolutionNotes = dto.ResolutionNotes;
                alert.UpdatedBy = userId;
                alert.Updated = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var alertDto = new LotAlertDto
                {
                    LotAlertId = alert.LotAlertId,
                    StockInventoryId = alert.StockInventoryId,
                    LotNumber = alert.LotNumber,
                    AlertType = alert.AlertType,
                    Severity = alert.Severity,
                    Status = alert.Status,
                    Title = alert.Title,
                    Description = alert.Description,
                    ResolvedBy = alert.ResolvedBy,
                    ResolvedDate = alert.ResolvedDate,
                    ResolutionNotes = alert.ResolutionNotes,
                    Created = alert.Created,
                    Updated = alert.Updated
                };

                return Ok(new ApiResponse<LotAlertDto>
                {
                    Success = true,
                    Message = "Lot alert resolved successfully",
                    Data = alertDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resolving lot alert {AlertId}", id);
                return StatusCode(500, new ApiResponse<LotAlertDto>
                {
                    Success = false,
                    Message = "An error occurred while resolving the lot alert",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Delete a lot alert
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteLotAlert(Guid id)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var alert = await _context.LotAlerts
                    .Include(la => la.StockInventory)
                        .ThenInclude(si => si!.Stock)
                    .FirstOrDefaultAsync(la => la.LotAlertId == id &&
                                              la.StockInventory!.Stock!.TenantId == tenantId.Value);

                if (alert == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Lot alert not found",
                        Data = null
                    });
                }

                _context.LotAlerts.Remove(alert);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lot alert deleted successfully",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting lot alert {AlertId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "An error occurred while deleting the lot alert",
                    Data = null
                });
            }
        }
    }
}
