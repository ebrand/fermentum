using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Npgsql;

namespace Fermentum.Auth.Data;

public sealed class SetSearchPathConnectionInterceptor : DbConnectionInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<SetSearchPathConnectionInterceptor> _logger;
    private static readonly Regex PgIdent = new("^[a-zA-Z_][a-zA-Z0-9_]*$", RegexOptions.Compiled);

    public SetSearchPathConnectionInterceptor(IHttpContextAccessor httpContextAccessor, ILogger<SetSearchPathConnectionInterceptor> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _logger.LogInformation("SetSearchPathConnectionInterceptor has been instantiated!");
    }

    public override async Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        if (connection is not NpgsqlConnection npgsqlConnection)
            return;

        var schema = ResolveTenantSchema() ?? "public";
        if (!PgIdent.IsMatch(schema))
        {
            _logger.LogWarning("Invalid tenant schema '{Schema}' – falling back to public", schema);
            schema = "public";
        }

        // Always set something deterministic on every connection open
        await using var cmd = npgsqlConnection.CreateCommand();
        cmd.CommandText = $"SET search_path TO \"{schema}\", public";
        await cmd.ExecuteNonQueryAsync(cancellationToken);

        _logger.LogInformation("SET search_path -> {Schema}", schema);
    }

    private string? ResolveTenantSchema()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            // Try multiple keys to be flexible
            var schema = user.FindFirst("schema_name")?.Value
                ?? user.FindFirst("tenant_schema")?.Value
                ?? user.FindFirst("tenant")?.Value;

            if (!string.IsNullOrEmpty(schema))
            {
                _logger.LogInformation("Resolved tenant schema: {Schema}", schema);
                return schema;
            }

            _logger.LogWarning("No schema claim found in authenticated JWT token");
        }
        else
        {
            _logger.LogInformation("User not authenticated, using default search_path");
        }

        return null;
    }
}