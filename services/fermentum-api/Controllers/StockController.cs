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
    public class StockController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<StockController> _logger;

        public StockController(AuthDbContext context, ILogger<StockController> logger)
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
        /// Get all stock items for the current tenant
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<StockDto>>>> GetStock(
            [FromQuery] int? skip = null,
            [FromQuery] int? take = null,
            [FromQuery] string? category = null,
            [FromQuery] bool? isActive = true,
            [FromQuery] string? search = null)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<List<StockDto>>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var query = _context.Stocks
                    .Include(s => s.Inventory)
                    .Where(s => s.TenantId == tenantId.Value);

                // Apply filters
                if (isActive.HasValue)
                {
                    query = query.Where(s => s.IsActive == isActive.Value);
                }

                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(s => s.Category == category);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower();
                    query = query.Where(s =>
                        s.Name.ToLower().Contains(searchLower) ||
                        s.SKU.ToLower().Contains(searchLower) ||
                        (s.Supplier != null && s.Supplier.ToLower().Contains(searchLower)));
                }

                // Apply pagination
                if (skip.HasValue)
                {
                    query = query.Skip(skip.Value);
                }

                if (take.HasValue)
                {
                    query = query.Take(take.Value);
                }

                var stocks = await query
                    .OrderBy(s => s.Name)
                    .ToListAsync();

                var stockDtos = stocks.Select(s => new StockDto
                {
                    StockId = s.StockId,
                    TenantId = s.TenantId,
                    SKU = s.SKU,
                    Name = s.Name,
                    Description = s.Description,
                    Category = s.Category,
                    Subcategory = s.Subcategory,
                    Supplier = s.Supplier,
                    SupplierSKU = s.SupplierSKU,
                    UnitOfMeasure = s.UnitOfMeasure,
                    UnitCost = s.UnitCost,
                    Currency = s.Currency,
                    ReorderLevel = s.ReorderLevel,
                    ReorderQuantity = s.ReorderQuantity,
                    LeadTimeDays = s.LeadTimeDays,
                    StorageLocation = s.StorageLocation,
                    StorageRequirements = s.StorageRequirements,
                    ShelfLifeDays = s.ShelfLifeDays,
                    IsActive = s.IsActive,
                    Notes = s.Notes,
                    Created = s.Created,
                    Updated = s.Updated,
                    TotalQuantityOnHand = s.TotalQuantityOnHand,
                    TotalQuantityReserved = s.TotalQuantityReserved,
                    TotalQuantityAvailable = s.TotalQuantityAvailable
                }).ToList();

                return Ok(new ApiResponse<List<StockDto>>
                {
                    Success = true,
                    Message = "Stock items retrieved successfully",
                    Data = stockDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving stock items");
                return StatusCode(500, new ApiResponse<List<StockDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving stock items",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Get a specific stock item by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<StockDto>>> GetStockById(Guid id)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<StockDto>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var stock = await _context.Stocks
                    .Include(s => s.Inventory)
                    .FirstOrDefaultAsync(s => s.StockId == id && s.TenantId == tenantId.Value);

                if (stock == null)
                {
                    return NotFound(new ApiResponse<StockDto>
                    {
                        Success = false,
                        Message = "Stock item not found",
                        Data = null
                    });
                }

                var stockDto = new StockDto
                {
                    StockId = stock.StockId,
                    TenantId = stock.TenantId,
                    SKU = stock.SKU,
                    Name = stock.Name,
                    Description = stock.Description,
                    Category = stock.Category,
                    Subcategory = stock.Subcategory,
                    Supplier = stock.Supplier,
                    SupplierSKU = stock.SupplierSKU,
                    UnitOfMeasure = stock.UnitOfMeasure,
                    UnitCost = stock.UnitCost,
                    Currency = stock.Currency,
                    ReorderLevel = stock.ReorderLevel,
                    ReorderQuantity = stock.ReorderQuantity,
                    LeadTimeDays = stock.LeadTimeDays,
                    StorageLocation = stock.StorageLocation,
                    StorageRequirements = stock.StorageRequirements,
                    ShelfLifeDays = stock.ShelfLifeDays,
                    IsActive = stock.IsActive,
                    Notes = stock.Notes,
                    Created = stock.Created,
                    Updated = stock.Updated,
                    TotalQuantityOnHand = stock.TotalQuantityOnHand,
                    TotalQuantityReserved = stock.TotalQuantityReserved,
                    TotalQuantityAvailable = stock.TotalQuantityAvailable
                };

                return Ok(new ApiResponse<StockDto>
                {
                    Success = true,
                    Message = "Stock item retrieved successfully",
                    Data = stockDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving stock item {StockId}", id);
                return StatusCode(500, new ApiResponse<StockDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving the stock item",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Create a new stock item
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<StockDto>>> CreateStock([FromBody] CreateStockDto createDto)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<StockDto>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var userId = GetCurrentUserId();

                // Check for duplicate SKU within tenant
                var existingSKU = await _context.Stocks
                    .AnyAsync(s => s.TenantId == tenantId.Value && s.SKU == createDto.SKU);

                if (existingSKU)
                {
                    return BadRequest(new ApiResponse<StockDto>
                    {
                        Success = false,
                        Message = $"A stock item with SKU '{createDto.SKU}' already exists",
                        Data = null
                    });
                }

                var stock = new Stock
                {
                    TenantId = tenantId.Value,
                    SKU = createDto.SKU,
                    Name = createDto.Name,
                    Description = createDto.Description,
                    Category = createDto.Category,
                    Subcategory = createDto.Subcategory,
                    Supplier = createDto.Supplier,
                    SupplierSKU = createDto.SupplierSKU,
                    UnitOfMeasure = createDto.UnitOfMeasure,
                    UnitCost = createDto.UnitCost,
                    Currency = createDto.Currency,
                    ReorderLevel = createDto.ReorderLevel,
                    ReorderQuantity = createDto.ReorderQuantity,
                    LeadTimeDays = createDto.LeadTimeDays,
                    StorageLocation = createDto.StorageLocation,
                    StorageRequirements = createDto.StorageRequirements,
                    ShelfLifeDays = createDto.ShelfLifeDays,
                    IsActive = createDto.IsActive,
                    Notes = createDto.Notes,
                    CreatedBy = userId,
                    UpdatedBy = userId
                };

                _context.Stocks.Add(stock);
                await _context.SaveChangesAsync();

                var stockDto = new StockDto
                {
                    StockId = stock.StockId,
                    TenantId = stock.TenantId,
                    SKU = stock.SKU,
                    Name = stock.Name,
                    Description = stock.Description,
                    Category = stock.Category,
                    Subcategory = stock.Subcategory,
                    Supplier = stock.Supplier,
                    SupplierSKU = stock.SupplierSKU,
                    UnitOfMeasure = stock.UnitOfMeasure,
                    UnitCost = stock.UnitCost,
                    Currency = stock.Currency,
                    ReorderLevel = stock.ReorderLevel,
                    ReorderQuantity = stock.ReorderQuantity,
                    LeadTimeDays = stock.LeadTimeDays,
                    StorageLocation = stock.StorageLocation,
                    StorageRequirements = stock.StorageRequirements,
                    ShelfLifeDays = stock.ShelfLifeDays,
                    IsActive = stock.IsActive,
                    Notes = stock.Notes,
                    Created = stock.Created,
                    Updated = stock.Updated,
                    TotalQuantityOnHand = 0,
                    TotalQuantityReserved = 0,
                    TotalQuantityAvailable = 0
                };

                return CreatedAtAction(nameof(GetStockById), new { id = stock.StockId }, new ApiResponse<StockDto>
                {
                    Success = true,
                    Message = "Stock item created successfully",
                    Data = stockDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating stock item");
                return StatusCode(500, new ApiResponse<StockDto>
                {
                    Success = false,
                    Message = "An error occurred while creating the stock item",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Update an existing stock item
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<StockDto>>> UpdateStock(Guid id, [FromBody] UpdateStockDto updateDto)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<StockDto>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                var stock = await _context.Stocks
                    .Include(s => s.Inventory)
                    .FirstOrDefaultAsync(s => s.StockId == id && s.TenantId == tenantId.Value);

                if (stock == null)
                {
                    return NotFound(new ApiResponse<StockDto>
                    {
                        Success = false,
                        Message = "Stock item not found",
                        Data = null
                    });
                }

                var userId = GetCurrentUserId();

                // Check for duplicate SKU if SKU is being changed
                if (updateDto.SKU != stock.SKU)
                {
                    var existingSKU = await _context.Stocks
                        .AnyAsync(s => s.TenantId == tenantId.Value && s.SKU == updateDto.SKU && s.StockId != id);

                    if (existingSKU)
                    {
                        return BadRequest(new ApiResponse<StockDto>
                        {
                            Success = false,
                            Message = $"A stock item with SKU '{updateDto.SKU}' already exists",
                            Data = null
                        });
                    }
                }

                // Update properties
                stock.SKU = updateDto.SKU;
                stock.Name = updateDto.Name;
                stock.Description = updateDto.Description;
                stock.Category = updateDto.Category;
                stock.Subcategory = updateDto.Subcategory;
                stock.Supplier = updateDto.Supplier;
                stock.SupplierSKU = updateDto.SupplierSKU;
                stock.UnitOfMeasure = updateDto.UnitOfMeasure;
                stock.UnitCost = updateDto.UnitCost;
                stock.Currency = updateDto.Currency;
                stock.ReorderLevel = updateDto.ReorderLevel;
                stock.ReorderQuantity = updateDto.ReorderQuantity;
                stock.LeadTimeDays = updateDto.LeadTimeDays;
                stock.StorageLocation = updateDto.StorageLocation;
                stock.StorageRequirements = updateDto.StorageRequirements;
                stock.ShelfLifeDays = updateDto.ShelfLifeDays;
                stock.IsActive = updateDto.IsActive;
                stock.Notes = updateDto.Notes;
                stock.Updated = DateTime.UtcNow;
                stock.UpdatedBy = userId;

                await _context.SaveChangesAsync();

                var stockDto = new StockDto
                {
                    StockId = stock.StockId,
                    TenantId = stock.TenantId,
                    SKU = stock.SKU,
                    Name = stock.Name,
                    Description = stock.Description,
                    Category = stock.Category,
                    Subcategory = stock.Subcategory,
                    Supplier = stock.Supplier,
                    SupplierSKU = stock.SupplierSKU,
                    UnitOfMeasure = stock.UnitOfMeasure,
                    UnitCost = stock.UnitCost,
                    Currency = stock.Currency,
                    ReorderLevel = stock.ReorderLevel,
                    ReorderQuantity = stock.ReorderQuantity,
                    LeadTimeDays = stock.LeadTimeDays,
                    StorageLocation = stock.StorageLocation,
                    StorageRequirements = stock.StorageRequirements,
                    ShelfLifeDays = stock.ShelfLifeDays,
                    IsActive = stock.IsActive,
                    Notes = stock.Notes,
                    Created = stock.Created,
                    Updated = stock.Updated,
                    TotalQuantityOnHand = stock.TotalQuantityOnHand,
                    TotalQuantityReserved = stock.TotalQuantityReserved,
                    TotalQuantityAvailable = stock.TotalQuantityAvailable
                };

                return Ok(new ApiResponse<StockDto>
                {
                    Success = true,
                    Message = "Stock item updated successfully",
                    Data = stockDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stock item {StockId}", id);
                return StatusCode(500, new ApiResponse<StockDto>
                {
                    Success = false,
                    Message = "An error occurred while updating the stock item",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Check lot availability for a specific ingredient
        /// </summary>
        [HttpGet("availability")]
        public async Task<ActionResult<ApiResponse<LotAvailabilityResponse>>> CheckLotAvailability(
            [FromQuery] Guid ingredientId,
            [FromQuery] string category,
            [FromQuery] decimal amount,
            [FromQuery] string unit)
        {
            try
            {
                var tenantId = await GetCurrentTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new ApiResponse<LotAvailabilityResponse>
                    {
                        Success = false,
                        Message = "No active tenant found for user",
                        Data = null
                    });
                }

                // Find the Stock record for this ingredient
                // Query the database directly since C# models don't have StockId property yet
                Stock? stock = null;
                Guid? stockId = null;

                switch (category.ToLower())
                {
                    case "grain":
                        var grain = await _context.Grains
                            .FirstOrDefaultAsync(g => g.GrainId == ingredientId);
                        if (grain != null)
                        {
                            // Query Stock by matching name and category
                            stock = await _context.Stocks
                                .Include(s => s.Inventory)
                                .FirstOrDefaultAsync(s =>
                                    s.Name == grain.Name &&
                                    s.Category == "Grain" &&
                                    s.TenantId == tenantId.Value);
                        }
                        break;

                    case "hop":
                        var hop = await _context.Hops
                            .FirstOrDefaultAsync(h => h.HopId == ingredientId);
                        if (hop != null)
                        {
                            stock = await _context.Stocks
                                .Include(s => s.Inventory)
                                .FirstOrDefaultAsync(s =>
                                    s.Name == hop.Name &&
                                    s.Category == "Hop" &&
                                    s.TenantId == tenantId.Value);
                        }
                        break;

                    case "yeast":
                        var yeast = await _context.Yeasts
                            .FirstOrDefaultAsync(y => y.YeastId == ingredientId);
                        if (yeast != null)
                        {
                            stock = await _context.Stocks
                                .Include(s => s.Inventory)
                                .FirstOrDefaultAsync(s =>
                                    s.Name == yeast.Name &&
                                    s.Category == "Yeast" &&
                                    s.TenantId == tenantId.Value);
                        }
                        break;

                    case "additive":
                        var additive = await _context.Additives
                            .FirstOrDefaultAsync(a => a.AdditiveId == ingredientId);
                        if (additive != null)
                        {
                            stock = await _context.Stocks
                                .Include(s => s.Inventory)
                                .FirstOrDefaultAsync(s =>
                                    s.Name == additive.Name &&
                                    s.Category == "Additive" &&
                                    s.TenantId == tenantId.Value);
                        }
                        break;
                }

                if (stock == null || stock.Inventory == null || !stock.Inventory.Any())
                {
                    return Ok(new ApiResponse<LotAvailabilityResponse>
                    {
                        Success = true,
                        Message = "No inventory available for this ingredient",
                        Data = new LotAvailabilityResponse
                        {
                            IsAvailable = false,
                            TotalAvailable = 0,
                            RequiredAmount = amount,
                            Unit = unit,
                            CanFulfillFromSingleLot = false,
                            AvailableLots = new List<LotInfo>(),
                            RecommendedLots = new List<LotInfo>(),
                            Warnings = new List<string> { "No inventory available for this ingredient. Purchase required." }
                        }
                    });
                }

                // Get all lots with available quantity
                var availableLots = stock.Inventory
                    .Where(inv => inv.QuantityAvailable > 0)
                    .OrderBy(inv => inv.ReceivedDate ?? DateTime.MaxValue) // FIFO
                    .ThenBy(inv => inv.ExpirationDate ?? DateTime.MaxValue)
                    .Select(inv => new LotInfo
                    {
                        LotNumber = inv.LotNumber ?? "Unknown",
                        QuantityReceived = inv.QuantityReceived,
                        QuantityOnHand = inv.QuantityOnHand,
                        QuantityReserved = inv.QuantityReserved,
                        QuantityAvailable = inv.QuantityAvailable,
                        PercentageUsed = inv.QuantityReceived > 0
                            ? Math.Round(((inv.QuantityReceived - inv.QuantityAvailable) / inv.QuantityReceived) * 100, 1)
                            : 0,
                        UnitCost = inv.UnitCostActual ?? stock.UnitCost ?? 0,
                        ReceivedDate = inv.ReceivedDate,
                        ExpirationDate = inv.ExpirationDate,
                        StockInventoryId = inv.StockInventoryId
                    })
                    .ToList();

                decimal totalAvailable = availableLots.Sum(l => l.QuantityAvailable);
                bool isAvailable = totalAvailable >= amount;
                bool canFulfillFromSingleLot = availableLots.Any(l => l.QuantityAvailable >= amount);

                // Determine recommended lots
                var recommendedLots = new List<LotInfo>();
                var warnings = new List<string>();

                if (canFulfillFromSingleLot)
                {
                    // Recommend the first lot (FIFO) that can fulfill the entire amount
                    var singleLot = availableLots.First(l => l.QuantityAvailable >= amount);
                    recommendedLots.Add(singleLot);
                    warnings.Add($"✓ Single-lot fulfillment available from lot {singleLot.LotNumber}");
                }
                else if (isAvailable)
                {
                    // Multi-lot allocation required
                    decimal remaining = amount;
                    foreach (var lot in availableLots)
                    {
                        if (remaining <= 0) break;

                        var allocatedAmount = Math.Min(lot.QuantityAvailable, remaining);
                        recommendedLots.Add(new LotInfo
                        {
                            LotNumber = lot.LotNumber,
                            QuantityOnHand = lot.QuantityOnHand,
                            QuantityReserved = lot.QuantityReserved,
                            QuantityAvailable = allocatedAmount,
                            PercentageUsed = lot.PercentageUsed,
                            UnitCost = lot.UnitCost,
                            ReceivedDate = lot.ReceivedDate,
                            ExpirationDate = lot.ExpirationDate,
                            StockInventoryId = lot.StockInventoryId
                        });
                        remaining -= allocatedAmount;
                    }

                    warnings.Add($"⚠ Multi-lot required: {recommendedLots.Count} lots needed");
                    if (category.ToLower() == "hop" || category.ToLower() == "yeast")
                    {
                        warnings.Add($"⚠ Critical: {category} characteristics may vary between lots");
                    }
                }
                else
                {
                    // Insufficient inventory
                    warnings.Add($"✗ Insufficient inventory: {totalAvailable} {unit} available, {amount} {unit} required");
                    warnings.Add($"Purchase needed: {amount - totalAvailable} {unit}");
                }

                var response = new LotAvailabilityResponse
                {
                    IsAvailable = isAvailable,
                    TotalAvailable = totalAvailable,
                    RequiredAmount = amount,
                    Unit = unit,
                    CanFulfillFromSingleLot = canFulfillFromSingleLot,
                    AvailableLots = availableLots,
                    RecommendedLots = recommendedLots,
                    Warnings = warnings
                };

                return Ok(new ApiResponse<LotAvailabilityResponse>
                {
                    Success = true,
                    Message = "Lot availability checked successfully",
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking lot availability for ingredient {IngredientId}", ingredientId);
                return StatusCode(500, new ApiResponse<LotAvailabilityResponse>
                {
                    Success = false,
                    Message = "An error occurred while checking lot availability",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Delete (soft delete by setting IsActive = false) a stock item
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteStock(Guid id)
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

                var stock = await _context.Stocks
                    .FirstOrDefaultAsync(s => s.StockId == id && s.TenantId == tenantId.Value);

                if (stock == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Stock item not found",
                        Data = null
                    });
                }

                var userId = GetCurrentUserId();

                // Soft delete
                stock.IsActive = false;
                stock.Updated = DateTime.UtcNow;
                stock.UpdatedBy = userId;

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Stock item deleted successfully",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting stock item {StockId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "An error occurred while deleting the stock item",
                    Data = null
                });
            }
        }
    }

    // ApiResponse wrapper class
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    // Lot availability DTOs
    public class LotAvailabilityResponse
    {
        public bool IsAvailable { get; set; }
        public decimal TotalAvailable { get; set; }
        public decimal RequiredAmount { get; set; }
        public string Unit { get; set; } = string.Empty;
        public bool CanFulfillFromSingleLot { get; set; }
        public List<LotInfo> AvailableLots { get; set; } = new();
        public List<LotInfo> RecommendedLots { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class LotInfo
    {
        public string LotNumber { get; set; } = string.Empty;
        public decimal QuantityReceived { get; set; }
        public decimal QuantityOnHand { get; set; }
        public decimal QuantityReserved { get; set; }
        public decimal QuantityAvailable { get; set; }
        public decimal PercentageUsed { get; set; }
        public decimal UnitCost { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public Guid StockInventoryId { get; set; }
    }
}