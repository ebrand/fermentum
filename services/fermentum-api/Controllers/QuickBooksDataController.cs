using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using FermentumApi.Models;
using System.Security.Claims;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/quickbooks")]
    [Authorize]
    public class QuickBooksDataController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<QuickBooksDataController> _logger;

        public QuickBooksDataController(AuthDbContext context, ILogger<QuickBooksDataController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private Guid GetCurrentTenantId()
        {
            // First try to get tenant ID from header (this is how the frontend sends it)
            var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
            if (!string.IsNullOrEmpty(tenantIdHeader) && Guid.TryParse(tenantIdHeader, out var tenantIdFromHeader))
            {
                return tenantIdFromHeader;
            }

            // Fallback to JWT claim
            var tenantIdClaim = User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var tenantIdFromClaim))
            {
                return tenantIdFromClaim;
            }

            throw new UnauthorizedAccessException("No valid tenant context found");
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("No valid user context found");
        }

        private async Task SetDatabaseUserContext()
        {
            var userId = GetCurrentUserId();
            await _context.Database.ExecuteSqlRawAsync($"SET app.current_user_id = '{userId}'");
            _logger.LogDebug("Set database user context to {UserId}", userId);
        }

        [HttpGet("accounts")]
        public async Task<ActionResult<IEnumerable<QBOAccount>>> GetAccounts()
        {
            try
            {
                // Set database user context for RLS
                await SetDatabaseUserContext();

                var tenantId = GetCurrentTenantId();
                _logger.LogInformation("Getting QuickBooks accounts for tenant {TenantId}", tenantId);

                var accounts = await _context.QBOAccounts
                    .Where(a => a.TenantId == tenantId)
                    .OrderBy(a => a.Name)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} QuickBooks accounts for tenant {TenantId}", accounts.Count, tenantId);

                return Ok(accounts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving QuickBooks accounts");
                return StatusCode(500, new { error = "Failed to retrieve accounts", details = ex.Message });
            }
        }

        [HttpGet("customers")]
        public async Task<ActionResult<IEnumerable<QBOCustomer>>> GetCustomers()
        {
            try
            {
                // Set database user context for RLS
                await SetDatabaseUserContext();

                var tenantId = GetCurrentTenantId();
                _logger.LogInformation("Getting QuickBooks customers for tenant {TenantId}", tenantId);

                var customers = await _context.QBOCustomers
                    .Where(c => c.TenantId == tenantId)
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} QuickBooks customers for tenant {TenantId}", customers.Count, tenantId);

                return Ok(customers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving QuickBooks customers");
                return StatusCode(500, new { error = "Failed to retrieve customers", details = ex.Message });
            }
        }

        [HttpGet("items")]
        public async Task<ActionResult<IEnumerable<QBOItem>>> GetItems()
        {
            try
            {
                // Set database user context for RLS
                await SetDatabaseUserContext();

                var tenantId = GetCurrentTenantId();
                _logger.LogInformation("Getting QuickBooks items for tenant {TenantId}", tenantId);

                var items = await _context.QBOItems
                    .Where(i => i.TenantId == tenantId)
                    .OrderBy(i => i.Name)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} QuickBooks items for tenant {TenantId}", items.Count, tenantId);

                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving QuickBooks items");
                return StatusCode(500, new { error = "Failed to retrieve items", details = ex.Message });
            }
        }

        [HttpGet("invoices")]
        public async Task<ActionResult<IEnumerable<QBOInvoice>>> GetInvoices()
        {
            try
            {
                // Set database user context for RLS
                await SetDatabaseUserContext();

                var tenantId = GetCurrentTenantId();
                _logger.LogInformation("Getting QuickBooks invoices for tenant {TenantId}", tenantId);

                var invoices = await _context.QBOInvoices
                    .Where(i => i.TenantId == tenantId)
                    .OrderByDescending(i => i.TxnDate)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} QuickBooks invoices for tenant {TenantId}", invoices.Count, tenantId);

                return Ok(invoices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving QuickBooks invoices");
                return StatusCode(500, new { error = "Failed to retrieve invoices", details = ex.Message });
            }
        }

        [HttpGet("payments")]
        public async Task<ActionResult<IEnumerable<object>>> GetPayments()
        {
            try
            {
                // Set database user context for RLS
                await SetDatabaseUserContext();

                var tenantId = GetCurrentTenantId();
                _logger.LogInformation("Getting QuickBooks payments for tenant {TenantId}", tenantId);

                var payments = await _context.QBOPayments
                    .Where(p => p.TenantId == tenantId)
                    .OrderByDescending(p => p.TxnDate)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} QuickBooks payments for tenant {TenantId}", payments.Count, tenantId);

                // Transform payments to return customer company name in customerRef field
                var transformedPayments = payments.Select(p => new
                {
                    p.QBOPaymentId,
                    p.TenantId,
                    p.QBOId,
                    p.TxnDate,
                    // ✅ CUSTOMER COMPANY NAME: Use CustomerName if available, otherwise original CustomerRef
                    CustomerRef = !string.IsNullOrEmpty(p.CustomerName) ? p.CustomerName : p.CustomerRef,
                    p.CustomerName, // Keep original field for reference
                    p.TotalAmt,
                    p.UnappliedAmt,
                    p.PaymentMethodRef,
                    p.PaymentRefNum,
                    p.DepositToAccountRef,
                    p.Line,
                    p.SyncedAt,
                    p.Created,
                    p.Updated
                }).ToList();

                _logger.LogInformation("Transformed {Count} payments with customer company names", transformedPayments.Count);

                return Ok(transformedPayments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving QuickBooks payments");
                return StatusCode(500, new { error = "Failed to retrieve payments", details = ex.Message });
            }
        }

        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetSummary()
        {
            try
            {
                // Set database user context for RLS
                await SetDatabaseUserContext();

                var tenantId = GetCurrentTenantId();
                _logger.LogInformation("Getting QuickBooks data summary for tenant {TenantId}", tenantId);

                var accountCount = await _context.QBOAccounts.CountAsync(a => a.TenantId == tenantId);
                var customerCount = await _context.QBOCustomers.CountAsync(c => c.TenantId == tenantId);
                var itemCount = await _context.QBOItems.CountAsync(i => i.TenantId == tenantId);
                var invoiceCount = await _context.QBOInvoices.CountAsync(i => i.TenantId == tenantId);
                var paymentCount = await _context.QBOPayments.CountAsync(p => p.TenantId == tenantId);

                // Get latest sync times
                var latestAccountSync = await _context.QBOAccounts
                    .Where(a => a.TenantId == tenantId)
                    .OrderByDescending(a => a.SyncedAt)
                    .Select(a => a.SyncedAt)
                    .FirstOrDefaultAsync();

                var latestCustomerSync = await _context.QBOCustomers
                    .Where(c => c.TenantId == tenantId)
                    .OrderByDescending(c => c.SyncedAt)
                    .Select(c => c.SyncedAt)
                    .FirstOrDefaultAsync();

                var summary = new
                {
                    TenantId = tenantId,
                    Counts = new
                    {
                        Accounts = accountCount,
                        Customers = customerCount,
                        Items = itemCount,
                        Invoices = invoiceCount,
                        Payments = paymentCount
                    },
                    LastSync = new
                    {
                        Accounts = latestAccountSync,
                        Customers = latestCustomerSync
                    }
                };

                _logger.LogInformation("QuickBooks summary for tenant {TenantId}: {AccountCount} accounts, {CustomerCount} customers, {ItemCount} items, {InvoiceCount} invoices, {PaymentCount} payments",
                    tenantId, accountCount, customerCount, itemCount, invoiceCount, paymentCount);

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving QuickBooks summary");
                return StatusCode(500, new { error = "Failed to retrieve summary", details = ex.Message });
            }
        }
    }
}