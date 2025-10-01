using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FermentumApi.Models
{
    [Table("PaymentMethod")]
    public class PaymentMethod
    {
        [Key]
        public Guid PaymentMethodId { get; set; }

        [StringLength(255)]
        [Required]
        public string StripeCustomerId { get; set; } = string.Empty;

        [StringLength(255)]
        [Required]
        public string StripePaymentMethodId { get; set; } = string.Empty;

        [StringLength(50)]
        [Required]
        public string PaymentMethodType { get; set; } = "card";

        [StringLength(50)]
        public string? CardBrand { get; set; }

        [StringLength(4)]
        public string? CardLast4 { get; set; }

        public int? CardExpMonth { get; set; }

        public int? CardExpYear { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties
        public virtual ICollection<TenantPaymentMethod> TenantPaymentMethods { get; set; } = new List<TenantPaymentMethod>();
    }
}