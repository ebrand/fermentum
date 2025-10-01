using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models
{
    [Table("Role")]
    public class Role
    {
        [Key]
        public Guid RoleId { get; set; }

        public Guid TenantId { get; set; }

        [StringLength(50)]
        [Required]
        public string Name { get; set; } = string.Empty;

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties - relationships configured in DbContext
        public virtual Tenant? Tenant { get; set; }
    }
}