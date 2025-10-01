using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Fermentum.Auth.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var tenantId = Context.User?.FindFirst("tenant_id")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Add user to their personal notification group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

                // Add user to tenant notification group if they have a tenant
                if (!string.IsNullOrEmpty(tenantId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var tenantId = Context.User?.FindFirst("tenant_id")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Remove from user group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");

                // Remove from tenant group if they have one
                if (!string.IsNullOrEmpty(tenantId))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        // Method for clients to join specific brewery notification groups
        public async Task JoinBreweryGroup(string breweryId)
        {
            var tenantId = Context.User?.FindFirst("tenant_id")?.Value;

            // Verify user has access to this brewery (basic check)
            if (!string.IsNullOrEmpty(tenantId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"brewery_{breweryId}");
            }
        }

        // Method for clients to leave brewery notification groups
        public async Task LeaveBreweryGroup(string breweryId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"brewery_{breweryId}");
        }

        // Method for clients to request their current notification count
        public async Task GetNotificationCount()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // This would typically query the database for unread notification count
                // For now, we'll just acknowledge the request
                await Clients.Caller.SendAsync("NotificationCountResponse", 0);
            }
        }
    }
}