-- Migration 018: Final Title-case column rename
-- Only renames columns that are currently in snake_case
-- Using quoted identifiers to ensure proper case handling

BEGIN;

-- Drop the foreign key constraint first (it references brewery_id which we're renaming)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_brewery;

-- Breweries table - rename only the snake_case columns
ALTER TABLE breweries RENAME COLUMN brewery_id TO "BreweryId";
ALTER TABLE breweries RENAME COLUMN tenant_id TO "TenantId";
-- Skip 'name' - rename to "Name" for consistency
ALTER TABLE breweries RENAME COLUMN name TO "Name";
ALTER TABLE breweries RENAME COLUMN created_by TO "CreatedBy";
ALTER TABLE breweries RENAME COLUMN modified TO "Modified";
ALTER TABLE breweries RENAME COLUMN modified_by TO "ModifiedBy";

-- Employees table - rename remaining snake_case columns
-- (EmployeeId, TenantId, BreweryId are already correct)
ALTER TABLE employees RENAME COLUMN first_name TO "FirstName";
ALTER TABLE employees RENAME COLUMN last_name TO "LastName";
ALTER TABLE employees RENAME COLUMN is_active TO "IsActive";
ALTER TABLE employees RENAME COLUMN created TO "Created";
ALTER TABLE employees RENAME COLUMN created_by TO "CreatedBy";
ALTER TABLE employees RENAME COLUMN modified TO "Modified";
ALTER TABLE employees RENAME COLUMN modified_by TO "ModifiedBy";

-- Recreate the foreign key constraint with the new column name
ALTER TABLE employees ADD CONSTRAINT fk_employees_brewery
    FOREIGN KEY ("BreweryId") REFERENCES breweries("BreweryId");

COMMIT;