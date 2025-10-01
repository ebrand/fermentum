namespace Fermentum.Auth.Models;

public static class TenantPermissions
{
    // Core System Access
    public const string AccessDashboard = "access_dashboard";
    public const string ViewTenantSettings = "view_tenant_settings";
    public const string ManageTenantSettings = "manage_tenant_settings";
    public const string ManageUsers = "manage_users";
    public const string ManageRoles = "manage_roles";
    public const string ViewBilling = "view_billing";
    public const string ManageBilling = "manage_billing";

    // Production Management
    public const string ViewProduction = "view_production";
    public const string ManageProduction = "manage_production";
    public const string ViewRecipes = "view_recipes";
    public const string ManageRecipes = "manage_recipes";
    public const string ViewBatches = "view_batches";
    public const string ManageBatches = "manage_batches";
    public const string ViewQualityControl = "view_quality_control";
    public const string ManageQualityControl = "manage_quality_control";

    // Inventory Management
    public const string ViewInventory = "view_inventory";
    public const string ManageInventory = "manage_inventory";
    public const string ViewIngredients = "view_ingredients";
    public const string ManageIngredients = "manage_ingredients";
    public const string ViewPackaging = "view_packaging";
    public const string ManagePackaging = "manage_packaging";
    public const string ViewEquipment = "view_equipment";
    public const string ManageEquipment = "manage_equipment";

    // Sales & Distribution
    public const string ViewSales = "view_sales";
    public const string ManageSales = "manage_sales";
    public const string ViewOrders = "view_orders";
    public const string ManageOrders = "manage_orders";
    public const string ViewCustomers = "view_customers";
    public const string ManageCustomers = "manage_customers";
    public const string ViewDistribution = "view_distribution";
    public const string ManageDistribution = "manage_distribution";

    // Financial & Reporting
    public const string ViewFinancials = "view_financials";
    public const string ManageFinancials = "manage_financials";
    public const string ViewReports = "view_reports";
    public const string ManageReports = "manage_reports";
    public const string ViewAnalytics = "view_analytics";
    public const string ExportData = "export_data";

    // Compliance & Documentation
    public const string ViewCompliance = "view_compliance";
    public const string ManageCompliance = "manage_compliance";
    public const string ViewDocumentation = "view_documentation";
    public const string ManageDocumentation = "manage_documentation";
    public const string ViewAudits = "view_audits";
    public const string ManageAudits = "manage_audits";

    // Advanced Features
    public const string ViewIntegrations = "view_integrations";
    public const string ManageIntegrations = "manage_integrations";
    public const string ViewLogs = "view_logs";
    public const string ManageLogs = "manage_logs";
    public const string ViewAPI = "view_api";
    public const string ManageAPI = "manage_api";

    public static readonly Dictionary<string, string> PermissionDescriptions = new()
    {
        // Core System Access
        { AccessDashboard, "Access main dashboard and system overview" },
        { ViewTenantSettings, "View brewery settings and configuration" },
        { ManageTenantSettings, "Modify brewery settings and configuration" },
        { ManageUsers, "Add, edit, and remove users" },
        { ManageRoles, "Create and modify custom roles" },
        { ViewBilling, "View billing information and invoices" },
        { ManageBilling, "Manage payment methods and billing settings" },

        // Production Management
        { ViewProduction, "View production schedules and status" },
        { ManageProduction, "Create and modify production schedules" },
        { ViewRecipes, "View beer recipes and formulations" },
        { ManageRecipes, "Create and modify beer recipes" },
        { ViewBatches, "View batch information and brewing logs" },
        { ManageBatches, "Create and update batch records" },
        { ViewQualityControl, "View QC tests and results" },
        { ManageQualityControl, "Record and manage QC tests" },

        // Inventory Management
        { ViewInventory, "View inventory levels and status" },
        { ManageInventory, "Update inventory and manage stock" },
        { ViewIngredients, "View ingredient inventory and suppliers" },
        { ManageIngredients, "Manage ingredient orders and suppliers" },
        { ViewPackaging, "View packaging materials and inventory" },
        { ManagePackaging, "Manage packaging inventory and orders" },
        { ViewEquipment, "View equipment status and maintenance" },
        { ManageEquipment, "Manage equipment and maintenance schedules" },

        // Sales & Distribution
        { ViewSales, "View sales data and performance" },
        { ManageSales, "Create and manage sales transactions" },
        { ViewOrders, "View customer orders and fulfillment" },
        { ManageOrders, "Process and manage customer orders" },
        { ViewCustomers, "View customer information and history" },
        { ManageCustomers, "Add and modify customer records" },
        { ViewDistribution, "View distribution schedules and routes" },
        { ManageDistribution, "Manage distribution and logistics" },

        // Financial & Reporting
        { ViewFinancials, "View financial reports and data" },
        { ManageFinancials, "Manage financial records and accounting" },
        { ViewReports, "Access standard reports and dashboards" },
        { ManageReports, "Create custom reports and configure dashboards" },
        { ViewAnalytics, "View analytics and business intelligence" },
        { ExportData, "Export data and reports" },

        // Compliance & Documentation
        { ViewCompliance, "View compliance status and requirements" },
        { ManageCompliance, "Manage compliance documentation and processes" },
        { ViewDocumentation, "Access standard operating procedures" },
        { ManageDocumentation, "Create and modify documentation" },
        { ViewAudits, "View audit trails and history" },
        { ManageAudits, "Conduct audits and manage audit processes" },

        // Advanced Features
        { ViewIntegrations, "View connected systems and integrations" },
        { ManageIntegrations, "Configure and manage system integrations" },
        { ViewLogs, "View system logs and activity" },
        { ManageLogs, "Configure logging and audit settings" },
        { ViewAPI, "View API documentation and usage" },
        { ManageAPI, "Configure API access and keys" }
    };

    public static readonly Dictionary<string, string[]> PermissionCategories = new()
    {
        { "Core System", new[] { AccessDashboard, ViewTenantSettings, ManageTenantSettings, ManageUsers, ManageRoles, ViewBilling, ManageBilling } },
        { "Production", new[] { ViewProduction, ManageProduction, ViewRecipes, ManageRecipes, ViewBatches, ManageBatches, ViewQualityControl, ManageQualityControl } },
        { "Inventory", new[] { ViewInventory, ManageInventory, ViewIngredients, ManageIngredients, ViewPackaging, ManagePackaging, ViewEquipment, ManageEquipment } },
        { "Sales & Distribution", new[] { ViewSales, ManageSales, ViewOrders, ManageOrders, ViewCustomers, ManageCustomers, ViewDistribution, ManageDistribution } },
        { "Financial & Reporting", new[] { ViewFinancials, ManageFinancials, ViewReports, ManageReports, ViewAnalytics, ExportData } },
        { "Compliance", new[] { ViewCompliance, ManageCompliance, ViewDocumentation, ManageDocumentation, ViewAudits, ManageAudits } },
        { "Advanced", new[] { ViewIntegrations, ManageIntegrations, ViewLogs, ManageLogs, ViewAPI, ManageAPI } }
    };
}