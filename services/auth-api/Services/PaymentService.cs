using Fermentum.Auth.Models.DTOs;
using Fermentum.Auth.Data;
using Stripe;
using Dapper;
using System.Data;
using Microsoft.EntityFrameworkCore;

namespace Fermentum.Auth.Services;

public class PaymentService : IPaymentService
{
    private readonly ILogger<PaymentService> _logger;
    private readonly AuthDbContext _context;
    private readonly CustomerService _customerService;
    private readonly SubscriptionService _subscriptionService;
    private readonly PaymentMethodService _paymentMethodService;
    private readonly SetupIntentService _setupIntentService;
    private readonly ITenantService _tenantService;

    // Plan configurations - should match frontend
    private readonly Dictionary<string, string> _planPriceIds = new()
    {
        { "free", "price_1S9AD1S4Vkg3juZcb58vKU0L" }, // Free plan price ID
        { "pro", "price_1S9ADZS4Vkg3juZcORhABZu7" }, // Pro plan ($249/month)
        { "enterprise", "price_1S9AE1S4Vkg3juZcSbvhGTAS" }, // Enterprise plan ($499/month)
    };

    public PaymentService(
        ILogger<PaymentService> logger,
        AuthDbContext context,
        ITenantService tenantService,
        CustomerService customerService,
        SubscriptionService subscriptionService,
        PaymentMethodService paymentMethodService,
        SetupIntentService setupIntentService)
    {
        _logger = logger;
        _context = context;
        _tenantService = tenantService;
        _customerService = customerService;
        _subscriptionService = subscriptionService;
        _paymentMethodService = paymentMethodService;
        _setupIntentService = setupIntentService;
    }

    public async Task<CreateSubscriptionResponse> CreateSubscriptionAsync(CreateSubscriptionRequest request, Guid userId)
    {
        try
        {
            _logger.LogInformation("🚀 NEW PAYMENT SERVICE: Creating subscription for tenant {TenantId} with plan {PlanType}",
                request.TenantId, request.PlanType);
            _logger.LogInformation("🔍 PAYMENT DEBUG: PaymentMethodId='{PaymentMethodId}', BillingEmail='{BillingEmail}'",
                request.PaymentMethodId ?? "NULL", request.BillingEmail ?? "NULL");

            // Free plan doesn't need Stripe subscription
            if (request.PlanType == "free")
            {
                return new CreateSubscriptionResponse
                {
                    Success = true,
                    SubscriptionId = null
                };
            }

            // Get or create Stripe price ID for the plan
            _logger.LogInformation("=== LOOKING UP PRICE for plan type: {PlanType} ===", request.PlanType);
            if (!_planPriceIds.TryGetValue(request.PlanType, out var priceId) || string.IsNullOrEmpty(priceId))
            {
                _logger.LogError("=== NO PRICE FOUND for plan: {PlanType} ===", request.PlanType);
                throw new InvalidOperationException($"No price configured for plan: {request.PlanType}");
            }

            _logger.LogInformation("Using price ID {PriceId} for plan type {PlanType}", priceId, request.PlanType);
            _logger.LogInformation("Payment method ID received: '{PaymentMethodId}'", request.PaymentMethodId ?? "NULL");
            _logger.LogInformation("Billing email received: '{BillingEmail}'", request.BillingEmail ?? "NULL");

            // Create or update customer
            _logger.LogInformation("Creating/updating Stripe customer for {Email}", request.BillingEmail);
            var customer = await CreateOrUpdateCustomerAsync(
                request.BillingEmail,
                $"{request.BillingDetails.FirstName} {request.BillingDetails.LastName}".Trim(),
                new PaymentMethodInfo { Id = request.PaymentMethodId }
            );
            _logger.LogInformation("Created/updated Stripe customer {CustomerId}", customer.Id);

            // Only process payment method if a valid payment method ID was provided
            if (!string.IsNullOrEmpty(request.PaymentMethodId))
            {
                _logger.LogInformation("Valid payment method ID provided, processing payment method attachment and saving");

                // Attach payment method to customer
            _logger.LogInformation("Attaching payment method {PaymentMethodId} to customer {CustomerId}",
                request.PaymentMethodId, customer.Id);
            await _paymentMethodService.AttachAsync(request.PaymentMethodId, new PaymentMethodAttachOptions
            {
                Customer = customer.Id
            });
            _logger.LogInformation("Successfully attached payment method {PaymentMethodId}", request.PaymentMethodId);

            // Update customer's default payment method
            _logger.LogInformation("Setting payment method {PaymentMethodId} as default for customer {CustomerId}",
                request.PaymentMethodId, customer.Id);
            await _customerService.UpdateAsync(customer.Id, new CustomerUpdateOptions
            {
                InvoiceSettings = new CustomerInvoiceSettingsOptions
                {
                    DefaultPaymentMethod = request.PaymentMethodId
                }
            });
            _logger.LogInformation("Successfully set default payment method for customer {CustomerId}", customer.Id);

            // Get the payment method details from Stripe to save locally
            _logger.LogInformation("Retrieving payment method {PaymentMethodId} from Stripe", request.PaymentMethodId);
            var stripePaymentMethod = await _paymentMethodService.GetAsync(request.PaymentMethodId);
            _logger.LogInformation("Retrieved payment method {PaymentMethodId}, type: {Type}",
                stripePaymentMethod.Id, stripePaymentMethod.Type);

            // Save payment method to local database
            _logger.LogInformation("Saving payment method {PaymentMethodId} to local database for user {UserId}",
                request.PaymentMethodId, userId);
            await SavePaymentMethodAsync(userId, customer.Id, stripePaymentMethod, isDefault: true);
            _logger.LogInformation("Successfully saved payment method {PaymentMethodId} to local database",
                request.PaymentMethodId);
            }
            else
            {
                _logger.LogWarning("No payment method ID provided - subscription will be created without payment method attachment");
            }

            // Calculate trial end date (14 days from now)
            var trialEnd = DateTime.UtcNow.AddDays(14);

            // Create subscription with trial
            var subscriptionOptions = new SubscriptionCreateOptions
            {
                Customer = customer.Id,
                Items = new List<SubscriptionItemOptions>
                {
                    new()
                    {
                        Price = priceId,
                        Quantity = 1
                    }
                },
                TrialEnd = trialEnd,
                DefaultPaymentMethod = request.PaymentMethodId,
                PaymentBehavior = "default_incomplete",
                PaymentSettings = new SubscriptionPaymentSettingsOptions
                {
                    SaveDefaultPaymentMethod = "on_subscription"
                },
                Expand = new List<string> { "latest_invoice.payment_intent", "customer", "default_payment_method" }
            };

            var subscription = await _subscriptionService.CreateAsync(subscriptionOptions);

            // Get the actual Stripe customer object for the update
            var stripeCustomer = await _customerService.GetAsync(customer.Id);

            // Update tenant with subscription information
            await UpdateTenantSubscriptionAsync(request.TenantId, subscription, stripeCustomer, userId);

            var subscriptionInfo = MapToSubscriptionInfo(subscription);

            return new CreateSubscriptionResponse
            {
                Success = true,
                SubscriptionId = subscription.Id,
                CustomerId = customer.Id,
                ClientSecret = subscription.LatestInvoice?.PaymentIntent?.ClientSecret,
                Subscription = subscriptionInfo
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating subscription for tenant {TenantId}", request.TenantId);
            var errorMessage = ex.Message;

            // Provide more helpful error messages for common issues
            if (ex.Message.Contains("No such price"))
            {
                errorMessage = $"Stripe price ID not found. Please verify the price ID is correct in your Stripe dashboard. Original error: {ex.Message}";
            }

            return new CreateSubscriptionResponse
            {
                Success = false,
                Error = errorMessage
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subscription for tenant {TenantId}", request.TenantId);
            return new CreateSubscriptionResponse
            {
                Success = false,
                Error = "Failed to create subscription"
            };
        }
    }

    public async Task<string> CreateSetupIntentAsync(string customerId)
    {
        try
        {
            var options = new SetupIntentCreateOptions
            {
                Customer = customerId,
                Usage = "off_session",
                PaymentMethodTypes = new List<string> { "card" }
            };

            var setupIntent = await _setupIntentService.CreateAsync(options);
            return setupIntent.ClientSecret;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating setup intent for customer {CustomerId}", customerId);
            throw;
        }
    }

    public async Task<CustomerInfo> CreateOrUpdateCustomerAsync(string email, string name, PaymentMethodInfo paymentMethod)
    {
        try
        {
            // Check if customer already exists
            var existingCustomers = await _customerService.ListAsync(new CustomerListOptions
            {
                Email = email,
                Limit = 1
            });

            Customer customer;
            if (existingCustomers.Data.Any())
            {
                customer = existingCustomers.Data.First();
                _logger.LogInformation("Found existing Stripe customer {CustomerId} for email {Email}", customer.Id, email);
            }
            else
            {
                // Create new customer
                var customerOptions = new CustomerCreateOptions
                {
                    Email = email,
                    Name = name,
                    Metadata = new Dictionary<string, string>
                    {
                        { "source", "fermentum_onboarding" }
                    }
                };

                customer = await _customerService.CreateAsync(customerOptions);
                _logger.LogInformation("Created new Stripe customer {CustomerId} for email {Email}", customer.Id, email);
            }

            return new CustomerInfo
            {
                Id = customer.Id,
                Email = customer.Email,
                Name = customer.Name,
                DefaultPaymentMethod = paymentMethod
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating customer for email {Email}", email);
            throw;
        }
    }

    public async Task<bool> CancelSubscriptionAsync(string subscriptionId)
    {
        try
        {
            await _subscriptionService.CancelAsync(subscriptionId, new SubscriptionCancelOptions
            {
                InvoiceNow = false,
                Prorate = false
            });

            _logger.LogInformation("Successfully cancelled subscription {SubscriptionId}", subscriptionId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling subscription {SubscriptionId}", subscriptionId);
            return false;
        }
    }

    public async Task<SubscriptionInfo> GetSubscriptionAsync(string subscriptionId)
    {
        try
        {
            var subscription = await _subscriptionService.GetAsync(subscriptionId, new SubscriptionGetOptions
            {
                Expand = new List<string> { "customer", "default_payment_method", "items.data.price" }
            });

            return MapToSubscriptionInfo(subscription);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving subscription {SubscriptionId}", subscriptionId);
            throw;
        }
    }

    public async Task<bool> UpdateSubscriptionAsync(string subscriptionId, string priceId)
    {
        try
        {
            var subscription = await _subscriptionService.GetAsync(subscriptionId);
            var subscriptionItem = subscription.Items.Data.First();

            await _subscriptionService.UpdateAsync(subscriptionId, new SubscriptionUpdateOptions
            {
                Items = new List<SubscriptionItemOptions>
                {
                    new()
                    {
                        Id = subscriptionItem.Id,
                        Price = priceId
                    }
                },
                ProrationBehavior = "create_prorations"
            });

            _logger.LogInformation("Successfully updated subscription {SubscriptionId} to price {PriceId}",
                subscriptionId, priceId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subscription {SubscriptionId}", subscriptionId);
            return false;
        }
    }

    public async Task<bool> HandleWebhookAsync(string payload, string signature)
    {
        try
        {
            // TODO: Implement webhook handling for subscription events
            // This would handle events like:
            // - customer.subscription.updated
            // - customer.subscription.deleted
            // - invoice.payment_succeeded
            // - invoice.payment_failed

            _logger.LogInformation("Received Stripe webhook");
            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Stripe webhook");
            return false;
        }
    }

    private async Task UpdateTenantSubscriptionAsync(Guid tenantId, Subscription subscription, Customer customer, Guid userId)
    {
        try
        {
            // Extract subscription details
            var priceId = subscription.Items.Data.FirstOrDefault()?.Price?.Id ?? "";
            var planType = GetPlanTypeFromPriceId(priceId);

            // Use the userId parameter passed from the calling method

            await _tenantService.UpdateTenantSubscriptionAsync(
                tenantId: tenantId,
                userId: userId,
                stripeCustomerId: customer.Id,
                stripeSubscriptionId: subscription.Id,
                stripePriceId: priceId,
                planType: planType,
                subscriptionStatus: subscription.Status,
                currentPeriodStart: subscription.CurrentPeriodStart,
                currentPeriodEnd: subscription.CurrentPeriodEnd,
                trialEnd: subscription.TrialEnd,
                cancelAtPeriodEnd: subscription.CancelAtPeriodEnd
            );

            _logger.LogInformation("Updated tenant {TenantId} with subscription {SubscriptionId}",
                tenantId, subscription.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tenant {TenantId} with subscription info", tenantId);
            throw;
        }
    }

    private string GetPlanTypeFromPriceId(string priceId)
    {
        return _planPriceIds.FirstOrDefault(kvp => kvp.Value == priceId).Key ?? "unknown";
    }

    private static SubscriptionInfo MapToSubscriptionInfo(Subscription subscription)
    {
        var item = subscription.Items.Data.FirstOrDefault();
        var price = item?.Price;

        return new SubscriptionInfo
        {
            Id = subscription.Id,
            Status = subscription.Status,
            CustomerId = subscription.CustomerId,
            PriceId = price?.Id ?? "",
            Amount = price?.UnitAmount ?? 0,
            Currency = price?.Currency ?? "usd",
            Interval = price?.Recurring?.Interval ?? "",
            CurrentPeriodStart = subscription.CurrentPeriodStart,
            CurrentPeriodEnd = subscription.CurrentPeriodEnd,
            TrialEnd = subscription.TrialEnd,
            CancelAtPeriodEnd = subscription.CancelAtPeriodEnd,
            DefaultPaymentMethod = subscription.DefaultPaymentMethod != null
                ? MapToPaymentMethodInfo(subscription.DefaultPaymentMethod)
                : null
        };
    }

    private async Task SavePaymentMethodAsync(Guid userId, string stripeCustomerId, PaymentMethod paymentMethod, bool isDefault = false)
    {
        try
        {
            // Set all existing payment methods for this user to non-default if this is the new default
            if (isDefault)
            {
                await _context.Database.GetDbConnection().ExecuteAsync(@"
                    UPDATE user_payment_methods
                    SET is_default = false, updated_at = @updatedAt
                    WHERE user_id = @userId AND is_active = true",
                    new { userId, updatedAt = DateTime.UtcNow });
            }

            // Check if this payment method already exists
            var existingPaymentMethod = await _context.Database.GetDbConnection().QuerySingleOrDefaultAsync<dynamic>(@"
                SELECT id FROM user_payment_methods
                WHERE user_id = @userId AND stripe_payment_method_id = @stripePaymentMethodId",
                new { userId, stripePaymentMethodId = paymentMethod.Id });

            if (existingPaymentMethod != null)
            {
                // Update existing payment method
                await _context.Database.GetDbConnection().ExecuteAsync(@"
                    UPDATE user_payment_methods
                    SET stripe_customer_id = @stripeCustomerId,
                        payment_method_type = @paymentMethodType,
                        card_brand = @cardBrand,
                        card_last4 = @cardLast4,
                        card_exp_month = @cardExpMonth,
                        card_exp_year = @cardExpYear,
                        is_default = @isDefault,
                        is_active = true,
                        updated_at = @updatedAt
                    WHERE user_id = @userId AND stripe_payment_method_id = @stripePaymentMethodId",
                    new
                    {
                        stripeCustomerId,
                        paymentMethodType = paymentMethod.Type,
                        cardBrand = paymentMethod.Card?.Brand,
                        cardLast4 = paymentMethod.Card?.Last4,
                        cardExpMonth = paymentMethod.Card?.ExpMonth,
                        cardExpYear = paymentMethod.Card?.ExpYear,
                        isDefault,
                        userId,
                        stripePaymentMethodId = paymentMethod.Id,
                        updatedAt = DateTime.UtcNow
                    });
            }
            else
            {
                // Insert new payment method
                await _context.Database.GetDbConnection().ExecuteAsync(@"
                    INSERT INTO user_payment_methods
                    (user_id, stripe_customer_id, stripe_payment_method_id, payment_method_type,
                     card_brand, card_last4, card_exp_month, card_exp_year, is_default, is_active, created_at, updated_at)
                    VALUES (@userId, @stripeCustomerId, @stripePaymentMethodId, @paymentMethodType,
                            @cardBrand, @cardLast4, @cardExpMonth, @cardExpYear, @isDefault, true, @createdAt, @updatedAt)",
                    new
                    {
                        userId,
                        stripeCustomerId,
                        stripePaymentMethodId = paymentMethod.Id,
                        paymentMethodType = paymentMethod.Type,
                        cardBrand = paymentMethod.Card?.Brand,
                        cardLast4 = paymentMethod.Card?.Last4,
                        cardExpMonth = paymentMethod.Card?.ExpMonth,
                        cardExpYear = paymentMethod.Card?.ExpYear,
                        isDefault,
                        createdAt = DateTime.UtcNow,
                        updatedAt = DateTime.UtcNow
                    });
            }

            _logger.LogInformation("Saved payment method {PaymentMethodId} for user {UserId} (default: {IsDefault})",
                paymentMethod.Id, userId, isDefault);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving payment method {PaymentMethodId} for user {UserId}",
                paymentMethod.Id, userId);
            throw;
        }
    }

    private static PaymentMethodInfo MapToPaymentMethodInfo(PaymentMethod paymentMethod)
    {
        return new PaymentMethodInfo
        {
            Id = paymentMethod.Id,
            Type = paymentMethod.Type,
            Card = paymentMethod.Card != null ? new CardInfo
            {
                Brand = paymentMethod.Card.Brand,
                Last4 = paymentMethod.Card.Last4,
                ExpMonth = (int)paymentMethod.Card.ExpMonth,
                ExpYear = (int)paymentMethod.Card.ExpYear
            } : null
        };
    }
}