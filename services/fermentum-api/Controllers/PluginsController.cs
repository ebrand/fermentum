using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text;
using Fermentum.Auth.Services;
using Fermentum.Auth.Models.DTOs;
using FermentumApi.DTOs;
using FermentumApi.Models;
using System.Text.Json;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PluginsController : ControllerBase
    {
        private readonly IPluginService _pluginService;
        private readonly ILogger<PluginsController> _logger;

        public PluginsController(
            IPluginService pluginService,
            ILogger<PluginsController> logger)
        {
            _pluginService = pluginService;
            _logger = logger;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            {
                return null;
            }
            return userId;
        }

        private Guid? GetCurrentTenantId()
        {
            // First try to get tenant ID from JWT claims
            var tenantIdClaim = User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out Guid tenantIdFromClaim))
            {
                return tenantIdFromClaim;
            }

            // Fallback to X-Tenant-Id header (used by frontend)
            if (Request.Headers.ContainsKey("X-Tenant-Id"))
            {
                var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
                if (!string.IsNullOrEmpty(tenantIdHeader) && Guid.TryParse(tenantIdHeader, out Guid tenantIdFromHeader))
                {
                    return tenantIdFromHeader;
                }
            }

            return null;
        }

        // GET: api/plugins
        [HttpGet]
        public async Task<ActionResult> GetAvailablePlugins()
        {
            try
            {
                var plugins = await _pluginService.GetAvailablePluginsAsync();
                var pluginDtos = plugins.Select(p => new PluginDto
                {
                    PluginId = p.PluginId,
                    Name = p.Name,
                    DisplayName = p.DisplayName,
                    Description = p.Description,
                    Version = p.Version,
                    Author = p.Author,
                    Category = p.Category,
                    IsActive = p.IsActive,
                    RequiresAuth = p.RequiresAuth,
                    AuthType = p.AuthType,
                    ConfigurationSchema = string.IsNullOrEmpty(p.ConfigurationSchema)
                        ? null
                        : JsonSerializer.Deserialize<object>(p.ConfigurationSchema),
                    Created = p.Created,
                    Updated = p.Updated
                });

                return Ok(new { success = true, data = pluginDtos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available plugins");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/plugins/tenant
        [HttpGet("tenant")]
        public async Task<ActionResult> GetTenantPlugins()
        {
            try
            {
                var tenantId = GetCurrentTenantId();
                if (!tenantId.HasValue)
                {
                    return BadRequest(new { success = false, message = "No active tenant found" });
                }

                var tenantPlugins = await _pluginService.GetTenantPluginsAsync(tenantId.Value);
                var tenantPluginDtos = tenantPlugins.Select(tp => new TenantPluginDto
                {
                    TenantPluginId = tp.TenantPluginId,
                    TenantId = tp.TenantId,
                    Plugin = new PluginDto
                    {
                        PluginId = tp.Plugin.PluginId,
                        Name = tp.Plugin.Name,
                        DisplayName = tp.Plugin.DisplayName,
                        Description = tp.Plugin.Description,
                        Version = tp.Plugin.Version,
                        Author = tp.Plugin.Author,
                        Category = tp.Plugin.Category,
                        IsActive = tp.Plugin.IsActive,
                        RequiresAuth = tp.Plugin.RequiresAuth,
                        AuthType = tp.Plugin.AuthType,
                        ConfigurationSchema = string.IsNullOrEmpty(tp.Plugin.ConfigurationSchema)
                            ? null
                            : JsonSerializer.Deserialize<object>(tp.Plugin.ConfigurationSchema),
                        Created = tp.Plugin.Created,
                        Updated = tp.Plugin.Updated
                    },
                    IsEnabled = tp.IsEnabled,
                    Configuration = string.IsNullOrEmpty(tp.Configuration)
                        ? null
                        : JsonSerializer.Deserialize<object>(tp.Configuration),
                    LastSync = tp.LastSync,
                    SyncStatus = tp.SyncStatus,
                    SyncError = tp.SyncError,
                    Created = tp.Created,
                    Updated = tp.Updated,
                    CreatedByName = $"{tp.CreatedByUser.FirstName} {tp.CreatedByUser.LastName}".Trim(),
                    UpdatedByName = $"{tp.UpdatedByUser.FirstName} {tp.UpdatedByUser.LastName}".Trim()
                });

                return Ok(new { success = true, data = tenantPluginDtos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tenant plugins");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/plugins/install
        [HttpPost("install")]
        public async Task<ActionResult> InstallPlugin([FromBody] InstallPluginRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var tenantId = GetCurrentTenantId();

                if (!currentUserId.HasValue || !tenantId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Authentication required" });
                }

                var configurationJson = request.Configuration != null
                    ? JsonSerializer.Serialize(request.Configuration)
                    : null;

                var tenantPlugin = await _pluginService.InstallPluginAsync(
                    tenantId.Value,
                    request.PluginId,
                    configurationJson,
                    currentUserId.Value);

                if (tenantPlugin == null)
                {
                    return BadRequest(new { success = false, message = "Failed to install plugin" });
                }

                var result = new TenantPluginDto
                {
                    TenantPluginId = tenantPlugin.TenantPluginId,
                    TenantId = tenantPlugin.TenantId,
                    Plugin = new PluginDto
                    {
                        PluginId = tenantPlugin.Plugin.PluginId,
                        Name = tenantPlugin.Plugin.Name,
                        DisplayName = tenantPlugin.Plugin.DisplayName,
                        Description = tenantPlugin.Plugin.Description,
                        Version = tenantPlugin.Plugin.Version,
                        Author = tenantPlugin.Plugin.Author,
                        Category = tenantPlugin.Plugin.Category,
                        IsActive = tenantPlugin.Plugin.IsActive,
                        RequiresAuth = tenantPlugin.Plugin.RequiresAuth,
                        AuthType = tenantPlugin.Plugin.AuthType,
                        Created = tenantPlugin.Plugin.Created,
                        Updated = tenantPlugin.Plugin.Updated
                    },
                    IsEnabled = tenantPlugin.IsEnabled,
                    Configuration = string.IsNullOrEmpty(tenantPlugin.Configuration)
                        ? null
                        : JsonSerializer.Deserialize<object>(tenantPlugin.Configuration),
                    LastSync = tenantPlugin.LastSync,
                    SyncStatus = tenantPlugin.SyncStatus,
                    SyncError = tenantPlugin.SyncError,
                    Created = tenantPlugin.Created,
                    Updated = tenantPlugin.Updated,
                    CreatedByName = $"{tenantPlugin.CreatedByUser.FirstName} {tenantPlugin.CreatedByUser.LastName}".Trim(),
                    UpdatedByName = $"{tenantPlugin.UpdatedByUser.FirstName} {tenantPlugin.UpdatedByUser.LastName}".Trim()
                };

                return Ok(new { success = true, data = result, message = "Plugin installed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error installing plugin");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/plugins/quickbooks/oauth-url
        [HttpGet("quickbooks/oauth-url")]
        public async Task<ActionResult> GetQuickBooksOAuthUrl()
        {
            try
            {
                var tenantId = GetCurrentTenantId();
                var userId = GetCurrentUserId();

                if (!tenantId.HasValue || !userId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Authentication required" });
                }

                // Get the QuickBooks plugin
                var plugin = await _pluginService.GetPluginByNameAsync("quickbooks-online");
                if (plugin == null)
                {
                    return BadRequest(new { success = false, message = "QuickBooks Online plugin not found" });
                }

                // Generate state parameter that includes tenant and user info
                var state = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{tenantId.Value}:{userId.Value}:{DateTime.UtcNow.Ticks}"));

                // Get the processor to generate OAuth URL
                var processor = HttpContext.RequestServices.GetService<Fermentum.Auth.Services.Plugins.QuickBooksOnlineProcessor>();
                if (processor == null)
                {
                    return StatusCode(500, new { success = false, message = "QuickBooks processor not available" });
                }

                var oauthUrl = processor.GenerateOAuthUrl(state);

                return Ok(new {
                    success = true,
                    oauthUrl = oauthUrl,
                    state = state,
                    message = "OAuth URL generated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating QuickBooks OAuth URL");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/plugins/quickbooks/oauth-callback
        [HttpPost("quickbooks/oauth-callback")]
        [AllowAnonymous] // Allow anonymous access for OAuth callback
        public async Task<ActionResult> HandleQuickBooksOAuthCallback([FromBody] QuickBooksOAuthCallbackRequest request)
        {
            try
            {
                // Decode state parameter
                var stateBytes = Convert.FromBase64String(request.State);
                var stateString = Encoding.UTF8.GetString(stateBytes);
                var stateParts = stateString.Split(':');

                if (stateParts.Length != 3 ||
                    !Guid.TryParse(stateParts[0], out var tenantId) ||
                    !Guid.TryParse(stateParts[1], out var userId))
                {
                    return BadRequest(new { success = false, message = "Invalid state parameter" });
                }

                // Get the processor to exchange code for tokens
                var processor = HttpContext.RequestServices.GetService<Fermentum.Auth.Services.Plugins.QuickBooksOnlineProcessor>();
                if (processor == null)
                {
                    return StatusCode(500, new { success = false, message = "QuickBooks processor not available" });
                }

                var tokenResponse = await processor.ExchangeCodeForTokensAsync(request.Code, request.RealmId);
                if (tokenResponse == null)
                {
                    return BadRequest(new { success = false, message = "Failed to exchange authorization code for tokens" });
                }

                // Check if QuickBooks plugin is already installed for this tenant
                var tenantPlugins = await _pluginService.GetTenantPluginsAsync(tenantId);
                var qboPlugin = tenantPlugins.FirstOrDefault(tp => tp.Plugin.Name == "quickbooks-online");

                if (qboPlugin == null)
                {
                    // Install the plugin first
                    var plugin = await _pluginService.GetPluginByNameAsync("quickbooks-online");
                    if (plugin == null)
                    {
                        return BadRequest(new { success = false, message = "QuickBooks Online plugin not found" });
                    }

                    // Create default configuration
                    var defaultConfig = new
                    {
                        SyncFrequency = "daily",
                        SyncTypes = new[] { "customers", "accounts" },
                        DateRange = 90
                    };

                    qboPlugin = await _pluginService.InstallPluginAsync(
                        tenantId,
                        plugin.PluginId,
                        JsonSerializer.Serialize(defaultConfig),
                        userId);

                    if (qboPlugin == null)
                    {
                        return BadRequest(new { success = false, message = "Failed to install QuickBooks plugin" });
                    }
                }

                // Update auth data
                var authData = new
                {
                    AccessToken = tokenResponse.AccessToken,
                    RefreshToken = tokenResponse.RefreshToken,
                    RealmId = tokenResponse.RealmId,
                    ExpiresAt = tokenResponse.ExpiresAt.ToString("O")
                };

                var authSuccess = await _pluginService.UpdatePluginAuthDataAsync(
                    qboPlugin.TenantPluginId,
                    JsonSerializer.Serialize(authData),
                    userId);

                if (!authSuccess)
                {
                    return BadRequest(new { success = false, message = "Failed to save authentication data" });
                }

                return Ok(new {
                    success = true,
                    message = "QuickBooks Online connected successfully",
                    tenantPluginId = qboPlugin.TenantPluginId,
                    realmId = request.RealmId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling QuickBooks OAuth callback");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // DELETE: api/plugins/{tenantPluginId}
        [HttpDelete("{tenantPluginId}")]
        public async Task<ActionResult> UninstallPlugin(Guid tenantPluginId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Authentication required" });
                }

                var success = await _pluginService.UninstallPluginAsync(tenantPluginId, currentUserId.Value);
                if (!success)
                {
                    return BadRequest(new { success = false, message = "Failed to uninstall plugin" });
                }

                return Ok(new { success = true, message = "Plugin uninstalled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uninstalling plugin {TenantPluginId}", tenantPluginId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/plugins/{tenantPluginId}/enable
        [HttpPut("{tenantPluginId}/enable")]
        public async Task<ActionResult> EnablePlugin(Guid tenantPluginId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Authentication required" });
                }

                var success = await _pluginService.EnablePluginAsync(tenantPluginId, currentUserId.Value);
                if (!success)
                {
                    return BadRequest(new { success = false, message = "Failed to enable plugin" });
                }

                return Ok(new { success = true, message = "Plugin enabled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enabling plugin {TenantPluginId}", tenantPluginId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/plugins/{tenantPluginId}/disable
        [HttpPut("{tenantPluginId}/disable")]
        public async Task<ActionResult> DisablePlugin(Guid tenantPluginId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Authentication required" });
                }

                var success = await _pluginService.DisablePluginAsync(tenantPluginId, currentUserId.Value);
                if (!success)
                {
                    return BadRequest(new { success = false, message = "Failed to disable plugin" });
                }

                return Ok(new { success = true, message = "Plugin disabled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disabling plugin {TenantPluginId}", tenantPluginId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/plugins/{tenantPluginId}/configuration
        [HttpPut("{tenantPluginId}/configuration")]
        public async Task<ActionResult> UpdateConfiguration(Guid tenantPluginId, [FromBody] UpdatePluginConfigurationRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Authentication required" });
                }

                var configurationJson = JsonSerializer.Serialize(request.Configuration);

                var success = await _pluginService.UpdatePluginConfigurationAsync(
                    tenantPluginId,
                    configurationJson,
                    currentUserId.Value);

                if (!success)
                {
                    return BadRequest(new { success = false, message = "Failed to update plugin configuration" });
                }

                return Ok(new { success = true, message = "Plugin configuration updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating plugin configuration {TenantPluginId}", tenantPluginId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/plugins/{tenantPluginId}/auth
        [HttpPut("{tenantPluginId}/auth")]
        public async Task<ActionResult> UpdateAuth(Guid tenantPluginId, [FromBody] UpdatePluginAuthRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Authentication required" });
                }

                var authDataJson = JsonSerializer.Serialize(request.AuthData);

                var success = await _pluginService.UpdatePluginAuthDataAsync(
                    tenantPluginId,
                    authDataJson,
                    currentUserId.Value);

                if (!success)
                {
                    return BadRequest(new { success = false, message = "Failed to update plugin authentication" });
                }

                return Ok(new { success = true, message = "Plugin authentication updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating plugin auth {TenantPluginId}", tenantPluginId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/plugins/{tenantPluginId}/sync
        [HttpPost("{tenantPluginId}/sync")]
        public async Task<ActionResult> TriggerSync(Guid tenantPluginId, [FromBody] TriggerSyncRequest? request)
        {
            _logger.LogInformation("🚀 [CONTROLLER DEBUG] TriggerSync method START");
            _logger.LogInformation("🚀 [CONTROLLER DEBUG] Raw tenantPluginId parameter: '{TenantPluginId}'", tenantPluginId);
            _logger.LogInformation("🚀 [CONTROLLER DEBUG] Request body: {@Request}", request);
            _logger.LogInformation("🚀 [CONTROLLER DEBUG] User identity: {@User}", User?.Identity);
            _logger.LogInformation("🚀 [CONTROLLER DEBUG] User claims: {@Claims}", User?.Claims?.Select(c => new { c.Type, c.Value }).ToArray());

            // Log all request headers for debugging
            _logger.LogInformation("🚀 [CONTROLLER DEBUG] Request headers:");
            foreach (var header in Request.Headers)
            {
                _logger.LogInformation("🚀 [CONTROLLER DEBUG] Header: {Key} = {Value}", header.Key, string.Join(", ", header.Value));
            }

            try
            {
                _logger.LogInformation("💫 [SYNC DEBUG] TriggerSync called with tenantPluginId: {TenantPluginId}, request: {@Request}", tenantPluginId, request);

                // Validate GUID parameter
                if (tenantPluginId == Guid.Empty)
                {
                    _logger.LogWarning("🚀 [CONTROLLER DEBUG] tenantPluginId is empty GUID");
                    return BadRequest(new { success = false, message = "Invalid tenant plugin ID" });
                }

                var currentUserId = GetCurrentUserId();
                var currentTenantId = GetCurrentTenantId();

                _logger.LogInformation("🚀 [CONTROLLER DEBUG] CurrentUserId: {UserId}, CurrentTenantId: {TenantId}", currentUserId, currentTenantId);

                if (!currentUserId.HasValue)
                {
                    _logger.LogWarning("💫 [SYNC DEBUG] Authentication required - no currentUserId");
                    return BadRequest(new { success = false, message = "Authentication required" });
                }

                if (!currentTenantId.HasValue)
                {
                    _logger.LogWarning("🚀 [CONTROLLER DEBUG] No tenant ID found in claims or headers");
                    return BadRequest(new { success = false, message = "No active tenant found" });
                }

                if (request == null)
                {
                    _logger.LogWarning("💫 [SYNC DEBUG] Request is null, using default syncType 'manual'");
                    request = new TriggerSyncRequest { SyncType = "manual" };
                }

                _logger.LogInformation("💫 [SYNC DEBUG] About to call TriggerSyncAsync with userId: {UserId}, syncType: {SyncType}", currentUserId.Value, request.SyncType);

                var success = await _pluginService.TriggerSyncAsync(
                    tenantPluginId,
                    currentUserId.Value,
                    request.SyncType);

                _logger.LogInformation("💫 [SYNC DEBUG] TriggerSyncAsync returned: {Success}", success);

                if (!success)
                {
                    return BadRequest(new { success = false, message = "Failed to trigger sync" });
                }

                return Ok(new { success = true, message = "Sync triggered successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🚀 [CONTROLLER DEBUG] Exception in TriggerSync for plugin {TenantPluginId}", tenantPluginId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/plugins/{tenantPluginId}/sync-history
        [HttpGet("{tenantPluginId}/sync-history")]
        public async Task<ActionResult> GetSyncHistory(Guid tenantPluginId, [FromQuery] int limit = 10)
        {
            try
            {
                var syncHistory = await _pluginService.GetSyncHistoryAsync(tenantPluginId, limit);
                var syncHistoryDtos = syncHistory.Select(sh => new PluginSyncHistoryDto
                {
                    SyncHistoryId = sh.SyncHistoryId,
                    SyncType = sh.SyncType,
                    Status = sh.Status,
                    StartTime = sh.StartTime,
                    EndTime = sh.EndTime,
                    RecordsProcessed = sh.RecordsProcessed,
                    RecordsInserted = sh.RecordsInserted,
                    RecordsUpdated = sh.RecordsUpdated,
                    RecordsSkipped = sh.RecordsSkipped,
                    ErrorMessage = sh.ErrorMessage,
                    SyncDetails = string.IsNullOrEmpty(sh.SyncDetails)
                        ? null
                        : JsonSerializer.Deserialize<object>(sh.SyncDetails),
                    CreatedByName = $"{sh.CreatedByUser.FirstName} {sh.CreatedByUser.LastName}".Trim()
                });

                return Ok(new { success = true, data = syncHistoryDtos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sync history for plugin {TenantPluginId}", tenantPluginId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/plugins/{tenantPluginId}/test-connection
        [HttpGet("{tenantPluginId}/test-connection")]
        public async Task<ActionResult> TestConnection(Guid tenantPluginId)
        {
            try
            {
                var success = await _pluginService.TestConnectionAsync(tenantPluginId);
                return Ok(new { success = success, message = success ? "Connection test successful" : "Connection test failed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing connection for plugin {TenantPluginId}", tenantPluginId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

    }
}