using Fermentum.Auth.Configuration;
using Fermentum.Auth.Services;
using Fermentum.Auth.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();

// Debug: Log all discovered controllers
var assembly = System.Reflection.Assembly.GetExecutingAssembly();
var controllerTypes = assembly.GetTypes().Where(t => t.Name.EndsWith("Controller") && !t.IsAbstract);
Log.Information("=== CONTROLLER DISCOVERY DEBUG ===");
foreach (var controller in controllerTypes)
{
    Log.Information("Found controller: {ControllerType}", controller.FullName);
}
Log.Information("=== END CONTROLLER DISCOVERY ===");
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database Configuration
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("JWT Authentication failed for {Path}: {Error}", context.Request.Path, context.Exception.Message);
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("JWT Challenge for {Path}: {Error}", context.Request.Path, context.ErrorDescription);
                return Task.CompletedTask;
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
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FermentumPolicy", policy =>
    {
        policy.WithOrigins(
                "http://fermentum.dev",
                "http://admin.fermentum.dev",
                "https://fermentum.dev",
                "https://admin.fermentum.dev"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
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

app.UseSerilogRequestLogging();

app.UseCors("FermentumPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Database Migration
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    context.Database.EnsureCreated();
}

Log.Information("Fermentum Auth Service starting up...");

app.Run();