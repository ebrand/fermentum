using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using Fermentum.Auth.Models.DTOs;
using Fermentum.Auth.Services;
using FermentumApi.Models;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(
            AuthDbContext context,
            ITenantContext tenantContext,
            ILogger<EmployeesController> logger)
        {
            _context = context;
            _tenantContext = tenantContext;
            _logger = logger;
        }

        private void ValidateTenantContext()
        {
            var tenantId = _tenantContext.TenantId;
            _logger.LogInformation("🔧 ValidateTenantContext called - current tenant ID: {TenantId}", tenantId?.ToString() ?? "NULL");

            if (!tenantId.HasValue)
            {
                _logger.LogWarning("⚠️ No tenant ID available in context");
                throw new UnauthorizedAccessException("Tenant context is required for this operation");
            }
        }


        private async Task<Guid?> GetCurrentBreweryIdAsync()
        {
            var tenantId = _tenantContext.TenantId;
            if (!tenantId.HasValue)
            {
                _logger.LogWarning("GetCurrentBreweryIdAsync: No tenant ID available in context");
                return null;
            }

            _logger.LogInformation("GetCurrentBreweryIdAsync: Using tenant ID from context: {TenantId}", tenantId.Value);

            // Set tenant context for RLS
            await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

            // Query brewery by tenant ID explicitly (more reliable than relying on RLS)
            var brewery = await _context.Breweries
                .Where(b => b.TenantId == tenantId.Value)
                .FirstOrDefaultAsync();

            _logger.LogInformation("GetCurrentBreweryIdAsync: Found brewery = {BreweryId} for tenant {TenantId}",
                brewery?.BreweryId.ToString() ?? "NULL", tenantId.Value);
            return brewery?.BreweryId;
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



        private async Task<Guid?> GetCurrentEmployeeIdAsync()
        {
            // Simplified - no user-employee mapping yet
            // Can be enhanced later when UserId property is added back
            return null;
        }

        // GET: api/employees
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
        {
            try
            {
                _logger.LogInformation("🚀 GetEmployees method called - starting RLS-based execution");

                // Validate tenant context
                ValidateTenantContext();

                _logger.LogInformation("🔍 Getting employees using RLS - tenant ID: {TenantId}", _tenantContext.TenantId);

                // Use a transaction to ensure session variable persistence
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Set tenant session variable for RLS
                    await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{_tenantContext.TenantId}'");
                    _logger.LogInformation("✅ Set app.tenant_id to: {TenantId}", _tenantContext.TenantId);

                    // Test current PostgreSQL session variable
                    var tenantSessionVar = await _context.Database.SqlQueryRaw<string>("SELECT current_setting('app.tenant_id', true)").ToListAsync();
                    var currentTenantId = tenantSessionVar.FirstOrDefault();
                    _logger.LogInformation("🔍 PostgreSQL app.tenant_id session variable: '{TenantId}'", currentTenantId ?? "NULL");

                    // Use Entity Framework - RLS automatically filters by tenant_id
                    var employees = await _context.Employees
                        .Where(e => e.IsActive)
                        .OrderBy(e => e.LastName)
                        .ThenBy(e => e.FirstName)
                        .ToListAsync();

                    await transaction.CommitAsync();

                    _logger.LogInformation("Found {Count} employees using RLS for tenant {TenantId}",
                        employees.Count, _tenantContext.TenantId);
                    return Ok(employees);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error in employee transaction");
                    throw; // Re-throw to be caught by outer exception handler
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to employees");
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employees");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/employees/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Employee>> GetEmployee(Guid id)
        {
            try
            {
                // Validate tenant context
                ValidateTenantContext();

                // Use Entity Framework - RLS automatically filters by tenant_id
                var employee = await _context.Employees
                    .Where(e => e.EmployeeId == id)
                    .FirstOrDefaultAsync();

                if (employee == null)
                {
                    return NotFound();
                }

                return Ok(employee);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to employee {EmployeeId}", id);
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee with ID {EmployeeId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/employees
        [HttpPost]
        public async Task<ActionResult<Employee>> CreateEmployee(CreateEmployeeRequest request)
        {
            try
            {
                // Set schema from X-Tenant-Schema header first
                ValidateTenantContext();

                _logger.LogInformation($"CreateEmployee received request: FirstName='{request.FirstName}', LastName='{request.LastName}'");

                var breweryId = await GetCurrentBreweryIdAsync();
                if (!breweryId.HasValue)
                {
                    return BadRequest("No brewery found for current tenant");
                }

                var currentUserId = GetCurrentUserId();

                // Employee number generation removed in simplified version

                // Create employee using Entity Framework - simplified model
                var employee = new Employee
                {
                    TenantId = _tenantContext.TenantId.Value,
                    BreweryId = breweryId.Value,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    IsActive = true,
                    Created = DateTime.UtcNow,
                    CreatedBy = currentUserId,
                    Updated = DateTime.UtcNow,
                    UpdatedBy = currentUserId
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Successfully created employee with ID {employee.EmployeeId}");

                return Ok(new {
                    success = true,
                    message = "Employee created successfully",
                    employee_id = employee.EmployeeId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/employees/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(Guid id, UpdateEmployeeRequest request)
        {
            try
            {
                // Set schema from X-Tenant-Schema header first
                ValidateTenantContext();

                var breweryId = await GetCurrentBreweryIdAsync();
                if (!breweryId.HasValue)
                {
                    return BadRequest("No brewery found for current tenant");
                }

                var currentUserId = GetCurrentUserId();

                // Find employee using Entity Framework - search_path handles schema routing
                var employee = await _context.Employees
                    .Where(e => e.EmployeeId == id && e.BreweryId == breweryId.Value)
                    .FirstOrDefaultAsync();

                if (employee == null)
                {
                    return NotFound();
                }

                // Update employee properties (simplified)
                employee.FirstName = request.FirstName;
                employee.LastName = request.LastName;
                employee.Updated = DateTime.UtcNow;
                employee.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating employee with ID {EmployeeId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/employees/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(Guid id)
        {
            try
            {
                // Set schema from X-Tenant-Schema header first
                ValidateTenantContext();

                var breweryId = await GetCurrentBreweryIdAsync();
                if (!breweryId.HasValue)
                {
                    return BadRequest("No brewery found for current tenant");
                }

                var currentUserId = GetCurrentUserId();

                // Find employee using Entity Framework - search_path handles schema routing
                var employee = await _context.Employees
                    .Where(e => e.EmployeeId == id && e.BreweryId == breweryId.Value)
                    .FirstOrDefaultAsync();

                if (employee == null)
                {
                    return NotFound();
                }

                // Soft delete - mark as inactive instead of actually deleting
                employee.IsActive = false;
                employee.Updated = DateTime.UtcNow;
                employee.UpdatedBy = currentUserId;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting employee with ID {EmployeeId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}