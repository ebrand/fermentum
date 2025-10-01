using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Fermentum.Auth.Data;
using FermentumApi.Models;
using FermentumApi.Services;

namespace FermentumApi.Services;

public class BroadcastNotificationService : INotificationService
{
    private readonly AuthDbContext _context;
    private readonly ILogger<BroadcastNotificationService> _logger;

    public BroadcastNotificationService(AuthDbContext context, ILogger<BroadcastNotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> CreateNotificationAsync(CreateNotificationRequest request, Guid createdByUserId, Guid tenantId)
    {
        try
        {
            // Get notification type configuration
            var config = GetNotificationTypeConfig(request.Type);

            // Determine if this is a shared acknowledgment notification based on priority
            var sharedAcknowledgment = config.Priority == "critical" || config.Priority == "high";

            var notification = new FermentumApi.Models.Notification
            {
                NotificationId = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = createdByUserId, // Creator, but notification broadcasts to target roles
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
                IsBroadcast = true,
                BroadcastRoles = config.TargetRoles,
                SharedAcknowledgment = sharedAcknowledgment,
                Created = DateTime.UtcNow,
                Updated = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // The database trigger will automatically create UserNotificationStatus records
            // for all users with matching roles in the tenant

            _logger.LogInformation("Created broadcast notification {NotificationId} for roles {Roles} in tenant {TenantId} (shared ack: {SharedAck})",
                notification.NotificationId, string.Join(",", config.TargetRoles), tenantId, sharedAcknowledgment);

            return notification.NotificationId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating broadcast notification for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<IEnumerable<NotificationDto>> GetNotificationsAsync(Guid userId, Guid tenantId, NotificationFilters? filters = null)
    {
        try
        {
            var query = from n in _context.Notifications
                       join status in _context.UserNotificationStatuses
                           on new { n.NotificationId, UserId = userId }
                           equals new { status.NotificationId, status.UserId }
                           into statusGroup
                       from status in statusGroup.DefaultIfEmpty()
                       where n.TenantId == tenantId
                           && (n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow)
                           && (status == null || !status.IsDismissed) // User hasn't dismissed it
                       select new { n, status };

            // Apply filters
            if (filters?.UnreadOnly == true)
            {
                query = query.Where(x => x.status == null || !x.status.IsRead);
            }

            if (filters?.ActionRequired == true)
            {
                query = query.Where(x => x.n.ActionRequired);
            }

            if (!string.IsNullOrEmpty(filters?.Category))
            {
                query = query.Where(x => x.n.Category == filters.Category);
            }

            if (!string.IsNullOrEmpty(filters?.Priority))
            {
                query = query.Where(x => x.n.Priority == filters.Priority);
            }

            var notifications = await query
                .OrderByDescending(x => x.n.Priority == "critical" ? 3 :
                                      x.n.Priority == "high" ? 2 :
                                      x.n.Priority == "medium" ? 1 : 0)
                .ThenByDescending(x => x.n.Created)
                .Skip(filters?.Offset ?? 0)
                .Take(filters?.Limit ?? 50)
                .ToListAsync();

            return notifications.Select(x => new NotificationDto
            {
                Id = x.n.NotificationId,
                Type = x.n.Type,
                Title = x.n.Title,
                Message = x.n.Message,
                Data = string.IsNullOrEmpty(x.n.Data) ? null : JsonSerializer.Deserialize<object>(x.n.Data),
                Priority = x.n.Priority,
                Category = x.n.Category,
                Source = x.n.Source,
                ActionRequired = x.n.ActionRequired,
                ActionUrl = x.n.ActionUrl,
                ExpiresAt = x.n.ExpiresAt,
                IsRead = x.status?.IsRead ?? false,
                ReadAt = x.status?.ReadAt,
                IsAcknowledged = x.n.IsAcknowledged,
                AcknowledgedAt = x.n.AcknowledgedAt,
                IsBroadcast = x.n.IsBroadcast,
                BroadcastRoles = x.n.BroadcastRoles,
                SharedAcknowledgment = x.n.SharedAcknowledgment,
                AcknowledgedByUserId = x.n.AcknowledgedByUserId,
                CreatedAt = x.n.Created
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
            var query = from n in _context.Notifications
                       join status in _context.UserNotificationStatuses
                           on new { n.NotificationId, UserId = userId }
                           equals new { status.NotificationId, status.UserId }
                           into statusGroup
                       from status in statusGroup.DefaultIfEmpty()
                       where n.TenantId == tenantId
                           && (n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow)
                           && (status == null || !status.IsDismissed)
                       select new { n, status };

            var counts = await query.GroupBy(x => 1).Select(g => new NotificationCountsDto
            {
                Total = g.Count(),
                Unread = g.Count(x => x.status == null || !x.status.IsRead),
                ActionRequired = g.Count(x => x.n.ActionRequired && (!x.n.IsAcknowledged || !x.n.SharedAcknowledgment)),
                Critical = g.Count(x => x.n.Priority == "critical" && (!x.n.IsAcknowledged || !x.n.SharedAcknowledgment)),
                High = g.Count(x => x.n.Priority == "high" && (!x.n.IsAcknowledged || !x.n.SharedAcknowledgment))
            }).FirstOrDefaultAsync();

            return counts ?? new NotificationCountsDto();
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
            // Find or create user notification status
            var status = await _context.UserNotificationStatuses
                .FirstOrDefaultAsync(s => s.NotificationId == notificationId && s.UserId == userId);

            if (status == null)
            {
                // Create status record if it doesn't exist
                status = new UserNotificationStatus
                {
                    NotificationId = notificationId,
                    UserId = userId,
                    TenantId = tenantId,
                    IsRead = true,
                    ReadAt = DateTime.UtcNow
                };
                _context.UserNotificationStatuses.Add(status);
            }
            else
            {
                status.IsRead = true;
                status.ReadAt = DateTime.UtcNow;
                status.Updated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification {NotificationId} as read for user {UserId}", notificationId, userId);
            return false;
        }
    }

    public async Task<bool> MarkAsAcknowledgedAsync(Guid notificationId, Guid userId, Guid tenantId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.TenantId == tenantId);

            if (notification == null)
                return false;

            // For shared acknowledgment notifications, mark the main notification as acknowledged
            if (notification.SharedAcknowledgment)
            {
                notification.IsAcknowledged = true;
                notification.AcknowledgedAt = DateTime.UtcNow;
                notification.AcknowledgedByUserId = userId;
                notification.Updated = DateTime.UtcNow;

                _logger.LogInformation("User {UserId} acknowledged shared notification {NotificationId} for all users", userId, notificationId);
            }

            // Also mark as read for the current user
            await MarkAsReadAsync(notificationId, userId, tenantId);

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acknowledging notification {NotificationId} for user {UserId}", notificationId, userId);
            return false;
        }
    }

    public async Task<bool> RemoveNotificationAsync(Guid notificationId, Guid userId, Guid tenantId)
    {
        try
        {
            // For broadcast notifications, we dismiss for the individual user, not delete the notification
            var status = await _context.UserNotificationStatuses
                .FirstOrDefaultAsync(s => s.NotificationId == notificationId && s.UserId == userId);

            if (status == null)
            {
                // Create a dismissed status record
                status = new UserNotificationStatus
                {
                    NotificationId = notificationId,
                    UserId = userId,
                    TenantId = tenantId,
                    IsDismissed = true,
                    DismissedAt = DateTime.UtcNow
                };
                _context.UserNotificationStatuses.Add(status);
            }
            else
            {
                status.IsDismissed = true;
                status.DismissedAt = DateTime.UtcNow;
                status.Updated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error dismissing notification {NotificationId} for user {UserId}", notificationId, userId);
            return false;
        }
    }

    public async Task<int> ClearAllNotificationsAsync(Guid userId, Guid tenantId)
    {
        try
        {
            // Get all active notifications for the user
            var notificationIds = await (from n in _context.Notifications
                                       join status in _context.UserNotificationStatuses
                                           on new { n.NotificationId, UserId = userId }
                                           equals new { status.NotificationId, status.UserId }
                                           into statusGroup
                                       from status in statusGroup.DefaultIfEmpty()
                                       where n.TenantId == tenantId
                                           && (status == null || !status.IsDismissed)
                                       select n.NotificationId).ToListAsync();

            var count = 0;
            foreach (var notificationId in notificationIds)
            {
                if (await RemoveNotificationAsync(notificationId, userId, tenantId))
                    count++;
            }

            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing all notifications for user {UserId} in tenant {TenantId}", userId, tenantId);
            throw;
        }
    }

    public async Task<int> ClearReadNotificationsAsync(Guid userId, Guid tenantId)
    {
        try
        {
            // Get all read notifications for the user
            var readNotificationIds = await (from n in _context.Notifications
                                           join status in _context.UserNotificationStatuses
                                               on new { n.NotificationId, UserId = userId }
                                               equals new { status.NotificationId, status.UserId }
                                           where n.TenantId == tenantId
                                               && status.IsRead == true
                                               && !status.IsDismissed
                                           select n.NotificationId).ToListAsync();

            var count = 0;
            foreach (var notificationId in readNotificationIds)
            {
                if (await RemoveNotificationAsync(notificationId, userId, tenantId))
                    count++;
            }

            _logger.LogInformation("Cleared {Count} read notifications for user {UserId} in tenant {TenantId}",
                count, userId, tenantId);

            return count;
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
            // Get all unread notifications for the user
            var unreadNotificationIds = await (from n in _context.Notifications
                                             join status in _context.UserNotificationStatuses
                                                 on new { n.NotificationId, UserId = userId }
                                                 equals new { status.NotificationId, status.UserId }
                                                 into statusGroup
                                             from status in statusGroup.DefaultIfEmpty()
                                             where n.TenantId == tenantId
                                                 && (n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow)
                                                 && (status == null || !status.IsRead)
                                                 && (status == null || !status.IsDismissed)
                                             select n.NotificationId).ToListAsync();

            var count = 0;
            foreach (var notificationId in unreadNotificationIds)
            {
                if (await MarkAsReadAsync(notificationId, userId, tenantId))
                    count++;
            }

            _logger.LogInformation("Marked {Count} notifications as read for user {UserId} in tenant {TenantId}",
                count, userId, tenantId);

            return count;
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
            var expiredCount = await _context.Notifications
                .Where(n => n.ExpiresAt != null && n.ExpiresAt <= DateTime.UtcNow)
                .ExecuteUpdateAsync(n => n.SetProperty(x => x.Updated, DateTime.UtcNow));

            _logger.LogInformation("Expired {Count} notifications", expiredCount);
            return expiredCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error expiring notifications");
            throw;
        }
    }

    public async Task RegisterEventListenerAsync(string eventType, string notificationType, Guid tenantId, Guid userId, bool isEnabled = true)
    {
        // Implementation for event listeners - not needed for basic broadcast notifications
        await Task.CompletedTask;
    }

    public async Task UnregisterEventListenerAsync(string eventType, string notificationType, Guid tenantId)
    {
        // Implementation for event listeners - not needed for basic broadcast notifications
        await Task.CompletedTask;
    }

    public async Task<IEnumerable<NotificationEventListener>> GetEventListenersAsync(Guid tenantId)
    {
        // Implementation for event listeners - not needed for basic broadcast notifications
        return await Task.FromResult(Enumerable.Empty<NotificationEventListener>());
    }

    public async Task TriggerEventAsync(string eventType, object eventData, Guid? tenantId = null)
    {
        // Implementation for event triggering - not needed for basic broadcast notifications
        await Task.CompletedTask;
    }

    private NotificationConfig GetNotificationTypeConfig(string type)
    {
        // This would typically come from a configuration service or database
        var configs = new Dictionary<string, NotificationConfig>
        {
            ["temperature_alert"] = new NotificationConfig
            {
                Priority = "critical",
                Category = "equipment",
                ActionRequired = true,
                TargetRoles = new[] { "brewer", "brew-manager", "manager", "owner" }
            },
            ["inventory_low_stock"] = new NotificationConfig
            {
                Priority = "high",
                Category = "inventory",
                ActionRequired = true,
                TargetRoles = new[] { "manager", "owner", "inventory" }
            },
            ["batch_step_due"] = new NotificationConfig
            {
                Priority = "medium",
                Category = "production",
                ActionRequired = true,
                TargetRoles = new[] { "brewer", "brew-manager", "manager" }
            },
            ["qc_check_required"] = new NotificationConfig
            {
                Priority = "high",
                Category = "quality",
                ActionRequired = true,
                TargetRoles = new[] { "brewer", "brew-manager", "manager", "owner" }
            },
            ["equipment_maintenance"] = new NotificationConfig
            {
                Priority = "medium",
                Category = "maintenance",
                ActionRequired = true,
                TargetRoles = new[] { "maintenance", "manager", "owner" }
            },
            ["fermentation_complete"] = new NotificationConfig
            {
                Priority = "medium",
                Category = "production",
                ActionRequired = false,
                TargetRoles = new[] { "brewer", "brew-manager", "manager" }
            },
            ["subscription_expiring"] = new NotificationConfig
            {
                Priority = "high",
                Category = "administrative",
                ActionRequired = true,
                TargetRoles = new[] { "owner", "admin" }
            },
            ["integration_error"] = new NotificationConfig
            {
                Priority = "high",
                Category = "system",
                ActionRequired = true,
                TargetRoles = new[] { "admin", "owner" }
            }
        };

        return configs.ContainsKey(type)
            ? configs[type]
            : new NotificationConfig
            {
                Priority = "info",
                Category = "general",
                ActionRequired = false,
                TargetRoles = new[] { "user", "tenant" }
            };
    }

    private class NotificationConfig
    {
        public string Priority { get; set; } = "info";
        public string Category { get; set; } = "general";
        public bool ActionRequired { get; set; } = false;
        public string[] TargetRoles { get; set; } = Array.Empty<string>();
    }
}

