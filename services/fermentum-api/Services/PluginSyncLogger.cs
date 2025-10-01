using Fermentum.Auth.Data;
using FermentumApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fermentum.Auth.Services
{
    public interface IPluginSyncLogger
    {
        Task<Guid> LogStepAsync(Guid syncHistoryId, string step, int stepOrder, string status, string? message = null, object? data = null, Guid? userId = null);
        Task UpdateStepAsync(Guid syncDetailId, string status, string? message = null, object? data = null, DateTime? endTime = null);
        Task CompleteStepAsync(Guid syncDetailId, string? message = null, object? data = null);
        Task FailStepAsync(Guid syncDetailId, string errorMessage, object? data = null);
    }

    public class PluginSyncLogger : IPluginSyncLogger
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<PluginSyncLogger> _logger;

        public PluginSyncLogger(AuthDbContext context, ILogger<PluginSyncLogger> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Guid> LogStepAsync(Guid syncHistoryId, string step, int stepOrder, string status, string? message = null, object? data = null, Guid? userId = null)
        {
            try
            {
                var syncDetail = new PluginSyncDetail
                {
                    SyncDetailId = Guid.NewGuid(),
                    SyncHistoryId = syncHistoryId,
                    Step = step,
                    StepOrder = stepOrder,
                    Status = status,
                    Message = message,
                    Data = data != null ? JsonSerializer.Serialize(data) : null,
                    StartTime = DateTime.UtcNow,
                    CreatedBy = userId ?? Guid.Empty, // Use system user if no user provided
                    Created = DateTime.UtcNow
                };

                _context.PluginSyncDetails.Add(syncDetail);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🔍 [SYNC DETAIL] Step logged: {Step} - {Status} - {Message}", step, status, message);

                return syncDetail.SyncDetailId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to log sync step: {Step}", step);
                return Guid.Empty;
            }
        }

        public async Task UpdateStepAsync(Guid syncDetailId, string status, string? message = null, object? data = null, DateTime? endTime = null)
        {
            if (syncDetailId == Guid.Empty) return;

            try
            {
                var syncDetail = await _context.PluginSyncDetails.FindAsync(syncDetailId);
                if (syncDetail != null)
                {
                    syncDetail.Status = status;
                    if (message != null) syncDetail.Message = message;
                    if (data != null) syncDetail.Data = JsonSerializer.Serialize(data);

                    if (endTime.HasValue)
                    {
                        syncDetail.EndTime = endTime.Value;
                        syncDetail.Duration = endTime.Value - syncDetail.StartTime;
                    }

                    await _context.SaveChangesAsync();

                    _logger.LogInformation("🔍 [SYNC DETAIL] Step updated: {Step} - {Status} - {Message}", syncDetail.Step, status, message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to update sync step: {SyncDetailId}", syncDetailId);
            }
        }

        public async Task CompleteStepAsync(Guid syncDetailId, string? message = null, object? data = null)
        {
            await UpdateStepAsync(syncDetailId, "completed", message, data, DateTime.UtcNow);
        }

        public async Task FailStepAsync(Guid syncDetailId, string errorMessage, object? data = null)
        {
            await UpdateStepAsync(syncDetailId, "failed", errorMessage, data, DateTime.UtcNow);
        }
    }
}