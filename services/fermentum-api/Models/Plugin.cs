using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Fermentum.Auth.Models;

namespace FermentumApi.Models
{
    // Plugin Definition
    [Table("Plugin")]
    public class Plugin
    {
        [Key]
        public Guid PluginId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string DisplayName { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [MaxLength(20)]
        public string Version { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Author { get; set; }

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public bool RequiresAuth { get; set; } = false;

        [MaxLength(50)]
        public string? AuthType { get; set; }

        [Column(TypeName = "jsonb")]
        public string? ConfigurationSchema { get; set; }

        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        public virtual ICollection<TenantPlugin> TenantPlugins { get; set; } = new List<TenantPlugin>();
    }

    // Tenant Plugin Installation
    [Table("TenantPlugin")]
    public class TenantPlugin
    {
        [Key]
        public Guid TenantPluginId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        public Guid PluginId { get; set; }

        public bool IsEnabled { get; set; } = true;

        [Column(TypeName = "jsonb")]
        public string? Configuration { get; set; }

        [Column(TypeName = "jsonb")]
        public string? AuthData { get; set; }

        public DateTime? LastSync { get; set; }

        [MaxLength(50)]
        public string SyncStatus { get; set; } = "pending";

        public string? SyncError { get; set; }

        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        [Required]
        public Guid UpdatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;

        [ForeignKey("PluginId")]
        public virtual Plugin Plugin { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User CreatedByUser { get; set; } = null!;

        [ForeignKey("UpdatedBy")]
        public virtual User UpdatedByUser { get; set; } = null!;

        public virtual ICollection<PluginSyncHistory> SyncHistory { get; set; } = new List<PluginSyncHistory>();
    }

    // Plugin Sync History
    [Table("PluginSyncHistory")]
    public class PluginSyncHistory
    {
        [Key]
        public Guid SyncHistoryId { get; set; }

        [Required]
        public Guid TenantPluginId { get; set; }

        [Required]
        [MaxLength(50)]
        public string SyncType { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        public int RecordsProcessed { get; set; } = 0;
        public int RecordsInserted { get; set; } = 0;
        public int RecordsUpdated { get; set; } = 0;
        public int RecordsSkipped { get; set; } = 0;

        public string? ErrorMessage { get; set; }

        [Column(TypeName = "jsonb")]
        public string? SyncDetails { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        // Navigation properties
        [ForeignKey("TenantPluginId")]
        public virtual TenantPlugin TenantPlugin { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User CreatedByUser { get; set; } = null!;

        public virtual ICollection<PluginSyncDetail> SyncDetailEntries { get; set; } = new List<PluginSyncDetail>();
    }

    // Plugin Sync Detail
    [Table("PluginSyncDetail")]
    public class PluginSyncDetail
    {
        [Key]
        public Guid SyncDetailId { get; set; }

        [Required]
        public Guid SyncHistoryId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Step { get; set; } = string.Empty;

        public int StepOrder { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        public string? Message { get; set; }

        [Column(TypeName = "jsonb")]
        public string? Data { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public TimeSpan? Duration { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        public DateTime Created { get; set; }

        // Navigation properties
        [ForeignKey("SyncHistoryId")]
        public virtual PluginSyncHistory SyncHistory { get; set; } = null!;

        [ForeignKey("CreatedBy")]
        public virtual User CreatedByUser { get; set; } = null!;
    }

    // QuickBooks Online Models
    [Table("QBO_Account")]
    public class QBOAccount
    {
        [Key]
        public Guid QBOAccountId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string QBOId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? FullyQualifiedName { get; set; }

        public bool Active { get; set; } = true;

        [MaxLength(50)]
        public string? Classification { get; set; }

        [MaxLength(50)]
        public string? AccountType { get; set; }

        [MaxLength(50)]
        public string? AccountSubType { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal CurrentBalance { get; set; } = 0;

        [Column(TypeName = "decimal(15,2)")]
        public decimal CurrentBalanceWithSubAccounts { get; set; } = 0;

        [MaxLength(10)]
        public string Currency { get; set; } = "USD";

        public DateTime SyncedAt { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;
    }

    [Table("QBO_Customer")]
    public class QBOCustomer
    {
        [Key]
        public Guid QBOCustomerId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string QBOId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? CompanyName { get; set; }

        public bool Active { get; set; } = true;

        [Column(TypeName = "decimal(15,2)")]
        public decimal Balance { get; set; } = 0;

        [Column(TypeName = "decimal(15,2)")]
        public decimal BalanceWithJobs { get; set; } = 0;

        [MaxLength(10)]
        public string CurrencyRef { get; set; } = "USD";

        [MaxLength(200)]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? Phone { get; set; }

        [MaxLength(50)]
        public string? Mobile { get; set; }

        [MaxLength(50)]
        public string? Fax { get; set; }

        [MaxLength(200)]
        public string? Website { get; set; }

        [Column(TypeName = "jsonb")]
        public string? BillAddr { get; set; }

        [Column(TypeName = "jsonb")]
        public string? ShipAddr { get; set; }

        public DateTime SyncedAt { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;
    }

    [Table("QBO_Item")]
    public class QBOItem
    {
        [Key]
        public Guid QBOItemId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string QBOId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? FullyQualifiedName { get; set; }

        public bool Active { get; set; } = true;

        [MaxLength(50)]
        public string? Type { get; set; }

        public string? Description { get; set; }

        [Column(TypeName = "decimal(10,4)")]
        public decimal? UnitPrice { get; set; }

        [MaxLength(50)]
        public string? IncomeAccountRef { get; set; }

        [MaxLength(50)]
        public string? ExpenseAccountRef { get; set; }

        [MaxLength(50)]
        public string? AssetAccountRef { get; set; }

        [MaxLength(100)]
        public string? SKU { get; set; }

        public bool Taxable { get; set; } = false;

        [MaxLength(50)]
        public string? SalesTaxCodeRef { get; set; }

        [MaxLength(50)]
        public string? PurchaseTaxCodeRef { get; set; }

        public DateTime SyncedAt { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;
    }

    [Table("QBO_Invoice")]
    public class QBOInvoice
    {
        [Key]
        public Guid QBOInvoiceId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string QBOId { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? DocNumber { get; set; }

        public DateOnly TxnDate { get; set; }
        public DateOnly? DueDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string CustomerRef { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? CustomerName { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal TotalAmt { get; set; } = 0;

        [Column(TypeName = "decimal(15,2)")]
        public decimal Balance { get; set; } = 0;

        [Column(TypeName = "decimal(15,2)")]
        public decimal HomeTotalAmt { get; set; } = 0;

        [MaxLength(50)]
        public string? TxnStatus { get; set; }

        [MaxLength(50)]
        public string? EmailStatus { get; set; }

        [MaxLength(50)]
        public string? PrintStatus { get; set; }

        [MaxLength(50)]
        public string? SalesTermRef { get; set; }

        [Column(TypeName = "jsonb")]
        public string? ShipAddr { get; set; }

        [Column(TypeName = "jsonb")]
        public string? BillAddr { get; set; }

        [Column(TypeName = "jsonb")]
        public string? Line { get; set; }

        [Column(TypeName = "jsonb")]
        public string? TxnTaxDetail { get; set; }

        public DateTime SyncedAt { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;
    }

    [Table("QBO_Payment")]
    public class QBOPayment
    {
        [Key]
        public Guid QBOPaymentId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string QBOId { get; set; } = string.Empty;

        public DateOnly TxnDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string CustomerRef { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? CustomerName { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal TotalAmt { get; set; } = 0;

        [Column(TypeName = "decimal(15,2)")]
        public decimal UnappliedAmt { get; set; } = 0;

        [MaxLength(50)]
        public string? PaymentMethodRef { get; set; }

        [MaxLength(50)]
        public string? PaymentRefNum { get; set; }

        [MaxLength(50)]
        public string? DepositToAccountRef { get; set; }

        [Column(TypeName = "jsonb")]
        public string? Line { get; set; }

        public DateTime SyncedAt { get; set; }
        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }

        // Navigation properties
        [ForeignKey("TenantId")]
        public virtual Tenant Tenant { get; set; } = null!;
    }

    // Constants for plugin system
    public static class SyncStatuses
    {
        public const string PENDING = "pending";
        public const string SYNCING = "syncing";
        public const string COMPLETED = "completed";
        public const string ERROR = "error";
    }

    public static class SyncTypes
    {
        public const string FULL = "full";
        public const string INCREMENTAL = "incremental";
        public const string MANUAL = "manual";
    }

    public static class SyncHistoryStatuses
    {
        public const string STARTED = "started";
        public const string COMPLETED = "completed";
        public const string FAILED = "failed";
    }

    public static class PluginCategories
    {
        public const string FINANCIAL = "Financial";
        public const string INVENTORY = "Inventory";
        public const string CRM = "CRM";
        public const string MARKETING = "Marketing";
        public const string ANALYTICS = "Analytics";
    }
}