using System;

namespace Fermentum.Auth.Services
{
    /// <summary>
    /// Provides access to the current tenant information for RLS-based multi-tenancy
    /// </summary>
    public interface ITenantContext
    {
        /// <summary>
        /// Gets the current tenant ID for the request
        /// </summary>
        Guid? TenantId { get; }

        /// <summary>
        /// Gets the current tenant schema name (for backward compatibility)
        /// </summary>
        string? SchemaName { get; }

        /// <summary>
        /// Sets the current tenant ID
        /// </summary>
        void SetTenantId(Guid tenantId);

        /// <summary>
        /// Clears the current tenant context
        /// </summary>
        void Clear();
    }
}