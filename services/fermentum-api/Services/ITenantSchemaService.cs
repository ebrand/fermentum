namespace Fermentum.Auth.Services;

public interface ITenantSchemaService
{
    Task SetSchemaFromHeaderAsync(string? schemaName);
    string? GetCurrentSchema();
}