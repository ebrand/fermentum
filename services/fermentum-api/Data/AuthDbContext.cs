using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Models;
using FermentumApi.Models;
using FermentumApi.Models.BJCP;
using System.Linq;

namespace Fermentum.Auth.Data;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
        // Disable lazy loading to prevent circular reference issues
        ChangeTracker.LazyLoadingEnabled = false;
    }

    // Core tables matching ERD exactly
    public DbSet<Plan> Plans { get; set; }
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Brewery> Breweries { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }
    public DbSet<TenantPaymentMethod> TenantPaymentMethods { get; set; }
    public DbSet<FermentumApi.Models.UserTenant> UserTenants { get; set; }
    public DbSet<FermentumApi.Models.AuditLog> AuditLogs { get; set; }
    public DbSet<Invitation> Invitations { get; set; }

    // Raw Materials Inventory System - TO BE REDESIGNED
    public DbSet<RawMaterialCategory> RawMaterialCategories { get; set; }
    // public DbSet<Supplier> Suppliers { get; set; } // Commented out - class removed
    // public DbSet<PurchaseOrder> PurchaseOrders { get; set; } // Commented out - class removed
    // public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; } // Commented out - class doesn't exist
    // public DbSet<InventoryLot> InventoryLots { get; set; } // Commented out - class doesn't exist
    // public DbSet<InventoryLotTransaction> InventoryLotTransactions { get; set; } // Commented out - class removed
    // public DbSet<QualityTest> QualityTests { get; set; } // Commented out - class removed
    // public DbSet<InventoryAlert> InventoryAlerts { get; set; } // Commented out - class removed
    // public DbSet<InventoryAlertLog> InventoryAlertLogs { get; set; } // Commented out - class removed

    // Finished Goods - Legacy (keeping for existing functionality)
    public DbSet<FinishedGoodsCategory> FinishedGoodsCategories { get; set; }
    public DbSet<FinishedGoods> FinishedGoods { get; set; }
    public DbSet<FinishedGoodsInventory> FinishedGoodsInventories { get; set; }

    // Plugin system tables
    public DbSet<FermentumApi.Models.Plugin> Plugins { get; set; }
    public DbSet<TenantPlugin> TenantPlugins { get; set; }
    public DbSet<PluginSyncHistory> PluginSyncHistory { get; set; }
    public DbSet<PluginSyncDetail> PluginSyncDetails { get; set; }

    // QuickBooks Online tables
    public DbSet<QBOAccount> QBOAccounts { get; set; }
    public DbSet<QBOCustomer> QBOCustomers { get; set; }
    public DbSet<QBOItem> QBOItems { get; set; }
    public DbSet<QBOInvoice> QBOInvoices { get; set; }
    public DbSet<QBOPayment> QBOPayments { get; set; }

    // Notification system tables
    public DbSet<FermentumApi.Models.Notification> Notifications { get; set; }
    public DbSet<NotificationEventListener> NotificationEventListeners { get; set; }
    public DbSet<NotificationDeliveryLog> NotificationDeliveryLogs { get; set; }
    public DbSet<UserNotificationStatus> UserNotificationStatuses { get; set; }

    // Assignment system tables
    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<AssignmentCategory> AssignmentCategories { get; set; }
    public DbSet<AssignmentStatusHistory> AssignmentStatusHistories { get; set; }
    public DbSet<AssignmentComment> AssignmentComments { get; set; }
    public DbSet<AssignmentTemplate> AssignmentTemplates { get; set; }

    // Recipe Management System
    public DbSet<BJCPBeerStyle> BJCPBeerStyles { get; set; }
    public DbSet<Recipe> Recipes { get; set; }
    public DbSet<RecipeGrain> RecipeGrains { get; set; }
    public DbSet<RecipeHop> RecipeHops { get; set; }
    public DbSet<RecipeYeast> RecipeYeasts { get; set; }
    public DbSet<RecipeAdditive> RecipeAdditives { get; set; }
    // Commented out - RecipeMashStep table doesn't exist, using RecipeStep instead
    // public DbSet<RecipeMashStep> RecipeMashSteps { get; set; }
    public DbSet<RecipeStep> RecipeSteps { get; set; }
    public DbSet<WaterProfile> WaterProfiles { get; set; }
    public DbSet<RecipeVersion> RecipeVersions { get; set; }
    public DbSet<RecipeBrewSession> RecipeBrewSessions { get; set; }

    // Ingredient Management System
    public DbSet<FermentumApi.Models.Ingredients.Grain> Grains { get; set; }
    public DbSet<FermentumApi.Models.Ingredients.Hop> Hops { get; set; }
    public DbSet<FermentumApi.Models.Ingredients.Yeast> Yeasts { get; set; }
    public DbSet<FermentumApi.Models.Ingredients.Additive> Additives { get; set; }
    public DbSet<FermentumApi.Models.Ingredients.MashStep> MashSteps { get; set; }

    // Stock Inventory System
    public DbSet<FermentumApi.Models.Inventory.Stock> Stocks { get; set; }
    public DbSet<FermentumApi.Models.Inventory.StockInventory> StockInventories { get; set; }
    public DbSet<FermentumApi.Models.Inventory.LotAlert> LotAlerts { get; set; }
    public DbSet<FermentumApi.Models.Inventory.LotAlertDocument> LotAlertDocuments { get; set; }

    // Equipment Management System
    public DbSet<FermentumApi.Models.Equipment.EquipmentType> EquipmentTypes { get; set; }
    public DbSet<FermentumApi.Models.Equipment.Equipment> Equipment { get; set; }
    public DbSet<FermentumApi.Models.Equipment.EquipmentSchedule> EquipmentSchedules { get; set; }

    // Batch Management System
    public DbSet<FermentumApi.Models.Batch.Batch> Batches { get; set; }
    public DbSet<FermentumApi.Models.Batch.BatchStep> BatchSteps { get; set; }
    public DbSet<FermentumApi.Models.Batch.BatchIngredient> BatchIngredients { get; set; }
    public DbSet<FermentumApi.Models.Batch.BatchMeasurement> BatchMeasurements { get; set; }

    // BJCP Beer Style Management System
    public DbSet<BJCPBeerCategory> BJCPBeerCategories { get; set; }
    public DbSet<BJCPStyleTag> BJCPStyleTags { get; set; }
    public DbSet<BJCPStyleTagMapping> BJCPStyleTagMappings { get; set; }
    public DbSet<BJCPStyleCharacteristics> BJCPStyleCharacteristics { get; set; }
    public DbSet<BJCPCommercialExample> BJCPCommercialExamples { get; set; }
    // Temporarily disabled due to EF relationship issues
    // public DbSet<BJCPStyleComparison> BJCPStyleComparisons { get; set; }
    public DbSet<BJCPStyleRecommendation> BJCPStyleRecommendations { get; set; }
    public DbSet<BJCPRecipeStyleMatch> BJCPRecipeStyleMatches { get; set; }
    public DbSet<BJCPStyleJudging> BJCPStyleJudging { get; set; }
    public DbSet<BJCPRecipeCompetitionEntry> BJCPRecipeCompetitionEntries { get; set; }
    public DbSet<BJCPStylePopularity> BJCPStylePopularities { get; set; }
    public DbSet<BJCPStyleAnalytics> BJCPStyleAnalytics { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Disable automatic table name pluralization and naming conventions
        modelBuilder.HasDefaultSchema("public");

        // Plan configuration - ERD compliant
        modelBuilder.Entity<Plan>(entity =>
        {
            entity.ToTable("Plan");
            entity.HasKey(e => e.PlanId);
            entity.Property(e => e.PlanId).HasColumnName("PlanId");
            entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.BreweryLimit).HasColumnName("BreweryLimit").IsRequired();
            entity.Property(e => e.UserLimit).HasColumnName("UserLimit").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Indexes
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Tenant configuration - ERD compliant
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("Tenant");
            entity.HasKey(e => e.TenantId);
            entity.Property(e => e.TenantId).HasColumnName("TenantId");
            entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.PlanId).HasColumnName("PlanId");

            // Stripe billing fields
            entity.Property(e => e.StripeCustomerId).HasColumnName("StripeCustomerId").HasMaxLength(255);
            entity.Property(e => e.StripeSubscriptionId).HasColumnName("StripeSubscriptionId").HasMaxLength(255);
            entity.Property(e => e.SubscriptionStatus).HasColumnName("SubscriptionStatus").HasMaxLength(50);
            entity.Property(e => e.BillingEmail).HasColumnName("BillingEmail").HasMaxLength(255);
            entity.Property(e => e.TrialEndsAt).HasColumnName("TrialEndsAt");
            entity.Property(e => e.CurrentPeriodStart).HasColumnName("CurrentPeriodStart");
            entity.Property(e => e.CurrentPeriodEnd).HasColumnName("CurrentPeriodEnd");

            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Foreign key relationships
            entity.HasOne(e => e.Plan)
                  .WithMany(p => p.Tenants)
                  .HasForeignKey(e => e.PlanId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // User configuration - Updated for User_Tenant junction pattern
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("User");
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.StytchUserId).HasColumnName("StytchUserId").HasMaxLength(255);
            entity.Property(e => e.Email).HasColumnName("Email").HasMaxLength(255).IsRequired();
            entity.Property(e => e.FirstName).HasColumnName("FirstName").HasMaxLength(100);
            entity.Property(e => e.LastName).HasColumnName("LastName").HasMaxLength(100);
            entity.Property(e => e.AvatarUrl).HasColumnName("AvatarUrl");
            entity.Property(e => e.OauthType).HasColumnName("OauthType");

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.StytchUserId).IsUnique();
        });

        // Role configuration - ERD compliant
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Role");
            entity.HasKey(e => e.RoleId);
            entity.Property(e => e.RoleId).HasColumnName("RoleId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId");
            entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Foreign key relationships removed to avoid EF shadow property conflicts
            // Entity Framework will infer relationships from property names
        });

        // Brewery configuration - ERD compliant
        modelBuilder.Entity<Brewery>(entity =>
        {
            entity.ToTable("Brewery", "public");
            entity.HasKey(e => e.BreweryId);
            entity.Property(e => e.BreweryId).HasColumnName("BreweryId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId");
            entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Simple brewery model without explicit foreign key relationships
        });

        // Employee configuration - ERD compliant
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.ToTable("Employee");
            entity.HasKey(e => e.EmployeeId);
            entity.Property(e => e.EmployeeId).HasColumnName("EmployeeId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId");
            entity.Property(e => e.BreweryId).HasColumnName("BreweryId");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.FirstName).HasColumnName("FirstName").HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasColumnName("LastName").HasMaxLength(100).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("IsActive").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Foreign key relationships removed to avoid EF shadow property conflicts
            // Entity Framework will infer relationships from property names
        });

        // PaymentMethod configuration - ERD compliant
        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.ToTable("PaymentMethod");
            entity.HasKey(e => e.PaymentMethodId);
            entity.Property(e => e.PaymentMethodId).HasColumnName("PaymentMethodId");
            entity.Property(e => e.StripeCustomerId).HasColumnName("StripeCustomerId").HasMaxLength(255).IsRequired();
            entity.Property(e => e.StripePaymentMethodId).HasColumnName("StripePaymentMethodId").HasMaxLength(255).IsRequired();
            entity.Property(e => e.PaymentMethodType).HasColumnName("PaymentMethodType").HasMaxLength(50).IsRequired();
            entity.Property(e => e.CardBrand).HasColumnName("CardBrand").HasMaxLength(50);
            entity.Property(e => e.CardLast4).HasColumnName("CardLast4").HasMaxLength(4);
            entity.Property(e => e.CardExpMonth).HasColumnName("CardExpMonth");
            entity.Property(e => e.CardExpYear).HasColumnName("CardExpYear");
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");
        });

        // TenantPaymentMethod configuration - ERD compliant
        modelBuilder.Entity<TenantPaymentMethod>(entity =>
        {
            entity.ToTable("Tenant_PaymentMethod");
            entity.HasKey(e => new { e.TenantId, e.PaymentMethodId });
            entity.Property(e => e.TenantId).HasColumnName("TenantId");
            entity.Property(e => e.PaymentMethodId).HasColumnName("PaymentMethodId");
            entity.Property(e => e.IsDefault).HasColumnName("IsDefault").IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("IsActive").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Foreign key relationships removed to avoid EF shadow property conflicts
            // Entity Framework will infer relationships from property names
        });

        // UserTenant configuration - Junction table for User-Tenant relationships
        modelBuilder.Entity<FermentumApi.Models.UserTenant>(entity =>
        {
            entity.ToTable("User_Tenant");
            entity.HasKey(e => new { e.UserId, e.TenantId });
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId");
            entity.Property(e => e.Role).HasColumnName("Role").HasMaxLength(50).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("IsActive").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Foreign key relationships removed to avoid EF shadow property conflicts
            // Entity Framework will infer relationships from property names and composite primary key
        });

        // AuditLog configuration - ERD compliant
        modelBuilder.Entity<FermentumApi.Models.AuditLog>(entity =>
        {
            entity.ToTable("AuditLog");
            entity.HasKey(e => e.AuditLogId);
            entity.Property(e => e.AuditLogId).HasColumnName("AuditLogId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.Action).HasColumnName("Action").HasMaxLength(100).IsRequired();
            entity.Property(e => e.ResourceType).HasColumnName("ResourceType").HasMaxLength(50);
            entity.Property(e => e.ResourceId).HasColumnName("ResourceId").HasMaxLength(255);
            entity.Property(e => e.IpAddress).HasColumnName("IpAddress");
            entity.Property(e => e.UserAgent).HasColumnName("UserAgent");
            entity.Property(e => e.RequestId).HasColumnName("RequestId").HasMaxLength(100);
            entity.Property(e => e.OldValues).HasColumnName("OldValues").HasColumnType("jsonb");
            entity.Property(e => e.NewValues).HasColumnName("NewValues").HasColumnType("jsonb");
            entity.Property(e => e.Metadata).HasColumnName("Metadata").HasColumnType("jsonb");
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
        });

        // Invitation configuration - ERD compliant
        modelBuilder.Entity<Invitation>(entity =>
        {
            entity.ToTable("Invitation");
            entity.HasKey(e => e.InvitationId);
            entity.Property(e => e.InvitationId).HasColumnName("InvitationId");
            entity.Property(e => e.BreweryId).HasColumnName("BreweryId").IsRequired();
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.InvitationDate).HasColumnName("InvitationDate").IsRequired();
            entity.Property(e => e.ExpirationDate).HasColumnName("ExpirationDate").IsRequired();
            entity.Property(e => e.AcceptedDate).HasColumnName("AcceptedDate");
            entity.Property(e => e.Email).HasColumnName("Email").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Role).HasColumnName("Role").HasMaxLength(50).IsRequired();
            entity.Property(e => e.AcceptedFlag).HasColumnName("AcceptedFlag").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Indexes
            entity.HasIndex(e => e.BreweryId);
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => new { e.AcceptedFlag, e.ExpirationDate });
        });

        // Assignment configuration
        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.ToTable("Assignment");
            entity.HasKey(e => e.AssignmentId);
            entity.Property(e => e.AssignmentId).HasColumnName("AssignmentId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId").IsRequired();
            entity.Property(e => e.BreweryId).HasColumnName("BreweryId");
            entity.Property(e => e.CategoryId).HasColumnName("CategoryId");
            entity.Property(e => e.Title).HasColumnName("Title").HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.Instructions).HasColumnName("Instructions");
            entity.Property(e => e.Priority).HasColumnName("Priority").IsRequired().HasConversion<string>();
            entity.Property(e => e.Status).HasColumnName("Status").IsRequired().HasConversion<string>();
            entity.Property(e => e.AssignedBy).HasColumnName("AssignedBy").IsRequired();
            entity.Property(e => e.AssignedTo).HasColumnName("AssignedTo");
            entity.Property(e => e.DueDate).HasColumnName("DueDate");
            entity.Property(e => e.EstimatedDurationMinutes).HasColumnName("EstimatedDurationMinutes");
            entity.Property(e => e.ActualStartTime).HasColumnName("ActualStartTime");
            entity.Property(e => e.ActualCompletionTime).HasColumnName("ActualCompletionTime");
            entity.Property(e => e.Location).HasColumnName("Location").HasMaxLength(200);
            entity.Property(e => e.EquipmentId).HasColumnName("EquipmentId");
            entity.Property(e => e.BatchId).HasColumnName("BatchId");
            entity.Property(e => e.RequiresConfirmation).HasColumnName("RequiresConfirmation").IsRequired();
            entity.Property(e => e.ConfirmedAt).HasColumnName("ConfirmedAt");
            entity.Property(e => e.RequiresPhotos).HasColumnName("RequiresPhotos").IsRequired();
            entity.Property(e => e.RequiresSignoff).HasColumnName("RequiresSignoff").IsRequired();
            entity.Property(e => e.SignedOffBy).HasColumnName("SignedOffBy");
            entity.Property(e => e.SignedOffAt).HasColumnName("SignedOffAt");
            entity.Property(e => e.CompletionNotes).HasColumnName("CompletionNotes");
            entity.Property(e => e.PhotoUrls).HasColumnName("PhotoUrls").HasColumnType("text[]");
            entity.Property(e => e.IsRecurring).HasColumnName("IsRecurring").IsRequired();
            entity.Property(e => e.RecurrencePattern).HasColumnName("RecurrencePattern").HasColumnType("jsonb");
            entity.Property(e => e.ParentAssignmentId).HasColumnName("ParentAssignmentId");
            entity.Property(e => e.IsActive).HasColumnName("IsActive").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Indexes
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.AssignedTo);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.DueDate);

            // Configure navigation properties with explicit foreign keys
            entity.HasOne(e => e.Tenant)
                  .WithMany()
                  .HasForeignKey(e => e.TenantId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Assignments)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.AssignedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.AssignedBy)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AssignedToEmployee)
                  .WithMany()
                  .HasForeignKey(e => e.AssignedTo)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.SignedOffByUser)
                  .WithMany()
                  .HasForeignKey(e => e.SignedOffBy)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ParentAssignment)
                  .WithMany(p => p.ChildAssignments)
                  .HasForeignKey(e => e.ParentAssignmentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // AssignmentCategory configuration
        modelBuilder.Entity<AssignmentCategory>(entity =>
        {
            entity.ToTable("AssignmentCategory");
            entity.HasKey(e => e.CategoryId);
            entity.Property(e => e.CategoryId).HasColumnName("CategoryId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId").IsRequired();
            entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.Color).HasColumnName("Color").HasMaxLength(7);
            entity.Property(e => e.IsActive).HasColumnName("IsActive").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Indexes
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();

            // Configure navigation properties
            entity.HasOne(e => e.Tenant)
                  .WithMany()
                  .HasForeignKey(e => e.TenantId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // AssignmentStatusHistory configuration
        modelBuilder.Entity<AssignmentStatusHistory>(entity =>
        {
            entity.ToTable("AssignmentStatusHistory");
            entity.HasKey(e => e.HistoryId);
            entity.Property(e => e.HistoryId).HasColumnName("HistoryId");
            entity.Property(e => e.AssignmentId).HasColumnName("AssignmentId").IsRequired();
            entity.Property(e => e.FromStatus).HasColumnName("FromStatus").HasConversion<string>();
            entity.Property(e => e.ToStatus).HasColumnName("ToStatus").IsRequired().HasConversion<string>();
            entity.Property(e => e.ChangedBy).HasColumnName("ChangedBy").IsRequired();
            entity.Property(e => e.ChangedAt).HasColumnName("ChangedAt").IsRequired();
            entity.Property(e => e.Reason).HasColumnName("Reason").HasMaxLength(500);
            entity.Property(e => e.Notes).HasColumnName("Notes");

            // Indexes
            entity.HasIndex(e => e.AssignmentId);
            entity.HasIndex(e => e.ChangedAt);

            // Configure navigation properties
            entity.HasOne(e => e.Assignment)
                  .WithMany(a => a.StatusHistory)
                  .HasForeignKey(e => e.AssignmentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ChangedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ChangedBy)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AssignmentComment configuration
        modelBuilder.Entity<AssignmentComment>(entity =>
        {
            entity.ToTable("AssignmentComment");
            entity.HasKey(e => e.CommentId);
            entity.Property(e => e.CommentId).HasColumnName("CommentId");
            entity.Property(e => e.AssignmentId).HasColumnName("AssignmentId").IsRequired();
            entity.Property(e => e.UserId).HasColumnName("UserId").IsRequired();
            entity.Property(e => e.CommentText).HasColumnName("CommentText").IsRequired();
            entity.Property(e => e.IsInternal).HasColumnName("IsInternal").IsRequired();
            entity.Property(e => e.PhotoUrls).HasColumnName("PhotoUrls").HasColumnType("text[]");
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();

            // Indexes
            entity.HasIndex(e => e.AssignmentId);
            entity.HasIndex(e => e.Created);

            // Configure navigation properties
            entity.HasOne(e => e.Assignment)
                  .WithMany(a => a.Comments)
                  .HasForeignKey(e => e.AssignmentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AssignmentTemplate configuration
        modelBuilder.Entity<AssignmentTemplate>(entity =>
        {
            entity.ToTable("AssignmentTemplate");
            entity.HasKey(e => e.TemplateId);
            entity.Property(e => e.TemplateId).HasColumnName("TemplateId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId").IsRequired();
            entity.Property(e => e.CategoryId).HasColumnName("CategoryId");
            entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(200).IsRequired();
            entity.Property(e => e.Title).HasColumnName("Title").HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.Instructions).HasColumnName("Instructions");
            entity.Property(e => e.EstimatedDurationMinutes).HasColumnName("EstimatedDurationMinutes");
            entity.Property(e => e.Priority).HasColumnName("Priority").IsRequired().HasConversion<string>();
            entity.Property(e => e.RequiresConfirmation).HasColumnName("RequiresConfirmation").IsRequired();
            entity.Property(e => e.RequiresPhotos).HasColumnName("RequiresPhotos").IsRequired();
            entity.Property(e => e.RequiresSignoff).HasColumnName("RequiresSignoff").IsRequired();
            entity.Property(e => e.DefaultAssigneeRole).HasColumnName("DefaultAssigneeRole").HasMaxLength(50);
            entity.Property(e => e.IsActive).HasColumnName("IsActive").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy");

            // Indexes
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();

            // Configure navigation properties
            entity.HasOne(e => e.Tenant)
                  .WithMany()
                  .HasForeignKey(e => e.TenantId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Templates)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Supplier configuration - COMMENTED OUT (class removed)
        /*
        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("Supplier");
            entity.HasKey(e => e.SupplierId);
            entity.Property(e => e.SupplierId).HasColumnName("SupplierId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId").IsRequired();
            entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(200).IsRequired();
            entity.Property(e => e.ContactName).HasColumnName("ContactName").HasMaxLength(100);
            entity.Property(e => e.Email).HasColumnName("Email").HasMaxLength(255);
            entity.Property(e => e.Phone).HasColumnName("Phone").HasMaxLength(50);
            entity.Property(e => e.Address).HasColumnName("Address");
            entity.Property(e => e.City).HasColumnName("City").HasMaxLength(100);
            entity.Property(e => e.State).HasColumnName("State").HasMaxLength(50);
            entity.Property(e => e.PostalCode).HasColumnName("PostalCode").HasMaxLength(20);
            entity.Property(e => e.Country).HasColumnName("Country").HasMaxLength(100);
            entity.Property(e => e.Website).HasColumnName("Website").HasMaxLength(255);
            entity.Property(e => e.Notes).HasColumnName("Notes");
            entity.Property(e => e.IsActive).HasColumnName("IsActive").IsRequired();
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy").IsRequired();
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy").IsRequired();

            // Indexes
            entity.HasIndex(e => e.TenantId);
        });
        */

        // PurchaseOrder configuration - COMMENTED OUT (class removed)
        /*
        modelBuilder.Entity<PurchaseOrder>(entity =>
        {
            entity.ToTable("PurchaseOrder");
            entity.HasKey(e => e.PurchaseOrderId);
            entity.Property(e => e.PurchaseOrderId).HasColumnName("PurchaseOrderId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId").IsRequired();
            entity.Property(e => e.SupplierId).HasColumnName("SupplierId").IsRequired();
            entity.Property(e => e.PONumber).HasColumnName("PONumber").HasMaxLength(100).IsRequired();
            entity.Property(e => e.OrderDate).HasColumnName("OrderDate").IsRequired();
            entity.Property(e => e.ExpectedDeliveryDate).HasColumnName("ExpectedDeliveryDate");
            entity.Property(e => e.ActualDeliveryDate).HasColumnName("ActualDeliveryDate");
            entity.Property(e => e.Status).HasColumnName("Status").HasMaxLength(50).IsRequired();
            entity.Property(e => e.SubTotal).HasColumnName("SubTotal").HasColumnType("decimal(12,2)");
            entity.Property(e => e.TaxAmount).HasColumnName("TaxAmount").HasColumnType("decimal(12,2)");
            entity.Property(e => e.ShippingAmount).HasColumnName("ShippingAmount").HasColumnType("decimal(12,2)");
            entity.Property(e => e.TotalAmount).HasColumnName("TotalAmount").HasColumnType("decimal(12,2)");
            entity.Property(e => e.Notes).HasColumnName("Notes");
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy").IsRequired();
            entity.Property(e => e.Updated).HasColumnName("Updated").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("UpdatedBy").IsRequired();

            // Indexes
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => new { e.TenantId, e.PONumber }).IsUnique();
        });
        */

        // QualityTest configuration - COMMENTED OUT (class removed)
        /*
        modelBuilder.Entity<QualityTest>(entity =>
        {
            entity.ToTable("QualityTest");
            entity.HasKey(e => e.TestId);
            entity.Property(e => e.TestId).HasColumnName("TestId");
            entity.Property(e => e.TenantId).HasColumnName("TenantId").IsRequired();
            entity.Property(e => e.LotId).HasColumnName("LotId").IsRequired();
            entity.Property(e => e.TestType).HasColumnName("TestType").HasMaxLength(100).IsRequired();
            entity.Property(e => e.TestDate).HasColumnName("TestDate").IsRequired();
            entity.Property(e => e.TestedBy).HasColumnName("TestedBy");
            entity.Property(e => e.TestMethod).HasColumnName("TestMethod").HasMaxLength(100);
            entity.Property(e => e.ExpectedValue).HasColumnName("ExpectedValue").HasColumnType("decimal(10,4)");
            entity.Property(e => e.ActualValue).HasColumnName("ActualValue").HasColumnType("decimal(10,4)");
            entity.Property(e => e.Units).HasColumnName("Units").HasMaxLength(20);
            entity.Property(e => e.PassFail).HasColumnName("PassFail");
            entity.Property(e => e.Notes).HasColumnName("Notes");
            entity.Property(e => e.CertificateOfAnalysis).HasColumnName("CertificateOfAnalysis");
            entity.Property(e => e.Created).HasColumnName("Created").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy").IsRequired();

            // Indexes
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.LotId);
        });
        */

        // Recipe Management System - minimal configuration, relying on data annotations in models
        // Entity Framework will use the Table and Column attributes on the model classes

        // Ingredient Management System Configuration
        modelBuilder.Entity<FermentumApi.Models.Ingredients.Grain>(entity =>
        {
            entity.ToTable("Grain");
            entity.HasKey(e => e.GrainId);
        });

        modelBuilder.Entity<FermentumApi.Models.Ingredients.Hop>(entity =>
        {
            entity.ToTable("Hop");
            entity.HasKey(e => e.HopId);
        });

        modelBuilder.Entity<FermentumApi.Models.Ingredients.Yeast>(entity =>
        {
            entity.ToTable("Yeast");
            entity.HasKey(e => e.YeastId);
        });

        modelBuilder.Entity<FermentumApi.Models.Ingredients.Additive>(entity =>
        {
            entity.ToTable("Additive");
            entity.HasKey(e => e.AdditiveId);
        });

        // Stock Inventory System Configuration
        modelBuilder.Entity<FermentumApi.Models.Inventory.Stock>(entity =>
        {
            entity.ToTable("Stock");
            entity.HasKey(e => e.StockId);
        });

        modelBuilder.Entity<FermentumApi.Models.Inventory.StockInventory>(entity =>
        {
            entity.ToTable("StockInventory");
            entity.HasKey(e => e.StockInventoryId);
        });

        modelBuilder.Entity<FermentumApi.Models.Inventory.LotAlert>(entity =>
        {
            entity.ToTable("LotAlert");
            entity.HasKey(e => e.LotAlertId);

            // Configure enum conversions
            entity.Property(e => e.Severity)
                  .HasConversion<string>()
                  .HasColumnType("\"LotAlertSeverity\"");

            entity.Property(e => e.Status)
                  .HasConversion<string>()
                  .HasColumnType("\"LotAlertStatus\"");

            // Configure array column
            entity.Property(e => e.AffectedBatches)
                  .HasColumnType("text[]");
        });

        modelBuilder.Entity<FermentumApi.Models.Inventory.LotAlertDocument>(entity =>
        {
            entity.ToTable("LotAlertDocument");
            entity.HasKey(e => e.LotAlertDocumentId);
        });

        // BJCP System Configuration
        modelBuilder.Entity<BJCPStyleTagMapping>(entity =>
        {
            entity.ToTable("BJCP_StyleTagMapping");
            entity.HasKey(e => new { e.StyleId, e.TagId });
            entity.Property(e => e.Created).IsRequired();
        });

        // Configure BJCPStyleComparison relationships explicitly to resolve EF shadow property conflicts
        // Temporarily disabled due to EF relationship conflicts
        /*
        modelBuilder.Entity<BJCPStyleComparison>(entity =>
        {
            entity.ToTable("BJCP_StyleComparison");
            entity.HasKey(e => e.ComparisonId);

            // Configure both relationships explicitly with different navigation names
            entity.HasOne(e => e.PrimaryStyle)
                  .WithMany()
                  .HasForeignKey(e => e.PrimaryStyleId)
                  .HasPrincipalKey(bs => bs.StyleId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .HasConstraintName("FK_BJCPStyleComparison_PrimaryStyle");

            entity.HasOne(e => e.ComparedStyle)
                  .WithMany()
                  .HasForeignKey(e => e.ComparedStyleId)
                  .HasPrincipalKey(bs => bs.StyleId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .HasConstraintName("FK_BJCPStyleComparison_ComparedStyle");

            // Configure properties explicitly
            entity.Property(e => e.PrimaryStyleId).HasColumnName("PrimaryStyleId").IsRequired();
            entity.Property(e => e.ComparedStyleId).HasColumnName("ComparedStyleId").IsRequired();
        });
        */

        // Recipe junction table configurations
        modelBuilder.Entity<RecipeGrain>(entity =>
        {
            entity.ToTable("RecipeGrain");
            entity.HasKey(e => e.RecipeGrainId);
            entity.Property(e => e.RecipeGrainId).HasColumnName("RecipeGrainId");
            entity.Property(e => e.RecipeId).HasColumnName("RecipeId").IsRequired();
            entity.Property(e => e.GrainId).HasColumnName("GrainId").IsRequired();
            entity.Property(e => e.Amount).HasColumnName("Amount").HasColumnType("decimal(8,3)").IsRequired();
            entity.Property(e => e.Unit).HasColumnName("Unit").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Percentage).HasColumnName("Percentage").HasColumnType("decimal(5,2)");
            entity.Property(e => e.Lovibond).HasColumnName("Lovibond").HasColumnType("decimal(4,1)");
            entity.Property(e => e.Notes).HasColumnName("Notes");

            // Ignore properties that might not exist in database
            entity.Ignore(e => e.SortOrder);
            entity.Ignore(e => e.ExtractPotential);
            entity.Ignore(e => e.MustMash);
            entity.Ignore(e => e.MaxInBatch);
            entity.Ignore(e => e.AddAfterBoil);
            entity.Ignore(e => e.SteepTime);

            entity.HasIndex(e => e.RecipeId);
            entity.HasIndex(e => e.GrainId);
        });

        modelBuilder.Entity<RecipeHop>(entity =>
        {
            entity.ToTable("RecipeHop");
            entity.HasKey(e => e.RecipeHopId);
            entity.Property(e => e.RecipeHopId).HasColumnName("RecipeHopId");
            entity.Property(e => e.RecipeId).HasColumnName("RecipeId").IsRequired();
            entity.Property(e => e.HopId).HasColumnName("HopId").IsRequired();
            entity.Property(e => e.Amount).HasColumnName("Amount").HasColumnType("decimal(6,3)").IsRequired();
            entity.Property(e => e.Unit).HasColumnName("Unit").HasMaxLength(20).IsRequired();
            entity.Property(e => e.AdditionTime).HasColumnName("AdditionTime");
            entity.Property(e => e.AdditionType).HasColumnName("AdditionType").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Form).HasColumnName("Form").HasMaxLength(20);
            entity.Property(e => e.AlphaAcid).HasColumnName("AlphaAcid").HasColumnType("decimal(4,2)");
            entity.Property(e => e.IBUContribution).HasColumnName("IBUContribution").HasColumnType("decimal(5,1)");
            entity.Property(e => e.Notes).HasColumnName("Notes");

            // Ignore properties that don't exist in database
            entity.Ignore(e => e.Cohumulone);
            entity.Ignore(e => e.BetaAcid);
            entity.Ignore(e => e.TotalOil);
            entity.Ignore(e => e.UtilizationRate);
            entity.Ignore(e => e.DryHopDays);
            entity.Ignore(e => e.DryHopTemperature);
            entity.Ignore(e => e.Purpose);
            entity.Ignore(e => e.SortOrder);

            entity.HasIndex(e => e.RecipeId);
            entity.HasIndex(e => e.HopId);
        });

        modelBuilder.Entity<RecipeYeast>(entity =>
        {
            entity.ToTable("RecipeYeast");
            entity.HasKey(e => e.RecipeYeastId);
            entity.Property(e => e.RecipeYeastId).HasColumnName("RecipeYeastId");
            entity.Property(e => e.RecipeId).HasColumnName("RecipeId").IsRequired();
            entity.Property(e => e.YeastId).HasColumnName("YeastId").IsRequired();
            entity.Property(e => e.Amount).HasColumnName("Amount").HasColumnType("decimal(6,2)").IsRequired();
            entity.Property(e => e.Unit).HasColumnName("Unit").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Attenuation).HasColumnName("Attenuation").HasColumnType("decimal(4,1)");
            // Ignore properties that might not exist in database
            entity.Ignore(e => e.FermentationNotes);
            entity.Ignore(e => e.YeastType);
            entity.Ignore(e => e.Form);
            entity.Ignore(e => e.Flocculation);
            entity.Ignore(e => e.ToleranceABV);
            entity.Ignore(e => e.TemperatureMin);
            entity.Ignore(e => e.TemperatureMax);
            entity.Ignore(e => e.TemperatureOptimal);
            entity.Ignore(e => e.RequiresStarter);
            entity.Ignore(e => e.StarterSize);
            entity.Ignore(e => e.StarterGravity);
            entity.Ignore(e => e.PitchingTemperature);
            entity.Ignore(e => e.SortOrder);

            entity.HasIndex(e => e.RecipeId);
            entity.HasIndex(e => e.YeastId);
        });

        modelBuilder.Entity<RecipeAdditive>(entity =>
        {
            entity.ToTable("RecipeAdditive");
            entity.HasKey(e => e.RecipeAdditiveId);
            entity.Property(e => e.RecipeAdditiveId).HasColumnName("RecipeAdditiveId");
            entity.Property(e => e.RecipeId).HasColumnName("RecipeId").IsRequired();
            entity.Property(e => e.AdditiveId).HasColumnName("AdditiveId").IsRequired();
            entity.Property(e => e.Amount).HasColumnName("Amount").HasColumnType("decimal(8,3)").IsRequired();
            entity.Property(e => e.Unit).HasColumnName("Unit").HasMaxLength(20).IsRequired();
            entity.Property(e => e.AdditionTime).HasColumnName("AdditionTime");
            // Ignore properties that might not exist in database
            entity.Ignore(e => e.AdditionStage);
            entity.Ignore(e => e.Purpose);
            entity.Ignore(e => e.TargetParameter);
            entity.Ignore(e => e.TargetValue);
            entity.Ignore(e => e.SortOrder);
            // Explicitly ignore Instructions property if EF is trying to find it
            entity.Ignore("Instructions");

            entity.HasIndex(e => e.RecipeId);
            entity.HasIndex(e => e.AdditiveId);
        });

        // Commented out - RecipeMashStep table doesn't exist, using RecipeStep instead
        /*
        modelBuilder.Entity<RecipeMashStep>(entity =>
        {
            entity.ToTable("RecipeMashStep");
            entity.HasKey(e => e.MashStepId);
            entity.Property(e => e.MashStepId).HasColumnName("MashStepId");
            entity.Property(e => e.RecipeId).HasColumnName("RecipeId").IsRequired();
            entity.Property(e => e.StepNumber).HasColumnName("StepNumber").IsRequired();
            entity.Property(e => e.StepName).HasColumnName("StepName").HasMaxLength(100);
            entity.Property(e => e.StepType).HasColumnName("StepType").HasMaxLength(50);
            entity.Property(e => e.Temperature).HasColumnName("Temperature").HasColumnType("decimal(5,2)").IsRequired();
            entity.Property(e => e.TemperatureUnit).HasColumnName("TemperatureUnit").HasMaxLength(10);
            entity.Property(e => e.Duration).HasColumnName("Duration").IsRequired();
            entity.Property(e => e.InfusionAmount).HasColumnName("InfusionAmount").HasColumnType("decimal(6,2)");
            entity.Property(e => e.InfusionTemp).HasColumnName("InfusionTemp").HasColumnType("decimal(5,2)");
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.Created).HasColumnName("Created");
            // Explicitly ignore Instructions property if EF is trying to find it
            entity.Ignore("Instructions");

            entity.HasIndex(e => e.RecipeId);
            entity.HasIndex(e => new { e.RecipeId, e.StepNumber }).IsUnique().HasDatabaseName("UK_RecipeMashStep_RecipeStep");
        });
        */

    }
}