-- Fermentum User Cleanup Script
-- This script removes all records for a specific user across all tables
-- Usage: Replace 'USER_ID_PLACEHOLDER' with the actual User ID

-- IMPORTANT: This script will permanently delete all data for the specified user
-- Make sure you have the correct User ID before running this script

DO $$
DECLARE
    target_user_id UUID := 'USER_ID_PLACEHOLDER'::uuid;
    user_email TEXT;
    tenant_ids UUID[];
    tenant_id UUID;
    deletion_summary TEXT := '';
BEGIN
    -- Verify the user exists and get their email
    SELECT "Email" INTO user_email FROM "User" WHERE "UserId" = target_user_id;

    IF user_email IS NULL THEN
        RAISE NOTICE 'User with ID % not found. Aborting cleanup.', target_user_id;
        RETURN;
    END IF;

    RAISE NOTICE 'Starting cleanup for User: % (ID: %)', user_email, target_user_id;

    -- Get all tenants this user owns (for potential tenant deletion)
    SELECT ARRAY_AGG("TenantId") INTO tenant_ids
    FROM "User_Tenant"
    WHERE "UserId" = target_user_id AND "Role" = 'owner';

    -- Step 1: Delete Invitations created by this user
    DELETE FROM "Invitation" WHERE "CreatedBy" = target_user_id;
    GET DIAGNOSTICS deletion_summary = ROW_COUNT;
    RAISE NOTICE 'Deleted % invitations created by user', deletion_summary;

    -- Step 2: Delete Invitations sent to this user's email
    DELETE FROM "Invitation" WHERE "Email" = user_email;
    GET DIAGNOSTICS deletion_summary = ROW_COUNT;
    RAISE NOTICE 'Deleted % invitations sent to user email', deletion_summary;

    -- Step 3: Delete Employee records for this user
    DELETE FROM "Employee" WHERE "UserId" = target_user_id;
    GET DIAGNOSTICS deletion_summary = ROW_COUNT;
    RAISE NOTICE 'Deleted % employee records', deletion_summary;

    -- Step 4: Delete User_Tenant relationships
    DELETE FROM "User_Tenant" WHERE "UserId" = target_user_id;
    GET DIAGNOSTICS deletion_summary = ROW_COUNT;
    RAISE NOTICE 'Deleted % user-tenant relationships', deletion_summary;

    -- Step 5: Delete Tenant_PaymentMethod relationships for user's tenants
    IF tenant_ids IS NOT NULL THEN
        FOREACH tenant_id IN ARRAY tenant_ids LOOP
            DELETE FROM "Tenant_PaymentMethod" WHERE "TenantId" = tenant_id;
            GET DIAGNOSTICS deletion_summary = ROW_COUNT;
            RAISE NOTICE 'Deleted % payment methods for tenant %', deletion_summary, tenant_id;
        END LOOP;
    END IF;

    -- Step 6: Delete Breweries owned by user's tenants
    IF tenant_ids IS NOT NULL THEN
        FOREACH tenant_id IN ARRAY tenant_ids LOOP
            DELETE FROM "Brewery" WHERE "TenantId" = tenant_id;
            GET DIAGNOSTICS deletion_summary = ROW_COUNT;
            RAISE NOTICE 'Deleted % breweries for tenant %', deletion_summary, tenant_id;
        END LOOP;
    END IF;

    -- Step 7: Delete Roles for user's tenants
    IF tenant_ids IS NOT NULL THEN
        FOREACH tenant_id IN ARRAY tenant_ids LOOP
            DELETE FROM "Role" WHERE "TenantId" = tenant_id;
            GET DIAGNOSTICS deletion_summary = ROW_COUNT;
            RAISE NOTICE 'Deleted % roles for tenant %', deletion_summary, tenant_id;
        END LOOP;
    END IF;

    -- Step 8: Delete Tenants owned by this user
    IF tenant_ids IS NOT NULL THEN
        FOREACH tenant_id IN ARRAY tenant_ids LOOP
            DELETE FROM "Tenant" WHERE "TenantId" = tenant_id;
            GET DIAGNOSTICS deletion_summary = ROW_COUNT;
            RAISE NOTICE 'Deleted % tenant records for tenant %', deletion_summary, tenant_id;
        END LOOP;
    END IF;

    -- Step 9: Finally, delete the User record
    DELETE FROM "User" WHERE "UserId" = target_user_id;
    GET DIAGNOSTICS deletion_summary = ROW_COUNT;
    RAISE NOTICE 'Deleted % user records', deletion_summary;

    RAISE NOTICE 'Cleanup completed for user: % (ID: %)', user_email, target_user_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during cleanup: %', SQLERRM;
        RAISE;
END $$;