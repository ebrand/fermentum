-- Migration 015: Standardize all column names to Title-case for EF consistency
-- This migration renames all snake_case columns to Title-case to match Entity Framework models

BEGIN;

-- Breweries table
ALTER TABLE breweries RENAME COLUMN brewery_id TO BreweryId;
ALTER TABLE breweries RENAME COLUMN tenant_id TO TenantId;
ALTER TABLE breweries RENAME COLUMN name TO Name;
ALTER TABLE breweries RENAME COLUMN created TO Created;
ALTER TABLE breweries RENAME COLUMN created_by TO CreatedBy;
ALTER TABLE breweries RENAME COLUMN modified TO Modified;
ALTER TABLE breweries RENAME COLUMN modified_by TO ModifiedBy;

-- Employees table (some columns already Title-case)
ALTER TABLE employees RENAME COLUMN employee_number TO EmployeeNumber;
ALTER TABLE employees RENAME COLUMN first_name TO FirstName;
ALTER TABLE employees RENAME COLUMN last_name TO LastName;
ALTER TABLE employees RENAME COLUMN is_active TO IsActive;
ALTER TABLE employees RENAME COLUMN created TO Created;
ALTER TABLE employees RENAME COLUMN created_by TO CreatedBy;
ALTER TABLE employees RENAME COLUMN modified TO Modified;
ALTER TABLE employees RENAME COLUMN modified_by TO ModifiedBy;

-- Users table
ALTER TABLE users RENAME COLUMN id TO Id;
ALTER TABLE users RENAME COLUMN stytch_user_id TO StytchUserId;
ALTER TABLE users RENAME COLUMN email TO Email;
ALTER TABLE users RENAME COLUMN email_verified TO EmailVerified;
ALTER TABLE users RENAME COLUMN first_name TO FirstName;
ALTER TABLE users RENAME COLUMN last_name TO LastName;
ALTER TABLE users RENAME COLUMN display_name TO DisplayName;
ALTER TABLE users RENAME COLUMN avatar_url TO AvatarUrl;
ALTER TABLE users RENAME COLUMN phone TO Phone;
ALTER TABLE users RENAME COLUMN is_system_admin TO IsSystemAdmin;
ALTER TABLE users RENAME COLUMN last_login_at TO LastLoginAt;
ALTER TABLE users RENAME COLUMN password_changed_at TO PasswordChangedAt;
ALTER TABLE users RENAME COLUMN created_at TO CreatedAt;
ALTER TABLE users RENAME COLUMN updated_at TO UpdatedAt;
ALTER TABLE users RENAME COLUMN is_active TO IsActive;
ALTER TABLE users RENAME COLUMN role TO Role;
ALTER TABLE users RENAME COLUMN address TO Address;
ALTER TABLE users RENAME COLUMN city TO City;
ALTER TABLE users RENAME COLUMN state TO State;
ALTER TABLE users RENAME COLUMN zip_code TO ZipCode;

-- Tenants table
ALTER TABLE tenants RENAME COLUMN id TO Id;
ALTER TABLE tenants RENAME COLUMN name TO Name;
ALTER TABLE tenants RENAME COLUMN slug TO Slug;
ALTER TABLE tenants RENAME COLUMN subdomain TO Subdomain;
ALTER TABLE tenants RENAME COLUMN domain TO Domain;
ALTER TABLE tenants RENAME COLUMN plan_type TO PlanType;
ALTER TABLE tenants RENAME COLUMN subscription_status TO SubscriptionStatus;
ALTER TABLE tenants RENAME COLUMN billing_email TO BillingEmail;
ALTER TABLE tenants RENAME COLUMN database_name TO DatabaseName;
ALTER TABLE tenants RENAME COLUMN timezone TO Timezone;
ALTER TABLE tenants RENAME COLUMN locale TO Locale;
ALTER TABLE tenants RENAME COLUMN features TO Features;
ALTER TABLE tenants RENAME COLUMN settings TO Settings;
ALTER TABLE tenants RENAME COLUMN created_at TO CreatedAt;
ALTER TABLE tenants RENAME COLUMN updated_at TO UpdatedAt;
ALTER TABLE tenants RENAME COLUMN created_by TO CreatedBy;
ALTER TABLE tenants RENAME COLUMN is_active TO IsActive;
ALTER TABLE tenants RENAME COLUMN stripe_customer_id TO StripeCustomerId;
ALTER TABLE tenants RENAME COLUMN stripe_subscription_id TO StripeSubscriptionId;
ALTER TABLE tenants RENAME COLUMN stripe_price_id TO StripePriceId;
ALTER TABLE tenants RENAME COLUMN stripe_payment_method_id TO StripePaymentMethodId;
ALTER TABLE tenants RENAME COLUMN stripe_subscription_status TO StripeSubscriptionStatus;
ALTER TABLE tenants RENAME COLUMN current_period_start TO CurrentPeriodStart;
ALTER TABLE tenants RENAME COLUMN current_period_end TO CurrentPeriodEnd;
ALTER TABLE tenants RENAME COLUMN trial_end TO TrialEnd;
ALTER TABLE tenants RENAME COLUMN cancel_at_period_end TO CancelAtPeriodEnd;

-- Tenant Users table
ALTER TABLE tenant_users RENAME COLUMN id TO Id;
ALTER TABLE tenant_users RENAME COLUMN tenant_id TO TenantId;
ALTER TABLE tenant_users RENAME COLUMN user_id TO UserId;
ALTER TABLE tenant_users RENAME COLUMN role TO Role;
ALTER TABLE tenant_users RENAME COLUMN permissions TO Permissions;
ALTER TABLE tenant_users RENAME COLUMN status TO Status;
ALTER TABLE tenant_users RENAME COLUMN invited_by TO InvitedBy;
ALTER TABLE tenant_users RENAME COLUMN invited_at TO InvitedAt;
ALTER TABLE tenant_users RENAME COLUMN joined_at TO JoinedAt;
ALTER TABLE tenant_users RENAME COLUMN created_at TO CreatedAt;
ALTER TABLE tenant_users RENAME COLUMN updated_at TO UpdatedAt;
ALTER TABLE tenant_users RENAME COLUMN tenant_role_id TO TenantRoleId;

-- Tenant Roles table
ALTER TABLE tenant_roles RENAME COLUMN id TO Id;
ALTER TABLE tenant_roles RENAME COLUMN tenant_id TO TenantId;
ALTER TABLE tenant_roles RENAME COLUMN name TO Name;
ALTER TABLE tenant_roles RENAME COLUMN display_name TO DisplayName;
ALTER TABLE tenant_roles RENAME COLUMN description TO Description;
ALTER TABLE tenant_roles RENAME COLUMN permissions TO Permissions;
ALTER TABLE tenant_roles RENAME COLUMN is_system_role TO IsSystemRole;
ALTER TABLE tenant_roles RENAME COLUMN created_at TO CreatedAt;
ALTER TABLE tenant_roles RENAME COLUMN updated_at TO UpdatedAt;
ALTER TABLE tenant_roles RENAME COLUMN role_code TO RoleCode;
ALTER TABLE tenant_roles RENAME COLUMN level TO Level;
ALTER TABLE tenant_roles RENAME COLUMN is_active TO IsActive;

-- Audit Logs table
ALTER TABLE audit_logs RENAME COLUMN id TO Id;
ALTER TABLE audit_logs RENAME COLUMN tenant_id TO TenantId;
ALTER TABLE audit_logs RENAME COLUMN user_id TO UserId;
ALTER TABLE audit_logs RENAME COLUMN action TO Action;
ALTER TABLE audit_logs RENAME COLUMN resource_type TO ResourceType;
ALTER TABLE audit_logs RENAME COLUMN resource_id TO ResourceId;
ALTER TABLE audit_logs RENAME COLUMN ip_address TO IpAddress;
ALTER TABLE audit_logs RENAME COLUMN user_agent TO UserAgent;
ALTER TABLE audit_logs RENAME COLUMN request_id TO RequestId;
ALTER TABLE audit_logs RENAME COLUMN old_values TO OldValues;
ALTER TABLE audit_logs RENAME COLUMN new_values TO NewValues;
ALTER TABLE audit_logs RENAME COLUMN metadata TO Metadata;
ALTER TABLE audit_logs RENAME COLUMN created_at TO CreatedAt;

-- User Payment Methods table
ALTER TABLE user_payment_methods RENAME COLUMN id TO Id;
ALTER TABLE user_payment_methods RENAME COLUMN user_id TO UserId;
ALTER TABLE user_payment_methods RENAME COLUMN stripe_customer_id TO StripeCustomerId;
ALTER TABLE user_payment_methods RENAME COLUMN stripe_payment_method_id TO StripePaymentMethodId;
ALTER TABLE user_payment_methods RENAME COLUMN payment_method_type TO PaymentMethodType;
ALTER TABLE user_payment_methods RENAME COLUMN card_brand TO CardBrand;
ALTER TABLE user_payment_methods RENAME COLUMN card_last4 TO CardLast4;
ALTER TABLE user_payment_methods RENAME COLUMN card_exp_month TO CardExpMonth;
ALTER TABLE user_payment_methods RENAME COLUMN card_exp_year TO CardExpYear;
ALTER TABLE user_payment_methods RENAME COLUMN is_default TO IsDefault;
ALTER TABLE user_payment_methods RENAME COLUMN is_active TO IsActive;
ALTER TABLE user_payment_methods RENAME COLUMN created_at TO CreatedAt;
ALTER TABLE user_payment_methods RENAME COLUMN updated_at TO UpdatedAt;

-- User Subscriptions table
ALTER TABLE user_subscriptions RENAME COLUMN id TO Id;
ALTER TABLE user_subscriptions RENAME COLUMN user_id TO UserId;
ALTER TABLE user_subscriptions RENAME COLUMN tenant_id TO TenantId;
ALTER TABLE user_subscriptions RENAME COLUMN stripe_subscription_id TO StripeSubscriptionId;
ALTER TABLE user_subscriptions RENAME COLUMN stripe_price_id TO StripePriceId;
ALTER TABLE user_subscriptions RENAME COLUMN plan_type TO PlanType;
ALTER TABLE user_subscriptions RENAME COLUMN subscription_status TO SubscriptionStatus;
ALTER TABLE user_subscriptions RENAME COLUMN current_period_start TO CurrentPeriodStart;
ALTER TABLE user_subscriptions RENAME COLUMN current_period_end TO CurrentPeriodEnd;
ALTER TABLE user_subscriptions RENAME COLUMN trial_end TO TrialEnd;
ALTER TABLE user_subscriptions RENAME COLUMN cancel_at_period_end TO CancelAtPeriodEnd;
ALTER TABLE user_subscriptions RENAME COLUMN canceled_at TO CanceledAt;
ALTER TABLE user_subscriptions RENAME COLUMN created_at TO CreatedAt;
ALTER TABLE user_subscriptions RENAME COLUMN updated_at TO UpdatedAt;

COMMIT;