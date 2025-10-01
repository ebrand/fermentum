using Fermentum.Auth.Models;

namespace Fermentum.Auth.Services
{
    public interface ISessionService
    {
        Task<UserSession?> GetSessionAsync(string userId);
        Task<bool> CreateOrUpdateSessionAsync(string userId, UserSession session);
        Task<bool> UpdateCurrentTenantAsync(string userId, string tenantId);
        Task<bool> UpdateCurrentBreweryAsync(string userId, string breweryId);
        Task<bool> RefreshTenantDataAsync(string userId);
        Task<bool> RefreshBreweryDataAsync(string userId);
        Task<bool> InvalidateSessionAsync(string userId);
        Task<UserSession?> CreateSessionFromTokenAsync(string token);
    }
}