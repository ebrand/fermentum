using Fermentum.Auth.Data;
using Microsoft.EntityFrameworkCore;

namespace Fermentum.Auth.Middleware
{
    public class TenantSchemaMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TenantSchemaMiddleware> _logger;

        public TenantSchemaMiddleware(RequestDelegate next, ILogger<TenantSchemaMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, AuthDbContext dbContext)
        {
            _logger.LogInformation("TenantSchemaMiddleware executing for path: {Path}", context.Request.Path);

            // Get schema name from JWT token claims
            var schemaNameClaim = context.User.FindFirst("schema_name")?.Value;
            _logger.LogInformation("Schema name claim from JWT: {SchemaName}", schemaNameClaim ?? "NULL");

            if (!string.IsNullOrEmpty(schemaNameClaim))
            {
                try
                {
                    // Set PostgreSQL search_path for this connection
                    var sql = $"SET search_path TO {schemaNameClaim}, public";
                    _logger.LogInformation("Executing SQL: {Sql}", sql);
                    await dbContext.Database.ExecuteSqlRawAsync(sql);

                    _logger.LogInformation("Successfully set search_path to: {SchemaName}", schemaNameClaim);

                    // Verify search_path was set correctly
                    var currentSearchPath = await dbContext.Database.SqlQueryRaw<string>("SHOW search_path").FirstOrDefaultAsync();
                    _logger.LogInformation("Current search_path after setting: {CurrentSearchPath}", currentSearchPath);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to set search_path to: {SchemaName}", schemaNameClaim);
                }
            }
            else
            {
                _logger.LogWarning("No schema_name claim found, using default search_path");
            }

            await _next(context);
        }
    }

    public static class TenantSchemaMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantSchema(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<TenantSchemaMiddleware>();
        }
    }
}