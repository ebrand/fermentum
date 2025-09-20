using Fermentum.Auth.Models.DTOs;
using Fermentum.Auth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fermentum.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ITenantService _tenantService;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(
        IPaymentService paymentService,
        ITenantService tenantService,
        ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _tenantService = tenantService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new subscription for a tenant
    /// </summary>
    [HttpPost("subscriptions")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CreateSubscriptionResponse>>> CreateSubscriptionAsync(
        [FromBody] CreateSubscriptionRequest request)
    {
        try
        {
            _logger.LogInformation("Creating subscription for tenant {TenantId} with plan {PlanType}",
                request.TenantId, request.PlanType);
            _logger.LogInformation("🔍 CONTROLLER DEBUG: PaymentMethodId='{PaymentMethodId}', BillingEmail='{BillingEmail}'",
                request.PaymentMethodId ?? "NULL", request.BillingEmail ?? "NULL");
            _logger.LogInformation("🔍 FULL REQUEST DEBUG: {@Request}", new {
                PaymentMethodId = request.PaymentMethodId ?? "NULL",
                PlanType = request.PlanType ?? "NULL",
                BillingEmail = request.BillingEmail ?? "NULL",
                BillingDetails = request.BillingDetails,
                TenantId = request.TenantId
            });

            // Verify user has access to the tenant
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new ApiResponse<CreateSubscriptionResponse>
                {
                    Success = false,
                    Message = "Invalid user token"
                });
            }

            // Resolve tenant ID - if empty GUID provided, get user's first available tenant
            var targetTenantId = request.TenantId;
            if (targetTenantId == Guid.Empty)
            {
                var userTenants = await _tenantService.GetUserTenantsAsync(userId);
                if (!userTenants.Any())
                {
                    return BadRequest(new ApiResponse<CreateSubscriptionResponse>
                    {
                        Success = false,
                        Message = "User has no associated tenants. Please create a tenant first."
                    });
                }
                targetTenantId = userTenants.First().Id;
                _logger.LogInformation("Auto-resolved tenant {TenantId} for user {UserId}", targetTenantId, userId);
            }

            // Check if user has admin access to the tenant
            if (!await _tenantService.UserHasAccessToTenantAsync(userId, targetTenantId))
            {
                return Forbid();
            }

            // Update request with resolved tenant ID
            request.TenantId = targetTenantId;

            var response = await _paymentService.CreateSubscriptionAsync(request, userId);

            return Ok(new ApiResponse<CreateSubscriptionResponse>
            {
                Success = response.Success,
                Data = response,
                Message = response.Success ? "Subscription created successfully" : response.Error
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subscription for tenant {TenantId}", request.TenantId);
            return BadRequest(new ApiResponse<CreateSubscriptionResponse>
            {
                Success = false,
                Message = "Failed to create subscription"
            });
        }
    }

    /// <summary>
    /// Get subscription details by subscription ID
    /// </summary>
    [HttpGet("subscriptions/{subscriptionId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<SubscriptionInfo>>> GetSubscriptionAsync(string subscriptionId)
    {
        try
        {
            _logger.LogInformation("Retrieving subscription {SubscriptionId}", subscriptionId);

            var subscription = await _paymentService.GetSubscriptionAsync(subscriptionId);

            return Ok(new ApiResponse<SubscriptionInfo>
            {
                Success = true,
                Data = subscription,
                Message = "Subscription retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving subscription {SubscriptionId}", subscriptionId);
            return BadRequest(new ApiResponse<SubscriptionInfo>
            {
                Success = false,
                Message = "Failed to retrieve subscription"
            });
        }
    }

    /// <summary>
    /// Update an existing subscription (change plan)
    /// </summary>
    [HttpPut("subscriptions/{subscriptionId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> UpdateSubscriptionAsync(
        string subscriptionId,
        [FromBody] UpdateSubscriptionRequest request)
    {
        try
        {
            _logger.LogInformation("Updating subscription {SubscriptionId} to price {PriceId}",
                subscriptionId, request.PriceId);

            var success = await _paymentService.UpdateSubscriptionAsync(subscriptionId, request.PriceId);

            return Ok(new ApiResponse
            {
                Success = success,
                Message = success ? "Subscription updated successfully" : "Failed to update subscription"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subscription {SubscriptionId}", subscriptionId);
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to update subscription"
            });
        }
    }

    /// <summary>
    /// Cancel an existing subscription
    /// </summary>
    [HttpDelete("subscriptions/{subscriptionId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> CancelSubscriptionAsync(string subscriptionId)
    {
        try
        {
            _logger.LogInformation("Cancelling subscription {SubscriptionId}", subscriptionId);

            var success = await _paymentService.CancelSubscriptionAsync(subscriptionId);

            return Ok(new ApiResponse
            {
                Success = success,
                Message = success ? "Subscription cancelled successfully" : "Failed to cancel subscription"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling subscription {SubscriptionId}", subscriptionId);
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Failed to cancel subscription"
            });
        }
    }

    /// <summary>
    /// Create a setup intent for collecting payment method
    /// </summary>
    [HttpPost("setup-intent")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<string>>> CreateSetupIntentAsync([FromQuery] string customerId)
    {
        try
        {
            _logger.LogInformation("Creating setup intent for customer {CustomerId}", customerId);

            var clientSecret = await _paymentService.CreateSetupIntentAsync(customerId);

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Data = clientSecret,
                Message = "Setup intent created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating setup intent for customer {CustomerId}", customerId);
            return BadRequest(new ApiResponse<string>
            {
                Success = false,
                Message = "Failed to create setup intent"
            });
        }
    }

    /// <summary>
    /// Create or update a customer in Stripe
    /// </summary>
    [HttpPost("customers")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CustomerInfo>>> CreateOrUpdateCustomerAsync(
        [FromBody] CreateCustomerRequest request)
    {
        try
        {
            _logger.LogInformation("Creating/updating customer for email {Email}", request.Email);

            var customer = await _paymentService.CreateOrUpdateCustomerAsync(
                request.Email,
                request.Name,
                request.PaymentMethod
            );

            return Ok(new ApiResponse<CustomerInfo>
            {
                Success = true,
                Data = customer,
                Message = "Customer created/updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating customer for email {Email}", request.Email);
            return BadRequest(new ApiResponse<CustomerInfo>
            {
                Success = false,
                Message = "Failed to create/update customer"
            });
        }
    }

    /// <summary>
    /// Handle Stripe webhooks
    /// </summary>
    [HttpPost("webhooks/stripe")]
    [AllowAnonymous]
    public async Task<ActionResult> HandleStripeWebhookAsync()
    {
        try
        {
            var payload = await new StreamReader(Request.Body).ReadToEndAsync();
            var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

            if (string.IsNullOrEmpty(signature))
            {
                _logger.LogWarning("Stripe webhook received without signature");
                return BadRequest("Missing signature");
            }

            _logger.LogInformation("Processing Stripe webhook");

            var success = await _paymentService.HandleWebhookAsync(payload, signature);

            return success ? Ok() : BadRequest("Webhook processing failed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Stripe webhook");
            return BadRequest("Webhook processing failed");
        }
    }

    /// <summary>
    /// Debug endpoint to retrieve payment methods for a Stripe customer
    /// </summary>
    [HttpGet("debug/customer-payment-methods/{customerId}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetCustomerPaymentMethods(string customerId)
    {
        try
        {
            _logger.LogInformation("Retrieving payment methods for Stripe customer {CustomerId}", customerId);

            var paymentMethodService = new Stripe.PaymentMethodService();
            var paymentMethods = await paymentMethodService.ListAsync(new Stripe.PaymentMethodListOptions
            {
                Customer = customerId,
                Type = "card"
            });

            var customerService = new Stripe.CustomerService();
            var customer = await customerService.GetAsync(customerId);

            var result = new
            {
                CustomerId = customerId,
                CustomerEmail = customer.Email,
                DefaultPaymentMethod = customer.InvoiceSettings?.DefaultPaymentMethod,
                PaymentMethodCount = paymentMethods.Data.Count,
                PaymentMethods = paymentMethods.Data.Select(pm => new
                {
                    Id = pm.Id,
                    Type = pm.Type,
                    CardBrand = pm.Card?.Brand,
                    CardLast4 = pm.Card?.Last4,
                    CardExpMonth = pm.Card?.ExpMonth,
                    CardExpYear = pm.Card?.ExpYear,
                    BillingName = pm.BillingDetails?.Name,
                    BillingEmail = pm.BillingDetails?.Email,
                    Created = pm.Created
                }).ToList()
            };

            _logger.LogInformation("Found {Count} payment methods for customer {CustomerId}",
                paymentMethods.Data.Count, customerId);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving payment methods for customer {CustomerId}", customerId);
            return BadRequest($"Failed to retrieve payment methods: {ex.Message}");
        }
    }

    /// <summary>
    /// Debug endpoint to check current price configuration and Stripe account
    /// </summary>
    [HttpGet("debug/stripe-info")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetStripeInfo()
    {
        try
        {
            // Test the actual Stripe connection and account
            var stripeAccountInfo = "Unknown";
            var canAccessPrice = false;
            var apiKeyPrefix = Stripe.StripeConfiguration.ApiKey?.Substring(0, Math.Min(12, Stripe.StripeConfiguration.ApiKey.Length)) + "...";

            try
            {
                // Try to fetch the specific price to test the connection
                var priceService = new Stripe.PriceService();
                var price = await priceService.GetAsync("price_1S9AE1S4Vkg3juZcSbvhGTAS");
                canAccessPrice = true;
                stripeAccountInfo = $"Connected successfully - Price: {price.Id} (${price.UnitAmount / 100})";
            }
            catch (Stripe.StripeException ex)
            {
                stripeAccountInfo = $"Stripe Error: {ex.Message}";
            }

            var config = new
            {
                Message = "Stripe Account Diagnostic",
                ApiKeyPrefix = apiKeyPrefix,
                StripeConnection = stripeAccountInfo,
                PriceAccessible = canAccessPrice,
                ApiKeyStatus = "Configured (using Stripe:SecretKey from config)",
                CurrentConfiguration = new
                {
                    Free = "price_1S9AD1S4Vkg3juZcb58vKU0L",
                    Pro = "price_1S9ADZS4Vkg3juZcORhABZu7",
                    Enterprise = $"price_1S9AE1S4Vkg3juZcSbvhGTAS {(canAccessPrice ? "✅" : "❌")}"
                },
                Troubleshooting = canAccessPrice ?
                    new[] { "All good!" } :
                    new[]
                    {
                        "1. Verify Stripe API key belongs to the same account as the prices",
                        "2. Check if API key has Test mode access",
                        "3. Ensure prices exist in the same Stripe account as the API key"
                    }
            };

            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price configuration");
            return BadRequest($"Failed to get price configuration: {ex.Message}");
        }
    }
}