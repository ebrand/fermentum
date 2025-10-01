using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fermentum.Auth.Models
{
    [Table("Brewery")]
    public class Brewery
    {
        [Key]
        public Guid BreweryId { get; set; }

        public Guid TenantId { get; set; }

        [StringLength(255)]
        [Required]
        public string Name { get; set; } = string.Empty;

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }
    }
}