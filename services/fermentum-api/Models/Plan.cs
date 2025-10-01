using System.ComponentModel.DataAnnotations;

namespace Fermentum.Auth.Models
{
    public class Plan
    {
        [Key]
        public Guid PlanId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public int BreweryLimit { get; set; }

        [Required]
        public int UserLimit { get; set; }

        // Standard audit fields
        [Required]
        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        [Required]
        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        public virtual ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();
    }
}