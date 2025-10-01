using System;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Fermentum.Auth.Services;

namespace Fermentum.Auth.Data
{
    /// <summary>
    /// EF Core interceptor that automatically sets the PostgreSQL session variable 'app.tenant_id'
    /// for Row Level Security (RLS) based multi-tenancy
    /// </summary>
    public class TenantRlsInterceptor : DbConnectionInterceptor
    {
        private readonly ITenantContext _tenantContext;
        private readonly ILogger<TenantRlsInterceptor> _logger;

        public TenantRlsInterceptor(ITenantContext tenantContext, ILogger<TenantRlsInterceptor> logger)
        {
            _tenantContext = tenantContext;
            _logger = logger;
        }

        public override async ValueTask<InterceptionResult> ConnectionOpeningAsync(
            DbConnection connection,
            ConnectionEventData eventData,
            InterceptionResult result,
            CancellationToken cancellationToken = default)
        {
            var baseResult = await base.ConnectionOpeningAsync(connection, eventData, result, cancellationToken);

            // Set tenant session variable after the connection is opened
            if (connection.State == System.Data.ConnectionState.Open)
            {
                await SetTenantSessionVariable(connection);
            }

            return baseResult;
        }

        public override InterceptionResult ConnectionOpening(
            DbConnection connection,
            ConnectionEventData eventData,
            InterceptionResult result)
        {
            var baseResult = base.ConnectionOpening(connection, eventData, result);

            // Set tenant session variable after the connection is opened
            if (connection.State == System.Data.ConnectionState.Open)
            {
                SetTenantSessionVariable(connection).GetAwaiter().GetResult();
            }

            return baseResult;
        }

        private async Task SetTenantSessionVariable(DbConnection connection)
        {
            var tenantId = _tenantContext.TenantId;

            if (!tenantId.HasValue)
            {
                _logger.LogWarning("⚠️ No tenant ID available, clearing app.tenant_id session variable");

                try
                {
                    using var command = connection.CreateCommand();
                    command.CommandText = "SET app.tenant_id = '';";
                    await command.ExecuteNonQueryAsync();
                    _logger.LogInformation("🧹 Cleared app.tenant_id session variable");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Failed to clear app.tenant_id session variable");
                }
                return;
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = $"SET app.tenant_id = '{tenantId.Value}';";
                await command.ExecuteNonQueryAsync();

                _logger.LogInformation("✅ Set app.tenant_id session variable to: {TenantId}", tenantId.Value);

                // Verify the setting was applied
                using var verifyCommand = connection.CreateCommand();
                verifyCommand.CommandText = "SELECT current_setting('app.tenant_id', true);";
                var currentValue = await verifyCommand.ExecuteScalarAsync();
                _logger.LogInformation("🔍 Verified app.tenant_id = '{CurrentValue}'", currentValue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to set app.tenant_id session variable to: {TenantId}", tenantId.Value);
                throw;
            }
        }
    }
}