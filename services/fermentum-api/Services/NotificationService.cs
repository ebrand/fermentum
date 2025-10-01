using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Fermentum.Auth.Data;
using FermentumApi.Models;
using FermentumApi.Services;

namespace FermentumApi.Services;

public class NotificationService : INotificationService
{
    private readonly AuthDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AuthDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> CreateNotificationAsync(CreateNotificationRequest request, Guid userId, Guid tenantId)
    {
        try
        {
            // Get notification type configuration (you may want to move this to a separate service)
            var config = GetNotificationTypeConfig(request.Type);

            var notification = new FermentumApi.Models.Notification
            {
                NotificationId = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = userId,
                Type = request.Type,
                Title = request.Title,
                Message = request.Message,
                Data = request.Data != null ? JsonSerializer.Serialize(request.Data) : null,
                Priority = config.Priority,
                Category = config.Category,
                Source = request.Source ?? "api",
                ActionRequired = config.ActionRequired,
                ActionUrl = request.ActionUrl,
                ExpiresAt = request.ExpiresAt,
                Created = DateTime.UtcNow,
                Updated = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created notification {NotificationId} for user {UserId} in tenant {TenantId}",
                notification.NotificationId, userId, tenantId);

            return notification.NotificationId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification for user {UserId} in tenant {TenantId}", userId, tenantId);
            throw;
        }
    }

    public async Task<IEnumerable<NotificationDto>> GetNotificationsAsync(Guid userId, Guid tenantId, NotificationFilters? filters = null)
    {
        try
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId && n.TenantId == tenantId)
                .Where(n => n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow);

            // Apply filters
            if (filters != null)
            {
                if (!string.IsNullOrEmpty(filters.Category))
                    query = query.Where(n => n.Category == filters.Category);

                if (!string.IsNullOrEmpty(filters.Priority))
                    query = query.Where(n => n.Priority == filters.Priority);

                if (filters.UnreadOnly == true)
                    query = query.Where(n => !n.IsRead);

                if (filters.ActionRequired == true)
                    query = query.Where(n => n.ActionRequired && !n.IsAcknowledged);
            }

            // Order by priority weight, then by created date
            query = query.OrderByDescending(n => GetPriorityWeight(n.Priority))
                         .ThenByDescending(n => n.Created);

            // Apply pagination
            if (filters?.Offset.HasValue == true)
                query = query.Skip(filters.Offset.Value);

            if (filters?.Limit.HasValue == true)
                query = query.Take(filters.Limit.Value);

            var notifications = await query.ToListAsync();

            return notifications.Select(n => new NotificationDto
            {
                Id = n.NotificationId,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                Data = !string.IsNullOrEmpty(n.Data) ? JsonSerializer.Deserialize<object>(n.Data) : null,
                Priority = n.Priority,
                Category = n.Category,
                Source = n.Source,
                ActionRequired = n.ActionRequired,
                ActionUrl = n.ActionUrl,
                ExpiresAt = n.ExpiresAt,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                IsAcknowledged = n.IsAcknowledged,
                AcknowledgedAt = n.AcknowledgedAt,
                CreatedAt = n.Created
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for user {UserId} in tenant {TenantId}", userId, tenantId);
            throw;
        }
    }

    public async Task<NotificationCountsDto> GetNotificationCountsAsync(Guid userId, Guid tenantId)
    {
        try
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.TenantId == tenantId)
                .Where(n => n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            return new NotificationCountsDto
            {
                Total = notifications.Count,
                Unread = notifications.Count(n => !n.IsRead),
                ActionRequired = notifications.Count(n => n.ActionRequired && !n.IsAcknowledged),
                Critical = notifications.Count(n => n.Priority == "critical"),
                High = notifications.Count(n => n.Priority == "high")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification counts for user {UserId} in tenant {TenantId}", userId, tenantId);
            throw;
        }
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, Guid tenantId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId &&
                                        n.UserId == userId &&
                                        n.TenantId == tenantId);

            if (notification == null) return false;

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            notification.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification {NotificationId} as read", notificationId);
            throw;
        }
    }

    public async Task<bool> MarkAsAcknowledgedAsync(Guid notificationId, Guid userId, Guid tenantId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId &&
                                        n.UserId == userId &&
                                        n.TenantId == tenantId);

            if (notification == null) return false;

            notification.IsAcknowledged = true;
            notification.AcknowledgedAt = DateTime.UtcNow;
            notification.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acknowledging notification {NotificationId}", notificationId);
            throw;
        }
    }

    public async Task<bool> RemoveNotificationAsync(Guid notificationId, Guid userId, Guid tenantId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId &&
                                        n.UserId == userId &&
                                        n.TenantId == tenantId);

            if (notification == null) return false;

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing notification {NotificationId}", notificationId);
            throw;
        }
    }

    public async Task<int> ClearAllNotificationsAsync(Guid userId, Guid tenantId)
    {
        try
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.TenantId == tenantId)
                .ToListAsync();

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            return notifications.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing notifications for user {UserId} in tenant {TenantId}", userId, tenantId);
            throw;
        }
    }

    public async Task<int> ClearReadNotificationsAsync(Guid userId, Guid tenantId)
    {
        try
        {
            var readNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.TenantId == tenantId && n.IsRead == true)
                .ToListAsync();

            _context.Notifications.RemoveRange(readNotifications);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Cleared {Count} read notifications for user {UserId} in tenant {TenantId}",
                readNotifications.Count, userId, tenantId);

            return readNotifications.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing read notifications for user {UserId} in tenant {TenantId}", userId, tenantId);
            throw;
        }
    }

    public async Task<int> MarkAllNotificationsAsReadAsync(Guid userId, Guid tenantId)
    {
        try
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.TenantId == tenantId && n.IsRead == false)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                notification.Updated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Marked {Count} notifications as read for user {UserId} in tenant {TenantId}",
                unreadNotifications.Count, userId, tenantId);

            return unreadNotifications.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user {UserId} in tenant {TenantId}", userId, tenantId);
            throw;
        }
    }

    public async Task<int> ExpireNotificationsAsync()
    {
        try
        {
            var expiredNotifications = await _context.Notifications
                .Where(n => n.ExpiresAt != null && n.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();

            _context.Notifications.RemoveRange(expiredNotifications);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Expired {Count} notifications", expiredNotifications.Count);
            return expiredNotifications.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error expiring notifications");
            throw;
        }
    }

    public async Task RegisterEventListenerAsync(string eventType, string notificationType, Guid tenantId, Guid userId, bool isEnabled = true)
    {
        try
        {
            var existing = await _context.NotificationEventListeners
                .FirstOrDefaultAsync(l => l.TenantId == tenantId &&
                                        l.EventType == eventType &&
                                        l.NotificationType == notificationType);

            if (existing != null)
            {
                existing.IsEnabled = isEnabled;
                existing.Updated = DateTime.UtcNow;
                existing.UpdatedBy = userId;
            }
            else
            {
                var listener = new NotificationEventListener
                {
                    TenantId = tenantId,
                    EventType = eventType,
                    NotificationType = notificationType,
                    IsEnabled = isEnabled,
                    CreatedBy = userId,
                    UpdatedBy = userId
                };

                _context.NotificationEventListeners.Add(listener);
            }

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering event listener for {EventType} -> {NotificationType}", eventType, notificationType);
            throw;
        }
    }

    public async Task UnregisterEventListenerAsync(string eventType, string notificationType, Guid tenantId)
    {
        try
        {
            var listener = await _context.NotificationEventListeners
                .FirstOrDefaultAsync(l => l.TenantId == tenantId &&
                                        l.EventType == eventType &&
                                        l.NotificationType == notificationType);

            if (listener != null)
            {
                _context.NotificationEventListeners.Remove(listener);
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering event listener for {EventType} -> {NotificationType}", eventType, notificationType);
            throw;
        }
    }

    public async Task<IEnumerable<NotificationEventListener>> GetEventListenersAsync(Guid tenantId)
    {
        return await _context.NotificationEventListeners
            .Where(l => l.TenantId == tenantId && l.IsEnabled)
            .ToListAsync();
    }

    public async Task TriggerEventAsync(string eventType, object eventData, Guid? tenantId = null)
    {
        try
        {
            var query = _context.NotificationEventListeners
                .Where(l => l.EventType == eventType && l.IsEnabled);

            if (tenantId.HasValue)
                query = query.Where(l => l.TenantId == tenantId.Value);

            var listeners = await query.ToListAsync();

            foreach (var listener in listeners)
            {
                // Here you would implement the logic to create notifications based on the event
                // This could be moved to separate event handler classes
                _logger.LogInformation("Triggered event {EventType} for notification type {NotificationType} in tenant {TenantId}",
                    eventType, listener.NotificationType, listener.TenantId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering event {EventType}", eventType);
            throw;
        }
    }

    private static NotificationTypeConfig GetNotificationTypeConfig(string notificationType)
    {
        // This is a simplified version - you might want to load this from configuration or a separate service
        return notificationType switch
        {
            "temperature_alert" => new NotificationTypeConfig { Priority = "critical", Category = "equipment", ActionRequired = true },
            "batch_step_due" => new NotificationTypeConfig { Priority = "high", Category = "production", ActionRequired = true },
            "qc_check_required" => new NotificationTypeConfig { Priority = "high", Category = "quality", ActionRequired = true },
            "fermentation_complete" => new NotificationTypeConfig { Priority = "medium", Category = "production", ActionRequired = false },
            "inventory_low_stock" => new NotificationTypeConfig { Priority = "medium", Category = "inventory", ActionRequired = true },
            "inventory_out_of_stock" => new NotificationTypeConfig { Priority = "high", Category = "inventory", ActionRequired = true },
            "ingredient_expiring" => new NotificationTypeConfig { Priority = "medium", Category = "inventory", ActionRequired = true },
            "equipment_maintenance" => new NotificationTypeConfig { Priority = "medium", Category = "maintenance", ActionRequired = true },
            "payment_due" => new NotificationTypeConfig { Priority = "high", Category = "financial", ActionRequired = true },
            "subscription_expiring" => new NotificationTypeConfig { Priority = "high", Category = "administrative", ActionRequired = true },
            "compliance_check" => new NotificationTypeConfig { Priority = "high", Category = "compliance", ActionRequired = true },
            "team_invitation" => new NotificationTypeConfig { Priority = "low", Category = "team", ActionRequired = false },
            "order_received" => new NotificationTypeConfig { Priority = "medium", Category = "sales", ActionRequired = false },
            "system_update" => new NotificationTypeConfig { Priority = "info", Category = "system", ActionRequired = false },
            "integration_error" => new NotificationTypeConfig { Priority = "high", Category = "system", ActionRequired = true },
            _ => new NotificationTypeConfig { Priority = "info", Category = "general", ActionRequired = false }
        };
    }

    private static int GetPriorityWeight(string priority)
    {
        return priority switch
        {
            "critical" => 100,
            "high" => 80,
            "medium" => 60,
            "low" => 40,
            "info" => 20,
            _ => 20
        };
    }

    private class NotificationTypeConfig
    {
        public string Priority { get; set; } = "info";
        public string Category { get; set; } = "general";
        public bool ActionRequired { get; set; } = false;
    }
}