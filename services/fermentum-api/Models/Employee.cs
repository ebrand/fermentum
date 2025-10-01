using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models
{
    [Table("Employee")]
    public class Employee
    {
        [Key]
        public Guid EmployeeId { get; set; }

        public Guid TenantId { get; set; }

        public Guid? BreweryId { get; set; }

        public Guid? UserId { get; set; }

        [StringLength(100)]
        [Required]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(100)]
        [Required]
        public string LastName { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties - relationships configured in DbContext
        public virtual Brewery? Brewery { get; set; }
        public virtual Tenant? Tenant { get; set; }
        public virtual User? User { get; set; }
    }
}