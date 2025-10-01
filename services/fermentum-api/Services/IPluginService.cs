using FermentumApi.Models;
using System.Text.Json.Serialization;

namespace Fermentum.Auth.Services
{
    public interface IPluginService
    {
        // Plugin management
        Task<IEnumerable<Plugin>> GetAvailablePluginsAsync();
        Task<Plugin?> GetPluginAsync(Guid pluginId);
        Task<Plugin?> GetPluginByNameAsync(string pluginName);

        // Tenant plugin management
        Task<IEnumerable<TenantPlugin>> GetTenantPluginsAsync(Guid tenantId);
        Task<TenantPlugin?> GetTenantPluginAsync(Guid tenantPluginId);
        Task<TenantPlugin?> InstallPluginAsync(Guid tenantId, Guid pluginId, string? configuration, Guid userId);
        Task<bool> UninstallPluginAsync(Guid tenantPluginId, Guid userId);
        Task<bool> EnablePluginAsync(Guid tenantPluginId, Guid userId);
        Task<bool> DisablePluginAsync(Guid tenantPluginId, Guid userId);
        Task<bool> UpdatePluginConfigurationAsync(Guid tenantPluginId, string configuration, Guid userId);
        Task<bool> UpdatePluginAuthDataAsync(Guid tenantPluginId, string authData, Guid userId);

        // Sync management
        Task<bool> TriggerSyncAsync(Guid tenantPluginId, Guid userId, string syncType = "manual");
        Task<IEnumerable<PluginSyncHistory>> GetSyncHistoryAsync(Guid tenantPluginId, int limit = 10);
        Task<PluginSyncHistory?> GetLatestSyncAsync(Guid tenantPluginId);

        // Plugin-specific operations
        Task<bool> TestConnectionAsync(Guid tenantPluginId);
    }
}

namespace Fermentum.Auth.Interfaces
{
    public interface IPluginProcessor
    {
        string PluginName { get; }
        Task<bool> ValidateConfigurationAsync(string configuration);
        Task<bool> ValidateAuthDataAsync(string authData);
        Task<bool> TestConnectionAsync(string configuration, string authData);
        Task<SyncResult> SyncDataAsync(Guid tenantId, string configuration, string authData, string syncType, Guid userId);
    }

    public class SyncResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public int RecordsProcessed { get; set; }
        public int RecordsInserted { get; set; }
        public int RecordsUpdated { get; set; }
        public int RecordsSkipped { get; set; }
        public Dictionary<string, object>? Details { get; set; }
    }
}

// DTO classes for API responses
namespace FermentumApi.DTOs
{
    public class PluginDto
    {
        public Guid PluginId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Version { get; set; } = string.Empty;
        public string? Author { get; set; }
        public string Category { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool RequiresAuth { get; set; }
        public string? AuthType { get; set; }
        public object? ConfigurationSchema { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
    }

    public class TenantPluginDto
    {
        public Guid TenantPluginId { get; set; }
        public Guid TenantId { get; set; }
        public PluginDto Plugin { get; set; } = null!;
        public bool IsEnabled { get; set; }
        public object? Configuration { get; set; }
        public DateTime? LastSync { get; set; }
        public string SyncStatus { get; set; } = string.Empty;
        public string? SyncError { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public string UpdatedByName { get; set; } = string.Empty;
    }

    public class PluginSyncHistoryDto
    {
        public Guid SyncHistoryId { get; set; }
        public string SyncType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int RecordsProcessed { get; set; }
        public int RecordsInserted { get; set; }
        public int RecordsUpdated { get; set; }
        public int RecordsSkipped { get; set; }
        public string? ErrorMessage { get; set; }
        public object? SyncDetails { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
    }

    // Request DTOs
    public class InstallPluginRequest
    {
        public Guid PluginId { get; set; }
        public object? Configuration { get; set; }
    }

    public class UpdatePluginConfigurationRequest
    {
        public object Configuration { get; set; } = null!;
    }

    public class UpdatePluginAuthRequest
    {
        public object AuthData { get; set; } = null!;
    }

    public class TriggerSyncRequest
    {
        [JsonPropertyName("syncType")]
        public string SyncType { get; set; } = "manual";
    }
}