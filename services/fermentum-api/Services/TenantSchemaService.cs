using Fermentum.Auth.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Text.RegularExpressions;

namespace Fermentum.Auth.Services;

public class TenantSchemaService : ITenantSchemaService
{
    private readonly AuthDbContext _context;
    private readonly ILogger<TenantSchemaService> _logger;
    private static readonly Regex PgIdent = new("^[a-zA-Z_][a-zA-Z0-9_]*$", RegexOptions.Compiled);

    public TenantSchemaService(AuthDbContext context, ILogger<TenantSchemaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SetSchemaFromHeaderAsync(string? schemaName)
    {
        _logger.LogInformation("🔍 SetSchemaFromHeaderAsync called with schema: '{Schema}'", schemaName ?? "NULL");

        // Default to public if no schema provided or invalid
        var targetSchema = "public";

        if (!string.IsNullOrEmpty(schemaName))
        {
            if (PgIdent.IsMatch(schemaName))
            {
                targetSchema = schemaName;
                _logger.LogInformation("✅ Valid schema name provided, setting to: '{Schema}'", targetSchema);
            }
            else
            {
                _logger.LogWarning("❌ Invalid schema name '{Schema}' provided in header, using public", schemaName);
            }
        }
        else
        {
            _logger.LogInformation("⚠️ No schema header provided, using public schema");
        }

        try
        {
            _logger.LogInformation("🔧 Executing: SET search_path TO \"{Schema}\", public", targetSchema);

            // Set the search_path on the current connection
            await _context.Database.ExecuteSqlRawAsync($"SET search_path TO \"{targetSchema}\", public");

            _logger.LogInformation("✅ Successfully executed SET search_path command");

            // Verify the search_path was set correctly
            var result = await _context.Database.SqlQueryRaw<string>("SHOW search_path").ToListAsync();
            var searchPath = result.FirstOrDefault();
            _logger.LogInformation("🔍 Current search_path after SET command: '{SearchPath}'", searchPath ?? "NULL");

            // Also check what schema we're actually in
            var currentSchemaResult = await _context.Database.SqlQueryRaw<string>("SELECT current_schema()").ToListAsync();
            var currentSchema = currentSchemaResult.FirstOrDefault();
            _logger.LogInformation("🔍 Current schema after SET command: '{CurrentSchema}'", currentSchema ?? "NULL");

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error setting search_path to '{Schema}'", targetSchema);
            throw;
        }
    }

    public string? GetCurrentSchema()
    {
        // This could be enhanced to store the current schema in the service
        // For now, we rely on the database connection's search_path
        return null;
    }
}