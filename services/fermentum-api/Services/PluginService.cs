using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using FermentumApi.Models;
using Fermentum.Auth.Interfaces;
using System.Text.Json;

namespace Fermentum.Auth.Services
{
    public class PluginService : IPluginService
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<PluginService> _logger;
        private readonly Dictionary<string, IPluginProcessor> _processors;
        private readonly IServiceScopeFactory _scopeFactory;

        public PluginService(
            AuthDbContext context,
            ILogger<PluginService> logger,
            IEnumerable<IPluginProcessor> processors,
            IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _logger = logger;
            _processors = processors.ToDictionary(p => p.PluginName, p => p);
            _scopeFactory = scopeFactory;
        }

        public async Task<IEnumerable<Plugin>> GetAvailablePluginsAsync()
        {
            return await _context.Plugins
                .Where(p => p.IsActive)
                .OrderBy(p => p.DisplayName)
                .ToListAsync();
        }

        public async Task<Plugin?> GetPluginAsync(Guid pluginId)
        {
            return await _context.Plugins
                .FirstOrDefaultAsync(p => p.PluginId == pluginId);
        }

        public async Task<Plugin?> GetPluginByNameAsync(string pluginName)
        {
            return await _context.Plugins
                .FirstOrDefaultAsync(p => p.Name == pluginName);
        }

        public async Task<IEnumerable<TenantPlugin>> GetTenantPluginsAsync(Guid tenantId)
        {
            return await _context.TenantPlugins
                .Include(tp => tp.Plugin)
                .Include(tp => tp.CreatedByUser)
                .Include(tp => tp.UpdatedByUser)
                .Where(tp => tp.TenantId == tenantId)
                .OrderBy(tp => tp.Plugin.DisplayName)
                .ToListAsync();
        }

        public async Task<TenantPlugin?> GetTenantPluginAsync(Guid tenantPluginId)
        {
            return await _context.TenantPlugins
                .Include(tp => tp.Plugin)
                .Include(tp => tp.CreatedByUser)
                .Include(tp => tp.UpdatedByUser)
                .FirstOrDefaultAsync(tp => tp.TenantPluginId == tenantPluginId);
        }

        public async Task<TenantPlugin?> InstallPluginAsync(Guid tenantId, Guid pluginId, string? configuration, Guid userId)
        {
            try
            {
                // Check if plugin exists and is active
                var plugin = await GetPluginAsync(pluginId);
                if (plugin == null || !plugin.IsActive)
                {
                    _logger.LogWarning("Attempted to install inactive or non-existent plugin {PluginId}", pluginId);
                    return null;
                }

                // Check if plugin is already installed for this tenant
                var existingInstallation = await _context.TenantPlugins
                    .FirstOrDefaultAsync(tp => tp.TenantId == tenantId && tp.PluginId == pluginId);

                if (existingInstallation != null)
                {
                    _logger.LogWarning("Plugin {PluginId} is already installed for tenant {TenantId}", pluginId, tenantId);
                    return null;
                }

                // Validate configuration if provided
                if (!string.IsNullOrEmpty(configuration) && _processors.ContainsKey(plugin.Name))
                {
                    var processor = _processors[plugin.Name];
                    var isValidConfig = await processor.ValidateConfigurationAsync(configuration);
                    if (!isValidConfig)
                    {
                        _logger.LogWarning("Invalid configuration provided for plugin {PluginName}", plugin.Name);
                        return null;
                    }
                }

                // Install the plugin
                var tenantPlugin = new TenantPlugin
                {
                    TenantPluginId = Guid.NewGuid(),
                    TenantId = tenantId,
                    PluginId = pluginId,
                    IsEnabled = true,
                    Configuration = configuration,
                    SyncStatus = SyncStatuses.PENDING,
                    Created = DateTime.UtcNow,
                    Updated = DateTime.UtcNow,
                    CreatedBy = userId,
                    UpdatedBy = userId
                };

                _context.TenantPlugins.Add(tenantPlugin);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Plugin {PluginName} installed for tenant {TenantId} by user {UserId}",
                    plugin.Name, tenantId, userId);

                return await GetTenantPluginAsync(tenantPlugin.TenantPluginId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error installing plugin {PluginId} for tenant {TenantId}", pluginId, tenantId);
                return null;
            }
        }

        public async Task<bool> UninstallPluginAsync(Guid tenantPluginId, Guid userId)
        {
            try
            {
                var tenantPlugin = await GetTenantPluginAsync(tenantPluginId);
                if (tenantPlugin == null)
                {
                    return false;
                }

                // Remove the plugin installation
                _context.TenantPlugins.Remove(tenantPlugin);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Plugin {PluginName} uninstalled from tenant {TenantId} by user {UserId}",
                    tenantPlugin.Plugin.Name, tenantPlugin.TenantId, userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uninstalling plugin {TenantPluginId}", tenantPluginId);
                return false;
            }
        }

        public async Task<bool> EnablePluginAsync(Guid tenantPluginId, Guid userId)
        {
            return await UpdatePluginStatusAsync(tenantPluginId, true, userId);
        }

        public async Task<bool> DisablePluginAsync(Guid tenantPluginId, Guid userId)
        {
            return await UpdatePluginStatusAsync(tenantPluginId, false, userId);
        }

        private async Task<bool> UpdatePluginStatusAsync(Guid tenantPluginId, bool isEnabled, Guid userId)
        {
            try
            {
                var tenantPlugin = await _context.TenantPlugins
                    .FirstOrDefaultAsync(tp => tp.TenantPluginId == tenantPluginId);

                if (tenantPlugin == null)
                {
                    return false;
                }

                tenantPlugin.IsEnabled = isEnabled;
                tenantPlugin.Updated = DateTime.UtcNow;
                tenantPlugin.UpdatedBy = userId;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Plugin {TenantPluginId} {Action} by user {UserId}",
                    tenantPluginId, isEnabled ? "enabled" : "disabled", userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating plugin status {TenantPluginId}", tenantPluginId);
                return false;
            }
        }

        public async Task<bool> UpdatePluginConfigurationAsync(Guid tenantPluginId, string configuration, Guid userId)
        {
            try
            {
                var tenantPlugin = await GetTenantPluginAsync(tenantPluginId);
                if (tenantPlugin == null)
                {
                    return false;
                }

                // Validate configuration if processor exists
                if (_processors.ContainsKey(tenantPlugin.Plugin.Name))
                {
                    var processor = _processors[tenantPlugin.Plugin.Name];
                    var isValidConfig = await processor.ValidateConfigurationAsync(configuration);
                    if (!isValidConfig)
                    {
                        _logger.LogWarning("Invalid configuration provided for plugin {PluginName}", tenantPlugin.Plugin.Name);
                        return false;
                    }
                }

                tenantPlugin.Configuration = configuration;
                tenantPlugin.Updated = DateTime.UtcNow;
                tenantPlugin.UpdatedBy = userId;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Configuration updated for plugin {TenantPluginId} by user {UserId}",
                    tenantPluginId, userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating plugin configuration {TenantPluginId}", tenantPluginId);
                return false;
            }
        }

        public async Task<bool> UpdatePluginAuthDataAsync(Guid tenantPluginId, string authData, Guid userId)
        {
            try
            {
                var tenantPlugin = await GetTenantPluginAsync(tenantPluginId);
                if (tenantPlugin == null)
                {
                    return false;
                }

                // Validate auth data if processor exists
                if (_processors.ContainsKey(tenantPlugin.Plugin.Name))
                {
                    _logger.LogInformation("PluginService: About to validate auth data for plugin {PluginName} with data: {AuthData}", tenantPlugin.Plugin.Name, authData);
                    var processor = _processors[tenantPlugin.Plugin.Name];
                    var isValidAuth = await processor.ValidateAuthDataAsync(authData);
                    if (!isValidAuth)
                    {
                        _logger.LogWarning("Invalid auth data provided for plugin {PluginName}", tenantPlugin.Plugin.Name);
                        return false;
                    }
                }

                tenantPlugin.AuthData = authData;
                tenantPlugin.Updated = DateTime.UtcNow;
                tenantPlugin.UpdatedBy = userId;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Auth data updated for plugin {TenantPluginId} by user {UserId}",
                    tenantPluginId, userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating plugin auth data {TenantPluginId}", tenantPluginId);
                return false;
            }
        }

        public async Task<bool> TriggerSyncAsync(Guid tenantPluginId, Guid userId, string syncType = "manual")
        {
            try
            {
                var tenantPlugin = await GetTenantPluginAsync(tenantPluginId);
                if (tenantPlugin == null || !tenantPlugin.IsEnabled)
                {
                    _logger.LogWarning("Cannot sync disabled or non-existent plugin {TenantPluginId}", tenantPluginId);
                    return false;
                }

                if (!_processors.ContainsKey(tenantPlugin.Plugin.Name))
                {
                    _logger.LogWarning("No processor found for plugin {PluginName}", tenantPlugin.Plugin.Name);
                    return false;
                }

                // Create sync history record
                var syncHistory = new PluginSyncHistory
                {
                    SyncHistoryId = Guid.NewGuid(),
                    TenantPluginId = tenantPluginId,
                    SyncType = syncType,
                    Status = SyncHistoryStatuses.STARTED,
                    StartTime = DateTime.UtcNow,
                    CreatedBy = userId
                };

                _context.PluginSyncHistory.Add(syncHistory);

                // Update tenant plugin status
                tenantPlugin.SyncStatus = SyncStatuses.SYNCING;
                tenantPlugin.SyncError = null;
                tenantPlugin.Updated = DateTime.UtcNow;
                tenantPlugin.UpdatedBy = userId;

                await _context.SaveChangesAsync();

                // Trigger sync in background
                _ = Task.Run(async () => await ExecuteSyncAsync(tenantPlugin, syncHistory));

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering sync for plugin {TenantPluginId}", tenantPluginId);
                return false;
            }
        }

        private async Task ExecuteSyncAsync(TenantPlugin tenantPlugin, PluginSyncHistory syncHistory)
        {
            _logger.LogInformation("🔄 [SYNC DEBUG] === ExecuteSyncAsync START ===");
            _logger.LogInformation("🔄 [SYNC DEBUG] TenantPluginId: {TenantPluginId}", tenantPlugin.TenantPluginId);
            _logger.LogInformation("🔄 [SYNC DEBUG] PluginName: {PluginName}", tenantPlugin.Plugin?.Name);
            _logger.LogInformation("🔄 [SYNC DEBUG] TenantId: {TenantId}", tenantPlugin.TenantId);
            _logger.LogInformation("🔄 [SYNC DEBUG] SyncHistoryId: {SyncHistoryId}", syncHistory.SyncHistoryId);

            try
            {
                _logger.LogInformation("🔄 [SYNC DEBUG] About to get processor for plugin: {PluginName}", tenantPlugin.Plugin.Name);
                _logger.LogInformation("🔄 [SYNC DEBUG] Available processors: {ProcessorNames}", string.Join(", ", _processors.Keys));

                var processor = _processors[tenantPlugin.Plugin.Name];
                _logger.LogInformation("🔄 [SYNC DEBUG] Got processor: {ProcessorType}", processor.GetType().Name);

                _logger.LogInformation("🔄 [SYNC DEBUG] About to call processor.SyncDataAsync...");
                var result = await processor.SyncDataAsync(
                    tenantPlugin.TenantId,
                    tenantPlugin.Configuration ?? string.Empty,
                    tenantPlugin.AuthData ?? string.Empty,
                    syncHistory.SyncType,
                    syncHistory.CreatedBy);

                _logger.LogInformation("🔄 [SYNC DEBUG] SyncDataAsync returned: Success={Success}, Records={Records}, Error={Error}",
                    result.Success, result.RecordsProcessed, result.ErrorMessage);

                // Create a new scope for database operations in background task
                _logger.LogInformation("🔄 [SYNC DEBUG] Creating new scope to save sync results to database");
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AuthDbContext>();

                // Reload entities in new context to update them
                var syncHistoryToUpdate = await context.PluginSyncHistory.FindAsync(syncHistory.SyncHistoryId);
                var tenantPluginToUpdate = await context.TenantPlugins.FindAsync(tenantPlugin.TenantPluginId);

                if (syncHistoryToUpdate != null && tenantPluginToUpdate != null)
                {
                    // Update sync history
                    syncHistoryToUpdate.EndTime = DateTime.UtcNow;
                    syncHistoryToUpdate.Status = result.Success ? SyncHistoryStatuses.COMPLETED : SyncHistoryStatuses.FAILED;
                    syncHistoryToUpdate.ErrorMessage = result.ErrorMessage;
                    syncHistoryToUpdate.RecordsProcessed = result.RecordsProcessed;
                    syncHistoryToUpdate.RecordsInserted = result.RecordsInserted;
                    syncHistoryToUpdate.RecordsUpdated = result.RecordsUpdated;
                    syncHistoryToUpdate.RecordsSkipped = result.RecordsSkipped;
                    syncHistoryToUpdate.SyncDetails = result.Details != null ? JsonSerializer.Serialize(result.Details) : null;

                    // Update tenant plugin
                    tenantPluginToUpdate.SyncStatus = result.Success ? SyncStatuses.COMPLETED : SyncStatuses.ERROR;
                    tenantPluginToUpdate.SyncError = result.ErrorMessage;
                    tenantPluginToUpdate.LastSync = DateTime.UtcNow;
                    tenantPluginToUpdate.Updated = DateTime.UtcNow;

                    await context.SaveChangesAsync();
                    _logger.LogInformation("🔄 [SYNC DEBUG] Successfully saved sync results to database");
                }
                else
                {
                    _logger.LogError("🔄 [SYNC DEBUG] Failed to reload entities from database - SyncHistory: {SyncHistoryFound}, TenantPlugin: {TenantPluginFound}",
                        syncHistoryToUpdate != null, tenantPluginToUpdate != null);
                }

                _logger.LogInformation("Sync completed for plugin {PluginName} - Success: {Success}, Records: {Records}",
                    tenantPlugin.Plugin.Name, result.Success, result.RecordsProcessed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🔄 [SYNC DEBUG] CRITICAL: Exception in ExecuteSyncAsync for plugin {TenantPluginId}", tenantPlugin.TenantPluginId);
                _logger.LogError(ex, "🔄 [SYNC DEBUG] Exception Type: {ExceptionType}", ex.GetType().Name);
                _logger.LogError(ex, "🔄 [SYNC DEBUG] Exception Message: {ExceptionMessage}", ex.Message);
                _logger.LogError(ex, "🔄 [SYNC DEBUG] Stack Trace: {StackTrace}", ex.StackTrace);

                try
                {
                    _logger.LogInformation("🔄 [SYNC DEBUG] Updating sync history with error...");

                    // Create a new scope for error handling database operations
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<AuthDbContext>();

                    // Reload entities in new context to update them
                    var syncHistoryToUpdate = await context.PluginSyncHistory.FindAsync(syncHistory.SyncHistoryId);
                    var tenantPluginToUpdate = await context.TenantPlugins.FindAsync(tenantPlugin.TenantPluginId);

                    if (syncHistoryToUpdate != null && tenantPluginToUpdate != null)
                    {
                        // Update records with error
                        syncHistoryToUpdate.EndTime = DateTime.UtcNow;
                        syncHistoryToUpdate.Status = SyncHistoryStatuses.FAILED;
                        syncHistoryToUpdate.ErrorMessage = ex.Message;

                        tenantPluginToUpdate.SyncStatus = SyncStatuses.ERROR;
                        tenantPluginToUpdate.SyncError = ex.Message;
                        tenantPluginToUpdate.Updated = DateTime.UtcNow;

                        await context.SaveChangesAsync();
                        _logger.LogInformation("🔄 [SYNC DEBUG] Successfully updated sync history with error");
                    }
                    else
                    {
                        _logger.LogError("🔄 [SYNC DEBUG] Failed to reload entities for error handling - SyncHistory: {SyncHistoryFound}, TenantPlugin: {TenantPluginFound}",
                            syncHistoryToUpdate != null, tenantPluginToUpdate != null);
                    }
                }
                catch (Exception saveEx)
                {
                    _logger.LogError(saveEx, "🔄 [SYNC DEBUG] CRITICAL: Failed to save error to database - {SaveException}", saveEx.Message);
                }
            }
        }

        public async Task<IEnumerable<PluginSyncHistory>> GetSyncHistoryAsync(Guid tenantPluginId, int limit = 10)
        {
            return await _context.PluginSyncHistory
                .Include(psh => psh.CreatedByUser)
                .Where(psh => psh.TenantPluginId == tenantPluginId)
                .OrderByDescending(psh => psh.StartTime)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<PluginSyncHistory?> GetLatestSyncAsync(Guid tenantPluginId)
        {
            return await _context.PluginSyncHistory
                .Include(psh => psh.CreatedByUser)
                .Where(psh => psh.TenantPluginId == tenantPluginId)
                .OrderByDescending(psh => psh.StartTime)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> TestConnectionAsync(Guid tenantPluginId)
        {
            try
            {
                var tenantPlugin = await GetTenantPluginAsync(tenantPluginId);
                if (tenantPlugin == null)
                {
                    return false;
                }

                if (!_processors.ContainsKey(tenantPlugin.Plugin.Name))
                {
                    _logger.LogWarning("No processor found for plugin {PluginName}", tenantPlugin.Plugin.Name);
                    return false;
                }

                var processor = _processors[tenantPlugin.Plugin.Name];
                return await processor.TestConnectionAsync(
                    tenantPlugin.Configuration ?? string.Empty,
                    tenantPlugin.AuthData ?? string.Empty);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing connection for plugin {TenantPluginId}", tenantPluginId);
                return false;
            }
        }
    }
}