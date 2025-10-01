-- Migration 016: Rename only the remaining snake_case columns to Title-case
-- Focus on columns that haven't been renamed yet

BEGIN;

-- Breweries table (only the columns that need renaming)
ALTER TABLE breweries RENAME COLUMN brewery_id TO BreweryId;
ALTER TABLE breweries RENAME COLUMN tenant_id TO TenantId;
-- name is already correct case
ALTER TABLE breweries RENAME COLUMN created TO Created;
ALTER TABLE breweries RENAME COLUMN created_by TO CreatedBy;
ALTER TABLE breweries RENAME COLUMN modified TO Modified;
ALTER TABLE breweries RENAME COLUMN modified_by TO ModifiedBy;

-- Employees table (only the remaining snake_case columns)
-- EmployeeId, TenantId, BreweryId are already correct
ALTER TABLE employees RENAME COLUMN employee_number TO EmployeeNumber;
ALTER TABLE employees RENAME COLUMN first_name TO FirstName;
ALTER TABLE employees RENAME COLUMN last_name TO LastName;
ALTER TABLE employees RENAME COLUMN is_active TO IsActive;
ALTER TABLE employees RENAME COLUMN created TO Created;
ALTER TABLE employees RENAME COLUMN created_by TO CreatedBy;
ALTER TABLE employees RENAME COLUMN modified TO Modified;
ALTER TABLE employees RENAME COLUMN modified_by TO ModifiedBy;

COMMIT;