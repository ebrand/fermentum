# Fermentum Scripts

This directory contains utility scripts for managing the Fermentum application.

## User Cleanup Scripts

### Overview

These scripts allow you to completely remove a user and all their associated data from the database. This is useful for:
- Testing scenarios where you need a fresh start
- Development cleanup
- User account deletion requests

### Scripts Available

#### 1. Interactive Bash Script (Recommended)

**Location**: `bash/cleanup_user.sh`

**Usage**:
```bash
# Cleanup by email
./scripts/bash/cleanup_user.sh eric.d.brand@gmail.com

# Cleanup by User ID
./scripts/bash/cleanup_user.sh 56a7427b-87e8-4af6-ba31-2aef83228956

# Show help
./scripts/bash/cleanup_user.sh --help
```

**Features**:
- Interactive confirmation before deletion
- Shows preview of what will be deleted
- Colored output for better readability
- Accepts either email or User ID
- Comprehensive error handling
- Environment variable configuration

#### 2. SQL Script (Advanced Users)

**Location**: `sql/cleanup_user.sql`

**Usage**:
```bash
# 1. Edit the script and replace 'USER_ID_PLACEHOLDER' with actual UUID
# 2. Run with psql
PGPASSWORD=dev_password_123 psql -h localhost -U fermentum -d fermentum -f scripts/sql/cleanup_user.sql
```

**Features**:
- Detailed logging of each deletion step
- PostgreSQL stored procedure format
- Exception handling
- Step-by-step deletion summary

#### 3. Quick SQL Script (One-liner)

**Location**: `sql/quick_cleanup_user.sql`

**Usage**:
```bash
# 1. Edit the script and replace 'USER_EMAIL_PLACEHOLDER' with actual email
# 2. Run with psql
PGPASSWORD=dev_password_123 psql -h localhost -U fermentum -d fermentum -f scripts/sql/quick_cleanup_user.sql
```

### What Gets Deleted

When you run any of these cleanup scripts, the following data is permanently removed:

1. **Invitations**
   - Invitations created by the user
   - Invitations sent to the user's email

2. **Employee Records**
   - All employee records where the user is linked

3. **User-Tenant Relationships**
   - All tenant memberships for the user

4. **Owned Tenant Data** (if user is owner):
   - Payment methods linked to owned tenants
   - Breweries within owned tenants
   - Roles within owned tenants
   - The tenant records themselves

5. **User Record**
   - The user's account record

### Safety Features

- **Foreign Key Respect**: Deletions happen in the correct order to respect database constraints
- **Transaction Safety**: Operations are wrapped in transactions
- **Confirmation Required**: Interactive script requires explicit confirmation
- **Preview Mode**: Shows what will be deleted before proceeding
- **Error Handling**: Comprehensive error messages and rollback on failure

### Environment Variables

You can customize database connection settings:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=fermentum
export DB_USER=fermentum
export DB_PASSWORD=dev_password_123
```

### Examples

#### Example 1: Clean up test user
```bash
./scripts/bash/cleanup_user.sh ebrandtestuser@gmail.com
```

#### Example 2: Clean up by UUID
```bash
./scripts/bash/cleanup_user.sh 0c83c872-b85a-4c6f-a3bc-68964a491068
```

#### Example 3: Preview what would be deleted
The interactive script always shows a preview before asking for confirmation.

### Common Use Cases

#### Fresh Development Environment
```bash
# Clean up your development user to start fresh
./scripts/bash/cleanup_user.sh your.email@example.com
```

#### Testing Onboarding Flow
```bash
# Remove test user created during onboarding tests
./scripts/bash/cleanup_user.sh test.user@example.com
```

#### User Account Deletion
```bash
# Remove a user account and all associated data
./scripts/bash/cleanup_user.sh user.to.delete@example.com
```

### Important Notes

⚠️ **WARNING**: These scripts permanently delete data. There is no undo operation.

✅ **Best Practices**:
- Always test on development data first
- Have database backups before running in production
- Use the interactive script for safety
- Verify the user email/ID before running

🔒 **Security**:
- Scripts use environment variables for database credentials
- No credentials are hardcoded (except defaults for development)
- Database connections use standard PostgreSQL authentication

### Troubleshooting

#### Script not executable
```bash
chmod +x scripts/bash/cleanup_user.sh
```

#### Database connection issues
Check your environment variables and database status:
```bash
echo $DB_PASSWORD
pg_isready -h localhost -p 5432
```

#### User not found
Verify the user exists:
```bash
PGPASSWORD=dev_password_123 psql -h localhost -U fermentum -d fermentum -c "SELECT \"UserId\", \"Email\" FROM \"User\";"
```

---

## Other Scripts

### Structure

```
scripts/
├── bash/              # Shell scripts for automation
├── sql/               # Database queries and analysis
├── python/            # Data analysis and processing
├── javascript/        # Data manipulation and API testing
└── data-analysis/     # Research scripts and notebooks
```

### Usage Guidelines

#### Naming Conventions
- Use descriptive names: `analyze_brewery_production.sql`
- Include date for one-off analysis: `brewery_export_2024-09-18.py`
- Use prefixes for categories: `etl_import_recipes.js`

#### Documentation
- Include header comments explaining purpose
- Document required parameters/environment variables
- Add usage examples