using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models
{
    [Table("User_Tenant")]
    public class UserTenant
    {
        public Guid UserId { get; set; }

        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "member";

        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties removed to avoid EF shadow property conflicts
        // Relationships are configured in DbContext with explicit foreign keys
        // public virtual User? User { get; set; }
        // public virtual Tenant? Tenant { get; set; }
    }

    // Define role constants for consistency
    public static class UserTenantRoles
    {
        public const string Owner = "owner";
        public const string Admin = "admin";
        public const string Manager = "manager";
        public const string Member = "member";
        public const string Viewer = "viewer";
    }
}