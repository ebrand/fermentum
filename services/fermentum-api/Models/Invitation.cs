using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fermentum.Auth.Models
{
    [Table("Invitation")]
    public class Invitation
    {
        [Key]
        public Guid InvitationId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid BreweryId { get; set; }

        // Nullable - set when invitation is accepted
        public Guid? UserId { get; set; }

        [Required]
        public DateTime InvitationDate { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime ExpirationDate { get; set; } = DateTime.UtcNow.AddDays(7); // 7 days to accept

        public DateTime? AcceptedDate { get; set; }

        [Required]
        [MaxLength(255)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = FermentumApi.Models.UserTenantRoles.Member;

        [Required]
        public bool AcceptedFlag { get; set; } = false;

        // Standard audit fields
        [Required]
        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        [Required]
        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        public virtual Brewery? Brewery { get; set; }
        public virtual User? User { get; set; }

        // Computed properties
        public bool IsExpired => DateTime.UtcNow > ExpirationDate;
        public bool IsPending => !AcceptedFlag && !IsExpired;
        public string Status => AcceptedFlag ? "accepted" : IsExpired ? "expired" : "pending";
    }

    // Define invitation status constants
    public static class InvitationStatus
    {
        public const string Pending = "pending";
        public const string Accepted = "accepted";
        public const string Expired = "expired";
        public const string Cancelled = "cancelled";
    }
}