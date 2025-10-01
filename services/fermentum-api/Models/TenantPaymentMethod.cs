using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fermentum.Auth.Models;

namespace FermentumApi.Models
{
    [Table("Tenant_PaymentMethod")]
    public class TenantPaymentMethod
    {
        public Guid TenantId { get; set; }

        public Guid PaymentMethodId { get; set; }

        public bool IsDefault { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public Guid? UpdatedBy { get; set; }

        // Navigation properties - relationships configured in DbContext
        public virtual Tenant? Tenant { get; set; }
        public virtual PaymentMethod? PaymentMethod { get; set; }
    }
}