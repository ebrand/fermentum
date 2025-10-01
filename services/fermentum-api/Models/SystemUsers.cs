using System;

namespace FermentumApi.Models
{
    /// <summary>
    /// System user constants for audit trail attribution in automated processes.
    /// These UUIDs correspond to special User records created for non-human operations.
    /// </summary>
    public static class SystemUsers
    {
        /// <summary>
        /// General system process user for automated operations.
        /// Email: system@fermentum.internal
        /// </summary>
        public static readonly Guid System = new("00000000-0000-0000-0000-000000000001");

        /// <summary>
        /// Database migration process user for schema changes and data migrations.
        /// Email: migration@fermentum.internal
        /// </summary>
        public static readonly Guid Migration = new("00000000-0000-0000-0000-000000000002");

        /// <summary>
        /// Batch process user for scheduled jobs and background tasks.
        /// Email: batch@fermentum.internal
        /// </summary>
        public static readonly Guid Batch = new("00000000-0000-0000-0000-000000000003");

        /// <summary>
        /// Webhook handler user for external API callbacks and integrations.
        /// Email: webhook@fermentum.internal
        /// </summary>
        public static readonly Guid Webhook = new("00000000-0000-0000-0000-000000000004");

        /// <summary>
        /// Gets the display name for a system user by UUID.
        /// </summary>
        /// <param name="userId">The system user UUID</param>
        /// <returns>Human-readable display name or "Unknown System User" if not found</returns>
        public static string GetDisplayName(Guid userId)
        {
            return userId switch
            {
                var id when id == System => "System Process",
                var id when id == Migration => "Database Migration",
                var id when id == Batch => "Batch Process",
                var id when id == Webhook => "Webhook Handler",
                _ => "Unknown System User"
            };
        }

        /// <summary>
        /// Checks if a given UUID represents a system user.
        /// </summary>
        /// <param name="userId">The user UUID to check</param>
        /// <returns>True if the UUID represents a system user, false otherwise</returns>
        public static bool IsSystemUser(Guid userId)
        {
            return userId == System ||
                   userId == Migration ||
                   userId == Batch ||
                   userId == Webhook;
        }
    }
}