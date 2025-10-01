using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Fermentum.Auth.Models.DTOs;
using Fermentum.Auth.Services;
using System.Security.Claims;

namespace Fermentum.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(IPaymentService paymentService, ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Create a subscription for a tenant
    /// </summary>
    [HttpPost("subscriptions")]
    public async Task<ActionResult<CreateSubscriptionResponse>> CreateSubscription([FromBody] CreateSubscriptionRequest request)
    {
        try
        {
            // Get current user ID from JWT claims
            var userIdClaim = User.FindFirst("user_id") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Unable to extract user ID from JWT token");
                return BadRequest(new CreateSubscriptionResponse
                {
                    Success = false,
                    Error = "Invalid user authentication"
                });
            }

            _logger.LogInformation("Creating subscription for tenant {TenantId} by user {UserId}", request.TenantId, userId);

            var result = await _paymentService.CreateSubscriptionAsync(request, userId);

            if (result.Success)
            {
                _logger.LogInformation("Successfully created subscription {SubscriptionId} for tenant {TenantId}",
                    result.SubscriptionId, request.TenantId);
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Failed to create subscription for tenant {TenantId}: {Error}",
                    request.TenantId, result.Error);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subscription for tenant {TenantId}", request.TenantId);
            return StatusCode(500, new CreateSubscriptionResponse
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get subscription details for a tenant
    /// </summary>
    [HttpGet("subscriptions/{tenantId}")]
    public async Task<ActionResult<SubscriptionInfo>> GetSubscription(Guid tenantId)
    {
        try
        {
            // TODO: Implement getting subscription by tenant ID
            // This would require adding a method to get subscription ID from tenant
            _logger.LogInformation("Getting subscription for tenant {TenantId}", tenantId);

            return NotFound(new { message = "Subscription not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subscription for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Update subscription plan for a tenant
    /// </summary>
    [HttpPut("subscriptions/{tenantId}")]
    public async Task<ActionResult<bool>> UpdateSubscription(Guid tenantId, [FromBody] UpdateSubscriptionRequest request)
    {
        try
        {
            // TODO: Implement subscription update
            _logger.LogInformation("Updating subscription for tenant {TenantId} to plan {PlanType}",
                tenantId, request.PlanType);

            return NotFound(new { message = "Subscription not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subscription for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Cancel subscription for a tenant
    /// </summary>
    [HttpDelete("subscriptions/{tenantId}")]
    public async Task<ActionResult<bool>> CancelSubscription(Guid tenantId)
    {
        try
        {
            // TODO: Implement subscription cancellation
            _logger.LogInformation("Cancelling subscription for tenant {TenantId}", tenantId);

            return NotFound(new { message = "Subscription not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling subscription for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Create setup intent for adding payment methods
    /// </summary>
    [HttpPost("setup-intent")]
    public async Task<ActionResult<string>> CreateSetupIntent([FromBody] CreateSetupIntentRequest request)
    {
        try
        {
            _logger.LogInformation("Creating setup intent for customer {CustomerId}", request.CustomerId);

            var clientSecret = await _paymentService.CreateSetupIntentAsync(request.CustomerId);
            return Ok(new { clientSecret });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating setup intent for customer {CustomerId}", request.CustomerId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Stripe webhook handler
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<ActionResult> HandleWebhook()
    {
        try
        {
            var payload = await new StreamReader(Request.Body).ReadToEndAsync();
            var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

            _logger.LogInformation("Received Stripe webhook");

            var result = await _paymentService.HandleWebhookAsync(payload, signature);

            if (result)
            {
                return Ok();
            }
            else
            {
                return BadRequest();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Stripe webhook");
            return StatusCode(500);
        }
    }
}

// Supporting DTOs for the controller
public class UpdateSubscriptionRequest
{
    public string PlanType { get; set; } = "";
}

public class CreateSetupIntentRequest
{
    public string CustomerId { get; set; } = "";
}