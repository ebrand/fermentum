using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fermentum.Auth.Models
{
    [Table("User")]
    public class User
    {
        [Key]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? FirstName { get; set; }

        [MaxLength(100)]
        public string? LastName { get; set; }

        [MaxLength(255)]
        public string? StytchUserId { get; set; }

        [MaxLength(50)]
        public string? OauthType { get; set; }

        public string? AvatarUrl { get; set; }

        // NOTE: TenantId removed - will be replaced by User_Tenant junction table
        // public Guid? TenantId { get; set; }
    }
}