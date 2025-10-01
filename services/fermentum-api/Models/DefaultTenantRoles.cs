namespace Fermentum.Auth.Models;

public static class DefaultTenantRoles
{
    public static readonly Dictionary<string, DefaultRoleConfig> SystemRoles = new()
    {
        {
            "owner",
            new DefaultRoleConfig
            {
                Name = "owner",
                DisplayName = "Owner",
                Description = "Full access to all brewery operations and settings. Can manage users, billing, and all business functions.",
                IsSystemRole = true,
                Permissions = GetOwnerPermissions()
            }
        },
        {
            "manager",
            new DefaultRoleConfig
            {
                Name = "manager",
                DisplayName = "Manager",
                Description = "Operational management role with access to production, inventory, sales, and reporting. Cannot manage users or billing.",
                IsSystemRole = true,
                Permissions = GetManagerPermissions()
            }
        },
        {
            "employee",
            new DefaultRoleConfig
            {
                Name = "employee",
                DisplayName = "Employee",
                Description = "Basic employee access to view operations and record daily activities. Limited editing capabilities.",
                IsSystemRole = true,
                Permissions = GetEmployeePermissions()
            }
        },
        {
            "sales_rep",
            new DefaultRoleConfig
            {
                Name = "sales_rep",
                DisplayName = "Sales Representative",
                Description = "Focused on sales operations with access to customers, orders, and sales reporting.",
                IsSystemRole = true,
                Permissions = GetSalesRepPermissions()
            }
        },
        {
            "brewer",
            new DefaultRoleConfig
            {
                Name = "brewer",
                DisplayName = "Brewer",
                Description = "Production-focused role with access to recipes, batches, and quality control.",
                IsSystemRole = true,
                Permissions = GetBrewerPermissions()
            }
        }
    };

    private static string[] GetOwnerPermissions()
    {
        // Owner has all permissions
        return TenantPermissions.PermissionDescriptions.Keys.ToArray();
    }

    private static string[] GetManagerPermissions()
    {
        return new[]
        {
            // Core System (limited)
            TenantPermissions.AccessDashboard,
            TenantPermissions.ViewTenantSettings,
            TenantPermissions.ViewBilling,

            // Production (full)
            TenantPermissions.ViewProduction,
            TenantPermissions.ManageProduction,
            TenantPermissions.ViewRecipes,
            TenantPermissions.ManageRecipes,
            TenantPermissions.ViewBatches,
            TenantPermissions.ManageBatches,
            TenantPermissions.ViewQualityControl,
            TenantPermissions.ManageQualityControl,

            // Inventory (full)
            TenantPermissions.ViewInventory,
            TenantPermissions.ManageInventory,
            TenantPermissions.ViewIngredients,
            TenantPermissions.ManageIngredients,
            TenantPermissions.ViewPackaging,
            TenantPermissions.ManagePackaging,
            TenantPermissions.ViewEquipment,
            TenantPermissions.ManageEquipment,

            // Sales & Distribution (full)
            TenantPermissions.ViewSales,
            TenantPermissions.ManageSales,
            TenantPermissions.ViewOrders,
            TenantPermissions.ManageOrders,
            TenantPermissions.ViewCustomers,
            TenantPermissions.ManageCustomers,
            TenantPermissions.ViewDistribution,
            TenantPermissions.ManageDistribution,

            // Financial & Reporting (view + reports)
            TenantPermissions.ViewFinancials,
            TenantPermissions.ViewReports,
            TenantPermissions.ManageReports,
            TenantPermissions.ViewAnalytics,
            TenantPermissions.ExportData,

            // Compliance (view + manage)
            TenantPermissions.ViewCompliance,
            TenantPermissions.ManageCompliance,
            TenantPermissions.ViewDocumentation,
            TenantPermissions.ManageDocumentation,
            TenantPermissions.ViewAudits,
            TenantPermissions.ManageAudits
        };
    }

    private static string[] GetEmployeePermissions()
    {
        return new[]
        {
            // Core System (basic)
            TenantPermissions.AccessDashboard,

            // Production (view + limited manage)
            TenantPermissions.ViewProduction,
            TenantPermissions.ViewRecipes,
            TenantPermissions.ViewBatches,
            TenantPermissions.ManageBatches, // Can update batch records
            TenantPermissions.ViewQualityControl,
            TenantPermissions.ManageQualityControl, // Can record QC tests

            // Inventory (view + limited update)
            TenantPermissions.ViewInventory,
            TenantPermissions.ViewIngredients,
            TenantPermissions.ViewPackaging,
            TenantPermissions.ViewEquipment,

            // Sales & Distribution (view only)
            TenantPermissions.ViewSales,
            TenantPermissions.ViewOrders,
            TenantPermissions.ViewCustomers,
            TenantPermissions.ViewDistribution,

            // Financial & Reporting (view only)
            TenantPermissions.ViewReports,

            // Compliance (view + limited documentation)
            TenantPermissions.ViewCompliance,
            TenantPermissions.ViewDocumentation,
            TenantPermissions.ViewAudits
        };
    }

    private static string[] GetSalesRepPermissions()
    {
        return new[]
        {
            // Core System (basic)
            TenantPermissions.AccessDashboard,

            // Production (view only - for customer inquiries)
            TenantPermissions.ViewProduction,
            TenantPermissions.ViewRecipes,

            // Inventory (view only - for availability)
            TenantPermissions.ViewInventory,

            // Sales & Distribution (full)
            TenantPermissions.ViewSales,
            TenantPermissions.ManageSales,
            TenantPermissions.ViewOrders,
            TenantPermissions.ManageOrders,
            TenantPermissions.ViewCustomers,
            TenantPermissions.ManageCustomers,
            TenantPermissions.ViewDistribution,

            // Financial & Reporting (sales-focused)
            TenantPermissions.ViewReports,
            TenantPermissions.ViewAnalytics,
            TenantPermissions.ExportData,

            // Compliance (view only)
            TenantPermissions.ViewCompliance,
            TenantPermissions.ViewDocumentation
        };
    }

    private static string[] GetBrewerPermissions()
    {
        return new[]
        {
            // Core System (basic)
            TenantPermissions.AccessDashboard,

            // Production (full)
            TenantPermissions.ViewProduction,
            TenantPermissions.ManageProduction,
            TenantPermissions.ViewRecipes,
            TenantPermissions.ManageRecipes,
            TenantPermissions.ViewBatches,
            TenantPermissions.ManageBatches,
            TenantPermissions.ViewQualityControl,
            TenantPermissions.ManageQualityControl,

            // Inventory (ingredients and equipment focus)
            TenantPermissions.ViewInventory,
            TenantPermissions.ManageInventory,
            TenantPermissions.ViewIngredients,
            TenantPermissions.ManageIngredients,
            TenantPermissions.ViewEquipment,
            TenantPermissions.ManageEquipment,

            // Sales & Distribution (view only - for production planning)
            TenantPermissions.ViewSales,
            TenantPermissions.ViewOrders,

            // Financial & Reporting (production-focused)
            TenantPermissions.ViewReports,
            TenantPermissions.ViewAnalytics,

            // Compliance (full - brewing regulations)
            TenantPermissions.ViewCompliance,
            TenantPermissions.ManageCompliance,
            TenantPermissions.ViewDocumentation,
            TenantPermissions.ManageDocumentation,
            TenantPermissions.ViewAudits,
            TenantPermissions.ManageAudits
        };
    }
}

public class DefaultRoleConfig
{
    public string Name { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Description { get; set; } = "";
    public bool IsSystemRole { get; set; }
    public string[] Permissions { get; set; } = Array.Empty<string>();
}