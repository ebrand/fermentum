using FermentumApi.Models;

namespace FermentumApi.Services;

public interface INotificationService
{
    // Core notification management
    Task<Guid> CreateNotificationAsync(CreateNotificationRequest request, Guid userId, Guid tenantId);
    Task<IEnumerable<NotificationDto>> GetNotificationsAsync(Guid userId, Guid tenantId, NotificationFilters? filters = null);
    Task<NotificationCountsDto> GetNotificationCountsAsync(Guid userId, Guid tenantId);
    Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, Guid tenantId);
    Task<bool> MarkAsAcknowledgedAsync(Guid notificationId, Guid userId, Guid tenantId);
    Task<bool> RemoveNotificationAsync(Guid notificationId, Guid userId, Guid tenantId);
    Task<int> ClearAllNotificationsAsync(Guid userId, Guid tenantId);
    Task<int> ClearReadNotificationsAsync(Guid userId, Guid tenantId);
    Task<int> MarkAllNotificationsAsReadAsync(Guid userId, Guid tenantId);
    Task<int> ExpireNotificationsAsync();

    // Event listener management
    Task RegisterEventListenerAsync(string eventType, string notificationType, Guid tenantId, Guid userId, bool isEnabled = true);
    Task UnregisterEventListenerAsync(string eventType, string notificationType, Guid tenantId);
    Task<IEnumerable<NotificationEventListener>> GetEventListenersAsync(Guid tenantId);

    // Event triggering
    Task TriggerEventAsync(string eventType, object eventData, Guid? tenantId = null);
}

public class NotificationFilters
{
    public string? Category { get; set; }
    public string? Priority { get; set; }
    public bool? UnreadOnly { get; set; }
    public bool? ActionRequired { get; set; }
    public int? Limit { get; set; }
    public int? Offset { get; set; }
}