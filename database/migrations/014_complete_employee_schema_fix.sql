-- Complete the employees table schema fix to match Entity Framework Employee model
-- This migration adds all missing columns that the Employee model expects

-- Add all missing columns
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS job_title VARCHAR(150),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS termination_date DATE,
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS salary_annual DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS security_clearance VARCHAR(50),
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS modified_by UUID;

-- Set default values for existing records
UPDATE employees SET
    employment_status = 'active',
    access_level = 'standard',
    hire_date = '2020-01-01',
    modified = CURRENT_TIMESTAMP
WHERE employment_status IS NULL;

-- Generate employee numbers for existing records
UPDATE employees SET
    employee_number = 'EMP' || LPAD(employee_id::TEXT, 3, '0')
WHERE employee_number IS NULL;

-- Add audit trigger for the modified column
DROP TRIGGER IF EXISTS update_employees_modified ON employees;
CREATE TRIGGER update_employees_modified
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);