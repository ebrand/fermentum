-- Migration 017: Rename specific remaining snake_case columns to Title-case
-- Only rename columns that actually exist and need renaming

BEGIN;

-- Breweries table
ALTER TABLE breweries RENAME COLUMN brewery_id TO BreweryId;
ALTER TABLE breweries RENAME COLUMN tenant_id TO TenantId;
-- Skip 'name' as it's already correct case
-- Skip created/created_by/modified/modified_by - they seem to be already correct

-- Employees table - only rename the remaining snake_case columns
ALTER TABLE employees RENAME COLUMN employee_number TO EmployeeNumber;
ALTER TABLE employees RENAME COLUMN first_name TO FirstName;
ALTER TABLE employees RENAME COLUMN last_name TO LastName;
ALTER TABLE employees RENAME COLUMN is_active TO IsActive;
ALTER TABLE employees RENAME COLUMN created TO Created;
ALTER TABLE employees RENAME COLUMN created_by TO CreatedBy;
ALTER TABLE employees RENAME COLUMN modified TO Modified;
ALTER TABLE employees RENAME COLUMN modified_by TO ModifiedBy;

COMMIT;