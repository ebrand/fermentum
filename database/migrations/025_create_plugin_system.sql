-- Migration: Create Plugin System Tables
-- Description: Implements plugin management and QuickBooks Online integration tables
-- Date: 2025-09-23

-- Plugin Definitions Table
CREATE TABLE IF NOT EXISTS public."Plugin" (
    "PluginId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL,
    "DisplayName" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Version" VARCHAR(20) NOT NULL,
    "Author" VARCHAR(200),
    "Category" VARCHAR(50) NOT NULL, -- Financial, Inventory, CRM, etc.
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "RequiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "AuthType" VARCHAR(50), -- OAuth2, ApiKey, etc.
    "ConfigurationSchema" JSONB, -- JSON schema for plugin configuration
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UQ_Plugin_Name" UNIQUE ("Name")
);

-- Tenant Plugin Installations
CREATE TABLE IF NOT EXISTS public."TenantPlugin" (
    "TenantPluginId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "PluginId" UUID NOT NULL,
    "IsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "Configuration" JSONB, -- Plugin-specific configuration
    "AuthData" JSONB, -- Encrypted authentication data
    "LastSync" TIMESTAMP WITH TIME ZONE,
    "SyncStatus" VARCHAR(50) DEFAULT 'pending', -- pending, syncing, completed, error
    "SyncError" TEXT,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL,
    "UpdatedBy" UUID NOT NULL,

    CONSTRAINT "FK_TenantPlugin_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "FK_TenantPlugin_PluginId" FOREIGN KEY ("PluginId") REFERENCES public."Plugin"("PluginId") ON DELETE CASCADE,
    CONSTRAINT "FK_TenantPlugin_CreatedBy" FOREIGN KEY ("CreatedBy") REFERENCES public."User"("UserId"),
    CONSTRAINT "FK_TenantPlugin_UpdatedBy" FOREIGN KEY ("UpdatedBy") REFERENCES public."User"("UserId"),
    CONSTRAINT "UQ_TenantPlugin_TenantId_PluginId" UNIQUE ("TenantId", "PluginId")
);

-- Plugin Sync History
CREATE TABLE IF NOT EXISTS public."PluginSyncHistory" (
    "SyncHistoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantPluginId" UUID NOT NULL,
    "SyncType" VARCHAR(50) NOT NULL, -- full, incremental, manual
    "Status" VARCHAR(50) NOT NULL, -- started, completed, failed
    "StartTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "EndTime" TIMESTAMP WITH TIME ZONE,
    "RecordsProcessed" INTEGER DEFAULT 0,
    "RecordsInserted" INTEGER DEFAULT 0,
    "RecordsUpdated" INTEGER DEFAULT 0,
    "RecordsSkipped" INTEGER DEFAULT 0,
    "ErrorMessage" TEXT,
    "SyncDetails" JSONB, -- Detailed sync information
    "CreatedBy" UUID NOT NULL,

    CONSTRAINT "FK_PluginSyncHistory_TenantPluginId" FOREIGN KEY ("TenantPluginId") REFERENCES public."TenantPlugin"("TenantPluginId") ON DELETE CASCADE,
    CONSTRAINT "FK_PluginSyncHistory_CreatedBy" FOREIGN KEY ("CreatedBy") REFERENCES public."User"("UserId")
);

-- QuickBooks Online specific tables for financial data
-- Chart of Accounts
CREATE TABLE IF NOT EXISTS public."QBO_Account" (
    "QBOAccountId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "QBOId" VARCHAR(50) NOT NULL, -- QuickBooks ID
    "Name" VARCHAR(200) NOT NULL,
    "FullyQualifiedName" VARCHAR(500),
    "Active" BOOLEAN NOT NULL DEFAULT true,
    "Classification" VARCHAR(50), -- Asset, Liability, Equity, Revenue, Expense
    "AccountType" VARCHAR(50), -- Bank, Accounts Receivable, etc.
    "AccountSubType" VARCHAR(50),
    "CurrentBalance" DECIMAL(15,2) DEFAULT 0,
    "CurrentBalanceWithSubAccounts" DECIMAL(15,2) DEFAULT 0,
    "Currency" VARCHAR(10) DEFAULT 'USD',
    "SyncedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_QBOAccount_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "UQ_QBOAccount_TenantId_QBOId" UNIQUE ("TenantId", "QBOId")
);

-- QuickBooks Customers
CREATE TABLE IF NOT EXISTS public."QBO_Customer" (
    "QBOCustomerId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "QBOId" VARCHAR(50) NOT NULL,
    "Name" VARCHAR(200) NOT NULL,
    "CompanyName" VARCHAR(200),
    "Active" BOOLEAN NOT NULL DEFAULT true,
    "Balance" DECIMAL(15,2) DEFAULT 0,
    "BalanceWithJobs" DECIMAL(15,2) DEFAULT 0,
    "CurrencyRef" VARCHAR(10) DEFAULT 'USD',
    "Email" VARCHAR(200),
    "Phone" VARCHAR(50),
    "Mobile" VARCHAR(50),
    "Fax" VARCHAR(50),
    "Website" VARCHAR(200),
    "BillAddr" JSONB, -- Billing address
    "ShipAddr" JSONB, -- Shipping address
    "SyncedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_QBOCustomer_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "UQ_QBOCustomer_TenantId_QBOId" UNIQUE ("TenantId", "QBOId")
);

-- QuickBooks Items/Products
CREATE TABLE IF NOT EXISTS public."QBO_Item" (
    "QBOItemId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "QBOId" VARCHAR(50) NOT NULL,
    "Name" VARCHAR(200) NOT NULL,
    "FullyQualifiedName" VARCHAR(500),
    "Active" BOOLEAN NOT NULL DEFAULT true,
    "Type" VARCHAR(50), -- Inventory, NonInventory, Service, etc.
    "Description" TEXT,
    "UnitPrice" DECIMAL(10,4),
    "IncomeAccountRef" VARCHAR(50), -- Reference to QBO Account
    "ExpenseAccountRef" VARCHAR(50),
    "AssetAccountRef" VARCHAR(50),
    "SKU" VARCHAR(100),
    "Taxable" BOOLEAN DEFAULT false,
    "SalesTaxCodeRef" VARCHAR(50),
    "PurchaseTaxCodeRef" VARCHAR(50),
    "SyncedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_QBOItem_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "UQ_QBOItem_TenantId_QBOId" UNIQUE ("TenantId", "QBOId")
);

-- QuickBooks Invoices
CREATE TABLE IF NOT EXISTS public."QBO_Invoice" (
    "QBOInvoiceId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "QBOId" VARCHAR(50) NOT NULL,
    "DocNumber" VARCHAR(50),
    "TxnDate" DATE NOT NULL,
    "DueDate" DATE,
    "CustomerRef" VARCHAR(50) NOT NULL, -- Reference to QBO Customer
    "CustomerName" VARCHAR(200),
    "TotalAmt" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "Balance" DECIMAL(15,2) DEFAULT 0,
    "HomeTotalAmt" DECIMAL(15,2) DEFAULT 0,
    "TxnStatus" VARCHAR(50), -- Paid, Unpaid, Overdue, etc.
    "EmailStatus" VARCHAR(50),
    "PrintStatus" VARCHAR(50),
    "SalesTermRef" VARCHAR(50),
    "ShipAddr" JSONB,
    "BillAddr" JSONB,
    "Line" JSONB, -- Invoice line items
    "TxnTaxDetail" JSONB, -- Tax details
    "SyncedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_QBOInvoice_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "UQ_QBOInvoice_TenantId_QBOId" UNIQUE ("TenantId", "QBOId")
);

-- QuickBooks Payments
CREATE TABLE IF NOT EXISTS public."QBO_Payment" (
    "QBOPaymentId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" UUID NOT NULL,
    "QBOId" VARCHAR(50) NOT NULL,
    "TxnDate" DATE NOT NULL,
    "CustomerRef" VARCHAR(50) NOT NULL,
    "CustomerName" VARCHAR(200),
    "TotalAmt" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "UnappliedAmt" DECIMAL(15,2) DEFAULT 0,
    "PaymentMethodRef" VARCHAR(50),
    "PaymentRefNum" VARCHAR(50),
    "DepositToAccountRef" VARCHAR(50),
    "Line" JSONB, -- Payment line items (which invoices were paid)
    "SyncedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FK_QBOPayment_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenant"("TenantId") ON DELETE CASCADE,
    CONSTRAINT "UQ_QBOPayment_TenantId_QBOId" UNIQUE ("TenantId", "QBOId")
);

-- Enable Row Level Security on all plugin tables
ALTER TABLE public."Plugin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TenantPlugin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PluginSyncHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QBO_Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QBO_Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QBO_Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QBO_Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QBO_Payment" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Plugin table is global (no RLS needed for reading)
CREATE POLICY "Allow read plugin definitions" ON public."Plugin"
    FOR SELECT
    USING (true);

-- TenantPlugin - Users can only access plugins for their own tenants
CREATE POLICY "Tenant plugin access" ON public."TenantPlugin"
    FOR ALL
    USING (
        "TenantId" IN (
            SELECT ut."TenantId"
            FROM public."User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

-- Plugin sync history follows tenant access
CREATE POLICY "Plugin sync history access" ON public."PluginSyncHistory"
    FOR ALL
    USING (
        "TenantPluginId" IN (
            SELECT tp."TenantPluginId"
            FROM public."TenantPlugin" tp
            JOIN public."User_Tenant" ut ON tp."TenantId" = ut."TenantId"
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

-- QBO tables - tenant-based access
CREATE POLICY "QBO account access" ON public."QBO_Account"
    FOR ALL
    USING (
        "TenantId" IN (
            SELECT ut."TenantId"
            FROM public."User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

CREATE POLICY "QBO customer access" ON public."QBO_Customer"
    FOR ALL
    USING (
        "TenantId" IN (
            SELECT ut."TenantId"
            FROM public."User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

CREATE POLICY "QBO item access" ON public."QBO_Item"
    FOR ALL
    USING (
        "TenantId" IN (
            SELECT ut."TenantId"
            FROM public."User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

CREATE POLICY "QBO invoice access" ON public."QBO_Invoice"
    FOR ALL
    USING (
        "TenantId" IN (
            SELECT ut."TenantId"
            FROM public."User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

CREATE POLICY "QBO payment access" ON public."QBO_Payment"
    FOR ALL
    USING (
        "TenantId" IN (
            SELECT ut."TenantId"
            FROM public."User_Tenant" ut
            WHERE ut."UserId" = current_setting('app.current_user_id', true)::uuid
            AND ut."IsActive" = true
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IDX_TenantPlugin_TenantId" ON public."TenantPlugin"("TenantId");
CREATE INDEX IF NOT EXISTS "IDX_TenantPlugin_PluginId" ON public."TenantPlugin"("PluginId");
CREATE INDEX IF NOT EXISTS "IDX_TenantPlugin_IsEnabled" ON public."TenantPlugin"("IsEnabled");
CREATE INDEX IF NOT EXISTS "IDX_PluginSyncHistory_TenantPluginId" ON public."PluginSyncHistory"("TenantPluginId");
CREATE INDEX IF NOT EXISTS "IDX_QBOAccount_TenantId" ON public."QBO_Account"("TenantId");
CREATE INDEX IF NOT EXISTS "IDX_QBOCustomer_TenantId" ON public."QBO_Customer"("TenantId");
CREATE INDEX IF NOT EXISTS "IDX_QBOItem_TenantId" ON public."QBO_Item"("TenantId");
CREATE INDEX IF NOT EXISTS "IDX_QBOInvoice_TenantId" ON public."QBO_Invoice"("TenantId");
CREATE INDEX IF NOT EXISTS "IDX_QBOPayment_TenantId" ON public."QBO_Payment"("TenantId");

-- Seed the QuickBooks Online plugin definition
INSERT INTO public."Plugin" (
    "PluginId",
    "Name",
    "DisplayName",
    "Description",
    "Version",
    "Author",
    "Category",
    "RequiresAuth",
    "AuthType",
    "ConfigurationSchema"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'quickbooks-online',
    'QuickBooks Online',
    'Synchronize financial data including accounts, customers, items, invoices, and payments from QuickBooks Online.',
    '1.0.0',
    'Fermentum',
    'Financial',
    true,
    'OAuth2',
    '{
        "type": "object",
        "properties": {
            "syncFrequency": {
                "type": "string",
                "enum": ["manual", "hourly", "daily", "weekly"],
                "default": "daily",
                "title": "Sync Frequency"
            },
            "syncTypes": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["accounts", "customers", "items", "invoices", "payments"]
                },
                "default": ["accounts", "customers", "items", "invoices", "payments"],
                "title": "Data Types to Sync"
            },
            "dateRange": {
                "type": "integer",
                "minimum": 1,
                "maximum": 365,
                "default": 90,
                "title": "Days of Historical Data"
            }
        },
        "required": ["syncFrequency", "syncTypes"]
    }'::jsonb
)
ON CONFLICT ("Name") DO UPDATE SET
    "DisplayName" = EXCLUDED."DisplayName",
    "Description" = EXCLUDED."Description",
    "Version" = EXCLUDED."Version",
    "ConfigurationSchema" = EXCLUDED."ConfigurationSchema",
    "Updated" = CURRENT_TIMESTAMP;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Plugin" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."TenantPlugin" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PluginSyncHistory" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."QBO_Account" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."QBO_Customer" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."QBO_Item" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."QBO_Invoice" TO fermentum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."QBO_Payment" TO fermentum_app;