using Fermentum.Auth.Configuration;
using Fermentum.Auth.Services;
using Fermentum.Auth.Data;
using Fermentum.Auth.Middleware;
using Fermentum.Auth.Filters;
using Fermentum.Auth.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using System.Text;
var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to use HTTP/1.1 for all endpoints in development to avoid HTTP/2 SSL issues
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        // Force HTTP/1.1 globally to avoid HTTP/2 SSL certificate issues with 401 responses
        serverOptions.ConfigureEndpointDefaults(listenOptions =>
        {
            listenOptions.Protocols = HttpProtocols.Http1;
        });
    });
}

// Configure standard .NET logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Add services to the container
builder.Services.AddControllers(options =>
    {
        // Add custom action filter to log all requests
        options.Filters.Add(new RequestLoggingActionFilter());
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase; // Use camelCase for JavaScript frontend consumption
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        // Add enum string conversion to handle frontend enum values
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Debug: Log all discovered controllers
var tempServiceProvider = builder.Services.BuildServiceProvider();
var tempLogger = tempServiceProvider.GetRequiredService<ILogger<Program>>();
var assembly = System.Reflection.Assembly.GetExecutingAssembly();
var controllerTypes = assembly.GetTypes().Where(t => t.Name.EndsWith("Controller") && !t.IsAbstract);
tempLogger.LogInformation("=== CONTROLLER DISCOVERY DEBUG ===");
foreach (var controller in controllerTypes)
{
    tempLogger.LogInformation("Found controller: {ControllerType}", controller.FullName);
}
tempLogger.LogInformation("=== END CONTROLLER DISCOVERY ===");
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// Tenant Context Services for RLS
builder.Services.AddScoped<ITenantContext, HttpTenantContext>();

// Railway/Heroku PostgreSQL URI to ADO.NET Connection String Conversion
// Railway provides DATABASE_URL in URI format: postgresql://user:pass@host:port/db
// But Npgsql expects ADO.NET format: Host=host;Port=port;Database=db;Username=user;Password=pass
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString) && connectionString.StartsWith("postgresql://"))
{
    try
    {
        var uri = new Uri(connectionString);
        var convertedConnectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={uri.UserInfo.Split(':')[0]};Password={uri.UserInfo.Split(':')[1]}";

        // Override the configuration with the converted connection string
        builder.Configuration["ConnectionStrings:DefaultConnection"] = convertedConnectionString;

        tempLogger.LogInformation("Converted Railway PostgreSQL URI to ADO.NET connection string format");
    }
    catch (Exception ex)
    {
        tempLogger.LogError(ex, "Failed to convert PostgreSQL URI to connection string format");
    }
}

// Database Configuration with RLS interceptor
builder.Services.AddScoped<TenantRlsInterceptor>();
builder.Services.AddDbContext<AuthDbContext>((serviceProvider, options) =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .AddInterceptors(serviceProvider.GetRequiredService<TenantRlsInterceptor>()));

// Redis Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});

// Stytch Service (Real API implementation)
builder.Services.AddHttpClient<IStytchService, StytchService>();

// JWT Configuration
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? throw new InvalidOperationException("JWT configuration is required");
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
    {
        // Disable metadata requirement for development (no HTTPS required)
        options.RequireHttpsMetadata = false;

        // Simplified JWT configuration - use only symmetric key validation for now
        // This prevents hanging on external JWKS requests to Stytch
        var symmetricKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey))
        {
            KeyId = "" // Set empty KeyId to match tokens without kid claim
        };

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            // Custom issuer and audience
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,

            // Use single key instead of collection
            IssuerSigningKey = symmetricKey,

            RequireSignedTokens = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            RequireExpirationTime = true
        };

        // Remove external JWKS configuration that was causing hangs
        // TODO: Re-implement Stytch JWKS with proper timeout and error handling

        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                var authHeader = context.Request.Headers["Authorization"].ToString();
                logger.LogInformation("JWT Message Received for {Path}: Authorization Header = {Header}",
                    context.Request.Path,
                    string.IsNullOrEmpty(authHeader) ? "MISSING" : authHeader.Substring(0, Math.Min(50, authHeader.Length)) + "...");

                // Extract token from Authorization header
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = authHeader.Substring("Bearer ".Length).Trim();
                    logger.LogInformation("Extracted token (first 20 chars): {Token}...", context.Token.Substring(0, Math.Min(20, context.Token.Length)));
                }
                else
                {
                    logger.LogWarning("Authorization header does not start with 'Bearer '");
                }

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError("JWT Authentication failed for {Path}: {Error}\nInner Exception: {InnerException}\nStack Trace: {StackTrace}",
                    context.Request.Path,
                    context.Exception.Message,
                    context.Exception.InnerException?.Message ?? "None",
                    context.Exception.StackTrace);
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("JWT Challenge for {Path}: Error = {Error}, ErrorDescription = {ErrorDescription}, AuthFailure = {AuthFailure}",
                    context.Request.Path,
                    context.Error,
                    context.ErrorDescription,
                    context.AuthenticateFailure?.Message ?? "None");

                // Handle the response explicitly to prevent HTTP/1.1 negotiation hang
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync("{\"success\":false,\"message\":\"Unauthorized - Invalid or missing authentication token\"}");
            },
            OnTokenValidated = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogInformation("JWT Token validated successfully for {Path}", context.Request.Path);
                return Task.CompletedTask;
            }
        };
    });

// Stripe Configuration
var stripeSecretKey = builder.Configuration["Stripe:SecretKey"];
if (string.IsNullOrEmpty(stripeSecretKey))
{
    throw new InvalidOperationException("Stripe:SecretKey configuration is required");
}
Stripe.StripeConfiguration.ApiKey = stripeSecretKey;

// Stripe Services
builder.Services.AddTransient<Stripe.CustomerService>();
builder.Services.AddTransient<Stripe.SubscriptionService>();
builder.Services.AddTransient<Stripe.PaymentMethodService>();
builder.Services.AddTransient<Stripe.SetupIntentService>();

// Application Services
// builder.Services.AddScoped<IAuthService, AuthService>();
// builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IJwtService, JwtService>();
// builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<ITenantSchemaService, TenantSchemaService>();
builder.Services.AddScoped<FermentumApi.Services.IAssignmentService, FermentumApi.Services.AssignmentService>();

// Plugin system services
builder.Services.AddScoped<IPluginService, PluginService>();
builder.Services.AddScoped<IPluginSyncLogger, PluginSyncLogger>();
builder.Services.AddScoped<Fermentum.Auth.Interfaces.IPluginProcessor, Fermentum.Auth.Services.Plugins.QuickBooksOnlineProcessor>();
builder.Services.AddHttpClient<Fermentum.Auth.Services.Plugins.QuickBooksOnlineProcessor>();

// Notification system services
builder.Services.AddScoped<FermentumApi.Services.INotificationService, FermentumApi.Services.BroadcastNotificationService>();

// SignalR
builder.Services.AddSignalR();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FermentumPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(
                    "http://fermentum.dev",
                    "http://admin.fermentum.dev",
                    "https://fermentum.dev",
                    "https://admin.fermentum.dev",
                    "http://localhost:3000",
                    "https://localhost:3000"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
    });
});

// Health Checks
builder.Services.AddHealthChecks()
    .AddCheck("database", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy())
    .AddRedis(builder.Configuration.GetConnectionString("Redis") ?? "");

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Standard request logging is built into ASP.NET Core

app.UseCors("FermentumPolicy");

app.UseAuthentication();
// app.UseTenantSchema(); // Replaced with SetSearchPathInterceptor
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapHub<NotificationHub>("/hubs/notification");

// Database Migration
using (var scope = app.Services.CreateScope())
{
    // DEBUG: Log connection string to diagnose Railway issue
    var connString = builder.Configuration.GetConnectionString("DefaultConnection");
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("=== CONNECTION STRING DEBUG ===");
    logger.LogInformation("Connection string length: {Length}", connString?.Length ?? 0);
    logger.LogInformation("Connection string (masked): {ConnString}",
        string.IsNullOrEmpty(connString) ? "<NULL or EMPTY>" :
        connString.Length < 20 ? connString :
        $"{connString.Substring(0, 20)}...(total {connString.Length} chars)");
    logger.LogInformation("=============================");

    var context = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    context.Database.EnsureCreated();
}

// Version information from Docker build
var appVersion = Environment.GetEnvironmentVariable("APP_VERSION") ?? "unknown";
var buildTime = Environment.GetEnvironmentVariable("BUILD_TIME") ?? "unknown";
var assemblyVersion = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "unknown";

// Get logger for startup messages
var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
startupLogger.LogInformation("=== FERMENTUM API SERVICE STARTUP ===");
startupLogger.LogInformation("🚀 Git SHA: {GitSha}", appVersion);
startupLogger.LogInformation("🕐 Build Time: {BuildTime}", buildTime);
startupLogger.LogInformation("📦 Assembly Version: {AssemblyVersion}", assemblyVersion);
startupLogger.LogInformation("🌍 Environment: {Environment}", app.Environment.EnvironmentName);
startupLogger.LogInformation("🐳 Container ID: {ContainerId}", Environment.MachineName);
startupLogger.LogInformation("========================================");
startupLogger.LogInformation("Fermentum API Service ready to serve requests...");

app.Run();