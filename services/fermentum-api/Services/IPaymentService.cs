using Fermentum.Auth.Models.DTOs;

namespace Fermentum.Auth.Services;

public interface IPaymentService
{
    Task<CreateSubscriptionResponse> CreateSubscriptionAsync(CreateSubscriptionRequest request, Guid userId);
    Task<CreateSubscriptionResponse> CreateSubscriptionAsync(CreateSubscriptionRequest request);
    Task<bool> ValidatePaymentMethodAsync(string paymentMethodId);
    Task<string> CreateSetupIntentAsync(string customerId);
    Task<CustomerInfo> CreateOrUpdateCustomerAsync(string email, string name, PaymentMethodInfo paymentMethod);
    Task<bool> CancelSubscriptionAsync(string subscriptionId);
    Task<SubscriptionInfo> GetSubscriptionAsync(string subscriptionId);
    Task<bool> UpdateSubscriptionAsync(string subscriptionId, string priceId);
    Task<bool> HandleWebhookAsync(string payload, string signature);
}