using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Fermentum.Auth.Services
{
    /// <summary>
    /// HTTP-based implementation of ITenantContext that resolves tenant from headers and JWT claims
    /// </summary>
    public class HttpTenantContext : ITenantContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<HttpTenantContext> _logger;
        private Guid? _tenantId;

        public HttpTenantContext(IHttpContextAccessor httpContextAccessor, ILogger<HttpTenantContext> logger)
        {
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public Guid? TenantId
        {
            get
            {
                if (_tenantId.HasValue)
                    return _tenantId;

                return ResolveTenantId();
            }
        }

        public string? SchemaName
        {
            get
            {
                // For backward compatibility, convert tenant ID to schema name format
                var tenantId = TenantId;
                if (tenantId.HasValue)
                {
                    return $"tenant_{tenantId.Value:N}"; // Format: tenant_39aa728d5ea147b7aa3129bcb9f01ed2
                }
                return null;
            }
        }

        public void SetTenantId(Guid tenantId)
        {
            _tenantId = tenantId;
            _logger.LogInformation("🔧 Tenant ID explicitly set to: {TenantId}", tenantId);
        }

        public void Clear()
        {
            _tenantId = null;
            _logger.LogInformation("🧹 Tenant context cleared");
        }

        private Guid? ResolveTenantId()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
            {
                _logger.LogWarning("⚠️ No HTTP context available for tenant resolution");
                return null;
            }

            // Try to get tenant ID from JWT claims first (for authenticated requests)
            var tenantIdClaim = httpContext.User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out Guid tenantIdFromJwt))
            {
                _logger.LogInformation("✅ Resolved tenant ID from JWT claim: {TenantId}", tenantIdFromJwt);
                return tenantIdFromJwt;
            }

            // Fallback to X-Tenant-Schema header (for testing and legacy support)
            var schemaHeader = httpContext.Request.Headers["X-Tenant-Schema"].FirstOrDefault();
            if (!string.IsNullOrEmpty(schemaHeader))
            {
                var extractedTenantId = ExtractTenantIdFromSchema(schemaHeader);
                if (extractedTenantId.HasValue)
                {
                    _logger.LogInformation("✅ Resolved tenant ID from X-Tenant-Schema header: {TenantId}", extractedTenantId);
                    return extractedTenantId;
                }
            }

            // Try X-Tenant-Id header directly
            var tenantIdHeader = httpContext.Request.Headers["X-Tenant-Id"].FirstOrDefault();
            if (!string.IsNullOrEmpty(tenantIdHeader) && Guid.TryParse(tenantIdHeader, out Guid tenantIdFromHeader))
            {
                _logger.LogInformation("✅ Resolved tenant ID from X-Tenant-Id header: {TenantId}", tenantIdFromHeader);
                return tenantIdFromHeader;
            }

            _logger.LogWarning("⚠️ Could not resolve tenant ID from any source (JWT claims, headers)");
            return null;
        }

        private Guid? ExtractTenantIdFromSchema(string schemaName)
        {
            if (string.IsNullOrEmpty(schemaName) || !schemaName.StartsWith("tenant_"))
                return null;

            try
            {
                var rawTenantId = schemaName.Substring(7); // Remove "tenant_" prefix

                // Convert from tenant_39aa728d5ea147b7aa3129bcb9f01ed2 to 39aa728d-5ea1-47b7-aa31-29bcb9f01ed2
                if (rawTenantId.Length == 32) // UUID without dashes
                {
                    var formattedTenantId = $"{rawTenantId.Substring(0, 8)}-{rawTenantId.Substring(8, 4)}-{rawTenantId.Substring(12, 4)}-{rawTenantId.Substring(16, 4)}-{rawTenantId.Substring(20)}";
                    if (Guid.TryParse(formattedTenantId, out Guid tenantId))
                    {
                        return tenantId;
                    }
                }
                else if (Guid.TryParse(rawTenantId, out Guid tenantIdDirect))
                {
                    // Already formatted UUID
                    return tenantIdDirect;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "❌ Failed to extract tenant ID from schema name: {SchemaName}", schemaName);
            }

            return null;
        }
    }
}