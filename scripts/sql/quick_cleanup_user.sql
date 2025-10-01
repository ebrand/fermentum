-- Quick User Cleanup - One-liner version
-- Replace the email/UUID in the WHERE clause below

-- EXAMPLE USAGE:
-- For email: WHERE u."Email" = 'eric.d.brand@gmail.com'
-- For UUID:  WHERE u."UserId" = '56a7427b-87e8-4af6-ba31-2aef83228956'

WITH user_to_delete AS (
    SELECT "UserId", "Email" FROM "User" WHERE "Email" = 'USER_EMAIL_PLACEHOLDER'
),
owned_tenants AS (
    SELECT DISTINCT ut."TenantId"
    FROM "User_Tenant" ut
    JOIN user_to_delete u ON ut."UserId" = u."UserId"
    WHERE ut."Role" = 'owner'
)
-- Delete in order of dependencies (reverse foreign key order)
DELETE FROM "Invitation" WHERE "CreatedBy" IN (SELECT "UserId" FROM user_to_delete)
    OR "Email" IN (SELECT "Email" FROM user_to_delete);

DELETE FROM "Employee" WHERE "UserId" IN (SELECT "UserId" FROM user_to_delete);

DELETE FROM "User_Tenant" WHERE "UserId" IN (SELECT "UserId" FROM user_to_delete);

DELETE FROM "Tenant_PaymentMethod" WHERE "TenantId" IN (SELECT "TenantId" FROM owned_tenants);

DELETE FROM "Brewery" WHERE "TenantId" IN (SELECT "TenantId" FROM owned_tenants);

DELETE FROM "Role" WHERE "TenantId" IN (SELECT "TenantId" FROM owned_tenants);

DELETE FROM "Tenant" WHERE "TenantId" IN (SELECT "TenantId" FROM owned_tenants);

DELETE FROM "User" WHERE "UserId" IN (SELECT "UserId" FROM user_to_delete);