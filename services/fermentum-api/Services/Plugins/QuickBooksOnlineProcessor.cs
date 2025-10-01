using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Fermentum.Auth.Data;
using Fermentum.Auth.Interfaces;
using Fermentum.Auth.Services;
using FermentumApi.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http;
using System.Text;
using System.Globalization;
using System.Web;
using Intuit.Ipp.Core;
using Intuit.Ipp.Data;
using Intuit.Ipp.QueryFilter;
using Intuit.Ipp.Security;
using Intuit.Ipp.OAuth2PlatformClient;

namespace Fermentum.Auth.Services.Plugins
{
    public class QuickBooksOnlineProcessor : IPluginProcessor
    {
        public string PluginName => "quickbooks-online";

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<QuickBooksOnlineProcessor> _logger;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _redirectUri;
        private readonly string _scope;
        private readonly string _baseUrl;

        private readonly IServiceScopeFactory _scopeFactory;

        public QuickBooksOnlineProcessor(
            IServiceProvider serviceProvider,
            IServiceScopeFactory scopeFactory,
            ILogger<QuickBooksOnlineProcessor> logger,
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _scopeFactory = scopeFactory;
            _logger = logger;
            _httpClient = httpClient;
            _configuration = configuration;

            // Load configuration from appsettings.json
            _clientId = _configuration["QuickBooksOnline:ClientId"] ?? throw new InvalidOperationException("QuickBooks ClientId not configured");
            _clientSecret = _configuration["QuickBooksOnline:ClientSecret"] ?? throw new InvalidOperationException("QuickBooks ClientSecret not configured");
            _redirectUri = _configuration["QuickBooksOnline:RedirectUri"] ?? "https://localhost:3000/oauth/quickbooks/callback";
            _baseUrl = _configuration["QuickBooksOnline:BaseUrl"] ?? "https://sandbox-quickbooks.api.intuit.com";
            // Enhanced OAuth scope to ensure Payment access
            _scope = "com.intuit.quickbooks.accounting";
        }

        public async Task<bool> ValidateConfigurationAsync(string configuration)
        {
            try
            {
                _logger.LogInformation("QuickBooks: Validating configuration: {Configuration}", configuration);

                if (string.IsNullOrEmpty(configuration))
                {
                    _logger.LogWarning("QuickBooks: Configuration is null or empty");
                    return false;
                }

                QBOConfiguration config = null;

                // First try to parse as wrapped configuration (from frontend)
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                try
                {
                    var wrappedConfig = JsonSerializer.Deserialize<JsonElement>(configuration);
                    if (wrappedConfig.TryGetProperty("configuration", out JsonElement configElement))
                    {
                        _logger.LogInformation("QuickBooks: Found wrapped configuration, extracting...");
                        var configJson = configElement.GetRawText();
                        config = JsonSerializer.Deserialize<QBOConfiguration>(configJson, jsonOptions);
                    }
                    else
                    {
                        // Try direct deserialization
                        config = JsonSerializer.Deserialize<QBOConfiguration>(configuration, jsonOptions);
                    }
                }
                catch
                {
                    // Fallback to direct deserialization
                    config = JsonSerializer.Deserialize<QBOConfiguration>(configuration, jsonOptions);
                }

                if (config == null)
                {
                    _logger.LogWarning("QuickBooks: Failed to deserialize configuration");
                    return false;
                }

                _logger.LogInformation("QuickBooks: Parsed config - SyncFrequency: {SyncFrequency}, SyncTypes: {SyncTypes}, DateRange: {DateRange}",
                    config.SyncFrequency,
                    config.SyncTypes != null ? string.Join(",", config.SyncTypes) : "null",
                    config.DateRange);

                var isValid = !string.IsNullOrEmpty(config.SyncFrequency) &&
                             config.SyncTypes != null &&
                             config.SyncTypes.Length > 0 &&
                             config.DateRange > 0 &&
                             config.DateRange <= 365;

                if (!isValid)
                {
                    _logger.LogWarning("QuickBooks: Configuration validation failed - SyncFrequency: {HasSyncFrequency}, SyncTypes: {HasSyncTypes} ({Count}), DateRange: {DateRange} (Valid: {ValidDateRange})",
                        !string.IsNullOrEmpty(config.SyncFrequency),
                        config.SyncTypes != null,
                        config.SyncTypes?.Length ?? 0,
                        config.DateRange,
                        config.DateRange > 0 && config.DateRange <= 365);
                }
                else
                {
                    _logger.LogInformation("QuickBooks: Configuration validation successful!");
                }

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating QuickBooks Online configuration: {Configuration}", configuration);
                return false;
            }
        }

        public string GenerateOAuthUrl(string state)
        {
            var oauthUrl = "https://appcenter.intuit.com/connect/oauth2";
            var queryParams = HttpUtility.ParseQueryString(string.Empty);

            queryParams["client_id"] = _clientId;
            queryParams["scope"] = _scope;
            queryParams["redirect_uri"] = _redirectUri;
            queryParams["response_type"] = "code";
            queryParams["access_type"] = "offline";
            queryParams["state"] = state;

            return $"{oauthUrl}?{queryParams}";
        }

        public async Task<QBOTokenResponse?> ExchangeCodeForTokensAsync(string code, string realmId)
        {
            try
            {
                var tokenEndpoint = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

                var requestData = new Dictionary<string, string>
                {
                    {"grant_type", "authorization_code"},
                    {"code", code},
                    {"redirect_uri", _redirectUri}
                };

                var requestContent = new FormUrlEncodedContent(requestData);

                // Add basic authentication header
                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_clientId}:{_clientSecret}"));
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Basic {credentials}");
                _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                var response = await _httpClient.PostAsync(tokenEndpoint, requestContent);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Token exchange failed: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    return null;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var tokenResponse = JsonSerializer.Deserialize<QBOTokenResponse>(responseContent);

                if (tokenResponse != null)
                {
                    tokenResponse.RealmId = realmId;
                    tokenResponse.ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);
                }

                return tokenResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exchanging code for tokens");
                return null;
            }
        }

        public async Task<bool> ValidateAuthDataAsync(string authData)
        {
            try
            {
                if (string.IsNullOrEmpty(authData))
                {
                    _logger.LogWarning("QuickBooks auth data is null or empty");
                    return false;
                }

                _logger.LogInformation("Validating QuickBooks auth data: {AuthData}", authData);

                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var auth = JsonSerializer.Deserialize<QBOAuthData>(authData, jsonOptions);
                if (auth == null)
                {
                    _logger.LogWarning("QuickBooks auth data failed to deserialize");
                    return false;
                }

                // Skip validation for very fresh tokens (received in last 5 minutes)
                // This prevents unnecessary refresh attempts on tokens just received from OAuth
                var tokenAge = DateTime.UtcNow - auth.ExpiresAtDateTime.AddHours(-1); // QBO tokens expire in 1 hour
                if (tokenAge < TimeSpan.FromMinutes(5))
                {
                    _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Token is very fresh (age: {TokenAge}), skipping validation to avoid unnecessary refresh", tokenAge);
                    return !string.IsNullOrEmpty(auth.AccessToken) &&
                           !string.IsNullOrEmpty(auth.RefreshToken) &&
                           !string.IsNullOrEmpty(auth.RealmId);
                }

                // Check if token is expired and needs refresh
                if (auth.ExpiresAtDateTime < DateTime.UtcNow.AddMinutes(-5)) // 5-minute buffer
                {
                    _logger.LogInformation("Access token is expired, attempting refresh");
                    var refreshedAuth = await RefreshTokenAsync(auth);
                    if (refreshedAuth == null)
                    {
                        _logger.LogWarning("Failed to refresh expired token");
                        return false;
                    }
                    // Auth data should be updated by the caller after successful refresh
                }

                var isValid = !string.IsNullOrEmpty(auth.AccessToken) &&
                             !string.IsNullOrEmpty(auth.RefreshToken) &&
                             !string.IsNullOrEmpty(auth.RealmId);

                if (!isValid)
                {
                    _logger.LogWarning("QuickBooks auth validation failed - AccessToken: {HasAccessToken}, RefreshToken: {HasRefreshToken}, RealmId: {HasRealmId}",
                        !string.IsNullOrEmpty(auth.AccessToken),
                        !string.IsNullOrEmpty(auth.RefreshToken),
                        !string.IsNullOrEmpty(auth.RealmId));
                }

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating QuickBooks Online auth data: {AuthData}", authData);
                return false;
            }
        }

        private async System.Threading.Tasks.Task UpdateAuthDataInDatabaseAsync(AuthDbContext context, Guid tenantId, QBOAuthData authData)
        {
            try
            {
                _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Updating auth data in database for tenant {TenantId}", tenantId);

                var tenantPlugin = await context.TenantPlugins
                    .FirstOrDefaultAsync(tp => tp.TenantId == tenantId && tp.Plugin.Name == PluginName);

                if (tenantPlugin != null)
                {
                    var jsonOptions = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    tenantPlugin.AuthData = JsonSerializer.Serialize(authData, jsonOptions);
                    tenantPlugin.Updated = DateTime.UtcNow;

                    await context.SaveChangesAsync();
                    _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Successfully updated auth data in database");
                }
                else
                {
                    _logger.LogWarning("🔄 [QBO TOKEN DEBUG] TenantPlugin not found for tenant {TenantId}", tenantId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🔄 [QBO TOKEN DEBUG] Failed to update auth data in database");
            }
        }

        private async System.Threading.Tasks.Task<QBOAuthData?> RefreshTokenAsync(QBOAuthData authData)
        {
            try
            {
                _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Starting token refresh");
                _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Refresh token length: {RefreshTokenLength}", authData.RefreshToken?.Length ?? 0);

                var tokenEndpoint = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
                _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Token endpoint: {TokenEndpoint}", tokenEndpoint);

                var requestData = new Dictionary<string, string>
                {
                    {"grant_type", "refresh_token"},
                    {"refresh_token", authData.RefreshToken}
                };

                var requestContent = new FormUrlEncodedContent(requestData);

                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_clientId}:{_clientSecret}"));

                // Use a dedicated HttpClient to avoid ObjectDisposedException from scoped dependencies
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Basic {credentials}");
                httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Sending token refresh request...");
                var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

                _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Token refresh response:");
                _logger.LogInformation("🔄 [QBO TOKEN DEBUG]   Status Code: {StatusCode}", response.StatusCode);
                _logger.LogInformation("🔄 [QBO TOKEN DEBUG]   Status: {ReasonPhrase}", response.ReasonPhrase);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("🔄 [QBO TOKEN DEBUG] Token refresh failed:");
                    _logger.LogError("🔄 [QBO TOKEN DEBUG]   Status: {StatusCode} - {ReasonPhrase}", response.StatusCode, response.ReasonPhrase);
                    _logger.LogError("🔄 [QBO TOKEN DEBUG]   Error content: {ErrorContent}", errorContent);
                    return null;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Token refresh response content length: {ContentLength}", responseContent.Length);

                var tokenResponse = JsonSerializer.Deserialize<QBOTokenResponse>(responseContent);
                _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Deserialized token response successfully");

                if (tokenResponse != null)
                {
                    _logger.LogInformation("🔄 [QBO TOKEN DEBUG] New access token length: {AccessTokenLength}", tokenResponse.AccessToken?.Length ?? 0);
                    _logger.LogInformation("🔄 [QBO TOKEN DEBUG] New refresh token length: {RefreshTokenLength}", tokenResponse.RefreshToken?.Length ?? 0);
                    _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Token expires in: {ExpiresIn} seconds", tokenResponse.ExpiresIn);

                    var newAuthData = new QBOAuthData
                    {
                        AccessToken = tokenResponse.AccessToken,
                        RefreshToken = tokenResponse.RefreshToken ?? authData.RefreshToken, // Keep old refresh token if not provided
                        RealmId = authData.RealmId,
                        ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn).ToString("O")
                    };

                    _logger.LogInformation("🔄 [QBO TOKEN DEBUG] Token refresh completed successfully");
                    return newAuthData;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing QuickBooks token");
                return null;
            }
        }

        public async Task<bool> TestConnectionAsync(string configuration, string authData)
        {
            try
            {
                var auth = JsonSerializer.Deserialize<QBOAuthData>(authData);
                if (auth == null)
                {
                    return false;
                }

                // Test by making a simple API call to get company info
                var requestUrl = $"{_baseUrl}/v3/company/{auth.RealmId}/companyinfo/{auth.RealmId}";

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {auth.AccessToken}");
                _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                var response = await _httpClient.GetAsync(requestUrl);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("QuickBooks connection test failed: {StatusCode} - {Content}", response.StatusCode, errorContent);
                }

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing QuickBooks Online connection");
                return false;
            }
        }

        public async Task<SyncResult> SyncDataAsync(Guid tenantId, string configuration, string authData, string syncType, Guid userId)
        {
            var result = new SyncResult();

            try
            {
                _logger.LogInformation("🔄 [QBO SYNC DEBUG] === SYNC METHOD START ===");
                _logger.LogInformation("🔄 [QBO SYNC DEBUG] About to create scope from scope factory");

                // Create a new scope for background sync operations to avoid DbContext disposal issues
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
                var syncLogger = scope.ServiceProvider.GetRequiredService<IPluginSyncLogger>();

                _logger.LogInformation("🔄 [QBO SYNC DEBUG] Successfully created DbContext from new scope");

                // Find the current sync history record for detailed logging (initialize outside inner try block)
                var syncHistory = await context.PluginSyncHistory
                    .Where(sh => sh.TenantPlugin.TenantId == tenantId &&
                                sh.TenantPlugin.Plugin.Name == "quickbooks-online" &&
                                sh.Status == "started")
                    .OrderByDescending(sh => sh.StartTime)
                    .FirstOrDefaultAsync();

                var syncHistoryId = syncHistory?.SyncHistoryId ?? Guid.Empty;
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Found sync history ID: {SyncHistoryId}", syncHistoryId);

            try
            {
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] ===============================================");
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Starting QuickBooks Online sync");
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Tenant ID: {TenantId}", tenantId);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] User ID: {UserId}", userId);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Sync Type: {SyncType}", syncType);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Configuration length: {ConfigLength}", configuration?.Length ?? 0);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Auth data length: {AuthDataLength}", authData?.Length ?? 0);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] ===============================================");

                // Log initialization step
                var initStepId = await syncLogger.LogStepAsync(syncHistoryId, "Initialize Sync", 1, "started",
                    $"Starting {syncType} sync for tenant {tenantId}", new { tenantId, syncType, userId }, userId);

                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Deserializing configuration and auth data...");
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                var config = JsonSerializer.Deserialize<QBOConfiguration>(configuration, jsonOptions);
                var auth = JsonSerializer.Deserialize<QBOAuthData>(authData, jsonOptions);

                if (config == null || auth == null)
                {
                    _logger.LogError("🔄 [QBO MAIN DEBUG] Deserialization failed - config: {ConfigNull}, auth: {AuthNull}", config == null, auth == null);
                    await syncLogger.FailStepAsync(initStepId, "Configuration parsing failed - invalid configuration or auth data");
                    result.Success = false;
                    result.ErrorMessage = "Invalid configuration or auth data";
                    return result;
                }

                // Complete initialization step
                await syncLogger.CompleteStepAsync(initStepId, "Sync initialized successfully",
                    new { configParsed = true, authParsed = true, syncTypes = config.SyncTypes });

                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Configuration parsed successfully:");
                _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Sync Frequency: {SyncFrequency}", config.SyncFrequency);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Sync Types: {SyncTypes}", config.SyncTypes != null ? string.Join(", ", config.SyncTypes) : "null");
                _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Date Range: {DateRange} days", config.DateRange);

                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Auth data parsed successfully:");
                _logger.LogInformation("🔄 [QBO MAIN DEBUG]   RealmId: {RealmId}", auth.RealmId);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG]   AccessToken length: {TokenLength}", auth.AccessToken?.Length ?? 0);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG]   RefreshToken length: {RefreshTokenLength}", auth.RefreshToken?.Length ?? 0);
                _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Expires at: {ExpiresAt}", auth.ExpiresAt);

                _logger.LogInformation("Starting QuickBooks Online sync for tenant {TenantId}, type: {SyncType}",
                    tenantId, syncType);

                var details = new Dictionary<string, object>();
                int totalProcessed = 0, totalInserted = 0, totalUpdated = 0, totalSkipped = 0;

                // Set tenant context for RLS using the new scoped context
                await context.Database.ExecuteSqlRawAsync($"SET app.current_user_id = '{userId}'");

                // Log data processing step
                var dataProcessStepId = await syncLogger.LogStepAsync(syncHistoryId, "Process Data Types", 2, "started",
                    $"Processing {config.SyncTypes.Length} data types: {string.Join(", ", config.SyncTypes)}",
                    new { dataTypes = config.SyncTypes }, userId);

                // Sync each requested data type
                _logger.LogInformation("🔄 [QBO MAIN DEBUG] Processing {DataTypeCount} sync types", config.SyncTypes.Length);

                int stepOrder = 3;
                foreach (var dataType in config.SyncTypes)
                {
                    _logger.LogInformation("🔄 [QBO MAIN DEBUG] Starting sync for data type: {DataType}", dataType);

                    // Log individual data type step
                    var dataTypeStepId = await syncLogger.LogStepAsync(syncHistoryId, $"Sync {dataType}", stepOrder++, "started",
                        $"Syncing QuickBooks {dataType} data", new { dataType }, userId);

                    var typeResult = await SyncDataTypeAsync(context, tenantId, dataType, auth, config, syncType);

                    _logger.LogInformation("🔄 [QBO MAIN DEBUG] Completed sync for {DataType}:", dataType);
                    _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Success: {Success}", typeResult.Success);
                    _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Processed: {Processed}", typeResult.RecordsProcessed);
                    _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Inserted: {Inserted}", typeResult.RecordsInserted);
                    _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Updated: {Updated}", typeResult.RecordsUpdated);
                    _logger.LogInformation("🔄 [QBO MAIN DEBUG]   Skipped: {Skipped}", typeResult.RecordsSkipped);
                    if (!string.IsNullOrEmpty(typeResult.ErrorMessage))
                    {
                        _logger.LogError("🔄 [QBO MAIN DEBUG]   Error: {Error}", typeResult.ErrorMessage);
                    }

                    details[dataType] = new
                    {
                        processed = typeResult.RecordsProcessed,
                        inserted = typeResult.RecordsInserted,
                        updated = typeResult.RecordsUpdated,
                        skipped = typeResult.RecordsSkipped,
                        error = typeResult.ErrorMessage
                    };

                    totalProcessed += typeResult.RecordsProcessed;
                    totalInserted += typeResult.RecordsInserted;
                    totalUpdated += typeResult.RecordsUpdated;
                    totalSkipped += typeResult.RecordsSkipped;

                    // Complete or fail the data type step
                    if (typeResult.Success)
                    {
                        await syncLogger.CompleteStepAsync(dataTypeStepId,
                            $"Successfully synced {typeResult.RecordsProcessed} {dataType} records",
                            new {
                                processed = typeResult.RecordsProcessed,
                                inserted = typeResult.RecordsInserted,
                                updated = typeResult.RecordsUpdated,
                                skipped = typeResult.RecordsSkipped
                            });
                    }
                    else
                    {
                        await syncLogger.FailStepAsync(dataTypeStepId,
                            typeResult.ErrorMessage ?? $"Failed to sync {dataType}",
                            new { dataType, error = typeResult.ErrorMessage });
                        _logger.LogWarning("Failed to sync {DataType}: {Error}", dataType, typeResult.ErrorMessage);
                    }
                }

                // Complete data processing step
                await syncLogger.CompleteStepAsync(dataProcessStepId,
                    $"Processed all data types - Total: {totalProcessed} records",
                    new {
                        totalProcessed,
                        totalInserted,
                        totalUpdated,
                        totalSkipped,
                        details
                    });

                result.Success = true;
                result.RecordsProcessed = totalProcessed;
                result.RecordsInserted = totalInserted;
                result.RecordsUpdated = totalUpdated;
                result.RecordsSkipped = totalSkipped;
                result.Details = details;

                // Log completion step
                var completionStepId = await syncLogger.LogStepAsync(syncHistoryId, "Sync Completion", stepOrder, "started",
                    "Finalizing sync results", new { totalProcessed, totalInserted, totalUpdated, totalSkipped }, userId);
                await syncLogger.CompleteStepAsync(completionStepId, "Sync completed successfully",
                    new { result.RecordsProcessed, result.RecordsInserted, result.RecordsUpdated, result.RecordsSkipped, result.Details });

                _logger.LogInformation("QuickBooks Online sync completed for tenant {TenantId} - Processed: {Processed}, Inserted: {Inserted}, Updated: {Updated}",
                    tenantId, totalProcessed, totalInserted, totalUpdated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during QuickBooks Online sync for tenant {TenantId}", tenantId);

                // Try to log error step if we have a sync history ID
                try
                {
                    if (syncHistoryId != Guid.Empty)
                    {
                        var errorStepId = await syncLogger.LogStepAsync(syncHistoryId, "Sync Error", 999, "started",
                            "Critical error during sync execution", new { error = ex.Message, exceptionType = ex.GetType().Name }, userId);
                        await syncLogger.FailStepAsync(errorStepId, ex.Message,
                            new { exception = ex.GetType().Name, stackTrace = ex.StackTrace });
                    }
                }
                catch (Exception logEx)
                {
                    _logger.LogError(logEx, "Failed to log sync error to PluginSyncDetail");
                }

                result.Success = false;
                result.ErrorMessage = ex.Message;
            }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🔄 [QBO SYNC DEBUG] CRITICAL: Exception at SyncDataAsync method start - {ExceptionType}: {ExceptionMessage}", ex.GetType().Name, ex.Message);
                _logger.LogError(ex, "🔄 [QBO SYNC DEBUG] Stack trace: {StackTrace}", ex.StackTrace);
                result.Success = false;
                result.ErrorMessage = $"Critical sync error: {ex.Message}";
            }

            return result;
        }

        private async System.Threading.Tasks.Task<SyncResult> SyncDataTypeAsync(AuthDbContext context, Guid tenantId, string dataType, QBOAuthData auth, QBOConfiguration config, string syncType)
        {
            return dataType.ToLower() switch
            {
                "accounts" => await SyncAccountsAsync(context, tenantId, auth, config),
                "customers" => await SyncCustomersAsync(context, tenantId, auth, config),
                "items" => await SyncItemsAsync(context, tenantId, auth, config),
                "invoices" => await SyncInvoicesAsync(context, tenantId, auth, config),
                "payments" => await SyncPaymentsAsync(context, tenantId, auth, config),
                _ => new SyncResult { Success = false, ErrorMessage = $"Unknown data type: {dataType}" }
            };
        }

        private async System.Threading.Tasks.Task<SyncResult> SyncAccountsAsync(AuthDbContext context, Guid tenantId, QBOAuthData auth, QBOConfiguration config)
        {
            var result = new SyncResult();

            try
            {
                _logger.LogInformation("🔧 [QBO SDK] Starting SyncAccountsAsync using QuickBooks SDK for tenant {TenantId}", tenantId);
                _logger.LogInformation("🔧 [QBO SDK] RealmId: {RealmId}", auth.RealmId);
                _logger.LogInformation("🔧 [QBO SDK] AccessToken Length: {TokenLength}", auth.AccessToken?.Length ?? 0);

                // Check token expiration before making API calls
                if (auth.ExpiresAtDateTime < DateTime.UtcNow.AddMinutes(-5))
                {
                    _logger.LogWarning("🔧 [QBO SDK] Access token is expired, attempting refresh before sync");
                    var refreshedAuth = await RefreshTokenAsync(auth);
                    if (refreshedAuth != null)
                    {
                        auth = refreshedAuth;
                        _logger.LogInformation("🔧 [QBO SDK] Token refreshed successfully");

                        // Update the auth data in the database with refreshed tokens
                        await UpdateAuthDataInDatabaseAsync(context, tenantId, auth);
                        _logger.LogInformation("🔧 [QBO SDK] Updated auth data in database with refreshed tokens");
                    }
                    else
                    {
                        _logger.LogError("🔧 [QBO SDK] Failed to refresh expired token");
                        result.Success = false;
                        result.ErrorMessage = "Access token expired and refresh failed";
                        return result;
                    }
                }

                // ✅ NEW: Enhanced debugging for Forbidden errors
                _logger.LogInformation("🔧 [QBO SDK] Pre-sync validation - Testing basic connectivity");

                // First, test basic connectivity with CompanyInfo (lighter endpoint)
                try
                {
                    var testUrl = $"{_baseUrl}/v3/company/{auth.RealmId}/companyinfo/{auth.RealmId}";
                    using var testClient = new HttpClient();
                    testClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {auth.AccessToken}");
                    testClient.DefaultRequestHeaders.Add("Accept", "application/json");

                    _logger.LogInformation("🔧 [QBO DEBUG] Testing connectivity: {TestUrl}", testUrl);
                    var testResponse = await testClient.GetAsync(testUrl);

                    _logger.LogInformation("🔧 [QBO DEBUG] Test response: {StatusCode} - {ReasonPhrase}",
                        testResponse.StatusCode, testResponse.ReasonPhrase);

                    if (!testResponse.IsSuccessStatusCode)
                    {
                        var errorContent = await testResponse.Content.ReadAsStringAsync();
                        _logger.LogError("🔧 [QBO DEBUG] Connectivity test FAILED: {ErrorContent}", errorContent);

                        if (testResponse.StatusCode == System.Net.HttpStatusCode.Forbidden)
                        {
                            _logger.LogError("🚨 [QBO DEBUG] FORBIDDEN ERROR - Possible causes:");
                            _logger.LogError("🚨 [QBO DEBUG] 1. Access token expired or invalid");
                            _logger.LogError("🚨 [QBO DEBUG] 2. Wrong RealmId: {RealmId}", auth.RealmId);
                            _logger.LogError("🚨 [QBO DEBUG] 3. OAuth scope insufficient: com.intuit.quickbooks.accounting");
                            _logger.LogError("🚨 [QBO DEBUG] 4. User lacks permissions in QuickBooks company");
                            _logger.LogError("🚨 [QBO DEBUG] 5. App access revoked by user");

                            result.Success = false;
                            result.ErrorMessage = $"Forbidden: {errorContent}";
                            return result;
                        }
                    }
                    else
                    {
                        _logger.LogInformation("✅ [QBO DEBUG] Basic connectivity test passed");
                    }
                }
                catch (Exception testEx)
                {
                    _logger.LogError(testEx, "🔧 [QBO DEBUG] Connectivity test exception");
                }

                // ✅ NEW: Use QuickBooks SDK instead of manual HTTP calls
                // ✅ FIXED: Use direct HTTP API calls instead of problematic SDK
                _logger.LogInformation("🔧 [QBO HTTP] Using direct HTTP API calls instead of SDK");
                _logger.LogInformation("🔧 [QBO HTTP] Fetching accounts from QuickBooks API");

                var accountsUrl = $"{_baseUrl}/v3/company/{auth.RealmId}/query?query=SELECT * FROM Account";
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {auth.AccessToken}");
                httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                _logger.LogInformation("🔧 [QBO HTTP] Making request to: {AccountsUrl}", accountsUrl);
                var accountsResponse = await httpClient.GetAsync(accountsUrl);

                _logger.LogInformation("🔧 [QBO HTTP] Response status: {StatusCode}", accountsResponse.StatusCode);

                if (!accountsResponse.IsSuccessStatusCode)
                {
                    var errorContent = await accountsResponse.Content.ReadAsStringAsync();
                    _logger.LogError("🔧 [QBO HTTP] API call failed: {ErrorContent}", errorContent);
                    throw new Exception($"QuickBooks API call failed: {accountsResponse.StatusCode} - {errorContent}");
                }

                var jsonResponse = await accountsResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("🔧 [QBO HTTP] Response received, length: {Length}", jsonResponse.Length);

                // Parse the JSON response to extract accounts
                var jsonDoc = JsonDocument.Parse(jsonResponse);
                var queryResponse = jsonDoc.RootElement.GetProperty("QueryResponse");

                var accounts = new List<Account>();

                // Configure JSON options to handle enum conversion issues
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString | JsonNumberHandling.WriteAsString,
                    Converters = { new JsonStringEnumConverter() }
                };

                if (queryResponse.TryGetProperty("Account", out var accountsArray))
                {
                    foreach (var accountElement in accountsArray.EnumerateArray())
                    {
                        try
                        {
                            var account = JsonSerializer.Deserialize<Account>(accountElement.GetRawText(), jsonOptions);
                            if (account != null)
                            {
                                accounts.Add(account);
                            }
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogWarning("🔧 [QBO HTTP] Failed to deserialize account: {Error}", ex.Message);
                            _logger.LogDebug("🔧 [QBO HTTP] Problematic account JSON: {Json}", accountElement.GetRawText());
                            // Skip this account and continue with others
                            continue;
                        }
                    }
                }

                _logger.LogInformation("🔧 [QBO SDK] Successfully retrieved {AccountCount} accounts from QuickBooks", accounts.Count);

                // ✅ LOG COMPLETE ACCOUNTS DATA FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO ACCOUNTS DATA] Complete JSON response for UX analysis:");
                _logger.LogInformation("📋 [QBO ACCOUNTS DATA] {AccountsJson}", jsonResponse);

                // ✅ LOG PARSED ACCOUNTS OBJECTS FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO ACCOUNTS PARSED] Successfully parsed {Count} account objects:", accounts.Count);
                foreach (var account in accounts.Take(3)) // Log first 3 for detailed analysis
                {
                    _logger.LogInformation("📋 [QBO ACCOUNTS PARSED] Account Sample: {AccountJson}", JsonSerializer.Serialize(account, new JsonSerializerOptions { WriteIndented = true }));
                }

                // Process and save accounts to database
                foreach (var account in accounts)
                {
                    _logger.LogInformation("🔧 [QBO SDK] Processing account: {AccountName} (ID: {AccountId})", account.Name, account.Id);

                    // Check if account already exists
                    var existingAccount = await context.QBOAccounts
                        .FirstOrDefaultAsync(a => a.QBOId == account.Id && a.TenantId == tenantId);

                    if (existingAccount != null)
                    {
                        // Update existing account
                        existingAccount.Name = account.Name ?? existingAccount.Name;
                        existingAccount.FullyQualifiedName = account.FullyQualifiedName ?? existingAccount.FullyQualifiedName;
                        existingAccount.Active = account.Active;
                        existingAccount.Classification = account.Classification.ToString();
                        existingAccount.AccountType = account.AccountType.ToString();
                        existingAccount.AccountSubType = account.AccountSubType?.ToString();
                        existingAccount.CurrentBalance = account.CurrentBalance;
                        existingAccount.CurrentBalanceWithSubAccounts = account.CurrentBalanceWithSubAccounts;
                        existingAccount.SyncedAt = DateTime.UtcNow;
                        existingAccount.Updated = DateTime.UtcNow;

                        _logger.LogInformation("🔧 [QBO SDK] Updated existing account: {AccountName}", account.Name);
                    }
                    else
                    {
                        // Create new account
                        var newAccount = new QBOAccount
                        {
                            QBOAccountId = Guid.NewGuid(),
                            TenantId = tenantId,
                            QBOId = account.Id ?? "",
                            Name = account.Name ?? "",
                            FullyQualifiedName = account.FullyQualifiedName,
                            Active = account.Active,
                            Classification = account.Classification.ToString(),
                            AccountType = account.AccountType.ToString(),
                            AccountSubType = account.AccountSubType?.ToString(),
                            CurrentBalance = account.CurrentBalance,
                            CurrentBalanceWithSubAccounts = account.CurrentBalanceWithSubAccounts,
                            Currency = "USD", // Default currency
                            SyncedAt = DateTime.UtcNow,
                            Created = DateTime.UtcNow,
                            Updated = DateTime.UtcNow
                        };

                        context.QBOAccounts.Add(newAccount);
                        _logger.LogInformation("🔧 [QBO SDK] Created new account: {AccountName}", account.Name);
                    }

                    result.RecordsProcessed++;
                }

                await context.SaveChangesAsync();
                result.Success = true;

                _logger.LogInformation("🔧 [QBO SDK] Successfully synced {ProcessedCount} accounts using QuickBooks SDK", result.RecordsProcessed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [QBO SDK] Error syncing QuickBooks accounts using SDK");
                result.Success = false;
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async System.Threading.Tasks.Task<SyncResult> SyncCustomersAsync(AuthDbContext context, Guid tenantId, QBOAuthData auth, QBOConfiguration config)
        {
            var result = new SyncResult();

            try
            {
                _logger.LogInformation("🔧 [QBO HTTP] Starting SyncCustomersAsync using HTTP API for tenant {TenantId}", tenantId);
                _logger.LogInformation("🔧 [QBO HTTP] RealmId: {RealmId}", auth.RealmId);
                _logger.LogInformation("🔧 [QBO HTTP] AccessToken Length: {TokenLength}", auth.AccessToken?.Length ?? 0);

                // Check token expiration before making API calls
                if (auth.ExpiresAtDateTime < DateTime.UtcNow.AddMinutes(-5))
                {
                    _logger.LogWarning("🔧 [QBO SDK] Access token is expired, attempting refresh before sync");
                    var refreshedAuth = await RefreshTokenAsync(auth);
                    if (refreshedAuth != null)
                    {
                        auth = refreshedAuth;
                        _logger.LogInformation("🔧 [QBO SDK] Token refreshed successfully");

                        // Update the auth data in the database with refreshed tokens
                        await UpdateAuthDataInDatabaseAsync(context, tenantId, auth);
                        _logger.LogInformation("🔧 [QBO SDK] Updated auth data in database with refreshed tokens");
                    }
                    else
                    {
                        _logger.LogError("🔧 [QBO SDK] Failed to refresh expired token");
                        result.Success = false;
                        result.ErrorMessage = "Access token expired and refresh failed";
                        return result;
                    }
                }

                // ✅ FIXED: Use direct HTTP API calls instead of problematic SDK
                _logger.LogInformation("🔧 [QBO HTTP] Using direct HTTP API calls instead of SDK");
                _logger.LogInformation("🔧 [QBO HTTP] Fetching customers from QuickBooks API");

                var customersUrl = $"{_baseUrl}/v3/company/{auth.RealmId}/query?query=SELECT * FROM Customer";
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {auth.AccessToken}");
                httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                _logger.LogInformation("🔧 [QBO HTTP] Making request to: {CustomersUrl}", customersUrl);
                var customersResponse = await httpClient.GetAsync(customersUrl);
                _logger.LogInformation("🔧 [QBO HTTP] Response status: {StatusCode}", customersResponse.StatusCode);

                if (!customersResponse.IsSuccessStatusCode)
                {
                    var errorContent = await customersResponse.Content.ReadAsStringAsync();
                    _logger.LogError("🔧 [QBO HTTP] API call failed: {ErrorContent}", errorContent);
                    throw new Exception($"QuickBooks API call failed: {customersResponse.StatusCode} - {errorContent}");
                }

                var jsonResponse = await customersResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("🔧 [QBO HTTP] Response received, length: {Length}", jsonResponse.Length);

                // Parse the JSON response to extract customers
                var jsonDoc = JsonDocument.Parse(jsonResponse);
                var queryResponse = jsonDoc.RootElement.GetProperty("QueryResponse");
                var customers = new List<Customer>();

                if (queryResponse.TryGetProperty("Customer", out var customersArray))
                {
                    foreach (var customerElement in customersArray.EnumerateArray())
                    {
                        var customer = JsonSerializer.Deserialize<Customer>(customerElement.GetRawText());
                        if (customer != null)
                        {
                            customers.Add(customer);
                        }
                    }
                }

                _logger.LogInformation("🔧 [QBO HTTP] Successfully retrieved {CustomerCount} customers from QuickBooks", customers.Count);

                // ✅ LOG COMPLETE CUSTOMERS DATA FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO CUSTOMERS DATA] Complete JSON response for UX analysis:");
                _logger.LogInformation("📋 [QBO CUSTOMERS DATA] {CustomersJson}", jsonResponse);

                // ✅ LOG PARSED CUSTOMERS OBJECTS FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO CUSTOMERS PARSED] Successfully parsed {Count} customer objects:", customers.Count);
                foreach (var customer in customers.Take(3)) // Log first 3 for detailed analysis
                {
                    _logger.LogInformation("📋 [QBO CUSTOMERS PARSED] Customer Sample: {CustomerJson}", JsonSerializer.Serialize(customer, new JsonSerializerOptions { WriteIndented = true }));
                }

                // Process and save customers to database
                foreach (var customer in customers)
                {
                    _logger.LogInformation("🔧 [QBO SDK] Processing customer: {CustomerName} (ID: {CustomerId})", customer.DisplayName, customer.Id);

                    // Check if customer already exists
                    var existingCustomer = await context.QBOCustomers
                        .FirstOrDefaultAsync(c => c.QBOId == customer.Id && c.TenantId == tenantId);

                    if (existingCustomer != null)
                    {
                        // Update existing customer
                        existingCustomer.Name = customer.DisplayName ?? existingCustomer.Name;
                        existingCustomer.CompanyName = customer.CompanyName ?? existingCustomer.CompanyName;
                        existingCustomer.Active = customer.Active;
                        existingCustomer.Balance = customer.Balance;
                        existingCustomer.BalanceWithJobs = customer.BalanceWithJobs;
                        existingCustomer.CurrencyRef = customer.CurrencyRef?.Value ?? "USD";
                        existingCustomer.Email = customer.PrimaryEmailAddr?.Address;
                        existingCustomer.Phone = customer.PrimaryPhone?.FreeFormNumber;
                        existingCustomer.Mobile = customer.Mobile?.FreeFormNumber;
                        existingCustomer.Fax = customer.Fax?.FreeFormNumber;
                        existingCustomer.Website = customer.WebAddr?.URI;
                        existingCustomer.BillAddr = customer.BillAddr != null ? JsonSerializer.Serialize(customer.BillAddr) : null;
                        existingCustomer.ShipAddr = customer.ShipAddr != null ? JsonSerializer.Serialize(customer.ShipAddr) : null;
                        existingCustomer.SyncedAt = DateTime.UtcNow;
                        existingCustomer.Updated = DateTime.UtcNow;

                        _logger.LogInformation("🔧 [QBO SDK] Updated existing customer: {CustomerName}", customer.DisplayName);
                    }
                    else
                    {
                        // Create new customer
                        var newCustomer = new QBOCustomer
                        {
                            QBOCustomerId = Guid.NewGuid(),
                            TenantId = tenantId,
                            QBOId = customer.Id ?? "",
                            Name = customer.DisplayName ?? "",
                            CompanyName = customer.CompanyName,
                            Active = customer.Active,
                            Balance = customer.Balance,
                            BalanceWithJobs = customer.BalanceWithJobs,
                            CurrencyRef = customer.CurrencyRef?.Value ?? "USD",
                            Email = customer.PrimaryEmailAddr?.Address,
                            Phone = customer.PrimaryPhone?.FreeFormNumber,
                            Mobile = customer.Mobile?.FreeFormNumber,
                            Fax = customer.Fax?.FreeFormNumber,
                            Website = customer.WebAddr?.URI,
                            BillAddr = customer.BillAddr != null ? JsonSerializer.Serialize(customer.BillAddr) : null,
                            ShipAddr = customer.ShipAddr != null ? JsonSerializer.Serialize(customer.ShipAddr) : null,
                            SyncedAt = DateTime.UtcNow,
                            Created = DateTime.UtcNow,
                            Updated = DateTime.UtcNow
                        };

                        context.QBOCustomers.Add(newCustomer);
                        _logger.LogInformation("🔧 [QBO SDK] Created new customer: {CustomerName}", customer.DisplayName);
                    }

                    result.RecordsProcessed++;
                }

                await context.SaveChangesAsync();
                result.Success = true;

                _logger.LogInformation("🔧 [QBO SDK] Successfully synced {ProcessedCount} customers using QuickBooks SDK", result.RecordsProcessed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [QBO SDK] Error syncing QuickBooks customers using SDK");
                result.Success = false;
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async System.Threading.Tasks.Task<SyncResult> SyncItemsAsync(AuthDbContext context, Guid tenantId, QBOAuthData auth, QBOConfiguration config)
        {
            var result = new SyncResult();

            try
            {
                _logger.LogInformation("🔧 [QBO SDK] Starting SyncItemsAsync using QuickBooks SDK for tenant {TenantId}", tenantId);
                _logger.LogInformation("🔧 [QBO SDK] RealmId: {RealmId}", auth.RealmId);
                _logger.LogInformation("🔧 [QBO SDK] AccessToken Length: {TokenLength}", auth.AccessToken?.Length ?? 0);

                // Check token expiration before making API calls
                if (auth.ExpiresAtDateTime < DateTime.UtcNow.AddMinutes(-5))
                {
                    _logger.LogWarning("🔧 [QBO SDK] Access token is expired, attempting refresh before sync");
                    var refreshedAuth = await RefreshTokenAsync(auth);
                    if (refreshedAuth != null)
                    {
                        auth = refreshedAuth;
                        _logger.LogInformation("🔧 [QBO SDK] Token refreshed successfully");

                        // Update the auth data in the database with refreshed tokens
                        await UpdateAuthDataInDatabaseAsync(context, tenantId, auth);
                        _logger.LogInformation("🔧 [QBO SDK] Updated auth data in database with refreshed tokens");
                    }
                    else
                    {
                        _logger.LogError("🔧 [QBO SDK] Failed to refresh expired token");
                        result.Success = false;
                        result.ErrorMessage = "Access token expired and refresh failed";
                        return result;
                    }
                }

                // ✅ FIXED: Use direct HTTP API calls instead of problematic SDK
                _logger.LogInformation("🔧 [QBO HTTP] Using direct HTTP API calls instead of SDK");
                _logger.LogInformation("🔧 [QBO HTTP] Fetching items from QuickBooks API");

                var itemsUrl = $"{_baseUrl}/v3/company/{auth.RealmId}/query?query=SELECT * FROM Item";
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {auth.AccessToken}");
                httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                _logger.LogInformation("🔧 [QBO HTTP] Making request to: {ItemsUrl}", itemsUrl);
                var itemsResponse = await httpClient.GetAsync(itemsUrl);
                _logger.LogInformation("🔧 [QBO HTTP] Response status: {StatusCode}", itemsResponse.StatusCode);

                if (!itemsResponse.IsSuccessStatusCode)
                {
                    var errorContent = await itemsResponse.Content.ReadAsStringAsync();
                    _logger.LogError("🔧 [QBO HTTP] API call failed: {ErrorContent}", errorContent);
                    throw new Exception($"QuickBooks API call failed: {itemsResponse.StatusCode} - {errorContent}");
                }

                var jsonResponse = await itemsResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("🔧 [QBO HTTP] Response received, length: {Length}", jsonResponse.Length);

                // Parse the JSON response to extract items
                var jsonDoc = JsonDocument.Parse(jsonResponse);
                var queryResponse = jsonDoc.RootElement.GetProperty("QueryResponse");
                var items = new List<Item>();

                // Configure JSON options to handle enum conversion issues
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString | JsonNumberHandling.WriteAsString,
                    Converters = { new JsonStringEnumConverter() }
                };

                if (queryResponse.TryGetProperty("Item", out var itemsArray))
                {
                    foreach (var itemElement in itemsArray.EnumerateArray())
                    {
                        try
                        {
                            var item = JsonSerializer.Deserialize<Item>(itemElement.GetRawText(), jsonOptions);
                            if (item != null)
                            {
                                items.Add(item);
                            }
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogWarning("🔧 [QBO HTTP] Failed to deserialize item: {Error}", ex.Message);
                            _logger.LogDebug("🔧 [QBO HTTP] Problematic item JSON: {Json}", itemElement.GetRawText());
                            // Skip this item and continue with others
                            continue;
                        }
                    }
                }

                _logger.LogInformation("🔧 [QBO HTTP] Successfully retrieved {ItemCount} items from QuickBooks", items.Count);

                // ✅ LOG COMPLETE ITEMS DATA FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO ITEMS DATA] Complete JSON response for UX analysis:");
                _logger.LogInformation("📋 [QBO ITEMS DATA] {ItemsJson}", jsonResponse);

                // ✅ LOG PARSED ITEMS OBJECTS FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO ITEMS PARSED] Successfully parsed {Count} item objects:", items.Count);
                foreach (var item in items.Take(3)) // Log first 3 for detailed analysis
                {
                    _logger.LogInformation("📋 [QBO ITEMS PARSED] Item Sample: {ItemJson}", JsonSerializer.Serialize(item, new JsonSerializerOptions { WriteIndented = true }));
                }

                // Process and save items to database
                foreach (var item in items)
                {
                    _logger.LogInformation("🔧 [QBO SDK] Processing item: {ItemName} (ID: {ItemId})", item.Name, item.Id);

                    // Check if item already exists
                    var existingItem = await context.QBOItems
                        .FirstOrDefaultAsync(i => i.QBOId == item.Id && i.TenantId == tenantId);

                    if (existingItem != null)
                    {
                        // Update existing item
                        existingItem.Name = item.Name ?? existingItem.Name;
                        existingItem.FullyQualifiedName = item.FullyQualifiedName ?? existingItem.FullyQualifiedName;
                        existingItem.Active = item.Active;
                        existingItem.Type = item.Type.ToString();
                        existingItem.Description = item.Description;
                        existingItem.UnitPrice = item.UnitPrice;
                        existingItem.SKU = item.Sku;
                        existingItem.Taxable = item.Taxable;
                        existingItem.IncomeAccountRef = item.IncomeAccountRef?.Value;
                        existingItem.ExpenseAccountRef = item.ExpenseAccountRef?.Value;
                        existingItem.AssetAccountRef = item.AssetAccountRef?.Value;
                        existingItem.SalesTaxCodeRef = item.SalesTaxCodeRef?.Value;
                        existingItem.PurchaseTaxCodeRef = item.PurchaseTaxCodeRef?.Value;
                        existingItem.SyncedAt = DateTime.UtcNow;
                        existingItem.Updated = DateTime.UtcNow;

                        _logger.LogInformation("🔧 [QBO SDK] Updated existing item: {ItemName}", item.Name);
                        result.RecordsUpdated++;
                    }
                    else
                    {
                        // Create new item
                        var newItem = new QBOItem
                        {
                            QBOItemId = Guid.NewGuid(),
                            TenantId = tenantId,
                            QBOId = item.Id ?? "",
                            Name = item.Name ?? "",
                            FullyQualifiedName = item.FullyQualifiedName,
                            Active = item.Active,
                            Type = item.Type.ToString(),
                            Description = item.Description,
                            UnitPrice = item.UnitPrice,
                            SKU = item.Sku,
                            Taxable = item.Taxable,
                            IncomeAccountRef = item.IncomeAccountRef?.Value,
                            ExpenseAccountRef = item.ExpenseAccountRef?.Value,
                            AssetAccountRef = item.AssetAccountRef?.Value,
                            SalesTaxCodeRef = item.SalesTaxCodeRef?.Value,
                            PurchaseTaxCodeRef = item.PurchaseTaxCodeRef?.Value,
                            SyncedAt = DateTime.UtcNow,
                            Created = DateTime.UtcNow,
                            Updated = DateTime.UtcNow
                        };

                        context.QBOItems.Add(newItem);
                        _logger.LogInformation("🔧 [QBO SDK] Created new item: {ItemName}", item.Name);
                        result.RecordsInserted++;
                    }

                    result.RecordsProcessed++;
                }

                await context.SaveChangesAsync();
                result.Success = true;

                _logger.LogInformation("🔧 [QBO SDK] Successfully synced {ProcessedCount} items using QuickBooks SDK", result.RecordsProcessed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [QBO SDK] Error syncing QuickBooks items using SDK");
                result.Success = false;
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async System.Threading.Tasks.Task<SyncResult> SyncInvoicesAsync(AuthDbContext context, Guid tenantId, QBOAuthData auth, QBOConfiguration config)
        {
            var result = new SyncResult();

            try
            {
                _logger.LogInformation("🔧 [QBO SDK] Starting SyncInvoicesAsync using QuickBooks SDK for tenant {TenantId}", tenantId);
                _logger.LogInformation("🔧 [QBO SDK] RealmId: {RealmId}", auth.RealmId);
                _logger.LogInformation("🔧 [QBO SDK] AccessToken Length: {TokenLength}", auth.AccessToken?.Length ?? 0);

                // Check token expiration before making API calls
                if (auth.ExpiresAtDateTime < DateTime.UtcNow.AddMinutes(-5))
                {
                    _logger.LogWarning("🔧 [QBO SDK] Access token is expired, attempting refresh before sync");
                    var refreshedAuth = await RefreshTokenAsync(auth);
                    if (refreshedAuth != null)
                    {
                        auth = refreshedAuth;
                        _logger.LogInformation("🔧 [QBO SDK] Token refreshed successfully");

                        // Update the auth data in the database with refreshed tokens
                        await UpdateAuthDataInDatabaseAsync(context, tenantId, auth);
                        _logger.LogInformation("🔧 [QBO SDK] Updated auth data in database with refreshed tokens");
                    }
                    else
                    {
                        _logger.LogError("🔧 [QBO SDK] Failed to refresh expired token");
                        result.Success = false;
                        result.ErrorMessage = "Access token expired and refresh failed";
                        return result;
                    }
                }

                // ✅ FIXED: Use direct HTTP API calls instead of problematic SDK
                _logger.LogInformation("🔧 [QBO HTTP] Using direct HTTP API calls instead of SDK");
                _logger.LogInformation("🔧 [QBO HTTP] Fetching invoices from QuickBooks API");

                var invoicesUrl = $"{_baseUrl}/v3/company/{auth.RealmId}/query?query=SELECT * FROM Invoice";
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {auth.AccessToken}");
                httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                _logger.LogInformation("🔧 [QBO HTTP] Making request to: {InvoicesUrl}", invoicesUrl);
                var invoicesResponse = await httpClient.GetAsync(invoicesUrl);
                _logger.LogInformation("🔧 [QBO HTTP] Response status: {StatusCode}", invoicesResponse.StatusCode);

                if (!invoicesResponse.IsSuccessStatusCode)
                {
                    var errorContent = await invoicesResponse.Content.ReadAsStringAsync();
                    _logger.LogError("🔧 [QBO HTTP] API call failed: {ErrorContent}", errorContent);
                    throw new Exception($"QuickBooks API call failed: {invoicesResponse.StatusCode} - {errorContent}");
                }

                var jsonResponse = await invoicesResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("🔧 [QBO HTTP] Response received, length: {Length}", jsonResponse.Length);

                // Parse the JSON response to extract invoices
                var jsonDoc = JsonDocument.Parse(jsonResponse);
                var queryResponse = jsonDoc.RootElement.GetProperty("QueryResponse");
                var invoices = new List<Invoice>();

                // Configure JSON options to handle enum conversion issues
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString | JsonNumberHandling.WriteAsString,
                    Converters = { new JsonStringEnumConverter() }
                };

                if (queryResponse.TryGetProperty("Invoice", out var invoicesArray))
                {
                    foreach (var invoiceElement in invoicesArray.EnumerateArray())
                    {
                        try
                        {
                            var invoice = JsonSerializer.Deserialize<Invoice>(invoiceElement.GetRawText(), jsonOptions);
                            if (invoice != null)
                            {
                                invoices.Add(invoice);
                            }
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogWarning("🔧 [QBO HTTP] Failed to deserialize invoice: {Error}", ex.Message);
                            _logger.LogDebug("🔧 [QBO HTTP] Problematic invoice JSON: {Json}", invoiceElement.GetRawText());
                            // Skip this invoice and continue with others
                            continue;
                        }
                    }
                }

                _logger.LogInformation("🔧 [QBO HTTP] Successfully retrieved {InvoiceCount} invoices from QuickBooks", invoices.Count);

                // ✅ LOG COMPLETE INVOICES DATA FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO INVOICES DATA] Complete JSON response for UX analysis:");
                _logger.LogInformation("📋 [QBO INVOICES DATA] {InvoicesJson}", jsonResponse);

                // ✅ LOG PARSED INVOICES OBJECTS FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO INVOICES PARSED] Successfully parsed {Count} invoice objects:", invoices.Count);
                foreach (var invoice in invoices.Take(3)) // Log first 3 for detailed analysis
                {
                    _logger.LogInformation("📋 [QBO INVOICES PARSED] Invoice Sample: {InvoiceJson}", JsonSerializer.Serialize(invoice, new JsonSerializerOptions { WriteIndented = true }));
                }

                // Process and save invoices to database
                foreach (var invoice in invoices)
                {
                    // 🔍 INVOICE NULL-CHECK: Add defensive null checking
                    if (invoice?.Id == null)
                    {
                        _logger.LogWarning("🔍 [INVOICE NULL-CHECK] Skipping invoice with null ID");
                        continue;
                    }

                    _logger.LogInformation("🔧 [QBO SDK] Processing invoice: {InvoiceDocNumber} (ID: {InvoiceId})", invoice.DocNumber ?? "NULL", invoice.Id);

                    // Check if invoice already exists
                    var existingInvoice = await context.QBOInvoices
                        .FirstOrDefaultAsync(i => i.QBOId == invoice.Id && i.TenantId == tenantId);

                    if (existingInvoice != null)
                    {
                        try
                        {
                            // Update existing invoice with defensive null checking
                            existingInvoice.DocNumber = invoice.DocNumber ?? existingInvoice.DocNumber;
                            existingInvoice.TxnDate = invoice.TxnDate != default(DateTime) ? DateOnly.FromDateTime(invoice.TxnDate) : existingInvoice.TxnDate;
                            existingInvoice.DueDate = invoice.DueDate != null ? DateOnly.FromDateTime(invoice.DueDate) : existingInvoice.DueDate;
                            existingInvoice.CustomerRef = invoice.CustomerRef?.Value ?? existingInvoice.CustomerRef;
                            // CustomerName would need to be looked up from Customer table separately if needed
                            existingInvoice.TotalAmt = invoice.TotalAmt;
                            existingInvoice.Balance = invoice.Balance;
                            existingInvoice.HomeTotalAmt = invoice.HomeTotalAmt;
                            // 🔍 ENUM SAFETY: Safe enum conversion (enums are value types)
                            existingInvoice.TxnStatus = invoice.TxnStatus.ToString();
                            existingInvoice.EmailStatus = invoice.EmailStatus.ToString();
                            existingInvoice.PrintStatus = invoice.PrintStatus.ToString();
                            existingInvoice.SalesTermRef = invoice.SalesTermRef?.Value;
                            existingInvoice.ShipAddr = invoice.ShipAddr != null ? JsonSerializer.Serialize(invoice.ShipAddr) : null;
                            existingInvoice.BillAddr = invoice.BillAddr != null ? JsonSerializer.Serialize(invoice.BillAddr) : null;
                            existingInvoice.SyncedAt = DateTime.UtcNow;
                            existingInvoice.Updated = DateTime.UtcNow;

                            _logger.LogInformation("🔧 [QBO SDK] Updated existing invoice: {InvoiceDocNumber}", invoice.DocNumber ?? "NULL");
                            result.RecordsUpdated++;
                        }
                        catch (Exception updateEx)
                        {
                            _logger.LogError(updateEx, "🔍 [INVOICE UPDATE ERROR] Failed to update invoice {InvoiceId}: {Error}", invoice.Id, updateEx.Message);
                            // Skip this invoice and continue with others
                            continue;
                        }
                    }
                    else
                    {
                        try
                        {
                            // Create new invoice with defensive null checking
                            var newInvoice = new QBOInvoice
                            {
                                QBOInvoiceId = Guid.NewGuid(),
                                TenantId = tenantId,
                                QBOId = invoice.Id ?? "",
                                DocNumber = invoice.DocNumber ?? "",
                                TxnDate = invoice.TxnDate != default(DateTime) ? DateOnly.FromDateTime(invoice.TxnDate) : DateOnly.FromDateTime(DateTime.UtcNow),
                                DueDate = invoice.DueDate != null ? DateOnly.FromDateTime(invoice.DueDate) : null,
                                CustomerRef = invoice.CustomerRef?.Value ?? "",
                                CustomerName = null, // Would need to be looked up from Customer table separately if needed
                                TotalAmt = invoice.TotalAmt,
                                Balance = invoice.Balance,
                                HomeTotalAmt = invoice.HomeTotalAmt,
                                // 🔍 ENUM SAFETY: Safe enum conversion (enums are value types)
                                TxnStatus = invoice.TxnStatus.ToString(),
                                EmailStatus = invoice.EmailStatus.ToString(),
                                PrintStatus = invoice.PrintStatus.ToString(),
                                SalesTermRef = invoice.SalesTermRef?.Value,
                                ShipAddr = invoice.ShipAddr != null ? JsonSerializer.Serialize(invoice.ShipAddr) : null,
                                BillAddr = invoice.BillAddr != null ? JsonSerializer.Serialize(invoice.BillAddr) : null,
                                SyncedAt = DateTime.UtcNow,
                                Created = DateTime.UtcNow,
                                Updated = DateTime.UtcNow
                            };

                            context.QBOInvoices.Add(newInvoice);
                            _logger.LogInformation("🔧 [QBO SDK] Created new invoice: {InvoiceDocNumber}", invoice.DocNumber ?? "NULL");
                            result.RecordsInserted++;
                        }
                        catch (Exception createEx)
                        {
                            _logger.LogError(createEx, "🔍 [INVOICE CREATE ERROR] Failed to create invoice {InvoiceId}: {Error}", invoice.Id, createEx.Message);
                            // Skip this invoice and continue with others
                            continue;
                        }
                    }

                    result.RecordsProcessed++;
                }

                await context.SaveChangesAsync();
                result.Success = true;

                _logger.LogInformation("🔧 [QBO SDK] Successfully synced {ProcessedCount} invoices using QuickBooks SDK", result.RecordsProcessed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [QBO SDK] Error syncing QuickBooks invoices using SDK");
                result.Success = false;
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async System.Threading.Tasks.Task<SyncResult> SyncPaymentsAsync(AuthDbContext context, Guid tenantId, QBOAuthData auth, QBOConfiguration config)
        {
            var result = new SyncResult();

            try
            {
                _logger.LogInformation("🔧 [QBO SDK] Starting SyncPaymentsAsync using QuickBooks SDK for tenant {TenantId}", tenantId);
                _logger.LogInformation("🔧 [QBO SDK] RealmId: {RealmId}", auth.RealmId);
                _logger.LogInformation("🔧 [QBO SDK] AccessToken Length: {TokenLength}", auth.AccessToken?.Length ?? 0);

                // Check token expiration before making API calls
                if (auth.ExpiresAtDateTime < DateTime.UtcNow.AddMinutes(-5))
                {
                    _logger.LogWarning("🔧 [QBO SDK] Access token is expired, attempting refresh before sync");
                    var refreshedAuth = await RefreshTokenAsync(auth);
                    if (refreshedAuth != null)
                    {
                        auth = refreshedAuth;
                        _logger.LogInformation("🔧 [QBO SDK] Token refreshed successfully");

                        // Update the auth data in the database with refreshed tokens
                        await UpdateAuthDataInDatabaseAsync(context, tenantId, auth);
                        _logger.LogInformation("🔧 [QBO SDK] Updated auth data in database with refreshed tokens");
                    }
                    else
                    {
                        _logger.LogError("🔧 [QBO SDK] Failed to refresh expired token");
                        result.Success = false;
                        result.ErrorMessage = "Access token expired and refresh failed";
                        return result;
                    }
                }

                // ✅ FIXED: Use direct HTTP API calls instead of problematic SDK
                _logger.LogInformation("🔧 [QBO HTTP] Using direct HTTP API calls instead of SDK");
                _logger.LogInformation("🔧 [QBO HTTP] Fetching payments from QuickBooks API");

                // 🔍 DEBUG: Enhanced query to include customer reference details
                var paymentsUrl = $"{_baseUrl}/v3/company/{auth.RealmId}/query?query=SELECT * FROM Payment MAXRESULTS 50";
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {auth.AccessToken}");
                httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                _logger.LogInformation("🔧 [QBO HTTP] Making request to: {PaymentsUrl}", paymentsUrl);
                var paymentsResponse = await httpClient.GetAsync(paymentsUrl);
                _logger.LogInformation("🔧 [QBO HTTP] Response status: {StatusCode}", paymentsResponse.StatusCode);

                if (!paymentsResponse.IsSuccessStatusCode)
                {
                    var errorContent = await paymentsResponse.Content.ReadAsStringAsync();
                    _logger.LogError("🔧 [QBO HTTP] API call failed: {ErrorContent}", errorContent);
                    throw new Exception($"QuickBooks API call failed: {paymentsResponse.StatusCode} - {errorContent}");
                }

                var jsonResponse = await paymentsResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("🔧 [QBO HTTP] Response received, length: {Length}", jsonResponse.Length);

                // Parse the JSON response to extract payments with enhanced error handling
                var jsonDoc = JsonDocument.Parse(jsonResponse);
                var queryResponse = jsonDoc.RootElement.GetProperty("QueryResponse");
                var payments = new List<QBOApiPayment>();

                // Configure JSON options to handle conversion issues
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString | JsonNumberHandling.WriteAsString,
                    Converters = { new JsonStringEnumConverter() }
                };

                if (queryResponse.TryGetProperty("Payment", out var paymentsArray))
                {
                    foreach (var paymentElement in paymentsArray.EnumerateArray())
                    {
                        try
                        {
                            var payment = JsonSerializer.Deserialize<QBOApiPayment>(paymentElement.GetRawText(), jsonOptions);
                            if (payment != null)
                            {
                                payments.Add(payment);
                            }
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogWarning("🔧 [QBO HTTP] Failed to deserialize payment: {Error}", ex.Message);
                            _logger.LogDebug("🔧 [QBO HTTP] Problematic payment JSON: {Json}", paymentElement.GetRawText());
                            // Skip this payment and continue with others
                            continue;
                        }
                    }
                }

                _logger.LogInformation("🔧 [QBO HTTP] Successfully retrieved {PaymentCount} payments from QuickBooks", payments.Count);

                // ✅ CUSTOMER LOOKUP: Load all customers for this tenant to perform name lookups
                var customerLookup = await context.QBOCustomers
                    .Where(c => c.TenantId == tenantId)
                    .ToDictionaryAsync(c => c.QBOId, c => c.CompanyName ?? c.Name);

                _logger.LogInformation("🔧 [QBO CUSTOMER LOOKUP] Loaded {CustomerCount} customers for payment enhancement", customerLookup.Count);

                // ✅ LOG COMPLETE PAYMENTS DATA FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO PAYMENTS DATA] Complete JSON response for UX analysis:");
                _logger.LogInformation("📋 [QBO PAYMENTS DATA] {PaymentsJson}", jsonResponse);

                // ✅ LOG PARSED PAYMENTS OBJECTS FOR UX ANALYSIS
                _logger.LogInformation("📋 [QBO PAYMENTS PARSED] Successfully parsed {Count} payment objects:", payments.Count);
                foreach (var payment in payments.Take(3)) // Log first 3 for detailed analysis
                {
                    _logger.LogInformation("📋 [QBO PAYMENTS PARSED] Payment Sample: {PaymentJson}", JsonSerializer.Serialize(payment, new JsonSerializerOptions { WriteIndented = true }));

                    // 🔍 CUSTOMERREF DEBUG: Log specific customer reference data and lookup result
                    var customerName = payment.CustomerRef?.Value != null && customerLookup.ContainsKey(payment.CustomerRef.Value)
                        ? customerLookup[payment.CustomerRef.Value]
                        : null;

                    _logger.LogInformation("🔍 [PAYMENT CUSTOMERREF] Payment ID {PaymentId}: CustomerRef.Value = '{CustomerRef}', CustomerName = '{CustomerName}'",
                        payment.Id,
                        payment.CustomerRef?.Value ?? "NULL",
                        customerName ?? "NOT_FOUND");
                }

                // Process and save payments to database
                foreach (var payment in payments)
                {
                    _logger.LogInformation("🔧 [QBO SDK] Processing payment: ${PaymentAmount} (ID: {PaymentId})", payment.TotalAmt, payment.Id);

                    // ✅ CUSTOMER LOOKUP: Get customer name for this payment
                    var customerName = payment.CustomerRef?.Value != null && customerLookup.ContainsKey(payment.CustomerRef.Value)
                        ? customerLookup[payment.CustomerRef.Value]
                        : null;

                    // Check if payment already exists
                    var existingPayment = await context.QBOPayments
                        .FirstOrDefaultAsync(p => p.QBOId == payment.Id && p.TenantId == tenantId);

                    if (existingPayment != null)
                    {
                        // Update existing payment
                        existingPayment.TxnDate = DateOnly.FromDateTime(payment.TxnDateTime);
                        existingPayment.CustomerRef = payment.CustomerRef?.Value ?? existingPayment.CustomerRef;
                        existingPayment.CustomerName = customerName ?? existingPayment.CustomerName;
                        existingPayment.TotalAmt = payment.TotalAmt;
                        existingPayment.UnappliedAmt = payment.UnappliedAmt;
                        existingPayment.PaymentMethodRef = payment.PaymentMethodRef?.Value;
                        existingPayment.PaymentRefNum = payment.PaymentRefNum;
                        existingPayment.DepositToAccountRef = payment.DepositToAccountRef?.Value;
                        existingPayment.Line = payment.Line != null ? JsonSerializer.Serialize(payment.Line) : null;
                        existingPayment.SyncedAt = DateTime.UtcNow;
                        existingPayment.Updated = DateTime.UtcNow;

                        _logger.LogInformation("🔧 [QBO SDK] Updated existing payment: ${PaymentAmount} (Customer: {CustomerName})", payment.TotalAmt, customerName ?? "UNKNOWN");
                        result.RecordsUpdated++;
                    }
                    else
                    {
                        // Create new payment
                        var newPayment = new QBOPayment
                        {
                            QBOPaymentId = Guid.NewGuid(),
                            TenantId = tenantId,
                            QBOId = payment.Id ?? "",
                            TxnDate = DateOnly.FromDateTime(payment.TxnDateTime),
                            CustomerRef = payment.CustomerRef?.Value ?? "",
                            CustomerName = customerName, // ✅ NOW POPULATED FROM LOOKUP
                            TotalAmt = payment.TotalAmt,
                            UnappliedAmt = payment.UnappliedAmt,
                            PaymentMethodRef = payment.PaymentMethodRef?.Value,
                            PaymentRefNum = payment.PaymentRefNum,
                            DepositToAccountRef = payment.DepositToAccountRef?.Value,
                            Line = payment.Line != null ? JsonSerializer.Serialize(payment.Line) : null,
                            SyncedAt = DateTime.UtcNow,
                            Created = DateTime.UtcNow,
                            Updated = DateTime.UtcNow
                        };

                        context.QBOPayments.Add(newPayment);
                        _logger.LogInformation("🔧 [QBO SDK] Created new payment: ${PaymentAmount} (Customer: {CustomerName})", payment.TotalAmt, customerName ?? "UNKNOWN");
                        result.RecordsInserted++;
                    }

                    result.RecordsProcessed++;
                }

                await context.SaveChangesAsync();
                result.Success = true;

                _logger.LogInformation("🔧 [QBO SDK] Successfully synced {ProcessedCount} payments using QuickBooks SDK", result.RecordsProcessed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [QBO SDK] Error syncing QuickBooks payments using SDK");
                result.Success = false;
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        /// <summary>
        /// Create ServiceContext using QuickBooks SDK pattern
        /// </summary>
        private ServiceContext CreateServiceContext(QBOAuthData auth)
        {
            try
            {
                // Create OAuth2RequestValidator with access token (like sample code)
                OAuth2RequestValidator oauthValidator = new OAuth2RequestValidator(auth.AccessToken);

                // Create ServiceContext with realmId and QBO service type
                ServiceContext serviceContext = new ServiceContext(auth.RealmId, IntuitServicesType.QBO, oauthValidator);

                // Set minor version (like sample code)
                serviceContext.IppConfiguration.MinorVersion.Qbo = "23";

                _logger.LogInformation("🔧 [QBO SDK] ServiceContext created successfully for RealmId: {RealmId}", auth.RealmId);

                return serviceContext;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [QBO SDK] Failed to create ServiceContext for RealmId: {RealmId}", auth.RealmId);
                throw;
            }
        }
    }

    // Configuration and auth data classes
    public class QBOConfiguration
    {
        public string SyncFrequency { get; set; } = string.Empty;
        public string[] SyncTypes { get; set; } = Array.Empty<string>();
        public int DateRange { get; set; } = 90;
    }

    public class QBOAuthData
    {
        [JsonPropertyName("AccessToken")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("RefreshToken")]
        public string RefreshToken { get; set; } = string.Empty;

        [JsonPropertyName("RealmId")]
        public string RealmId { get; set; } = string.Empty;

        [JsonPropertyName("ExpiresAt")]
        public string ExpiresAt { get; set; } = string.Empty;

        [JsonIgnore]
        public DateTime ExpiresAtDateTime
        {
            get
            {
                // Fix timezone parsing - ensure UTC parsing for ISO 8601 strings
                if (DateTime.TryParse(ExpiresAt, null, DateTimeStyles.RoundtripKind, out var result))
                {
                    // Convert to UTC if not already
                    return result.Kind == DateTimeKind.Utc ? result : result.ToUniversalTime();
                }
                // Fallback: try parsing as ISO 8601 UTC
                if (DateTimeOffset.TryParse(ExpiresAt, out var offsetResult))
                {
                    return offsetResult.UtcDateTime;
                }
                return DateTime.UtcNow.AddDays(1); // Default fallback
            }
        }
    }

    public class QBOTokenResponse
    {
        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = string.Empty;

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; } = string.Empty;

        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("x_refresh_token_expires_in")]
        public int RefreshTokenExpiresIn { get; set; }

        // Not part of token response, but added after exchange
        public string RealmId { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    // QuickBooks API response models
    public class QBOApiResponse
    {
        public QBOQueryResponse QueryResponse { get; set; } = new();
    }

    public class QBOQueryResponse
    {
        public QBOApiAccount[]? Account { get; set; }
        public QBOApiCustomer[]? Customer { get; set; }
        public QBOApiItem[]? Item { get; set; }
        public QBOApiInvoice[]? Invoice { get; set; }
        public QBOApiPayment[]? Payment { get; set; }
    }

    public class QBOApiAccount
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? FullyQualifiedName { get; set; }
        public bool Active { get; set; } = true;
        public string? Classification { get; set; }
        public string? AccountType { get; set; }
        public string? AccountSubType { get; set; }
        public decimal CurrentBalance { get; set; }
        public decimal CurrentBalanceWithSubAccounts { get; set; }
        public QBOReference? CurrencyRef { get; set; }
    }

    public class QBOApiCustomer
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public bool Active { get; set; } = true;
        public decimal Balance { get; set; }
        public decimal BalanceWithJobs { get; set; }
        public QBOReference? CurrencyRef { get; set; }
        public QBOEmailAddress? PrimaryEmailAddr { get; set; }
        public QBOPhoneNumber? PrimaryPhone { get; set; }
        public QBOPhoneNumber? Mobile { get; set; }
        public QBOPhoneNumber? Fax { get; set; }
        public QBOWebAddress? WebAddr { get; set; }
        public QBOAddress? BillAddr { get; set; }
        public QBOAddress? ShipAddr { get; set; }
    }

    public class QBOApiItem
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? FullyQualifiedName { get; set; }
        public bool Active { get; set; } = true;
        public string? Type { get; set; }
        public string? Description { get; set; }
        public decimal? UnitPrice { get; set; }
        public string? SKU { get; set; }
        public bool Taxable { get; set; }
    }

    public class QBOApiInvoice
    {
        public string Id { get; set; } = string.Empty;
        public string? DocNumber { get; set; }
        public string TxnDate { get; set; } = string.Empty;
        public string? DueDate { get; set; }
        public QBOReference CustomerRef { get; set; } = new();
        public decimal TotalAmt { get; set; }
        public decimal Balance { get; set; }
        public string? TxnStatus { get; set; }
    }

    public class QBOApiPayment
    {
        public string Id { get; set; } = string.Empty;
        public string TxnDate { get; set; } = string.Empty;
        public QBOReference CustomerRef { get; set; } = new();
        public decimal TotalAmt { get; set; }
        public decimal UnappliedAmt { get; set; }
        public QBOReference? PaymentMethodRef { get; set; }
        public string? PaymentRefNum { get; set; }
        public QBOReference? DepositToAccountRef { get; set; }
        public object[]? Line { get; set; }

        // Helper property to convert TxnDate string to DateTime
        [JsonIgnore]
        public DateTime TxnDateTime
        {
            get
            {
                if (DateTime.TryParse(TxnDate, out var result))
                {
                    return result;
                }
                return DateTime.UtcNow;
            }
        }
    }

    public class QBOReference
    {
        public string Value { get; set; } = string.Empty;
        public string? Name { get; set; }
    }

    public class QBOEmailAddress
    {
        public string? Address { get; set; }
    }

    public class QBOPhoneNumber
    {
        public string? FreeFormNumber { get; set; }
    }

    public class QBOWebAddress
    {
        public string? URI { get; set; }
    }

    public class QBOAddress
    {
        public string? Line1 { get; set; }
        public string? Line2 { get; set; }
        public string? City { get; set; }
        public string? CountrySubDivisionCode { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
    }
}